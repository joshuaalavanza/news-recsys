# News Recommender — Basic (React + NewsAPI + Express)

**Ultra-minimal** starter with a React front end (Vite) and a Node/Express proxy to NewsAPI.
- Plain CSS (no Tailwind)
- Single endpoint: `/api/top-headlines`
- Client calls the proxy so your NewsAPI key stays server-side

## Prereqs
- Node 18+ (macOS: `brew install node`)
- A NewsAPI key: https://newsapi.org/

## Quickstart
```bash
# 1) Install server deps and set your API key
cd server
cp .env.example .env
# edit .env and put your key
npm install

# 2) Run the server
npm run dev

# 3) In a new terminal, install and run the client
cd ../client
npm install
npm run dev
```
- Server runs on http://127.0.0.1:5001
- Client runs on http://127.0.0.1:5173 (Vite). It calls the server at `/api/...`

## Deploying
- Push to GitHub (create a new repo first).
- For a quick demo deploy:
  - Render/Fly/Heroku for the server (set `NEWS_API_KEY` env var).
  - Netlify/Vercel for the client (set `VITE_API_BASE` to your deployed server URL).
