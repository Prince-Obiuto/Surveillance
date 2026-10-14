
CREATE TABLE IF NOT EXISTS administrators (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'Admin',
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    security_question VARCHAR(255),
    security_answer VARCHAR(255),
    login_allowed TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_activity (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    ip_address VARCHAR(255),
    device TEXT,
    browser TEXT,
    status VARCHAR(50) NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_time (login_time),
    INDEX idx_login_username (username)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    message TEXT,
    camera_name VARCHAR(100),
    image_name VARCHAR(255),
    video_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_created (created_at),
    INDEX idx_notifications_camera (camera_name)
);

CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id BIGINT UNSIGNED NOT NULL,
    admin_id INT UNSIGNED NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, admin_id),
    FOREIGN KEY (notification_id)
        REFERENCES notifications(id)
        ON DELETE CASCADE,
    FOREIGN KEY (admin_id)
        REFERENCES administrators(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS general_detection_schedule (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    start_time TIME NOT NULL DEFAULT '00:00:00',
    end_time TIME NOT NULL DEFAULT '23:59:59',
    enabled TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detection_schedule (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    camera_id INT UNSIGNED NOT NULL UNIQUE,
    detection_enabled TINYINT(1) NOT NULL DEFAULT 0,
    start_time TIME NOT NULL DEFAULT '00:00:00',
    end_time TIME NOT NULL DEFAULT '23:59:59',
    manual_override TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_push_admin (admin_id),
    FOREIGN KEY (admin_id)
        REFERENCES administrators(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS human_detection (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    camera_name VARCHAR(100) NOT NULL,
    image_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO general_detection_schedule
    (id, start_time, end_time, enabled)
VALUES (1, '00:00:00', '23:59:59', 0)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO detection_schedule
    (camera_id, detection_enabled, manual_override)
VALUES
    (1, 0, 0),
    (2, 0, 0),
    (3, 0, 0),
    (4, 0, 0),
    (5, 0, 0),
    (6, 0, 0),
    (7, 0, 0),
    (8, 0, 0),
    (9, 0, 0),
    (10, 0, 0)
ON DUPLICATE KEY UPDATE camera_id = camera_id;
