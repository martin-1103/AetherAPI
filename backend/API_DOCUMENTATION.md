# API Manager Backend API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get current user info (protected)

### Projects
- `GET /projects` - List all user's projects (protected)
- `POST /projects` - Create a new project (protected)
- `GET /projects/:projectId` - Get project details (protected, requires Viewer+ role)
- `PUT /projects/:projectId` - Update project (protected, requires Admin+ role)
- `DELETE /projects/:projectId` - Delete project (protected, requires Owner role)

### Project Members
- `GET /projects/:projectId/members` - List project members (protected, requires Viewer+ role)
- `POST /projects/:projectId/members` - Add member to project (protected, requires Admin+ role)

### Endpoints (API Requests)
- `GET /projects/:projectId/endpoints` - List all endpoints in project (protected, requires Viewer+ role)
- `POST /projects/:projectId/endpoints` - Create new endpoint (protected, requires Editor+ role)
- `PUT /endpoints/:endpointId` - Update endpoint (protected)
- `DELETE /endpoints/:endpointId` - Delete endpoint (protected)
- **`POST /endpoints/:endpointId/execute`** - **Execute HTTP request with environment substitution** (protected)

### Environments
- `GET /projects/:projectId/environments` - List all environments (protected, requires Viewer+ role)
- `POST /projects/:projectId/environments` - Create environment (protected, requires Editor+ role)
- `PUT /environments/:environmentId` - Update environment (protected)
- `DELETE /environments/:environmentId` - Delete environment (protected)

## Request Execution Feature

### POST /endpoints/:endpointId/execute
**This is the core API execution feature that enables live HTTP requests with environment variable substitution.**

#### Request Body
```json
{
  "environment": "environment-uuid" // optional
}
```

#### Process
1. Retrieves the endpoint configuration from database
2. If environment ID provided, fetches environment variables
3. Substitutes `{{variable}}` placeholders in URL with environment values
4. Executes the HTTP request using axios with:
   - Method from endpoint (GET, POST, PUT, DELETE, PATCH)
   - URL with substituted variables
   - Headers from endpoint configuration
   - Body from endpoint configuration
5. Returns response with timing information

#### Response
```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {...},
  "data": {...},
  "duration": 245
}
```

#### Error Response
```json
{
  "status": 0,
  "statusText": "Request Failed",
  "error": "Error message",
  "duration": 150
}
```

## WebSocket Server

### Connection
`ws://localhost:3000/ws`

### Message Types
- `auth` - Authenticate WebSocket connection
- `join-room` - Join collaboration room for project/endpoint
- `leave-room` - Leave collaboration room
- `endpoint-update` - Broadcast endpoint changes
- `cursor-move` - Share cursor position
- `presence-update` - Update user presence status

## MCP Server

### Running
```bash
cd backend
npm run mcp
```

### Available Tools
- `list_projects` - List all API projects
- `get_project_endpoints` - Get endpoints for a project
- `get_endpoint_details` - Get detailed endpoint information
- `export_openapi` - Export project as OpenAPI 3.0 specification

## Database Schema
See `schema.sql` for complete database structure including:
- users
- projects
- project_members
- endpoints
- environments
- collaboration_sessions
