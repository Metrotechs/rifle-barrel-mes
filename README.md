# 🔫 Rifle Barrel Shop-Floor MES

A modern Manufacturing Execution System (MES) for tracking rifle barrel production from drilling to final QC. Built with TypeScript, NestJS, React, and PostgreSQL.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19.1-61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E)

## 🎯 Project Mission

Build a tablet-friendly Manufacturing Execution System that tracks rifle-barrel production from first drilling to final QC while exposing live inventory and work-in-process (WIP) data to external e-commerce platforms via an API.

## ✨ Key Features

### 🏭 Production Management
- **11-Station Workflow** - Track barrels through Drilling, Reaming, Rifling, Heat Treat, Lapping, Honing, Fluting, Chambering, Inspection, Finishing, and Final QC
- **Real-time Status Tracking** - See barrel status update instantly across all connected devices
- **Operation Timer** - Track time spent on each operation with start/pause/complete functionality
- **Priority Management** - Set High/Medium/Low priority for production sequencing
- **Multi-Tablet Sync** - BroadcastChannel API enables real-time sync across browser tabs/devices

### 👥 User & Access Management
- **Role-Based Access Control** - Admin, Supervisor, and Operator roles with different permissions
- **Station Assignments** - Operators can only access their assigned stations
- **User Impersonation** - Admins/supervisors can impersonate operators for troubleshooting
- **Comprehensive Admin Panel** - Manage users, view analytics, assign stations

### 🔍 Quality Control & Inspection
- **Inspection Logging** - Record dimensional measurements (bore diameter, groove diameter)
- **Specification Tracking** - Auto-validate measurements against min/max specs
- **Defect Management** - Log defects with type, severity, location, and description
- **Hold/Quarantine System** - Place barrels on hold with reason, release with notes
- **QC Dashboard** - View pass rates, inspections, and barrels on hold

### 📊 Analytics & Reporting
- **Production Metrics** - Total WIP, completed today, in-progress counts
- **Barrel Process Tracking** - Visual progress bars showing completion percentage
- **Operation History** - Full audit trail of who did what and when
- **QC Statistics** - Pass rate, total inspections, defect trends

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React PWA      │    │   NestJS API    │    │  PostgreSQL     │
│  (Frontend)     │◄──►│   (Backend)     │◄──►│  (Database)     │
│  Port: 5173     │    │   Port: 3001    │    │  Port: 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│  BroadcastChannel│    │  WebSocket      │
│  (Tab Sync)     │    │  (Real-time)    │
└─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **NestJS** v11 - Modular Node.js framework
- **TypeORM** - Database ORM with PostgreSQL  
- **Socket.IO** - Real-time WebSocket communication
- **Class Validator** - DTO validation
- **JWT** - Authentication ready

### Frontend
- **React 19** - Modern UI framework with hooks
- **Vite 7** - Fast development and build tool
- **Ant Design 5** - Enterprise-grade UI components
- **Tailwind CSS** - Utility-first styling
- **TypeScript 5** - Full type safety
- **LocalStorage** - Offline data persistence

### Database
- **PostgreSQL 15** - Primary database with JSONB support
- **UUID** primary keys for distributed systems
- **Enum types** for type safety

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+ (for backend mode)
- npm or pnpm

