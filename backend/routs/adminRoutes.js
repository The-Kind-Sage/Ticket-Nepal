import express from "express";
import { requireAuth } from "@clerk/express";
import { protectAdminRoute } from "../middleware/auth.js";
import {
  isAdmin,
  getAdminDashboardData,
  getAllShowsAdmin,
  getAllBookingsAdmin,
} from "../controllers/adminControllers.js";

const adminRouter = express.Router();

/* Public route to check if user is admin (frontend calls this) */
adminRouter.get('/is-admin', requireAuth(), isAdmin); // ❌ Do NOT use protectAdminRoute here

/* Protected admin routes */
adminRouter.get("/dashboard", requireAuth(), protectAdminRoute, getAdminDashboardData);
adminRouter.get("/all-shows", requireAuth(), protectAdminRoute, getAllShowsAdmin);
adminRouter.get("/all-bookings", requireAuth(), protectAdminRoute, getAllBookingsAdmin);

export default adminRouter;
