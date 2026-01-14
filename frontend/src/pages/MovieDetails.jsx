import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, PlayCircle, StarIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [show, setShow] = useState(null);

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoritesMovies,
    favoritesMovies,
    image_base_url,
  } = useAppContext();

  // -----------------------------
  // Fetch movie/show details
  // -----------------------------
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      if (data.success) {
        setShow(data);
      }
    } catch (error) {
      console.error("Error fetching show:", error);
      toast.error("Failed to load show details");
    }
  };

  // -----------------------------
  // Handle favorite button
  // -----------------------------
  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");

      // ✅ Correct backend URL: /api/users/favorite-movie
      const { data } = await axios.post(
        "/api/users/favorite-movie",
        { movieID: id },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        await fetchFavoritesMovies(); // refresh favorites
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to update favorite");
      }
    } catch (error) {
      console.error("Favorite update error:", error);
      toast.error("Something went wrong");
    }
  };

  // -----------------------------
  // Check if movie is favorite
  // -----------------------------
  const isFavorite = Array.isArray(favoritesMovies)
    ? favoritesMovies.some((m) => String(m._id) === String(id))
    : false;

  useEffect(() => {
    getShow();
  }, [id]);

  if (!show) return <Loading />;

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={image_base_url + show.movie?.poster_path}
          alt={show.movie?.title}
          className="md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />

        <div className="flex flex-col gap-3">
          <p className="text-primary capitalize">
            {show.movie?.original_language}
          </p>

          <h1 className="text-4xl font-semibold max-w-96">
            {show.movie?.title}
          </h1>

          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie?.vote_average?.toFixed(1)} User Rating
          </div>

          <p className="text-gray-400 mt-2 text-sm max-w-xl">
            {show.movie?.overview}
          </p>

          <p>
            {timeFormat(show.movie?.runtime)} ·{" "}
            {show.movie?.genres?.map((g) => g.name).join(", ")} ·{" "}
            {show.movie?.release_date?.split("-")[0]}
          </p>

          <div className="flex items-center gap-4 mt-4">
            <button className="flex items-center gap-2 px-7 py-3 bg-gray-800 rounded-md">
              <PlayCircle className="w-5 h-5" />
              Watch Trailer
            </button>

            <a
              href="#dateSelect"
              className="px-10 py-3 bg-primary rounded-md"
            >
              Buy Tickets
            </a>

            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full active:scale-95"
            >
              <Heart
                className={`w-5 h-5 transition ${
                  isFavorite
                    ? "fill-primary text-primary"
                    : "text-gray-400"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* CAST */}
      <div>
        <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
        <div className="overflow-x-auto mt-8 pb-4">
          <div className="flex gap-4 w-max px-4">
            {show.movie?.casts?.slice(0, 12).map((cast, index) => (
              <div key={index} className="flex flex-col items-center">
                <img
                  src={image_base_url +cast.profile_path}
                  alt={cast.name}
                  className="rounded-full h-20 aspect-square object-cover"
                />
                <p>{cast.name}</p>
              </div>
            ))}
          </div>
        </div>

        <DateSelect dateTime={show.dateTime} id={id} />

        <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>

        <div className="flex flex-wrap gap-8 justify-center">
          {Array.isArray(shows) &&
            shows.slice(0, 4).map((movie, index) => (
              <MovieCard key={index} movie={movie} />
            ))}
        </div>

        <div className="flex justify-center mt-20">
          <button
            onClick={() => {
              navigate("/movies");
              scrollTo(0, 0);
            }}
            className="px-10 py-3 bg-primary rounded-md"
          >
            Show More
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
