import React, { useEffect, useState } from 'react'
import { dummyShowsData } from '../../assets/assets'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import { CheckIcon, Currency, DeleteIcon, StarIcon } from 'lucide-react'
import { kConveter } from '../../lib/kConveter'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const AddShows = () => {
  
  const {axios, getToken, user, image_base_url} = useAppContext()

  const Currency = import.meta.env.VITE_CURRENCY
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");


  const [addingShow, setAddingShow] = useState(false);

const featchNowPlayingMovies = async () => {
  try {
    const { data } = await axios.get('/api/show/now-playing', {
      headers: {
        Authorization: `Bearer ${await getToken()}`
      }
    });
    if (data.success && Array.isArray(data.movies)) {
      setNowPlayingMovies(data.movies);
    } else {
      setNowPlayingMovies([]); // ensure it's always an array
      console.error("Failed to fetch movies or empty response");
    }
  } catch (error) {
    console.error("Now playing movies fetch error:", error);
    setNowPlayingMovies([]); // ensure it's always an array
  }
};

  const handleDateTimeAdd = ()=>{
    if (!dateTimeInput) return;
    const[date, time ] = dateTimeInput.split("T");
    if(!date || !time) return;

    setDateTimeSelection((prev)=>{
      const times = prev[date] || [];
      if(!times.includes(time)){
        return {...prev,[date]:[...times,time]};
      }
      return prev;
    });
  };

    const handleRemoveTime = (date, time) => {
      setDateTimeSelection((prev) => {
        const filteredTimes = prev[date].filter((t) => t !== time);

        if (filteredTimes.length === 0) {
          const { [date]: _, ...rest } = prev;
          return rest;
        }

        return {
          ...prev,
          [date]: filteredTimes,
        };
      });
    };
   const handleSubmit = async () => {
  try {
    setAddingShow(true);

    // Validation
    if (!selectedMovie || Object.keys(dateTimeSelection).length === 0 || !showPrice) {
      toast('Please select movie, date-time and enter show price', { icon: '⚠️' });
      setAddingShow(false);
      return;
    }

    // Prepare show input
    const showInput = Object.entries(dateTimeSelection).map(([date, times]) => ({
      date,
      times,
    }));

    const payload = {
      movieID: selectedMovie,
      showInput,             // must match backend field name
      showprice: Number(showPrice), // match backend field name
    };

    // Send API request
    const { data } = await axios.post('/api/show/add', payload, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });

    if (data.success) {
      toast.success(data.message || 'Show added successfully');
      setSelectedMovie(null);
      setDateTimeSelection({});
      setShowPrice('');
    } else {
      toast.error(data.message || 'Failed to add show');
    }

  } catch (error) {
    console.error("Add show error:", error);
    toast.error('An error occurred. Please try again.');
  }

  setAddingShow(false);
};


  useEffect(() => {
    if(user){
      featchNowPlayingMovies();

    }
    
  }, [user])

  return Array.isArray(nowPlayingMovies) && nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="Add" text2="Shows" />

      <p className="mt-10 text-lg font-medium">Now Playing Movies</p>

      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {nowPlayingMovies.map((movie) => (
            <div
              key={movie.id}
              className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`} 
              onClick={()=> setSelectedMovie(movie.id)}
            >
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={image_base_url + movie.poster_path}
                  alt=""
                  className="w-full object-cover brightness-90"
                />

                <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                  <p className="flex items-center gap-1 text-gray-400">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {movie.vote_average.toFixed(1)}
                  </p>

                  <p className="text-gray-300">
                    {kConveter(movie.vote_count)} votes
                  </p>
                </div>
              </div>

              { selectedMovie === movie.id && (
                <div className=' absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded'>
                  <CheckIcon  className=' w-4 h-4 text-white' strokeWidth={2.5}/>

                </div>
              )}
              <p className=' font-medium truncate'>{movie.title}</p>
              <p className=' text-gray-400 text-sm'>{movie.release_date}</p>
            </div>
          ))}
        </div>
      </div>
{/* {Show price Input } */}
<div className=' mt-8'>
  <label className=' block text-sm font-medium mb-2 '>Show Price</label>
  <div className=' inline-flex items-center gap-2 border border-gray-600 px-2 py-2 rounded-md'>
    <p className=' text-gray-400 text-sm'>{Currency}</p>
    <input min={0} type="number" value={showPrice} onChange={(e) => setShowPrice(e.target.value)} placeholder="Enter show price" className='outline-none'/>

  </div>

</div>

{/* {Date and time} */}
          <div className=' mt-6'>
            <label className=' block text-sm font-medium mb-2 '> Select Date and Time</label>
            <div className=' inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg'>
              <input type="datetime-local" value={dateTimeInput}  onChange={(e)=> setDateTimeInput(e.target.value)} className='outline-none rounded-md'/>
              <button onClick={handleDateTimeAdd} className=' bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer'>
              Add Time

              </button>


            </div>

          </div>
          {/* {Display seleccted time} */}

          {Object.keys(dateTimeSelection).length > 0 && (
            <div className='mt-6'>
              <h2 className='mb-2'>Selected Date-Time</h2>
              <ul className=' space-y-3'>
                {Object.entries(dateTimeSelection).map(([date,times])=>(
                  <li key={date}>
                    <div className=' font-medium'>
                      {date}
                    </div>
                    <div className=' flex flex-wrap gap-2 mt-1 text-sm'>
                      {times.map((time)=>(
                        <div key={time} className=' border border-primary px-2 py-1 flex items-center rounded'>
                          <span>{time}</span>
                          <DeleteIcon onClick={()=> handleRemoveTime (date, time)} 
                            width={15} className=' ml-2 text-red-500 hover:text-red-700 cursor-pointer'/>
                        </div>
                      ))}

                    </div>

                  </li>
                ))}
              </ul>

            </div>
          )}
          <button onClick={handleSubmit} disabled={addingShow} className=' bg-primary text-white px-8 py-2 rounded hover:bg-primary/90 transition-all cursor-pointer'>
            Add Show 
          </button>

    </>
  ) : (
    <Loading />
  )
}

export default AddShows
