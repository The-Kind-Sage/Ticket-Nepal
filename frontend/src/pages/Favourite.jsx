import React from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";

const Favorite = () => {
  const { favoritesMovies } = useAppContext();

  return favoritesMovies && favoritesMovies.length > 0 ? (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      
      <h1 className="text-2xl font-bold my-6 border-b border-white/10 pb-4">
        Your <span className="text-primary">Favorite</span> Movies
      </h1>

      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {favoritesMovies.map((movie) => (
          // Use movie._id as the key for consistency with MongoDB
          <MovieCard movie={movie} key={movie._id || movie.id} />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="bg-primary/10 p-10 rounded-full mb-6">
        <span className="text-6xl">🎬</span>
      </div>
      <h1 className="text-3xl font-bold text-center">Your watchlist is empty</h1>
      <p className="text-gray-500 mt-2">Start adding movies to your favorites!</p>
    </div>
  );
};

export default Favorite;