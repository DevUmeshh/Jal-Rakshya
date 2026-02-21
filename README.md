# 🌊 JalRakshya – Intelligent Groundwater Monitoring & Decision Support System

A production-level full-stack web application for monitoring groundwater data across 100+ locations in Nashik district, Maharashtra. Features interactive maps, smart alerts, predictive analytics, and Power BI–style dashboards.

---

## 📁 Project Structure

```
Jal-Rakshya/
├── client/                  # React.js frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context (Location, Theme)
│   │   ├── pages/           # Home, Dashboard, Analytics
│   │   └── utils/           # API client, helpers
│   ├── .env                 # Frontend environment vars
│   ├── tailwind.config.js
│   └── package.json
├── server/                  # Node.js + Express backend
│   ├── controllers/         # Route handlers
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── utils/               # CSV parser, alert engine, scoring
│   ├── .env                 # Backend environment vars
│   ├── server.js
│   └── package.json
├── data/                    # CSV upload storage
├── nsk_groundwater.csv      # Source dataset
└── package.json             # Root scripts
```

---

## ⚙️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, Tailwind CSS, Framer Motion   |
| Charts     | Chart.js + react-chartjs-2              |
| Maps       | Google Maps JavaScript API              |
| Backend    | Node.js, Express                        |
| Database   | MongoDB + Mongoose                      |
| PDF Export | jsPDF + html2canvas                     |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally (default: `mongodb://127.0.0.1:27017`)
- (Optional) **Google Maps API Key** for interactive maps

### 1. Install Dependencies

```bash
# From project root
npm run install:all
```

Or separately:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment

**Server** (`server/.env`):
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/jalrakshya
NODE_ENV=development
```

**Client** (`client/.env`):
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

### 3. Seed the Database

This parses `nsk_groundwater.csv` and loads all 316 records + 105 locations into MongoDB:

```bash
npm run seed
```

### 4. Start Development Servers

**Terminal 1 – Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 – Frontend:**
```bash
cd client
npm start
```

The app will be available at **https://jal-rakshya.vercel.app)**

---

## 📊 Features

### Page 1: Home (/)
- Hero section with search/autocomplete
- Location dropdown from API
- District statistics overview
- Popular locations quick access

### Page 2: Smart Dashboard (/dashboard/:location)
- **Google Map** with color-coded markers (Green/Yellow/Red)
- **5 KPI Cards**: Water Level, Rainfall, Depletion, pH, Water Score
- **Water Health Score** gauge with technical indices
- **Smart Alerts** (drought risk, over-extraction, pH imbalance)
- **Government Updates** from simulated sources
- **Year-wise Data Table** with sorting

### Page 3: Analytics Dashboard (/analytics/:location)
- **Line Chart**: Groundwater Level over time + predictions
- **Multi-line Chart**: Rainfall vs Water Level vs Depletion
- **Bar Chart**: Usage breakdown by category
- **Pie Chart**: Water usage distribution
- **Scatter Plot**: Rainfall-Water Level correlation
- **Water Score** with grade (A–F) and technical indices
- **Compare Locations**: Side-by-side analysis
- **Future Predictions**: Linear regression forecast
- **PDF Export**: Download report as PDF
- **Year Range Filter**

---

## 🧠 Business Logic

### Water Score Calculation
```
score = (waterLevel_norm * 0.35) + (rainfall_norm * 0.25) 
      + (depletion_norm * 0.30) + (pH_norm * 0.10)
```

### Alert Thresholds
| Metric           | Warning    | Critical   |
|------------------|------------|------------|
| Water Level      | ≥ 12m      | ≥ 15m      |
| Depletion Rate   | ≥ 5%       | ≥ 7%       |
| Rainfall         | ≤ 700mm    | ≤ 600mm    |
| pH               | < 6.5 or > 8.0 | –     |

### Status Engine
- **Safe** (score ≥ 70): Green marker
- **Warning** (score 40–69): Yellow marker
- **Critical** (score < 40): Red marker

---

## 🎨 UI Features
- **Dark Mode** toggle with system preference detection
- **Glassmorphism** card design
- **Smooth animations** via Framer Motion
- **Responsive** grid layout
- Professional Power BI–style dashboard

---

## 🔌 API Endpoints

| Method | Endpoint                        | Description                     |
|--------|---------------------------------|---------------------------------|
| GET    | /api/locations                  | List all locations (with search)|
| GET    | /api/locations/:name            | Get location details            |
| GET    | /api/water/:location            | All data for a location         |
| GET    | /api/water/:location/latest     | Latest year data                |
| GET    | /api/water/:location/alerts     | Dynamic alerts                  |
| GET    | /api/water/:location/gov-updates| Government updates              |
| GET    | /api/water/:location/predictions| Linear regression forecasts     |
| GET    | /api/water/compare?loc1=&loc2=  | Compare two locations           |
| GET    | /api/water/overview/all         | All locations overview (for map)|
| GET    | /api/water/stats/district       | District-level statistics       |
| POST   | /api/upload/csv                 | Upload & ingest CSV file        |

---

## 🚢 Production Deployment

### Build for Production

```bash
# Build React app
npm run build:client

# Set server to production
# In server/.env:
NODE_ENV=production

# Start server (serves both API and static files)
npm start
```

### Docker (optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN cd server && npm ci --production
RUN cd client && npm ci && npm run build
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "server/server.js"]
```

---

## 📦 Dataset

The `nsk_groundwater.csv` contains **316 records** across **105+ locations** in Nashik district with data from 2018–2020:

| Column                        | Type    | Description          |
|-------------------------------|---------|----------------------|
| Location                      | String  | Place name           |
| Year                          | Number  | 2018/2019/2020       |
| Consumption (Ml)              | Number  | Total consumption    |
| Per Capita Water Usage (l/d)  | Number  | Per person daily     |
| Agricultural Water Usage (Ml) | Number  | Farm usage           |
| Industrial Water Usage (Ml)   | Number  | Industry usage       |
| Household Water Usage (Ml)    | Number  | Domestic usage       |
| Rainfall (mm)                 | Number  | Annual rainfall      |
| Groundwater Depletion Rate (%)| Number  | Extraction rate      |
| Water Scarcity Level          | String  | Low/Moderate/High/Severe/Extreme |
| pH                            | Number  | Water acidity        |
| Groundwater Level (m)         | Number  | Depth below ground   |

---

## 📜 License

This project is for educational and demonstration purposes.
