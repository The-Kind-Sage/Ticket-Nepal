import React, { useEffect, useState } from "react";
import BlurCircle from "../components/BlurCircle";
import MovieCard from "../components/MovieCard";
import { useAppContext } from "../context/AppContext";

const Movies = () => {
  const { image_base_url, user, getToken, axios } = useAppContext(); 
  const [allMovies, setAllMovies] = useState([]); // Step 1: Data Collection
  const [userRecommended, setUserRecommended] = useState([]); // User-based recommendations
  const [genreRecommended, setGenreRecommended] = useState([]); // Genre-selection recommendations
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("Action"); // Step 2: User Preference
  const [loading, setLoading] = useState(true);

  // --- IMAGE HELPER (Handles Local + TMDB) ---
  const getPosterUrl = (movie) => {
    const path = movie.poster_path || movie.poster;
    if (!path) return "/placeholder.jpg";

    if (path.includes('uploads') || !path.startsWith('/')) {
      const cleanPath = path.replace(/\\/g, '/').replace(/^\//, "");
      const base = image_base_url?.replace(/\/$/, "");
      return `${base}/${cleanPath}`;
    }
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  // --- THE ALGORITHM LOGIC ---
  const normalizeGenreValue = (genre) => {
    if (!genre) return null;
    if (typeof genre === "string") return genre.trim();
    if (typeof genre === "object") return (genre.name || genre.id || "").toString().trim();
    return String(genre).trim();
  };

  const filterMoviesByGenres = (moviesList, genres) => {
    if (!Array.isArray(moviesList)) return [];

    const desired = new Set(
      (genres || []).map((g) => normalizeGenreValue(g)).filter((g) => g)
    );

    return moviesList.filter((movie) => {
      const movieGenres = Array.isArray(movie.genres)
        ? movie.genres.map(normalizeGenreValue)
        : [];
      const moviePrimary = normalizeGenreValue(movie.genre);

      return (
        (moviePrimary && desired.has(moviePrimary)) ||
        movieGenres.some((mg) => mg && desired.has(mg))
      );
    });
  };

  const applyGenreFilter = (moviesList, genreName) => {
    const filtered = filterMoviesByGenres(moviesList, [genreName]);
    setGenreRecommended(filtered);
  };

  const fetchUserPreferredGenres = async () => {
    if (!user || !getToken) return [];
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/users/preferred-genres", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && Array.isArray(data.genres)) {
        return data.genres;
      }
    } catch (error) {
      console.warn("Could not load preferred genres:", error.message);
    }
    return [];
  };

  const updateUserRecommendations = (shows, userGenres) => {
    const filtered = filterMoviesByGenres(shows, userGenres);
    setUserRecommended(filtered);
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/show/all");

        if (data.success) {
          const shows = data.shows;
          setAllMovies(shows);

          const rawPreferredGenres = user ? await fetchUserPreferredGenres() : [];
          setPreferredGenres(rawPreferredGenres);

          if (rawPreferredGenres.length > 0) {
            updateUserRecommendations(shows, rawPreferredGenres);
          } else {
            setUserRecommended([]);
          }

          // Genre-based recommendation section
          applyGenreFilter(shows, selectedGenre);
        }
      } catch (error) {
        console.error("Initialization Error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [user, getToken, selectedGenre]);

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    applyGenreFilter(allMovies, genre);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-xl">
        Loading Movies...
      </div>
    );
  }

  return (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh] text-white">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      {/* STEP 2: USER PREFERENCE UI */}
      <div className="flex flex-wrap items-center gap-4 mb-10">
        <h2 className="text-xl font-bold">Select Genre:</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Sci-Fi'].map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreChange(genre)}
              className={`px-5 py-2 rounded-full border transition-all duration-300 ${
                selectedGenre === genre 
                ? 'bg-red-600 border-red-600 shadow-lg shadow-red-900/20' 
                : 'border-white/20 text-white/60 hover:border-white/50'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 4: USER-BASED RECOMMENDATIONS */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 border-b border-white/10 pb-3">
          User Recommended Movies
        </h2>
        {user && preferredGenres.length > 0 ? (
          <p className="text-sm text-gray-400 mb-4">Based on genres from your bookings: {preferredGenres.join(", ")}</p>
        ) : (
          <p className="text-sm text-gray-400 mb-4">No personal preference found yet; using selected genre as fallback.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {userRecommended.length > 0 ? (
            userRecommended.map((movie) => (
              <MovieCard key={movie._id} movie={{ ...movie, poster_url: getPosterUrl(movie) }} />
            ))
          ) : (
            <div className="col-span-full py-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-gray-400 text-lg">No personalized recommendation available.</p>
            </div>
          )}
        </div>
      </div>

      {/* STEP 4: GENRE-BASED RECOMMENDATIONS */}
      <div className="mb-16">
        <h1 className="text-2xl font-semibold mb-6 border-b border-white/10 pb-4">
          Genre-based Recommended: <span className="text-red-500">{selectedGenre}</span>
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {genreRecommended.length > 0 ? (
            genreRecommended.map((movie) => (
              <MovieCard key={movie._id} movie={{ ...movie, poster_url: getPosterUrl(movie) }} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-gray-400 text-lg">No movies found in the "{selectedGenre}" category.</p>
            </div>
          )}
        </div>
      </div>

      {/* FULL CATALOG (NOW SHOWING) */}
      <div className="mt-20 opacity-80">
        <h2 className="text-lg font-medium mb-6 text-gray-400 uppercase tracking-widest">
          All Available Shows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {allMovies.map((movie) => (
            <MovieCard 
              key={movie._id} 
              movie={{...movie, poster_url: getPosterUrl(movie)}} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Movies;