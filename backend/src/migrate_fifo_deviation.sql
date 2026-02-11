-- =====================================================
-- Migration: FIFO/FEFO, Auto-discard, Expiration & Deviation
-- =====================================================
-- Run this migration on the solder_paste_db database

USE solder_paste_db;

-- 1. Modify status ENUM (removed 'discarded' as per requirement)
ALTER TABLE solder_paste MODIFY COLUMN status ENUM(
    'in_fridge',
    'out_fridge',
    'mixing',
    'viscosity_ok',
    'opened',
    'removed',
    'rejected'
) NOT NULL DEFAULT 'in_fridge';

-- 2. Add deviation fields to solder_paste
ALTER TABLE solder_paste ADD COLUMN IF NOT EXISTS deviation_authorized BOOLEAN DEFAULT FALSE COMMENT 'Si se autorizó desviación para pasta vencida';
ALTER TABLE solder_paste ADD COLUMN IF NOT EXISTS deviation_authorized_by VARCHAR(100) NULL COMMENT 'Persona(s) que autorizó(aron) la desviación (Calidad + Ingeniero)';
ALTER TABLE solder_paste ADD COLUMN IF NOT EXISTS deviation_authorized_at DATETIME NULL COMMENT 'Fecha/hora de autorización de desviación';
ALTER TABLE solder_paste ADD COLUMN IF NOT EXISTS deviation_reason TEXT NULL COMMENT 'Razón de la desviación';

-- 3. Modify scan_log scan_type ENUM (removed 'discarded')
ALTER TABLE scan_log MODIFY COLUMN scan_type ENUM(
    'fridge_in',
    'fridge_out',
    'mixing_start',
    'viscosity_check',
    'opened',
    'removed',
    'did_update',
    'deviation_authorized'
) NOT NULL;

-- 4. Add index for deviation queries
ALTER TABLE solder_paste ADD INDEX IF NOT EXISTS idx_deviation (deviation_authorized);
