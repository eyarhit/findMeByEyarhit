# Backend Domains Summary (CV, Mission, User, Discovery, Gateway)

**Scope:** CV, Mission, User, Discovery, Gateway. Excluded: Codingame, Quiz.

**Purpose:** Structured summary for drawing class diagrams and sequence diagrams (interface → controller → service → repository / Feign client).

---

## 1. Discovery (Eureka Server)

**Role:** Service discovery. Other services register here; Gateway uses it to route by service-id.

| Category | Path | Main classes |
|----------|------|--------------|
| Application | `DiscoveryService/src/main/java/com/dpc/discoveryservice/DiscoveryServiceApplication.java` | `DiscoveryServiceApplication` (@EnableEurekaServer, @SpringBootApplication) |

**Connections:** None (standalone Eureka server). All other services set `eureka.client.service-url.defaultZone` and register; Gateway has `spring.cloud.gateway.discovery.locator.enabled=true` and `lower-case-service-id=true`.

---

## 2. Gateway

**Role:** Single entry point; routes requests to discovered services by Eureka service-id (no explicit route YAML in repo).

| Category | Path | Main classes |
|----------|------|--------------|
| Application | `GatewayService/src/main/java/com/dpc/gatewayservice/GatewayServiceApplication.java` | `GatewayServiceApplication` (@SpringBootApplication) |
| Config | `GatewayService/src/main/resources/application.properties` | — (discovery locator, Eureka client, port 9082) |

**Routing:** Dynamic via `spring.cloud.gateway.discovery.locator.enabled=true`. Routes are `http://GatewayHost:9082/<service-id>/...` (e.g. `user-service`, `cv_service`, `mission_service` from Eureka).

**Sequence (conceptual):** Client → Gateway → (Eureka lookup by path) → Target service (User / CV / Mission).

---

## 3. User domain (User_service)

**Eureka name:** `user-service`

### 3.1 Entities (models)

| File | Class | Notes |
|------|--------|------|
| `User_service/.../Entities/User.java` | `User` | Main user entity (userId, email, role, targetmarket, profile, etc.) |
| `User_service/.../Entities/Role.java` | `Role` | Role entity |
| `User_service/.../Entities/ERole.java` | `ERole` | Enum (Admin, Freelancer, ChargeRecrutement, Candidat, ESN) |
| `User_service/.../Entities/UserProfile.java` | `UserProfile` | 1–1 with User |
| `User_service/.../Entities/Status.java` | `Status` | User status enum |
| `User_service/.../Entities/Notification.java` | `Notification` | Notifications |
| `User_service/.../Entities/Message.java` | `Message` | Chat message |
| `User_service/.../Entities/MessageStatus.java` | `MessageStatus` | Enum |
| `User_service/.../Entities/MessageType.java` | `MessageType` | Enum |
| `User_service/.../Entities/ChatRoom.java` | `ChatRoom` | Chat room |
| `User_service/.../Entities/Document.java` | `Document` | User document |
| `User_service/.../Entities/FileData.java` | `FileData` | File metadata |
| `User_service/.../Entities/Otp.java` | `Otp` | OTP for registration |
| `User_service/.../Entities/PasswordResetToken.java` | `PasswordResetToken` | Password reset |
| `User_service/.../Entities/BlacklistedToken.java` | `BlacklistedToken` | Logout blacklist |
| `User_service/.../Entities/Mail.java` | `Mail` | Email payload |

### 3.2 DTOs

| File | Class |
|------|--------|
| `.../DTO/UserRegistrationDTO.java` | `UserRegistrationDTO` |
| `.../DTO/UserResponseDTO.java` | `UserResponseDTO` |
| `.../DTO/UserInfoDTO.java` | `UserInfoDTO` |
| `.../DTO/UserBasicDTO.java` | `UserBasicDTO` |
| `.../DTO/UserProfileDTO.java` | `UserProfileDTO` |
| `.../DTO/ChatMessageDto.java` | `ChatMessageDto` |
| `.../DTO/TypingNotificationDto.java` | `TypingNotificationDto` |
| `.../DTO/NotificationMessage.java` | `NotificationMessage` |

### 3.3 Repositories

| File | Interface | Entity |
|------|------------|--------|
| `.../Repository/UserRepository.java` | `UserRepository` | User |
| `.../Repository/RoleRepository.java` | `RoleRepository` | Role |
| `.../Repository/NotificationRepository.java` | `NotificationRepository` | Notification |
| `.../Repository/MessageRepository.java` | `MessageRepository` | Message |
| `.../Repository/ChatRoomRepository.java` | `ChatRoomRepository` | ChatRoom |
| `.../Repository/DocumentRepository.java` | `DocumentRepository` | Document |
| `.../Repository/OtpRepository.java` | `OtpRepository` | Otp |
| `.../Repository/PasswordResetTokenRepository.java` | `PasswordResetTokenRepository` | PasswordResetToken |
| `.../Repository/BlacklistedTokenRepository.java` | `BlacklistedTokenRepository` | BlacklistedToken |

