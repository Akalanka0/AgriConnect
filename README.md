# AgriConnect 🌾

AgriConnect is a full-stack agricultural management platform that connects farmers, instructors (agricultural officers), and administrators. It supports crop planning with file attachments, pest report management, harvest record keeping, real-time chat, scheduling/meetings, activity tracking, and multi-language support (English & Sinhala).

---

## 🚀 Features

### 👨‍🌾 Farmer Portal
- **Crop Plans** — Create, view, and track seasonal crop plans with file attachments; receive instructor feedback.
- **Harvest Records** — Log harvest yields per crop plan for historical analysis.
- **Pest Reports** — Submit pest/disease reports with photo evidence; get instructor responses.
- **Activity Log** — Record daily farming activities with instructor comments.
- **Weather** — Real-time weather via OpenWeatherMap API.
- **Messages** — Real-time chat with assigned instructor (Socket.IO).
- **Meetings** — View scheduled field visits and appointments.
- **Settings** — Update profile, profile picture, and account preferences.

### 👨‍🏫 Instructor Portal
- **Farmer Management** — View and manage farmers assigned to your zone.
- **Crop Plan Review** — Review, annotate, and approve/reject farmer crop plans with attachments.
- **Pest Reports** — Respond to reported pest/disease issues.
- **Schedule** — Create and manage meetings/field visits for assigned farmers.
- **Reports** — View aggregated performance data across assigned farmers.
- **Ratings** — Farmers can rate their instructor; average displayed on profile.
- **Settings** — Update profile, specialization, and account preferences.

### 👮 Admin Portal
- **User Management** — Create, verify, activate/deactivate Farmers, Instructors, and Admins.
- **User ID Management** — Generate and manage system-assigned IDs per role.
- **Region Management** — Dynamically manage district → zone → division hierarchy.
- **Engagement** — View system-wide activity, user engagement, and growth metrics.
- **Reports** — High-level reports across all users.
- **System Settings** — Configure maintenance mode and global parameters.

### 🔐 Authentication & Security
- Email + password login with **JWT** (access tokens, 7-day expiry).
- Email verification on registration.
- Optional `DEV_EMAIL_BYPASS` for development.
- Rate limiting (100 req/15 min general; 20 req/15 min auth endpoints).
- Helmet HTTP security headers with strict CSP in production.
- CORS whitelist enforced on both REST API and WebSocket.
- Request body capped at 2 MB (10 MB for file uploads).
- `Math.random()` replaced with `crypto.randomInt()` everywhere.

### 🌐 Internationalisation
- Full **English** and **Sinhala (si)** support via `i18next` / `react-i18next`.
- Translation files in `frontend/src/locales/{en,si}/`.

---

## 🏗️ Architecture

### Infrastructure-as-Code & DevOps
- **Docker Compose:** Orchestrates raw MySQL, the Node Backend API, and the React Nginx Frontend together via a single `docker-compose.yml`.
- **Nginx Reverse Proxy:** Routes `/api` and `/socket.io` internally to the backend container to ensure perfect relative paths, averting CORS and localhost binding errors in production.
- **CI/CD Pipeline (GitHub Actions):** Located in `.github/workflows/ci-cd.yml`, it tests and builds both Docker container images on every push to `develop` and `main`.
- **Azure Target Platform:** Architecture ready for Microsoft Azure App Service, Container Registry (ACR), and MySQL Flexible Server using `Bicep`.

### Backend — Modular Monolith
```
backend/
├── server.js          # Express + Socket.IO entry point
├── config/db.js       # Sequelize connection
├── middleware/        # auth, error handler, rate limiter, upload
├── models/            # 14 Sequelize models (MySQL)
├── modules/           # Domain modules (each has controller + routes)
│   ├── admin/
│   ├── auth/
│   ├── crops/
│   ├── farmer/
│   ├── instructor/
│   ├── messages/
│   └── ratings/
├── services/          # Shared: email, user, data, message, rating
├── migrations/        # Numbered SQL migration files + runner
├── seeders/           # Admin, demo accounts, crops, region IDs
└── utils/             # cloudinary, jwtUtils
```

