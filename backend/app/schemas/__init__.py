"""
Vita - Pydantic Schemas
Schemas para validação de entrada/saída da API.
"""

from datetime import datetime, date
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ============== Enums ==============

class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"


class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


# ============== Auth Schemas ==============

class LoginRequest(BaseModel):
    """Schema para requisição de login."""
    email: EmailStr
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    """Schema para resposta de autenticação."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    """Schema para requisição de refresh token."""
    refresh_token: str


# ============== User Schemas ==============

class UserBase(BaseModel):
    """Base schema para usuário."""
    email: EmailStr
    full_name: str = Field(..., min_length=3, max_length=255)
    crm: Optional[str] = Field(None, max_length=20)
    specialty: Optional[str] = Field(None, max_length=100)
    role: UserRole = UserRole.DOCTOR


class UserCreate(UserBase):
    """Schema para criação de usuário."""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """Schema para atualização de usuário."""
    full_name: Optional[str] = Field(None, min_length=3, max_length=255)
    specialty: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """Schema de resposta para usuário."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime


class UserProfileResponse(UserResponse):
    """Schema de resposta para perfil do usuário logado."""
    patient_count: int = 0
    appointment_count: int = 0


# ============== Patient Schemas ==============

class PatientBase(BaseModel):
    """Base schema para paciente."""
    full_name: str = Field(..., min_length=3, max_length=255)
    cpf: str = Field(..., pattern=r"^\d{3}\.\d{3}\.\d{3}-\d{2}$")
    birth_date: date
    gender: str = Field(..., max_length=20)
    phone: str = Field(..., max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    blood_type: Optional[str] = Field(None, max_length=5)
    allergies: Optional[str] = None
    medical_notes: Optional[str] = None


class PatientCreate(PatientBase):
    """Schema para criação de paciente."""
    pass


class PatientUpdate(BaseModel):
    """Schema para atualização de paciente."""
    full_name: Optional[str] = Field(None, min_length=3, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    allergies: Optional[str] = None
    medical_notes: Optional[str] = None
    avatar_url: Optional[str] = None


class PatientResponse(PatientBase):
    """Schema de resposta para paciente."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PatientListResponse(BaseModel):
    """Schema para listagem paginada de pacientes."""
    items: List[PatientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PatientDetailResponse(PatientResponse):
    """Schema de resposta detalhada para paciente."""
    latest_vitals: Optional["VitalSignResponse"] = None
    upcoming_appointments: List["AppointmentResponse"] = []


# ============== Vital Sign Schemas ==============

class VitalSignBase(BaseModel):
    """Base schema para sinais vitais."""
    heart_rate: Optional[int] = Field(None, ge=30, le=250)
    systolic_pressure: Optional[int] = Field(None, ge=60, le=300)
    diastolic_pressure: Optional[int] = Field(None, ge=30, le=200)
    temperature: Optional[float] = Field(None, ge=30.0, le=45.0)
    oxygen_saturation: Optional[int] = Field(None, ge=50, le=100)
    respiratory_rate: Optional[int] = Field(None, ge=5, le=60)
    weight: Optional[float] = Field(None, ge=0.5, le=500)
    height: Optional[float] = Field(None, ge=30, le=300)
    glucose_level: Optional[int] = Field(None, ge=20, le=800)
    notes: Optional[str] = None


class VitalSignCreate(VitalSignBase):
    """Schema para criação de sinais vitais."""
    patient_id: int


class VitalSignResponse(VitalSignBase):
    """Schema de resposta para sinais vitais."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    recorded_by: int
    recorded_at: datetime


class VitalSignListResponse(BaseModel):
    """Schema para listagem de sinais vitais."""
    items: List[VitalSignResponse]
    total: int


class VitalStatsResponse(BaseModel):
    """Schema para estatísticas de sinais vitais."""
    avg_heart_rate: Optional[float] = None
    avg_systolic: Optional[float] = None
    avg_diastolic: Optional[float] = None
    avg_temperature: Optional[float] = None
    avg_oxygen: Optional[float] = None
    min_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None
    total_records: int = 0


# ============== Appointment Schemas ==============

class AppointmentBase(BaseModel):
    """Base schema para consulta."""
    scheduled_at: datetime
    duration_minutes: int = Field(30, ge=15, le=240)
    appointment_type: str = Field("consultation", max_length=50)
    reason: Optional[str] = None
    is_telemedicine: bool = False


class AppointmentCreate(AppointmentBase):
    """Schema para criação de consulta."""
    patient_id: int


class AppointmentUpdate(BaseModel):
    """Schema para atualização de consulta."""
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=240)
    status: Optional[AppointmentStatus] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    is_telemedicine: Optional[bool] = None
    meeting_url: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    """Schema de resposta para consulta."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    patient_id: int
    status: AppointmentStatus
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    meeting_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AppointmentDetailResponse(AppointmentResponse):
    """Schema de resposta detalhada para consulta."""
    patient: PatientResponse
    doctor: UserResponse


class AppointmentListResponse(BaseModel):
    """Schema para listagem paginada de consultas."""
    items: List[AppointmentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============== Dashboard Schemas ==============

class DashboardStatsResponse(BaseModel):
    """Schema para estatísticas do dashboard."""
    total_patients: int = 0
    total_appointments: int = 0
    appointments_today: int = 0
    appointments_this_week: int = 0
    patients_with_alerts: int = 0
    completed_appointments: int = 0
    pending_appointments: int = 0


class ChartDataPoint(BaseModel):
    """Ponto de dados para gráficos."""
    name: str
    value: float


class VitalChartData(BaseModel):
    """Dados para gráfico de sinais vitais."""
    heart_rate: List[ChartDataPoint] = []
    blood_pressure: List[ChartDataPoint] = []
    temperature: List[ChartDataPoint] = []
    oxygen_saturation: List[ChartDataPoint] = []


# Update forward references
PatientDetailResponse.model_rebuild()
