# Installation Guide (Windows + VS Code)

All commands are for **Windows PowerShell**. You can open a terminal in VS Code with `Ctrl + ~`.

## 1. Install prerequisites

1. **Python 3.11 or newer**: <https://www.python.org/downloads/>. On the first installer screen tick **"Add python.exe to PATH"**.
2. **Node.js 18 or newer (LTS)**: <https://nodejs.org/>.
3. **VS Code**: <https://code.visualstudio.com/> (recommended extensions: Python, ESLint).

Verify in a new PowerShell window:

```powershell
python --version
node --version
npm --version
```

## 2. Get a Gemini API key

1. Open <https://aistudio.google.com/apikey> and sign in.
2. Click **Create API key** and copy it. Keep it private - never post it in chat, GitHub or screenshots.

## 3. Open the project

```powershell
cd C:\path\to\AskAnything-AI
code .
```

## 4. Set up the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks the activate script, run this once and retry:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Install dependencies:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create your `.env` file and add the key:

```powershell
copy .env.example .env
notepad .env
```

In Notepad set `GEMINI_API_KEY=` to your key (no quotes, no spaces), then save.

Start FastAPI:

```powershell
uvicorn app.main:app --reload --port 8000
```

Check <http://127.0.0.1:8000/api/health> - it should show `"gemini_configured": true`. Swagger docs: <http://127.0.0.1:8000/docs>. The SQLite database file `askanything.db` is created automatically in `backend/`.

Leave this terminal running.

## 5. Set up the frontend

Open a **second** terminal (VS Code: Terminal > New Terminal):

```powershell
cd frontend
npm install
npm run dev
```

## 6. Open the app

Go to <http://localhost:5173> in your browser. Try a suggestion card, then open **AI Tools**.

Test on your phone (same Wi-Fi): run `npm run dev -- --host`, then open the "Network" address Vite prints. For the phone to reach the API through the dev proxy nothing else is needed.

## 7. Run the tests (optional)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` not recognised | Reinstall Python with "Add to PATH", or use `py` instead of `python` |
| "Configuration error" in the chat | `GEMINI_API_KEY` is empty in `backend/.env`; fix it and restart uvicorn |
| "API key was rejected" | Key is wrong/revoked; create a new one |
| "model not found" | Change `GEMINI_MODEL` in `.env` to a current model name |
| Rate-limit message | Free-tier quota reached; wait a minute and retry |
| Frontend shows "Could not reach the server" | Backend is not running on port 8000 |
| Port 8000 busy | Use `--port 8001` and change the proxy target in `frontend/vite.config.js` |
