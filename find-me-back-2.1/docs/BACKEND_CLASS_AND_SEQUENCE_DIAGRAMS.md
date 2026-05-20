# Backend – Class & Sequence Diagrams (CV, Mission, User, Discovery, Gateway)

**Scope:** CV, Mission, User, Discovery, Gateway (CodingGame & Quiz excluded).

---

## 1. Class diagram (simplified)

High-level view: **Discovery**, **Gateway**, and the three domain services with their layers (Controller → Service interface/impl → Repository or Feign).

```mermaid
classDiagram
    direction TB

    %% === INFRASTRUCTURE ===
    class DiscoveryServiceApplication {
        <<Eureka Server>>
    }

    class GatewayServiceApplication {
        <<API Gateway>>
    }

    %% === USER DOMAIN ===
    class UserController {
        <<REST>>
        /api/v1/users
    }
    class UserService
    class UserRepository
    class User {
        +userId
        +email
        +targetmarket
        +profile
    }

    UserController --> UserService : uses
    UserService --> UserRepository : uses
    UserRepository --> User : manages

    %% === CV DOMAIN ===
    class CVController {
        <<REST>>
        /api/v1
    }
    class ICVService <<interface>>
    class CVService
    class CvRepo
    class Cv {
        +id_cv
        +userId
        +titreDeProfil
    }

    CVController --> ICVService : uses
    CVService ..|> ICVService : implements
    CVController --> ICVService
    ICVService --> CvRepo : (impl)
    CVService --> CvRepo : uses
    CvRepo --> Cv : manages

    %% === MISSION DOMAIN ===
    class MissionController {
        <<REST>>
        /api/v1/missions
    }
    class IMissionService <<interface>>
    class MissionService
    class MissionRepository
    class UserClient {
        <<Feign>>
        getUserById(id)
    }
    class Mission {
        +idMission
        +user_id
        +statusMission
    }

    MissionController --> IMissionService : uses
    MissionService ..|> IMissionService : implements
    MissionService --> MissionRepository : uses
    MissionService --> UserClient : calls user-service
    MissionRepository --> Mission : manages

    %% === GATEWAY → SERVICES ===
    GatewayServiceApplication ..> UserController : routes to user-service
    GatewayServiceApplication ..> CVController : routes to cv_service
    GatewayServiceApplication ..> MissionController : routes to mission_service
    DiscoveryServiceApplication ..> GatewayServiceApplication : registers
```

**Summary:**

| Layer        | User        | CV                    | Mission                 |
|-------------|-------------|------------------------|-------------------------|
| **Entry**   | Gateway     | Gateway                | Gateway                 |
| **Controller** | UserController | CVController (+ Education, Experience, Langue, Competence) | MissionController, CandidatureController, MissionFavoriController |
| **Service** | UserService | ICVService / CVService | IMissionService / MissionService |
| **Persistence / External** | UserRepository | CvRepo (+ EducationRepo, etc.) | MissionRepository, **UserClient** (Feign → user-service) |

---

## 2. Sequence diagrams (clear & logical)

All flows: **UI (client) → Gateway → Controller → Service → Repository or Feign**. Discovery is used by Gateway to resolve service URLs (not shown in every diagram for simplicity).

---

### 2.1 Get user by ID (e.g. used by Mission service via Feign)

**Actor:** Client (or Mission_service via Feign). **Path:** `GET /api/v1/users/{id}`.

```mermaid
sequenceDiagram
    participant UI as UI / Client
    participant GW as Gateway
    participant UC as UserController
    participant US as UserService
    participant UR as UserRepository

    UI->>GW: GET /user-service/api/v1/users/{id}
    GW->>UC: GET /api/v1/users/{id}
    UC->>US: getUserById(id)
    US->>UR: findById(id)
    UR-->>US: User
    US-->>UC: User
    UC-->>GW: User (JSON)
    GW-->>UI: User (JSON)
```

---

### 2.2 Get or create CV by user (CV domain)

