import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    movie: { type: String, required: true }, // TMDB ID
    user: { type: String, required: true },  // Clerk User ID
    userName: { type: String, required: true },
    // Removed 'required' so users can send just one or the other
    rating: { type: Number, default: 0 }, 
    comment: { type: String, default: "" },
}, { timestamps: true });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;