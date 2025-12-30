# GVTC Fiber Expansion Intelligence Platform (FEIP)

An internal, map-based web application to identify, track, score, and prioritize pre-construction multifamily (MDU) and subdivision (SFU) developments within GVTC's Texas footprint for fiber expansion.

## Screenshots

### Login Page
![Login](https://github.com/user-attachments/assets/77151afa-1b44-46cc-b0d9-6af3155fd80e)

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/95b6568d-dc65-4b45-845d-3bfdb22f23ae)

### Map View
![Map View](https://github.com/user-attachments/assets/74ff3f70-c2bb-42f8-bbb9-7270ab75f1ce)

### Properties List
![Properties](https://github.com/user-attachments/assets/95be61fa-b521-4ed8-be93-c72785f3b757)

### Property Detail
![Property Detail](https://github.com/user-attachments/assets/076b414c-1433-4bb1-b7fd-391873bbc7ad)

### Scoring Breakdown
![Scoring](https://github.com/user-attachments/assets/5e2008cc-b592-4664-8fee-cff26a55ee0f)

### Import Data
![Import](https://github.com/user-attachments/assets/71b387c3-bde3-4fd4-a721-2035ba1d0d92)

## Features

### 🗺️ Map-Based Property Tracking
- Interactive map view of all properties with tier-based color coding
- Filter by county, property type, status, and tier
- Quick property details in map popups
- Sidebar list with all properties

### 📊 Intelligent Scoring System
- **Transparent, weighted scoring** algorithm
- Factors include:
  - Scale (units/lots count)
  - Fiber proximity (GVTC + lease partners)
  - Competition analysis
  - Demographics (income, density)
  - E-Rate anchors (schools, libraries)
  - Timeline/timing
  - Relationship strength
- **Tier classification**: Tier 1 (75+), Tier 2 (50-74), Tier 3 (<50)
- Recalculate scores on demand

### 📥 Excel Import
- Import MDU properties from Excel
- Import Subdivision properties from Excel
- Automatic column mapping
- Duplicate detection and update
- Import job tracking with error reporting

### 👥 Contact & Organization Management
- Track developers, management companies, HOAs
- Link contacts to properties
- Relationship strength tracking
- Multiple organizations per property

### 📄 Document Management
- Upload plats, site plans, cost sheets, contracts
- Document preview and download
- Organize by document type
- File size and type tracking

### 💰 Cost Modeling
- Build costs (lateral, make-ready, drop, equipment)
- Lease costs tracking
- Revenue projections (take rate, ARPU)
- Automatic calculations:
  - Total CAPEX
  - Cost per unit/lot
  - Estimated monthly revenue
  - Payback period

### 🔐 Authentication & Access Control
- JWT-based authentication
- Role-based access:
  - **Admin**: Full access, manage scoring weights
  - **Analyst**: CRUD properties, contacts, documents
  - **Viewer**: Read-only access

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Primary database
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Pandas** - Excel processing

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Leaflet** - Maps
- **Axios** - API client
- **Vite** - Build tool

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Production web server

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/fiber-expansion-dashboard.git
   cd fiber-expansion-dashboard
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/api/docs
   - API: http://localhost:8000

4. **Initialize the admin user**
   Click "Create Admin User" on the login page, or:
   ```bash
   curl -X POST http://localhost:8000/api/auth/init-admin
   ```

5. **Login with default credentials**
   - Email: `admin@gvtc.com`
   - Password: `admin123`

### Development Setup

#### Backend

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**
   ```bash
   export DATABASE_URL=postgresql://feip:feip@localhost:5432/feip
   export SECRET_KEY=your-secret-key
   ```

4. **Run the backend**
   ```bash
   uvicorn app.main:app --reload
   ```

5. **Seed sample data (optional)**
   ```bash
   python -m app.seed
   ```

#### Frontend

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. **Access at** http://localhost:5173

### Running Tests

```bash
cd backend
pytest tests/ -v
```

## Project Structure

```
fiber-expansion-dashboard/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routers/         # API endpoints
│   │   ├── main.py          # FastAPI app
│   │   ├── auth.py          # Authentication
│   │   ├── config.py        # Settings
│   │   ├── database.py      # DB connection
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── scoring.py       # Scoring engine
│   │   └── seed.py          # Sample data
│   ├── tests/               # Backend tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
├── screenshots/             # Application screenshots
├── docker-compose.yml
└── README.md
```

## API Documentation

Once running, access the interactive API documentation at:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/me` | GET | Get current user |
| `/api/properties` | GET | List all properties |
| `/api/properties` | POST | Create property |
| `/api/properties/{id}` | GET | Get property details |
| `/api/properties/{id}` | PATCH | Update property |
| `/api/properties/{id}/recalculate-score` | POST | Recalculate score |
| `/api/imports/upload` | POST | Import Excel file |
| `/api/organizations` | GET/POST | Manage organizations |
| `/api/contacts` | GET/POST | Manage contacts |
| `/api/documents/upload` | POST | Upload document |
| `/api/costs/property/{id}` | GET/PUT | Manage costs |

## Scoring Algorithm

The scoring engine uses weighted factors to produce a 0-100 score:

### MDU Weights (Default)
| Factor | Weight | Description |
|--------|--------|-------------|
| Scale | 25% | Number of units |
| Fiber Proximity | 20% | Distance to nearest fiber |
| Competitors | 15% | Number of competitors |
| Income | 10% | Median household income |
| Density | 10% | Population density |
| E-Rate | 10% | Nearby schools/libraries |
| Timing | 5% | Days until break ground |
| Relationship | 5% | Contact relationship strength |

### Tier Thresholds
- **Tier 1**: Score ≥ 75 (Green)
- **Tier 2**: Score 50-74 (Amber)
- **Tier 3**: Score < 50 (Red)

## GVTC Service Counties

The application tracks properties in GVTC's 13-county Texas footprint:
- Bexar
- Comal
- Guadalupe
- Kendall
- Blanco
- Hays
- Gillespie
- Kerr
- Medina
- Bandera
- Real
- Edwards
- Uvalde

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://feip:feip@localhost:5432/feip` |
| `SECRET_KEY` | JWT secret key | (required) |
| `DEBUG` | Enable debug mode | `false` |

## License

This is an internal application for GVTC Communications.

## Support

For questions or issues, contact the GVTC Community Development team.
