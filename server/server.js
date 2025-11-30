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

// Simple in-memory store (swap to file/DB later)
const STORE = { likes: [] };

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/everything", async (req, res) => {
  if (!NEWS_API_KEY) return res.status(500).json({ error: "NEWS_API_KEY not set" });
  const { q = "", pageSize = 20 } = req.query;
  const url = new URL("https://newsapi.org/v2/everything");
  if (q) url.searchParams.set("q", q);
  //if (country) url.searchParams.set("country", country);
  url.searchParams.set("pageSize", pageSize);
  const resp = await fetch(url.toString(), { headers: { "X-Api-Key": NEWS_API_KEY } });
  const data = await resp.json();
  res.json(data);
});


// ---- Remove Liked article ----
app.post("/api/unlike", (req, res) => {
  const art = req.body; // expects article with url
  if (!art || !art.url) return res.status(400).json({ error: "missing article" });
  STORE.likes = STORE.likes.filter(a => a.url !== art.url);
  res.json({ ok: true, count: STORE.likes.length });
});

// ---- Likes API ----
app.post("/api/like", (req, res) => {
  const art = req.body; // expects full article object from client
  if (!art || !art.url) return res.status(400).json({ error: "missing article" });
  if (!STORE.likes.find(a => a.url === art.url)) STORE.likes.push(art);
  res.json({ ok: true, count: STORE.likes.length });
});

app.get("/api/likes", (req, res) => res.json({ likes: STORE.likes }));

// ---- Recommend: re-rank fresh headlines by user profile ----
app.get("/api/recommend", async (req, res) => {
  if (!NEWS_API_KEY) return res.status(500).json({ error: "NEWS_API_KEY not set" });
  const { q = "", country = "us", pageSize = 100 } = req.query;

  const url = new URL("https://newsapi.org/v2/everything");
  if (q) url.searchParams.set("q", q);
  //if (country) url.searchParams.set("country", country);
  url.searchParams.set("pageSize", pageSize);
  const resp = await fetch(url.toString(), { headers: { "X-Api-Key": NEWS_API_KEY } });
  const data = await resp.json();

  const profile = buildProfile(STORE.likes);
  const scored = (data.articles || []).map(a => ({ ...a, __score: scoreArticle(profile, a) }));

  // Simple recency bonus (optional): newer articles get a small boost
  for (const a of scored) {
    const t = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const recentBoost = t ? (t / (1000 * 3600 * 24 * 30)) * 0.01 : 0; // tiny bonus
    a.__score += recentBoost;
  }

  scored.sort((x, y) => y.__score - x.__score);
  res.json({ articles: scored });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
});

