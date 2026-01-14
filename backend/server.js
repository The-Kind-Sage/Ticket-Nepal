
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

// Routes
import showRouter from "./routs/showRoutes.js";
import bookingRouter from "./routs/bookingRoutes.js";
import adminRouter from "./routs/adminRoutes.js";
import userRouter from "./routs/userRoutes.js"; 

import User from "./models/User.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to database
await connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

// Test server
app.get("/", (req, res) => {
  res.send("Server is running");
});

// API Routes
app.use('/api/show', showRouter);
app.use("/api/booking", bookingRouter);

app.use("/api/admin", adminRouter);

app.use("/api/users", userRouter);




// TEST: get all users from MongoDB

app.get("/api/users/all", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// TEST: get logged-in user from MongoDB

app.get("/api/users/me", requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found in DB" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------
// Inngest routes
// ---------------------------
app.use("/api/inngest", serve({ client: inngest, functions }));

// Start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
