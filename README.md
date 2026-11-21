# Doomsday Ready

> **Blinto Talent Accelerator 2027 — Full-Stack Developer Assessment**  
> A full-stack planning and calculation application built for Marvel Cinematic Universe (MCU) fans preparing for *Avengers: Doomsday*.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-12.0-red?logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌐 Live Deployments & API Documentation

- **Frontend Application**: [https://doomsday-ready.vercel.app](https://doomsday-ready-lovat.vercel.app)
- **Backend REST API**: [https://doomsday-ready-api-j3u7.onrender.com/api](https://doomsday-ready-api-j3u7.onrender.com/api)
- **Interactive Swagger API Docs**: [https://doomsday-ready-api-j3u7.onrender.com/api/docs](https://doomsday-ready-api-j3u7.onrender.com/api/docs)

---

## 1. Project Overview & Capabilities

**Doomsday Ready** provides two core calculation and planning capabilities:

1. **Movie Dependency & Prerequisite Rewatch Planner**:
   - Manage MCU movies (create, list, edit, mark as watched/unwatched).
   - Configure directed prerequisite relationships between movies.
   - **Prevent circular dependencies**: Detects and rejects both direct and transitive cyclic dependencies prior to committing data, returning HTTP `409 Conflict` with error code `CIRCULAR_DEPENDENCY`.
   - **Topological Rewatch Order Calculation**: Computes an authoritative watch order for any target movie using Depth-First Search (DFS) post-order traversal where all prerequisites appear before any movie depending on them.
   - Computes watched progress (`watchedCount / totalCount`) and sums the unwatched runtime in hours and minutes.

2. **Watch-Party Seat Booking Calculator**:
   - Manage cinemas and configure available seat-bundle sizes (1–10 unique sizes, 1–500 seats each).
   - Solves the **unbounded minimum-bundle dynamic programming algorithm** for a requested group size (1–10,000 seats).
   - Returns the fewest possible total bundles that sum **exactly** to the requested party size, or clearly indicates when no exact combination is possible (rejects approximate solutions).

---

## 2. Technology Stack

### Backend (`apps/api`)
- **Runtime & Framework**: Node.js v20+, NestJS v12 (TypeScript)
- **Database & ORM**: PostgreSQL, Prisma ORM v7
- **Validation**: `class-validator`, `class-transformer`
- **Documentation**: Swagger / OpenAPI (`/api/docs`)
- **Testing**: Jest (Unit, Algorithm, Service, Filter, Controller tests)

### Frontend (`apps/web`)
- **Framework & Bundler**: React 18, Vite 6, TypeScript
- **Styling**: Tailwind CSS, custom Marvel/Avengers-themed glassmorphism dark mode
- **Routing**: React Router v6
- **Server State Management**: TanStack React Query v5
- **Form Handling & Validation**: React Hook Form, Zod
- **Icons**: Lucide React

---

## 3. High-Level Architecture

```text
Browser (React + Vite SPA)
  │
  │ HTTP REST (JSON)
  ▼
NestJS REST API (Global prefix: /api)
  │
  ├── MoviesModule
  │     ├── MoviesController & Validation DTOs
  │     ├── MoviesService (Orchestrator & Transactions)
  │     └── Algorithms:
  │           ├── DependencyGraph & DFS Cycle Detection (3-Color Node Marking)
  │           └── Topological Rewatch Order Generator
  │
  ├── CinemasModule
  │     ├── CinemasController & Validation DTOs
  │     ├── CinemasService (Orchestrator)
  │     └── Algorithms:
  │           └── Unbounded Minimum-Bundle Dynamic Programming (Coin Change)
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL Database
```

---

## 4. Database Schema (Bonus)

```mermaid
erDiagram
    Movie ||--o{ MoviePrerequisite : "has prerequisites"
    Movie ||--o{ MoviePrerequisite : "is prerequisite for"

    Movie {
        UUID id PK
        String title UK "unique, indexed"
        Int releaseYear "positive integer"
        Int runtimeMinutes "range: 1 - 300"
        Boolean watched "default: false"
        DateTime createdAt
        DateTime updatedAt
    }

    MoviePrerequisite {
        UUID movieId PK, FK "references Movie(id) on delete cascade"
        UUID prerequisiteId PK, FK "references Movie(id) on delete cascade"
    }

    Cinema {
        UUID id PK
        String name UK "unique, indexed"
        Int[] bundleSizes "array: 1 - 10 sizes, 1 - 500"
        DateTime createdAt
        DateTime updatedAt
    }
```

Detailed database architecture and integrity rules are documented in [`docs/database-schema.md`](docs/database-schema.md).

---

## 5. Algorithm Implementations

Per assessment requirements, both core algorithms are custom-built pure TypeScript implementations without graph or coin-change third-party libraries:

### 5.1 Movie Dependency Graph, Cycle Detection & Topological Order
- **Adjacency Representation**: Directed graph $\mathcal{G} = (V, E)$ where each directed edge $u \to v$ denotes that movie $u$ requires prerequisite $v$.
- **Cycle Detection**:
  - Implements **DFS 3-color node visitation states**:
    - `0 (Unvisited)`: Node not yet discovered.
    - `1 (Visiting)`: Node currently on the active DFS recursion stack.
    - `2 (Visited)`: Node and all its subtrees have been fully processed.
  - If DFS encounters a node marked as `Visiting`, a cycle exists. The path is extracted and returned with HTTP `409 Conflict` and `CIRCULAR_DEPENDENCY`.
- **Topological Sorting**:
  - DFS post-order traversal naturally produces a valid prerequisite-first order.
  - Target movie is excluded from the returned list and statistical calculations.
  - Visited set tracking guarantees each transitive prerequisite appears **exactly once**, regardless of how many dependency paths reach it.

### 5.2 Minimum-Bundle Watch-Party Seat Calculation
- **Formulation**: Unbounded dynamic programming (minimum coin change formulation).
- Let $dp[x]$ represent the minimum number of bundles required to make exactly $x$ seats:
  $$dp[x] = \min_{s \in \text{bundleSizes}, s \le x} \left( dp[x - s] + 1 \right)$$
  with base case $dp[0] = 0$ and $dp[x] = \infty$ for all $x > 0$.
- **Quantity Reconstruction**:
  - A predecessor array tracks the chosen bundle size $s$ that produced the minimum for state $x$.
  - After completing DP up to `groupSize`, the solution backtracks to reconstruct the exact quantities of each bundle size.
- **Strict Exact Match**:
  - If $dp[\text{groupSize}] = \infty$, the algorithm returns `{ possible: false, totalBundles: null, bundles: [], totalSeats: null }`.
  - No approximate solutions (overflow or shortfall) are accepted.

---

## 6. API Endpoint Summary

All routes are prefixed with `/api`. Complete request/response schemas are documented in [`docs/api-contract.md`](docs/api-contract.md).

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/movies` | Create movie and link initial prerequisites | `201`, `400`, `409` |
| `GET` | `/api/movies` | List all movies sorted by release year | `200` |
| `GET` | `/api/movies/:id` | Get movie details by UUID | `200`, `404` |
| `PATCH`| `/api/movies/:id` | Update movie details, prerequisites, or watched status | `200`, `400`, `404`, `409` |
| `GET` | `/api/movies/:id/rewatch-order` | Calculate prerequisite-first rewatch roadmap & stats | `200`, `404`, `409` |
| `POST` | `/api/cinemas` | Create cinema with 1–10 seat bundle sizes (1–500 seats) | `201`, `400`, `409` |
| `GET` | `/api/cinemas` | List all cinemas sorted by name | `200` |
| `GET` | `/api/cinemas/:id` | Get cinema details by UUID | `200`, `404` |
| `GET` | `/api/cinemas/:id/booking?groupSize=X` | Calculate minimum bundles for exact watch-party seats | `200`, `400`, `404` |
| `GET` | `/api/health` | Service health check | `200` |

Interactive Swagger documentation is available at **`http://localhost:3000/api/docs`** when the API is running.

---

## 7. Prerequisites & Environment Setup

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL**: v14+ (local instance, cloud instance such as Neon, or Docker)

### Environment Variables

#### Backend (`apps/api/.env`)
Copy `.env.example` to `.env`:
```bash
cp api/.env.example api/.env
```
Configure your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/doomsday_ready?schema=public"
PORT=3000
```

#### Frontend (`apps/web/.env`)
Copy `.env.example` to `.env`:
```bash
cp web/.env.example web/.env
```
Configure the API base URL:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 8. Local Setup & Startup Instructions

### 8.1 Install Dependencies
```bash
# Install backend dependencies
cd api && npm install

# Install frontend dependencies
cd ../web && npm install
```

### 8.2 Database Setup & Migrations
```bash
cd api
# Run Prisma migrations
npx prisma migrate deploy

# Seed required challenge movies and cinemas
npm run seed
```

### 8.3 Start Applications

#### Terminal 1 — Backend API
```bash
cd api
npm run start:dev
# Running on: http://localhost:3000/api
# Swagger Docs: http://localhost:3000/api/docs
```

#### Terminal 2 — Frontend Web
```bash
cd web
npm run dev
# Running on: http://localhost:5173
```

---

## 9. Docker Compose Quickstart (Bonus)

To run the entire stack (PostgreSQL, NestJS API, and React frontend) with a single command:

```bash
docker compose up --build
```

- **Frontend Application**: `http://localhost:5173` (Production: `[YOUR_FRONTEND_URL]`)
- **Backend REST API**: `http://localhost:3000/api` (Production: [https://doomsday-ready-api-j3u7.onrender.com/api](https://doomsday-ready-api-j3u7.onrender.com/api))
- **Swagger Documentation**: `http://localhost:3000/api/docs` (Production: [https://doomsday-ready-api-j3u7.onrender.com/api/docs](https://doomsday-ready-api-j3u7.onrender.com/api/docs))
- **PostgreSQL Database**: `localhost:5432`

---

## 10. Automated Testing & Verification

The test suite covers pure algorithm logic, service orchestration, controller routing, error handling filters, and edge cases.

### Run Backend Unit & Integration Tests
```bash
cd api
npm test
```

### Test Results Summary
```text
Test Suites: 11 passed, 11 total
Tests:       69 passed, 69 total
Snapshots:   0 total
```

Key test suites:
- `dependency-graph.spec.ts`: Direct cycles, transitive indirect cycles, diamond dependencies, self-loops.
- `rewatch-order.spec.ts`: Topological ordering, duplicate exclusion, watched count, unwatched runtime accumulation, empty prerequisites.
- `minimum-bundles.spec.ts`: Exact bundle combinations (`[1, 3, 4] -> 6`, `[2, 5] -> 11`, `[6, 9, 20] -> 44`), impossible configurations (`[4, 6] -> 7`), boundary values (10,000 seats).
- `movies.service.spec.ts` & `cinemas.service.spec.ts`: Database transaction isolation, rollback on cycle detection, uniqueness validation.
- `http-exception.filter.spec.ts`: Standardized error payload formatting, suppressing stack traces in production.

### Run Frontend Production Build & Typecheck
```bash
cd web
npm run build
# tsc -b && vite build
# ✓ 1681 modules transformed (0 errors)
```

---

## 11. AI Tools Documentation

As required by the assessment guidelines, this section provides an honest and detailed account of how AI assistance was utilized throughout the development lifecycle:

1. **Frontend Architecture & UI Design**:
   - I used AI tools to assist in architecting the frontend design, layout responsiveness, UI component hierarchy, and custom feedback states.
   - Designed a polished Marvel/Avengers-themed glassmorphism aesthetic using Tailwind CSS with crimson red accents and cyan status badges.
   - Refined mobile and laptop viewports: diagnosed and resolved modal clipping on smaller viewports by implementing sticky action footers (`sticky bottom-0`) so "Save Changes" and "Cancel" buttons remain accessible even when validation errors or long prerequisite lists expand the modal.

2. **Schema & DTO Synchronization**:
   - Used AI assistance to align DTO validation rules in NestJS (`class-validator`) with frontend form validation schemas (`Zod`), guaranteeing consistent constraints for release years, runtimes (1–300 minutes), and bundle sizes (1–500 seats).

3. **Algorithm & Test Verification**:
   - Drafted comprehensive test matrices for the custom DFS 3-color cycle detection and unbounded dynamic programming algorithms, ensuring all edge cases specified in the PRD (such as diamond dependencies and non-greedy bundle selection) pass rigorous automated tests.

4. **Documentation Generation**:
   - Assisted in formatting and structuring the comprehensive PRD, API contract specifications, database schema diagrams (Mermaid), and setup documentation.

---

## 12. Assumptions & Trade-offs

1. **Single-User Scope**: Consistent with Section 3 of the PRD, authentication, user sessions, and multi-tenant isolation were intentionally omitted to maintain focus on the core planning and calculation algorithms.
2. **Runtime Constraint Interpretation**: The specification statement *"Release year and runtime in minutes: 1–300"* is interpreted as the constraint on `runtimeMinutes` (1–300), while `releaseYear` is validated as a positive integer (e.g. 2008), which fits modern MCU film dates.
3. **Database Selection**: Configured for PostgreSQL (with Neon cloud compatibility or local containerized PostgreSQL) utilizing Prisma's native `Int[]` support for cinema bundle sizes.
4. **Authoritative Calculation Boundary**: The frontend delegates all rewatch graph ordering, statistics, and booking bundle distributions directly to the backend API, maintaining a strict single source of truth.

---

## 13. License

Distributed under the MIT License. Built for the Blinto Talent Accelerator 2027 Full-Stack Developer Assessment.
