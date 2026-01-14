import React, { useEffect, useState } from "react";
import axios from "axios";
import BlurCircle from "../components/BlurCircle";
import { StarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Movies = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const currency = import.meta.env.VITE_CURRENCY || "Rs";

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const { data } = await axios.get("http://localhost:3000/api/show/all");

        if (data.success) {
          setMovies(data.shows);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching movies:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">Loading...</div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        No shows available
      </div>
    );
  }

  return (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      <h1 className="text-lg font-medium my-4">Now Showing</h1>

      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {movies.map((movie) => {
          // Minimum show price
          const minPrice =
            movie.shows && movie.shows.length > 0
              ? Math.min(...movie.shows.map((s) => s.showprice))
              : null;

          return (
            <div
              key={movie._id}
              className="w-55 rounded-lg overflow-hidden bg-primary/10 border border-primary/20 hover:-translate-y-1 transition"
            >
              {/* Poster */}
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "/placeholder.jpg"
                }
                alt={movie.title}
                className="h-60 w-full object-cover cursor-pointer"
                onClick={() => {
                  navigate(`/movies/${movie._id}`);
                  window.scrollTo(0, 0);
                }}
              />

              {/* Title */}
              <p className="font-medium p-2 truncate">{movie.title}</p>

              {/* Price & Rating */}
              <div className="flex items-center justify-between px-2 pb-2">
                {/* Price */}
                <p className="text-lg font-medium">
                  {minPrice !== null ? `${currency} ${minPrice}` : "N/A"}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                  <StarIcon className="w-4 h-4 fill-primary" />
                  {movie.vote_average?.toFixed(1) || "N/A"}
                </div>
              </div>

              {/* Buy Tickets Button */}
              <div className="flex justify-center pb-3">
                <button
                  onClick={() => {
                    navigate(`/movies/${movie._id}`);
                    window.scrollTo(0, 0);
                  }}
                  className="px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
                >
                  Buy Tickets
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Movies;
