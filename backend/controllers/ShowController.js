// ShowController.js
import axios from "axios";
import Movie from "../models/Movies.js";
import Show from "../models/Show.js";

/* ===============================
   GET NOW PLAYING MOVIES FROM TMDB
================================ */
export const getNowShowingMovies = async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
      }
    );

    res.json({
      success: true,
      movies: response.data.results || [],
    });
  } catch (error) {
    console.error("getNowShowingMovies error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   ADD NEW SHOW
================================ */
export const addNewShow = async (req, res) => {
  try {
    const { movieID, showInput, showprice } = req.body;

    if (!movieID || !showprice)
      return res.status(400).json({
        success: false,
        message: "movieID and showprice are required",
      });

    if (!Array.isArray(showInput) || showInput.length === 0)
      return res.status(400).json({
        success: false,
        message: "showInput must be a non-empty array",
      });

    let movie = await Movie.findById(movieID);

    if (!movie) {
      const [detailsRes, creditsRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieID}`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieID}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
      ]);

      movie = await Movie.create({
        _id: movieID,
        title: detailsRes.data.title,
        overview: detailsRes.data.overview,
        poster_path: detailsRes.data.poster_path,
        backdrop_path: detailsRes.data.backdrop_path,
        genres: detailsRes.data.genres,
        casts: creditsRes.data.cast,
        release_date: detailsRes.data.release_date,
        original_language: detailsRes.data.original_language,
        tagline: detailsRes.data.tagline || "",
        vote_average: detailsRes.data.vote_average,
        runtime: detailsRes.data.runtime,
      });
    }

    const showsToCreate = [];
    showInput.forEach((item) => {
      if (!item.date || !Array.isArray(item.times)) return;
      item.times.forEach((time) => {
        showsToCreate.push({
          Movie: movieID,
          showTime: new Date(`${item.date}T${time}`),
          showprice,
          occupaiedSeats: {},
        });
      });
    });

    if (showsToCreate.length === 0)
      return res.status(400).json({
        success: false,
        message: "No valid shows to insert",
      });

    await Show.insertMany(showsToCreate);

    res.json({ success: true, message: "Shows added successfully" });
  } catch (error) {
    console.error("addNewShow error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Api to call all shows
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showTime: { $gte: new Date() } })
      .populate("Movie")
      .sort({ showTime: 1 });

    // Group shows by movie
    const moviesMap = {};

    shows.forEach((show) => {
      const movieId = show.Movie._id.toString();
      if (!moviesMap[movieId]) {
        moviesMap[movieId] = {
          _id: show.Movie._id,
          title: show.Movie.title,
          poster_path: show.Movie.poster_path,
          vote_average: show.Movie.vote_average,
          shows: [], // all upcoming shows for this movie
        };
      }

      moviesMap[movieId].shows.push({
        showID: show._id,
        showTime: show.showTime,
        showprice: show.showprice,
      });
    });

    const moviesWithShows = Object.values(moviesMap);

    res.json({ success: true, shows: moviesWithShows });
  } catch (error) {
    console.error("getAllShows error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getSingleShow = async (req, res) => {
  try {
    const { movieID } = req.params;

    // Find all future shows for this movie
    const shows = await Show.find({
      Movie: movieID,
      showTime: { $gte: new Date() },
    }).sort({ showTime: 1 });

    const movie = await Movie.findById(movieID);

    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showTime.toISOString().split("T")[0];

      if (!dateTime[date]) dateTime[date] = [];

      // Make sure occupiedSeats is always an array
      const occupiedSeats = Array.isArray(show.occupiedSeats)
        ? show.occupiedSeats
        : show.occupiedSeats
        ? Object.keys(show.occupiedSeats) // if it's an object, convert keys to array
        : [];

      dateTime[date].push({
        time: show.showTime,
        showID: show._id,
        price: show.showprice,
        occupiedSeats,
      });
    });

    res.json({ success: true, movie, dateTime });
  } catch (error) {
    console.error("getSingleShow error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};