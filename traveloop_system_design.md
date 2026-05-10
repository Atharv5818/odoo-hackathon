# Traveloop — System Design Document
**Phase 1: Architecture, Database & API Blueprint**

---

## 1. ARCHITECTURE OVERVIEW

### High-Level System Diagram

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT (React)                    │
│         Browser / PWA / Mobile (future)              │
└────────────────────┬─────────────────────────────────┘
                     │ HTTPS (REST/JSON)
                     ▼
┌──────────────────────────────────────────────────────┐
│               API GATEWAY LAYER                      │
│   Rate Limiter → CORS → Helmet → Auth Middleware     │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│             EXPRESS APPLICATION SERVER               │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │  Routes  │ │Controllers│ │ Services │ │  Repos │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
│                                                      │
│  [Auth] [Users] [Trips] [Stops] [Activities]         │
│  [Budget] [Packing] [Notes] [Sharing]                │
└────────────────────┬─────────────────────────────────┘
                     │ Prisma ORM
                     ▼
┌──────────────────────────────────────────────────────┐
│              PostgreSQL DATABASE                     │
└──────────────────────────────────────────────────────┘
```

### Backend Layered Structure (Feature-Based Modules)

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.schema.ts          # Zod validation schemas
│   ├── users/
│   ├── trips/
│   ├── stops/
│   ├── activities/
│   ├── budget/
│   ├── packing/
│   ├── notes/
│   └── sharing/
│
├── middleware/
│   ├── auth.middleware.ts           # JWT verification
│   ├── validate.middleware.ts       # Request validation
│   ├── rateLimiter.middleware.ts
│   └── errorHandler.middleware.ts
│
├── lib/
│   ├── prisma.ts                    # Prisma client singleton
│   ├── jwt.ts                       # JWT helpers
│   └── logger.ts                    # Structured logging
│
├── config/
│   └── env.ts                       # Validated env vars (zod)
│
└── app.ts                           # Express app bootstrap
```

Each module is **fully self-contained**: routes → controller → service → repository (Prisma). No cross-module direct DB calls. Modules communicate only through service interfaces.

---

## 2. MODULE BREAKDOWN

### 2.1 Authentication
- **Responsibilities:** Signup, login, token issuance, token refresh, logout
- **Key Entities:** User (credentials)
- **API:** POST /signup, POST /login, POST /refresh, POST /logout

### 2.2 Users
- **Responsibilities:** Profile CRUD, avatar, preferences, account deletion
- **Key Entities:** User (profile fields)
- **API:** GET /me, PATCH /me, DELETE /me

### 2.3 Trips
- **Responsibilities:** Create/read/update/delete trips, trip metadata (title, dates, cover image, status)
- **Key Entities:** Trip
- **API:** CRUD on /trips, GET /trips/:id

### 2.4 Itinerary (Trip Stops)
- **Responsibilities:** Ordered stops within a trip, each stop tied to a city, date range, and position index
- **Key Entities:** TripStop, City
- **API:** CRUD on /trips/:tripId/stops, PATCH /stops/:id/reorder

### 2.5 Activities
- **Responsibilities:** Activities within a stop (sightseeing, dining, transit). Activities can be reused across stops (shared catalog) or be stop-specific.
- **Key Entities:** Activity, StopActivity (junction)
- **API:** CRUD on /stops/:stopId/activities

### 2.6 Budget
- **Responsibilities:** Per-trip budget tracking. Categories (accommodation, food, transport, misc). Actual vs. estimated spend.
- **Key Entities:** Budget, BudgetItem
- **API:** GET/POST /trips/:tripId/budget, CRUD on /budget/items

### 2.7 Packing Checklist
- **Responsibilities:** Per-trip packing list with items, categories, checked state
- **Key Entities:** PackingItem
- **API:** CRUD on /trips/:tripId/packing

### 2.8 Notes / Journal
- **Responsibilities:** Free-form notes per trip or per stop, ordered by date
- **Key Entities:** Note
- **API:** CRUD on /trips/:tripId/notes, optional /stops/:stopId/notes

### 2.9 Sharing / Public Trips
- **Responsibilities:** Make a trip public via a unique slug, control view permissions, track share links
- **Key Entities:** SharedTrip
- **API:** POST /trips/:tripId/share, GET /public/:slug, DELETE /trips/:tripId/share

---

## 3. DATABASE DESIGN

### Entity Relationship Summary

