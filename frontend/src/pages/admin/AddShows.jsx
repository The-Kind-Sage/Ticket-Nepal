import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import { CheckIcon, DeleteIcon, StarIcon, Calendar, Clock, Banknote, Youtube, Film } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const AddShows = () => {
  const { axios, getToken, user, image_base_url, fetchShows } = useAppContext()
  const Currency = import.meta.env.VITE_CURRENCY

  // States
  const [nowPlayingMovies, setNowPlayingMovies] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [dateTimeSelection, setDateTimeSelection] = useState({})
  const [dateTimeInput, setDateTimeInput] = useState("")
  const [showPrice, setShowPrice] = useState("")
  const [addingShow, setAddingShow] = useState(false)

  // Fetch movies available to have shows added
  const fetchNowPlayingMovies = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/show/now-playing', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success && Array.isArray(data.movies)) {
        setNowPlayingMovies(data.movies)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Failed to load movies")
    }
  }

  // Handle Image URL logic (Local vs TMDB)
  const getPosterUrl = (movie) => {
    let rawPath = movie.poster_path || movie.poster;
    if (!rawPath) return "https://placehold.co/500x750?text=No+Poster";

    if (rawPath.includes('uploads') || !rawPath.startsWith('/')) {
      let cleanPath = rawPath.replace(/\\/g, '/');
      if (cleanPath.toLowerCase().includes('uploads')) {
        const parts = cleanPath.split(/uploads/i);
        cleanPath = 'uploads' + parts[parts.length - 1];
      }
      const baseUrl = image_base_url?.endsWith('/') ? image_base_url.slice(0, -1) : image_base_url;
      return `${baseUrl}/${cleanPath}`;
    }
    return `https://image.tmdb.org/t/p/w500${rawPath}`;
  }

  // Handle adding a date/time slot to the local state object
  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return
    const [date, time] = dateTimeInput.split("T")
    setDateTimeSelection(prev => {
      const times = prev[date] || []
      return !times.includes(time) ? { ...prev, [date]: [...times, time] } : prev
    })
    setDateTimeInput("")
  }

  // Remove a specific time slot
  const handleRemoveTime = (date, time) => {
    setDateTimeSelection(prev => {
      const filteredTimes = (prev[date] || []).filter(t => t !== time)
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [date]: filteredTimes }
    })
  }

  // Submit to Backend
  const handleSubmit = async () => {
    if (!selectedMovie) return toast.error('Please select a movie');
    if (Object.keys(dateTimeSelection).length === 0) return toast.error('Add at least one showtime');
    if (!showPrice) return toast.error('Please enter a price');

    try {
      setAddingShow(true)
      const token = await getToken()

      // Format payload for backend showController.js
      const payload = {
        movieID: String(selectedMovie),
        showInput: Object.entries(dateTimeSelection).map(([date, times]) => ({ date, times })),
        showprice: Number(showPrice)
      }

      const { data } = await axios.post('/api/show/add', payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        toast.success('Shows and Trailer synced successfully!');
        // Refresh global shows so home page reflects new data immediately
        fetchShows();
        setSelectedMovie(null);
        setDateTimeSelection({});
        setShowPrice('');
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data);
      toast.error(error.response?.data?.message || "Internal Server Error");
    } finally {
      setAddingShow(false)
    }
  }

  useEffect(() => { if (user) fetchNowPlayingMovies() }, [user])

  if (!nowPlayingMovies || nowPlayingMovies.length === 0) return <Loading />

  // Derived state for the currently selected movie details
  const currentMovie = nowPlayingMovies.find(m => (m._id || m.id) === selectedMovie);

  return (
    <div className="pb-10 max-w-7xl mx-auto px-4">
      <Title text1="Add" text2="Shows" />

      {/* Movie Selection Grid */}
      <div className="flex flex-wrap gap-6 mt-10">
        {nowPlayingMovies.map(movie => {
          const movieId = movie._id || movie.id;
          const isSelected = selectedMovie === movieId;

          return (
            <div key={movieId} onClick={() => setSelectedMovie(movieId)} className="w-44 cursor-pointer group">
              <div className={`relative aspect-[2/3] rounded-2xl overflow-hidden transition-all duration-300 ${
                isSelected ? 'ring-4 ring-primary scale-105 shadow-2xl' : 'hover:scale-102 opacity-80 hover:opacity-100'
              }`}>
                <img
                  src={getPosterUrl(movie)}
                  alt={movie.title}
                  className="w-full h-full object-cover bg-neutral-900"
                  onError={(e) => { e.target.src = "https://placehold.co/500x750?text=Img+Error"; }}
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary p-1 rounded-lg shadow-md z-10">
                    <CheckIcon size={16} className="text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black to-transparent">
                  <div className="flex items-center gap-1 text-white text-xs">
                    <StarIcon size={12} className="text-yellow-500 fill-yellow-500" />
                    {movie.vote_average?.toFixed(1)}
                  </div>
                </div>
              </div>
              <h3 className="text-white font-bold text-sm mt-3 truncate">{movie.title}</h3>
            </div>
          )
        })}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Form Controls */}
        <div className="lg:col-span-2 bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Banknote size={14} /> Ticket Price
              </label>
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-4 rounded-2xl focus-within:border-primary transition-all">
                <span className="text-primary font-bold text-lg">{Currency}</span>
                <input
                  type="number"
                  value={showPrice}
                  onChange={e => setShowPrice(e.target.value)}
                  className="bg-transparent outline-none text-white w-full text-lg"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> Schedule Show
              </label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={dateTimeInput}
                  onChange={e => setDateTimeInput(e.target.value)}
                  className="bg-black/40 border border-white/10 p-4 rounded-2xl text-white outline-none flex-1 focus:border-primary"
                />
                <button onClick={handleDateTimeAdd} className="bg-primary text-white px-6 rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all">
                  ADD
                </button>
              </div>
            </div>
          </div>

          {/* Display Selected Slots */}
          {Object.keys(dateTimeSelection).length > 0 && (
            <div className="pt-8 border-t border-white/5 space-y-4">
              {Object.entries(dateTimeSelection).map(([date, times]) => (
                <div key={date} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-primary text-[10px] font-black uppercase mb-3 tracking-tighter">
                    {new Date(date).toDateString()}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {times.map(time => (
                      <div key={time} className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl text-sm text-gray-200 border border-white/5">
                        <Clock size={14} className="text-gray-500" />
                        {time}
                        <DeleteIcon 
                          size={16} 
                          onClick={() => handleRemoveTime(date, time)} 
                          className="cursor-pointer text-red-500/50 hover:text-red-500 transition-colors ml-2" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Trailer Preview Panel */}
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/5">
            <h4 className="text-gray-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <Youtube size={16} className="text-red-600" /> Trailer Automation
            </h4>
            {selectedMovie ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <img src={getPosterUrl(currentMovie)} className="w-12 h-16 rounded-lg object-cover" alt="" />
                    <div>
                        <p className="text-white text-sm font-bold">{currentMovie?.title}</p>
                        <p className="text-gray-500 text-[10px]">Ready to sync</p>
                    </div>
                </div>

                {/* GENRES DISPLAY */}
                {currentMovie?.genres && currentMovie.genres.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-[10px] font-bold uppercase flex items-center gap-2">
                      <Film size={12} /> Genres
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentMovie.genres.map((genre, idx) => {
                        const genreName = typeof genre === 'string' ? genre : genre.name || genre.id;
                        return (
                          <span key={idx} className="bg-primary/20 text-primary px-2.5 py-1 rounded-lg text-[10px] font-bold border border-primary/30">
                            {genreName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* If it's a local movie with an existing trailer, show a preview link */}
                {currentMovie?.trailer && (
                   <a 
                    href={`https://www.youtube.com/watch?v=${currentMovie.trailer}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-[10px] font-bold py-2 rounded-xl border border-red-600/20 transition-all"
                   >
                     <Youtube size={14} /> VIEW SAVED TRAILER
                   </a>
                )}

                <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-[10px] text-gray-400 leading-relaxed italic">
                  {currentMovie?.isLocal 
                    ? "Local Mode: This movie was manually uploaded. The system will use the trailer key assigned during upload." 
                    : "TMDB Mode: The backend will automatically fetch the official trailer from TMDB on save."}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm italic py-10 text-center">Select a movie to configure shows</p>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={addingShow}
            className="w-full bg-primary py-5 rounded-3xl text-white font-black text-xl hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all shadow-2xl shadow-primary/20"
          >
            {addingShow ? 'SAVING DATA...' : 'SAVE ALL SHOWS'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddShows