-- =========================================================
-- Students Registration System Database Schema
-- Compatible with MySQL and SQLite
-- =========================================================

-- Table: admins
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: students
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    interests TEXT NOT NULL,
    class VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks DECIMAL(6, 2) NOT NULL,
    aadhaar_filename VARCHAR(255) NOT NULL,
    aadhaar_original_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data: Default Administrator Account
-- Login: admin@example.com / admin123 (or admin@portal.com / admin123)
INSERT OR IGNORE INTO admins (id, name, email, password, role)
VALUES (1, 'Super Admin', 'admin@example.com', 'admin123', 'admin');

-- Seed Data: Sample Student matching the specification mockup
-- Login: john.doe@example.com / password123
INSERT OR IGNORE INTO students (
    id,
    student_id,
    name,
    email,
    password,
    dob,
    gender,
    qualification,
    interests,
    class,
    subject,
    marks,
    aadhaar_filename,
    aadhaar_original_name
) VALUES (
    1,
    'STU001',
    'John Doe',
    'john.doe@example.com',
    'password123',
    '1994-03-20',
    'Male',
    'High School, Bachelors, Master''s',
    'Coding,Design',
    '10th Grade',
    'Computer Science',
    1200.00,
    'sample_aadhaar.pdf',
    'john_doe_aadhaar.pdf'
);