### 3.4 Services

| File | Class / Interface | Depends on |
|------|--------------------|------------|
| `.../services/UserService.java` | `UserService` | UserRepository, RoleRepository, PasswordEncoder, QuizClient, TwilioClient, EmailService, FileStorageService, OtpService, DocumentRepository |
| `.../services/MessageService.java` | `MessageService` | MessageRepository, UserRepository, ChatRoomRepository, SimpMessagingTemplate, FileStorageService |
| `.../services/DocumentService.java` | `DocumentService` | DocumentRepository, etc. |
| `.../services/FileStorageService.java` | `FileStorageService` | — |
| `.../services/JwtService.java` | `JwtService` | — |
| `.../services/OtpService.java` | `OtpService` | OtpRepository |
| `.../services/EmailService.java` | `EmailService` | — |
| `.../services/PasswordResetTokenService.java` | `PasswordResetTokenService` | — |
| `.../Auth/AuthenticationService.java` | `AuthenticationService` | (auth) |

### 3.5 Controllers (REST API)

| File | Class | Base path | Uses |
|------|--------|-----------|------|
| `.../controller/usercontroller.java` | `usercontroller` | `/api/v1/users` | UserService, AuthenticationService, JwtService, OtpService, UserRepository, RoleRepository, BlacklistedTokenRepository |
| `.../controller/MessageController.java` | `MessageController` | `/api/messages` | MessageService |
| `.../controller/DocumentController.java` | `DocumentController` | `/api/document` | DocumentService, FileStorageService, DocumentRepository, UserRepository |
| `.../controller/FileStorageController.java` | `FileStorageController` | `/api/files` | FileStorageService |
| `.../controller/NotificationController.java` | `NotificationController` | (WebSocket) | NotificationRepository, SimpMessagingTemplate |
| `.../controller/ResetPasswordController.java` | `ResetPasswordController` | `api/v1/users/reset-password` | — |
| `.../controller/ForgotPasswordController.java` | `ForgotPasswordController` | `api/v1/users/forgot-password` | — |

### 3.6 Interfaces / Gateways (outbound)

| File | Type | Target service | Purpose |
|------|------|----------------|----------|
| `.../Proxy/QuizClient.java` | Feign client | QuizService | getQuizResult(userId) — excluded from scope |
| `.../Proxy/TwilioClient.java` | Feign client | Twilio | SMS/OTP |

### 3.7 Flow summary (User domain)

- **usercontroller** → UserService → UserRepository, RoleRepository, OtpService, etc.
- **usercontroller** → AuthenticationService (auth).
- **usercontroller** GET `/api/v1/users/{userId}`: direct UserRepository (used by Mission_service Feign).
- **MessageController** → MessageService → MessageRepository, UserRepository, ChatRoomRepository, FileStorageService.
- **DocumentController** → DocumentService / FileStorageService → DocumentRepository.
- **NotificationController** (WebSocket): NotificationRepository, SimpMessagingTemplate.

---

## 4. CV domain (Cv_service)

**Eureka name:** `Cv_service`

### 4.1 Entities (models)

| File | Class | Notes |
|------|--------|------|
| `Cv_service/.../Entites/Cv.java` | `Cv` | Main CV (id_cv, userId, titreDeProfil, completedSteps, educations, experiences, langues, competences) |
| `Cv_service/.../Entites/Education.java` | `Education` | Education entry (linked to Cv) |
| `Cv_service/.../Entites/Experience.java` | `Experience` | Experience entry (linked to Cv) |
| `Cv_service/.../Entites/Langue.java` | `Langue` | Language (name, niveau) |
| `Cv_service/.../Entites/Competence.java` | `Competence` | Skills (langage, framework, db, etc.) |

### 4.2 DTOs

| File | Class |
|------|--------|
| `Cv_service/.../Entites/CvDto.java` | `CvDto` (id_cv, experiences, totalAnneesExperience) |

### 4.3 Repositories

| File | Interface | Entity |
|------|------------|--------|
| `.../Repository/CvRepo.java` | `CvRepo` | Cv (findByUserId) |
| `.../Repository/EducationRepo.java` | `EducationRepo` | Education |
| `.../Repository/ExperienceRepo.java` | `ExperienceRepo` | Experience |
| `.../Repository/LangueRepo.java` | `LangueRepo` | Langue |
| `.../Repository/CompetenceRepo.java` | `CompetenceRepo` | Competence |

### 4.4 Services (interfaces + impl)

