# Build Configuration

## Build Structure

```
/
├── dist/                    # Build output directory (generated)
│   ├── public/             # Client build (React/Vite)
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   └── index.cjs           # Server build (Express/Node)
│
├── client/                 # Client source code
│   ├── src/
│   └── index.html
│
├── server/                 # Server source code
│   └── index.ts
│
└── script/
    └── build.ts            # Build script
```

## Build Commands

### Install Dependencies
```bash
npm install
```

### Build Project
```bash
npm run build
```

This command:
1. Cleans the `dist/` directory
2. Builds the client (React/Vite) → `dist/public/`
3. Builds the server (Express/Node) → `dist/index.cjs`

### Start Production Server
```bash
npm run start
```

Requires `SERVE_CLIENT=true` environment variable to serve static files:
```bash
SERVE_CLIENT=true npm run start
```

## Build Output

### Client Build (`dist/public/`)
- Built with Vite
- Contains optimized React application
- Static assets (JS, CSS, images)
- Entry point: `index.html`

### Server Build (`dist/index.cjs`)
- Built with esbuild
- Bundled Express server
- CommonJS format
- Entry point: `dist/index.cjs`

## Development vs Production

### Development
- Uses Vite dev server for client (HMR enabled)
- Server runs with `tsx` (TypeScript directly)
- Command: `npm run dev:server`

### Production
- Client: Pre-built static files in `dist/public/`
- Server: Bundled `dist/index.cjs`
- Command: `npm run start` (with `SERVE_CLIENT=true`)

## Environment Variables

### Required for Production
- `SERVE_CLIENT=true` - Serve static client files from `dist/public/`
- `NODE_ENV=production` - Production mode

### Optional
- `PORT=5000` - Server port (default: 5000, Render sets this automatically)
- `HOST=0.0.0.0` - Server host (default: 0.0.0.0)
- `CLIENT_ORIGIN` - CORS allowed origins (comma-separated)

### Mock Server (Development)
- `MOCK_SERVER_URL=http://localhost:8089` - Mock server URL

### Digifort API (Production - if using)
- `DIGIFORT_API_URL` - Digifort API base URL
- `DIGIFORT_USERNAME` - Digifort username
- `DIGIFORT_PASSWORD` - Digifort password
- `DIGIFORT_AUTH_METHOD` - "basic" or "safe" (default: "basic")

## Render Deployment

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete Render configuration guide.

**Quick Setup:**
- **Build Command:** `npm install && npm run build`
- **Start Command:** `SERVE_CLIENT=true node dist/index.cjs`
- **Required Env:** `SERVE_CLIENT=true`, `NODE_ENV=production`

