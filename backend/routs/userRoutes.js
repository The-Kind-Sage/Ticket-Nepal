import express from 'express';
import {
  getFavoriteMovies,
  getUserBookings,
  updateFavoriteMovie,
  requestRefund,
  getUserPreferredGenres,
  syncUserWithClerk // Import the sync function
} from '../controllers/userControllers.js';

const userRouter = express.Router();

// Existing Routes
userRouter.get('/bookings', getUserBookings);
userRouter.post('/favorite-movie', updateFavoriteMovie);
userRouter.get('/favorite', getFavoriteMovies);

// NEW: Refund Request Route
// This matches the axios.post("/api/users/refund-request", ...) in your frontend
userRouter.post('/refund-request', requestRefund);

// NEW: Get User Preferred Genres Route
// Fetches genres based on user's booking history
userRouter.get('/preferred-genres', getUserPreferredGenres);

// NEW: Sync User Data from Clerk to Database
// Manually sync user data from Clerk (auto-synced during booking too)
userRouter.post('/sync-profile', async (req, res) => {
  try {
    const userId = req.auth().userId;
    const user = await syncUserWithClerk(userId);
    res.json({ success: true, message: "User profile synced successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default userRouter;