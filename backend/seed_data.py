"""
Vita - Database Seeder
Script para popular o banco de dados com dados de teste.
"""

import asyncio
from datetime import datetime, timedelta, date
import random

from app.db.database import async_session_maker, init_db
from app.core.security import get_password_hash
from app.models import User, Patient, Appointment, VitalSign, UserRole, AppointmentStatus


async def seed_database():
    """
    Popula o banco de dados com dados de teste realistas.
    """
    print("🌱 Iniciando seed do banco de dados...")

    await init_db()

    async with async_session_maker() as db:
        # Check if data already exists
        from sqlalchemy import select

        existing_user = await db.execute(select(User).limit(1))
        if existing_user.scalar_one_or_none():
            print("⚠️  Banco de dados já possui dados. Pulando seed.")
            return

        # Create demo doctor
        doctor = User(
            email="dr.silva@vita.med.br",
            hashed_password=get_password_hash("123456"),
            full_name="Dr. Carlos Silva",
            crm="CRM-SP 123456",
            specialty="Cardiologia",
            role=UserRole.DOCTOR,
            is_active=True,
        )
        db.add(doctor)
        await db.flush()

        print(f"✅ Médico criado: {doctor.email}")

        # Create patients
        patients_data = [
            {
                "full_name": "Maria Santos",
                "cpf": "123.456.789-00",
                "birth_date": date(1985, 3, 15),
                "gender": "Feminino",
                "phone": "(11) 98765-4321",
                "email": "maria.santos@email.com",
                "blood_type": "O+",
                "allergies": "Dipirona",
                "address": "Rua das Flores, 123 - São Paulo, SP",
            },
            {
                "full_name": "João Oliveira",
                "cpf": "987.654.321-00",
                "birth_date": date(1978, 7, 22),
                "gender": "Masculino",
                "phone": "(11) 91234-5678",
                "email": "joao.oliveira@email.com",
                "blood_type": "A+",
                "allergies": None,
                "address": "Av. Paulista, 1000 - São Paulo, SP",
            },
            {
                "full_name": "Ana Costa",
                "cpf": "456.789.123-00",
                "birth_date": date(1990, 11, 8),
                "gender": "Feminino",
                "phone": "(11) 94567-8901",
                "email": "ana.costa@email.com",
                "blood_type": "B+",
                "allergies": "Penicilina, Sulfa",
                "address": "Rua Augusta, 500 - São Paulo, SP",
            },
            {
                "full_name": "Pedro Almeida",
                "cpf": "789.123.456-00",
                "birth_date": date(1965, 5, 30),
                "gender": "Masculino",
                "phone": "(11) 97890-1234",
                "email": "pedro.almeida@email.com",
                "blood_type": "AB+",
                "allergies": None,
                "address": "Rua Oscar Freire, 200 - São Paulo, SP",
                "medical_notes": "Hipertensão controlada com medicação",
            },
            {
                "full_name": "Lucia Ferreira",
                "cpf": "321.654.987-00",
                "birth_date": date(1972, 9, 12),
                "gender": "Feminino",
                "phone": "(11) 93210-6547",
                "email": "lucia.ferreira@email.com",
                "blood_type": "O-",
                "allergies": "Ibuprofeno",
                "address": "Alameda Santos, 800 - São Paulo, SP",
                "medical_notes": "Diabetes tipo 2",
            },
            {
                "full_name": "Roberto Souza",
                "cpf": "654.987.321-00",
                "birth_date": date(1958, 2, 28),
                "gender": "Masculino",
                "phone": "(11) 96540-9873",
                "email": "roberto.souza@email.com",
                "blood_type": "A-",
                "allergies": None,
                "address": "Rua Haddock Lobo, 350 - São Paulo, SP",
                "medical_notes": "Pacemaker implantado em 2020",
            },
        ]

        patients = []
        for pdata in patients_data:
            patient = Patient(doctor_id=doctor.id, **pdata)
            db.add(patient)
            patients.append(patient)

        await db.flush()
        print(f"✅ {len(patients)} pacientes criados")

        # Create vital signs history (last 90 days)
        vital_signs = []
        for patient in patients:
            base_hr = random.randint(65, 85)
            base_sys = random.randint(110, 130)
            base_dia = random.randint(70, 85)
            base_temp = random.uniform(36.2, 36.8)
            base_o2 = random.randint(95, 99)

            for days_ago in range(90, -1, -1):
                # Skip some days randomly for realism
                if random.random() < 0.5:
                    continue

                recorded_at = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(8, 18))

                vital = VitalSign(
                    patient_id=patient.id,
                    recorded_by=doctor.id,
                    recorded_at=recorded_at,
                    heart_rate=base_hr + random.randint(-10, 15),
                    systolic_pressure=base_sys + random.randint(-15, 20),
                    diastolic_pressure=base_dia + random.randint(-10, 15),
                    temperature=round(base_temp + random.uniform(-0.5, 1.0), 1),
                    oxygen_saturation=min(100, base_o2 + random.randint(-3, 2)),
                    respiratory_rate=random.randint(14, 20),
                    weight=random.uniform(55, 95) if random.random() > 0.7 else None,
                    glucose_level=random.randint(80, 140) if random.random() > 0.6 else None,
                )
                vital_signs.append(vital)
                db.add(vital)

        await db.flush()
        print(f"✅ {len(vital_signs)} registros de sinais vitais criados")

        # Create appointments
        appointments = []
        appointment_types = ["consultation", "follow_up", "exam", "telemedicine"]
        reasons = [
            "Consulta de rotina",
            "Acompanhamento de pressão arterial",
            "Revisão de exames",
            "Dor no peito esporádica",
            "Avaliação cardiovascular",
            "Retorno pós-exame",
        ]

        for patient in patients:
            # Past appointments (completed)
            for _ in range(random.randint(2, 5)):
                days_ago = random.randint(7, 60)
                scheduled_at = datetime.utcnow() - timedelta(
                    days=days_ago,
                    hours=random.randint(-4, 4)
                )
                scheduled_at = scheduled_at.replace(
                    hour=random.choice([8, 9, 10, 11, 14, 15, 16, 17]),
                    minute=random.choice([0, 30]),
                    second=0,
                    microsecond=0
                )

                appointment = Appointment(
                    doctor_id=doctor.id,
                    patient_id=patient.id,
                    scheduled_at=scheduled_at,
                    duration_minutes=random.choice([30, 45, 60]),
                    status=AppointmentStatus.COMPLETED,
                    appointment_type=random.choice(appointment_types),
                    reason=random.choice(reasons),
                    notes="Paciente evoluindo bem. Manter medicação.",
                    diagnosis="Sem alterações significativas" if random.random() > 0.5 else None,
                    is_telemedicine=random.random() > 0.8,
                )
                appointments.append(appointment)
                db.add(appointment)

            # Future appointments (scheduled)
            if random.random() > 0.3:
                days_ahead = random.randint(1, 30)
                scheduled_at = datetime.utcnow() + timedelta(days=days_ahead)
                scheduled_at = scheduled_at.replace(
                    hour=random.choice([8, 9, 10, 11, 14, 15, 16, 17]),
                    minute=random.choice([0, 30]),
                    second=0,
                    microsecond=0
                )

                appointment = Appointment(
                    doctor_id=doctor.id,
                    patient_id=patient.id,
                    scheduled_at=scheduled_at,
                    duration_minutes=30,
                    status=random.choice([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
                    appointment_type=random.choice(appointment_types),
                    reason=random.choice(reasons),
                    is_telemedicine=random.random() > 0.7,
                )
                appointments.append(appointment)
                db.add(appointment)

        # Add some appointments for today
        today_hours = [9, 10, 11, 14, 15, 16]
        for i, hour in enumerate(today_hours[:4]):
            patient = random.choice(patients)
            scheduled_at = datetime.utcnow().replace(
                hour=hour,
                minute=random.choice([0, 30]),
                second=0,
                microsecond=0
            )

            status = AppointmentStatus.COMPLETED if hour < datetime.utcnow().hour else AppointmentStatus.SCHEDULED

            appointment = Appointment(
                doctor_id=doctor.id,
                patient_id=patient.id,
                scheduled_at=scheduled_at,
                duration_minutes=30,
                status=status,
                appointment_type="consultation",
                reason=random.choice(reasons),
                is_telemedicine=random.random() > 0.8,
            )
            appointments.append(appointment)
            db.add(appointment)

        await db.commit()
        print(f"✅ {len(appointments)} consultas criadas")

        print("\n" + "=" * 50)
        print("🎉 Seed concluído com sucesso!")
        print("=" * 50)
        print(f"\n📧 Login: dr.silva@vita.med.br")
        print(f"🔑 Senha: 123456")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(seed_database())
