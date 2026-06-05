import { ArrowRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import MovieCard from "./MovieCard";
import { useAppContext } from "../context/AppContext";

const FeaturedSection = () => {
  const navigate = useNavigate();
  const { axios, shows, fetchShows } = useAppContext();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Re-fetch to get latest data whenever component mounts
    fetchShows();
  }, []);

  useEffect(() => {
    if (shows && shows.length > 0) {
      setMovies(shows.slice(0, 4));
      setLoading(false);
    } else if (shows !== undefined) {
      setLoading(false);
    }
  }, [shows]);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden">
      <div className="relative flex items-center justify-between pt-20 pb-10">
        <BlurCircle top="0" right="-80px" />
        <p className="text-gray-300 font-medium text-lg">Now Showing</p>

        <button
          onClick={() => navigate("/movies")}
          className="group flex items-center gap-2 text-sm text-gray-300"
        >
          View All
          <ArrowRight className="group-hover:translate-x-0.5 transition w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex flex-wrap max-sm:justify-center gap-8 mt-8">
        {loading ? (
          <p className="text-gray-300">Loading...</p>
        ) : movies.length === 0 ? (
          <p className="text-gray-300">No movies are currently showing.</p>
        ) : (
          movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))
        )}
      </div>

      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium"
        >
          Show More
        </button>
      </div>
    </div>
  );
};

export default FeaturedSection;
