🛠️ Copilot Instructions – Rifle Barrel Shop‑Floor MES

## 🎯 **PROJECT STATUS: FRONTEND COMPLETE & FUNCTIONAL** ✅
- **Last Updated:** July 13, 2025
- **Current State:** Fully working React frontend with all buttons functional
- **Running on:** http://localhost:5176 
- **Next Phase:** Ba8 – Step‑by‑Step Tasks for Copilot

## 📊 **CURRENT PROJECT STATUS** (Updated July 13, 2025)

### ✅ **PHASE 1 COMPLETE: Frontend MES Application**
- **Status:** FULLY FUNCTIONAL ✅
- **Running on:** http://localhost:5176
- **Repository:** c:\Users\richa\Documents\GitHub\Warehouse Workflow\rifle-barrel-mes\frontend
- **Tech Stack:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui

### ✅ **IMPLEMENTED FEATURES**
1. **Complete 10-Station Workflow** - Drilling → Reaming → Rifling → Heat Treat → Lapping → Honing → Chambering → Inspection → Finishing → Final QC
2. **Barrel Management** - Create, track, and manage rifle barrels with caliber/length/twist specifications
3. **Operation Control** - Start/Pause/Complete operations with real-time timer tracking
4. **Station Queues** - Priority-based barrel sorting (High/Medium/Low) per manufacturing station
5. **Modal Interfaces** - Active operation popup with semi-transparent backdrop
6. **Data Persistence** - localStorage-based data storage with audit trail
7. **Toast Notifications** - User feedback for all actions and state changes
8. **Responsive Design** - Tablet-optimized interface for shop floor use
9. **Status State Machine** - Automatic progression through manufacturing stages

### ✅ **VERIFIED WORKING BUTTONS**
- ✅ Start Operation (begins timer, updates status)
- ✅ Pause/Resume Operation (timer control)
- ✅ Complete Operation (transitions to next station)
- ✅ Create New Barrel (form submission)
- ✅ Station Navigation (queue switching)
- ✅ Priority Management (barrel sorting)

### 🚧 **NEXT DEVELOPMENT PHASE: Backend Integration**
1. **NestJS API Server** - Replace mock API with real database
2. **PostgreSQL Database** - Persistent data storage with proper schema
3. **Socket.IO Real-time** - Live updates across multiple tablets
4. **Authentication** - Operator login with JWT tokens
5. **E-commerce API** - Inventory sync for external platforms
6. **AWS Deployment** - Production infrastructure

### 📋 **DEVELOPMENT NOTES**
- Frontend codebase is clean, well-structured, and TypeScript error-free
- Mock API service ready for backend replacement
- Component architecture supports real-time updates
- UI/UX optimized for manufacturing environment
- Ready for backend development phase

## ✅ **COMPLETED TASKS (Frontend Phase)**

### React Frontend Implementation ✅ DONE
✅ Created rifle-barrel-mes project with Vite + React 18 + TypeScript + Tailwind CSS
✅ Implemented all UI components using shadcn/ui (Button, Card, Input, Select, Textarea)  
✅ Built complete 10-station manufacturing workflow (Drilling → Final QC)
✅ Created functional mock API service with localStorage persistence
✅ Implemented timer system with Start/Pause/Complete operations
✅ Added barrel creation form with priority system (High/Medium/Low)
✅ Built station queue management with priority-based sorting
✅ Created modal popups for active operations with backdrop blur
✅ Added toast notifications for user feedback
✅ Implemented responsive tablet-friendly design
✅ Added operation logging and audit trail
✅ **ALL BUTTONS FUNCTIONAL** - Application fully working on http://localhost:5176

## 🚧 **NEXT PHASE: Backend Development**

Copy/paste these as chat prompts or commit‑messages to get boilerplate generated.nd API development

1 – Project Mission

Build a tablet‑friendly Manufacturing Execution System (MES) that tracks rifle‑barrel production from first drilling to final QC while exposing live inventory and work‑in‑process (WIP) data to external e‑commerce platforms via an API.opilot Instructions – Rifle Barrel Shop‑Floor MES

1 – Project Mission

Build a tablet‑friendly Manufacturing Execution System (MES) that tracks rifle‑barrel production from first drilling to final QC while exposing live inventory and work‑in‑process (WIP) data to external e‑commerce platforms via an API.

2 – High‑Level Workflow

Seq

Station

Core Action

Notes

1

Drilling

Barrel blank drilled & registered in system

Scan/enter barrel ID & caliber; start timer

2

Reaming

Precision ream bore

Record reamer size; timer

3

Rifling

Button / cut / hammer‑forged

Capture twist rate & rifling method

4

Heat Treat

External vendor

Mark as Out for HT; auto‑pause shop timers

5

Lapping

Hand/lap machine

Measure surface finish

6

Honing / Polishing

Optional

7

Chambering & Threading

CNC lathe

8

Inspection (QC)

Bore scope, air‑gauging, headspace

9

Finishing / Coating

Nitride, Cerakote, etc.

10

Final QC & Inventory

Mark Ready to Ship and push to e‑commerce

Each station owns a tablet that shows its work queue. Operators can Start, Pause/Resume, and Complete a job. Completion automatically releases the job to the next station.

3 – Core Functional Requirements

Barrel Creation

