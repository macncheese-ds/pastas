-- =====================================================
-- Script Manual para Actualizar Fechas de Pastas
-- =====================================================
-- Ejecuta este script en MySQL Workbench o línea de comandos
-- Modifica los valores según necesites

USE solder_paste_db;

-- =====================================================
-- 1. CONSULTAR PASTAS EXISTENTES
-- =====================================================
-- Ver todas las pastas para identificar cuáles necesitas actualizar
SELECT 
    id,
    did,
    lot_number,
    lot_serial,
    part_number,
    status,
    fridge_in_datetime,
    fridge_out_datetime,
    mixing_start_datetime,
    viscosity_datetime,
    opened_datetime,
    removed_datetime
FROM solder_paste
ORDER BY id;

-- =====================================================
-- 2. ACTUALIZAR UNA PASTA INDIVIDUAL
-- =====================================================
-- Cambia el ID y las fechas según necesites
-- Formato de fecha: 'YYYY-MM-DD HH:MM:SS'

/*
UPDATE solder_paste
SET 
    fridge_in_datetime = '2026-01-05 08:00:00',
    fridge_out_datetime = '2026-01-05 12:00:00',
    mixing_start_datetime = '2026-01-05 16:00:00',
    viscosity_value = 180,  -- Valor entre 170-230 (rango válido)
    viscosity_datetime = '2026-01-05 16:30:00',
    opened_datetime = '2026-01-05 17:00:00',
    removed_datetime = '2026-01-05 18:00:00',
    status = 'removed'  -- Cambia el estado si es necesario
WHERE id = 1;  -- CAMBIA ESTE ID POR EL QUE NECESITES
*/

-- =====================================================
-- 3. ACTUALIZAR MÚLTIPLES PASTAS CON LAS MISMAS FECHAS
-- =====================================================
-- Útil cuando varias pastas necesitan las mismas fechas

/*
UPDATE solder_paste
SET 
    fridge_in_datetime = '2026-01-05 08:00:00',
    fridge_out_datetime = '2026-01-05 12:00:00',
    mixing_start_datetime = '2026-01-05 16:00:00',
    viscosity_value = 180,  -- Valor entre 170-230 (rango válido)
    viscosity_datetime = '2026-01-05 16:30:00',
    opened_datetime = '2026-01-05 17:00:00',
    removed_datetime = '2026-01-05 18:00:00',
    status = 'removed'
WHERE id IN (1, 2, 3, 4, 5);  -- LISTA DE IDs SEPARADOS POR COMAS
*/

-- =====================================================
-- 4. ACTUALIZAR SOLO ALGUNAS FECHAS (NO TODAS)
-- =====================================================
-- Si solo necesitas cambiar ciertas fechas

/*
UPDATE solder_paste
SET 
    fridge_in_datetime = '2026-01-05 08:00:00',
    fridge_out_datetime = '2026-01-05 12:00:00'
WHERE id = 1;
*/

-- =====================================================
-- 5. ACTUALIZAR USUARIOS QUE REALIZARON LAS ACCIONES
-- =====================================================

/*
UPDATE solder_paste
SET 
    fridge_in_user = 'Juan Pérez',
    fridge_out_user = 'Juan Pérez',
    mixing_start_user = 'María García',
    viscosity_user = 'María García',
    opened_user = 'Carlos López',
    removed_user = 'Carlos López'
WHERE id = 1;
*/

-- =====================================================
-- 6. ACTUALIZAR EL DID
-- =====================================================

/*
UPDATE solder_paste
SET did = 'NUEVO-DID-123'
WHERE id = 1;
*/

-- =====================================================
-- 7. ACTUALIZAR LA VISCOSIDAD
-- Rango válido: 170 - 230
-- Si está fuera de este rango, el status debería ser 'rejected'

/*
UPDATE solder_paste
SET 
    viscosity_value = 180,  -- RANGO VÁLIDO: 170-230
    viscosity_datetime = '2026-01-05 16:30:00',
    viscosity_user = 'Juan Pérez',
    status = 'viscosity_ok'  -- Usa 'rejected' si está fuera del rango-05 16:30:00',
    viscosity_user = 'Juan Pérez'
WHERE id = 1;
*/

-- =====================================================
-- 8. CAMBIAR ESTADO DE LA PASTA
-- =====================================================
-- Estados válidos: 'in_fridge', 'out_fridge', 'mixing', 'viscosity_ok', 'opened', 'removed', 'rejected'

/*
UPDATE solder_paste
SET status = 'removed'
WHERE id = 1;
*/

