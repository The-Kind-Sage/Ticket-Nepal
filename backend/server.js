import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; // Added to verify folder existence

// Routes
import showRouter from "./routs/showRoutes.js";
import bookingRouter from "./routs/bookingRoutes.js";
import adminRouter from "./routs/adminRoutes.js";
import userRouter from "./routs/userRoutes.js"; 
import paymentRoutes from "./routs/paymentRoutes.js";
import addMovieRouter from "./routs/addMovieRoutes.js"; 
import reviewRouter from "./routs/reviewRoutes.js";

// Models
import User from "./models/User.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
await connectDB();

// ES module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. MIDDLEWARE ---
app.use(express.json());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true
}));
app.use(clerkMiddleware());

// --- 2. THE CRITICAL STATIC FILES FIX ---
/**
 * We use path.resolve() to ensure we are looking at the absolute root.
 * If your server.js is inside a 'src' folder, we need to go up one level.
 * Change "../uploads" to "uploads" if your uploads folder is inside the same folder as server.js
 */
const uploadsPath = path.resolve(__dirname, "uploads");

// Log for debugging (Check your terminal when server starts)
if (fs.existsSync(uploadsPath)) {
    console.log(`✅ Uploads folder found at: ${uploadsPath}`);
} else {
    console.log(`❌ Uploads folder NOT found at: ${uploadsPath}. Creating it now...`);
    fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));


// --- 3. DEBUGGING ROUTE (Visit http://localhost:3000/debug-paths) ---
app.get("/debug-paths", (req, res) => {
    res.json({
        __dirname,
        uploadsPath,
        exists: fs.existsSync(uploadsPath),
        contents: fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath) : "N/A"
    });
});

// --- 4. API ROUTES ---
app.get("/", (req, res) => res.send("Server is running"));

app.use('/api/show', showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", userRouter);
app.use("/api/payment", paymentRoutes);
app.use("/api/movies", addMovieRouter); 
app.use('/api/reviews', reviewRouter);

// User Routes
app.get("/api/users/all", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/users/me", requireAuth(), async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.use("/api/inngest", serve({ client: inngest, functions }));

app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
});