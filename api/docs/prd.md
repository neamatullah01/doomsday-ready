# Product Requirements Document (PRD)

## Doomsday Ready --- Full-Stack Application

**Project:** Blinto Talent Accelerator 2027 --- Full-Stack Developer
Internship Assessment\
**Document purpose:** Single source of truth for the developer and AI
coding agent\
**Status:** Implementation-ready MVP specification\
**Recommended stack:** NestJS + TypeScript + Prisma + PostgreSQL
(backend); React + TypeScript + Vite + Tailwind CSS (frontend)

------------------------------------------------------------------------

## 1. Product overview

Doomsday Ready is a small full-stack application for Marvel Cinematic
Universe (MCU) fans preparing to watch *Avengers: Doomsday*.

The application has two core capabilities:

1.  **Movie planning:** Users manage movies, define which movies must be
    watched first, mark movies as watched, and request a valid rewatch
    order for a selected target movie.
2.  **Watch-party booking calculation:** Users manage cinemas and their
    available seat-bundle sizes, then calculate the fewest bundles that
    provide exactly the requested group size.

The React frontend exposes three views:

-   Movies
-   Rewatch Plan
-   Booking

This is a calculation and planning application. It is **not** a real
ticket purchasing or reservation platform.

## 2. Goals and success criteria

### 2.1 Goals

-   Allow users to create and update MCU movie records.
-   Allow users to define and edit prerequisite relationships between
    movies.
-   Prevent circular movie dependencies.
-   Calculate all prerequisite movies for a target, exactly once and in
    a valid prerequisite-first order.
-   Report how many prerequisite movies are already watched and the
    total runtime of prerequisite movies that remain unwatched.
-   Allow users to create and list cinemas with their seat-bundle sizes.
-   Calculate an exact group-seat total using the minimum possible
    number of bundles.
-   Clearly report when an exact bundle combination does not exist.
-   Provide a usable React interface for all three required views.
-   Provide clear setup, API, data-model, testing, and AI-usage
    documentation.

### 2.2 Out of scope

Do not implement these unless all required assessment functionality is
complete:

-   Authentication, registration, user roles, or RBAC.
-   Actual ticket purchases, payments, reservations, or booking
    persistence.
-   Seat maps, seat selection, cinema showtimes, or ticket prices.
-   Movie search integrations or external movie APIs.
-   Social features, reviews, comments, or watch-party chat.
-   Microservices, message queues, Redis, or other infrastructure not
    needed by this MVP.

## 3. Users and roles

The assessment does not require authentication or multiple roles. Treat
the application as a single-user planning tool.

There are no Admin, Customer, or other permission roles in the MVP. The
words "user" and "fan" in this document refer to the person using the
application, not an authenticated account.

## 4. Main application navigation

The frontend must provide three clearly accessible views:

1.  **Movies** --- create, list, edit, and mark movies as watched;
    manage prerequisites.
2.  **Rewatch Plan** --- choose a target movie and display its
    prerequisite watch order, watched progress, and remaining runtime.
3.  **Booking** --- create/list cinemas, enter a group size, and
    calculate the exact minimum bundle combination.

A shared application shell may contain the app name, navigation, page
title, and responsive content area.

## 5. Functional requirements

### 5.1 Feature 1 --- Movies and rewatch order

#### 5.1.1 Movie data

Each movie must contain:

  Field            Type               Required Rules
  ---------------- --------------- ----------- ---------------------------------------------
  id               UUID              Generated Primary identifier
  title            string                  Yes Must be unique; trim surrounding whitespace
  releaseYear      integer                 Yes Must be a positive integer
  runtimeMinutes   integer                 Yes Must be between 1 and 300 inclusive
  watched          boolean                  No Defaults to `false`; can be updated
  prerequisites    movie ID list            No Zero or more existing movies
  createdAt        datetime          Generated Creation timestamp
  updatedAt        datetime          Generated Last update timestamp

**Interpretation note:** The assessment states "Release year and runtime
in minutes: 1--300." This PRD interprets the 1--300 range as the runtime
constraint, because a release year of 1--300 would not be meaningful for
the supplied modern movie examples. Release year is therefore a positive
integer. If the evaluator expects another interpretation, document and
adjust it.

#### 5.1.2 Movie operations

-   Create a movie.
-   List all movies.
-   Update movie details.
-   Update the watched flag.
-   Add, replace, or remove prerequisite relationships during an update.
-   The target movie itself must never be included in its own
    prerequisite list.
-   Reject unknown prerequisite IDs.
-   Enforce unique movie titles.
-   Do not silently create duplicate movie records.

The assessment explicitly lists POST, GET, and PATCH operations. A
delete operation is not required.

#### 5.1.3 Rewatch order behavior

Given a target movie:

1.  Find every transitive prerequisite of the target.
2.  Include each prerequisite movie exactly once, even if multiple
    dependency paths reach it.
3.  Do not include the target movie itself.
4.  Return an order in which every prerequisite appears before any movie
    that depends on it.
5.  Return the number of prerequisite movies marked as watched.
6.  Return the sum of `runtimeMinutes` for prerequisite movies whose
    `watched` value is `false`.