Each module owns its own `controller.js` and `routes.js`. Cross-cutting logic lives in `services/`. The 14 Sequelize models map to 15 MySQL tables (including the `migrations` tracking table).

### Frontend — Feature-Based React
```
frontend/src/
├── features/
│   ├── auth/          # Login, Register, Verify pages
│   ├── farmer/        # Farmer pages + components
│   ├── instructor/    # Instructor pages + components
│   ├── admin/         # Admin pages + components
│   └── home/          # Landing page
├── services/          # Axios API clients per role
├── components/        # Shared UI components (auth guard, etc.)
├── locales/           # i18n translation files (en, si)
├── utils/             # Shared helpers
└── config/            # Env / API base URL config
```

---

## 🛠️ Tech Stack

See [PROJECT_TECH_STACK.md](PROJECT_TECH_STACK.md) for full version-pinned details.

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite 7 |
| Styling | Bootstrap 5.3 + React-Bootstrap 2 + SASS |
| Routing | React Router v6 |
| Real-time (client) | Socket.IO Client 4.8 |
| i18n | i18next 25 + react-i18next 16 |
| PDF generation | jsPDF 4 + jspdf-autotable |
| Backend runtime | Node.js (ESM) |
| HTTP framework | Express 4.18 |
| Database | MySQL 8 |
| ORM | Sequelize 6.37 |
| Authentication | JWT (jsonwebtoken 9) + bcryptjs 3 |
| File storage | Cloudinary 2 |
| Email | Nodemailer 7 |
| Real-time (server) | Socket.IO 4.8 |
| Security | Helmet 8, express-rate-limit 8 |
| Uploads | Multer 2 (memory storage → Cloudinary) |

---

## ⚙️ Installation & Setup

### Prerequisites

| Requirement | Minimum Version |
|---|---|
| Node.js | 18 LTS or higher |
| npm | 9+ |
| MySQL Server | 8.0+ |
| Git | any recent version |

