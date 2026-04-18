# AgriConnect — Project Tech Stack

Complete inventory of every technology, library, and tool used in this project, with versions, purpose, and configuration notes.

---

## Runtime & Tooling Requirements

| Tool | Required Version | Notes |
|---|---|---|
| **Node.js** | ≥ 18 LTS | ESM (`"type":"module"`) used in both backend & frontend config |
| **npm** | ≥ 9 | Bundled with Node 18+ |
| **MySQL** | 8.0+ | utf8mb4 charset required for Sinhala text support |
| **Git** | any recent | — |

### Operations & Infrastructure (CI/CD)

| Tool / Technology | Version | Purpose |
|---|---|---|
| **Docker** | 20.x Alpine | Containerizes Backend (Node.js) and Frontend (Nginx) |
| **Docker Compose** | 3.x | Orchestrates entire local/production environment |
| **Nginx** | 1.alpine | Serves compiled React app and acts as a **Reverse Proxy** to backend |
| **GitHub Actions** | v4 | Continuous Integration (CI) pipeline (Builds & Tests on every push) |
| **Microsoft Azure** | — | Target Cloud Deployment (App Service, ACR, Flexible MySQL Server) |

---

## Backend

### Core Framework & Server

| Package | Version (pinned) | Purpose |
|---|---|---|
| `express` | ^4.18.2 | HTTP framework — routing, middleware pipeline |
| `socket.io` | ^4.8.3 | WebSocket server for real-time chat; JWT-authenticated connections |
| `http` (built-in) | — | `createServer(app)` wraps Express so Socket.IO can share the port |
| `dotenv` | ^16.4.1 | Loads `.env` into `process.env`; loaded at startup before anything else |
| `nodemon` *(dev)* | ^3.0.3 | Auto-restarts server on file changes (`npm run dev`) |

### Database & ORM

| Package | Version | Purpose |
|---|---|---|
| `mysql2` | ^3.16.1 | MySQL driver (Promise-based); used by both Sequelize and raw queries |
| `sequelize` | ^6.37.7 | ORM — models, associations, query builder |

**Sequelize models (14 total):**
`Activity`, `Crop`, `CropPlan`, `FarmerDetail`, `GeneratedId`, `HarvestRecord`, `InstructorDetail`, `InstructorRating`, `Meeting`, `Message`, `PestReport`, `Region`, `SystemSetting`, `User`

**Database:** `agriconnect` (MySQL 8), 15 tables. Full schema: `backend/migrations/001-init.sql`.

### Authentication & Security

| Package | Version | Purpose |
|---|---|---|
| `jsonwebtoken` | ^9.0.3 | Signs and verifies JWT access tokens (HS256); secret validated at startup (min 32 chars) |
| `bcryptjs` | ^3.0.3 | Hashes passwords (salt rounds: 12) |
| `helmet` | ^8.1.0 | Sets HTTP security headers (HSTS, X-Frame-Options, CSP in prod, etc.) |
| `express-rate-limit` | ^8.2.1 | Auth endpoints: 20 req/15 min; General: 100 req/15 min |
| `cors` | ^2.8.5 | CORS whitelist from `CORS_ORIGINS` or `FRONTEND_URL` env vars |
| `express-validator` | ^7.3.1 | Input validation on auth and form endpoints |
| `crypto` (built-in) | — | `crypto.randomInt()` for secure ID generation |

### File Uploads & Storage

| Package | Version | Purpose |
|---|---|---|
| `multer` | ^2.0.2 | Multipart form parsing; memory storage (buffers piped to Cloudinary) |
| `cloudinary` | ^2.9.0 | Cloud image/file storage; used for profile pictures and plan attachments |
| `streamifier` | ^0.1.1 | Converts Buffer → ReadableStream for Cloudinary upload stream API |

**Upload limits:** 10 MB file size; MIME filter: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

### Email

| Package | Version | Purpose |
|---|---|---|
| `nodemailer` | ^7.0.12 | Sends verification and notification emails via Gmail SMTP (App Password) |

### Performance & Utilities

| Package | Version | Purpose |
|---|---|---|
| `compression` | ^1.8.1 | Gzip/Brotli response compression |
| `axios` | ^1.13.4 | HTTP client used in services (e.g. external API calls) |
| `node-fetch` | ^3.3.2 | Fetch API polyfill for ESM contexts |
| `form-data` | ^4.0.5 | FormData implementation used alongside node-fetch |

### Dev / Test Tooling

