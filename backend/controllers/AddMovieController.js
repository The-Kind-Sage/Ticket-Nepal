import Movie from "../models/AddMovie.js";

const AddMovieController = {};

AddMovieController.addMovie = async (req, res) => {
  try {
    const {
      id, title, overview, release_date, vote_average,
      tagline, original_language, genres, runtime, 
      trailer // <--- Extract from req.body
    } = req.body;

    const posterFile = req.files.poster?.[0];
    const backdropFile = req.files.backdrop?.[0];
    const castFiles = req.files.castImages || [];

    if (!id || !title || !posterFile || !backdropFile) {
      return res.status(400).json({ message: "Required files are missing!" });
    }

    // Helper to clean file paths for web usage
    const cleanPath = (filePath) => {
      return filePath
        .replace(/\\/g, "/")
        .split("uploads").pop();
    };

    const poster_path = "uploads" + cleanPath(posterFile.path);
    const backdrop_path = "uploads" + cleanPath(backdropFile.path);

    // --- TRAILER LOGIC ---
    // This helper ensures that if an admin pastes "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    // it extracts just "dQw4w9WgXcQ".
    const extractYoutubeKey = (input) => {
      if (!input) return "";
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = input.match(regExp);
      return (match && match[2].length === 11) ? match[2] : input;
    };

    const trailerKey = extractYoutubeKey(trailer);

    const genresArray = typeof genres === "string" ? JSON.parse(genres) : genres;
    const castNames = req.body.casts ? JSON.parse(req.body.casts) : [];
    
    const casts = castFiles.map((file, index) => ({
      name: castNames[index]?.name || `Cast ${index + 1}`,
      image: "uploads" + cleanPath(file.path)
    }));

    const newMovie = new Movie({
      _id: id,
      title,
      overview,
      poster_path, 
      backdrop_path,
      release_date,
      original_language,
      tagline,
      genres: genresArray,
      casts,
      vote_average: Number(vote_average),
      runtime: Number(runtime),
      trailer: trailerKey // <--- Save the cleaned trailer key here
    });

    await newMovie.save();
    res.status(201).json({ message: "Movie added successfully!", movie: newMovie });
  } catch (error) {
    console.error("AddMovie error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

AddMovieController.getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json({ success: true, movies });
  } catch (error) {
    console.error("GetAllMovies error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

AddMovieController.deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Movie.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Movie not found" });
    res.json({ success: true, message: "Movie deleted" });
  } catch (error) {
    console.error("DeleteMovie error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

AddMovieController.updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};
    ["title", "overview", "release_date", "vote_average", "tagline", "original_language", "trailer"].forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });
    if (req.body.genres) updateData.genres = typeof req.body.genres === "string" ? JSON.parse(req.body.genres) : req.body.genres;
    if (req.body.runtime !== undefined) updateData.runtime = Number(req.body.runtime);

    const updated = await Movie.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Movie not found" });
    res.json({ success: true, message: "Movie updated", movie: updated });
  } catch (error) {
    console.error("UpdateMovie error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default AddMovieController;