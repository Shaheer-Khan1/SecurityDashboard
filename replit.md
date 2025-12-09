# Security Dashboard

## Overview
A comprehensive security monitoring dashboard built with React, Node.js, and a Python mock server that simulates the Digifort VMS API. This application provides real-time camera monitoring, analytics visualization, audit logging, and bookmark management.

## Current State
- **MVP Complete**: Full security dashboard with all core features implemented
- **Mock Server**: Python Flask server simulates Digifort API responses for development
- **Frontend**: React with Tailwind CSS, Shadcn UI components, Recharts for data visualization

## Recent Changes
- December 2024: Initial implementation with all core features
  - Dashboard with stats, system status, and event monitoring
  - Camera management with grid view and controls
  - Analytics with counters, configurations, and charts
  - Security events with filtering and search
  - Audit log viewer with category filtering
  - Bookmark management with add/delete functionality
  - Settings page with server configuration
  - Dark/light theme support

## Project Architecture

### Frontend (client/)
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Shadcn UI (Radix primitives)
- **Styling**: Tailwind CSS with dark mode support
- **Charts**: Recharts

### Backend (server/)
- **Framework**: Express.js
- **API Layer**: Proxies requests to Digifort API (or mock server)
- **Port**: 5000 (frontend served via Vite)

### Mock Server (mock_server/)
- **Framework**: Python Flask with CORS
- **Port**: 8089
- **Purpose**: Simulates Digifort VMS API for development/testing

### Key Files
- `shared/schema.ts`: All TypeScript types and Zod schemas
- `client/src/App.tsx`: Main app with sidebar and routing
- `client/src/components/`: Reusable UI components
- `client/src/pages/`: Page components for each route
- `server/routes.ts`: API routes that proxy to mock server
- `mock_server/app.py`: Python Flask mock API server

## User Preferences
- Dark mode as default theme
- Security-focused design with clear status indicators
- Information-dense layouts for monitoring efficiency

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/system/status` - System health status

### Cameras
- `GET /api/cameras` - List all cameras
- `GET /api/cameras/groups` - Camera groups
- `POST /api/cameras/:name/activation` - Activate/deactivate camera

### Analytics
- `GET /api/analytics/configurations` - Analytics configs
- `GET /api/analytics/counters` - Counter values
- `POST /api/analytics/counters/:id/reset` - Reset counter
- `GET /api/analytics/events` - Search events
- `GET /api/analytics/chart` - Chart data

### Audit
- `GET /api/audit/logs` - Search audit logs

### Bookmarks
- `GET /api/bookmarks` - List bookmarks
- `POST /api/bookmarks` - Create bookmark
- `DELETE /api/bookmarks/:id` - Delete bookmark

## Running the Application
1. Start the mock server: `python mock_server/app.py`
2. Start the application: `npm run dev`
3. Access at: http://localhost:5000
