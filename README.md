# FuelEU Maritime Compliance Dashboard

A comprehensive web application for managing FuelEU Maritime compliance, including route management, GHG intensity comparison, carbon banking, and emission pooling features.

[![image.png](https://i.postimg.cc/pd5ZWGbC/image.png)](https://postimg.cc/nsZ7T1L9)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

FuelEU Maritime Compliance Dashboard is a full-stack application designed to help maritime operators comply with the FuelEU Maritime regulation. The system enables:

- **Route Management**: Track and manage shipping routes with GHG intensity metrics
- **Compliance Monitoring**: Monitor carbon balance (CB) for ships across different years
- **Carbon Banking**: Implement Article 20 banking mechanisms for surplus/deficit carbon credits
- **Emission Pooling**: Create and manage Article 21 emission pools for multiple ships


## ✨ Features

### Core Functionality

- ✅ **Route Management**
  - View all routes with detailed KPIs (vessel type, fuel type, GHG intensity, emissions)
  - Set baseline routes for comparison
  - Filter routes by vessel type, fuel type, and year
  - Real-time route data updates

- ✅ **GHG Intensity Comparison**
  - Compare routes against baseline
  - Calculate percentage differences
  - Compliance status indicators
  - Visual charts using Recharts

- ✅ **Carbon Banking (Article 20)**
  - View banking records per ship and year
  - Apply banking logic to transfer surplus/deficit
  - Track carbon balance over time

- ✅ **Emission Pooling (Article 21)**
  - Create pools with multiple ships
  - Greedy allocation algorithm for surplus redistribution
  - Validate pool balance requirements
  - View pool members with CB before/after values

[![image.png](https://i.postimg.cc/Bb7L132K/image.png)](https://postimg.cc/zHWX99tz)
[![image.png](https://i.postimg.cc/9fH49JwK/image.png)](https://postimg.cc/gx4kFyDH)
[![image.png](https://i.postimg.cc/XqPqY80s/image.png)](https://postimg.cc/wRhgWDMN)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Testing**: Jest
- **Architecture**: Hexagonal Architecture (Ports & Adapters)

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Testing**: Vitest with React Testing Library


## 🏗️ Architecture

The application follows **Hexagonal Architecture** (Ports & Adapters) principles:

```
┌─────────────────────────────────────────────────┐
│              Frontend (React)                   │
│  - UI Components                                │
│  - API Adapters                                 │
│  - Domain Entities                              │
└─────────────────────────────────────────────────┘
                    ↕ HTTP/REST
┌─────────────────────────────────────────────────┐
│              Backend (Express)                   │
│  ┌──────────────────────────────────────────┐  │
│  │  Adapters (Inbound)                      │  │
│  │  - HTTP Controllers                      │  │
│  │  - Routes                                │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Core (Application Services)             │  │
│  │  - Business Logic                        │  │
│  │  - Domain Entities                       │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Adapters (Outbound)                     │  │
│  │  - Prisma Repositories                   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↕ Prisma ORM
┌─────────────────────────────────────────────────┐
│              PostgreSQL Database                │
└─────────────────────────────────────────────────┘
```

### Key Principles

- **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
- **Dependency Inversion**: Core domain depends on abstractions (ports), not implementations
- **Testability**: Services can be tested with mock repositories
- **Modularity**: Each feature is self-contained and loosely coupled

## 📁 Project Structure

```
FuelEU Maritime/
├── backend/
│   ├── src/
│   │   ├── adapters/
│   │   │   ├── inbound/http/
│   │   │   │   ├── controllers/     # HTTP controllers
│   │   │   │   └── routes/          # Express routes
│   │   │   └── outbound/prisma/     # Prisma repositories
│   │   ├── core/
│   │   │   ├── application/
│   │   │   │   └── services/        # Business logic services
│   │   │   ├── domain/
│   │   │   │   └── *.entity.ts      # Domain entities
│   │   │   └── ports/               # Repository interfaces
│   │   ├── infrastructure/
│   │   │   ├── db/                  # Prisma client setup
│   │   │   └── server/              # Express server
│   │   └── shared/
│   │       └── config/              # Constants and utilities
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   ├── migrations/              # Database migrations
│   │   └── seed.ts                  # Seed data
│   └── tests/                       # Unit tests
│
├── frontend/
│   ├── src/
│   │   ├── adaptors/
│   │   │   ├── infrastructure/
│   │   │   │   ├── api/             # API client functions
│   │   │   │   └── mappers/         # Data mappers
│   │   │   └── ui/
│   │   │       ├── components/      # React components
│   │   │       │   ├── layout/      # Layout components
│   │   │       │   └── pages/       # Page components
│   │   │       └── config/          # UI configuration
│   │   ├── core/
│   │   │   ├── domain/              # Frontend domain entities
│   │   │   └── ports/               # Frontend ports
│   │   └── shared/
│   │       └── config/              # Shared constants
│   └── tests/                       # Frontend tests
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "FuelEU Maritime"
   ```

2. **Set up the backend**

   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/fueleu_maritime?schema=public"
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed the database
   npm run prisma:seed
   ```

5. **Set up the frontend**

   ```bash
   cd ../frontend
   npm install
   ```

6. **Start the development servers**

   **Backend** (in `backend` directory):
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:3000`

   **Frontend** (in `frontend` directory):
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`



## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /health
```

### Routes API

#### Get All Routes
```http
GET /routes?year=2024&vesselType=Container&fuelType=Diesel
```

**Query Parameters:**
- `year` (optional): Filter by year
- `vesselType` (optional): Filter by vessel type
- `fuelType` (optional): Filter by fuel type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "routeId": "R001",
      "vesselType": "Container",
      "fuelType": "Diesel",
      "year": 2024,
      "ghgIntensity": 91.0,
      "fuelConsumption": 1000,
      "distance": 5000,
      "totalEmissions": 45500,
      "isBaseline": true
    }
  ]
}
```

#### Set Baseline Route
```http
POST /routes/:routeId/baseline
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "routeId": "R001",
    "isBaseline": true
  }
}
```

#### Get Route Comparison
```http
GET /routes/comparison
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "routeId": "R001",
      "ghgIntensity": 91.0,
      "percentDiff": 0,
      "compliant": false
    }
  ]
}
```

### Compliance API

#### Get Adjusted Compliance
```http
GET /compliance/adjusted-cb?year=2024
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "shipId": 1,
      "adjustedCb": 150.5
    }
  ]
}
```

### Banking API

#### Get Banking Records
```http
GET /banking/records?shipId=1&year=2024
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "shipId": 1,
      "year": 2025,
      "amountGco2eq": 100.5
    }
  ]
}
```

#### Apply Banking
```http
POST /banking/apply
```

**Response:**
```json
{
  "success": true,
  "message": "Banking applied successfully"
}
```

### Pooling API

#### Get All Pools
```http
GET /pools
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "year": 2025,
      "members": [
        {
          "shipId": 1,
          "cbBefore": 100,
          "cbAfter": 50
        }
      ]
    }
  ]
}
```

#### Create Pool
```http
POST /pools
Content-Type: application/json