**Actor:** UI. **Path:** `GET /api/v1/CVs/{userId}` or `POST /api/v1/save`.

```mermaid
sequenceDiagram
    participant UI as UI / Client
    participant GW as Gateway
    participant CC as CVController
    participant ICS as ICVService (CVService)
    participant CvR as CvRepo

    UI->>GW: GET /cv_service/api/v1/CVs/{userId}
    GW->>CC: GET /api/v1/CVs/{userId}
    CC->>ICS: getCVsByUserId(userId)
    ICS->>CvR: findByUserId(userId)
    CvR-->>ICS: Cv
    ICS-->>CC: Cv
    CC-->>GW: Cv (JSON)
    GW-->>UI: Cv (JSON)
```

---

### 2.3 Get missions for user (filtered by target market) – cross-service

**Actor:** UI. **Flow:** Mission service calls User service to get `targetmarket`, then filters missions.

```mermaid
sequenceDiagram
    participant UI as UI / Client
    participant GW as Gateway
    participant MC as MissionController
    participant MS as MissionService
    participant UC as UserClient (Feign)
    participant UserSvc as User Controller/Service
    participant MR as MissionRepository

    UI->>GW: GET /mission_service/api/v1/missions/for-user?userId=...
    GW->>MC: GET /api/v1/missions/for-user?userId=...
    MC->>MS: getMissionsForUser(userId)
    MS->>UC: getUserById(userId)
    UC->>UserSvc: GET /api/v1/users/{id}
    UserSvc-->>UC: User (targetmarket)
    UC-->>MS: User
    MS->>MR: findByTargetMarketAndContractType(...)
    MR-->>MS: List Mission
    MS-->>MC: List Mission
    MC-->>GW: List Mission (JSON)
    GW-->>UI: List Mission (JSON)
```

---

### 2.4 Create candidature (Mission domain)

**Actor:** UI. **Path:** `POST /api/v1/candidatures`.

```mermaid
sequenceDiagram
    participant UI as UI / Client
    participant GW as Gateway
    participant CandC as CandidatureController
    participant CandS as CandidatureService
    participant CandR as CandidatureRepository
    participant MR as MissionRepository

    UI->>GW: POST /mission_service/api/v1/candidatures
    GW->>CandC: POST /api/v1/candidatures
    CandC->>CandS: create(candidature)
    CandS->>MR: findById(missionId)
    MR-->>CandS: Mission
    CandS->>CandR: save(candidature)
    CandR-->>CandS: Candidature
    CandS-->>CandC: Candidature
    CandC-->>GW: Candidature (JSON)
    GW-->>UI: Candidature (JSON)
```

---

### 2.5 Gateway routing (with Discovery)

**How** the UI reaches any service: Gateway uses Discovery (Eureka) to resolve the service-id from the URL to an instance.

```mermaid
sequenceDiagram
    participant UI as UI / Client
    participant GW as Gateway
    participant Eureka as Discovery (Eureka)
    participant SVC as Target Service (user / cv / mission)

    UI->>GW: GET http://gateway:9082/user-service/api/v1/users/1
    GW->>Eureka: resolve "user-service"
    Eureka-->>GW: instance URL(s)
    GW->>SVC: GET /api/v1/users/1
    SVC-->>GW: response
    GW-->>UI: response
```

---

## 3. Layer summary (for sequence)

| Layer        | Role |
|-------------|------|
| **UI**      | Frontend or external client (e.g. Angular). |
| **Gateway** | Single entry (port 9082). Path = `/<service-id>/...` → routes to that service. |
| **Controller** | REST endpoint; receives HTTP, delegates to service, returns response. |
| **Service** | Business logic; uses Repository and/or Feign client. |
| **Repository** | Database access (JPA). |
| **Feign (UserClient)** | HTTP client to `user-service`; used by Mission_service to get user's `targetmarket`. |

---

**Files reference:** See `BACKEND_DOMAINS_SUMMARY.md` at project root for detailed class paths and flows.
