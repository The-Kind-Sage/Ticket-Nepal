const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Allow your React dev server
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Root route so you don't see "Cannot GET /"
app.get("/", (_req, res) => {
  res.send("Backend is running ✅ Try GET /api/hello");
});

// Example API
app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from Express backend 🚀" });
});

// 404 for other paths (optional)
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
