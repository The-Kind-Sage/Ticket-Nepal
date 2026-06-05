import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon, Info, Monitor, Ticket } from "lucide-react";
import isoTimeFormate from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const SeatLayout = () => {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  const seatGroups = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ];

  const { id, date } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const navigate = useNavigate();
  const { axios, getToken, user } = useAppContext();

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      if (data.success) setShow({ ...data.movie, dateTime: data.dateTime });
      else toast.error("Failed to load show data");
    } catch (error) {
      toast.error("Failed to load show data");
    }
  };

  const getOccupiedSeats = async (showId) => {
    if (!showId) return;
    try {
      const { data } = await axios.get(`/api/booking/seats/${showId}`);
      if (data.success) setOccupiedSeats(data.occupiedSeats || []);
    } catch (error) {
      console.error("Error fetching occupied seats:", error.message);
    }
  };

  const handleSeatClick = (seatId) => {
    if (!selectedTime) return toast.error("Please select a show time first.");
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5)
      return toast.error("Maximum 5 seats allowed per booking.");
    if (occupiedSeats.includes(seatId)) return toast.error("This seat is already booked.");

    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  const renderSeats = (row, rowIndex) => {
    // Elegant curve calculation
    const curveOffset = Math.pow(Math.abs(rowIndex - 4.5), 2) * 1.2; 

    return (
      <div 
        key={row} 
        className="flex items-center justify-center gap-4 mb-4"
        style={{ transform: `translateY(${curveOffset}px)` }}
      >
        <span className="w-8 text-[10px] font-black text-white/10 select-none tracking-tighter">{row}</span>
        <div className="flex items-center gap-8 md:gap-14">
          {seatGroups.map((group, groupIndex) => (
            <div key={`${row}-group-${groupIndex}`} className="flex gap-2.5">
              {group.map((col) => {
                const seatId = `${row}${col}`;
                const isSelected = selectedSeats.includes(seatId);
                const isOccupied = occupiedSeats.includes(seatId);
                return (
                  <button
                    key={seatId}
                    onClick={() => handleSeatClick(seatId)}
                    disabled={isOccupied}
                    className={`h-9 w-9 md:h-11 md:w-11 rounded-xl transition-all duration-500 relative flex items-center justify-center overflow-hidden
                      ${isOccupied ? "bg-zinc-900/50 border border-zinc-800/50 cursor-not-allowed" : 
                        isSelected ? "bg-red-600 border border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.6)] -translate-y-1 scale-110 z-10" : 
                        "bg-zinc-800/30 border border-white/5 hover:border-red-500/40 hover:bg-zinc-800/60 cursor-pointer"}
                    `}
                  >
                    <span className={`text-[10px] font-bold z-20 ${isSelected ? "text-white" : isOccupied ? "text-zinc-700" : "text-zinc-500"}`}>
                      {col}
                    </span>
                    {/* Visual "Seat Back" Detail */}
                    {!isOccupied && (
                       <div className={`absolute inset-x-1 top-1 h-1/2 rounded-lg border-t ${isSelected ? 'border-white/20' : 'border-white/5'}`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <span className="w-8 text-[10px] font-black text-white/10 select-none tracking-tighter text-right">{row}</span>
      </div>
    );
  };

  const bookTickets = async () => {
    if (!user) return toast.error("Please login to continue");
    if (!selectedTime || selectedSeats.length === 0)
      return toast.error("Please select both time and seats");

    const showId = selectedTime?.showID || selectedTime?._id;
    try {
      const { data } = await axios.post(
        "/api/booking/create",
        { showID: showId, selectedSeats },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Booking initiated!");
        navigate("/my-bookings");
      } else toast.error(data.message);
    } catch (error) {
      toast.error("Booking failed. Please try again.");
    }
  };

  useEffect(() => { getShow(); }, [id]);
  useEffect(() => { 
    if (selectedTime) getOccupiedSeats(selectedTime?.showID || selectedTime?._id); 
  }, [selectedTime]);

  if (!show) return <Loading />;
  const totalPrice = selectedSeats.length * (selectedTime?.showprice || 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-44 overflow-hidden relative font-sans selection:bg-red-500/30">
      <BlurCircle top="-10%" left="-10%" color="rgba(220, 38, 38, 0.1)" />
      <BlurCircle bottom="-10%" right="-10%" color="rgba(220, 38, 38, 0.05)" />

      <div className="max-w-[1600px] mx-auto px-8 grid lg:grid-cols-12 gap-12">
        
        {/* LEFT: TIME SELECTION */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-2xl rounded-[2rem] p-7 sticky top-28 shadow-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-600/10 rounded-lg">
                <ClockIcon size={18} className="text-red-500" />
              </div>
              <h2 className="text-xs font-black text-zinc-100 uppercase tracking-[0.2em]">Showtimes</h2>
            </div>
            
            <div className="space-y-3 mb-8">
              {show?.dateTime?.[date]?.length > 0 ? (
                show.dateTime[date].map((item) => (
                  <button
                    key={item.time}
                    onClick={() => { setSelectedTime(item); setSelectedSeats([]); }}
                    className={`w-full group flex flex-col p-4 rounded-2xl border transition-all duration-500
                      ${selectedTime?.time === item.time 
                        ? "bg-red-600 border-red-400 shadow-[0_10px_30px_rgba(220,38,38,0.3)]" 
                        : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]"}`}
                  >
                    <div className="flex justify-between items-center w-full">
                        <span className="font-black text-xl tracking-tight">{isoTimeFormate(item.time)}</span>
                        <Ticket size={14} className={selectedTime?.time === item.time ? "text-white" : "text-white/20 group-hover:text-red-500 transition-colors"} />
                    </div>
                    <span className={`text-[10px] uppercase font-bold mt-1 ${selectedTime?.time === item.time ? "text-red-200" : "text-zinc-500"}`}>
                        NPR {item.showprice}
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl">
                    <p className="text-zinc-600 text-xs uppercase tracking-widest">No shows found</p>
                </div>
              )}
            </div>
            
            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-[10px] leading-relaxed text-zinc-500 flex gap-4">
              <Info size={24} className="text-red-600 shrink-0" />
              <p>Tickets are non-refundable and non-transferable. Please double check your selection.</p>
            </div>
          </div>
        </div>

        {/* CENTER: SEAT LAYOUT */}
        <div className="lg:col-span-9 flex flex-col items-center">
          
          {/* THE SCREEN - NEW CURVED DESIGN */}
          <div className="w-full max-w-4xl mb-32 relative group">
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full h-32 bg-red-600/10 blur-[80px] rounded-full opacity-50"></div>
             <div className="relative h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_25px_#dc2626]"></div>
             </div>
             <div className="mt-6 text-center">
                <span className="text-[10px] font-black tracking-[1.5em] text-zinc-700 uppercase ml-[1.5em]">Experience Cinema</span>
             </div>
          </div>

          {/* SEAT GRID */}
          <div className="w-full overflow-x-auto no-scrollbar pb-20">
            <div className="min-w-[800px] px-10">
              {rows.map((row, idx) => renderSeats(row, idx))}
            </div>
          </div>

          {/* LEGEND - MINIMALIST */}
          <div className="flex gap-10 p-6 bg-zinc-900/30 border border-white/5 rounded-3xl backdrop-blur-md">
            {[
              { label: "Available", class: "bg-zinc-800/50 border-white/5" },
              { label: "Selected", class: "bg-red-600 border-red-400 shadow-lg shadow-red-600/30" },
              { label: "Occupied", class: "bg-zinc-900 opacity-20" }
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full border ${item.class}`}></div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BAR - REVAMPED */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-zinc-900/80 backdrop-blur-3xl border border-white/10 p-5 md:p-6 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8 md:gap-12 px-4">
              <div>
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-3">Selected Seats</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map(s => (
                    <span key={s} className="bg-white/5 border border-white/10 text-white text-[11px] px-4 py-1.5 rounded-full font-black">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="w-px h-12 bg-white/5 hidden sm:block"></div>
              
              <div>
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Total Payable</p>
                <div className="text-3xl font-black text-white tracking-tighter">
                    <span className="text-red-500 mr-2 text-xl italic font-medium">NPR</span>
                    {totalPrice.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              onClick={bookTickets}
              className="w-full md:w-auto relative group overflow-hidden px-14 py-5 bg-red-600 hover:bg-red-500 transition-all rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 shadow-2xl shadow-red-600/20"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                Secure Checkout
                <ArrowRightIcon size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
              {/* Button Shine Effect */}
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-[45deg] -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatLayout;