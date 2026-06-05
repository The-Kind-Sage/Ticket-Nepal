import React, { useState } from "react";
import "./header.css";
import logo from "../image/logo.png"; // ✅ Import logo image

export default function Header({
  logoSrc = logo,
  avatarSrc = logo,
  onSearch,
  onMenuClick,
  onProfileClick,
}) {
  const [q, setQ] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) {
      onSearch?.(q.trim());
    }
  };

  return (
    <header className="tn-header">
      {/* Left: Logo */}
      <div className="tn-left">
        <img src={logo} alt="Ticket Nepal" className="tn-logo" />
        <span className="tn-logo-text">TICKET NEPAL</span>
      </div>

      {/* Middle: Search */}
      <form className="tn-search" onSubmit={submit} role="search">
        <span className="tn-search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 21l-4.2-4.2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </span>
        <input
          className="tn-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for movies, events, hotels, travel..."
          aria-label="Search"
        />
        <button className="tn-search-submit" type="submit">
          Search
        </button>
      </form>

      {/* Right: Avatar + Menu */}
      <div className="tn-right">
        <button
          className="tn-avatar-btn"
          onClick={onProfileClick}
          aria-label="Open profile"
          title="Profile"
        >
          <img src={avatarSrc} alt="User" className="tn-avatar" />
        </button>

        <button
          className="tn-icon-btn"
          onClick={onProfileClick}
          aria-label="Open account menu"
          title="Account"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          className="tn-icon-btn"
          onClick={onMenuClick}
          aria-label="Open main menu"
          title="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 7h18M3 12h18M3 17h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="tn-right">
        <nav className="tn-nav">
          <ul className="tn-nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/events">Events</a></li>
            <li><a href="/movies">Movies</a></li>
            <li><a href="/hotels">Hotels</a></li>
            <li><a href="/travel">Travel</a></li>
          </ul>
        </nav>
        </div>
    </header>
  );
}
