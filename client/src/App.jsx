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
  const [userId, setUserId] = useState(
    () => localStorage.getItem("userId") || ""
  );
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");

    const endpoint = authMode === "login" ? "/api/login" : "/api/register";

    try {
      const resp = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Auth failed");
      }

      localStorage.setItem("userId", data.userId);
      setUserId(data.userId);
    } catch (err) {
      setAuthError(String(err.message || err));
    }
  }

  function handleLogout() {
    localStorage.removeItem("userId");
    setUserId("");
  }

  // If not logged in, show login/register screen
  if (!userId) {
    return (
      <div className="container">
        <h1>News Recommender — Login</h1>
        <div style={{ maxWidth: 400 }}>
          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={() => setAuthMode("login")}
              disabled={authMode === "login"}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode("register")}
              disabled={authMode === "register"}
              style={{ marginLeft: ".5rem" }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: "grid", gap: ".5rem" }}>
            <input
              placeholder="Username"
              value={authUsername}
              onChange={e => setAuthUsername(e.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
            />
            <button type="submit">
              {authMode === "login" ? "Login" : "Register"}
            </button>
          </form>

          {authError && <p className="error" style={{ marginTop: ".5rem" }}>{authError}</p>}
        </div>
      </div>
    );
  }

  // If logged in, render your existing news UI:
  return <NewsApp userId={userId} onLogout={handleLogout} />;
}
function NewsApp({ userId, onLogout }) {
  const [q, setQ] = useState("ai");
  const [tab, setTab] = useState("search");
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
      const url = `${API_BASE}/api/everything?q=${encodeURIComponent(query)}&pageSize=20`;
      const resp = await fetch(url, {
        headers: { "x-user-id": userId },
      });
      const data = await resp.json();
      if (data.status === "error") throw new Error(data.message || "NewsAPI error");
      setArticles(data.articles || []);
    } catch (e) { setError(String(e)); setArticles([]); }
    finally { setLoading(false); }
  }

  async function fetchLikes() {
    try {
      const resp = await fetch(`${API_BASE}/api/likes`, {
        headers: { "x-user-id": userId },
      });
      const data = await resp.json();
      setLikes(data.likes || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchRecs() {
    setLoading(true); setError("");
    try {
      const resp = await fetch(
        `${API_BASE}/api/recommend?q=${encodeURIComponent(q)}&pageSize=40`,
        { headers: { "x-user-id": userId } }
      );
      const data = await resp.json();
      setArticles((data.articles || []).slice(0, 20));
    } catch (e) { setError(String(e)); setArticles([]); }
    finally { setLoading(false); }
  }

  async function toggleLike(a) {
    const liked = likes.some(item => item.url === a.url);
    const endpoint = liked ? "/api/unlike" : "/api/like";
    const payload = liked ? { url: a.url } : a;

    try {
      await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(payload),
      });

      setLikes(prev =>
        liked
          ? prev.filter(item => item.url !== a.url)
          : [...prev, a]
      );
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchSearch(q);
    fetchLikes();
  }, [userId]);

  useEffect(() => {
    if (tab === "search") fetchSearch(q);
    if (tab === "recommend") fetchRecs();
    if (tab === "likes") fetchLikes();
  }, [tab]);

  return (
    <div className="container">
      <h1>News Recommender — MVP</h1>

      <div style={{ marginBottom: ".5rem" }}>
        <small>Logged in as <b>{userId}</b> ·{" "}
          <button onClick={onLogout}>Log out</button>
        </small>
      </div>

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
          {likes.map((a, i) => (
            <ArticleCard
              key={i}
              a={a}
              onLike={toggleLike}
              isLiked={true}
            />
          ))}
        </ul>
      ) : (
        <ul className="grid">
          {articles.map((a, i) => (
            <ArticleCard
              key={i}
              a={a}
              onLike={toggleLike}
              isLiked={isArticleLiked(a)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
