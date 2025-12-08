# SMT Paste Tracker
## Sistema de Control y Trazabilidad de Pastas de Soldadura SMT

Aplicación web fullstack para el control y trazabilidad de pastas de soldadura SMT con sistema de escaneo QR.

## Stack Tecnológico

- **Frontend**: React con Next.js 14 (App Router)
- **Base de Datos**: MySQL
- **Estilos**: Tailwind CSS
- **Iconos**: Heroicons

## Requisitos Previos

- Node.js 18+
- MySQL 8.0+
- npm o yarn

## Instalación

### 1. Clonar/Descargar el proyecto

```bash
cd c:\app\pastas
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

#### 3.1 Crear la base de datos
Ejecutar el script SQL en MySQL:

```bash
mysql -u root -p < database/schema.sql
```

O copiar y ejecutar el contenido de `database/schema.sql` en MySQL Workbench o phpMyAdmin.

#### 3.2 Configurar variables de entorno

Copiar el archivo de ejemplo:

```bash
copy .env.example .env.local
```

Editar `.env.local` con los datos de conexión:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=solder_paste_db
```

### 4. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

## Uso de la Aplicación

### Pestaña "Fridge In" - Flujo de Escaneos

El sistema maneja 6 escaneos secuenciales para cada pasta:

| Escaneo | Acción | Descripción |
|---------|--------|-------------|
| 1 | Registro Inicial | Primera vez que se escanea, solicita **DID** y registra entrada al refrigerador |
| 2 | Salida Refrigerador | Confirma salida del refrigerador, **inicia espera de 4 horas** |
| 3 | Inicio Mezclado | **Solo permitido después de 4 horas** de salida del refrigerador |
| 4 | Viscosidad | Ingresa valor de viscosidad (150-180) |
| 5 | Apertura | Registra apertura del contenedor |
| 6 | Retiro | Registra retiro final |

### Reglas de Negocio Importantes

#### 1. DID Obligatorio
Al registrar una nueva pasta (primer escaneo), el sistema solicita que se ingrese un **DID** (Document Identification). Este campo es obligatorio y no se puede registrar una pasta sin él.

#### 2. Tiempo de Espera de 4 Horas
El sistema **NO** permite iniciar el proceso de mezclado hasta que hayan transcurrido **4 horas** desde que la pasta salió del refrigerador. Si se intenta escanear antes de ese tiempo, el sistema mostrará un mensaje indicando el tiempo restante.

#### 3. Detección Automática de Línea SMT
El sistema detecta automáticamente la ubicación de línea SMT basándose en el prefijo del número de parte:

| Prefijo | Línea SMT |
|---------|-----------|
| k01., k02., a01. | SMT |
| k03., k04., b01., b02. | SMT2 |
| k05., k06., c01., c02. | SMT3 |
| k07., k08., d01., d02. | SMT4 |

> Los mapeos se pueden modificar en `src/config/smtMapping.ts`

### Formato del Código QR

Los códigos QR deben contener datos separados por comas:

```
lote,parte,expiración,fabricación,serial
```

**Ejemplo:**
```
50822985,k01.005-00m-2,260218,250909,017
```

| Posición | Campo | Formato | Ejemplo |
|----------|-------|---------|---------|
| 1 | Número de lote | Texto | 50822985 |
| 2 | Número de parte | Texto | k01.005-00m-2 |
| 3 | Fecha expiración | YYMMDD | 260218 (= 2026-02-18) |
| 4 | Fecha fabricación | YYMMDD | 250909 (= 2025-09-09) |
| 5 | Serial del lote | Texto | 017 |

### Validación de Viscosidad

- **Rango válido**: 150 - 180
- Si el valor está fuera de rango, la pasta se rechaza y debe volver a mezclarse
- El sistema mantiene el historial de intentos de viscosidad

### Estados de la Pasta

