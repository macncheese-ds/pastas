-- =====================================================
-- Migración: Agregar campos de usuario a la base de datos
-- Sistema de Trazabilidad de Pastas de Soldadura
-- =====================================================
-- Ejecutar este script si ya tienes la base de datos creada
-- y necesitas agregar los campos de registro de usuarios

USE solder_paste_db;

-- Agregar campos de usuario a la tabla solder_paste
ALTER TABLE solder_paste 
  ADD COLUMN fridge_in_user VARCHAR(100) NULL COMMENT 'Usuario que registró entrada al refrigerador' AFTER removed_datetime;

ALTER TABLE solder_paste 
  ADD COLUMN fridge_out_user VARCHAR(100) NULL COMMENT 'Usuario que registró salida del refrigerador' AFTER fridge_in_user;

ALTER TABLE solder_paste 
  ADD COLUMN mixing_start_user VARCHAR(100) NULL COMMENT 'Usuario que inició el mezclado' AFTER fridge_out_user;

ALTER TABLE solder_paste 
  ADD COLUMN viscosity_user VARCHAR(100) NULL COMMENT 'Usuario que registró la viscosidad' AFTER mixing_start_user;

ALTER TABLE solder_paste 
  ADD COLUMN opened_user VARCHAR(100) NULL COMMENT 'Usuario que abrió el contenedor' AFTER viscosity_user;

ALTER TABLE solder_paste 
  ADD COLUMN removed_user VARCHAR(100) NULL COMMENT 'Usuario que retiró la pasta' AFTER opened_user;

-- Agregar campo de usuario a la tabla scan_log
ALTER TABLE scan_log 
  ADD COLUMN user_name VARCHAR(100) NULL COMMENT 'Usuario que realizó el escaneo' AFTER scan_datetime;

-- Verificar que los cambios se aplicaron correctamente
DESCRIBE solder_paste;
DESCRIBE scan_log;

SELECT 'Migración completada exitosamente. Los campos de usuario han sido agregados.' as Status;