| Package | Version | Purpose |
|---|---|---|
| `@faker-js/faker` | ^10.2.0 | Generates realistic demo data in seeders |
| `node:test` (built-in) | — | Native Node.js test runner for unit/integration tests |
| `supertest` | ^7.2.2 | HTTP assertions for testing Express API routes |
| `cross-env` | ^10.1.0 | Sets `NODE_ENV=test` uniformly across platforms |
| `swagger-jsdoc` | ^6.2.8 | Generates OpenAPI config from JSDoc comments |
| `swagger-ui-express` | ^5.0.1 | Serves Swagger API docs at `/api-docs` |

### npm Scripts

| Script | Command | Use |
|---|---|---|
| `npm start` | `node server.js` | **Production** start |
| `npm run dev` | `nodemon server.js` | Development with auto-restart |
| `npm test` | `cross-env NODE_ENV=test node --test "tests/**/*.test.js"` | Run backend test suite |
| `npm run migrate` | `node migrations/run-migrations.js` | Apply pending SQL migrations |
| `npm run seed` | `node -r dotenv/config seeders/run-seeders.js` | **Production** seed: admin + crops + system settings |
| `npm run seed:demo` | `node -r dotenv/config seeders/demo/run-demo-seeders.js` | **Demo** seed: demo instructor + farmer (skip for client delivery) |
| `npm run seed:admin` | `node seeders/admin.seeder.js` | Seed admin account only |
| `npm run db:ensure` | `node scripts/ensure-database.js` | Create DB if it doesn't exist |

---

## Frontend

### Core Framework

| Package | Version | Purpose |
|---|---|---|
| `react` | 18.2.0 | UI component library |
| `react-dom` | 18.2.0 | DOM renderer |
| `vite` | ^7.3.1 | Build tool & dev server (ESM-native, HMR) |
| `@vitejs/plugin-react` | ^4.2.1 | Vite plugin: Babel/SWC transforms for React JSX |

### Routing

| Package | Version | Purpose |
|---|---|---|
| `react-router-dom` | ^6.21.0 | Client-side routing with nested routes and role-based guards |

### Styling

| Package | Version | Purpose |
|---|---|---|
| `bootstrap` | ^5.3.3 | CSS utility + component framework |
| `react-bootstrap` | ^2.10.2 | Bootstrap components as React components (no jQuery dependency) |
| `sass` *(dev)* | ^1.97.3 | SCSS compilation for custom component styles |

### Real-time

| Package | Version | Purpose |
|---|---|---|
| `socket.io-client` | ^4.8.3 | WebSocket client; connects to backend Socket.IO server for chat |

### Internationalisation

| Package | Version | Purpose |
|---|---|---|
| `i18next` | ^25.8.14 | i18n framework core |
| `react-i18next` | ^16.5.4 | React bindings (`useTranslation`, `Trans`) |

**Languages supported:** English (`en`), Sinhala (`si`)  
**Namespaces (6):** `common`, `auth`, `farmer`, `instructor`, `admin`, `home`  
**Translation files:** `frontend/src/locales/{en,si}/*.json`

### PDF Generation

| Package | Version | Purpose |
|---|---|---|
| `jspdf` | ^4.2.0 | Client-side PDF creation (reports, crop plan exports) |
| `jspdf-autotable` | ^5.0.7 | Table extension for jsPDF |

### Utilities

| Package | Version | Purpose |
|---|---|---|
| `prop-types` | ^15.8.1 | Runtime prop type checking in development |

### Dev / Lint Tooling

| Package | Version | Purpose |
|---|---|---|
| `eslint` | ^9.39.2 | JavaScript linter |
| `@eslint/js` | ^9.0.0 | ESLint core rules |
| `eslint-plugin-react` | ^7.37.5 | React-specific lint rules |
| `globals` | ^15.0.0 | Global variable definitions for ESLint |

### Testing

| Package | Version | Purpose |
|---|---|---|
| `vitest` | ^3.2.4 | Ultra-fast Vite-native unit testing framework |
| `@playwright/test` | ^1.59.1 | End-to-End (E2E) testing framework |
| `jsdom` | ^26.1.0 | Lightweight browser DOM environment used by Vitest |

### Build Configuration (Vite)

| Setting | Value | Notes |
|---|---|---|
| `build.outDir` | `dist` | Production output |
| `build.sourcemap` | `false` | Disabled in prod (security) |
| `build.minify` | `esbuild` | Fast minification |
| `build.target` | `es2020` | Modern browser target |
| `esbuild.drop` | `['console', 'debugger']` | Strips all `console.*` and `debugger` in prod build |
| `chunkSizeWarningLimit` | 1600 KB | Increased for PDF vendor chunk |

**Manual chunks:** `pdf-vendor` (jsPDF + html2canvas) split to avoid bloating the main bundle.

**Dev server proxy:**
- `/api/*` → `http://localhost:5005` (backend REST)
- `/socket.io/*` → `http://localhost:5005` (WebSocket, `ws: true`)