| Estado | Color | Descripción |
|--------|-------|-------------|
| En Refrigerador | Azul | Pasta almacenada en frío |
| Fuera de Refrigerador | Amarillo | Fuera del refrigerador, esperando 4 horas |
| Mezclando | Naranja | En proceso de mezclado |
| Viscosidad OK | Verde | Viscosidad aprobada |
| Abierto | Púrpura | Contenedor abierto |
| Retirado | Gris | Proceso completado |
| Rechazado | Rojo | Viscosidad fuera de rango, requiere re-mezclado |

## Estructura del Proyecto

```
pastas/
├── database/
│   └── schema.sql          # Script de creación de BD
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── pastes/
│   │   │       ├── route.ts           # GET all, POST new
│   │   │       └── [id]/
│   │   │           ├── route.ts       # GET, DELETE by ID
│   │   │           └── scan/
│   │   │               └── route.ts   # POST scan action (con validación 4h)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── modals/
│   │   │   ├── NewPasteModal.tsx      # Modal nuevo registro (con DID)
│   │   │   ├── ScanActionModal.tsx    # Modal acciones
│   │   │   ├── ViscosityModal.tsx     # Modal viscosidad
│   │   │   ├── WaitTimeModal.tsx      # Modal tiempo de espera 4h
│   │   │   └── CompletedModal.tsx     # Modal completado
│   │   ├── scanner/
│   │   │   └── QRScannerInput.tsx     # Input de escaneo
│   │   ├── table/
│   │   │   └── PasteTable.tsx         # Tabla principal (con DID y SMT)
│   │   ├── tabs/
│   │   │   ├── FridgeInTab.tsx        # Pestaña principal
│   │   │   └── ReportsTab.tsx         # Pestaña reportes (con SMT stats)
│   │   └── ui/
│   │       ├── Modal.tsx              # Modal base
│   │       ├── Tabs.tsx               # Sistema de pestañas
│   │       ├── StatusBadge.tsx        # Badge de estado
│   │       └── ShelfLifeIndicator.tsx # Indicador vida útil
│   ├── config/
│   │   └── smtMapping.ts              # Configuración mapeo SMT
│   ├── lib/
│   │   ├── db.ts                      # Conexión MySQL
│   │   └── qrParser.ts                # Parser de QR
│   └── types/
│       └── index.ts                   # Definiciones TypeScript
├── .env.example
├── package.json
└── README.md
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar producción
npm run start

# Linting
npm run lint
```

## Base de Datos

### Tabla `solder_paste`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID autoincremental |
| did | VARCHAR(100) | **Document Identification (obligatorio)** |
| lot_number | VARCHAR(50) | Número de lote |
| part_number | VARCHAR(100) | Número de parte |
| lot_serial | VARCHAR(20) | Serial del lote |
| smt_location | ENUM | **Línea SMT (SMT, SMT2, SMT3, SMT4)** |
| manufacture_date | DATE | Fecha de fabricación |
| expiration_date | DATE | Fecha de expiración |
| fridge_in_datetime | DATETIME | Entrada al refrigerador |
| fridge_out_datetime | DATETIME | Salida del refrigerador |
| mixing_start_datetime | DATETIME | Inicio de mezclado |
| viscosity_value | DECIMAL(5,2) | Valor de viscosidad |
| viscosity_datetime | DATETIME | Fecha/hora de viscosidad |
| opened_datetime | DATETIME | Apertura del contenedor |
| removed_datetime | DATETIME | Retiro final |
| status | ENUM | Estado actual |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

### Tabla `scan_log`

Registro de auditoría de todos los escaneos realizados.

## 🔒 Consideraciones de Seguridad

- Las credenciales de BD deben estar en variables de entorno
- No subir `.env.local` al repositorio
- Validar siempre los datos del lado del servidor

## ⚙️ Configuración de Mapeo SMT

Para modificar los mapeos de prefijos de parte a líneas SMT, editar el archivo `src/config/smtMapping.ts`:

```typescript
// Ejemplo: Agregar nuevo prefijo
export const SMT_PREFIX_MAP: Record<string, SMTLocation> = {
  'k01.': 'SMT',
  'nuevo-prefijo.': 'SMT3',  // Agregar aquí
  // ...
};
```

También se pueden agregar mapeos exactos o por expresiones regulares en el mismo archivo.

## Licencia

MIT