-- =====================================================
-- 9. ELIMINAR UNA PASTA
-- =====================================================
-- CUIDADO: Esto elimina permanentemente

/*
DELETE FROM solder_paste
WHERE id = 1;
*/

-- =====================================================
-- 10. ELIMINAR MÚLTIPLES PASTAS
-- =====================================================

/*
DELETE FROM solder_paste
WHERE id IN (1, 2, 3, 4, 5);
*/

-- =====================================================
-- 11. BUSCAR PASTAS POR CRITERIOS
-- =====================================================

-- Buscar por DID
/*
SELECT * FROM solder_paste WHERE did LIKE '%DID-123%';
*/

-- Buscar por número de lote
/*
SELECT * FROM solder_paste WHERE lot_number = 'LOT123';
*/

-- Buscar por estado
/*
SELECT * FROM solder_paste WHERE status = 'in_fridge';
*/

-- Buscar por línea SMT
/*
SELECT * FROM solder_paste WHERE smt_location = 'SMT';
*/

-- Buscar pastas sin fechas completas
/*
SELECT id, did, lot_number, lot_serial, status
FROM solder_paste
WHERE removed_datetime IS NULL
   OR opened_datetime IS NULL
   OR viscosity_datetime IS NULL;
*/

-- =====================================================
-- 12. ACTUALIZACIÓN MASIVA CON INCREMENTOS
-- =====================================================
-- Ejemplo: Establecer fechas secuenciales para varias pastas

/*
-- Pasta 1
UPDATE solder_paste
SET 
    fridge_in_value = 180,
    viscosity_datetime = '2026-01-05 16:30:00',
    opened_datetime = '2026-01-05 17:00:00',
    removed_datetime = '2026-01-05 18:00:00',
    status = 'removed'
WHERE id = 1;

-- Pasta 2 (1 hora después)
UPDATE solder_paste
SET 
    fridge_in_datetime = '2026-01-05 09:00:00',
    fridge_out_datetime = '2026-01-05 13:00:00',
    mixing_start_datetime = '2026-01-05 17:00:00',
    viscosity_value = 185,
    viscosity_datetime = '2026-01-05 17:30:00',
    opened_datetime = '2026-01-05 18:00:00',
    removed_datetime = '2026-01-05 19:00:00',
    status = 'removed'
WHERE id = 2;

-- Pasta 3 (2 horas después de la primera)
UPDATE solder_paste
SET 
    fridge_in_datetime = '2026-01-05 10:00:00',
    fridge_out_datetime = '2026-01-05 14:00:00',
    mixing_start_datetime = '2026-01-05 18:00:00',
    viscosity_value = 175
    fridge_in_datetime = '2026-01-05 10:00:00',
    fridge_out_datetime = '2026-01-05 14:00:00',
    mixing_start_datetime = '2026-01-05 18:00:00',
    viscosity_datetime = '2026-01-05 18:30:00',
    opened_datetime = '2026-01-05 19:00:00',
    removed_datetime = '2026-01-05 20:00:00',
    status = 'removed'
WHERE id = 3;
*/

-- =====================================================
-- 13. REGISTRAR LA ACTUALIZACIÓN EN EL LOG
-- =====================================================
-- Opcional: Registrar que hiciste una actualización manual

/*
INSERT INTO scan_log (solder_paste_id, scan_type, user_name, notes)
VALUES (
    1,  -- ID de la pasta
    'did_update',  -- Tipo de log más apropiado para actualizaciones manuales
    'Tu Nombre',  -- Tu nombre
    'Actualización manual de fechas - Pasta sin registro correcto de protocolos'
);
*/

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Siempre haz un SELECT antes de UPDATE/DELETE para verificar qué vas a cambiar
-- 2. Las fechas deben seguir un orden lógico:
--    fridge_in < fridge_out < mixing_start < viscosity < opened < removed
-- 3. El tiempo entre fridge_out y mixing_start debe ser al menos 4 horas
-- 4. Descomenta (quita /*  */) las líneas que quieras ejecutar
-- 5. CAMBIA LOS IDs Y FECHAS SEGÚN TUS NECESIDADES
-- 6. Ejecuta una línea a la vez para evitar errores
-- 7. Puedes usar MySQL Workbench, phpMyAdmin, o línea de comandos

-- =====================================================
-- BACKUP ANTES DE HACER CAMBIOS (RECOMENDADO)
-- =====================================================
-- Ejecuta esto en la terminal/CMD antes de hacer cambios:
-- mysqldump -u root -p solder_paste_db > backup_pastas_2026-01-05.sql