```
users ──< trips ──< trip_stops >── cities
                 │       │
                 │       └──< stop_activities >── activities
                 │
                 ├──< budgets ──< budget_items
                 ├──< packing_items
                 ├──< notes
                 └──< shared_trips
```

---

### Table Definitions

#### `users`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| username | VARCHAR(50) | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| full_name | VARCHAR(100) | |
| avatar_url | TEXT | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Indexes:** `idx_users_email` (email), `idx_users_username` (username)

---

#### `cities`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| country | VARCHAR(100) | NOT NULL |
| country_code | CHAR(2) | NOT NULL |
| timezone | VARCHAR(50) | |
| latitude | DECIMAL(9,6) | |
| longitude | DECIMAL(9,6) | |

**Indexes:** `idx_cities_country_code`, `idx_cities_name`  
**Note:** Cities are a semi-static reference table. Pre-seeded from a dataset (e.g. GeoNames). Users don't create cities.

---

#### `trips`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL, ON DELETE CASCADE |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | |
| cover_image_url | TEXT | |
| start_date | DATE | |
| end_date | DATE | |
| status | ENUM | NOT NULL, DEFAULT 'draft' |
| is_public | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**ENUM `trip_status`:** `draft`, `planned`, `ongoing`, `completed`, `cancelled`  
**Indexes:** `idx_trips_user_id`, `idx_trips_status`, `idx_trips_is_public`  
**Constraints:** `CHECK (end_date >= start_date)`

---

#### `trip_stops`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| trip_id | UUID | FK → trips.id, NOT NULL, ON DELETE CASCADE |
| city_id | UUID | FK → cities.id, NOT NULL |
| position | INTEGER | NOT NULL |
| arrival_date | DATE | |
| departure_date | DATE | |
| accommodation | TEXT | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Indexes:** `idx_stops_trip_id`, composite `idx_stops_trip_position (trip_id, position)`  
**Constraints:** `UNIQUE(trip_id, position)`, `CHECK (departure_date >= arrival_date)`

---

#### `activities`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(200) | NOT NULL |
| description | TEXT | |
| category | ENUM | NOT NULL |
| location_name | TEXT | |
| latitude | DECIMAL(9,6) | |
| longitude | DECIMAL(9,6) | |
| estimated_cost | DECIMAL(10,2) | |
| currency | CHAR(3) | DEFAULT 'USD' |
| duration_minutes | INTEGER | |
| is_global | BOOLEAN | NOT NULL, DEFAULT false |
| created_by | UUID | FK → users.id, nullable (null = system/global) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**ENUM `activity_category`:** `sightseeing`, `dining`, `transport`, `accommodation`, `adventure`, `culture`, `shopping`, `wellness`, `other`  
**Indexes:** `idx_activities_category`, `idx_activities_created_by`, `idx_activities_is_global`

---

#### `stop_activities` (Junction Table)
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| stop_id | UUID | FK → trip_stops.id, NOT NULL, ON DELETE CASCADE |
| activity_id | UUID | FK → activities.id, NOT NULL, ON DELETE CASCADE |
| scheduled_at | TIMESTAMPTZ | |
| actual_cost | DECIMAL(10,2) | |
| status | ENUM | DEFAULT 'planned' |
| custom_notes | TEXT | |
| position | INTEGER | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**ENUM `activity_status`:** `planned`, `confirmed`, `completed`, `skipped`  
**Indexes:** `idx_stop_activities_stop_id`, `idx_stop_activities_activity_id`  
**Constraints:** `UNIQUE(stop_id, activity_id)`

---

#### `budgets`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| trip_id | UUID | FK → trips.id, NOT NULL, UNIQUE, ON DELETE CASCADE |
| total_limit | DECIMAL(10,2) | |
| currency | CHAR(3) | NOT NULL, DEFAULT 'USD' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Indexes:** `idx_budgets_trip_id`  
**Note:** One budget per trip (1:1). Budget items are the line-item breakdown.

---

#### `budget_items`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| budget_id | UUID | FK → budgets.id, NOT NULL, ON DELETE CASCADE |
| category | ENUM | NOT NULL |
| label | VARCHAR(200) | NOT NULL |
| estimated_amount | DECIMAL(10,2) | NOT NULL, DEFAULT 0 |
| actual_amount | DECIMAL(10,2) | DEFAULT 0 |
| date | DATE | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**ENUM `budget_category`:** `accommodation`, `food`, `transport`, `activities`, `shopping`, `insurance`, `visa`, `misc`  
**Indexes:** `idx_budget_items_budget_id`, `idx_budget_items_category`

