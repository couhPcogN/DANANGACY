from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError, EmailAlreadyRegisteredError
from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.reward import Wallet
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileUpdate,
    UserRead,
)


class AuthService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = UserRepository(session)
        self.settings = get_settings()

    def register(self, payload: RegisterRequest) -> TokenResponse:
        email_clean = payload.email.lower().strip()
        with self.session.begin():
            existing = self.repository.get_by_email(email_clean)
            if existing is not None:
                raise EmailAlreadyRegisteredError()

            uid = f"usr_{uuid4().hex[:16]}"
            user = User(
                uid=uid,
                display_name=payload.display_name,
                email=email_clean,
                phone=payload.phone,
                password_hash=hash_password(payload.password),
                status="ACTIVE",
            )
            self.repository.add(user)
            self.session.flush()
            self.session.add(Wallet(user_uid=uid, balance_points=0))
            self.session.flush()
            user_read = UserRead.model_validate(user)

        token = create_access_token(uid, self.settings)
        return TokenResponse(access_token=token, token_type="bearer", user=user_read)

    def login(self, payload: LoginRequest) -> TokenResponse:
        email_clean = payload.email.lower().strip()
        user = self.repository.get_by_email(email_clean)

        if user is None:
            # Timing mitigation
            verify_password(payload.password, DUMMY_PASSWORD_HASH)
            raise AuthenticationError("Email hoặc mật khẩu không chính xác.")

        if user.status != "ACTIVE":
            raise AuthenticationError("Tài khoản đã bị tạm khóa.")

        if not verify_password(payload.password, user.password_hash):
            raise AuthenticationError("Email hoặc mật khẩu không chính xác.")

        token = create_access_token(user.uid, self.settings)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserRead.model_validate(user),
        )

    def get_profile(self, uid: str) -> UserRead:
        user = self.repository.get(uid)
        if user is None:
            raise AuthenticationError("Tài khoản không tồn tại.")
        return UserRead.model_validate(user)

    def update_profile(self, uid: str, payload: UserProfileUpdate) -> UserRead:
        with self.session.begin():
            user = self.repository.get(uid)
            if user is None:
                raise AuthenticationError("Tài khoản không tồn tại.")

            changes = payload.model_dump(exclude_unset=True)
            for field, val in changes.items():
                if val is not None:
                    setattr(user, field, val)

            self.session.flush()
            self.session.refresh(user)
            result = UserRead.model_validate(user)
        return result