{
  "year": 2025,
  "members": [
    { "shipId": 1, "cbBefore": 100 },
    { "shipId": 2, "cbBefore": -80 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "year": 2025,
    "members": [
      {
        "shipId": 1,
        "cbBefore": 100,
        "cbAfter": 50
      },
      {
        "shipId": 2,
        "cbBefore": -80,
        "cbAfter": -30
      }
    ]
  }
}
```


## 🧪 Testing

### Backend Tests

Run all tests:
```bash
cd backend
npm test
```



### Frontend Tests

Run all tests:
```bash
cd frontend
npm test
```


### Test Coverage

The project includes unit tests for:
- ✅ Service layer (business logic)
- ✅ Repository layer (data access)
- ✅ Frontend components
- ✅ API client functions


## 🔮 Future Improvements

The following enhancements are planned for future releases:

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Captain, Chief Engineer, etc.)

- 🗺️ **Enhanced Route Visualization**
  - Google Maps API integration
  - Route visualization on maps
  - Distance and fuel consumption analytics

- ⚡ **Performance Optimizations**
  - Redis caching for frequently accessed data
  - Database query optimization
  - API response caching

- 📊 **Advanced Analytics**
  - Enhanced charts and visualizations
  - Historical trend analysis
  - Predictive compliance modeling using AI Models

- 🎨 **UI/UX Enhancements**
  - Dark mode support
  - Improved responsive design
  - Enhanced accessibility features

- 📄 **Export & Reporting**
  - Export data to PDF, Excel, or CSV
  - Automated compliance reports
  - Scheduled report generation

- 🔒 **Security & Reliability**
  - API rate limiting
  - Robust error logging and monitoring
  - Retry logic patterns for failed operations

- 🐳 **DevOps**
  - Docker containerization
  - Docker Compose for local development


## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- **Satyam Prajapati**

## 🙏 Acknowledgments

- FuelEU Maritime Regulation documentation
- Github Copilot, ChatGPT & Cursor <3
- Prisma team for excellent ORM
- React and TypeScript communities
- All contributors and testers

---
