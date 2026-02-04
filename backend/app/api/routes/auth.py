"""
Vita - Authentication Routes
Rotas para autenticação e gerenciamento de usuários.
"""

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
    verify_token,
)
from app.models import User
from app.schemas import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserCreate,
    UserResponse,
    UserProfileResponse,
)
from app.api.deps import CurrentUser

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> TokenResponse:
    """
    Autentica um usuário e retorna tokens JWT.

    Args:
        request: Credenciais de login (email e senha)
        db: Sessão do banco de dados

    Returns:
        TokenResponse: Tokens de acesso e refresh

    Raises:
        HTTPException: Se as credenciais forem inválidas
    """
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """
    Registra um novo usuário (médico).

    Args:
        request: Dados do novo usuário
        db: Sessão do banco de dados

    Returns:
        UserResponse: Dados do usuário criado

    Raises:
        HTTPException: Se o email já estiver em uso
    """
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já cadastrado"
        )

    if request.crm:
        result = await db.execute(
            select(User).where(User.crm == request.crm)
        )
        existing_crm = result.scalar_one_or_none()

        if existing_crm:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="CRM já cadastrado"
            )

    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        crm=request.crm,
        specialty=request.specialty,
        role=request.role,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> TokenResponse:
    """
    Renova o token de acesso usando o refresh token.

    Args:
        request: Refresh token
        db: Sessão do banco de dados

    Returns:
        TokenResponse: Novos tokens

    Raises:
        HTTPException: Se o refresh token for inválido
    """
    payload = verify_token(request.refresh_token, token_type="refresh")

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado"
        )

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado ou inativo"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserProfileResponse:
    """
    Retorna o perfil do usuário autenticado.

    Args:
        current_user: Usuário atual
        db: Sessão do banco de dados

    Returns:
        UserProfileResponse: Perfil do usuário com estatísticas
    """
    from app.models import Patient, Appointment
    from sqlalchemy import func

    patient_count_result = await db.execute(
        select(func.count(Patient.id)).where(Patient.doctor_id == current_user.id)
    )
    patient_count = patient_count_result.scalar() or 0

    appointment_count_result = await db.execute(
        select(func.count(Appointment.id)).where(Appointment.doctor_id == current_user.id)
    )
    appointment_count = appointment_count_result.scalar() or 0

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        crm=current_user.crm,
        specialty=current_user.specialty,
        role=current_user.role,
        is_active=current_user.is_active,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
        patient_count=patient_count,
        appointment_count=appointment_count,
    )
