"""
Vita - Appointment Routes
Rotas para gerenciamento de consultas/agendamentos.
"""

from typing import Annotated, Optional
from datetime import datetime, date, timedelta
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models import Appointment, Patient, AppointmentStatus
from app.schemas import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AppointmentDetailResponse,
    AppointmentListResponse,
    PatientResponse,
    UserResponse,
)
from app.api.deps import CurrentDoctor

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("", response_model=AppointmentListResponse)
async def list_appointments(
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    patient_id: Optional[int] = Query(None),
) -> AppointmentListResponse:
    """
    Lista consultas do médico com paginação e filtros.

    Args:
        current_user: Médico autenticado
        db: Sessão do banco de dados
        page: Número da página
        page_size: Itens por página
        status_filter: Filtro por status
        date_from: Data inicial
        date_to: Data final
        patient_id: Filtro por paciente

    Returns:
        AppointmentListResponse: Lista paginada de consultas
    """
    query = select(Appointment).where(Appointment.doctor_id == current_user.id)

    if status_filter:
        query = query.where(Appointment.status == status_filter)

    if date_from:
        query = query.where(Appointment.scheduled_at >= datetime.combine(date_from, datetime.min.time()))

    if date_to:
        query = query.where(Appointment.scheduled_at <= datetime.combine(date_to, datetime.max.time()))

    if patient_id:
        query = query.where(Appointment.patient_id == patient_id)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Appointment.scheduled_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    appointments = result.scalars().all()

    return AppointmentListResponse(
        items=[AppointmentResponse.model_validate(a) for a in appointments],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/today", response_model=list[AppointmentDetailResponse])
async def list_today_appointments(
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[AppointmentDetailResponse]:
    """
    Lista consultas do dia atual.

    Args:
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Returns:
        list[AppointmentDetailResponse]: Consultas do dia
    """
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    result = await db.execute(
        select(Appointment)
        .where(
            Appointment.doctor_id == current_user.id,
            Appointment.scheduled_at >= today_start,
            Appointment.scheduled_at <= today_end,
        )
        .order_by(Appointment.scheduled_at)
    )
    appointments = result.scalars().all()

    detailed_appointments = []
    for appointment in appointments:
        patient_result = await db.execute(
            select(Patient).where(Patient.id == appointment.patient_id)
        )
        patient = patient_result.scalar_one()

        detailed_appointments.append(
            AppointmentDetailResponse(
                **AppointmentResponse.model_validate(appointment).model_dump(),
                patient=PatientResponse.model_validate(patient),
                doctor=UserResponse.model_validate(current_user),
            )
        )

    return detailed_appointments


@router.get("/upcoming", response_model=list[AppointmentDetailResponse])
async def list_upcoming_appointments(
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(10, ge=1, le=50),
) -> list[AppointmentDetailResponse]:
    """
    Lista próximas consultas agendadas.

    Args:
        current_user: Médico autenticado
        db: Sessão do banco de dados
        limit: Quantidade máxima de resultados

    Returns:
        list[AppointmentDetailResponse]: Próximas consultas
    """
    now = datetime.utcnow()

    result = await db.execute(
        select(Appointment)
        .where(
            Appointment.doctor_id == current_user.id,
            Appointment.scheduled_at >= now,
            Appointment.status.in_([
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CONFIRMED
            ])
        )
        .order_by(Appointment.scheduled_at)
        .limit(limit)
    )
    appointments = result.scalars().all()

    detailed_appointments = []
    for appointment in appointments:
        patient_result = await db.execute(
            select(Patient).where(Patient.id == appointment.patient_id)
        )
        patient = patient_result.scalar_one()

        detailed_appointments.append(
            AppointmentDetailResponse(
                **AppointmentResponse.model_validate(appointment).model_dump(),
                patient=PatientResponse.model_validate(patient),
                doctor=UserResponse.model_validate(current_user),
            )
        )

    return detailed_appointments


@router.get("/{appointment_id}", response_model=AppointmentDetailResponse)
async def get_appointment(
    appointment_id: int,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentDetailResponse:
    """
    Retorna detalhes de uma consulta específica.

    Args:
        appointment_id: ID da consulta
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Returns:
        AppointmentDetailResponse: Detalhes da consulta

    Raises:
        HTTPException: Se a consulta não for encontrada
    """
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.doctor_id == current_user.id
        )
    )
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consulta não encontrada"
        )

    patient_result = await db.execute(
        select(Patient).where(Patient.id == appointment.patient_id)
    )
    patient = patient_result.scalar_one()

    return AppointmentDetailResponse(
        **AppointmentResponse.model_validate(appointment).model_dump(),
        patient=PatientResponse.model_validate(patient),
        doctor=UserResponse.model_validate(current_user),
    )


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    request: AppointmentCreate,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Appointment:
    """
    Agenda uma nova consulta.

    Args:
        request: Dados da consulta
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Returns:
        AppointmentResponse: Consulta criada

    Raises:
        HTTPException: Se o paciente não for encontrado ou horário indisponível
    """
    # Verify patient exists and belongs to doctor
    patient_result = await db.execute(
        select(Patient).where(
            Patient.id == request.patient_id,
            Patient.doctor_id == current_user.id
        )
    )
    patient = patient_result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    # Check for conflicting appointments
    appointment_end = request.scheduled_at + timedelta(minutes=request.duration_minutes)

    conflict_result = await db.execute(
        select(Appointment).where(
            Appointment.doctor_id == current_user.id,
            Appointment.status.in_([
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CONFIRMED
            ]),
            Appointment.scheduled_at < appointment_end,
            Appointment.scheduled_at + timedelta(minutes=30) > request.scheduled_at  # Simplified check
        )
    )
    conflict = conflict_result.scalar_one_or_none()

    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma consulta agendada neste horário"
        )

    appointment = Appointment(
        doctor_id=current_user.id,
        **request.model_dump()
    )

    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)

    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    request: AppointmentUpdate,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Appointment:
    """
    Atualiza uma consulta.

    Args:
        appointment_id: ID da consulta
        request: Dados a atualizar
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Returns:
        AppointmentResponse: Consulta atualizada

    Raises:
        HTTPException: Se a consulta não for encontrada
    """
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.doctor_id == current_user.id
        )
    )
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consulta não encontrada"
        )

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)

    await db.commit()
    await db.refresh(appointment)

    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_appointment(
    appointment_id: int,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """
    Cancela uma consulta.

    Args:
        appointment_id: ID da consulta
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Raises:
        HTTPException: Se a consulta não for encontrada
    """
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.doctor_id == current_user.id
        )
    )
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consulta não encontrada"
        )

    appointment.status = AppointmentStatus.CANCELLED
    await db.commit()
