import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Very simple proxy: GET /api/top-headlines?q=ai&country=us&pageSize=20
app.get("/api/top-headlines", async (req, res) => {
  if (!NEWS_API_KEY) {
    return res.status(500).json({ error: "NEWS_API_KEY not set on server" });
  }
  const { q = "", country = "us", pageSize = 20 } = req.query;
  const url = new URL("https://newsapi.org/v2/top-headlines");
  if (q) url.searchParams.set("q", q);
  if (country) url.searchParams.set("country", country);
  url.searchParams.set("pageSize", pageSize);
  const resp = await fetch(url.toString(), {
    headers: { "X-Api-Key": NEWS_API_KEY }
  });
  const data = await resp.json();
  res.json(data);
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
});
