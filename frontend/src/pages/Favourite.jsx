import React from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";

const Favorite = () => {

  const { favoritesMovies } = useAppContext()
  return favoritesMovies.length > 0 ? (
    <div
      className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44
    overflow-hidden min-h-[80vh]"
    >
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      <h1 className="text-lg font-medium my-4">Your Favarite Movies</h1>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {favoritesMovies.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className=" lext-3x1 font-bold text-center">No movies available</h1>
    </div>
  );
};

export default Favorite;
