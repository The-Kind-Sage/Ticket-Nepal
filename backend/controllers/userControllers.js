import { clerkClient } from "@clerk/express";
import Movie from "../models/Movies.js";
import Booking from "../models/Booking.js";
import Refund from "../models/Refund.js";
import User from "../models/User.js";

/**
 * SYNC USER WITH CLERK
 * Syncs user data from Clerk to MongoDB database
 * Called during booking creation
 */
export const syncUserWithClerk = async (userId) => {
  try {
    // Get user data from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    if (!clerkUser) {
      throw new Error("User not found in Clerk");
    }

    // Extract user data from Clerk
    const userData = {
      _id: clerkUser.id,
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "User",
      email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
      image: clerkUser.imageUrl || "",
    };

    // Create or update user in MongoDB
    const user = await User.findByIdAndUpdate(
      userId,
      userData,
      { upsert: true, new: true }
    );

    console.log(`User synced from Clerk: ${userId}`);
    return user;
  } catch (error) {
    console.error("Error syncing user with Clerk:", error.message);
    throw error;
  }
};

/**
 * GET USER BOOKINGS
 * Fetches all bookings for the logged-in Clerk user.
 */
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth().userId;
    console.log("Logged in userId:", userId);

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "Movie" }, 
      })
      .sort({ createdAt: -1 });

    console.log("Bookings found:", bookings.length);

    res.json({ success: true, bookings });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

/**
 * UPDATE FAVORITE MOVIE
 * Updates Clerk user metadata to add/remove a movie from favorites.
 */
export const updateFavoriteMovie = async (req, res) => {
  try {
    const { movieID } = req.body;

    if (!movieID) {
      return res.status(400).json({
        success: false,
        message: "movieID is required",
      });
    }

    const userId = req.auth().userId; 
    const user = await clerkClient.users.getUser(userId);

    const favoriteMovies = Array.isArray(user.privateMetadata.favoriteMovies)
      ? user.privateMetadata.favoriteMovies
      : [];

    let updatedFavorites;

    if (favoriteMovies.includes(movieID)) {
      // remove
      updatedFavorites = favoriteMovies.filter((id) => id !== movieID);
    } else {
      // add
      updatedFavorites = [...favoriteMovies, movieID];
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        favoriteMovies: updatedFavorites,
      },
    });

    res.json({
      success: true,
      message: "Favorite movies updated successfully",
    });
  } catch (error) {
    console.error("Update favorite error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET FAVORITE MOVIES
 * Fetches movie details from the DB based on IDs stored in Clerk metadata.
 */
export const getFavoriteMovies = async (req, res) => {
  try {
    const userId = req.auth().userId; 
    const user = await clerkClient.users.getUser(userId);

    const favoriteMovies = Array.isArray(user.privateMetadata.favoriteMovies)
      ? user.privateMetadata.favoriteMovies
      : [];

    if (favoriteMovies.length === 0) {
      return res.json({ success: true, movies: [] });
    }

    const movies = await Movie.find({
      _id: { $in: favoriteMovies },
    });

    res.json({ success: true, movies });
  } catch (error) {
    console.error("Get favorite movies error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * REQUEST REFUND
 * Stores data in user_Refund table and updates Booking status.
 * Prevents multiple requests for the same booking ID/seats.
 */
export const requestRefund = async (req, res) => {
  try {
    const { bookingId, email, phone, reason } = req.body;
    const userId = req.auth().userId;

    // 1. Verify the booking exists and belongs to the user
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Checking if the 'user' field in Booking matches the clerk userId
    if (booking.user !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized: This is not your booking" });
    }

    // 2. STRICT CHECK: Check both Booking model flag AND the user_Refund table
    // This ensures that even if one fails, the other blocks duplicate requests.
    const existingRequest = await Refund.findOne({ bookingId });

    if (booking.refundRequested || existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: "A refund for this ID/Seat has already been requested. You cannot submit it again." 
      });
    }

    // 3. Create entry in user_Refund table
    const newRefund = new Refund({
      bookingId,
      userId,
      email,
      phone,
      reason,
      status: "Pending" // Default status
    });

    await newRefund.save();

    // 4. Update the Booking model to reflect the request (hides button on frontend)
    booking.refundRequested = true;
    await booking.save();

    res.json({ 
      success: true, 
      message: "Refund request submitted successfully! Our team will process it shortly." 
    });

  } catch (error) {
    // Handle database-level duplicate key error (MongoDB Error 11000)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Refund already exists for this booking ID." });
    }
    console.error("Refund Request Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE USER PREFERRED GENRES
 * Calculates and stores user's preferred genres based on their bookings
 * Automatically called after booking creation
 */
export const updateUserPreferredGenres = async (userId) => {
  try {
    // Get all bookings for the user
    const bookings = await Booking.find({ user: userId });

    if (bookings.length === 0) {
      // If no bookings, set genres to empty array
      await User.findByIdAndUpdate(userId, { preferredGenres: [] });
      return;
    }

    // Extract all genres from bookings
    const genreSet = new Set();
    bookings.forEach((booking) => {
      if (booking.genres && Array.isArray(booking.genres)) {
        booking.genres.forEach((genre) => {
          const genreName = typeof genre === 'string' ? genre : genre.name || genre.id;
          if (genreName) genreSet.add(genreName);
        });
      }
    });

    // Convert set to array and update user
    const uniqueGenres = Array.from(genreSet);
    await User.findByIdAndUpdate(
      userId,
      { preferredGenres: uniqueGenres },
      { new: true }
    );

    console.log(`Updated genres for user ${userId}:`, uniqueGenres);
  } catch (error) {
    console.error("Error updating user preferred genres:", error.message);
  }
};

/**
 * GET USER PREFERRED GENRES
 * Fetches the user's preferred genres from the database
 */
export const getUserPreferredGenres = async (req, res) => {
  try {
    const userId = req.auth().userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: true, genres: [] });
    }

    res.json({ success: true, genres: user.preferredGenres || [] });
  } catch (error) {
    console.error("Get user genres error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};