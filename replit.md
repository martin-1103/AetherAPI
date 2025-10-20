# API Manager Desktop Application

## Overview
A desktop-first API management application similar to Postman, built with Electron + React frontend and Node.js + PostgreSQL backend. Features real-time collaboration via WebSocket and AI-ready documentation through MCP Server integration.

## Project Status
**Created:** October 20, 2025
**Current State:** ✅ Fully Implemented and Operational
**Last Updated:** October 20, 2025

## Architecture

### Technology Stack
- **Frontend:** React 18 + Vite
- **Desktop:** Electron 28
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Replit managed)
- **Real-time:** WebSocket (ws library)
- **Authentication:** JWT + bcrypt

### Project Structure
```
/
├── backend/          # Express API server + WebSocket
├── frontend/         # React + Vite application
├── electron/         # Electron main process
└── package.json      # Root package for orchestration
```

## Core Features
1. **Authentication & RBAC:** Project-based tokens with Owner/Admin/Editor/Viewer roles
2. **API Management:** CRUD operations for endpoints, environments, HTTP request execution
3. **Real-time Collaboration:** WebSocket rooms with user presence and live editing
4. **MCP Server Integration:** AI-ready API documentation with standardized format

## Design System
- **Primary Color:** #FF6C37 (Postman orange)
- **Secondary:** #2E3440 (dark slate)
- **Background:** #1E1E1E (VS Code dark)
- **Text:** #D4D4D4 (light grey)
- **Accent:** #007ACC (VS Code blue)
- **Success:** #4CAF50 (green)
- **Fonts:** Inter (UI), JetBrains Mono (code)
- **Layout:** Three-panel (sidebar, workspace, response panel)

## Development
- Port 5000: Frontend (Vite dev server)
- Port 3000: Backend API
- Port 3001: WebSocket server

## Features Implemented
- ✅ Complete authentication system with JWT and bcrypt
- ✅ Role-based access control (Owner/Admin/Editor/Viewer)
- ✅ Project and endpoint management with full CRUD operations
- ✅ Environment variables with substitution in API requests
- ✅ HTTP request execution with response timing
- ✅ Real-time collaboration via WebSocket (rooms, presence, live updates)
- ✅ MCP Server for AI-ready documentation with OpenAPI export
- ✅ Three-panel responsive UI (sidebar, workspace, response panel)
- ✅ Dark theme with Postman orange accent (#FF6C37)
- ✅ Desktop wrapper with Electron

## How to Use

### Development Mode
The application is currently running in development mode:
- **Frontend**: http://localhost:5000 (Vite dev server)
- **Backend API**: http://localhost:3000
- **WebSocket**: ws://localhost:3000/ws

### Running MCP Server
For AI tool integration:
```bash
cd backend
npm run mcp
```

### First-Time Setup
1. Open the application at http://localhost:5000
2. Click "Register" and create an account
3. Create your first project
4. Add API endpoints to your project
5. Execute requests and see real-time collaboration

### Database
The PostgreSQL database is fully configured with:
- Schema available in `backend/schema.sql`
- Automatic migrations applied
- Full indexing for performance

## API Documentation
Complete API documentation available in `backend/API_DOCUMENTATION.md`

## Recent Changes
- 2025-10-20: Complete implementation of all core features
- 2025-10-20: Added MCP Server integration
- 2025-10-20: Applied complete visual styling
- 2025-10-20: Project initialization and dependencies setup
