// client/src/App.jsx
import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function ArticleCard({ a, onLike, isLiked = false }) {
  return (
    <li className="card">
      {a.urlToImage && <img src={a.urlToImage} alt="" />}
      <div className="meta">
        <h3><a href={a.url} target="_blank" rel="noreferrer">{a.title}</a></h3>
        <p>{a.description || a.content || ""}</p>
        <small>{a.source?.name} · {new Date(a.publishedAt).toLocaleString()}</small>
        <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
          <button className={`like-button ${isLiked ? "liked" : ""}`} onClick={() => onLike(a)}>★ Like</button>
        </div>
      </div>
    </li>
  );
}

export default function App() {
  const [q, setQ] = useState("ai");
  const [tab, setTab] = useState("search"); // "search" | "recommend" | "likes"
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [likes, setLikes] = useState([]);
  const [error, setError] = useState("");

  function isArticleLiked(article) {
    return likes.some(like => like.url === article.url);
  }

  async function fetchSearch(query) {
    setLoading(true); setError("");
    try {
      const url = `${API_BASE}/api/everything?q=${encodeURIComponent(query)}&country=us&pageSize=20`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === "error") throw new Error(data.message || "NewsAPI error");
      setArticles(data.articles || []);
    } catch (e) { setError(String(e)); setArticles([]); }
    finally { setLoading(false); }
  }

  async function fetchLikes() {
    const resp = await fetch(`${API_BASE}/api/likes`);
    const data = await resp.json();
    setLikes(data.likes || []);
  }

  async function fetchRecs() {
    setLoading(true); setError("");
    try {
      const resp = await fetch(`${API_BASE}/api/recommend?q=${encodeURIComponent(q)}&country=us&pageSize=40`);
      const data = await resp.json();
      setArticles((data.articles || []).slice(0, 20));
    } catch (e) { setError(String(e)); setArticles([]); }
    finally { setLoading(false); }
  }

  async function toggleLike(a) {
  const alreadyLiked = likes.some(like => like.url === a.url);

  const endpoint = alreadyLiked ? "/api/unlike" : "/api/like";
  const body = alreadyLiked ? { url: a.url } : a;

  await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  setLikes(prev =>
    alreadyLiked
      ? prev.filter(like => like.url !== a.url)
      : [...prev, a]
  );
}


  useEffect(() => {
    fetchSearch(q);
    fetchLikes();
  }, []);

  useEffect(() => {
    if (tab === "search") fetchSearch(q);
    if (tab === "recommend") fetchRecs();
    if (tab === "likes") fetchLikes();
  }, [tab]);

  return (
    <div className="container">
      <h1>News Recommender — MVP</h1>

      <div className="controls">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search topic..." />
        <button onClick={() => fetchSearch(q)}>Search</button>
        <button onClick={() => setTab("search")} disabled={tab==="search"}>Search</button>
        <button onClick={() => setTab("recommend")} disabled={tab==="recommend"}>Recommendations</button>
        <button onClick={() => setTab("likes")} disabled={tab==="likes"}>Likes</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      {tab === "likes" ? (
        <ul className="grid">
          {likes.map((a, i) => <ArticleCard key={i} a={a} onLike={toggleLike} isLiked={true}/>)}
        </ul>
      ) : (
        <ul className="grid">
          {articles.map((a, i) => <ArticleCard key={i} a={a} onLike={toggleLike} isLiked={isArticleLiked(a)}/>)}
        </ul>
      )}
    </div>
  );
}