| File | Class / Interface | Depends on |
|------|--------------------|------------|
| `.../Service/ICVService.java` | `ICVService` | — |
| `.../Service/CVService.java` | `CVService` implements `ICVService` | CvRepo, CompetenceRepo, LangueRepo, ExperienceRepo, EducationRepo, ExperienceService |
| `.../Service/IEducationService.java` | `IEducationService` | — |
| `.../Service/EducationService.java` | `EducationService` implements `IEducationService` | CvRepo, EducationRepo |
| `.../Service/IExperienceService.java` | `IExperienceService` | — |
| `.../Service/ExperienceService.java` | `ExperienceService` implements `IExperienceService` | CvRepo, ExperienceRepo |
| `.../Service/ILangueService.java` | `ILangueService` | — |
| `.../Service/LangueService.java` | `LangueService` implements `ILangueService` | CvRepo, LangueRepo |
| `.../Service/ICompetenceService.java` | `ICompetenceService` | — |
| `.../Service/CompetenceService.java` | `CompetenceService` implements `ICompetenceService` | CvRepo, CompetenceRepo |

### 4.5 Controllers

| File | Class | Base path | Uses |
|------|--------|-----------|------|
| `.../Controller/CVController.java` | `CVController` | `/api/v1` | ICVService, CVService |
| `.../Controller/EducationController.java` | `EducationController` | `/api/v1/educations` | IEducationService |
| `.../Controller/ExperienceController.java` | `ExperienceController` | `/api/v1/experiences` | IExperienceService |
| `.../Controller/LangueController.java` | `LangueController` | `/api/v1/langues` | ILangueService |
| `.../Controller/CompetenceController.java` | `CompetenceController` | `/api/v1/competences` | ICompetenceService |

### 4.6 Flow summary (CV domain)

- **CVController** → ICVService (CVService) → CvRepo (+ CompetenceRepo, LangueRepo, ExperienceRepo, EducationRepo, ExperienceService for create/update).
- **EducationController** → IEducationService (EducationService) → CvRepo, EducationRepo.
- **ExperienceController** → IExperienceService (ExperienceService) → CvRepo, ExperienceRepo.
- **LangueController** → ILangueService (LangueService) → CvRepo, LangueRepo.
- **CompetenceController** → ICompetenceService (CompetenceService) → CvRepo, CompetenceRepo.
- No Feign or external gateway in CV service; standalone by userId.

---

## 5. Mission domain (Mission_service)

**Eureka name:** `Mission_service`. **Feign:** calls `user-service` via `UserClient`.

### 5.1 Entities (models)

| File | Class | Notes |
|------|--------|------|
| `Mission_service/.../model/Mission.java` | `Mission` | idMission, user_id, reference_code, statusMission, descrip_mission, profilDemande, ville, pays, candidatures |
| `Mission_service/.../model/Descrip_mission.java` | `Descrip_mission` | 1–1 with Mission (mission_name, typeContrat, salaire, isRemote, etc.) |
| `Mission_service/.../model/ProfilDemande.java` | `ProfilDemande` | 1–1 with Mission (exigences, annees_experiences) |
| `Mission_service/.../model/Candidature.java` | `Candidature` | candidatId, mission, IdDocumentCv |
| `Mission_service/.../model/MissionFavori.java` | `MissionFavori` | userId, mission, userType |
| `Mission_service/.../model/Ville.java` | `Ville` | Ville (linked to Pays) |
| `Mission_service/.../model/Pays.java` | `Pays` | Pays |
| `Mission_service/.../model/TypeContrat.java` | `TypeContrat` | Enum (CDI, CDD, FREELANCE, etc.) |
| `Mission_service/.../model/Statut.java` | `Statut` | Enum |
| `Mission_service/.../model/StatusMission.java` | `StatusMission` | Enum |
| `Mission_service/.../model/StatusCandidature.java` | `StatusCandidature` | Enum |
| `Mission_service/.../model/UserType.java` | `UserType` | Enum (for favoris) |
| `Mission_service/.../model/Langue.java` | `Langue` | Enum (mission language) |
| `Mission_service/.../model/User.java` | `User` | DTO-like (userId, targetmarket) — used as Feign response from user-service |

### 5.2 DTOs

Mission domain uses entities directly in API; no separate DTO package listed. `User` in model is the Feign response shape.

### 5.3 Repositories

| File | Interface | Entity |
|------|------------|--------|
| `.../Repository/MissionRepository.java` | `MissionRepository` | Mission (findByTargetMarketAndContractType, etc.) |
| `.../Repository/CandidatureRepository.java` | `CandidatureRepository` | Candidature |
| `.../Repository/MissionFavoriRepository.java` | `MissionFavoriRepository` | MissionFavori |
| `.../Repository/VilleRepository.java` | `VilleRepository` | Ville |

### 5.4 Services (interfaces + impl)

