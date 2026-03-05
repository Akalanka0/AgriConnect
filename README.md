# AgriConnect 🌾

AgriConnect is a comprehensive agricultural management platform designed to bridge the gap between farmers, instructors, and administrators. It facilitates crop planning, pest management, harvest tracking, and real-time communication to enhance agricultural productivity and sustainability.

## 🚀 Features

### 👨‍🌾 Farmer Portal
- **Crop Planning:** Create and manage seasonal crop plans.
- **Harvest Tracking:** Record harvest data and yields.
- **Pest Management:** Report pest issues and receive expert advice.
- **Activity Log:** Track daily farming activities.
- **Weather Updates:** Access real-time weather information.
- **Communication:** Chat with instructors for guidance.

### 👨‍🏫 Instructor Portal
- **Farmer Management:** Oversee assigned farmers and their progress.
- **Plan Review:** Review and approve crop plans submitted by farmers.
- **Consultation:** Provide expert advice on pest reports and activities.
- **Scheduling:** Manage appointments and field visits.
- **Reports:** Generate and view aggregate performance reports.

### 👮 Admin Portal
- **User Management:** Manage all system users (Farmers, Instructors, Admins).
- **System Monitoring:** View system-wide statistics and engagement metrics.
- **Reports:** Generate high-level administrative reports.
- **Settings:** Configure system-wide parameters.

---

## 🏗️ Architecture

AgriConnect is built using modern software architecture patterns to ensure scalability and maintainability.

### Backend: Modular Monolith
Located in `backend/`, the server is structured as a **Modular Monolith**. Instead of organizing by technical layer (controllers, routes), it is organized by **Business Domain** (Modules).

*   **Modules:** `auth`, `farmer`, `instructor`, `crops`, `harvests`, `pests`, `admin`.
*   **Shared Services:** `emailService`, `userService`, `dataService` handle cross-cutting concerns.
*   **Database:** MySQL with Sequelize ORM for robust data management.

### Frontend: Feature-Based Architecture
Located in `frontend/`, the React application uses a **Feature-Based** structure.

*   **Features:** `features/auth`, `features/farmer`, `features/instructor`, `features/admin`.
*   **Co-location:** Each feature contains its own components, pages, styles, and utils, making the codebase easy to navigate and maintain.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** [React 18](https://react.dev/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Bootstrap 5](https://getbootstrap.com/) & [React-Bootstrap](https://react-bootstrap.github.io/)
*   **Routing:** [React Router v6](https://reactrouter.com/)
*   **Real-time:** [Socket.IO Client](https://socket.io/)
*   **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF)

### Backend
*   **Runtime:** [Node.js](https://nodejs.org/)
*   **Framework:** [Express.js](https://expressjs.com/)
*   **Database:** [MySQL](https://www.mysql.com/)
*   **ORM:** [Sequelize](https://sequelize.org/)
*   **Authentication:** JWT (JSON Web Tokens)
*   **Email:** Nodemailer
*   **File Storage:** Cloudinary
*   **Real-time:** Socket.IO

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v16 or higher)
*   MySQL Server
*   Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/agriconnect.git
cd agriconnect
```

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` root by copying `.env.example`:
```bash
cp .env.example .env
```
Update the `.env` file with your credentials:
*   **DB_**: Your MySQL database credentials.
*   **JWT_SECRET**: A long, random string for security.
*   **CLOUDINARY_**: Your Cloudinary API credentials (for file uploads).
*   **GMAIL_**: Your email credentials (for sending emails).
*   **FRONTEND_URL**: Frontend origin allowed by CORS (use comma-separated values for multiple origins).
*   **CORS_ORIGINS** *(optional)*: Comma-separated CORS/Socket origin allow-list; when set, it overrides `FRONTEND_URL`.

**Database Setup:**
Create a MySQL database named `agriconnect` (or whatever you set in `.env`).

Run Migrations (Create Tables):
```bash
npm run migrate
```

Run Seeders (Populate Initial Data):
```bash
# Seeds demo data for all roles
npm run seed

# OR just seed the admin account
npm run seed:admin
```

Start the Server:
```bash
npm run dev
# Server runs on http://localhost:5005 by default
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Development Server:
```bash
npm run dev
# App runs on http://localhost:5173 by default
```

---

## 📂 Project Structure

```
Agri/
├── backend/
│   ├── config/         # Database configuration
│   ├── middleware/     # Auth, Error handling, Uploads
│   ├── migrations/     # Database schema changes
│   ├── models/         # Sequelize models
│   ├── modules/        # Domain-specific modules (Auth, Farmer, etc.)
│   ├── seeders/        # Initial data population
│   ├── services/       # Shared business logic
│   └── server.js       # Entry point
│
└── frontend/
    ├── src/
    │   ├── assets/     # Static assets
    │   ├── features/   # Feature-based modules
    │   │   ├── admin/
    │   │   ├── auth/
    │   │   ├── farmer/
    │   │   ├── home/
    │   │   └── instructor/
    │   ├── services/   # API clients
    │   └── utils/      # Shared helpers
    └── package.json
```

## 🤝 Contributing
1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License
This project is licensed under the ISC License.