### npm Scripts

| Script | Command | Use |
|---|---|---|
| `npm run dev` | `vite` | Development server (HMR, port 5173) |
| `npm run build` | `vite build` | Production build → `dist/` |
| `npm run lint` | `eslint . --ext js,jsx` | Lint check (zero warnings policy) |
| `npm run test` | `vitest run` | Run unit tests |
| `npm run test:watch` | `vitest` | Run unit tests in watch mode |
| `npm run test:e2e` | `playwright test` | Run E2E tests |

---

## External Services

| Service | Used For | Required? |
|---|---|---|
| **MySQL 8** | Primary database | Yes |
| **Cloudinary** | Profile pictures, plan attachments, pest report photos | Yes (free tier OK) |
| **Gmail SMTP** | Email verification, notifications | Yes (App Password) |
| **OpenWeatherMap API** | Weather widget on farmer dashboard | Optional (widget hidden if key absent) |

---

## Security Measures Summary

| Concern | Implementation |
|---|---|
| Password storage | bcryptjs, salt rounds 12 |
| Token auth | JWT HS256, 7-day expiry, secret ≥ 32 chars enforced at startup |
| Transport security | Helmet (HSTS, CSP, X-Frame-Options, etc.) |
| Brute force | express-rate-limit (auth: 20/15 min, general: 100/15 min) |
| CORS | Whitelist from env, no wildcard in production |
| Payload DoS | Body size capped at 2 MB (10 MB files) |
| SQL injection | Sequelize ORM parameterised queries; raw queries use `replacements:[]` |
| XSS | CSP headers via Helmet; console stripped in prod build |
| Secure randomness | `crypto.randomInt()` for ID generation (no `Math.random()`) |
| File uploads | MIME type filter + 10 MB cap + memory storage (never written to disk) |
| Sensitive logs | Request logging strips query strings to prevent token leakage |
| Dev bypass | `DEV_EMAIL_BYPASS` gated by `NODE_ENV !== 'production'` |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DB_NAME` | ✅ | MySQL database name |
| `DB_USER` | ✅ | MySQL username |
| `DB_PASSWORD` | ✅ | MySQL password |
| `DB_HOST` | ✅ | MySQL host (default: `localhost`) |
| `DB_PORT` | ✅ | MySQL port (default: `3306`) |
| `JWT_SECRET` | ✅ | ≥ 128-char random string. Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRE` | ✅ | Token expiry (e.g. `7d`) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `PORT` | ❌ | HTTP port (default: `5005`) |
| `FRONTEND_URL` | ✅ | CORS allowed origin(s), comma-separated |
| `CORS_ORIGINS` | ❌ | Overrides `FRONTEND_URL` for CORS/Socket when set |
| `GMAIL_EMAIL` | ✅ | Gmail address for outgoing email |
| `GMAIL_APP_PASSWORD` | ✅ | Gmail App Password (not your real Gmail password) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `DEV_EMAIL_BYPASS` | ❌ | Email that skips verification in dev. **Must be empty in production.** |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend REST API base URL (e.g. `http://localhost:5005/api`) |
| `VITE_SOCKET_URL` | ✅ | Backend Socket.IO URL (e.g. `http://localhost:5005`) |
| `VITE_OPENWEATHER_API_KEY` | ❌ | OpenWeatherMap API key for weather widget |

---

## Database Tables (15)

| Table | Model | Key Fields |
|---|---|---|
| `users` | `User` | id, email, password_hash, role, is_verified, is_active |
| `farmer_details` | `FarmerDetail` | user_id, farmer_id, nic, zone, division, district |
| `instructor_details` | `InstructorDetail` | user_id, instructor_id, zone, specialization, average_rating |
| `generated_ids` | `GeneratedId` | role, id_value, is_used |
| `regions` | `Region` | id, district, zone, division |
| `crops` | `Crop` | id, name, season, description |
| `crop_plans` | `CropPlan` | id, farmer_id, crop_id, status, attachments, attachment_names |
| `harvest_records` | `HarvestRecord` | id, crop_plan_id, yield_amount, harvest_date |
| `pest_reports` | `PestReport` | id, farmer_id, description, attachments, status |
| `activities` | `Activity` | id, farmer_id, activity_type, description, date |
| `meetings` | `Meeting` | id, instructor_id, farmer_id, title, scheduled_at, status |
| `messages` | `Message` | id, sender_id, receiver_id, content, is_read |
| `instructor_ratings` | `InstructorRating` | id, farmer_id, instructor_id, rating, comment |
| `system_settings` | `SystemSetting` | id, setting_key, setting_value |
| `migrations` | — | id, name, executed_at |
