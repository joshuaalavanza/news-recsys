import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function App() {
  const [q, setQ] = useState("ai");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");

  async function fetchNews(query) {
    try {
      setLoading(true);
      setError("");
      const url = `${API_BASE}/api/top-headlines?q=${encodeURIComponent(query)}&country=us&pageSize=20`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === "error") {
        setError(data.message || "Error from NewsAPI");
        setArticles([]);
      } else {
        setArticles(data.articles || []);
      }
    } catch (e) {
      setError(String(e));
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNews(q); }, []);

  return (
    <div className="container">
      <h1>News Recommender — Basic</h1>
      <div className="controls">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topic..."
        />
        <button onClick={() => fetchNews(q)}>Search</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      <ul className="grid">
        {articles.map((a, i) => (
          <li key={i} className="card">
            {a.urlToImage && <img src={a.urlToImage} alt="" />}
            <div className="meta">
              <h3><a href={a.url} target="_blank" rel="noreferrer">{a.title}</a></h3>
              <p>{a.description || a.content || ""}</p>
              <small>{a.source?.name} · {new Date(a.publishedAt).toLocaleString()}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
