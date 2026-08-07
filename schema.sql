-- Database schema for TripMate
-- Database creation
CREATE DATABASE IF NOT EXISTS trip_mate_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE trip_mate_db;

-- Drop tables if they exist to allow clean re-runs (in reverse order of dependencies)
DROP TABLE IF EXISTS planned_expenses;
DROP TABLE IF EXISTS planned_expense_categories;
DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS expense_splits;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS fund_contributions;
DROP TABLE IF EXISTS trip_members;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS users;

-- 1. Table: users
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    is_guest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: trips
CREATE TABLE trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNING',
    join_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trips_status CHECK (status IN ('PLANNING', 'ONGOING', 'SETTLED', 'CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for trips
CREATE INDEX idx_trips_status ON trips(status);

-- 3. Table: trip_members
CREATE TABLE trip_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trip_members_role CHECK (role IN ('LEADER', 'MEMBER', 'GUEST')),
    CONSTRAINT uk_trip_members_trip_user UNIQUE (trip_id, user_id),
    CONSTRAINT fk_trip_members_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_trip_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for trip_members
CREATE INDEX idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user_id ON trip_members(user_id);

-- 4. Table: fund_contributions
CREATE TABLE fund_contributions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fund_contributions_amount CHECK (amount > 0),
    CONSTRAINT fk_fund_contributions_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_fund_contributions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for fund_contributions
CREATE INDEX idx_fund_contributions_trip_id ON fund_contributions(trip_id);
CREATE INDEX idx_fund_contributions_user_id ON fund_contributions(user_id);

-- 5. Table: expenses
CREATE TABLE expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    is_paid_by_fund BOOLEAN NOT NULL DEFAULT FALSE,
    payer_id BIGINT NULL,
    split_type VARCHAR(20) NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_expenses_amount CHECK (amount > 0),
    CONSTRAINT chk_expenses_split_type CHECK (split_type IN ('EQUAL', 'EXACT_AMOUNT')),
    CONSTRAINT fk_expenses_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_payer FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for expenses
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_payer_id ON expenses(payer_id);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);

-- 6. Table: expense_splits
CREATE TABLE expense_splits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    expense_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount_owed DECIMAL(12,2) NOT NULL,
    CONSTRAINT chk_expense_splits_amount_owed CHECK (amount_owed >= 0),
    CONSTRAINT uk_expense_splits_expense_user UNIQUE (expense_id, user_id),
    CONSTRAINT fk_expense_splits_expense FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_splits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for expense_splits
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);

-- 7. Table: settlements
CREATE TABLE settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    from_user_id BIGINT NOT NULL,
    to_user_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    is_settled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_settlements_amount CHECK (amount > 0),
    CONSTRAINT fk_settlements_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_settlements_from_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_settlements_to_user FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for settlements
CREATE INDEX idx_settlements_trip_id ON settlements(trip_id);
CREATE INDEX idx_settlements_from_user_id ON settlements(from_user_id);
CREATE INDEX idx_settlements_to_user_id ON settlements(to_user_id);

-- ============================================================
-- Phase 2: Trip Planning Module
-- ============================================================

-- 8. Table: planned_expense_categories
CREATE TABLE planned_expense_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NULL COMMENT 'Emoji hoặc icon code, VD: 🚗 hoặc car',
    color VARCHAR(20) NULL COMMENT 'Mã màu hex, VD: #6366F1',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'TRUE = danh mục hệ thống, không xóa được',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed 5 danh mục mặc định
INSERT INTO planned_expense_categories (name, icon, color, is_default) VALUES
('Đi lại',  '🚗', '#6366F1', TRUE),
('Lưu trú', '🏨', '#0EA5E9', TRUE),
('Ăn uống', '🍽️', '#F59E0B', TRUE),
('Vui chơi','🎮', '#10B981', TRUE),
('Khác',    '📌', '#94A3B8', TRUE);

-- 9. Table: planned_expenses
CREATE TABLE planned_expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category_id BIGINT NOT NULL,
    estimated_amount DECIMAL(12,2) NOT NULL,
    payment_source VARCHAR(10) NOT NULL DEFAULT 'PERSONAL' COMMENT 'FUND | PERSONAL',
    responsible_person_id BIGINT NULL COMMENT 'Người phụ trách đặt/mua',
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | BOOKED | CONFIRMED | CANCELLED',
    actual_expense_id BIGINT NULL COMMENT 'FK tới expenses sau khi Confirm',
    notes TEXT NULL,
    booking_link VARCHAR(500) NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_planned_expenses_amount CHECK (estimated_amount > 0),
    CONSTRAINT chk_planned_expenses_payment_source CHECK (payment_source IN ('FUND', 'PERSONAL')),
    CONSTRAINT chk_planned_expenses_status CHECK (status IN ('PENDING', 'BOOKED', 'CONFIRMED', 'CANCELLED')),
    CONSTRAINT fk_planned_expenses_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_planned_expenses_category FOREIGN KEY (category_id) REFERENCES planned_expense_categories(id),
    CONSTRAINT fk_planned_expenses_responsible FOREIGN KEY (responsible_person_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_planned_expenses_actual_expense FOREIGN KEY (actual_expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
    CONSTRAINT fk_planned_expenses_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for planned_expenses
CREATE INDEX idx_planned_expenses_trip_id ON planned_expenses(trip_id);
CREATE INDEX idx_planned_expenses_category_id ON planned_expenses(category_id);
CREATE INDEX idx_planned_expenses_status ON planned_expenses(status);
CREATE INDEX idx_planned_expenses_created_by ON planned_expenses(created_by);

-- 10. Table: trip_checklist_items
CREATE TABLE trip_checklist_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    assignee_id BIGINT NULL COMMENT 'Người được phân công',
    status VARCHAR(20) NOT NULL DEFAULT 'TODO' COMMENT 'TODO | IN_PROGRESS | DONE',
    due_date DATE NULL,
    sort_order INT DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_checklist_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    CONSTRAINT fk_checklist_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_checklist_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_checklist_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for trip_checklist_items
CREATE INDEX idx_checklist_trip_id ON trip_checklist_items(trip_id);
CREATE INDEX idx_checklist_status ON trip_checklist_items(status);
CREATE INDEX idx_checklist_assignee ON trip_checklist_items(assignee_id);

-- ============================================================

-- Initial Sample Seed Users
INSERT INTO users (id, email, full_name, password_hash) VALUES
(1, 'anv@example.com', 'Nguyễn Văn A', 'hash123'),
(2, 'btt@example.com', 'Trần Thị B', 'hash123'),
(3, 'lvc@example.com', 'Lê Văn C', 'hash123')
ON DUPLICATE KEY UPDATE email=VALUES(email);

