-- AggriConnectX Database Schema (3NF Normalized)
-- Version 2.0: Comprehensive Frontend Audit Sync
-- Designed for presentation purposes. STANDALONE script.

-- Create Database
CREATE DATABASE IF NOT EXISTS aggriconnectX;
USE aggriconnectX;

-- ==========================================
-- 1. CORE SYSTEM TABLES
-- ==========================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE districts (
    district_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE business_areas (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    district_id INT,
    FOREIGN KEY (district_id) REFERENCES districts(district_id),
    UNIQUE(name, district_id)
);

CREATE TABLE divisions (
    division_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    area_id INT,
    FOREIGN KEY (area_id) REFERENCES business_areas(area_id),
    UNIQUE(name, area_id)
);

-- ==========================================
-- 2. USER MANAGEMENT
-- ==========================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nic VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    status ENUM('active', 'inactive', 'pending', 'blocked') DEFAULT 'pending',
    role_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE instructor_details (
    user_id INT PRIMARY KEY,
    instructor_id_code VARCHAR(50) NOT NULL UNIQUE,
    rating DECIMAL(2,1) DEFAULT 0.0,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Many-to-Many: Instructor can be assigned to multiple divisions
CREATE TABLE instructor_divisions (
    user_id INT,
    division_id INT,
    PRIMARY KEY (user_id, division_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (division_id) REFERENCES divisions(division_id)
);

CREATE TABLE farmer_details (
    user_id INT PRIMARY KEY,
    farmer_id_code VARCHAR(50) NOT NULL UNIQUE,
    division_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (division_id) REFERENCES divisions(division_id)
);

-- ==========================================
-- 3. AGRICULTURE DOMAIN TABLES
-- ==========================================

CREATE TABLE crops (
    crop_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE crop_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_user_id INT,
    crop_id INT,
    field_name VARCHAR(100),
    plant_date DATE,
    expected_harvest_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_user_id) REFERENCES users(user_id),
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id)
);

CREATE TABLE activity_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_user_id INT,
    type_id INT,
    crop_id INT,
    division_id INT,
    activity_date DATE,
    notes TEXT,
    FOREIGN KEY (farmer_user_id) REFERENCES users(user_id),
    FOREIGN KEY (type_id) REFERENCES activity_types(type_id),
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id),
    FOREIGN KEY (division_id) REFERENCES divisions(division_id)
);

CREATE TABLE qualities (
    quality_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE harvest_records (
    harvest_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_user_id INT,
    crop_id INT,
    field_name VARCHAR(100),
    division_id INT,
    harvest_date DATE,
    quantity_kg DECIMAL(10, 2),
    quality_id INT,
    notes TEXT,
    FOREIGN KEY (farmer_user_id) REFERENCES users(user_id),
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id),
    FOREIGN KEY (division_id) REFERENCES divisions(division_id),
    FOREIGN KEY (quality_id) REFERENCES qualities(quality_id)
);

CREATE TABLE severities (
    severity_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE pest_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_user_id INT,
    issue_type ENUM('pest', 'disease', 'other'),
    issue_name VARCHAR(100),
    crop_id INT,
    severity_id INT,
    division_id INT,
    instructor_user_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_user_id) REFERENCES users(user_id),
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id),
    FOREIGN KEY (severity_id) REFERENCES severities(severity_id),
    FOREIGN KEY (division_id) REFERENCES divisions(division_id),
    FOREIGN KEY (instructor_user_id) REFERENCES users(user_id)
);

-- ==========================================
-- 4. ENGAGEMENT & CALENDAR TABLES
-- ==========================================

CREATE TABLE meetings (
    meeting_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    requestor_id INT,
    participant_id INT,
    meeting_date DATE,
    meeting_time TIME,
    notes TEXT,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requestor_id) REFERENCES users(user_id),
    FOREIGN KEY (participant_id) REFERENCES users(user_id)
);

CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT,
    recipient_id INT,
    content TEXT,
    attachment_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (recipient_id) REFERENCES users(user_id)
);

-- ==========================================
-- 5. WEATHER & NOTIFICATIONS (FOR PRESENTATION)
-- ==========================================

CREATE TABLE weather_forecasts (
    forecast_id INT AUTO_INCREMENT PRIMARY KEY,
    division_id INT,
    forecast_date DATE,
    temp_c DECIMAL(4,1),
    description VARCHAR(100),
    humidity_percent INT,
    wind_speed_kmh INT,
    FOREIGN KEY (division_id) REFERENCES divisions(division_id)
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    message TEXT,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ==========================================
-- 6. ADMIN & ID MANAGEMENT
-- ==========================================

CREATE TABLE id_pool (
    id_entry_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('farmer', 'instructor'),
    year INT,
    status ENUM('active', 'used', 'expired') DEFAULT 'active'
);

CREATE TABLE system_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255),
    entity_type VARCHAR(50),
    entity_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ==========================================
-- MOCK DATA (DML) - TAILORED FOR PRESENTATION
-- ==========================================

-- Roles
INSERT INTO roles (role_name) VALUES ('admin'), ('farmer'), ('instructor');

-- Districts
INSERT INTO districts (name) VALUES ('Anuradhapura'), ('Polonnaruwa');

-- Business Areas
INSERT INTO business_areas (name, district_id) VALUES 
('Rajanganaya', 1), 
('Vilachchiya', 1), 
('Padaviya', 1),
('Medirigiriya', 2);

-- Divisions
INSERT INTO divisions (name, area_id) VALUES 
('Yaya 1', 1), ('Yaya 2', 1), ('Yaya 4', 1),
('Track 4', 2), ('Track 5', 2),
('Boganewa', 3), ('Kumbukwewa', 3),
('Division 01', 4);

