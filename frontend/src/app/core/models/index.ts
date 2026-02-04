/**
 * Vita - Core Models
 * Interfaces e tipos para toda a aplicação.
 */

// ============================================
// AUTH MODELS
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ============================================
// USER MODELS
// ============================================

export type UserRole = 'admin' | 'doctor' | 'nurse';

export interface User {
  id: number;
  email: string;
  full_name: string;
  crm?: string;
  specialty?: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface UserProfile extends User {
  patient_count: number;
  appointment_count: number;
}

// ============================================
// PATIENT MODELS
// ============================================

export interface Patient {
  id: number;
  doctor_id: number;
  full_name: string;
  cpf: string;
  birth_date: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  blood_type?: string;
  allergies?: string;
  medical_notes?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  full_name: string;
  cpf: string;
  birth_date: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  blood_type?: string;
  allergies?: string;
  medical_notes?: string;
}

export interface PatientUpdate {
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  allergies?: string;
  medical_notes?: string;
  avatar_url?: string;
}

export interface PatientDetail extends Patient {
  latest_vitals?: VitalSign;
  upcoming_appointments: Appointment[];
}

// ============================================
// VITAL SIGN MODELS
// ============================================

export interface VitalSign {
  id: number;
  patient_id: number;
  recorded_by: number;
  recorded_at: string;
  heart_rate?: number;
  systolic_pressure?: number;
  diastolic_pressure?: number;
  temperature?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
  glucose_level?: number;
  notes?: string;
}

export interface VitalSignCreate {
  patient_id: number;
  heart_rate?: number;
  systolic_pressure?: number;
  diastolic_pressure?: number;
  temperature?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
  glucose_level?: number;
  notes?: string;
}

export interface VitalStats {
  avg_heart_rate?: number;
  avg_systolic?: number;
  avg_diastolic?: number;
  avg_temperature?: number;
  avg_oxygen?: number;
  min_heart_rate?: number;
  max_heart_rate?: number;
  total_records: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface VitalChartData {
  heart_rate: ChartDataPoint[];
  blood_pressure: ChartDataPoint[];
  temperature: ChartDataPoint[];
  oxygen_saturation: ChartDataPoint[];
}

// ============================================
// APPOINTMENT MODELS
// ============================================

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: number;
  doctor_id: number;
  patient_id: number;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type: string;
  reason?: string;
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  is_telemedicine: boolean;
  meeting_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  patient_id: number;
  scheduled_at: string;
  duration_minutes?: number;
  appointment_type?: string;
  reason?: string;
  is_telemedicine?: boolean;
}

export interface AppointmentUpdate {
  scheduled_at?: string;
  duration_minutes?: number;
  status?: AppointmentStatus;
  reason?: string;
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  is_telemedicine?: boolean;
  meeting_url?: string;
}

export interface AppointmentDetail extends Appointment {
  patient: Patient;
  doctor: User;
}

// ============================================
// DASHBOARD MODELS
// ============================================

export interface DashboardStats {
  total_patients: number;
  total_appointments: number;
  appointments_today: number;
  appointments_this_week: number;
  patients_with_alerts: number;
  completed_appointments: number;
  pending_appointments: number;
}

// ============================================
// PAGINATION MODELS
// ============================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

// ============================================
// API ERROR
// ============================================

export interface ApiError {
  detail: string;
  status_code?: number;
}
