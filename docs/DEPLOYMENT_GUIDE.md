# Deployment Guide (free tier: GitHub + Supabase + Render + Vercel)

Order: GitHub -> Supabase (database) -> Render (backend) -> Vercel (frontend) -> update CORS.

## 1. Push to GitHub

```bash
cd AskAnything-AI
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USER/AskAnything-AI.git
git push -u origin main
```

`.gitignore` already excludes `.env`. Check that no key is committed (`git status` must not list `.env`).

## 2. Database: Supabase PostgreSQL

1. Create a project at <https://supabase.com>; choose a strong database password and save it.
2. Open **Project Settings > Database > Connection string** and copy the **Session pooler** URI (port 5432, host like `aws-0-xx.pooler.supabase.com`). Render's free tier may not support IPv6, which the direct connection host requires, so the pooler URI is the safer choice.
3. Replace `[YOUR-PASSWORD]` with your password. If it contains special characters, URL-encode them.
4. This is your `DATABASE_URL`. Tables are created automatically on first backend start.

## 3. Backend: Render

1. At <https://render.com> choose **New > Web Service** and connect the GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance type:** Free
3. Environment variables:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | your Gemini key |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `DATABASE_URL` | the Supabase URI from step 2 |
| `CORS_ORIGINS` | your Vercel URL (add after step 4), e.g. `https://askanything-ai.vercel.app` |
| `PYTHON_VERSION` | `3.11.9` (or any 3.11+) |

4. Deploy. Test `https://YOUR-SERVICE.onrender.com/api/health`.

## 4. Frontend: Vercel

1. At <https://vercel.com> choose **Add New > Project** and import the repo.
2. Settings: **Root Directory** `frontend`, Framework **Vite** (build `npm run build`, output `dist`).
3. Environment variable: `VITE_API_URL` = `https://YOUR-SERVICE.onrender.com` (no trailing slash).
4. Deploy, copy the Vercel URL.

## 5. Finish CORS

Back in Render, set `CORS_ORIGINS` to the exact Vercel URL (no trailing slash; comma-separate multiple origins, e.g. a custom domain) and redeploy. Because `VITE_API_URL` is baked in at build time, redeploy Vercel whenever you change it.

## Free-tier limitations

- **Render free web services sleep after ~15 minutes of inactivity.** The first request after that can take 30-60 seconds (cold start). The app shows a friendly timeout message; just retry. A paid instance or an external uptime pinger avoids this.
- **Supabase free projects pause after about a week of inactivity** and must be resumed from the dashboard. Database size is limited.
- **Gemini free tier** has per-minute and per-day request limits that change over time; heavy use returns the "too many requests" message.
- Free tiers change - check each provider's current limits.

## Security checklist

- Never commit `.env` or paste your key in public places. If a key leaks, delete it in Google AI Studio and create a new one.
- Set `CORS_ORIGINS` to your real frontend URL only.
- The app has no login: anyone who knows your URL shares the same history. Add authentication before wide public use.
