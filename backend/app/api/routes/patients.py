"""
Vita - Patient Routes
Rotas para gerenciamento de pacientes.
"""

from typing import Annotated, Optional
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.config import settings
from app.models import Patient, VitalSign, Appointment, AppointmentStatus
from app.schemas import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse,
    PatientDetailResponse,
    VitalSignResponse,
    AppointmentResponse,
)
from app.api.deps import CurrentDoctor

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=PatientListResponse)
async def list_patients(
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
) -> PatientListResponse:
    """
    Lista pacientes do médico com paginação e filtros.

    Args:
        current_user: Médico autenticado
        db: Sessão do banco de dados
        page: Número da página
        page_size: Itens por página
        search: Busca por nome ou CPF
        is_active: Filtro por status

    Returns:
        PatientListResponse: Lista paginada de pacientes
    """
    query = select(Patient).where(Patient.doctor_id == current_user.id)

    if search:
        search_filter = or_(
            Patient.full_name.ilike(f"%{search}%"),
            Patient.cpf.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)

    if is_active is not None:
        query = query.where(Patient.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Patient.full_name).offset(offset).limit(page_size)

    result = await db.execute(query)
    patients = result.scalars().all()

    return PatientListResponse(
        items=[PatientResponse.model_validate(p) for p in patients],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{patient_id}", response_model=PatientDetailResponse)
async def get_patient(
    patient_id: int,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PatientDetailResponse:
    """
    Retorna detalhes de um paciente específico.

    Args:
        patient_id: ID do paciente
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Returns:
        PatientDetailResponse: Detalhes do paciente

    Raises:
        HTTPException: Se o paciente não for encontrado
    """
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == current_user.id
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    # Get latest vitals
    vitals_result = await db.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == patient_id)
        .order_by(VitalSign.recorded_at.desc())
        .limit(1)
    )
    latest_vitals = vitals_result.scalar_one_or_none()

    # Get upcoming appointments
    from datetime import datetime

    appointments_result = await db.execute(
        select(Appointment)
        .where(
            Appointment.patient_id == patient_id,
            Appointment.scheduled_at >= datetime.utcnow(),
            Appointment.status.in_([
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CONFIRMED
            ])
        )
        .order_by(Appointment.scheduled_at)
        .limit(5)
    )
    upcoming_appointments = appointments_result.scalars().all()

    return PatientDetailResponse(
        **PatientResponse.model_validate(patient).model_dump(),
        latest_vitals=VitalSignResponse.model_validate(latest_vitals) if latest_vitals else None,
        upcoming_appointments=[
            AppointmentResponse.model_validate(a) for a in upcoming_appointments
        ],
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    request: PatientCreate,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Patient:
    """
    Cria um novo paciente.

    Args:
        request: Dados do paciente
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Returns:
        PatientResponse: Paciente criado

    Raises:
        HTTPException: Se o CPF já estiver cadastrado
    """
    result = await db.execute(
        select(Patient).where(Patient.cpf == request.cpf)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CPF já cadastrado"
        )

    patient = Patient(
        doctor_id=current_user.id,
        **request.model_dump()
    )

    db.add(patient)
    await db.commit()
    await db.refresh(patient)

    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    request: PatientUpdate,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Patient:
    """
    Atualiza dados de um paciente.

    Args:
        patient_id: ID do paciente
        request: Dados a atualizar
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Returns:
        PatientResponse: Paciente atualizado

    Raises:
        HTTPException: Se o paciente não for encontrado
    """
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == current_user.id
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)

    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """
    Desativa um paciente (soft delete).

    Args:
        patient_id: ID do paciente
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Raises:
        HTTPException: Se o paciente não for encontrado
    """
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == current_user.id
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    patient.is_active = False
    await db.commit()
