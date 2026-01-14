import { clerkClient } from "@clerk/express";
import Movie from "../models/Movies.js";
import Booking from "../models/Booking.js";

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth().userId;
    console.log("Logged in userId:", userId);

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "Movie" }, // must match your Show schema
      })
      .sort({ createdAt: -1 });

    console.log("Bookings found:", bookings.length);

    res.json({ success: true, bookings });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};


// API controller Function for update favorite movie in Clerk user metadata
export const updateFavoriteMovie = async (req, res) => {
  try {
    const { movieID } = req.body;

    if (!movieID) {
      return res.status(400).json({
        success: false,
        message: "movieID is required",
      });
    }

    const userId = req.auth().userId; // ✅ FIXED
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

// getfevroidmovie code 
export const getFavoriteMovies = async (req, res) => {
  try {
    const userId = req.auth().userId; // ✅ FIXED
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