> **Optional:** A [Cloudinary](https://cloudinary.com/) account (free tier is fine) and a Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) are required for file uploads and email features respectively.  
> **Optional:** An [OpenWeatherMap](https://openweathermap.org/api) free API key for the weather widget.

---

### 2. Quick Start (Using Docker - Recommended) 🐳

The easiest way to run the entire stack (MySQL Database, Node Backend, and React Frontend) perfectly configured for your local machine is using Docker.

```bash
# 1. Provide an empty .env file in the backend (it will use default secure docker variables)
touch backend/.env

# 2. Build and start the entire cluster in the background
docker-compose up --build -d
```

That's it! 
- The **Frontend** is now live at `http://localhost`
- The **Backend** is running on internally-proxied port `5005`
- The **Database** is fully migrated and seeded with Demo Accounts automatically.

*(To stop the server, run `docker-compose down`)*

---

### 3. Manual Setup (Without Docker)

If you prefer to run the Node and React servers manually on your host machine:

#### Backend Setup

```bash
cd backend
npm install
```

**Environment Variables:**

Copy the example file and fill in your values:
```bash
cp .env.example .env   # Linux/Mac
copy .env.example .env  # Windows
```

`.env` reference:

```env
# ── Database ─────────────────────────────────────────────────────────────────
DB_NAME=agriconnect
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# ── JWT ──────────────────────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=REPLACE_WITH_STRONG_GENERATED_SECRET_128_CHARS
JWT_EXPIRE=7d

# ── App ──────────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=5005
FRONTEND_URL=http://localhost:5173
# Optional: overrides FRONTEND_URL for CORS (comma-separated)
# CORS_ORIGINS=http://localhost:5173,https://app.example.com

# ── Email (Gmail App Password) ───────────────────────────────────────────────
GMAIL_EMAIL=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# ── Cloudinary ───────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Dev only ─────────────────────────────────────────────────────────────────
# Set to an email address to bypass email verification in development.
# Must be empty in production.
DEV_EMAIL_BYPASS=
```

**Database Setup:**

Create the database:
```sql
CREATE DATABASE agriconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run migrations (creates all tables):
```bash
npm run migrate
```

Seed initial data:
```bash
# Production seed: admin user + crop catalogue + system settings
npm run seed

# Demo seed: demo instructor + demo farmer (development / client demos only)
# Skip this for real client deployments
npm run seed:demo

# OR just the admin account
npm run seed:admin
```

Start the development server:
```bash
npm run dev
# API available at http://localhost:5005
```

---

### 3. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
```

**Environment Variables:**

```bash
cp .env.example .env   # Linux/Mac
copy .env.example .env  # Windows
```

`.env` reference:

```env
VITE_API_URL=http://localhost:5005/api
VITE_SOCKET_URL=http://localhost:5005
# Optional: OpenWeatherMap API key for the weather widget
VITE_OPENWEATHER_API_KEY=your_openweathermap_api_key
```

Start the development server:
```bash
npm run dev
# App runs at http://localhost:5173
```

> The Vite dev server proxies `/api` and `/socket.io` requests to `http://localhost:5005` automatically — no CORS issues during development.

---

### 4. Demo Credentials (after `npm run seed:demo`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@agriconnect.lk | admin123 |
| Instructor | instructor@example.com | instructor123 |
| Farmer | farmer@example.com | farmer123 |

---

## 📂 Full Project Structure

```
Agri/
├── README.md
├── PROJECT_TECH_STACK.md
├── package.json               # Root scripts (check_translations)
│
├── backend/
│   ├── server.js              # Entry point — Express + Socket.IO
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── db.js              # Sequelize connection + testConnection()
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verify + role authorize
│   │   ├── errorHandler.js    # Global error + 404 handlers
│   │   ├── rateLimiter.js     # Auth & general rate limiters
│   │   └── uploadMiddleware.js# Multer memory storage + MIME filter
│   ├── migrations/
│   │   ├── 001-init.sql       # Complete schema (authoritative single-file)
│   │   ├── 002-*.sql … 028-*.sql  # Incremental migrations
│   │   └── run-migrations.js  # Migration runner (tracks applied migrations)
│   ├── models/                # 14 Sequelize models
│   │   ├── Activity.js        # farming activity logs
│   │   ├── Crop.js            # crop catalogue
│   │   ├── CropPlan.js        # farmer crop plans + attachments
│   │   ├── FarmerDetail.js    # farmer profile (extends User)
│   │   ├── GeneratedId.js     # pre-generated role IDs
│   │   ├── HarvestRecord.js   # harvest yield logs
│   │   ├── InstructorDetail.js# instructor profile (extends User)
│   │   ├── InstructorRating.js# farmer-to-instructor ratings
│   │   ├── Meeting.js         # scheduled meetings/visits
│   │   ├── Message.js         # chat messages
│   │   ├── PestReport.js      # pest/disease reports + attachments
│   │   ├── Region.js          # district/zone/division hierarchy
│   │   ├── SystemSetting.js   # key-value system settings
│   │   └── User.js            # core user account
│   ├── modules/
│   │   ├── admin/             # user mgmt, region CRUD, system settings
│   │   ├── auth/              # register, login, verify, profile
│   │   ├── crops/             # crop catalogue management
│   │   ├── farmer/            # farmer-specific operations
│   │   ├── instructor/        # instructor-specific operations
│   │   ├── messages/          # REST message history
│   │   └── ratings/           # instructor rating submit/read
│   ├── scripts/
│   │   └── ensure-database.js # creates DB if it doesn't exist
│   ├── seeders/
│   │   ├── admin.seeder.js
│   │   ├── crops.seeder.js
│   │   ├── demo-accounts.seeder.js
│   │   ├── demo-ids.seeder.js
│   │   └── run-seeders.js
│   ├── services/
│   │   ├── dataService.js     # aggregate stats queries
│   │   ├── emailService.js    # Nodemailer wrappers
│   │   ├── messageService.js  # Socket.IO message broadcasting
│   │   ├── ratingService.js   # rating compute helpers
│   │   └── userService.js     # shared user queries
│   └── utils/
│       ├── cloudinary.js      # upload/delete helpers
│       └── jwtUtils.js        # sign/verify + secret validation
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    └── src/
        ├── App.jsx            # Routes + role guards
        ├── main.jsx           # React entry + i18n init
        ├── i18n.js            # i18next configuration
        ├── assets/            # Images, icons, fonts
        ├── components/
        │   ├── auth/          # ProtectedRoute, RoleGuard
        │   └── common/        # Shared UI components
        ├── config/            # API base URL, env validation
        ├── features/
        │   ├── auth/          # Login, Register, Verify pages
        │   ├── farmer/        # Farmer pages, components, styles
        │   ├── instructor/    # Instructor pages, components, styles
        │   ├── admin/         # Admin pages, components, styles
        │   └── home/          # Public landing page
        ├── locales/
        │   ├── en/            # English translations (6 namespaces)
        │   └── si/            # Sinhala translations (6 namespaces)
        ├── services/          # Axios API clients per role
        │   ├── authService.js
        │   ├── farmerService.js
        │   ├── instructorService.js
        │   ├── adminService.js
        │   └── enhancedApiService.js
        └── utils/             # Shared helpers
```

---

## 🗄️ Database Schema

15 tables in MySQL database `agriconnect`:

| Table | Description |
|---|---|
| `users` | Core accounts (farmer / instructor / admin) |
| `farmer_details` | Extended farmer profile (zone, division, NIC, etc.) |
| `instructor_details` | Extended instructor profile (specialization, zone, rating) |
| `generated_ids` | Pre-generated display IDs per role |
| `regions` | district → zone → division hierarchy (admin-managed) |
| `crops` | Crop catalogue (admin-managed) |
| `crop_plans` | Farmer crop plans with file attachments |
| `harvest_records` | Yield records linked to crop plans |
| `pest_reports` | Pest/disease reports with photo evidence |
| `activities` | Daily farming activity logs |
| `meetings` | Scheduled visits / appointments |
| `messages` | Real-time chat history (farmer ↔ instructor) |
| `instructor_ratings` | Ratings given by farmers to instructors |
| `system_settings` | Key-value application settings |
| `migrations` | Applied migration tracking |

The complete schema is in [`backend/migrations/001-init.sql`](backend/migrations/001-init.sql).

---

## 🔌 API Overview

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Prefix | Module | Roles |
|---|---|---|
| `/api/auth` | Authentication | Public |
| `/api/farmer` | Farmer operations | Farmer |
| `/api/instructor` | Instructor operations | Instructor |
| `/api/admin` | Admin operations | Admin |
| `/api/crops` | Crop catalogue | All authenticated |
| `/api/messages` | Message history | Farmer, Instructor |
| `/api/ratings` | Instructor ratings | Farmer, Instructor |

### WebSocket Events (Socket.IO)
Authenticated via JWT passed as `auth.token`. All events are namespaced under the default `/` namespace.

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join user's personal room |
| `send_message` | Client → Server | Send a chat message |
| `receive_message` | Server → Client | Deliver incoming message |
| `message_read` | Client → Server | Mark messages as read |

---

## 🏭 Production Deployment

### Backend
```bash
# Set in production .env:
NODE_ENV=production
JWT_SECRET=<128-char hex string>
CORS_ORIGINS=https://your-domain.com
DEV_EMAIL_BYPASS=   # must be empty

npm start           # runs: node server.js
```

Use a process manager such as [PM2](https://pm2.keymetrics.io/):
```bash
pm2 start server.js --name agri-backend
pm2 save
pm2 startup
```

### Frontend
```bash
npm run build       # outputs to frontend/dist/
```
Serve `dist/` with Nginx, Caddy, or any static host. Point your web server's `/api` proxy to the backend.

### First-Run Checklist
- [ ] MySQL 8 database created (`agriconnect`)
- [ ] `backend/.env` fully populated (no placeholder values)
- [ ] `frontend/.env` pointing to production API/Socket URLs
- [ ] `frontend/.env` has `VITE_DEMO_MODE=false` (hides demo panel on login page)
- [ ] `npm run migrate` executed on the server
- [ ] `npm run seed:admin` executed (creates the first admin account)
- [ ] `NODE_ENV=production` set (also disables all backend demo bypasses automatically)
- [ ] `JWT_SECRET` is a strong random value (≥ 128 chars)
- [ ] `DEV_EMAIL_BYPASS` is empty

---

## 🤝 Contributing
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄  License
This project is licensed under the MIT License.
