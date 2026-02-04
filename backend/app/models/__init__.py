"""
Vita - Database Models
Modelos SQLAlchemy para todas as entidades do sistema.
"""

from datetime import datetime, date
from enum import Enum as PyEnum
from typing import Optional, List

from sqlalchemy import (
    String, Integer, Float, Text, DateTime, Date, 
    ForeignKey, Enum, Boolean
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class UserRole(str, PyEnum):
    """Papéis de usuário no sistema."""
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"


class AppointmentStatus(str, PyEnum):
    """Status possíveis de uma consulta."""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class User(Base):
    """
    Modelo de usuário (médicos, enfermeiros, admins).
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    crm: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True)
    specialty: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.DOCTOR)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    patients: Mapped[List["Patient"]] = relationship(
        "Patient", back_populates="doctor", lazy="selectin"
    )
    appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment", back_populates="doctor", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class Patient(Base):
    """
    Modelo de paciente.
    """
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    cpf: Mapped[str] = mapped_column(String(14), unique=True, index=True, nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emergency_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    emergency_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    blood_type: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    allergies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    medical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    doctor: Mapped["User"] = relationship("User", back_populates="patients")
    vitals: Mapped[List["VitalSign"]] = relationship(
        "VitalSign", back_populates="patient", lazy="selectin"
    )
    appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment", back_populates="patient", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Patient(id={self.id}, name={self.full_name})>"


class VitalSign(Base):
    """
    Modelo para registro de sinais vitais.
    """
    __tablename__ = "vital_signs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    recorded_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Vital Signs Data
    heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # bpm
    systolic_pressure: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # mmHg
    diastolic_pressure: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # mmHg
    temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # °C
    oxygen_saturation: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # SpO2 %
    respiratory_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # rpm
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # kg
    height: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # cm
    glucose_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # mg/dL
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="vitals")

    def __repr__(self) -> str:
        return f"<VitalSign(id={self.id}, patient_id={self.patient_id}, recorded_at={self.recorded_at})>"


class Appointment(Base):
    """
    Modelo para consultas/agendamentos.
    """
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED
    )
    appointment_type: Mapped[str] = mapped_column(String(50), default="consultation")
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prescription: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_telemedicine: Mapped[bool] = mapped_column(Boolean, default=False)
    meeting_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    doctor: Mapped["User"] = relationship("User", back_populates="appointments")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")

    def __repr__(self) -> str:
        return f"<Appointment(id={self.id}, doctor_id={self.doctor_id}, patient_id={self.patient_id})>"
