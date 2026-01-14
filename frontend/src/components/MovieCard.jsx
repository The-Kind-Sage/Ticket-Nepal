import { StarIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  // Movie image fallback
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  // Lowest ticket price (from shows array)
  const lowestPrice = movie.shows?.length
    ? Math.min(...movie.shows.map((s) => s.showprice))
    : 0;

  return (
    <div className="flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66">
      {/* Movie Poster */}
      <img
        onClick={() => {
          navigate(`/movies/${movie._id}`);
          window.scrollTo(0, 0);
        }}
        src={imageUrl}
        alt={movie.title}
        className="rounded-lg h-52 w-full object-cover cursor-pointer"
      />

      {/* Movie Title */}
      <p className="font-semibold mt-2 truncate">{movie.title || "Untitled"}</p>

      {/* Release year & runtime */}
      <p className="text-sm text-gray-400 mt-1">
        {movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "—"}
        {movie.runtime ? ` • ${timeFormat(movie.runtime)}` : ""}
        {movie.genres?.length ? ` • ${movie.genres.slice(0, 2).map(g => g.name).join(" | ")}` : ""}
      </p>

      {/* Buy button, rating & price */}
      <div className="flex items-center justify-between mt-4 pb-3">
        <button
          onClick={() => {
            navigate(`/movies/${movie._id}`);
            window.scrollTo(0, 0);
          }}
          className="px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
        >
          Buy Tickets
        </button>

        <div className="flex flex-col items-end">
          {/* Rating */}
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            <StarIcon className="w-4 h-4 fill-primary" />
            {movie.vote_average?.toFixed(1) || "N/A"}
          </div>

          {/* Price */}
          <p className="text-xs text-gray-300">
            {lowestPrice > 0 ? `Rs ${lowestPrice}` : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
