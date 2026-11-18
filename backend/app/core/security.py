"""Password hashing and HS256 access tokens using only the Python standard library.

No third-party auth package is a project dependency yet, so this module keeps the
format small and explicit: scrypt password hashes and signed JWT-compatible tokens.
"""

import base64
import binascii
import hashlib
import hmac
import json
import logging
import secrets
import time
from functools import lru_cache

from app.core.config import Settings
from app.core.exceptions import AuthenticationError

logger = logging.getLogger(__name__)

SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 32
TOKEN_TYPE = "access"


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_DKLEN,
    )
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False
    try:
        algorithm, n, r, p, salt, digest = stored_hash.split("$")
        if algorithm != "scrypt":
            return False
        expected = _b64decode(digest)
        candidate = hashlib.scrypt(
            password.encode("utf-8"),
            salt=_b64decode(salt),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
        )
    except (ValueError, binascii.Error):
        return False
    return hmac.compare_digest(candidate, expected)


# Verifying against this hash for unknown emails keeps login timing similar.
DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(16))


@lru_cache
def _ephemeral_secret() -> str:
    logger.warning("JWT_SECRET_KEY is not set; tokens will be invalid after a restart.")
    return secrets.token_urlsafe(48)


def signing_secret(settings: Settings) -> bytes:
    configured = settings.jwt_secret_key.get_secret_value()
    return (configured or _ephemeral_secret()).encode("utf-8")


def _sign(signing_input: str, secret: bytes) -> bytes:
    return hmac.new(secret, signing_input.encode("ascii"), hashlib.sha256).digest()


def create_access_token(subject: str, settings: Settings, *, now: int | None = None) -> str:
    issued_at = int(time.time()) if now is None else now
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": subject,
        "iat": issued_at,
        "exp": issued_at + settings.access_token_expire_minutes * 60,
        "type": TOKEN_TYPE,
    }
    signing_input = ".".join(
        _b64encode(json.dumps(part, separators=(",", ":")).encode("utf-8"))
        for part in (header, payload)
    )
    return f"{signing_input}.{_b64encode(_sign(signing_input, signing_secret(settings)))}"


def decode_access_token(token: str, settings: Settings, *, now: int | None = None) -> str:
    """Return the token subject, or raise AuthenticationError for any invalid token."""
    invalid = AuthenticationError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.")
    parts = token.split(".")
    if len(parts) != 3:
        raise invalid
    header_part, payload_part, signature_part = parts
    try:
        signature = _b64decode(signature_part)
        expected = _sign(f"{header_part}.{payload_part}", signing_secret(settings))
        if not hmac.compare_digest(signature, expected):
            raise invalid
        header = json.loads(_b64decode(header_part))
        payload = json.loads(_b64decode(payload_part))
    except (ValueError, binascii.Error, UnicodeError) as exc:
        raise invalid from exc
    if not isinstance(header, dict) or header.get("alg") != "HS256":
        raise invalid
    if not isinstance(payload, dict) or payload.get("type") != TOKEN_TYPE:
        raise invalid
    subject, expires_at = payload.get("sub"), payload.get("exp")
    current = int(time.time()) if now is None else now
    if not isinstance(subject, str) or not subject:
        raise invalid
    if not isinstance(expires_at, int) or expires_at <= current:
        raise invalid
    return subject
