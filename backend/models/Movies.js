import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true }, // Movie ID (TMDB ID or Local ID)
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
        // ADD THIS LINE FOR TRAILERS
        trailer: { type: String, default: "" }, 
    }, 
    { timestamps: true }
);

const Movie = mongoose.models.Movie || mongoose.model("Movie", movieSchema);

// Add recommendation method
Movie.recommendByGenre = async function(genre) {
    try {
        const movies = await this.find({ genres: { $in: [genre] } });
        return movies;
    } catch (error) {
        throw new Error('Error fetching movie recommendations: ' + error.message);
    }
};

export default Movie;