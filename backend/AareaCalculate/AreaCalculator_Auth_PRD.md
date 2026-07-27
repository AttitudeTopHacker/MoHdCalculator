# PRD — AreaCalculator: Authentication Module
**Login | Signup | Forgot Password**

---

## 1. Project Summary

| Field | Value |
|---|---|
| Project Name | AreaCalculator |
| Backend Package | `com.salman.ansari.enterprises.areacalculator` |
| Backend Framework | Spring Boot 3.x (Java) |
| Frontend Framework | React (Vite) |
| Database | Supabase (PostgreSQL) |
| API Style | Fully RESTful, JSON, stateless (JWT-based auth) |
| Phase 1 Scope | Login, Signup, Forgot Password pages only (frontend + backend, no other app features yet) |

**Goal:** Ship a production-ready authentication module first. Everything else in the app (calculator features, dashboards, etc.) is built later on top of this foundation. An AI coding agent (Claude Code) will implement this PRD directly.

---

## 2. Design Reference (Theme Spec)

Based on the provided mockup screenshot — dark, premium theme.

| Element | Spec |
|---|---|
| Background | Near-black (`#0D0D0D` – `#121212`) with a subtle animated/static flowing wave-line graphic (white, low-opacity) in the corners |
| Heading ("Welcome!") | Large, bold, dark-orange (`#E8791A` approx.), no card background |
| Card container | Rounded rectangle, thin teal/turquoise border (`#2EE6C5`), transparent/near-black fill, generous padding |
| Input fields | Dark fill, teal border, teal placeholder text, white input text, icon prefix (mail icon, lock icon) inside the field |
| Primary button (Login/Signup) | Solid teal/turquoise (`#2EE6C5`) fill, dark text, thin magenta/pink outline for a subtle glow effect, fully rounded corners |
| Secondary text links ("Forgot Password?", "Register here") | White text, medium weight, right/center aligned |
| Divider | "OR" centered, muted gray |
| Google button | Transparent/dark fill, pink/magenta thin border, orange text, Google "G" icon |
| Typography | Rounded sans-serif (e.g. Poppins / Quicksand style), friendly and modern |
| Corner radius | Large across all elements (~16–20px) — soft, premium feel |

Frontend build should treat this as a **design token set** (colors as CSS variables) so it's easy to reuse across Login, Signup, and Forgot Password screens consistently.

---

## 3. Tech Stack

### Backend
- Spring Boot 3.x
- Spring Web (REST controllers)
- Spring Security + JWT (jjwt or similar) for stateless auth
- Spring Data JPA (talking to Supabase Postgres via JDBC/Hibernate)
- Validation (`spring-boot-starter-validation`)
- BCrypt for password hashing
- Java Mail / Supabase Auth email hook (or a transactional email provider) for OTP / reset link delivery
- Maven build

