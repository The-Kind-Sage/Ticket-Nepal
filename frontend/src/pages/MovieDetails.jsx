import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, PlayCircle, StarIcon, X, Send, MessageSquare, Trash2, Loader2 } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // States
  const [show, setShow] = useState(null);
  const [playTrailer, setPlayTrailer] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoritesMovies,
    favoritesMovies,
    image_base_url,
  } = useAppContext();

  // --- HELPERS ---
  const getImageUrl = (path) => {
    if (!path) return "/placeholder.jpg";
    if (path.includes('uploads') || !path.startsWith('/')) {
      const cleanPath = path.replace(/\\/g, '/').replace(/^\//, "");
      const base = image_base_url?.replace(/\/$/, "");
      return `${base}/${cleanPath}`;
    }
    return `https://image.tmdb.org/t/p/w1280${path}`;
  };

  const getShowData = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      if (data.success) setShow(data);
    } catch (error) {
      toast.error("Failed to load show details");
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/${id}`);
      if (data.success) setReviews(data.reviews);
    } catch (error) {
      console.error("Reviews error", error);
    }
  };

  // --- REVIEW ACTIONS ---
  const handleSubmitReview = async () => {
    if (!user) return toast.error("Please login to review");
    
    // Logic: Must have at least a rating OR a comment
    if (userRating === 0 && !comment.trim()) {
      return toast.error("Please provide a rating or a comment");
    }

    try {
      setSubmittingReview(true);
      const token = await getToken();
      const { data } = await axios.post("/api/reviews/add", 
        { movieID: id, rating: userRating, comment: comment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Review posted!");
        setComment("");
        setUserRating(0);
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review permanently?")) return;

    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/reviews/delete/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success("Review removed");
        fetchReviews();
      }
    } catch (error) {
      toast.error("Unauthorized or failed to delete");
    }
  };

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");
      const { data } = await axios.post("/api/users/favorite-movie", 
        { movieID: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        await fetchFavoritesMovies();
        toast.success(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const isFavorite = Array.isArray(favoritesMovies)
    ? favoritesMovies.some((m) => String(m._id) === String(id))
    : false;

  useEffect(() => {
    getShowData();
    fetchReviews();
    window.scrollTo(0, 0);
  }, [id]);

  if (!show) return <Loading />;

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white pb-20">
      
      {/* --- TRAILER MODAL --- */}
      {playTrailer && show.movie?.trailer && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl">
            <button onClick={() => setPlayTrailer(false)} className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full hover:bg-primary transition">
              <X size={24} />
            </button>
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${show.movie.trailer}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
          </div>
        </div>
      )}

      {/* --- BACKDROP HERO --- */}
      <div className="absolute top-0 left-0 w-full h-[70vh] opacity-30">
        <img src={getImageUrl(show.movie?.backdrop_path)} className="w-full h-full object-cover" alt="backdrop" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
      </div>

      <div className="relative px-6 md:px-16 lg:px-40 pt-32 md:pt-48">
        <div className="flex flex-col md:flex-row gap-12 max-w-7xl mx-auto">
          <div className="shrink-0">
             <img src={getImageUrl(show.movie?.poster_path)} className="rounded-2xl w-full md:w-80 h-[480px] object-cover shadow-2xl border border-white/10" alt={show.movie?.title} />
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-primary font-black tracking-[0.3em] uppercase text-xs">{show.movie?.original_language} · {show.movie?.release_date?.split("-")[0]}</span>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">{show.movie?.title}</h1>
            
            <div className="flex items-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <StarIcon className="w-6 h-6 text-primary fill-primary" />
                <span className="text-2xl font-black">{show.movie?.vote_average?.toFixed(1)}</span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <span className="text-gray-400 font-bold">{timeFormat(show.movie?.runtime)}</span>
            </div>

            <p className="text-gray-500 max-w-3xl leading-relaxed mt-4">{show.movie?.overview}</p>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <button onClick={() => show.movie?.trailer ? setPlayTrailer(true) : toast.error("No trailer found")} className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-primary hover:text-white transition-all transform active:scale-95">
                <PlayCircle size={24} /> WATCH TRAILER
              </button>
              <a href="#dateSelect" className="px-8 py-4 bg-primary rounded-2xl font-black hover:brightness-110 transition shadow-lg shadow-primary/20 text-center">BUY TICKETS</a>
              <button onClick={handleFavorite} className={`p-4 rounded-2xl border border-white/10 hover:bg-white/5 transition ${isFavorite ? "bg-primary/10 border-primary" : ""}`}>
                <Heart className={isFavorite ? "fill-primary text-primary" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* --- SHOWTIME SELECTION --- */}
        <div id="dateSelect" className="mt-20 py-20 border-t border-white/5">
           <DateSelect dateTime={show.dateTime} id={id} />
        </div>

        {/* --- REVIEWS SECTION --- */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
              <MessageSquare className="text-primary" /> Your Review
            </h2>
            
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-black uppercase text-gray-500">Rating (Optional)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`cursor-pointer transition-all ${star <= (hover || userRating) ? "text-primary fill-primary scale-110" : "text-white/20"}`}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setUserRating(star)}
                    />
                  ))}
                </div>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your thoughts (Optional)..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-primary min-h-[120px] transition-all"
              />

              <button 
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className="w-full bg-primary py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {submittingReview ? <Loader2 className="animate-spin"/> : <><Send size={18}/> POST REVIEW</>}
              </button>
            </div>
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            <h3 className="text-xl font-bold uppercase text-gray-400 mb-4">Latest Feedback</h3>
            {reviews.length > 0 ? reviews.map((rev, i) => (
              <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 relative group hover:bg-white/[0.08] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black">
                      {rev.userName ? rev.userName[0].toUpperCase() : "U"}
                    </div>
                    <p className="font-bold text-sm">{rev.userName}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <StarIcon key={j} size={12} className={j < rev.rating ? "text-primary fill-primary" : "text-white/10"} />
                      ))}
                    </div>
                    
                    {/* Only show delete if user owns the review */}
                    {user && (user._id === rev.userId || user.id === rev.userId) && (
                      <button 
                        onClick={() => handleDeleteReview(rev._id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {rev.comment && <p className="text-gray-400 text-sm leading-relaxed">"{rev.comment}"</p>}
              </div>
            )) : <p className="text-gray-600 italic">No reviews yet. Be the first to rate!</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;