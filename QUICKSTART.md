# Digifort Dashboard — Quick Start (Python Mock Backend)

Use this guide after cloning the repo to run the full dashboard with **rich demo data** (100 cameras, 100 alarms, regional analytics, IO devices, etc.) from the Python mock Digifort API.

## What you are running

```
Browser  →  Node app (API + UI) :5000  →  Python mock API :8089
```

| Service | Port | Role |
|--------|------|------|
| **Python mock** | `8089` | Fake Digifort API with all demo data |
| **Node backend** | `5000` | Proxies `/api/*` to Python; serves React UI in dev |

Open the app at **http://127.0.0.1:5000** (not 5173 — frontend is bundled into the Node dev server).

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.10+ with `pip`

Check versions:

```powershell
node -v
npm -v
python --version
```

---

## 1. Clone and install (once)

```powershell
git clone <your-repo-url>
cd Security-Dashboard

npm install
```

Install Python dependencies for the mock server:

```powershell
pip install -r mock_server/requirements.txt
```

---

## 2. Start the Python mock API (Terminal 1)

```powershell
cd mock_server
python digifort_dummy_server.py --port 8089
```

**Important:** always pass `--port 8089`. If your shell has `PORT=5000` set, Python may bind to the wrong port and the Node app will fail to connect.

You should see output like:

```
Cameras:      100
Alerts:       100  (… active, … closed)
Regions:      5
Sites:        20
IO Devices:   5
Starting Digifort dummy server on http://0.0.0.0:8089
```

Leave this terminal running.

---

## 3. Start the Node app (Terminal 2)

From the **project root** (not `mock_server`):

```powershell
cd C:\path\to\Security-Dashboard

$env:HOST="127.0.0.1"
$env:PORT="5000"
$env:DIGIFORT_API_URL="http://127.0.0.1:8089"
$env:DIGIFORT_USERNAME="admin"
$env:DIGIFORT_PASSWORD=""

npx tsx server/index.ts
```

Wait for:

```
serving client via Vite dev server
serving on 127.0.0.1:5000
```

---

## 4. Open the dashboard

**http://127.0.0.1:5000**

You should see:

- **Dashboard** — stats, device map, alarm analytics, camera grid  
- **Analytics → Alarms** — regional pie charts with drill-down  
- **Cameras** — 100 mock cameras  
- **Moscow University** — 3D model with cameras + IoT markers  

---

## Mock data included

The Python server (`mock_server/digifort_dummy_server.py`) provides:

| Data | Count / detail |
|------|----------------|
| Cameras | 100 (5 regions × 20 sites, SAIB-style naming) |
| Alarms / alerts | 100 with active/closed status, region & site |
| Regions | Central, Eastern, Western, Southern, Northern |
| IO devices | 5 |
| Analytics, server info, LPR, RTSP, events | Full demo payloads |

Export all JSON to a file (optional):

```powershell
cd mock_server
python digifort_dummy_server.py --export ../dummy_data.json
```

---

## macOS / Linux (Terminal 2 env vars)

```bash
export HOST=127.0.0.1
export PORT=5000
export DIGIFORT_API_URL=http://127.0.0.1:8089
export DIGIFORT_USERNAME=admin
export DIGIFORT_PASSWORD=

npx tsx server/index.ts
```

Terminal 1 is the same:

```bash
cd mock_server
python digifort_dummy_server.py --port 8089
```

---

## Troubleshooting

### Empty dashboard / “Upstream API unavailable”

- Python mock is not running, or it started on the **wrong port** (often 5000 if `PORT` env is set).
- Fix: stop both processes, restart Python with `--port 8089`, then restart Node.

### Port already in use

**Windows — free ports 8089 and 5000:**

```powershell
Get-NetTCPConnection -LocalPort 8089,5000 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
```

Then start Terminal 1 and Terminal 2 again.

### UI loads but no data after hard refresh

- Use **http://127.0.0.1:5000** (same host for UI and API).
- Hard refresh: **Ctrl+Shift+R**.

### Verify API manually

```powershell
(Invoke-RestMethod http://127.0.0.1:5000/api/dashboard/stats).totalCameras
```

Expected: `100`

```powershell
(Invoke-RestMethod http://127.0.0.1:8089/Interface/Cameras/GetCameras?ResponseFormat=JSON).Response.Data.Cameras.Count
```

(Python mock should return camera list directly.)

---

## Do not use for production

The Python server is a **development mock only**. For a real Digifort system, point `DIGIFORT_API_URL` at your Digifort API (typically port **8601** for local API, not 80). See `run_commands.txt` for other backend profiles.

---

## One-page cheat sheet

```powershell
# Terminal 1
cd mock_server
python digifort_dummy_server.py --port 8089

# Terminal 2 (project root)
$env:HOST="127.0.0.1"; $env:PORT="5000"
$env:DIGIFORT_API_URL="http://127.0.0.1:8089"
$env:DIGIFORT_USERNAME="admin"; $env:DIGIFORT_PASSWORD=""
npx tsx server/index.ts

# Browser
# http://127.0.0.1:5000
```