The target movie's own watched status and runtime are not included in
these calculations.

A valid order may differ from the sample order if all
prerequisite-before-dependent constraints are satisfied.

#### 5.1.4 Circular dependency validation

A movie must not depend on itself, either directly or through a chain of
other movies.

Reject any create or update operation that would introduce a cycle.
Return HTTP `409 Conflict` with error code:

`CIRCULAR_DEPENDENCY`

Examples:

-   Direct cycle: A requires A.
-   Indirect cycle: A requires B, B requires C, and C requires A.

Cycle validation must run against the proposed relationship changes
before they are committed. Failed updates must leave the previously
saved data unchanged.

#### 5.1.5 Required sample movie data

Use these records as seed/demo data. They are challenge sample data, not
a claim that this is an official MCU watch guide.

  Movie                                Prerequisites
  ------------------------------------ ----------------------------------------------
  Iron Man                             None
  Captain America: The First Avenger   None
  The Avengers                         Iron Man; Captain America: The First Avenger
  Captain America: Civil War           The Avengers
  Thor: Ragnarok                       None
  Avengers: Infinity War               Captain America: Civil War; Thor: Ragnarok
  Avengers: Endgame                    Avengers: Infinity War
  Avengers: Doomsday                   Avengers: Endgame

Expected behavior:

-   Rewatch order for Avengers: Doomsday contains all seven other sample
    movies, each exactly once, in a valid order.
-   Rewatch order for Captain America: Civil War contains Iron Man and
    Captain America: The First Avenger (in either order), followed by
    The Avengers.
-   Rewatch order for Thor: Ragnarok is an empty list.
-   Making Avengers: Endgame a prerequisite of Iron Man must fail with
    `409 CIRCULAR_DEPENDENCY`.

### 5.2 Feature 2 --- Cinemas and watch-party booking calculation

#### 5.2.1 Cinema data

Each cinema must contain:

  Field         Type               Required Rules
  ------------- --------------- ----------- -------------------------------------
  id            UUID              Generated Primary identifier
  name          string                  Yes Unique; trim surrounding whitespace
  bundleSizes   integer array           Yes Between 1 and 10 different sizes
  createdAt     datetime          Generated Creation timestamp
  updatedAt     datetime          Generated Last update timestamp

Each bundle size must be an integer from 1 through 500 inclusive. Bundle
sizes must be distinct. Sort them consistently when saving or returning
them.

#### 5.2.2 Cinema operations

-   Create a cinema.
-   List all cinemas.
-   Enforce unique cinema names.
-   Validate bundle-size count and values.
-   The assessment does not require cinema update or delete endpoints.

#### 5.2.3 Booking quote behavior

Input:

-   A valid cinema ID.
-   `groupSize`, an integer from 1 through 10,000 inclusive.

Output:

-   Whether an exact combination exists.
-   The minimum total number of bundles when a solution exists.
-   The quantity of each bundle size used.
-   The total seats represented by the selected bundles.

Rules:

-   The sum of selected bundle seats must equal `groupSize` exactly.
-   The application must minimize the **number of bundles**, not the
    number of unused seats or the number of bundle types.
-   Any bundle size may be used repeatedly.
-   If no exact combination exists, return a clear "not possible"
    result.
-   Do not return an approximate solution that provides too many or too
    few seats.

Required examples:

  Bundle sizes     Group size Expected result
  -------------- ------------ ---------------------------------------------------
  `[1, 3, 4]`               6 2 bundles: two bundles of 3
  `[2, 5]`                 11 4 bundles: one bundle of 5 and three bundles of 2
  `[6, 9, 20]`             44 4 bundles: one of 20, two of 9, one of 6
  `[4, 6]`                  7 Not possible

### 5.3 Feature 3 --- React frontend

The frontend must consume the backend API. It must not independently
reimplement the authoritative movie-order or booking algorithms.

#### 5.3.1 Movies view

Must support:

-   Displaying the movie list.
-   Creating a movie.
-   Editing a movie's title, release year, and runtime.
-   Selecting prerequisite movies when creating or editing a movie.
-   Marking a movie watched/unwatched.
-   Showing validation and API errors.
-   Showing loading, empty, and success states.

Suggested UI elements:

-   Movie list/table or cards.
-   Add Movie form/modal.
-   Edit Movie form/modal.
-   Prerequisite multi-select.
-   Watched checkbox or toggle.

#### 5.3.2 Rewatch Plan view

Must support:

-   Selecting a target movie.
-   Requesting the rewatch order from the API.
-   Displaying the returned movies in the returned order.
-   Showing each movie's watched status.
-   Showing progress as
    `watchedCount of totalPrerequisiteCount watched`.
-   Showing a progress bar.
-   Showing the total remaining runtime in a readable format (hours and
    minutes).
-   Handling a target with no prerequisites.
-   Handling a target that does not exist or an API error.

The frontend should refresh/re-request the plan after a watched status
change so progress and remaining runtime stay accurate.

#### 5.3.3 Booking view

Must support:

-   Listing available cinemas.
-   Creating a cinema with its bundle sizes.
-   Selecting a cinema.
-   Entering a group size.
-   Requesting a booking quote.
-   Displaying the minimum bundle count and the quantity of each bundle
    size.
-   Displaying a clear "Not possible" state when no exact combination
    exists.
-   Showing input validation, loading, empty, and API error states.

The interface must call this a **booking quote/calculation**, not a
completed reservation or purchased ticket.

#### 5.3.4 UX and accessibility

-   Responsive layout for desktop, tablet, and mobile.
-   Clear page navigation and labels.
-   Forms must show field-level validation messages.
-   Disable submit actions while a request is in progress.
-   Show useful error messages; do not expose stack traces.
-   Use semantic HTML and accessible form labels.
-   Confirm destructive actions if any optional delete functionality is
    added.

## 6. Technical architecture

### 6.1 Recommended stack

These are implementation recommendations, not additional requirements
from the assessment.

**Backend** - Node.js - NestJS - TypeScript - Prisma ORM - PostgreSQL -
NestJS validation using `class-validator` and `class-transformer`

**Frontend** - React - TypeScript - Vite - Tailwind CSS - shadcn/ui
(optional component library) - TanStack Query for server state
(recommended) - React Hook Form + Zod for forms (recommended)

**Testing** - Jest for backend unit/integration tests (or the NestJS
default test setup). - React Testing Library for frontend component
tests if time permits. - Supertest for API end-to-end tests.

Do not add extra infrastructure unless it solves a real requirement.

### 6.2 High-level architecture

``` text
Browser
  |
  | React UI / HTTP JSON
  v
NestJS REST API
  |
  +-- Movies module
  |     +-- Movie CRUD service
  |     +-- Dependency graph / DFS / cycle detection
  |     +-- Rewatch order calculation
  |
  +-- Cinemas module
  |     +-- Cinema CRUD/list service
  |     +-- Minimum-bundle dynamic programming
  |
  v
Prisma ORM
  |
  v
PostgreSQL
```

Keep the algorithm implementations in small, independently testable
service/helper files. Controllers should validate/route requests and
return responses; they should not contain the algorithm implementation.

## 7. Professional project structure

Use a monorepo with two independent applications: a NestJS API and a React web client. Keep the code feature-oriented and avoid unnecessary abstractions. The tree below is the target structure; create folders and files incrementally when their phase begins rather than generating empty files up front.

### 7.1 Repository root

```text
doomsday-ready/
├── apps/
│   ├── api/                         # NestJS backend
│   └── web/                         # React + Vite frontend
├── docs/
│   ├── database-schema.md
│   └── api-contract.md
├── .github/
│   └── workflows/                   # Optional CI
├── .editorconfig
├── .gitignore
├── docker-compose.yml
├── package.json                     # Optional root scripts/workspaces
├── README.md
└── prd.md
```

Use `apps/api` and `apps/web` consistently. Do not create parallel `backend/` or `frontend/` directories.

### 7.2 Backend structure — `apps/api`

```text
apps/api/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── common/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── constants/
│   ├── movies/
│   │   ├── dto/
│   │   │   ├── create-movie.dto.ts
│   │   │   └── update-movie.dto.ts
│   │   ├── algorithms/
│   │   │   ├── dependency-graph.ts
│   │   │   ├── dependency-graph.spec.ts
│   │   │   ├── rewatch-order.ts
│   │   │   └── rewatch-order.spec.ts
│   │   ├── movies.controller.ts
│   │   ├── movies.service.ts
│   │   ├── movies.service.spec.ts
│   │   └── movies.module.ts
│   ├── cinemas/
│   │   ├── dto/
│   │   │   ├── create-cinema.dto.ts
│   │   │   └── booking-query.dto.ts
│   │   ├── algorithms/
│   │   │   ├── minimum-bundles.ts
│   │   │   └── minimum-bundles.spec.ts
│   │   ├── cinemas.controller.ts
│   │   ├── cinemas.service.ts
│   │   ├── cinemas.service.spec.ts
│   │   └── cinemas.module.ts
│   └── health/                      # Optional health endpoint
│       ├── health.controller.ts
│       └── health.module.ts
├── test/                            # API end-to-end tests
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

**Backend responsibilities and boundaries:**

- Controllers handle HTTP routing, DTO input, and response/status mapping. Keep business logic out of controllers.
- Feature services coordinate database operations and business workflows.
- Keep graph traversal, cycle detection, topological ordering, and minimum-bundle DP as pure, independently testable functions under their feature's `algorithms/` directory.
- DTOs validate incoming requests. Backend validation is mandatory even when the frontend validates too.
- Prisma schema, migrations, and seed data live under `prisma/`.
- Use Prisma directly from feature services; do not add repository abstractions without a demonstrated need.
- Put code in `common/` only when it is genuinely shared by multiple modules.

### 7.3 Frontend structure — `apps/web`

```text
apps/web/
├── public/
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── query-client.ts
│   ├── layouts/
│   │   └── app-layout.tsx
│   ├── pages/
│   │   ├── movies-page.tsx
│   │   ├── rewatch-plan-page.tsx
│   │   └── booking-page.tsx
│   ├── features/
│   │   ├── movies/
│   │   │   ├── api/movies-api.ts
│   │   │   ├── components/
│   │   │   │   ├── movie-form.tsx
│   │   │   │   ├── movie-list.tsx
│   │   │   │   └── prerequisite-select.tsx
│   │   │   ├── hooks/use-movies.ts
│   │   │   ├── schemas/movie-form.schema.ts
│   │   │   └── types/movie.types.ts
│   │   ├── rewatch-plan/
│   │   │   ├── api/rewatch-api.ts
│   │   │   ├── components/
│   │   │   │   ├── target-movie-select.tsx
│   │   │   │   ├── rewatch-list.tsx
│   │   │   │   └── watch-progress.tsx
│   │   │   ├── hooks/use-rewatch-plan.ts
│   │   │   └── types/rewatch.types.ts
│   │   └── booking/
│   │       ├── api/booking-api.ts
│   │       ├── components/
│   │       │   ├── cinema-form.tsx
│   │       │   ├── cinema-select.tsx
│   │       │   └── booking-quote.tsx
│   │       ├── hooks/use-booking-quote.ts
│   │       ├── schemas/booking-form.schema.ts
│   │       └── types/booking.types.ts
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── feedback/                 # Loading, empty, and error states
│   │   └── shared/                   # Reusable app-level components
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── format-runtime.ts
│   │   └── utils.ts
│   ├── styles/globals.css
│   ├── types/api.types.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**Frontend responsibilities and boundaries:**

