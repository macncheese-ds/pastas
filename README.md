# Pastas

An SMT solder paste traceability system designed to track and manage solder paste inventory, material properties, usage, and quality metrics throughout the electronics manufacturing process.

---

## Table of Contents
- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database](#database)
- [Material Properties](#material-properties)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## Demo

![Inventory Management Demo](docs/demos/inventory-management.gif)

---

## Overview

Pastas is a comprehensive solder paste management system specifically designed for SMT (Surface Mount Technology) assembly operations. It provides complete traceability from material receipt through usage in production, ensuring quality control and compliance with manufacturing standards. Track batch information, chemical composition, expiration dates, and usage logs with full audit capabilities.

---

## Features

- Solder Paste Inventory Management: Track material batches and stock levels
- Material Specifications: Store and manage chemical composition and properties
- Batch Traceability: Complete history from receipt to manufacturing use
- Expiration Management: Monitor shelf life and open container timelines
- Usage Logging: Record consumption in production runs
- Quality Control: Track test results and compliance metrics
- Material Properties: Store technical data and certifications
- User Authentication: Secure access with role-based permissions
- Audit Trail: Complete history of all material movements and modifications
- Search and Filter: Quick material lookup and inventory search

---

## Tech Stack

### Backend
- Node.js with Express
- Authentication: JWT (jsonwebtoken), bcryptjs
- Security: CORS
- Database: MySQL 2
- Development: Nodemon

### Frontend
- React 18
- Build Tool: Vite
- Styling: Tailwind CSS
- Routing: React Router DOM
- Icons: Heroicons React
- TypeScript Support: Type definitions

### DevOps
- Docker & Docker Compose (optional)

---

## Project Structure

```
pastas/
├── backend/
│   ├── src/
│   │   ├── routes/           # API endpoint definitions
│   │   ├── middleware/       # Authentication and validation
│   │   ├── controllers/      # Business logic
│   │   ├── models/           # Database models
│   │   └── index.js          # Express server entry point
│   ├── package.json
│   └── .env                  # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/       # React UI components
│   │   ├── pages/            # Page components
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── public/               # Static assets
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── .env                  # Environment variables (not committed)
├── Dump_15012026.sql         # Database dump
├── .gitignore
└── README.md
```

---

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd pastas

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Configure environment variables
# Create .env files in backend and frontend directories

# Start backend (from backend directory)
npm run dev

# In a new terminal, start frontend (from frontend directory)
npm run dev
```

Then open your browser to `http://localhost:5173` (or the configured Vite port).

---

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MySQL Server

### Step-by-step Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pastas
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. Initialize the database:
   ```bash
   # Restore database from backup (optional)
   mysql -u user -p database_name < Dump_15012026.sql
   
   # Or create fresh database with schema
   mysql -u user -p -e "CREATE DATABASE IF NOT EXISTS pastas;"
   ```

---

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/pastas
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
LOG_LEVEL=debug
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_PORT=5173
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Production Build

**Backend:**
```bash
cd backend
npm run start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - New user registration
- `POST /api/auth/refresh` - Refresh JWT token

### Solder Paste Materials
- `GET /api/materials` - Get all solder paste materials
- `GET /api/materials/:id` - Get specific material details
- `POST /api/materials` - Create new material entry
- `PUT /api/materials/:id` - Update material information
- `DELETE /api/materials/:id` - Delete material record

### Batch Management
- `GET /api/batches` - Get all material batches
- `GET /api/batches/:id` - Get specific batch information
- `POST /api/batches` - Create new batch entry
- `PUT /api/batches/:id` - Update batch details
- `DELETE /api/batches/:id` - Delete batch record

### Material Properties & Specifications
- `GET /api/properties` - Get material property templates
- `GET /api/specifications` - Get quality specifications
- `POST /api/properties` - Add material properties
- `PUT /api/properties/:id` - Update properties
- `DELETE /api/properties/:id` - Remove properties

### Inventory & Usage
- `GET /api/inventory` - Get current stock levels
- `POST /api/usage` - Record material consumption
- `GET /api/usage` - Get usage history
- `GET /api/usage/:material_id` - Get material usage log

### Quality & Compliance
- `GET /api/quality` - Get quality metrics
- `POST /api/quality/test` - Record quality test results
- `GET /api/compliance` - Get compliance status
- `POST /api/compliance/certify` - Create compliance certificate

### Users & Access
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Reporting
- `GET /api/reports/inventory` - Inventory status report
- `GET /api/reports/expiration` - Expiration timeline report
- `GET /api/reports/usage` - Material usage report
- `GET /api/reports/compliance` - Compliance status report

---

## Database

The application uses MySQL with tables for:
- Materials (solder paste types and specifications)
- Batches (individual batch records with lot numbers)
- Properties (chemical composition and technical data)
- Inventory (stock tracking and location)
- Usage (consumption logs and production traceability)
- QualityTests (test results and metrics)
- Compliance (certifications and audit trail)
- Users (user accounts with roles)
- AuditLog (complete history of changes)

Database backup available in `Dump_15012026.sql`.

---

## Material Properties

### Standard Properties Tracked
- Batch/Lot Number
- Manufacture Date
- Expiration Date (shelf life)
- Open Date (for opened containers)
- Storage Conditions (temperature, humidity)
- Chemical Composition
- Viscosity
- Particle Size Distribution
- Lead Content (RoHS compliance)
- Halogen Content
- Flux Density
- Metal Content Percentage

### Quality Metrics
- Slump Test Results
- Solder Ball Formation
- Wetting Performance
- Temperature Profile Compliance
- Printability Index

---

## Development

### Code Style
- Use ES6+ syntax
- Follow consistent naming conventions
- Comment complex logic sections
- Maintain type safety where possible

### Building for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run start
```

### Testing Endpoints
Use tools like Postman or curl to test API endpoints:
```bash
# Example login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'

# Example get materials
curl -X GET http://localhost:3000/api/materials \
  -H "Authorization: Bearer <token>"
```

---

## Troubleshooting

### Port Already in Use
If port 3000 or 5173 is in use, update the PORT variable in `.env` files.

### Database Connection Error
- Verify MySQL server is running
- Check DATABASE_URL in backend/.env with correct credentials
- Ensure database exists: `CREATE DATABASE pastas;`

### Authentication Issues
- Verify JWT_SECRET is set in backend/.env
- Clear browser cookies and log in again
- Check token expiration settings

### CORS Errors
- Verify VITE_API_URL in frontend/.env matches backend URL
- Ensure backend CORS is configured to allow frontend origin

### Material Not Found
- Verify material ID exists in database
- Check batch numbers are correctly recorded
- Ensure user has permission to access material

### Expiration Date Issues
- Verify date format in database (YYYY-MM-DD)
- Check shelf life calculations
- Confirm storage condition impacts on expiration

---

## License

This project is proprietary and confidential.

---

## Support

For issues, questions, or feature requests, contact the development team.
