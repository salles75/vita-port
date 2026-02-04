"""
Vita - Vital Signs Routes
Rotas para gerenciamento de sinais vitais.
"""

from typing import Annotated, Optional
from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models import VitalSign, Patient
from app.schemas import (
    VitalSignCreate,
    VitalSignResponse,
    VitalSignListResponse,
    VitalStatsResponse,
    VitalChartData,
    ChartDataPoint,
)
from app.api.deps import CurrentDoctor

router = APIRouter(prefix="/vitals", tags=["Vital Signs"])


@router.get("/{patient_id}", response_model=VitalSignListResponse)
async def list_patient_vitals(
    patient_id: int,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> VitalSignListResponse:
    """
    Lista sinais vitais de um paciente.

    Args:
        patient_id: ID do paciente
        current_user: Médico autenticado
        db: Sessão do banco de dados
        date_from: Data inicial
        date_to: Data final
        limit: Quantidade máxima de resultados

    Returns:
        VitalSignListResponse: Lista de sinais vitais

    Raises:
        HTTPException: Se o paciente não for encontrado
    """
    # Verify patient belongs to doctor
    patient_result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == current_user.id
        )
    )
    patient = patient_result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    query = select(VitalSign).where(VitalSign.patient_id == patient_id)

    if date_from:
        query = query.where(VitalSign.recorded_at >= datetime.combine(date_from, datetime.min.time()))

    if date_to:
        query = query.where(VitalSign.recorded_at <= datetime.combine(date_to, datetime.max.time()))

    query = query.order_by(VitalSign.recorded_at.desc()).limit(limit)

    result = await db.execute(query)
    vitals = result.scalars().all()

    # Count total
    count_query = select(func.count(VitalSign.id)).where(VitalSign.patient_id == patient_id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    return VitalSignListResponse(
        items=[VitalSignResponse.model_validate(v) for v in vitals],
        total=total,
    )


@router.get("/{patient_id}/stats", response_model=VitalStatsResponse)
async def get_patient_vital_stats(
    patient_id: int,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(30, ge=1, le=365),
) -> VitalStatsResponse:
    """
    Retorna estatísticas dos sinais vitais de um paciente.

    Args:
        patient_id: ID do paciente
        current_user: Médico autenticado
        db: Sessão do banco de dados
        days: Período em dias para calcular estatísticas

    Returns:
        VitalStatsResponse: Estatísticas dos sinais vitais

    Raises:
        HTTPException: Se o paciente não for encontrado
    """
    # Verify patient belongs to doctor
    patient_result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == current_user.id
        )
    )
    patient = patient_result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    date_threshold = datetime.utcnow() - timedelta(days=days)

    stats_result = await db.execute(
        select(
            func.avg(VitalSign.heart_rate).label("avg_heart_rate"),
            func.avg(VitalSign.systolic_pressure).label("avg_systolic"),
            func.avg(VitalSign.diastolic_pressure).label("avg_diastolic"),
            func.avg(VitalSign.temperature).label("avg_temperature"),
            func.avg(VitalSign.oxygen_saturation).label("avg_oxygen"),
            func.min(VitalSign.heart_rate).label("min_heart_rate"),
            func.max(VitalSign.heart_rate).label("max_heart_rate"),
            func.count(VitalSign.id).label("total_records"),
        ).where(
            VitalSign.patient_id == patient_id,
            VitalSign.recorded_at >= date_threshold
        )
    )
    stats = stats_result.one()

    return VitalStatsResponse(
        avg_heart_rate=round(stats.avg_heart_rate, 1) if stats.avg_heart_rate else None,
        avg_systolic=round(stats.avg_systolic, 1) if stats.avg_systolic else None,
        avg_diastolic=round(stats.avg_diastolic, 1) if stats.avg_diastolic else None,
        avg_temperature=round(stats.avg_temperature, 2) if stats.avg_temperature else None,
        avg_oxygen=round(stats.avg_oxygen, 1) if stats.avg_oxygen else None,
        min_heart_rate=stats.min_heart_rate,
        max_heart_rate=stats.max_heart_rate,
        total_records=stats.total_records,
    )


