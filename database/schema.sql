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
    viscosity_value DECIMAL(5,2) NULL COMMENT 'Escaneo 4: Valor de viscosidad (150-180)',
    viscosity_datetime DATETIME NULL COMMENT 'Escaneo 4: Fecha/hora registro viscosidad',
    opened_datetime DATETIME NULL COMMENT 'Escaneo 5: Apertura del contenedor',
    removed_datetime DATETIME NULL COMMENT 'Escaneo 6: Retiro final',
    
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
        'removed'
    ) NOT NULL,
    scan_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    
    FOREIGN KEY (solder_paste_id) REFERENCES solder_paste(id) ON DELETE CASCADE,
    INDEX idx_paste_scan (solder_paste_id, scan_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
