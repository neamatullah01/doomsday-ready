# REST API Contract & Specification

This document details all REST API endpoints provided by the **Doomsday Ready** backend API. All endpoints are served with the global `/api` prefix and return standard JSON payloads.

---

## 1. Global Standards & Error Format

All error responses strictly follow the standardized error payload schema:

```json
{
  "statusCode": 409,
  "code": "CIRCULAR_DEPENDENCY",
  "message": "The prerequisite relationship would create a circular dependency: Avengers: Doomsday -> Avengers: Endgame -> Iron Man -> Avengers: Doomsday"
}
```

### Common HTTP Status & Error Codes:
| Status Code | Code Constant | Meaning |
|---|---|---|
| `200 OK` | — | Successful retrieval or update |
| `201 Created` | — | Successful resource creation |
| `400 Bad Request` | `BAD_REQUEST` | Validation failed or invalid payload values |
| `404 Not Found` | `NOT_FOUND` | Target movie or cinema UUID not found |
| `409 Conflict` | `CONFLICT` | Unique constraint violated (e.g. duplicate title or cinema name) |
| `409 Conflict` | `CIRCULAR_DEPENDENCY` | Prerequisite link would introduce a cyclic graph dependency |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Unexpected server failure (stack traces are suppressed) |

---

## 2. Movies Endpoints

### 2.1 Create Movie
Creates a new MCU movie record and links any initial prerequisites.

- **Endpoint**: `POST /api/movies`
- **Request Body**:
```json
{
  "title": "The Avengers",
  "releaseYear": 2012,
  "runtimeMinutes": 143,
  "prerequisiteIds": [
    "e2b9635b-d779-44be-b3cb-8c909ee85d9b",
    "b594b2f4-8a47-4952-b13c-7467eeae5fc5"
  ]
}
```
- **Validation**:
  - `title`: Non-empty string, trimmed, unique.
  - `releaseYear`: Positive integer (> 0).
  - `runtimeMinutes`: Integer between 1 and 300.
  - `prerequisiteIds`: Optional array of unique UUIDs. Self-reference or cycles return `409 CIRCULAR_DEPENDENCY`.
- **Response** (`201 Created`):
```json
{
  "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "title": "The Avengers",
  "releaseYear": 2012,
  "runtimeMinutes": 143,
  "watched": false,
  "prerequisites": [
    "e2b9635b-d779-44be-b3cb-8c909ee85d9b",
    "b594b2f4-8a47-4952-b13c-7467eeae5fc5"
  ],
  "createdAt": "2026-11-20T19:00:00.000Z",
  "updatedAt": "2026-11-20T19:00:00.000Z"
}
```

---

### 2.2 List Movies
Returns all registered movies sorted by release year.

- **Endpoint**: `GET /api/movies`
- **Response** (`200 OK`):
```json
[
  {
    "id": "e2b9635b-d779-44be-b3cb-8c909ee85d9b",
    "title": "Iron Man",
    "releaseYear": 2008,
    "runtimeMinutes": 126,
    "watched": true,
    "prerequisites": [],
    "createdAt": "2026-11-20T19:00:00.000Z",
    "updatedAt": "2026-11-20T19:00:00.000Z"
  }
]
```

---

### 2.3 Get Movie by ID
Retrieves details for a single movie by its UUID.

- **Endpoint**: `GET /api/movies/:id`
- **Response** (`200 OK`): Single `MovieResponseDto` object.
- **Errors**: `404 Not Found` if UUID does not exist.

---

### 2.4 Update Movie
Updates movie fields or updates/replaces prerequisite relationships.

- **Endpoint**: `PATCH /api/movies/:id`
- **Request Body** (all fields optional):
```json
{
  "title": "Iron Man (Updated)",
  "releaseYear": 2008,
  "runtimeMinutes": 126,
  "watched": true,
  "prerequisiteIds": []
}
```
- **Behavior**:
  - If `prerequisiteIds` is provided, it replaces the existing prerequisite list in a database transaction.
  - Validates cycle prevention across the full transitive graph.