@router.get("/{patient_id}/chart", response_model=VitalChartData)
async def get_patient_vital_chart_data(
    patient_id: int,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(30, ge=1, le=365),
) -> VitalChartData:
    """
    Retorna dados formatados para gráficos de sinais vitais.

    Args:
        patient_id: ID do paciente
        current_user: Médico autenticado
        db: Sessão do banco de dados
        days: Período em dias

    Returns:
        VitalChartData: Dados para gráficos

    Raises:
        HTTPException: Se o paciente não for encontrado
    """
    # Verify patient belongs to doctor
    patient_result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == current_user.id
        )
    )
    patient = patient_result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    date_threshold = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(VitalSign)
        .where(
            VitalSign.patient_id == patient_id,
            VitalSign.recorded_at >= date_threshold
        )
        .order_by(VitalSign.recorded_at)
    )
    vitals = result.scalars().all()

    heart_rate_data = []
    blood_pressure_data = []
    temperature_data = []
    oxygen_data = []

    for vital in vitals:
        date_str = vital.recorded_at.strftime("%d/%m")

        if vital.heart_rate:
            heart_rate_data.append(ChartDataPoint(name=date_str, value=vital.heart_rate))

        if vital.systolic_pressure and vital.diastolic_pressure:
            # Use systolic for the chart, could be expanded
            blood_pressure_data.append(
                ChartDataPoint(name=date_str, value=vital.systolic_pressure)
            )

        if vital.temperature:
            temperature_data.append(ChartDataPoint(name=date_str, value=vital.temperature))

        if vital.oxygen_saturation:
            oxygen_data.append(ChartDataPoint(name=date_str, value=vital.oxygen_saturation))

    return VitalChartData(
        heart_rate=heart_rate_data,
        blood_pressure=blood_pressure_data,
        temperature=temperature_data,
        oxygen_saturation=oxygen_data,
    )


@router.post("", response_model=VitalSignResponse, status_code=status.HTTP_201_CREATED)
async def create_vital_sign(
    request: VitalSignCreate,
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VitalSign:
    """
    Registra novos sinais vitais para um paciente.

    Args:
        request: Dados dos sinais vitais
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Returns:
        VitalSignResponse: Registro criado

    Raises:
        HTTPException: Se o paciente não for encontrado
    """
    # Verify patient belongs to doctor
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

    vital_sign = VitalSign(
        recorded_by=current_user.id,
        **request.model_dump()
    )

    db.add(vital_sign)
    await db.commit()
    await db.refresh(vital_sign)

    return vital_sign


@router.get("/alerts/critical", response_model=list[VitalSignResponse])
async def get_critical_vitals(
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
    hours: int = Query(24, ge=1, le=168),
) -> list[VitalSignResponse]:
    """
    Lista sinais vitais críticos recentes de todos os pacientes.

    Critérios de alerta:
    - Frequência cardíaca: < 50 ou > 120 bpm
    - Pressão sistólica: < 90 ou > 180 mmHg
    - Temperatura: < 35 ou > 39 °C
    - Saturação de oxigênio: < 90%

    Args:
        current_user: Médico autenticado
        db: Sessão do banco de dados
        hours: Período em horas para buscar alertas

    Returns:
        list[VitalSignResponse]: Sinais vitais críticos
    """
    from sqlalchemy import or_

    time_threshold = datetime.utcnow() - timedelta(hours=hours)

    # Get patient IDs for this doctor
    patient_ids_result = await db.execute(
        select(Patient.id).where(Patient.doctor_id == current_user.id)
    )
    patient_ids = [p for p in patient_ids_result.scalars().all()]

    if not patient_ids:
        return []

    result = await db.execute(
        select(VitalSign)
        .where(
            VitalSign.patient_id.in_(patient_ids),
            VitalSign.recorded_at >= time_threshold,
            or_(
                VitalSign.heart_rate < 50,
                VitalSign.heart_rate > 120,
                VitalSign.systolic_pressure < 90,
                VitalSign.systolic_pressure > 180,
                VitalSign.temperature < 35,
                VitalSign.temperature > 39,
                VitalSign.oxygen_saturation < 90,
            )
        )
        .order_by(VitalSign.recorded_at.desc())
        .limit(50)
    )
    vitals = result.scalars().all()

    return [VitalSignResponse.model_validate(v) for v in vitals]
