# MEZOMAI

MEZOMAI is a full-stack AI Character Platform with a premium **Obsidian Cosmic Cybernetic** dark theme, real-time chat, a code IDE, meeting support, analytics, and a multi-service backend built with React, Laravel, FastAPI, MySQL, Redis, and Docker.

## Platform Overhaul

We successfully completed all core components of the MEZOMAI AI Character Platform and overhauled the UI into an ultra-premium sci-fi experience. The new interface feels more like a cybernetic command center than a standard application, with deep contrast, layered lighting, and animated motion throughout the layout.

## Visual Theme

The main theme was implemented in `src/index.css` as a custom cybernetic design system. It includes:
- Cosmic space nebula background.
- Neon grid overlay.
- Corner accent highlights on panels.
- Holographic gold action buttons.

These effects create a tactical HUD-style interface with a premium gold, cyan, purple, and black palette.

## Project Structure

The codebase is fully populated across the frontend, PHP backend, Python backend, database, cache, and Docker services.

- **Frontend:** Vite + React
- **PHP Backend:** REST APIs, auth, sessions, meetings, analytics, settings
- **Python Backend:** AI streaming, WebSockets, code execution
- **Database:** MySQL
- **Cache:** Redis
- **DevOps:** Docker + Compose

## Frontend Modules

The React frontend contains the main product pages and reusable UI components.

### Pages
- Dashboard
- Chat
- Code IDE
- Meetings
- Analytics
- Login
- Settings

### Shared Components
- Sidebar and layout components
- Avatar components
- Streaming message components
- File tree and editor components
- Terminal output components
- Meeting controls and transcript components
- Analytics charts
- Settings controls

## Backend Modules

### Laravel PHP
Controllers include:
- `AuthController.php`
- `ChatController.php`
- `CodeController.php`
- `MeetingController.php`
- `AnalyticsController.php`
- `SettingsController.php`
- `FileController.php`

### FastAPI Python
Core files include:
- `main.py`
- `requirements.txt`
- `claude_service.py`
- `ai.py`
- `code_run.py`
- `chat_ws.py`
- `meeting_ws.py`

These services handle Claude integration, WebSocket streaming, safe code execution, and meeting note generation.

## Data and Services

### MySQL Tables
- users
- api_keys
- chat_sessions
- messages
- meetings
- transcripts
- meeting_notes
- code_files
- code_versions
- code_runs
- analytics

### Redis Keys
- session:{jwt_token}
- user:{user_id}:settings
- room:{room_id}:users
- room:{room_id}:transcript
- ratelimit:{user_id}:{min}
- ws:{connection_id}

### Docker Services
- frontend
- php
- python
- mysql
- redis
- phpmyadmin

## Key Request Flows

### Chat
User types a message in React → WebSocket sends it to FastAPI → Claude generates a streamed response → PHP saves the message → MySQL updates analytics.

### Meetings
User joins a meeting → PHP creates a room record → Python starts the WebSocket session → transcript lines stream live → notes are generated after the call.

### Code Run
User clicks Run → React sends the request → PHP forwards to Python → sandbox executes the code → output returns to the terminal → execution history is saved.

## Build Status

The frontend build has been verified with Vite using `npm run build`, and the repository cleanup is complete. The project is ready for GitHub presentation with a clear structure, strong visual identity, and a complete multi-service architecture.

## Getting Started

```bash
git clone https://github.com/sarankishor44/MEZOMAI.git
cd MEZOMAI
npm install
npm run build
docker compose up --build
```

## License

This project is maintained by the MEZOMAI author and contributors.