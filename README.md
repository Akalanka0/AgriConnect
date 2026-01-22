# AgriConnect

AgriConnect is a web application designed to connect farmers, agricultural instructors, and administrators. It aims to streamline communication, provide valuable resources to farmers, and facilitate better management of agricultural activities.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need to have the following software installed on your system:

- [Node.js](https://nodejs.org/) (v14 or later)
- [MySQL](https://www.mysql.com/)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/agriconnect.git
    cd agriconnect
    ```

2.  **Install all dependencies**:
    ```bash
    npm run install-all
    ```

3.  **Set up the backend**:
    - Navigate to the `backend` directory:
      ```bash
      cd backend
      ```
    - Create a `.env` file by copying the `.env.example` file:
      ```bash
      cp .env.example .env
      ```
    - Update the `.env` file with your MySQL database credentials and a JWT secret.
    - Configure Gmail SMTP settings for email OTP verification:
      - `GMAIL_EMAIL`
      - `GMAIL_APP_PASSWORD`

4.  **Set up the database**:
    - Make sure your MySQL server is running.
    - Create a new database (e.g., `agriconnect`).
    - Run the database migrations:
      ```bash
      npm run migrate
      ```
    - Seed the database with initial data:
      ```bash
      npm run seed
      ```

5.  **Start the development servers**:
    ```bash
    npm start
    ```
    This will start both the frontend and backend development servers. The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## Email Verification (OTP)

After registration, the backend sends a **6-digit OTP** to the user's email address (via Gmail SMTP). Users must verify their email before they can log in.

### API Endpoints

- `POST /api/auth/send-email-otp` - Send/resend email OTP
- `POST /api/auth/verify-email-otp` - Verify email OTP

## Technology Stack

- **Frontend**:
  - [React](https://reactjs.org/)
  - [Vite](https://vitejs.dev/)
- **Backend**:
  - [Node.js](https://nodejs.org/)
  - [Express](https://expressjs.com/)
  - [Sequelize](https://sequelize.org/)
- **Database**:
  - [MySQL](https://www.mysql.com/)

## Project Structure

The project is organized as a monorepo with two main directories:

- `frontend`: Contains the React single-page application.
- `backend`: Contains the Node.js/Express RESTful API.

## Database Schema

The database consists of three main tables: `users`, `farmer_details`, and `instructor_details`.

### `users`

| Column      | Type         | Description                                          |
| :---------- | :----------- | :--------------------------------------------------- |
| `id`        | `INT`        | **Primary Key** - Unique identifier for each user.   |
| `full_name` | `VARCHAR`    | The user's full name.                                |
| `email`     | `VARCHAR`    | The user's email address (must be unique).           |
| `nic`       | `VARCHAR`    | The user's National Identity Card number (unique).   |
| `phone`     | `VARCHAR`    | The user's phone number.                             |
| `password`  | `VARCHAR`    | A hashed version of the user's password.             |
| `role`      | `ENUM`       | `farmer`, `instructor`, or `admin`.                  |
| `email_verified`| `BOOLEAN` | Whether the email has been verified via OTP.         |
| `verification_token`| `VARCHAR` | Stores the current 6-digit email OTP (nullable).   |
| `verification_token_expires`| `TIMESTAMP` | Email OTP expiry time (nullable).        |
| `created_at`| `TIMESTAMP`  | The date and time the user account was created.      |
| `updated_at`| `TIMESTAMP`  | The date and time the user account was last updated. |

### `farmer_details`

| Column      | Type         | Description                                          |
| :---------- | :----------- | :--------------------------------------------------- |
| `id`        | `INT`        | **Primary Key** - Unique identifier for each record. |
| `user_id`   | `INT`        | **Foreign Key** - References `id` in the `users` table. |
| `farmer_id` | `VARCHAR`    | A unique identifier assigned to the farmer.          |
| `created_at`| `TIMESTAMP`  | The date and time the record was created.            |
| `updated_at`| `TIMESTAMP`  | The date and time the record was last updated.       |

### `instructor_details`

| Column         | Type         | Description                                          |
| :------------- | :----------- | :--------------------------------------------------- |
| `id`           | `INT`        | **Primary Key** - Unique identifier for each record. |
| `user_id`      | `INT`        | **Foreign Key** - References `id` in the `users` table. |
| `instructor_id`| `VARCHAR`    | A unique identifier for the instructor.              |
| `created_at`   | `TIMESTAMP`  | The date and time the record was created.            |
| `updated_at`   | `TIMESTAMP`  | The date and time the record was last updated.       |

## Available Scripts

### Root (`package.json`)

- `npm start`: Starts both the backend and frontend development servers.
- `npm run install-all`: Installs dependencies for the root, backend, and frontend.

### Backend (`backend/package.json`)

- `npm run dev`: Starts the backend server in development mode with `nodemon`.
- `npm run migrate`: Executes all SQL migration files.
- `npm run seed`: Populates the database with initial data.

### Frontend (`frontend/package.json`)

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Bundles the application for production.
- `npm run lint`: Lints the source code.
- `npm run preview`: Serves the production build locally.

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the MIT License.
