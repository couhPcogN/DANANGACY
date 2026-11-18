from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_auth_service, get_authenticated_user_uid
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileUpdate,
    UserRead,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])
Service = Annotated[AuthService, Depends(get_auth_service)]
UserUid = Annotated[str, Depends(get_authenticated_user_uid)]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, service: Service) -> TokenResponse:
    """Đăng ký tài khoản người dùng mới và trả về access token."""
    return service.register(payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, service: Service) -> TokenResponse:
    """Đăng nhập bằng email và mật khẩu, trả về access token."""
    return service.login(payload)


@router.get("/me", response_model=UserRead)
def get_current_user_profile(uid: UserUid, service: Service) -> UserRead:
    """Lấy thông tin tài khoản đang đăng nhập."""
    return service.get_profile(uid)


@router.patch("/profile", response_model=UserRead)
def update_profile(uid: UserUid, payload: UserProfileUpdate, service: Service) -> UserRead:
    """Cập nhật thông tin cá nhân của người dùng đang đăng nhập."""
    return service.update_profile(uid, payload)