-- Users
INSERT INTO users (full_name, email, password_hash, nic, phone, status, role_id) VALUES 
('System Admin', 'admin@agriconnect.com', 'hashed_pass', '123456789V', '0711111111', 'active', 1),
('Rohan Silva', 'rohan@agriconnect.com', 'hashed_pass', '654321987V', '0772222222', 'active', 3),
('Priya Bandara', 'priya@agriconnect.com', 'hashed_pass', '987654321V', '0773333333', 'active', 3),
('Sunil Perera', 'sunil@agriconnect.com', 'hashed_pass', '112233445V', '0774444444', 'active', 2),
('Kamala Fernando', 'kamala@agriconnect.com', 'hashed_pass', '556677889V', '0775555555', 'active', 2),
('Saman Kumara', 'saman@agriconnect.com', 'hashed_pass', '998877665V', '0776666666', 'blocked', 2);

-- Instructor Details
INSERT INTO instructor_details (user_id, instructor_id_code, rating) VALUES 
(2, 'INST-2026-0001', 4.8),
(3, 'INST-2026-0002', 4.5);

-- Instructor Divisions (Rohan covers Boganewa and Kumbukwewa)
INSERT INTO instructor_divisions (user_id, division_id) VALUES 
(2, 6), (2, 7),
(3, 1), (3, 2);

-- Farmer Details
INSERT INTO farmer_details (user_id, farmer_id_code, division_id) VALUES 
(4, 'FARM-2025-0001', 6),
(5, 'FARM-2025-0002', 6),
(6, 'FARM-2025-0004', 7);

-- Crops
INSERT INTO crops (name) VALUES ('Rice Paddy'), ('Corn'), ('Tomatoes'), ('Carrots'), ('Beans');

-- Activity Types
INSERT INTO activity_types (name) VALUES ('Planting'), ('Irrigation'), ('Fertilizing'), ('Pest Control'), ('Harvesting');

-- Qualities
INSERT INTO qualities (name) VALUES ('Excellent'), ('Good'), ('Average'), ('Poor');

-- Severities
INSERT INTO severities (name) VALUES ('Low'), ('Medium'), ('High'), ('Critical');

-- Crop Plans
INSERT INTO crop_plans (farmer_user_id, crop_id, field_name, plant_date, expected_harvest_date, notes) VALUES 
(4, 1, 'Field A', '2025-01-10', '2025-04-10', 'Maha season rice paddy'),
(5, 5, 'Garden Plot', '2025-02-01', '2025-03-15', 'Organic beans for local market');

-- Activities
INSERT INTO activities (farmer_user_id, type_id, crop_id, division_id, activity_date, notes) VALUES 
(4, 1, 1, 6, '2025-01-10', 'Started planting Maha season rice'),
(4, 3, 1, 6, '2025-01-25', 'Applied urea fertilizer'),
(5, 2, 5, 6, '2025-02-05', 'Drip irrigation system check');

-- Harvest Records (Historical Data for Reports)
INSERT INTO harvest_records (farmer_user_id, crop_id, field_name, division_id, harvest_date, quantity_kg, quality_id, notes) VALUES 
(4, 1, 'Field A', 6, '2024-10-05', 500.00, 1, 'Previous season yield. High quality.'),
(5, 3, 'Field B', 6, '2024-09-28', 120.00, 2, 'Tomato harvest, minor cracking noted.'),
(4, 2, 'Field C', 6, '2024-08-15', 300.00, 3, 'Corn harvest, affected by drought.');

-- Pest Reports
INSERT INTO pest_reports (farmer_user_id, issue_type, issue_name, crop_id, severity_id, division_id, instructor_user_id, notes) VALUES 
(4, 'pest', 'Brown Planthopper', 1, 3, 6, 2, 'Center of the field showing yellowing patches.'),
(5, 'disease', 'Leaf Spot', 5, 2, 6, 2, 'Observed on lower leaves of bean plants.');

-- Meetings
INSERT INTO meetings (title, requestor_id, participant_id, meeting_date, meeting_time, notes, status) VALUES 
('Field Inspection', 4, 2, '2025-02-15', '09:00:00', 'Discuss pest management for Field A', 'confirmed'),
('New Seed Consultation', 5, 2, '2025-02-18', '14:30:00', 'Inquiry about hybrid bean seeds', 'pending');

-- Messages
INSERT INTO messages (sender_id, recipient_id, content, is_read) VALUES 
(4, 2, 'Sir, I have submitted a pest report. Please check.', TRUE),
(2, 4, 'I have seen it. Meeting confirmed for the 15th.', FALSE);

-- Weather Forecasts
INSERT INTO weather_forecasts (division_id, forecast_date, temp_c, description, humidity_percent, wind_speed_kmh) VALUES 
(6, '2025-02-10', 28.5, 'Sunny', 60, 12),
(6, '2025-02-11', 26.0, 'Cloudy', 65, 10),
(6, '2025-02-12', 24.5, 'Rain', 85, 15);

-- Notifications
INSERT INTO notifications (user_id, title, message, type) VALUES 
(4, 'Meeting Confirmed', 'Your meeting with Rohan Silva is confirmed for Feb 15.', 'success'),
(2, 'New Pest Report', 'Sunil Perera reported Brown Planthopper in Boganewa.', 'warning');

-- ID Pool
INSERT INTO id_pool (code, type, year, status) VALUES 
('FARM-2025-0005', 'farmer', 2025, 'active'),
('FARM-2025-0006', 'farmer', 2025, 'active'),
('INST-2026-0003', 'instructor', 2026, 'active');

-- Logs
INSERT INTO system_logs (user_id, action, entity_type, entity_id) VALUES 
(1, 'Generated Farmer IDs', 'id_pool', NULL),
(2, 'Confirmed Meeting', 'meetings', 1);