### Option 1: Frontend Only (Demo Mode)
The frontend can run standalone with mock data - perfect for demos and UI development.

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` - The app runs with localStorage persistence.

**Demo Credentials:**
| Username | Role | Notes |
|----------|------|-------|
| `admin` | Admin | Full system access |
| `supervisor` | Supervisor | All stations + user management |
| `drill_op` | Operator | Assigned to Drilling station |
| `ream_op` | Operator | Assigned to Reaming station |

*Password: Any 3+ characters*

### Option 2: Full Stack (Production)

#### 1. Setup Database
```bash
createdb rifle_barrel_mes
```

#### 2. Configure Environment
```bash
# backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=rifle_barrel_mes
```

#### 3. Start Backend
```bash
cd backend
npm install
npm run start:dev
```

#### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🏭 Manufacturing Workflow

| Step | Station | Description | Key Data Captured |
|------|---------|-------------|-------------------|
| 1 | Drilling | Initial barrel blank drilling | Caliber, length, material |
| 2 | Reaming | Precision bore reaming | Reamer size |
| 3 | Rifling | Button/cut/hammer-forged | Twist rate, method |
| 4 | Heat Treat | External stress relief | Vendor, duration |
| 5 | Lapping | Hand/machine lapping | Surface finish |
| 6 | Honing | Optional polishing | Polish grade |
| 7 | Fluting | External barrel fluting | Flute pattern, count |
| 8 | Chambering | CNC chambering & threading | Chamber specs |
| 9 | Inspection | QC with bore scope & gauging | Dimensional measurements |
| 10 | Finishing | Nitride, Cerakote coating | Coating type |
| 11 | Final QC | Final quality verification | Pass/Fail, ship status |

## 📱 User Interface

### Main Dashboard
- **Metrics Cards** - Live WIP, completed, and in-progress counts
- **Station View** - See all barrels at current station
- **Operation Controls** - Start, pause, complete operations
- **Quick Actions** - New barrel, refresh, tracking

### Quality Control Dashboard
- **Pass Rate** - Overall inspection success percentage
- **Hold Queue** - Barrels currently quarantined
- **Inspection Form** - Record measurements and defects
- **Defect Tracking** - Log issues with severity levels

### Admin Panel
- **User Management** - Create, edit, deactivate users
- **Station Assignments** - Assign operators to stations
- **System Analytics** - Overview of system usage
- **Impersonation** - Debug user-specific issues

## 🔌 API Endpoints

### Barrels
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/barrels` | Create new barrel |
| GET | `/api/v1/barrels` | List all barrels |
| GET | `/api/v1/barrels/:id` | Get barrel details |
| PUT | `/api/v1/barrels/:id/start` | Start operation |
| PUT | `/api/v1/barrels/:id/complete` | Complete operation |
| PUT | `/api/v1/barrels/:id/hold` | Place on hold |

### Stations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stations` | List all stations |
| GET | `/api/v1/stations/:id/queue` | Get station work queue |
| POST | `/api/v1/stations/initialize` | Initialize default stations |

### Quality Control
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/inspections` | Record inspection |
| GET | `/api/v1/inspections/:barrelId` | Get barrel inspections |
| GET | `/api/v1/qc/stats` | Get QC statistics |

## 📁 Project Structure

```
rifle-barrel-mes/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   ├── index.css        # Global styles & Ant Design overrides
│   │   └── main.tsx         # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # NestJS backend API
│   ├── src/
│   │   ├── barrels/         # Barrel module (controller, service, DTOs)
│   │   ├── stations/        # Station module
│   │   ├── entities/        # TypeORM entities
│   │   └── events/          # WebSocket gateway
│   ├── package.json
│   └── nest-cli.json
├── apps/                     # Additional apps (docs, web)
├── packages/                 # Shared packages
└── README.md
```

## 🔒 Security Features

- **Role-Based Access Control** - Operators can only access assigned stations
- **Operation Ownership** - Only the operator who started an operation can complete it
- **Audit Trail** - All operations logged with user, timestamp, and tablet ID
- **Impersonation Logging** - Track when admins impersonate other users

## 🚧 Roadmap

### Completed ✅
- [x] Multi-station barrel tracking
- [x] Real-time sync across devices
- [x] User authentication & roles
- [x] Station-based access control
- [x] Quality control & inspection
- [x] Hold/quarantine system
- [x] Operation timer & history

### Planned 📋
- [ ] Material lot/heat number tracking
- [ ] Work order management
- [ ] Tool life tracking
- [ ] Production reports & analytics
- [ ] Work instructions (SOPs)
- [ ] Photo attachments for defects
- [ ] Barcode/QR scanning
- [ ] E-commerce API integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for modern manufacturing. Ready to track those barrels! 🎯
