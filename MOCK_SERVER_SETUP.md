# Mock Server Setup Guide

## Overview

The Security Dashboard is now configured to use a **Mock Server** instead of the Digifort API. This provides sample data for development and testing without requiring connection to a real Digifort security system.

## Architecture

```
┌─────────────┐          ┌─────────────┐          ┌──────────────┐
│   Frontend  │ ────────>│   Backend   │ ────────>│ Mock Server  │
│  (React)    │          │  (Express)  │          │   (Flask)    │
│ :5173       │          │  :5000      │          │   :8089      │
└─────────────┘          └─────────────┘          └──────────────┘
```

- **Frontend (React/Vite)**: User interface running on http://localhost:5173
- **Backend (Express/Node.js)**: API proxy running on http://localhost:5000
- **Mock Server (Python/Flask)**: Provides sample camera data on http://localhost:8089

## What Changed

### Before (Digifort API - Commented Out)
- Backend connected directly to Digifort server at `http://192.168.100.164:8601`
- Required authentication (username, password)
- Used real security camera system data

### After (Mock Server - Active)
- Backend connects to local mock server at `http://localhost:8089`
- No authentication required
- Uses sample data with 3D positioning for visualization

## Quick Start

### 1. Start Mock Server (Terminal 1)

```powershell
python mock_server/app.py
```

The mock server will start on http://localhost:8089

**Mock Server Provides:**
- 50 Moscow State University cameras (CAM-MSU-*)
- 34 High School cameras (CAM-HS-*)
- 47 Shopping Mall cameras
- Sample events, analytics, bookmarks, and audit logs
- All cameras include 3D positioning data (x, y, z, angle, location)

### 2. Start Backend (Terminal 2)

```powershell
cd server
npx tsx index.ts
```

Backend will start on http://localhost:5000 and automatically proxy requests to the mock server.

### 3. Start Frontend (Terminal 3)

```powershell
npm run dev
```

Frontend will start on http://localhost:5173

## What You'll See

Navigate to the different pages in the application:

### 🏛️ Moscow State University
- **URL**: http://localhost:5173/moscow-university
- **Cameras**: 50 cameras placed around the iconic building
- **Features**: 
  - 3D visualization with actual model
  - Interior floor plan view
  - Camera markers with field-of-view cones
  - Click cameras to view "live" footage
  - Layer controls (cameras, access control, sensors, occupancy)

### 🏫 High School
- **URL**: http://localhost:5173/high-school
- **Cameras**: 34 cameras throughout the school
- **Features**:
  - 3D visualization
  - Cameras in hallways, classrooms, cafeteria, library, gym
  - Parking lot and playground cameras
  - Interactive camera selection

### 🏬 Shopping Mall
- **URL**: http://localhost:5173/shopping-mall
- **Cameras**: 47 cameras
- **Features**:
  - 2D floor plan view
  - Ground floor and second floor views
  - Store, corridor, and perimeter cameras

## Mock Server Data

### Camera Naming Convention

- **Moscow State University**: `CAM-MSU-*`
  - Example: `CAM-MSU-MAIN-ENTRANCE-01`, `CAM-MSU-TOWER-TOP-01`
  
- **High School**: `CAM-HS-*`
  - Example: `CAM-HS-MAIN-ENTRANCE-01`, `CAM-HS-CAFETERIA-01`
  
- **Shopping Mall**: `CAM-*` (no prefix)
  - Example: `CAM-ENTRANCE-LEFT`, `CAM-GF-LOBBY`

### 3D Position Data

Each camera from the mock server includes:
- **x, y, z**: 3D coordinates for placement on the model
- **angle**: Camera viewing direction in radians
- **location**: Human-readable location description

This data is calculated by the mock server's position generation functions:
- `generate_moscow_university_position()` - For MSU cameras
- `generate_high_school_position()` - For high school cameras

## Code Changes Made

### 1. `server/routes.ts`

```typescript
// Before (Commented Out):
// const DIGIFORT_API_URL = process.env.DIGIFORT_API_URL || "http://192.168.100.164:8601";

// After (Active):
const MOCK_SERVER_URL = "http://localhost:8089";
```

The `proxyRequest()` function now:
- Makes simple HTTP requests to mock server
- No authentication required
- Digifort API code is commented out but preserved for future use

### 2. `mock_server/app.py`

Already contained:
- Moscow University camera data (50 cameras) with 3D positioning
- High School camera data (34 cameras) with 3D positioning
- Position generation functions that calculate x, y, z, angle based on camera name