### Frontend
- React 18 + Vite
- React Router (routes: `/login`, `/signup`, `/forgot-password`)
- Axios for API calls
- Context API (or a lightweight store) for auth/token state
- Plain CSS with variables (or Tailwind — team's call) implementing the theme tokens above

### Database — Supabase (Postgres)
Single source of truth for user data. Spring Boot connects directly to the Supabase Postgres instance via connection string (not via Supabase client SDK), so normal JPA entities work.

---

## 4. Database Schema (Phase 1)

**Table: `users`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | default `gen_random_uuid()` |
| full_name | text | |
| email | text, unique, not null | |
| password_hash | text, not null | BCrypt hash |
| is_verified | boolean | default `false` |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | default `now()` |

**Table: `password_reset_otp`**

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | |
| otp_code | varchar(4) | 4-digit numeric |
| expires_at | timestamptz | e.g. now() + 10 min |
| used | boolean | default `false` |
| created_at | timestamptz | default `now()` |

---

## 5. REST API Endpoints (Phase 1)

Base path: `/api/v1/auth`

| Method | Endpoint | Purpose | Body |
|---|---|---|---|
| POST | `/signup` | Create new user | `{ fullName, email, password }` |
| POST | `/login` | Authenticate, return JWT | `{ email, password }` |
| POST | `/forgot-password` | Send 4-digit OTP to email | `{ email }` |
| POST | `/reset-password/verify-otp` | Validate OTP | `{ email, otp }` |
| POST | `/reset-password` | Set new password after OTP verified | `{ email, otp, newPassword }` |
| GET | `/me` | Return current user from JWT (sanity check route) | — (Bearer token) |

All responses follow a consistent envelope:
```json
{ "success": true, "message": "...", "data": { } }
```
Errors follow the same shape with `"success": false` and an error `message`, using proper HTTP status codes (400/401/404/409/500).

---

## 6. Frontend Pages (Phase 1)

### 6.1 Login Page (`/login`)
- Email/mobile + password fields (icon-prefixed, per theme)
- "Forgot Password?" link → `/forgot-password`
- Login button → calls `POST /api/v1/auth/login`, stores JWT, redirects to a placeholder `/dashboard`
- "Don't have an account? Register here." → `/signup`
- "Continue with Google" button (UI only for Phase 1 — OAuth wiring can follow in Phase 2)
- Loading overlay/spinner state while request is in flight
- Inline error banner on invalid credentials

### 6.2 Signup Page (`/signup`)
- Full name, email, password, confirm password fields
- Client-side validation (email format, password match, min length)
- Submit → `POST /api/v1/auth/signup` → on success, redirect to `/login` with a success toast
- "Already have an account? Login here." link back to `/login`

### 6.3 Forgot Password Page (`/forgot-password`)
- Step 1: Email input → `POST /forgot-password` → sends OTP
- Step 2: 4-digit OTP input (auto-focus, numeric) + "Resend OTP" link → `POST /reset-password/verify-otp`
- Step 3: New password + confirm → `POST /reset-password` → redirect to `/login` on success

All three pages share the same card/theme component so the visual language stays identical.

---

## 7. Suggested Folder Structure

**Backend**
```
src/main/java/com/salman/ansari/enterprises/areacalculator/
 ├── AreaCalculatorApplication.java
 ├── config/          (SecurityConfig, JwtConfig, CorsConfig)
 ├── controller/       (AuthController)
 ├── service/          (AuthService, EmailService)
 ├── repository/       (UserRepository, OtpRepository)
 ├── entity/           (User, PasswordResetOtp)
 ├── dto/              (SignupRequest, LoginRequest, etc.)
 ├── security/         (JwtUtil, JwtFilter)
 └── exception/        (GlobalExceptionHandler)
```

**Frontend**
```
src/
 ├── pages/
 │   ├── Login.jsx
 │   ├── Signup.jsx
 │   └── ForgotPassword.jsx
 ├── components/
 │   ├── AuthCard.jsx
 │   ├── InputField.jsx
 │   └── PrimaryButton.jsx
 ├── api/
 │   └── authApi.js
 ├── context/
 │   └── AuthContext.jsx
 ├── styles/
 │   └── theme.css   (CSS variables from Section 2)
 └── App.jsx
```

---

## 8. Environment / Config

**Backend `application.properties`**
```
spring.datasource.url=jdbc:postgresql://<supabase-host>:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=${SUPABASE_DB_PASSWORD}
jwt.secret=${JWT_SECRET}
jwt.expiration-ms=3600000
```

**Frontend `.env`**
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 9. Out of Scope for Phase 1
- Google OAuth actual integration (UI placeholder only)
- Any AreaCalculator core feature (calculator logic, dashboards)
- Role-based access control
- Email templates beyond a plain OTP message

---

## 10. Definition of Done (Phase 1)
- [ ] Spring Boot app boots with package `com.salman.ansari.enterprises.areacalculator`
- [ ] Supabase Postgres connected, `users` and `password_reset_otp` tables created
- [ ] All 6 endpoints working and testable via Postman/curl
- [ ] React app has working Login, Signup, Forgot Password pages matching the theme spec
- [ ] JWT issued on login, stored client-side, `/me` route validates it
- [ ] End-to-end flow tested: signup → login → forgot password → reset → login with new password
