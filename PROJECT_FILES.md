# Project Files

Every file in the project and its purpose.

| File | Purpose |
|---|---|
| `.gitignore` | Excludes secrets (.env), databases, node_modules, build output |
| `README.md` | Project introduction, features, stack, structure, install/run instructions |
| `backend/.env.example` | Template for backend environment variables (no real keys) |
| `backend/app/__init__.py` | Package marker |
| `backend/app/config.py` | Settings loaded from environment / .env; DATABASE_URL normalisation |
| `backend/app/database.py` | SQLAlchemy engine, session, Base, init_db |
| `backend/app/errors.py` | AppError type used for consistent JSON errors |
| `backend/app/main.py` | FastAPI app: CORS, body-size limit, error handlers, startup table creation |
| `backend/app/models/__init__.py` | Exports models |
| `backend/app/models/chat.py` | Conversation and Message SQLAlchemy models |
| `backend/app/routes/__init__.py` | Combines routers under /api |
| `backend/app/routes/chat.py` | POST /api/chat (send, context, regenerate) |
| `backend/app/routes/conversations.py` | List / get / rename / delete conversations |
| `backend/app/routes/health.py` | GET /api/health |
| `backend/app/schemas/__init__.py` | Exports schemas |
| `backend/app/schemas/chat.py` | Pydantic request/response schemas and validation |
| `backend/app/services/__init__.py` | Package marker |
| `backend/app/services/gemini_service.py` | Gemini integration via google-genai, error mapping, timeouts |
| `backend/app/services/prompts.py` | System instructions for chat and the 6 AI tools |
| `backend/requirements.txt` | Python dependencies |
| `backend/tests/__init__.py` | Package marker |
| `backend/tests/test_api.py` | pytest suite (Gemini mocked): chat, context, regenerate, CRUD, validation, errors |
| `docs/API_DOCUMENTATION.md` | All endpoints with request/response examples and error codes |
| `docs/DEPLOYMENT_GUIDE.md` | Free-tier deployment: GitHub, Supabase, Render, Vercel |
| `docs/INSTALLATION_GUIDE.md` | Windows + VS Code step-by-step setup with PowerShell commands |
| `docs/PROJECT_OVERVIEW.md` | Architecture, design decisions, data model, limitations |
| `frontend/.env.example` | Template for VITE_API_URL |
| `frontend/index.html` | HTML entry point |
| `frontend/package-lock.json` | Locked dependency versions |
| `frontend/package.json` | Frontend dependencies and scripts |
| `frontend/public/favicon.svg` | App icon |
| `frontend/src/App.jsx` | App shell: layout, navigation, mobile sidebar state |
| `frontend/src/components/ChatInput.jsx` | Auto-expanding input, Enter/Shift+Enter, send/stop button |
| `frontend/src/components/Markdown.jsx` | Markdown + syntax-highlighted code blocks with copy |
| `frontend/src/components/MessageBubble.jsx` | User/AI messages, copy, regenerate, timestamps, thinking indicator |
| `frontend/src/components/Sidebar.jsx` | Logo, New Chat, history (rename/delete), AI Tools, Settings, profile |
| `frontend/src/components/Welcome.jsx` | Welcome screen and 6 suggestion cards |
| `frontend/src/hooks/useChat.js` | Chat state: conversations, send, retry, regenerate, stop, rename, delete |
| `frontend/src/hooks/useSettings.js` | Profile name and theme (localStorage) |
| `frontend/src/main.jsx` | React entry point |
| `frontend/src/pages/ChatPage.jsx` | Main chat view with error banner and retry |
| `frontend/src/pages/SettingsPage.jsx` | Profile, theme, server status, delete all chats |
| `frontend/src/pages/ToolsPage.jsx` | AI Tools grid and per-tool workspaces |
| `frontend/src/services/api.js` | Backend API client with timeout/network error handling |
| `frontend/src/services/format.js` | Timestamp formatting and clipboard helper |
| `frontend/src/services/tools.js` | Definitions and prompt builders for the 6 AI tools |
| `frontend/src/styles/global.css` | All styles: themes, responsive layout, animations |
| `frontend/vercel.json` | SPA rewrite rule for Vercel |
| `frontend/vite.config.js` | Vite config with dev proxy /api -> backend |
