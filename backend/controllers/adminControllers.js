import { clerkClient } from "@clerk/express";
import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

/* --------------------------------------------------
   CHECK IF USER IS ADMIN
-------------------------------------------------- */
export const isAdmin = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.json({ success: true, isAdmin: false });
    }

    const user = await clerkClient.users.getUser(userId);

    const isAdmin = user.privateMetadata?.role === "admin";

    res.json({
      success: true,
      isAdmin,
      role: user.privateMetadata?.role || "user",
    });
  } catch (error) {
    console.error("isAdmin Error:", error.message);
    res.json({ success: true, isAdmin: false });
  }
};

/* --------------------------------------------------
   ADMIN DASHBOARD DATA
-------------------------------------------------- */
export const getAdminDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });

    const activeShows = await Show.find({
      showTime: { $gte: new Date() },
    }).populate("Movie");

    const totalUsers = await Booking.distinct("user");

    const dashboardData = {
      totalBookings: bookings.length,
      totalEarnings: bookings.reduce(
        (acc, booking) => acc + booking.amount,
        0
      ),
      activeShows,
      totalUsers: totalUsers.length,
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.error("Dashboard Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   GET ALL SHOWS (ADMIN)
-------------------------------------------------- */
export const getAllShowsAdmin = async (req, res) => {
  try {
    const shows = await Show.find({
      showTime: { $gte: new Date() },
    })
      .populate("Movie")
      .sort({ showTime: 1 });

    res.json({ success: true, shows });
  } catch (error) {
    console.error("Get Shows Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
   GET ALL BOOKINGS (ADMIN)
-------------------------------------------------- */
export const getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
      .populate({
        path: "Show",
        populate: { path: "Movie" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Get Bookings Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};


