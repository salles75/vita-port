"""
Vita - Dashboard Routes
Rotas para estatísticas e dados do dashboard.
"""

from typing import Annotated
from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models import Patient, Appointment, VitalSign, AppointmentStatus
from app.schemas import DashboardStatsResponse
from app.api.deps import CurrentDoctor

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: CurrentDoctor,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DashboardStatsResponse:
    """
    Retorna estatísticas gerais para o dashboard do médico.

    Args:
        current_user: Médico autenticado
        db: Sessão do banco de dados

    Returns:
        DashboardStatsResponse: Estatísticas do dashboard
    """
    # Total patients
    total_patients_result = await db.execute(
        select(func.count(Patient.id)).where(
            Patient.doctor_id == current_user.id,
            Patient.is_active == True
        )
    )
    total_patients = total_patients_result.scalar() or 0

    # Total appointments
    total_appointments_result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == current_user.id
        )
    )
    total_appointments = total_appointments_result.scalar() or 0

    # Appointments today
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    appointments_today_result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == current_user.id,
            Appointment.scheduled_at >= today_start,
            Appointment.scheduled_at <= today_end,
        )
    )
    appointments_today = appointments_today_result.scalar() or 0

    # Appointments this week
    week_start = date.today() - timedelta(days=date.today().weekday())
    week_end = week_start + timedelta(days=6)

    appointments_week_result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == current_user.id,
            Appointment.scheduled_at >= datetime.combine(week_start, datetime.min.time()),
            Appointment.scheduled_at <= datetime.combine(week_end, datetime.max.time()),
        )
    )
    appointments_this_week = appointments_week_result.scalar() or 0

    # Patients with critical vitals (alerts)
    from sqlalchemy import or_

    patient_ids_result = await db.execute(
        select(Patient.id).where(Patient.doctor_id == current_user.id)
    )
    patient_ids = [p for p in patient_ids_result.scalars().all()]

    patients_with_alerts = 0
    if patient_ids:
        time_threshold = datetime.utcnow() - timedelta(hours=24)

        alerts_result = await db.execute(
            select(func.count(func.distinct(VitalSign.patient_id))).where(
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
        )
        patients_with_alerts = alerts_result.scalar() or 0

    # Completed appointments
    completed_result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == current_user.id,
            Appointment.status == AppointmentStatus.COMPLETED
        )
    )
    completed_appointments = completed_result.scalar() or 0

    # Pending appointments
    pending_result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == current_user.id,
            Appointment.status.in_([
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CONFIRMED
            ]),
            Appointment.scheduled_at >= datetime.utcnow()
        )
    )
    pending_appointments = pending_result.scalar() or 0

    return DashboardStatsResponse(
        total_patients=total_patients,
        total_appointments=total_appointments,
        appointments_today=appointments_today,
        appointments_this_week=appointments_this_week,
        patients_with_alerts=patients_with_alerts,
        completed_appointments=completed_appointments,
        pending_appointments=pending_appointments,
    )
