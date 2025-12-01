// server/server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { buildProfile, scoreArticle } from "./recommend.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const NEWS_API_KEY = process.env.NEWS_API_KEY;


//Store users: { [username]: { password, likes: [] } }
const USERS = {};

// Get user object from header
function getUserState(req) {
  const userId = req.header("x-user-id");
  if (!userId || !USERS[userId]) return null;
  return USERS[userId];
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/everything", async (req, res) => {
  if (!NEWS_API_KEY) return res.status(500).json({ error: "NEWS_API_KEY not set" });
  const { q = "", pageSize = 100 } = req.query;
  const url = new URL("https://newsapi.org/v2/everything");
  if (q) url.searchParams.set("q", q);
  //if (country) url.searchParams.set("country", country);
  url.searchParams.set("pageSize", pageSize);
  const resp = await fetch(url.toString(), { headers: { "X-Api-Key": NEWS_API_KEY } });
  const data = await resp.json();
  res.json(data);
});


app.post("/api/register", (req, res) => {
  const {username, password} = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  } else if (USERS[username]) {
    return res.status(400).json({ error: "user already exists" });
  } else{
  USERS[username] = { password, likes: [] };
   return res.json({ ok: true, userId: username });
  }
});
app.post("/api/login", (req, res) => {
  const {username, password} = req.body;
  const user = USERS[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  else return res.json({ ok: true, userId: username });
});


app.post("/api/unlike", (req, res) => {
  const user = getUserState(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const article = req.body;
  if (!article || !article.url) return res.status(400).json({ error: "missing article" });

  user.likes = user.likes.filter(a => a.url !== article.url);
  res.json({ ok: true, count: user.likes.length });
});

// ---- Likes API ----
app.post("/api/like", (req, res) => {
  const user = getUserState(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const article = req.body; // full article
  if (!article || !article.url) return res.status(400).json({ error: "missing article" });

  if (!user.likes.find(a => a.url === article.url)) {
    user.likes.push(article);
  }
  res.json({ ok: true, count: user.likes.length });
});

app.get("/api/likes", (req, res) => {
  const user = getUserState(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  res.json({ likes: user.likes });
});


// ---- Recommend: re-rank fresh headlines by user profile ----
app.get("/api/recommend", async (req, res) => {
  if (!NEWS_API_KEY) return res.status(500).json({ error: "NEWS_API_KEY not set" });

  const { q = "", country = "us", pageSize = 100 } = req.query;

  const url = new URL("https://newsapi.org/v2/top-headlines");
  //if (q) url.searchParams.set("q", q);
  url.searchParams.set("country", country);
  url.searchParams.set("pageSize", pageSize);
  const resp = await fetch(url.toString(), { headers: { "X-Api-Key": NEWS_API_KEY } });
  const data = await resp.json();
  console.log(data);

  const user = getUserState(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const profile = buildProfile(user.likes);
  const scored = (data.articles || []).map(a => ({
    ...a,
    __score: scoreArticle(profile, a),
  }));

  for (const a of scored) {
    const t = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const recentBoost = t ? (t / (1000 * 3600 * 24 * 30)) * 0.01 : 0;
    a.__score += recentBoost;
  }

  scored.sort((x, y) => y.__score - x.__score);
  res.json({ articles: scored });
});


app.listen(PORT, () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
});