Unique barrel_id (UUID + optional serial / barcode).

Initial status DRILLING_PENDING.

Station Timer

Record started_at, paused_at, resumed_at, completed_at per operation.

Compute cycle time and cumulative lead time.

Queue Management

Tablet pulls jobs where status = <station>_PENDING.

On Complete, status transitions to <next_station>_PENDING.

Exception Handling

Operator can flag REWORK, SCRAP, or HOLD with notes & images.

Real‑Time Dashboards

Supervisor view: WIP counts, bottlenecks, average cycle‑time per station.

E‑commerce Sync

Expose public API (/v1/barrels/inventory) showing available inventory by barrel type & twist.

Webhook listener to auto‑allocate barrels to customer orders.

Audit Trail

Immutable log of every status change (user, timestamp, notes).

4 – Suggested Tech Stack

Layer

Choice

Rationale

Frontend

React 18 + Vite PWA + Tailwind + shadcn/ui

Fast dev, offline tablet support

State Sync

TanStack Query + WebSocket channel

Instant queue updates

Backend

NestJS (v10) + TypeORM

Opinionated, modular, Typescript end‑to‑end

DB

PostgreSQL 15 (AWS RDS)

Strong relational integrity, UUID, JSONB

Auth

Clerk JWT (or AWS Cognito)

Passwordless for operators

Real‑time

Socket.IO gateway in NestJS (or Supabase Realtime)

Live dashboards

Infra as Code

AWS CDK (TypeScript)

Repeatable infra

CI/CD

GitHub Actions → AWS ECS Fargate

Build, test, deploy on main

Feel free to swap FastAPI + SQLModel if Python is preferred.

5 – Domain Model Sketch

classDiagram
    class Barrel {
        +UUID id
        caliber: string
        length_in: int
        twist: string
        status: BarrelStatus
        created_at
        updated_at
    }
    class Station {
        +UUID id
        name
        sequence:int
    }
    class OperationLog {
        +UUID id
        barrel_id
        station_id
        operator_id
        started_at
        completed_at
        duration_sec
        notes
        exception_code
    }
    class InventorySnapshot {
        barrel_type
        qty_available
        last_synced
    }
    Barrel "1" --o "*" OperationLog
    Station "1" --o "*" OperationLog

6 – API Contract (REST‑first, later GraphQL)

Method

Endpoint

Purpose

POST

/barrels

Register new drilled barrel

PUT

/barrels/{id}/start

Start operation (station auto‑assigned by auth token)

PUT

/barrels/{id}/pause

Pause timer

PUT

/barrels/{id}/complete

Finish current operation

GET

/stations/{id}/queue

List pending barrels for station

GET

/dashboard/metrics

Cycle‑time & WIP KPIs

GET

/public/inventory

Read‑only feed for e‑commerce

Use JWT scopes: station:* for tablets, dashboard:read, public:read.

7 – Frontend Screens (React Components)

LoginScreen — quick PIN or badge scan.

QueueScreen — list of barrels, search, sort, pick next.

TimerScreen — big Start / Pause / Complete buttons, live stopwatch, defect notes.

DashboardScreen — real‑time charts (cycle‑time, bottlenecks).

Use localForage to persist offline actions if Wi‑Fi drops.

8 – Step‑by‑Step Tasks for Copilot

Copy/paste these as chat prompts or commit‑messages to get boilerplate generated.

Bootstrap monorepo

pnpm create turbo@latest barrel‑mes

Generate NestJS service

nest new backend --package‑manager pnpm
cd backend && pnpm add @nestjs/typeorm typeorm pg class‑validator class‑transformer

Define entities: Barrel, Station, OperationLog with UUID primary keys.

Implement BarrelsService with state‑machine transitions (enum → next enum).

Add Socket.IO gateway to emit operation.completed events.

Spin up React PWA

pnpm create vite frontend -- --template react‑ts
cd frontend && pnpm add @tanstack/react‑query socket.io‑client shadcn‑ui

Build QueueScreen that fetches /stations/:id/queue every 30 s (or via WebSocket).

Wire TimerScreen — leverage useStopwatch hook (make one) to handle pause/resume.

Create Inventory sync job (cron: 5 min) that aggregates available barrels and pushes to /public/inventory cache table, then triggers webhook to Shopify/WooCommerce/etc.

Write unit tests with Jest + Supertest for all API endpoints.

Author CDK stack for RDS, ECS Fargate, and S3 static site.

Configure GitHub Actions: lint, test, build Docker, deploy CDK.

9 – Stretch Goals

Machine‑data capture: OPC UA or MTConnect adapter for CNCs to auto‑start/stop timers.

Barcode / RFID scanning via tablet camera or BLE scanner.

Predictive ETA to e‑commerce (display "Ships in ⌀ 3 days").

PowerBI / Grafana dashboards over TimescaleDB hypertables.

Offline‑first PWA to keep working during network outages.

10 – Definition of Done

All stations can track cycle‑time end‑to‑end with < 2 s latency.

Supervisors see live WIP & bottleneck report.

Inventory API feeds e‑commerce (Shopify, BigCommerce, Ecwid, & WooCommerce) with ≤ 5 min lag.

Unit‑test coverage ≥ 80 %.

One‑click AWS deployment via GitHub Actions.