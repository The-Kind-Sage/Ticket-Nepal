import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // Movie ID (manual or from API)

    title: { type: String, required: true },

    overview: { type: String, required: true }, 

    poster_path: { type: String, required: true }, 

    backdrop_path: { type: String, required: true }, 

    release_date: { type: String, required: true }, 

    original_language: { type: String }, 

    tagline: { type: String },

    genres: { type: Array, required: true },

    casts: { type: Array, required: true }, 

    vote_average: { type: Number, required: true }, 

    runtime: { type: Number, required: true },

    // --- ADDED TRAILER FIELD ---
    trailer: { type: String, default: "" }, // Stores the YouTube Video Key
  },
  { timestamps: true }
);

const AddMovie =
  mongoose.models.AddMovie || mongoose.model("AddMovie", movieSchema);

export default AddMovie;