---

#### `packing_items`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| trip_id | UUID | FK → trips.id, NOT NULL, ON DELETE CASCADE |
| label | VARCHAR(200) | NOT NULL |
| category | VARCHAR(100) | |
| quantity | INTEGER | NOT NULL, DEFAULT 1 |
| is_checked | BOOLEAN | NOT NULL, DEFAULT false |
| is_essential | BOOLEAN | NOT NULL, DEFAULT false |
| position | INTEGER | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Indexes:** `idx_packing_trip_id`

---

#### `notes`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| trip_id | UUID | FK → trips.id, NOT NULL, ON DELETE CASCADE |
| stop_id | UUID | FK → trip_stops.id, nullable, ON DELETE SET NULL |
| user_id | UUID | FK → users.id, NOT NULL |
| title | VARCHAR(300) | |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Indexes:** `idx_notes_trip_id`, `idx_notes_stop_id`, `idx_notes_user_id`  
**Note:** `stop_id` is nullable — notes can be trip-level or stop-level.

---

#### `shared_trips`
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| trip_id | UUID | FK → trips.id, NOT NULL, ON DELETE CASCADE |
| shared_by | UUID | FK → users.id, NOT NULL |
| slug | VARCHAR(100) | UNIQUE, NOT NULL |
| permission | ENUM | NOT NULL, DEFAULT 'view' |
| expires_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**ENUM `share_permission`:** `view`, `comment` (edit left for v2)  
**Indexes:** `idx_shared_trips_slug` (UNIQUE), `idx_shared_trips_trip_id`

---

## 4. PRISMA SCHEMA

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───────────────────────────────────────────

enum TripStatus {
  draft
  planned
  ongoing
  completed
  cancelled
}

enum ActivityCategory {
  sightseeing
  dining
  transport
  accommodation
  adventure
  culture
  shopping
  wellness
  other
}

enum ActivityStatus {
  planned
  confirmed
  completed
  skipped
}

enum BudgetCategory {
  accommodation
  food
  transport
  activities
  shopping
  insurance
  visa
  misc
}

enum SharePermission {
  view
  comment
}

// ─── MODELS ──────────────────────────────────────────

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  username     String   @unique
  passwordHash String   @map("password_hash")
  fullName     String?  @map("full_name")
  avatarUrl    String?  @map("avatar_url")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  trips        Trip[]
  notes        Note[]
  sharedTrips  SharedTrip[]
  activities   Activity[]   @relation("UserCreatedActivities")

  @@map("users")
}

model City {
  id          String   @id @default(uuid())
  name        String
  country     String
  countryCode String   @map("country_code") @db.Char(2)
  timezone    String?
  latitude    Decimal? @db.Decimal(9, 6)
  longitude   Decimal? @db.Decimal(9, 6)

  stops       TripStop[]

  @@index([countryCode])
  @@index([name])
  @@map("cities")
}

model Trip {
  id            String     @id @default(uuid())
  userId        String     @map("user_id")
  title         String     @db.VarChar(200)
  description   String?    @db.Text
  coverImageUrl String?    @map("cover_image_url")
  startDate     DateTime?  @map("start_date") @db.Date
  endDate       DateTime?  @map("end_date") @db.Date
  status        TripStatus @default(draft)
  isPublic      Boolean    @default(false) @map("is_public")
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")

  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  stops         TripStop[]
  budget        Budget?
  packingItems  PackingItem[]
  notes         Note[]
  sharedTrips   SharedTrip[]

  @@index([userId])
  @@index([status])
  @@index([isPublic])
  @@map("trips")
}

model TripStop {
  id            String    @id @default(uuid())
  tripId        String    @map("trip_id")
  cityId        String    @map("city_id")
  position      Int
  arrivalDate   DateTime? @map("arrival_date") @db.Date
  departureDate DateTime? @map("departure_date") @db.Date
  accommodation String?   @db.Text
  notes         String?   @db.Text
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  trip           Trip           @relation(fields: [tripId], references: [id], onDelete: Cascade)
  city           City           @relation(fields: [cityId], references: [id])
  stopActivities StopActivity[]
  notes_rel      Note[]

  @@unique([tripId, position])
  @@index([tripId])
  @@map("trip_stops")
}

