-- =============================================================================
-- QuickResolve - Student Complaint Management System
-- MySQL 8 Database Schema & Seed Data (with MAIN_ADMIN, ADMIN, STUDENT & Google Auth)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS quickresolve_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quickresolve_db;

-- Drop existing tables in reverse dependency order for clean re-runs
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS users;

-- -----------------------------------------------------------------------------
-- Table: users
-- Supports MAIN_ADMIN (creates IDs & assigns roles), ADMIN, and STUDENT.
-- Supports both LOCAL (BCrypt password) and GOOGLE authentication.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    role ENUM('MAIN_ADMIN', 'ADMIN', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    auth_provider ENUM('LOCAL', 'GOOGLE') NOT NULL DEFAULT 'LOCAL',
    google_sub VARCHAR(100) NULL UNIQUE,
    student_id VARCHAR(50) NULL,
    department VARCHAR(100) NULL,
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: complaints
-- Stores student complaints, proof image filename, status, and admin remarks.
-- -----------------------------------------------------------------------------
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    proof_image VARCHAR(255) NULL,
    status ENUM('Pending', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Pending',
    admin_remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_complaints_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_complaints_user_id (user_id),
    INDEX idx_complaints_status (status),
    INDEX idx_complaints_category (category),
    INDEX idx_complaints_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Initial Accounts & Sample Data
-- =============================================================================
-- Main Admin Login (Creates IDs & assigns ADMIN / STUDENT roles):
--   Email:    mainadmin@quickresolve.edu
--   Password: Admin@123
--
-- Admin Login:
--   Email:    admin@quickresolve.edu
--   Password: Admin@123
--
-- Demo Student Login:
--   Email:    student@quickresolve.edu
--   Password: Student@123
--
-- (Passwords below are BCrypt $2a$12$ hashes verified with jBCrypt 0.4)
-- =============================================================================

INSERT INTO users (name, email, password, role, auth_provider, student_id, department, created_by) VALUES
(
    'Principal System Director',
    'mainadmin@quickresolve.edu',
    '$2a$12$SZ3yzr0gLxjXbQDg9jD/HOzVi41hvQ8AdNAtlwsGVUI1bCMS.E3Sy',
    'MAIN_ADMIN',
    'LOCAL',
    'MA-001',
    'Campus Directorate',
    NULL
),
(
    'Dr. Eleanor Vance',
    'admin@quickresolve.edu',
    '$2a$12$SZ3yzr0gLxjXbQDg9jD/HOzVi41hvQ8AdNAtlwsGVUI1bCMS.E3Sy',
    'ADMIN',
    'LOCAL',
    'ADM-101',
    'Campus Administration',
    1
),
(
    'Aarav Sharma',
    'student@quickresolve.edu',
    '$2a$12$l8kllBkjTDJJOZpF/.KhtOUoX4d3Fxoc9gU.ZOcUVwHtMaz5rwDNO',
    'STUDENT',
    'LOCAL',
    'CS2026-041',
    'Computer Science',
    1
),
(
    'Maya Patel',
    'maya.patel@quickresolve.edu',
    '$2a$12$l8kllBkjTDJJOZpF/.KhtOUoX4d3Fxoc9gU.ZOcUVwHtMaz5rwDNO',
    'STUDENT',
    'LOCAL',
    'EC2026-118',
    'Electronics & Communication',
    1
);

INSERT INTO complaints (
    user_id, title, category, description, proof_image, status, admin_remarks
) VALUES
(
    3,
    'Intermittent Wi-Fi outage in North Hostel Block B',
    'IT & Network',
    'The campus Wi-Fi access points on the 3rd and 4th floors of North Hostel Block B have been disconnecting every 10 minutes since Monday evening, making it difficult to attend online quizzes and submit coursework.',
    NULL,
    'In Progress',
    'Network engineering team inspected switch #B4 and ordered a replacement PoE injector. Temporary hotspot deployed.'
),
(
    3,
    'Broken overhead projector in Lecture Hall 204',
    'Infrastructure & Maintenance',
    'The HDMI input and lamp on the ceiling projector in Lecture Hall 204 flicker continuously during morning classes, causing slides to become unreadable.',
    NULL,
    'Pending',
    NULL
),
(
    4,
    'Extend Central Library operating hours during midterms',
    'Library & Labs',
    'Many students rely on quiet study desks and reference textbooks during midterm exam weeks. Extending library hours from 9 PM to midnight would greatly support exam preparation.',
    NULL,
    'Resolved',
    'Approved by Academic Council. Central Library will remain open until 11:30 PM during midterm and final exam weeks.'
);