- `pages/` compose feature components into route-level screens and should remain thin.
- `features/` contain domain-specific API functions, hooks, components, form schemas, and types.
- `components/ui/` contains reusable UI primitives; do not place movie or booking business workflows there.
- `components/feedback/` contains reusable loading, empty, and error states.
- `lib/api-client.ts` centralizes the API base URL, JSON parsing, and common error handling.
- Use TanStack Query for server state if selected; avoid maintaining duplicate copies of API data in unrelated local state.
- The backend is the source of truth for rewatch ordering and booking calculations. The frontend must display API results, not implement a second version of either algorithm.

### 7.4 Naming and dependency conventions

- Use TypeScript in both applications.
- Use kebab-case file names (`movies.service.ts`, `movie-form.tsx`). Use PascalCase for React component and class names, and camelCase for variables and functions.
- Use domain-specific names such as `runtimeMinutes`, `prerequisiteIds`, `bundleSizes`, and `groupSize`.
- Pure algorithm functions must not depend on NestJS, Prisma, React, or HTTP request objects.
- Backend controllers call feature services; services coordinate Prisma and pure algorithms.
- Frontend pages compose feature components; feature hooks call feature API functions; API functions use the shared API client.
- The API is the boundary between frontend and backend. Frontend code must not import backend implementation files.
- Commit `.env.example`, never real `.env` files or secrets.
- Add tests alongside the relevant algorithm/service or in the established test directory consistently.

## 8. Database schema

### 7.1 Relationship design

Use a self-referencing many-to-many relationship for movie
prerequisites.

-   One movie can have many prerequisite movies.
-   One movie can be a prerequisite for many other movies.
-   Store each directed relationship once.
-   In the relationship record, `movieId` means "the movie being
    planned"; `prerequisiteId` means "a movie that must be watched
    first."

### 7.2 Recommended Prisma schema

The following is a starting schema. The agent must validate it against
the installed Prisma version and generate/migrate the database before
implementing services.

``` prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Movie {
  id            String              @id @default(uuid()) @db.Uuid
  title         String              @unique
  releaseYear   Int
  runtimeMinutes Int
  watched       Boolean             @default(false)

  prerequisites MoviePrerequisite[] @relation("MoviePrerequisites")
  dependents    MoviePrerequisite[] @relation("MovieDependents")

  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@index([title])
}

model MoviePrerequisite {
  movieId        String @db.Uuid
  prerequisiteId String @db.Uuid

  movie Movie @relation(
    "MoviePrerequisites",
    fields: [movieId],
    references: [id],
    onDelete: Cascade
  )

  prerequisite Movie @relation(
    "MovieDependents",
    fields: [prerequisiteId],
    references: [id],
    onDelete: Cascade
  )

  @@id([movieId, prerequisiteId])
  @@index([prerequisiteId])
}

model Cinema {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  bundleSizes Int[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}
```

**Schema notes:**

-   The composite primary key prevents duplicate prerequisite links.
-   The foreign keys prevent relationships to nonexistent movies.
-   Application validation must still prevent a movie from referencing
    itself and must detect indirect cycles.
-   PostgreSQL supports integer arrays, so `bundleSizes Int[]` is
    suitable for this PostgreSQL implementation.
-   If a cinema's bundle sizes are normalized into a separate table
    instead, document that design choice and preserve the same API
    behavior.
-   Validate title/name uniqueness case-sensitively or
    case-insensitively consistently; document the chosen behavior. A
    case-insensitive unique constraint can be added if desired, but is
    not required explicitly by the assessment.

## 9. API contract

All endpoints are under `/api`. Use JSON request and response bodies
unless otherwise noted.

### 8.1 Create movie

`POST /api/movies`