model Activity {
  id              String           @id @default(uuid())
  name            String           @db.VarChar(200)
  description     String?          @db.Text
  category        ActivityCategory
  locationName    String?          @map("location_name")
  latitude        Decimal?         @db.Decimal(9, 6)
  longitude       Decimal?         @db.Decimal(9, 6)
  estimatedCost   Decimal?         @map("estimated_cost") @db.Decimal(10, 2)
  currency        String           @default("USD") @db.Char(3)
  durationMinutes Int?             @map("duration_minutes")
  isGlobal        Boolean          @default(false) @map("is_global")
  createdBy       String?          @map("created_by")
  createdAt       DateTime         @default(now()) @map("created_at")

  creator        User?          @relation("UserCreatedActivities", fields: [createdBy], references: [id], onDelete: SetNull)
  stopActivities StopActivity[]

  @@index([category])
  @@index([isGlobal])
  @@index([createdBy])
  @@map("activities")
}

model StopActivity {
  id           String         @id @default(uuid())
  stopId       String         @map("stop_id")
  activityId   String         @map("activity_id")
  scheduledAt  DateTime?      @map("scheduled_at")
  actualCost   Decimal?       @map("actual_cost") @db.Decimal(10, 2)
  status       ActivityStatus @default(planned)
  customNotes  String?        @map("custom_notes") @db.Text
  position     Int?
  createdAt    DateTime       @default(now()) @map("created_at")

  stop     TripStop @relation(fields: [stopId], references: [id], onDelete: Cascade)
  activity Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)

  @@unique([stopId, activityId])
  @@index([stopId])
  @@index([activityId])
  @@map("stop_activities")
}

model Budget {
  id         String   @id @default(uuid())
  tripId     String   @unique @map("trip_id")
  totalLimit Decimal? @map("total_limit") @db.Decimal(10, 2)
  currency   String   @default("USD") @db.Char(3)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  trip  Trip         @relation(fields: [tripId], references: [id], onDelete: Cascade)
  items BudgetItem[]

  @@map("budgets")
}

model BudgetItem {
  id              String         @id @default(uuid())
  budgetId        String         @map("budget_id")
  category        BudgetCategory
  label           String         @db.VarChar(200)
  estimatedAmount Decimal        @default(0) @map("estimated_amount") @db.Decimal(10, 2)
  actualAmount    Decimal        @default(0) @map("actual_amount") @db.Decimal(10, 2)
  date            DateTime?      @db.Date
  notes           String?        @db.Text
  createdAt       DateTime       @default(now()) @map("created_at")

  budget Budget @relation(fields: [budgetId], references: [id], onDelete: Cascade)

  @@index([budgetId])
  @@index([category])
  @@map("budget_items")
}

model PackingItem {
  id          String   @id @default(uuid())
  tripId      String   @map("trip_id")
  label       String   @db.VarChar(200)
  category    String?  @db.VarChar(100)
  quantity    Int      @default(1)
  isChecked   Boolean  @default(false) @map("is_checked")
  isEssential Boolean  @default(false) @map("is_essential")
  position    Int?
  createdAt   DateTime @default(now()) @map("created_at")

  trip Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@index([tripId])
  @@map("packing_items")
}

model Note {
  id        String   @id @default(uuid())
  tripId    String   @map("trip_id")
  stopId    String?  @map("stop_id")
  userId    String   @map("user_id")
  title     String?  @db.VarChar(300)
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  trip Trip      @relation(fields: [tripId], references: [id], onDelete: Cascade)
  stop TripStop? @relation(fields: [stopId], references: [id], onDelete: SetNull)
  user User      @relation(fields: [userId], references: [id])

  @@index([tripId])
  @@index([stopId])
  @@index([userId])
  @@map("notes")
}

