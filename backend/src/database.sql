-- =====================================================
-- SMT Solder Paste Traceability System - Database Schema
-- =====================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS solder_paste_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE solder_paste_db;

-- =====================================================
-- Tabla principal: solder_paste
-- Almacena toda la información de trazabilidad de las pastas
-- =====================================================
CREATE TABLE IF NOT EXISTS solder_paste (
    -- Identificador único
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- DID (Document Identification) - Requerido al registrar
    did VARCHAR(100) NOT NULL COMMENT 'Document Identification - Requerido al registrar',
    
    -- Información del QR (datos parseados)
    lot_number VARCHAR(50) NOT NULL COMMENT 'Número de lote (posición 1 del QR)',
    part_number VARCHAR(100) NOT NULL COMMENT 'Número de parte (posición 2 del QR)',
    lot_serial VARCHAR(20) NOT NULL COMMENT 'Serial del lote (posición 5 del QR)',
    
    -- Ubicación SMT detectada automáticamente por número de parte
    smt_location VARCHAR(20) NULL COMMENT 'Ubicación SMT detectada (SMT, SMT2, SMT3, SMT4)',
    
    -- Fechas del producto
    manufacture_date DATE NOT NULL COMMENT 'Fecha de fabricación (posición 4 del QR)',
    expiration_date DATE NOT NULL COMMENT 'Fecha de expiración (posición 3 del QR)',
    
    -- Timestamps del flujo de trazabilidad
    fridge_in_datetime DATETIME NULL COMMENT 'Escaneo 1: Entrada al refrigerador',
    fridge_out_datetime DATETIME NULL COMMENT 'Escaneo 2: Salida del refrigerador',
    mixing_start_datetime DATETIME NULL COMMENT 'Escaneo 3: Inicio de mezclado',
    viscosity_value DECIMAL(5,2) NULL COMMENT 'Escaneo 4: Valor de viscosidad (170-230)',
    viscosity_datetime DATETIME NULL COMMENT 'Escaneo 4: Fecha/hora registro viscosidad',
    opened_datetime DATETIME NULL COMMENT 'Escaneo 5: Apertura del contenedor',
    removed_datetime DATETIME NULL COMMENT 'Escaneo 6: Retiro final',
    
    -- Registro de usuarios que realizan cada acción
    fridge_in_user VARCHAR(100) NULL COMMENT 'Usuario que registró entrada al refrigerador',
    fridge_out_user VARCHAR(100) NULL COMMENT 'Usuario que registró salida del refrigerador',
    mixing_start_user VARCHAR(100) NULL COMMENT 'Usuario que inició el mezclado',
    viscosity_user VARCHAR(100) NULL COMMENT 'Usuario que registró la viscosidad',
    opened_user VARCHAR(100) NULL COMMENT 'Usuario que abrió el contenedor',
    removed_user VARCHAR(100) NULL COMMENT 'Usuario que retiró la pasta',
    
    -- Estado actual de la pasta
    status ENUM(
        'in_fridge',      -- En refrigerador
        'out_fridge',     -- Fuera del refrigerador
        'mixing',         -- En proceso de mezclado
        'viscosity_ok',   -- Viscosidad registrada/aprobada
        'opened',         -- Contenedor abierto
        'removed',        -- Retirado/finalizado
        'rejected'        -- Rechazado (viscosidad fuera de rango)
    ) NOT NULL DEFAULT 'in_fridge',
    
    -- Campos de auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para búsquedas frecuentes
    INDEX idx_lot_number (lot_number),
    INDEX idx_part_number (part_number),
    INDEX idx_status (status),
    INDEX idx_expiration (expiration_date),
    INDEX idx_did (did),
    INDEX idx_smt_location (smt_location),
    
    -- Restricción única: combinación de lote + serial debe ser única
    UNIQUE KEY unique_lot_serial (lot_number, lot_serial)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Script de migración para bases de datos existentes
-- Ejecutar si ya tienes datos en la tabla
-- =====================================================
-- ALTER TABLE solder_paste ADD COLUMN did VARCHAR(100) NOT NULL DEFAULT '' AFTER id;
-- ALTER TABLE solder_paste ADD COLUMN smt_location VARCHAR(20) NULL AFTER lot_serial;
-- ALTER TABLE solder_paste ADD INDEX idx_did (did);
-- ALTER TABLE solder_paste ADD INDEX idx_smt_location (smt_location);

-- Migración para agregar campos de usuario (ejecutar si la tabla ya existe)
-- ALTER TABLE solder_paste ADD COLUMN fridge_in_user VARCHAR(100) NULL AFTER removed_datetime;
-- ALTER TABLE solder_paste ADD COLUMN fridge_out_user VARCHAR(100) NULL AFTER fridge_in_user;
-- ALTER TABLE solder_paste ADD COLUMN mixing_start_user VARCHAR(100) NULL AFTER fridge_out_user;
-- ALTER TABLE solder_paste ADD COLUMN viscosity_user VARCHAR(100) NULL AFTER mixing_start_user;
-- ALTER TABLE solder_paste ADD COLUMN opened_user VARCHAR(100) NULL AFTER viscosity_user;
-- ALTER TABLE solder_paste ADD COLUMN removed_user VARCHAR(100) NULL AFTER opened_user;

-- =====================================================
-- Tabla de log de escaneos (auditoría detallada)
-- =====================================================
CREATE TABLE IF NOT EXISTS scan_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solder_paste_id INT NOT NULL,
    scan_type ENUM(
        'fridge_in',
        'fridge_out', 
        'mixing_start',
        'viscosity_check',
        'opened',
        'removed',
        'did_update'
    ) NOT NULL,
    scan_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(100) NULL COMMENT 'Usuario que realizó el escaneo',
    notes TEXT NULL,
    
    FOREIGN KEY (solder_paste_id) REFERENCES solder_paste(id) ON DELETE CASCADE,
    INDEX idx_paste_scan (solder_paste_id, scan_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migración para agregar user_name a scan_log (ejecutar si la tabla ya existe)
-- ALTER TABLE scan_log ADD COLUMN user_name VARCHAR(100) NULL AFTER scan_datetime;

-- Migración para agregar 'did_update' al ENUM de scan_type (ejecutar si la tabla ya existe)
-- ALTER TABLE scan_log MODIFY COLUMN scan_type ENUM('fridge_in','fridge_out','mixing_start','viscosity_check','opened','removed','did_update') NOT NULL;

-- =====================================================
-- Tabla de números de parte válidos
-- =====================================================
CREATE TABLE IF NOT EXISTS part_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    part_number VARCHAR(100) NOT NULL UNIQUE COMMENT 'Número de parte único',
    description VARCHAR(255) NULL COMMENT 'Descripción opcional del número de parte',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si el número de parte está activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_part_number (part_number),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla de líneas de producción
-- =====================================================
CREATE TABLE IF NOT EXISTS production_lines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    line_number INT NOT NULL UNIQUE COMMENT 'Número de línea (1, 2, 3, 4...)',
    line_name VARCHAR(50) NOT NULL COMMENT 'Nombre descriptivo de la línea',
    smt_location VARCHAR(20) NULL COMMENT 'Ubicación SMT asociada',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si la línea está activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_line_number (line_number),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla de asignación de números de parte a líneas
-- Relación muchos a muchos
-- =====================================================
CREATE TABLE IF NOT EXISTS part_line_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    part_number_id INT NOT NULL,
    production_line_id INT NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si la asignación es válida',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (part_number_id) REFERENCES part_numbers(id) ON DELETE CASCADE,
    FOREIGN KEY (production_line_id) REFERENCES production_lines(id) ON DELETE CASCADE,
    UNIQUE KEY unique_part_line (part_number_id, production_line_id),
    INDEX idx_part_line (part_number_id, production_line_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Datos iniciales: Líneas de producción
-- =====================================================
INSERT INTO production_lines (line_number, line_name, smt_location, is_active) VALUES
(1, 'Línea 1', 'SMT', TRUE),
(2, 'Línea 2', 'SMT2', TRUE),
(3, 'Línea 3', 'SMT3', TRUE),
(4, 'Línea 4', 'SMT4', TRUE)
ON DUPLICATE KEY UPDATE line_name = VALUES(line_name);

-- =====================================================
-- Datos iniciales: Números de parte (de las imágenes proporcionadas)
-- =====================================================
INSERT INTO part_numbers (part_number, description, is_active) VALUES
('K01.005-00M-2', 'Pasta de soldadura estándar', TRUE),
('611.001-17M', 'Pasta de soldadura tipo 611', TRUE),
('K01.027-00M', 'Pasta de soldadura K01.027', TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- =====================================================
-- Datos iniciales: Asignaciones de partes a líneas (de las imágenes)
-- Línea 1: K01.005-00M-2, 611.001-17M
-- Línea 2: K01.005-00M-2
-- Línea 3: K01.005-00M-2
-- Línea 4: K01.005-00M-2, K01.027-00M
-- =====================================================
INSERT INTO part_line_assignments (part_number_id, production_line_id, is_valid)
SELECT pn.id, pl.id, TRUE
FROM part_numbers pn, production_lines pl
WHERE 
    (pn.part_number = 'K01.005-00M-2' AND pl.line_number IN (1, 2, 3, 4)) OR
    (pn.part_number = '611.001-17M' AND pl.line_number = 1) OR
    (pn.part_number = 'K01.027-00M' AND pl.line_number = 4)
ON DUPLICATE KEY UPDATE is_valid = TRUE;
