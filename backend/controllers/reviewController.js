import Review from "../models/Review.js";

// --- ADD REVIEW ---
export const addReview = async (req, res) => {
  try {
    const { movieID, rating, comment } = req.body;

    // 1. Validation: Check if movieID exists
    if (!movieID) {
      return res.status(400).json({ success: false, message: "Movie ID is missing" });
    }

    // 2. Validation: Ensure user provided at least a rating OR a comment
    if (!rating && !comment) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a star rating or a comment" 
      });
    }

    // 3. Create Review
    // IMPORTANT: Check if your Review.js model uses 'user' or 'userId'
    // I am using 'user' below as it is standard.
    const newReview = await Review.create({
      movie: movieID,
      user: req.user._id, 
      userName: req.user.name,
      rating: rating ? Number(rating) : 0, 
      comment: comment || "" 
    });

    res.json({ success: true, message: "Review shared!", review: newReview });
  } catch (error) {
    console.error("Backend Review Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GET REVIEWS ---
export const getMovieReviews = async (req, res) => {
  try {
    const { movieID } = req.params;
    const reviews = await Review.find({ movie: movieID }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- DELETE REVIEW ---
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Security Check: Compare the owner of the review with the logged-in user
    // We check both .user and .userId just in case your schema varies
    const reviewOwnerId = review.user || review.userId;
    
    if (!reviewOwnerId || reviewOwnerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: You can only delete your own reviews" 
      });
    }

    await Review.findByIdAndDelete(id);
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};