model SharedTrip {
  id         String          @id @default(uuid())
  tripId     String          @map("trip_id")
  sharedBy   String          @map("shared_by")
  slug       String          @unique @db.VarChar(100)
  permission SharePermission @default(view)
  expiresAt  DateTime?       @map("expires_at")
  createdAt  DateTime        @default(now()) @map("created_at")

  trip Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user User @relation(fields: [sharedBy], references: [id])

  @@index([tripId])
  @@index([slug])
  @@map("shared_trips")
}
```

---

## 5. API STRUCTURE

### Auth
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Users
```
GET    /api/users/me
PATCH  /api/users/me
DELETE /api/users/me
```

### Trips
```
GET    /api/trips                    # All trips for authenticated user
POST   /api/trips                    # Create trip
GET    /api/trips/:tripId            # Get single trip (with stops)
PATCH  /api/trips/:tripId            # Update trip metadata
DELETE /api/trips/:tripId            # Delete trip
```

### Stops (Itinerary)
```
GET    /api/trips/:tripId/stops
POST   /api/trips/:tripId/stops
PATCH  /api/stops/:stopId
DELETE /api/stops/:stopId
PATCH  /api/trips/:tripId/stops/reorder    # Body: [{id, position}]
```

### Activities
```
GET    /api/activities                      # Browse global activity catalog
GET    /api/stops/:stopId/activities        # Activities for a stop
POST   /api/stops/:stopId/activities        # Add activity to stop
PATCH  /api/stop-activities/:id            # Update status, notes, cost
DELETE /api/stop-activities/:id
```

### Budget
```
GET    /api/trips/:tripId/budget
POST   /api/trips/:tripId/budget           # Initialize budget
PATCH  /api/trips/:tripId/budget           # Update total limit / currency
GET    /api/trips/:tripId/budget/items
POST   /api/trips/:tripId/budget/items
PATCH  /api/budget-items/:id
DELETE /api/budget-items/:id
GET    /api/trips/:tripId/budget/summary   # Calculated: total estimated vs actual by category
```

### Packing
```
GET    /api/trips/:tripId/packing
POST   /api/trips/:tripId/packing
PATCH  /api/packing/:itemId
DELETE /api/packing/:itemId
PATCH  /api/trips/:tripId/packing/reorder
```

### Notes
```
GET    /api/trips/:tripId/notes
POST   /api/trips/:tripId/notes
GET    /api/notes/:noteId
PATCH  /api/notes/:noteId
DELETE /api/notes/:noteId
```

### Sharing
```
POST   /api/trips/:tripId/share            # Generate share link + slug
DELETE /api/trips/:tripId/share            # Revoke sharing
GET    /api/public/:slug                   # Public trip view (no auth)
```

---

## 6. DATA FLOW

### 6.1 Creating a Trip
```
1. User sends POST /api/trips with title, dates
2. Auth middleware validates JWT → extracts userId
3. Controller passes validated body to TripService
4. TripService calls TripRepository → prisma.trip.create({ userId, ...body })
5. Returns created trip object
6. Frontend uses tripId for all subsequent operations
```

### 6.2 Building an Itinerary
```
1. User adds stops: POST /api/trips/:tripId/stops
   → Validates tripId belongs to user (ownership check in service)
   → Assigns next position (SELECT MAX(position) + 1)
   → Links to city_id from cities table

2. User reorders stops: PATCH /api/trips/:tripId/stops/reorder
   → Body: [{id: "stop1", position: 1}, {id: "stop2", position: 2}]
   → Service runs prisma.$transaction([...updateMany]) for atomic reorder
   → UNIQUE(trip_id, position) constraint enforced — transaction handles this
     by temporarily using negative positions to avoid conflicts

3. Trip detail fetch: GET /api/trips/:tripId
   → Prisma query with nested includes: stops (ordered by position) > city, stopActivities > activity
```

### 6.3 Linking Activities
```
1. User picks an activity from catalog (global or personal)
   → POST /api/stops/:stopId/activities { activityId, scheduledAt, position }

2. StopActivityService:
   a. Validates stop belongs to user's trip (ownership chain check)
   b. Creates StopActivity record linking stop ↔ activity
   c. Returns the stop_activity with activity details included

3. As user completes activities:
   → PATCH /api/stop-activities/:id { status: "completed", actualCost: 45.00 }
```

### 6.4 Budget Calculation
```
Budget summary is COMPUTED at query time, not stored:

SELECT
  SUM(estimated_amount) as total_estimated,
  SUM(actual_amount)    as total_actual,
  category,
  SUM(estimated_amount) as category_estimated,
  SUM(actual_amount)    as category_actual
FROM budget_items
WHERE budget_id = $1
GROUP BY category

→ Returned as: { totalEstimated, totalActual, remaining, byCategory: [...] }

Note: Activity actual costs (from stop_activities.actual_cost) can be cross-referenced
but are NOT automatically synced into budget_items. That's intentional — budget is
a planning tool, activities tracking is operational. Merging them conflates two concerns.
```

---

## 7. SECURITY DESIGN

### Authentication (JWT Flow)
```
Signup:
  1. Validate email/password with Zod schema
  2. Check email uniqueness
  3. Hash password: bcrypt.hash(password, 12)  ← cost factor 12 is deliberate
  4. Store user
  5. Issue: accessToken (15min TTL) + refreshToken (7 days TTL, stored in httpOnly cookie)

