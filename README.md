# 🩺 Vita - Portal de Telemedicina e Monitoramento

<div align="center">

![Vita Logo](https://via.placeholder.com/200x80/0A3D3D/FFFFFF?text=Vita)

**Portal médico para acompanhamento de sinais vitais, agendamento de consultas e visualização de históricos de saúde.**

[![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular)](https://angular.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://python.org)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Arquitetura](#-arquitetura)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Endpoints](#-api-endpoints)
- [Autor](#-autor)

---

## 🎯 Sobre o Projeto

O **Vita** é um portal de telemedicina desenvolvido para médicos acompanharem seus pacientes de forma eficiente e moderna. O sistema permite:

- 📊 **Monitoramento de sinais vitais** em tempo real com gráficos interativos
- 📅 **Agendamento de consultas** com calendário integrado
- 📈 **Históricos de saúde** com visualizações avançadas
- 🔐 **Segurança enterprise** com autenticação JWT e guards de rota

---

## 🏗️ Arquitetura

### Frontend (Angular 18)
```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │  Auth   │ │Dashboard│ │Patients │ │Appoint. │ │ Vitals  ││
│  │ Feature │ │ Feature │ │ Feature │ │ Feature │ │ Feature ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘│
│       │           │           │           │           │      │
│  ┌────┴───────────┴───────────┴───────────┴───────────┴────┐│
│  │                     CORE MODULE                          ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ ││
│  │  │  Guards  │  │Intercept.│  │ Services │  │  Models  │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                       │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                     API ROUTES                           ││
│  │  /auth  │  /patients  │  /appointments  │  /vitals      ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │                  BUSINESS LOGIC                          ││
│  │     Services  │  Validators  │  Security                 ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │                  DATA ACCESS                             ││
│  │     SQLAlchemy  │  Repositories  │  Models               ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Padrões Implementados

| Padrão | Aplicação |
|--------|-----------|
| **Lazy Loading** | Módulos carregados sob demanda |
| **Repository Pattern** | Abstração do acesso a dados |
| **Guard Pattern** | Proteção de rotas sensíveis |
| **Interceptor Pattern** | Injeção automática de tokens |
| **Signals** | Estado reativo no Angular |

---

## ✨ Funcionalidades

### 👨‍⚕️ Para Médicos
- Dashboard com visão geral dos pacientes
- Monitoramento de sinais vitais em tempo real
- Agendamento e gerenciamento de consultas
- Histórico completo de cada paciente
- Alertas para valores críticos

### 📊 Visualizações
- Gráficos de frequência cardíaca
- Evolução de pressão arterial
- Temperatura corporal ao longo do tempo
- Saturação de oxigênio (SpO2)
- Comparativos e tendências

### 🔐 Segurança
- Autenticação JWT
- Guards de rota (AuthGuard)
- Interceptores HTTP
- Refresh token automático
- Proteção contra CSRF

---

## 🛠️ Tecnologias

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Angular | 18 | Framework principal |
| Angular Material | 18 | Componentes UI |
| ngx-charts | 20+ | Gráficos de dados |
| Phosphor Icons | 2.1 | Iconografia |
| RxJS | 7.8 | Programação reativa |
| SCSS | - | Estilização avançada |

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Python | 3.11+ | Linguagem base |
| FastAPI | 0.109 | Framework API |
| SQLAlchemy | 2.0 | ORM |
| Pydantic | 2.5 | Validação de dados |
| PyJWT | 2.8 | Tokens JWT |
| Uvicorn | 0.27 | Servidor ASGI |

---

## 🚀 Instalação

### Pré-requisitos
- Node.js 20+
- Python 3.11+
- npm ou yarn

### Backend

```bash
# Navegue até o diretório backend
cd backend

# Crie um ambiente virtual
python -m venv venv

# Ative o ambiente virtual
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Execute o servidor
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
# Navegue até o diretório frontend
cd frontend

# Instale as dependências
npm install

# Execute em modo desenvolvimento
ng serve --open
```

O frontend estará disponível em `http://localhost:4200` e o backend em `http://localhost:8000`.

---

## 📁 Estrutura do Projeto

```
vita-consultas/
├── frontend/                    # Aplicação Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Guards, Interceptors, Services
│   │   │   ├── shared/         # Componentes reutilizáveis
│   │   │   ├── features/       # Módulos de funcionalidades
│   │   │   │   ├── auth/       # Login, registro
│   │   │   │   ├── dashboard/  # Visão geral
│   │   │   │   ├── patients/   # Gestão de pacientes
│   │   │   │   ├── appointments/ # Agendamentos
│   │   │   │   └── vitals/     # Sinais vitais
│   │   │   └── layout/         # Sidebar, Header
│   │   ├── assets/
│   │   └── styles/
│   └── package.json
│
├── backend/                     # API FastAPI
│   ├── app/
│   │   ├── api/                # Rotas da API
│   │   ├── core/               # Configurações, segurança
│   │   ├── models/             # Modelos SQLAlchemy
│   │   ├── schemas/            # Schemas Pydantic
│   │   ├── services/           # Lógica de negócio
│   │   └── db/                 # Conexão com banco
│   ├── main.py
│   └── requirements.txt
│
└── README.md
```

---

## 🔌 API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login de usuário |
| POST | `/api/auth/register` | Registro de médico |
| POST | `/api/auth/refresh` | Renovar token |

### Pacientes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/patients` | Listar pacientes |
| GET | `/api/patients/{id}` | Detalhes do paciente |
| POST | `/api/patients` | Criar paciente |
| PUT | `/api/patients/{id}` | Atualizar paciente |
| DELETE | `/api/patients/{id}` | Remover paciente |

### Consultas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/appointments` | Listar consultas |
| POST | `/api/appointments` | Agendar consulta |
| PUT | `/api/appointments/{id}` | Reagendar consulta |
| DELETE | `/api/appointments/{id}` | Cancelar consulta |

### Sinais Vitais
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/vitals/{patient_id}` | Histórico de sinais |
| POST | `/api/vitals` | Registrar medição |
| GET | `/api/vitals/stats/{patient_id}` | Estatísticas |

---

## 👤 Autor

**Guilherme Salles**

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
