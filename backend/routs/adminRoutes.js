import express from "express";
import { requireAuth } from "@clerk/express";
import { protectAdminRoute } from "../middleware/auth.js";
import {
  isAdmin,
  getAdminDashboardData,
  getAllShowsAdmin,
  getAllBookingsAdmin,
  deleteShowAdmin,
  updateShowAdmin,
  updateBookingAdmin,
  getRefundDetails,
} from "../controllers/adminControllers.js";

const adminRouter = express.Router();

/* Public route to check if user is admin (frontend calls this) */
adminRouter.get('/is-admin', requireAuth(), isAdmin); 

/* Protected admin routes */
adminRouter.get("/dashboard", requireAuth(), protectAdminRoute, getAdminDashboardData);
adminRouter.get("/all-shows", requireAuth(), protectAdminRoute, getAllShowsAdmin);
adminRouter.get("/all-bookings", requireAuth(), protectAdminRoute, getAllBookingsAdmin);

/* --- DELETE SHOW ROUTE --- */
adminRouter.delete("/delete-show/:id", requireAuth(), protectAdminRoute, deleteShowAdmin);
adminRouter.put("/update-show/:id", requireAuth(), protectAdminRoute, updateShowAdmin);
adminRouter.put("/update-booking/:id", requireAuth(), protectAdminRoute, updateBookingAdmin);

// Refund by booking id 
adminRouter.get("/refund-details/:bookingId", requireAuth(), protectAdminRoute, getRefundDetails);

export default adminRouter;