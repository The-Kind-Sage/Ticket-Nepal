import { StarIcon, Calendar, Clock } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { image_base_url } = useAppContext();

  // --- IMAGE RESOLVER (Handles Local & TMDB) ---
  const getImageUrl = (movie) => {
    // Check both potential field names: poster_path (TMDB) or poster (Local)
    const path = movie.poster_path || movie.poster;
    
    if (!path) return "https://via.placeholder.com/500x750?text=No+Image";

    // If it's a local upload (contains 'uploads' or is just a filename)
    if (path.includes('uploads') || !path.startsWith('/')) {
      const cleanPath = path.replace(/\\/g, '/').replace(/^\//, "");
      const base = image_base_url?.replace(/\/$/, "");
      return `${base}/${cleanPath}`;
    }

    // Otherwise, treat as TMDB path
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  // Lowest ticket price logic
  const lowestPrice = movie.shows?.length
    ? Math.min(...movie.shows.map((s) => s.showprice))
    : 0;

  const handleNavigation = () => {
    navigate(`/movies/${movie._id}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="group flex flex-col justify-between p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/50 hover:-translate-y-2 transition-all duration-500 w-64 shadow-xl">
      
      {/* Movie Poster with Overlay */}
      <div className="relative h-72 w-full overflow-hidden rounded-xl">
        <img
          onClick={handleNavigation}
          src={getImageUrl(movie)}
          alt={movie.title}
          className="h-full w-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { e.target.src = "https://via.placeholder.com/500x750?text=Error+Loading"; }}
        />
        
        {/* Rating Badge Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
          <StarIcon className="w-3 h-3 text-primary fill-primary" />
          <span className="text-[10px] font-bold text-white">
            {movie.vote_average?.toFixed(1) || "N/A"}
          </span>
        </div>
      </div>

      {/* Movie Details */}
      <div className="px-1 pt-4">
        <h3 className="font-bold text-white truncate text-sm uppercase tracking-tight">
          {movie.title || "Untitled"}
        </h3>
        
        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 font-medium uppercase">
          <span className="flex items-center gap-1">
            <Calendar size={10} className="text-primary" />
            {movie.release_date ? new Date(movie.release_date).getFullYear() : "—"}
          </span>
          {movie.runtime && (
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-primary" />
              {timeFormat(movie.runtime)}
            </span>
          )}
        </div>

        {/* Genres */}
        <p className="text-[10px] text-gray-400 mt-2 line-clamp-1 italic">
          {movie.genres?.length 
            ? movie.genres.slice(0, 2).map(g => typeof g === 'string' ? g : g.name).join(" • ") 
            : "Cinema Special"}
        </p>
      </div>

      {/* Bottom Section: Price & Buy Button */}
      <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/5">
        <div>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Starting at</p>
          <p className="text-sm font-black text-white">
            {lowestPrice > 0 ? `Rs ${lowestPrice}` : "N/A"}
          </p>
        </div>

        <button
          onClick={handleNavigation}
          className="px-5 py-2 text-[10px] bg-primary hover:bg-red-700 text-white transition-all rounded-xl font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-red-900/20"
        >
          Book
        </button>
      </div>
    </div>
  );
};

export default MovieCard;