- **Errors**:
  - `404 Not Found` if the movie does not exist.
  - `409 Conflict` with `CIRCULAR_DEPENDENCY` if the edit would form a cycle.

---

### 2.5 Get Rewatch Order & Statistics
Calculates a valid prerequisite-first rewatch order for the target movie using DFS post-order topological sort.

- **Endpoint**: `GET /api/movies/:id/rewatch-order`
- **Response** (`200 OK`):
```json
{
  "targetMovie": {
    "id": "b62a714f-a853-4f5c-8693-ba0c66760108",
    "title": "Avengers: Doomsday"
  },
  "movies": [
    {
      "id": "e2b9635b-d779-44be-b3cb-8c909ee85d9b",
      "title": "Iron Man",
      "releaseYear": 2008,
      "runtimeMinutes": 126,
      "watched": true
    },
    {
      "id": "b594b2f4-8a47-4952-b13c-7467eeae5fc5",
      "title": "Captain America: The First Avenger",
      "releaseYear": 2011,
      "runtimeMinutes": 124,
      "watched": false
    }
  ],
  "watchedCount": 1,
  "totalCount": 2,
  "unwatchedCount": 1,
  "remainingRuntimeMinutes": 124
}
```
- **Rules**:
  - Target movie itself is never included in the `movies` list or statistics.
  - Every transitive prerequisite appears exactly once.
  - Every prerequisite appears before any dependent movie.
  - `remainingRuntimeMinutes` is the sum of runtimes of prerequisite movies with `watched: false`.

---

## 3. Cinemas & Booking Endpoints

### 3.1 Create Cinema
Registers a cinema with available seat-bundle sizes.

- **Endpoint**: `POST /api/cinemas`
- **Request Body**:
```json
{
  "name": "Cinema A",
  "bundleSizes": [2, 5]
}
```
- **Validation**:
  - `name`: Non-empty, trimmed, unique string.
  - `bundleSizes`: 1 to 10 unique integers, each between 1 and 500 inclusive.
- **Response** (`201 Created`):
```json
{
  "id": "d176711c-2234-4b53-91a5-83e8fa9f7832",
  "name": "Cinema A",
  "bundleSizes": [2, 5],
  "createdAt": "2026-11-20T19:00:00.000Z",
  "updatedAt": "2026-11-20T19:00:00.000Z"
}
```

---

### 3.2 List Cinemas
Returns all registered cinemas and their bundle sizes sorted by name.

- **Endpoint**: `GET /api/cinemas`
- **Response** (`200 OK`): Array of cinema objects.

---

### 3.3 Get Cinema by ID
- **Endpoint**: `GET /api/cinemas/:id`
- **Response** (`200 OK`): Single cinema object.
- **Errors**: `404 Not Found` if UUID does not exist.

---

### 3.4 Calculate Booking Quote (Dynamic Programming)
Calculates the minimum total bundles required to form an exact group size using unbounded dynamic programming.

- **Endpoint**: `GET /api/cinemas/:id/booking?groupSize=11`
- **Query Parameters**:
  - `groupSize`: Integer from 1 to 10,000 inclusive.
- **Response — Exact Solution Possible (`200 OK`)**:
```json
{
  "cinema": {
    "id": "d176711c-2234-4b53-91a5-83e8fa9f7832",
    "name": "Cinema A",
    "bundleSizes": [2, 5]
  },
  "groupSize": 11,
  "possible": true,
  "totalBundles": 4,
  "bundles": [
    { "size": 5, "quantity": 1 },
    { "size": 2, "quantity": 3 }
  ],
  "totalSeats": 11
}
```
- **Response — No Solution Possible (`200 OK`)**:
```json
{
  "cinema": {
    "id": "e9821334-1123-45ab-8812-421712a52110",
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
- **Errors**:
  - `400 Bad Request` if `groupSize` is not an integer between 1 and 10,000.
  - `404 Not Found` if cinema UUID is unknown.

---

## 4. Health Check Endpoint

- **Endpoint**: `GET /api/health`
- **Response** (`200 OK`):
```json
{
  "status": "ok",
  "timestamp": "2026-11-20T19:00:00.000Z",
  "uptime": 124.5
}
```