Request:

``` json
{
  "title": "Iron Man",
  "releaseYear": 2008,
  "runtimeMinutes": 126,
  "prerequisiteIds": []
}
```

Behavior: - Validate all fields. - `watched` defaults to false. - Create
the movie and prerequisite links in one transaction. - Reject duplicate
title, invalid values, unknown prerequisite IDs, self-dependency, or a
cycle.

Success: `201 Created`

Example response:

``` json
{
  "id": "movie-uuid",
  "title": "Iron Man",
  "releaseYear": 2008,
  "runtimeMinutes": 126,
  "watched": false,
  "prerequisites": [],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### 8.2 List movies

`GET /api/movies`

Return all movies. Include prerequisite IDs or a compact prerequisite
summary so the frontend can edit relationships without making
unnecessary requests.

Success: `200 OK`

### 8.3 Update movie

`PATCH /api/movies/:id`

Example request:

``` json
{
  "watched": true,
  "prerequisiteIds": ["another-movie-uuid"]
}
```

All fields are optional. If `prerequisiteIds` is supplied, it replaces
the existing prerequisite list. If omitted, existing relationships
remain unchanged.

Success: `200 OK`

Return `404 Not Found` if the movie does not exist. Return
`409 Conflict` with `CIRCULAR_DEPENDENCY` if the proposed graph contains
a cycle. Do not partially apply a failed update.

### 8.4 Get rewatch order

`GET /api/movies/:id/rewatch-order`

Success: `200 OK`

Recommended response:

``` json
{
  "targetMovie": {
    "id": "target-uuid",
    "title": "Avengers: Doomsday"
  },
  "movies": [
    {
      "id": "movie-uuid",
      "title": "Iron Man",
      "releaseYear": 2008,
      "runtimeMinutes": 126,
      "watched": true
    }
  ],
  "watchedCount": 1,
  "totalCount": 7,
  "unwatchedCount": 6,
  "remainingRuntimeMinutes": 900
}
```

`movies` must contain only prerequisite movies, not the target. The
example values are illustrative. Return `404` if the target ID does not
exist.

### 8.5 Create cinema

`POST /api/cinemas`

Request:

``` json
{
  "name": "Cinema A",
  "bundleSizes": [2, 5]
}
```

Success: `201 Created`

Validate: - Name is non-empty and unique. - There are 1--10 bundle
sizes. - Every size is an integer from 1--500. - No duplicate sizes
exist.

### 8.6 List cinemas

`GET /api/cinemas`

Return all cinemas and their bundle sizes.

Success: `200 OK`

### 8.7 Get booking quote

`GET /api/cinemas/:id/booking?groupSize=11`

Success: `200 OK`

Possible exact-solution response:

``` json
{
  "cinema": {
    "id": "cinema-uuid",
    "name": "Cinema A",
    "bundleSizes": [2, 5]
  },
  "groupSize": 11,
  "possible": true,
  "totalBundles": 4,
  "bundles": [
    {
      "size": 5,
      "quantity": 1
    },
    {
      "size": 2,
      "quantity": 3
    }
  ],
  "totalSeats": 11
}
```

Possible no-solution response:

``` json
{
  "cinema": {
    "id": "cinema-uuid",
    "name": "Cinema B",
    "bundleSizes": [4, 6]
  },
  "groupSize": 7,
  "possible": false,
  "totalBundles": null,
  "bundles": [],
  "totalSeats": null
}
```

Return `404` for an unknown cinema and `400` for an invalid group size.

### 8.8 Error response format

Use a consistent error format, for example:

``` json
{
  "statusCode": 409,
  "code": "CIRCULAR_DEPENDENCY",
  "message": "The prerequisite relationship would create a circular dependency."
}
```

Recommended status codes: - `400 Bad Request`: invalid input. -
`404 Not Found`: requested movie/cinema does not exist. -
`409 Conflict`: duplicate unique value or circular dependency. -
`500 Internal Server Error`: unexpected server error.

The circular dependency code must be exactly `CIRCULAR_DEPENDENCY`. Do
not leak internal stack traces to the client.

## 10. Algorithm requirements

The assessment explicitly requires the developer to write the logic for
Features 1 and 2 rather than using libraries that solve those problems.

### 9.1 Movie dependency algorithm

Represent the graph as:

`movie -> prerequisite movies`

Recommended approach:

1.  Load the target and its prerequisite relationships.
2.  Build an adjacency list.
3.  Traverse the target's prerequisites using DFS.
4.  Use visitation states or equivalent cycle detection:
    -   Unvisited
    -   Visiting (currently on the DFS path)
    -   Visited (fully processed)
5.  If DFS reaches a `Visiting` node, a cycle exists.
6.  Add a movie to the result after processing its prerequisites (DFS
    postorder).
7.  Use visited tracking so shared prerequisites appear only once.
8.  Exclude the target from the result.
9.  Calculate watched count and the sum of runtimes for unwatched
    prerequisite movies.

For an acyclic graph, DFS postorder gives a valid prerequisite-first
order.

Cycle detection must also be used when validating proposed create/update
relationships. Validate the complete proposed graph, not only the direct
list submitted by the client.

### 9.2 Minimum-bundle algorithm

Use dynamic programming (unbounded minimum coin change).

Let `dp[x]` be the minimum number of bundles needed to make exactly `x`
seats.

-   Initialize `dp[0] = 0`.
-   Initialize all other states as infinity/unreachable.
-   For each seat amount from 1 through `groupSize`, examine each
    available bundle size.
-   If the bundle size can contribute to the current amount and the
    previous state is reachable, update the minimum.
-   Store the chosen bundle size (or predecessor information) to
    reconstruct the bundle quantities.
-   If the final state is unreachable, return `possible: false`.
-   Otherwise reconstruct the bundle counts and return the minimum total
    bundle count.

The same bundle size can be used multiple times.

Constraints are small enough for a straightforward solution: at most 10
bundle sizes and a group size up to 10,000. A typical
`O(groupSize × numberOfBundleSizes)` DP solution is appropriate.

Do not use greedy selection: it does not always produce the minimum
number of bundles.

## 11. Validation rules and edge cases

### 10.1 Movie cases

-   Empty or whitespace-only title.
-   Duplicate title.
-   Invalid release year (not a positive integer).
-   Runtime below 1 or above 300.
-   Watched value is not boolean.
-   Prerequisite ID does not exist.
-   Duplicate prerequisite IDs in one request.
-   Movie references itself.
-   Direct or indirect circular dependency.
-   Target movie has no prerequisites.
-   Multiple dependency paths lead to the same prerequisite.
-   Target movie is watched or unwatched (target must still be excluded
    from prerequisite statistics).
-   Movie is updated from watched to unwatched or vice versa.
-   Failed graph update must not leave partial relationship changes.

### 10.2 Cinema and booking cases

-   Empty or duplicate cinema name.
-   No bundle sizes.
-   More than 10 bundle sizes.
-   Bundle size below 1 or above 500.
-   Non-integer bundle size.
-   Duplicate bundle sizes.
-   Group size below 1, above 10,000, or non-integer.
-   Group size equals one bundle size.
-   Exact result uses repeated copies of one size.
-   Exact result uses multiple bundle sizes.
-   Multiple combinations exist; choose the one with the fewest bundles.
-   No exact combination exists.
-   Unknown cinema ID.

### 10.3 Frontend cases

-   No movies or cinemas exist yet.
-   API request is loading.
-   API request fails.
-   Form validation fails.
-   A selected prerequisite is removed or becomes invalid.
-   A watched checkbox update fails.
-   Rewatch plan is empty.
-   Booking result is impossible.
-   User changes cinema or group size and requests a new quote.

## 12. Testing and acceptance criteria

Do not consider the project complete until the following checks pass.

### 11.1 Movie acceptance tests

-   [ ] A valid movie can be created.
-   [ ] New movies default to `watched: false`.
-   [ ] Duplicate titles are rejected.
-   [ ] Invalid runtime values are rejected.
-   [ ] Existing movies can be listed.
-   [ ] Movie details can be updated.
-   [ ] Watched status can be changed.
-   [ ] Prerequisites can be added, replaced, and removed.
-   [ ] Unknown prerequisite IDs are rejected.
-   [ ] Direct self-dependency is rejected.
-   [ ] Indirect circular dependency is rejected with HTTP 409 and
    `CIRCULAR_DEPENDENCY`.
-   [ ] A failed update leaves the original graph unchanged.
-   [ ] Rewatch order includes every transitive prerequisite exactly
    once.
-   [ ] Rewatch order excludes the target.
-   [ ] Every prerequisite appears before the movie that depends on it.
-   [ ] Watched count is correct.
-   [ ] Remaining runtime includes only unwatched prerequisites.
-   [ ] A movie with no prerequisites returns an empty movie list and
    zero counts/runtime.

### 11.2 Cinema and booking acceptance tests

-   [ ] A valid cinema can be created.
-   [ ] Duplicate cinema names are rejected.
-   [ ] Bundle-size count must be 1--10.
-   [ ] Each bundle size must be an integer from 1--500.
-   [ ] Duplicate bundle sizes are rejected.
-   [ ] Cinemas can be listed.
-   [ ] Group size must be an integer from 1--10,000.
-   [ ] `[1,3,4]`, group `6` returns two bundles of size 3.
-   [ ] `[2,5]`, group `11` returns four bundles: one 5 and three 2.
-   [ ] `[6,9,20]`, group `44` returns four bundles: one 20, two 9, one
    6.
-   [ ] `[4,6]`, group `7` returns `possible: false`.
-   [ ] When multiple exact combinations exist, the fewest-bundle
    combination is returned.
-   [ ] Returned bundle quantities sum to exactly the requested group
    size.

### 11.3 Frontend acceptance tests

-   [ ] All three required views are reachable through navigation.
-   [ ] Movies can be created and edited through the UI.
-   [ ] Prerequisites can be selected and changed.
-   [ ] Watched status can be toggled.
-   [ ] Rewatch plan displays the API's returned order.
-   [ ] Progress count and bar match the API response.
-   [ ] Remaining runtime is displayed in hours/minutes.
-   [ ] Cinema can be created and selected.
-   [ ] Group size can be entered and validated.
-   [ ] Booking result displays bundle sizes and quantities.
-   [ ] Impossible booking result is clearly displayed.
-   [ ] Loading, empty, validation, and server-error states are handled.
-   [ ] Layout works on mobile and desktop.

## 13. Step-by-step implementation plan for the coding agent

The coding agent must work in the order below. Do not skip ahead or
implement the entire application in one uncontrolled pass.

### Phase 0 --- Inspect and plan

1.  Inspect the repository and existing files before changing anything.
2.  Confirm whether the repository is empty or contains an existing
    project.
3.  Create a concise implementation checklist.
4.  Confirm the intended folder structure and stack from this PRD.
5.  Do not overwrite existing user work without explaining why.

**Deliverable:** implementation plan and proposed file tree.

### Phase 1 --- Monorepo/project setup

1.  Create root project structure with `apps/api/` and `apps/web/`.
2.  Initialize NestJS with TypeScript in `apps/api/`.
3.  Initialize React + TypeScript + Vite in `apps/web/`.
4.  Add root README and environment examples.
5.  Configure formatting/linting scripts where practical.
6.  Add `.gitignore` for Node, build output, environment files, and
    generated files.

**Deliverable:** both applications start with documented commands.

### Phase 2 --- Database and Prisma

1.  Configure PostgreSQL connection through `DATABASE_URL` in `apps/api/.env`.
2.  Install and initialize Prisma in the backend.
3.  Implement the Movie, MoviePrerequisite, and Cinema schema.
4.  Generate Prisma Client.
5.  Create and run the first migration.
6.  Add a Prisma service/provider to NestJS.
7.  Add optional seed script using the sample movies and sample cinemas.
8.  Verify relations with a small database test.

**Deliverable:** database starts, migrations run, Prisma can read/write
records.

### Phase 3 --- Backend foundation and validation

1.  Configure global API prefix `/api`.
2.  Configure validation pipe and DTOs.
3.  Configure consistent error handling.
4.  Add health/root route if useful.
5.  Implement Movies and Cinemas modules/controllers/services.
6.  Keep controller logic thin and business logic in services.

**Deliverable:** backend foundation and validated module structure.

### Phase 4 --- Movie CRUD

1.  Implement `POST /api/movies`.
2.  Implement `GET /api/movies`.
3.  Implement `PATCH /api/movies/:id`.
4.  Implement unique title and field validation.
5.  Implement prerequisite relation replacement inside a transaction.
6.  Add unit and API tests for CRUD and invalid inputs.

**Deliverable:** Movie CRUD works through API tests or an API client.

### Phase 5 --- Graph logic and rewatch API

1.  Implement adjacency-list construction.
2.  Implement DFS traversal and visited tracking.
3.  Implement cycle detection.
4.  Implement prerequisite-first result ordering.
5.  Implement watched count and remaining runtime calculation.
6.  Add cycle validation to movie create/update operations.
7.  Implement `GET /api/movies/:id/rewatch-order`.
8.  Test all supplied sample cases and edge cases.

**Deliverable:** rewatch API and cycle protection pass tests.

### Phase 6 --- Cinema CRUD and booking algorithm

1.  Implement `POST /api/cinemas`.
2.  Implement `GET /api/cinemas`.
3.  Validate cinema names and bundle-size constraints.
4.  Implement the minimum-bundle DP algorithm in a separate testable
    function/service.
5.  Reconstruct bundle quantities from the DP result.
6.  Implement `GET /api/cinemas/:id/booking?groupSize=...`.
7.  Test all four required sample cases and additional edge cases.

**Deliverable:** cinema APIs and booking quote API pass tests.

### Phase 7 --- Frontend foundation

1.  Configure API base URL using a Vite environment variable.
2.  Set up routing/navigation for Movies, Rewatch Plan, and Booking.
3.  Create shared layout, page containers, form controls, and
    error/loading components.
4.  Set up TanStack Query or a small typed API client.
5.  Configure form validation.

**Deliverable:** navigable frontend shell connected to the backend.

### Phase 8 --- Build the three frontend views

Build in this order:

1.  Movies view: list, create, edit, prerequisites, watched toggle.
2.  Rewatch Plan view: target selector, ordered list, watched status,
    progress, remaining runtime.
3.  Booking view: cinema list/create, group-size input, quote result,
    impossible state.

Use the API as the source of truth for all calculations.

**Deliverable:** all three views work end-to-end.

### Phase 9 --- Integration, polish, and documentation

1.  Run backend unit and integration tests.
2.  Run frontend build and fix TypeScript/build errors.
3.  Test the full user flows in a browser.
4.  Test invalid input and failure states.
5.  Verify no secrets are committed.
6.  Write complete README setup instructions.
7.  Document how AI tools were used, as required by the assessment.
8.  Add a database relationship diagram to README (bonus).
9.  Add Docker Compose to start the application and database with one
    command (bonus).

**Deliverable:** working, documented, submission-ready repository.

## 14. Required user journeys

### Journey A --- Create and plan movies

1.  User opens Movies.
2.  User creates Iron Man.
3.  User creates The Avengers and selects Iron Man and The First Avenger
    as prerequisites.
4.  User marks Iron Man as watched.
5.  User opens Rewatch Plan.
6.  User selects The Avengers.
7.  The UI displays Iron Man and The First Avenger in a valid order,
    with watched progress and remaining runtime.

### Journey B --- Prevent a cycle

1.  User creates the sample movie graph.
2.  User edits Iron Man and tries to add Endgame as a prerequisite.
3.  Backend detects that this would create a cycle.
4.  Backend returns HTTP 409 with `CIRCULAR_DEPENDENCY`.
5.  Frontend displays a clear message.
6.  Existing relationships remain unchanged.

### Journey C --- Calculate a watch-party quote

1.  User opens Booking.
2.  User creates Cinema A with bundle sizes `[2, 5]`.
3.  User selects Cinema A.
4.  User enters group size `11`.
5.  User requests a quote.
6.  UI displays four bundles: one bundle of 5 and three bundles of 2,
    for exactly 11 seats.

### Journey D --- Show an impossible quote

1.  User creates/selects a cinema with bundle sizes `[4, 6]`.
2.  User enters group size `7`.
3.  User requests a quote.
4.  UI displays "Not possible" and does not invent an approximate
    combination.

## 15. Environment and local setup expectations

Provide a `.env.example` in the backend. Never commit the real `.env`.

Example:

``` env
DATABASE_URL="postgresql://postgres:password@localhost:5432/doomsday_ready?schema=public"
PORT=3000
```

Frontend example:

``` env
VITE_API_BASE_URL="http://localhost:3000/api"
```

Document the actual commands used by the project. Expected command
categories:

-   Install dependencies.
-   Start PostgreSQL (locally or with Docker).
-   Run Prisma migrations.
-   Seed sample data (if a seed script exists).
-   Start backend in development mode.
-   Start frontend in development mode.
-   Run tests.
-   Build frontend and backend.

Do not claim a command works until it has been run and verified.

## 16. README requirements

The final README must include:

-   Project description and features.
-   Technology stack.
-   Prerequisites.
-   Environment variable setup.
-   Database setup and migrations.
-   Seed instructions, if provided.
-   Backend and frontend startup instructions.
-   API endpoint summary.
-   Algorithm explanations:
    -   Movie graph traversal, topological order, and cycle detection.
    -   Minimum-bundle dynamic programming.
-   Testing commands and test coverage summary.
-   Database model diagram (bonus).
-   Docker Compose usage (bonus).
-   AI tools used and exactly how they assisted, as required by the
    assessment.
-   Any assumptions or trade-offs made.

## 17. Important instructions for the AI coding agent

Treat this PRD and the original assessment as the source of truth.

1.  Implement only requirements in this PRD unless a necessary technical
    detail is missing.
2.  Do not add authentication, roles, payments, reservations, or
    unrelated features.
3.  Do not use a graph/topological-sort library to solve Feature 1.
4.  Do not use a coin-change/minimum-bundle library to solve Feature 2.
5.  Write both algorithms yourself and add tests that demonstrate the
    logic.
6.  Keep algorithm logic separate from controllers and UI components.
7.  Keep the frontend connected to the backend; do not hardcode sample
    results as the working implementation.
8.  Use sample data only for seeding/demo purposes.
9.  Validate input on the backend even if the frontend also validates
    it.
10. Use database transactions for operations that change a movie and its
    prerequisite relationships.
11. Do not silently change the API contract or database model. If a
    change is necessary, explain it and update this PRD/README.
12. Work phase by phase. At the end of each phase:
    -   Summarize what was implemented.
    -   List files created/changed.
    -   Run relevant tests/build commands.
    -   Report actual results and unresolved issues.
    -   Wait for approval before moving to the next phase when working
        interactively.
13. If running autonomously, proceed to the next phase only after the
    current phase's acceptance checks pass.
14. Do not fabricate test results, deployment status, screenshots, or
    completion claims.
15. Keep code readable, typed, maintainable, and appropriate for an
    internship assessment.

------------------------------------------------------------------------

## 18. Definition of done

The project is ready for submission when:

-   [ ] All seven required API endpoints work.
-   [ ] Movie CRUD and prerequisite editing work.
-   [ ] Circular dependencies are rejected with the required 409 error
    code.
-   [ ] Rewatch order is correct, unique, prerequisite-first, and
    excludes the target.
-   [ ] Watched count and unwatched runtime are correct.
-   [ ] Cinema creation/listing and validation work.
-   [ ] Booking DP returns a minimum-bundle exact solution or "not
    possible."
-   [ ] All three frontend views work with the real API.
-   [ ] Required examples and important edge cases pass automated tests.
-   [ ] README explains setup, algorithms, assumptions, and AI usage.
-   [ ] Git repository is clean and ready to share.
-   [ ] Bonus database diagram and Docker Compose are included if time
    allows.

**Final principle:** Build the smallest correct application that
satisfies the assessment. Correct algorithms, reliable API behavior,
clear frontend flows, tests, and honest documentation are more important
than unnecessary features or visual complexity.