Login:
  1. Find user by email
  2. bcrypt.compare(input, hash)
  3. Re-issue tokens on success

Refresh:
  1. Read refreshToken from httpOnly cookie (not from body/header — prevents XSS theft)
  2. Verify JWT signature and expiry
  3. Issue new accessToken

Protected Routes:
  1. auth.middleware extracts Bearer token from Authorization header
  2. jwt.verify(token, JWT_SECRET) → decode userId
  3. Attach user context to req.user
  4. Controller proceeds — no DB lookup on every request (stateless)

Logout:
  1. Clear httpOnly cookie server-side
  2. Client discards accessToken from memory
```

### Ownership Enforcement
Every mutating operation on trips/stops/activities runs an ownership check:
```
// Before any update/delete:
const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: req.user.id } });
if (!trip) throw new ForbiddenError();
```
This is enforced in the **Service layer**, not the controller. Controllers are dumb.

### Input Validation
- All request bodies validated with **Zod schemas** before hitting controllers
- Validation middleware runs before route handlers
- Unknown fields are stripped (`.strip()`)
- Prevents oversized payloads via body-parser size limits (e.g., `10kb`)

### SQL Injection Prevention
- **Prisma ORM uses parameterized queries exclusively** — raw string interpolation into SQL is structurally impossible through normal Prisma usage
- Any `prisma.$queryRaw` calls (if ever needed) must use tagged template literals (`Prisma.sql`) — never string concatenation

### Rate Limiting
```
- Global: 100 req/min per IP (express-rate-limit)
- Auth endpoints: 10 req/15min per IP (stricter, prevents brute force)
- Public share endpoint: 30 req/min per IP
```

### CORS
```
- Whitelist: Only the production frontend domain
- Methods: GET, POST, PATCH, DELETE, OPTIONS
- Credentials: true (required for httpOnly cookie to work cross-origin)
- No wildcard (*) in production
```

### Additional Headers (Helmet)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- CSP headers configured for API-only (no inline scripts concern)

---

## 8. SCALABILITY STRATEGY

### Stateless API Design
- No session stored server-side — JWT carries identity
- Any instance of the server can handle any request
- Enables horizontal scaling behind a load balancer with zero config changes

### Database Indexing Strategy
```
High-frequency read patterns and their supporting indexes:

Pattern                              Index
─────────────────────────────────────────────────────────
Fetch user's trips                   idx_trips_user_id
Filter public trips                  idx_trips_is_public
Fetch stops for a trip               idx_stops_trip_id
Ordered stops within a trip          idx_stops_trip_position (composite)
Fetch activities by category         idx_activities_category
Lookup shared trip by slug           idx_shared_trips_slug (unique)
Fetch budget items for a budget      idx_budget_items_budget_id
Fetch notes for a trip               idx_notes_trip_id
```

**What is NOT indexed:** `created_at` by default (only add if time-range queries become common). Don't over-index — writes pay the cost.

### Handling 10k+ Users
At this scale, the primary concerns are:

- **Connection pooling:** Use **PgBouncer** in front of PostgreSQL. Prisma's connection pool (`connection_limit`) should be set based on Postgres max_connections, not left at default.
- **Read/write split (future):** When DB becomes the bottleneck, add a read replica. Route GET queries to replica, writes to primary. Prisma supports this via datasource routing.
- **Query optimization:** Avoid N+1 queries — use Prisma's `include` and `select` carefully. Fetch only needed fields.
- **Caching layer (future):** Redis for:
  - Public trip views (heavily read, rarely written)
  - Global activity catalog (near-static data)
  - Rate limiter state (replaces in-memory store for multi-instance)
- **Async operations:** Email sends, slug generation for share links → offload to a job queue (BullMQ + Redis) rather than blocking the request

### Modular Backend Scaling
- Each module is independent → can be extracted into a microservice if one domain becomes the bottleneck (e.g., sharing/public trips get high traffic)
- Currently: monolith is correct. Don't build microservices prematurely.
- The module boundaries are designed so extraction is possible without schema redesign

### What This Design Does NOT Handle (Intentionally Deferred)
- Full-text search on trips/notes → add PostgreSQL `tsvector` index or Elasticsearch when search becomes a feature
- File uploads (trip covers, receipts) → needs object storage (S3-compatible), deferred to Phase 2
- Real-time collaboration → requires WebSockets, out of scope for v1
- Multi-currency conversion → rates are stored per item, conversion is a UI concern for now

---

*End of Phase 1 System Design — Traveloop*
