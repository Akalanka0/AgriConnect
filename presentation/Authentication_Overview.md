# AgriConnect: Technical Authentication & Registration Overview

## 1. Identity & Access Management (IAM)

### **Registration Pipeline**
The registration process in [authService.js](file:///d:/Test/SDP/Agri/backend/services/authService.js) is built as an **Atomic Transaction**. This means either the entire user profile (including role-specific details) is created successfully, or nothing is saved at all.

*   **Pre-provisioned ID Validation**: Users must possess a valid, Admin-generated ID (`farmer_id` or `instructor_id`). The system performs a real-time cross-table check against the `GeneratedId` pool.
*   **Security Layers**:
    *   **Bcrypt Hashing**: Passwords are encrypted using a one-way salt-hash algorithm (10 rounds).
    *   **2FA Verification**: A 6-digit **OTP (One-Time Password)** is generated using `crypto.randomInt` and sent via email to verify the user's identity.

### **Login & Session Management**
*   **JWT (JSON Web Tokens)**: Upon login, the server issues a signed JWT. This token contains the user's ID and role, allowing for **Stateless Authentication**.
*   **Role-Based Access Control (RBAC)**: The system automatically routes users to their specific dashboards based on their role:
    *   **Admin** → `/admin/dashboard`
    *   **Farmer** → `/farmer/home`
    *   **Instructor** → `/instructor/dashboard`

---

## 2. Presentation Mode (Dynamic Data Recycling)

To ensure a smooth demonstration, we have implemented **Presentation Logic** that handles "Magic IDs" and "Demo Data."

*   **Self-Cleaning IDs**: When a "Demo ID" like `FARM-2025-0001` or `F-TEST-001` is used for registration, the system programmatically detects and removes the previous user linked to that ID.
*   **Presentation NIC**: The NIC `123456789V` is designated as a "Demo NIC," allowing it to be reused across different demonstration accounts without causing database conflicts.

---

## 3. Demo Accounts for Presentation

Use these pre-configured accounts to showcase the platform's features:

| Role | Email Address | Password | Key Features to Show |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@agriconnect.lk` | `admin123` | ID Generation, User Management, Reports |
| **Farmer** | `farmer@example.com` | `farmer123` | Crop Plans, Weather, Activity Logging |
| **Instructor** | `instructor@example.com` | `instructor123` | Division Management, Pest Report Reviews |

---

## 4. Technical Stack Summary

*   **Backend**: Node.js / Express.js
*   **Database**: MySQL / PostgreSQL (Sequelize ORM)
*   **Authentication**: JWT (JSON Web Tokens)
*   **Encryption**: BcryptJS
*   **Concurrency**: ACID-compliant Transactions
*   **Architecture**: 3rd Normal Form (3NF) Database Schema