| File | Class / Interface | Depends on |
|------|--------------------|------------|
| `.../Services/IMissionService.java` | `IMissionService` | — |
| `.../Services/MissionService.java` | `MissionService` implements `IMissionService` | MissionRepository, **UserClient** (Feign), ObjectMapper |
| `.../Services/ICandidatureService.java` | `ICandidatureService` | — |
| `.../Services/CandidatureService.java` | `CandidatureService` implements `ICandidatureService` | **UserClient**, CandidatureRepository, MissionRepository |
| `.../Services/MissionFavoriService.java` | `MissionFavoriService` | MissionFavoriRepository, MissionRepository |

### 5.5 Controllers

| File | Class | Base path | Uses |
|------|--------|-----------|------|
| `.../Controller/MissionController.java` | `MissionController` | `/api/v1/missions` | IMissionService, MissionService, VilleRepository |
| `.../Controller/CandidatureController.java` | `CandidatureController` | `api/v1/candidatures` | CandidatureService |
| `.../Controller/MissionFavoriController.java` | `MissionFavoriController` | `/api/v1/missions/favoris` | MissionFavoriService |

### 5.6 Interfaces / Gateways (outbound)

| File | Type | Target | Purpose |
|------|------|--------|---------|
| `.../feign/UserClient.java` | Feign client | `user-service` | `getUserById(Long id)` → returns `User` (userId, targetmarket) |
| `.../configuration/FeignClientConfig.java` | Config | — | RequestInterceptor to add Bearer token to Feign calls |

### 5.7 Flow summary (Mission domain)

- **MissionController** → IMissionService (MissionService) → MissionRepository, **UserClient** (for getMissionsForUser / getMissionsForFreelancer by user targetmarket).
- **CandidatureController** → CandidatureService → CandidatureRepository, MissionRepository (no direct UserClient in controller flow; UserClient injected in CandidatureService for potential use).
- **MissionFavoriController** → MissionFavoriService → MissionFavoriRepository, MissionRepository.
- **Sequence for “missions for user”:** Client → Gateway → Mission_service → MissionController → MissionService → **UserClient.getUserById(userId)** (user-service) → MissionRepository.findByTargetMarketAndContractType.

---

## 6. Cross-domain dependencies (for diagrams)

| From | To | How | Purpose |
|------|-----|-----|---------|
| Gateway | Discovery | Eureka client | Resolve service-id to instance URL |
| Gateway | User_service, Cv_service, Mission_service | HTTP (discovery locator) | Route by path = service-id |
| Mission_service | User_service | Feign `UserClient` | getUserById(userId) for targetmarket (filter missions) |

- **User_service** exposes `GET /api/v1/users/{id}`; Mission_service calls it via Feign. User entity in User_service contains `targetmarket`; Mission_service uses a small `User` model (userId, targetmarket) for the response.
- **CV_service** has no outbound Feign to other app services.
- **User_service** has Feign to Quiz and Twilio (excluded from this scope).

---

## 7. Class / sequence diagram hints

**Class diagram:**

- **Discovery:** DiscoveryServiceApplication only.
- **Gateway:** GatewayServiceApplication + application.properties (discovery locator).
- **User:** Draw usercontroller, MessageController, DocumentController, NotificationController → their services → repositories; add Feign interfaces (QuizClient, TwilioClient) as external.
- **CV:** Draw each controller → its interface (I*Service) → implementation → repositories; CVService also uses ExperienceService.
- **Mission:** Draw MissionController, CandidatureController, MissionFavoriController → IMissionService/MissionService, CandidatureService, MissionFavoriService → repositories; add **UserClient** (Feign) from MissionService and CandidatureService to “user-service”.

**Sequence diagram examples:**

1. **Request via Gateway to User by ID (e.g. from Mission):**  
   Client → Gateway → [Eureka] → user-service → usercontroller → UserRepository → Response.

2. **Missions for user (filtered by target market):**  
   Client → Gateway → mission_service → MissionController → MissionService → UserClient.getUserById(userId) → user-service (usercontroller, UserRepository) → MissionService → MissionRepository.findByTargetMarketAndContractType → Response.

3. **Create CV:**  
   Client → Gateway → cv_service → CVController → ICVService (CVService) → CvRepo (+ EducationRepo, ExperienceRepo, etc.) → Response.

4. **Create candidature:**  
   Client → Gateway → mission_service → CandidatureController → CandidatureService → MissionRepository, CandidatureRepository → Response.

---

**File path prefix used:**  
- `User_service/src/main/java/com/dpc/user_service/`  
- `Cv_service/src/main/java/com/dpc/cv_service/`  
- `Mission_service/src/main/java/com/dpc/mission_service/`  
- `DiscoveryService/src/main/java/com/dpc/discoveryservice/`  
- `GatewayService/src/main/java/com/dpc/gatewayservice/`