### 3. `run_commands.txt`

Updated with clear instructions for:
- Starting the 3 servers (mock, backend, frontend)
- Current configuration (mock server active)
- How to switch back to Digifort API if needed

## Switching Back to Digifort API

If you need to connect to the real Digifort API:

### Step 1: Edit `server/routes.ts`

```typescript
// Comment out mock server:
// const MOCK_SERVER_URL = "http://localhost:8089";

// Uncomment Digifort API:
const DIGIFORT_API_URL = process.env.DIGIFORT_API_URL || "http://192.168.100.164:8601";
```

### Step 2: Uncomment Digifort API Code

In `proxyRequest()` function, uncomment the Digifort API code block and comment out the mock server code.

### Step 3: Set Environment Variables

```powershell
$env:DIGIFORT_USERNAME="your_username"
$env:DIGIFORT_PASSWORD="your_password"
$env:DIGIFORT_AUTH_METHOD="basic"
$env:DIGIFORT_API_URL="http://192.168.100.164:8601"
```

### Step 4: Start Backend

```powershell
cd server
npx tsx index.ts
```

## Benefits of Mock Server

✅ **No External Dependencies**: Works offline, no need for VPN or network access  
✅ **Fast Development**: Instant responses, no network latency  
✅ **Consistent Data**: Same data every time, predictable for testing  
✅ **Full Control**: Easy to modify camera positions and test scenarios  
✅ **Safe Testing**: No risk of affecting real security systems  
✅ **3D Visualization**: All cameras include positioning data for 3D scenes  

## Moscow University 3D Cameras

The Moscow University page uses 50 cameras strategically placed:

- **Main Entrance**: 3 cameras covering front entrance
- **Central Tower**: 6 cameras at base, mid, and top levels
- **West Wing**: 5 cameras in corridors and roof
- **East Wing**: 5 cameras in corridors and roof
- **Academic Buildings**: Library, auditorium cameras
- **Student Areas**: Cafeteria, student center, recreation
- **Laboratories**: Lab buildings A & B with corridor
- **Administrative**: Admin offices and rector's office
- **Perimeter & Security**: 4 gate cameras (N/S/E/W)
- **Parking**: 4 parking lot cameras
- **Gardens & Plaza**: Central plaza and side gardens
- **Emergency**: 4 emergency exit cameras

Each camera is placed at realistic positions relative to the 3D model, with proper heights (y-axis) and viewing angles.

## Troubleshooting

### Mock Server Won't Start

**Error**: `ModuleNotFoundError: No module named 'flask'`

**Solution**: Install Flask
```powershell
pip install flask flask-cors
```

### Backend Can't Connect to Mock Server

**Error**: `ECONNREFUSED 127.0.0.1:8089`

**Solution**: Make sure the mock server is running first
```powershell
python mock_server/app.py
```

### No Cameras Appearing

**Check**:
1. Mock server is running (Terminal 1)
2. Backend is running (Terminal 2)
3. Frontend is running (Terminal 3)
4. Browser console for errors (F12)
5. Backend logs for API requests

### Camera Positions Look Wrong

The camera positions are calculated in `mock_server/app.py`:
- `generate_moscow_university_position()` - Line 133
- `generate_high_school_position()` - Line 24

You can adjust the x, y, z, angle values to fine-tune positions.

## File Structure

```
Security-Dashboard/
├── mock_server/
│   └── app.py                    # Mock server with camera data
├── server/
│   ├── routes.ts                 # Backend API routes (now uses mock server)
│   └── auth.ts                   # Digifort auth (not used with mock server)
├── client/src/pages/
│   ├── moscow-university.tsx     # 3D visualization of MSU
│   ├── high-school.tsx           # 3D visualization of high school
│   └── shopping-mall.tsx         # 2D floor plan of mall
├── run_commands.txt              # Updated startup commands
└── MOCK_SERVER_SETUP.md         # This file
```

## Next Steps

1. ✅ Start all 3 servers (mock, backend, frontend)
2. ✅ Navigate to Moscow University page
3. ✅ Click cameras to see "live" footage
4. ✅ Switch between 3D and Interior views
5. ✅ Toggle layers (cameras, access control, sensors, occupancy)
6. ✅ Try other pages (High School, Shopping Mall)
7. ✅ Explore Events, Analytics, Bookmarks, and Audit pages

Enjoy exploring the Security Dashboard with realistic 3D camera visualization! 🎥📹

