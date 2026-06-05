import axios from "axios";
import Movie from "../models/Movies.js";      
import AddMovie from "../models/AddMovie.js"; 
import Show from "../models/Show.js";

/* ===============================
    GET NOW PLAYING MOVIES
================================ */
export const getNowShowingMovies = async (req, res) => {
  try {
    const tmdbResponse = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      { headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` } }
    );
    const tmdbMovies = tmdbResponse.data.results || [];

    const localMovies = await AddMovie.find().sort({ createdAt: -1 });

    const formattedLocalMovies = localMovies.map(movie => ({
      _id: movie._id,
      title: movie.title,
      overview: movie.description || movie.overview,
      poster_path: movie.poster_path || movie.poster,
      backdrop_path: movie.backdrop_path || movie.backdrop,
      vote_average: movie.vote_average || 0,
      vote_count: movie.vote_count || 0,
      release_date: movie.release_date || movie.releaseDate,
      isLocal: true,
      // Ensure local movies also pass their trailer key if available
      trailer: movie.trailer || "" 
    }));

    res.json({
      success: true,
      movies: [...formattedLocalMovies, ...tmdbMovies],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
    ADD NEW SHOW (Updated for Trailer)
================================ */
export const addNewShow = async (req, res) => {
  try {
    const { movieID, showInput, showprice } = req.body;

    if (!movieID || !showprice || !showInput) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let movie = await Movie.findById(movieID);

    if (!movie) {
      const localData = await AddMovie.findById(movieID);
      if (localData) {
        movie = await Movie.create({
          _id: localData._id,
          title: localData.title,
          overview: localData.description || localData.overview,
          poster_path: localData.poster_path || localData.poster,
          backdrop_path: localData.backdrop_path || localData.backdrop,
          genres: localData.genres,
          casts: localData.casts,
          release_date: localData.release_date || localData.releaseDate,
          vote_average: localData.vote_average || 0,
          runtime: localData.runtime || 0,
          // Sync trailer from local data
          trailer: localData.trailer || "", 
        });
      }
    }

    if (!movie && !String(movieID).includes("-")) {
      try {
        // ADDED: videos API call to TMDB
        const [detailsRes, creditsRes, videosRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${movieID}`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${movieID}/credits`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${movieID}/videos`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
          }),
        ]);

        // Logic to find the official trailer key
        const videos = videosRes.data.results || [];
        const trailerObj = videos.find(v => v.type === "Trailer" && v.site === "YouTube") || videos[0];

        movie = await Movie.create({
          _id: movieID,
          title: detailsRes.data.title,
          overview: detailsRes.data.overview,
          poster_path: detailsRes.data.poster_path,
          backdrop_path: detailsRes.data.backdrop_path,
          genres: detailsRes.data.genres,
          casts: creditsRes.data.cast,
          release_date: detailsRes.data.release_date,
          vote_average: detailsRes.data.vote_average,
          runtime: detailsRes.data.runtime,
          // SAVING the trailer key
          trailer: trailerObj ? trailerObj.key : "" 
        });
      } catch (err) { console.error("TMDB error:", err.message); }
    }

    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

    // Extract genres from the movie
    const movieGenres = movie.genres || [];

    const showsToCreate = [];
    showInput.forEach((item) => {
      item.times.forEach((time) => {
        showsToCreate.push({
          Movie: movieID,
          showTime: new Date(`${item.date}T${time}`),
          showprice: Number(showprice),
          occupiedSeats: {},
          genres: movieGenres, // Add genres to each show
        });
      });
    });

    await Show.insertMany(showsToCreate);
    res.json({ success: true, message: "Shows added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
    GET ALL UPCOMING SHOWS
================================ */
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showTime: { $gte: new Date() } })
      .populate("Movie")
      .sort({ showTime: 1 });

    const moviesMap = {};
    shows.forEach((show) => {
      if (!show.Movie) return;
      const movieId = show.Movie._id.toString();
      if (!moviesMap[movieId]) {
        moviesMap[movieId] = {
          _id: show.Movie._id,
          title: show.Movie.title,
          poster_path: show.Movie.poster_path,
          vote_average: show.Movie.vote_average,
          genres: show.Movie.genres || show.genres || [],
          // ADDED: Passing trailer to the map
          trailer: show.Movie.trailer, 
          shows: [],
        };
      }
      moviesMap[movieId].shows.push({
        showID: show._id,
        showTime: show.showTime,
        showprice: show.showprice,
      });
    });

    res.json({ success: true, shows: Object.values(moviesMap) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
    GET MOVIES BY GENRE
================================ */
export const getMoviesByGenre = async (req, res) => {
  try {
    const genre = req.params.genre || req.query.genre;
    if (!genre) {
      return res.status(400).json({ success: false, message: "Genre is required" });
    }

    const movies = await Movie.find({
      $or: [
        { genres: genre },
        { 'genres.name': genre },
        { 'genres.title': genre },
      ],
    });

    res.json({ success: true, movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
    GET SINGLE SHOW
================================ */
export const getSingleShow = async (req, res) => {
  try {
    const { movieID } = req.params;

    const shows = await Show.find({
      Movie: movieID,
      showTime: { $gte: new Date() },
    }).sort({ showTime: 1 });

    const movie = await Movie.findById(movieID);

    const dateTime = {};
    shows.forEach((show) => {
      const date = show.showTime.toISOString().split("T")[0];
      if (!dateTime[date]) dateTime[date] = [];

      const occupiedSeats = Array.isArray(show.occupiedSeats)
        ? show.occupiedSeats
        : show.occupiedSeats 
        ? Object.keys(show.occupiedSeats) 
        : [];

      dateTime[date].push({
        time: show.showTime,
        showID: show._id,
        showprice: show.showprice,
        occupiedSeats,
      });
    });

    // The 'movie' object returned here now includes the trailer field
    res.json({ success: true, movie, dateTime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};