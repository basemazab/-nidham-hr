# HR BASEM AZAB — نظام إدارة الموارد البشرية

<div dir="rtl">

## نظرة عامة

نظام إدارة موارد بشرية متكامل مصمم خصيصاً للشركات الصناعية المصرية. متوافق مع **قانون العمل المصري رقم 12 لسنة 2003** و**قانون التأمينات الاجتماعية رقم 148 لسنة 2019**.

### المميزات الرئيسية

- 🏭 دعم شركات ومصانع متعددة (Multi-Company / Multi-Factory)
- 👥 ملف موظف شامل (شهري / أسبوعي / بالساعة)
- ⏰ استيراد بيانات الحضور من أجهزة ZKTeco
- 💰 محرك رواتب مصري (تأمينات 11% + ضريبة دخل 2025)
- 📅 إدارة إجازات متوافقة مع قانون العمل
- 📊 لوحة معلومات وتقارير
- 🔐 صلاحيات (RBAC) + تسجيل تدقيق
- 🌍 ثنائي اللغة (عربي / إنجليزي) + RTL
- 📄 إنشاء PDF عربي (مفردات مرتب، خطابات)

</div>

## Overview (English)

A production-grade Human Resources Management System tailored for Egyptian manufacturing companies. Compliant with **Egyptian Labor Law No. 12/2003** and **Social Insurance Law No. 148/2019**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + NestJS |
| Database | PostgreSQL 15 + Prisma ORM |
| Auth | JWT + RBAC |
| File Storage | S3-compatible (MinIO) |
| PDF Generation | Puppeteer + Arabic fonts |
| Excel Export | ExcelJS |
| Charts | Recharts |
| Deployment | Docker Compose |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)

### Development Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd hr-basem-azab-hrms

# 2. Start infrastructure
docker compose up -d postgres redis minio

# 3. Backend setup
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev

# 4. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Docker Compose (Full Stack)

```bash
docker compose up -d --build
```

### Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Swagger Docs | http://localhost:3001/api/docs |
| MinIO Console | http://localhost:9001 |

### Login Credentials

| User | Username | Password | Role |
|------|----------|----------|------|
| مدير النظام | `admin` | `admin123` | Super Admin |
| مسؤول HR | `hr` | `hr123` | HR Manager |

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://hrms:hrms_password@localhost:5432/hrms_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-in-production
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=hrms_minio
MINIO_SECRET_KEY=hrms_minio_password
MINIO_BUCKET=hrms-documents
FRONTEND_URL=http://localhost:3000
PORT=3001
```

## Project Structure

```
hr-basem-azab-hrms/
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication & RBAC
│   │   ├── companies/     # Multi-company support
│   │   ├── employees/     # Employee master data
│   │   ├── attendance/    # Attendance + ZKTeco import
│   │   ├── leave/         # Leave management
│   │   ├── payroll/       # Payroll engine
│   │   ├── reports/       # Dashboard & reports
│   │   ├── prisma/        # Database service
│   │   └── common/        # Shared utilities
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # UI components
│   │   └── lib/           # Utilities & API client
│   └── Dockerfile
├── docs/
├── docker-compose.yml
└── README.md
```

## Payroll Calculation (Egyptian Rules)

### Social Insurance (Law 148/2019)
- Employee: **11%** on insurable wage
- Employer: **18.75%** on insurable wage

### Income Tax (2025 Brackets)
| Bracket (EGP/year) | Rate |
|--------------------|------|
| 0 – 40,000 | 0% |
| 40,001 – 55,000 | 10% |
| 55,001 – 70,000 | 15% |
| 70,001 – 200,000 | 20% |
| 200,001 – 400,000 | 22.5% |
| 400,001 – 600,000 | 25% |
| 600,001+ | 27.5% |

Personal exemption: **EGP 20,000/year**

### Leave Entitlements (Labor Law 12/2003)
- Annual: 21 days (< 10 yrs), 30 days (≥ 10 yrs or > 50 yrs old)
- Casual: 6 days/year (max 2 consecutive)
- Sick: Per medical certificate
- Maternity: 4 months (max 3 times)
- Hajj: 1 month (once in service)

## License

Proprietary — HR BASEM AZAB © 2025
