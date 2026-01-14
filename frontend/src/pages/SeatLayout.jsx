import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import isoTimeFormate from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import screenImage from "../assets/screenImage.svg";

const SeatLayout = () => {
  const groupRows = [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]];
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
      console.error(error.message);
      toast.error("Failed to load show data");
    }
  };

  const getOccupiedSeats = async (showId) => {
    if (!showId) return;
    try {
      const { data } = await axios.get(`/api/booking/seats/${showId}`);
      if (data.success) setOccupiedSeats(data.occupiedSeats || []);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSeatClick = (seatId) => {
    if (!selectedTime) return toast.error("Select a time first.");
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5)
      return toast.error("You can select up to 5 seats.");
    if (occupiedSeats.includes(seatId)) return toast.error("Seat already booked.");

    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: count }, (_, i) => {
        const seatId = `${row}${i + 1}`;
        const isSelected = selectedSeats.includes(seatId);
        const isOccupied = occupiedSeats.includes(seatId);
        return (
          <button
            key={seatId}
            onClick={() => handleSeatClick(seatId)}
            className={`h-8 w-8 rounded border border-primary/60 cursor-pointer 
              ${isSelected ? "bg-primary text-white" : ""} 
              ${isOccupied ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isOccupied}
          >
            {seatId}
          </button>
        );
      })}
    </div>
  );

  const bookTickets = async () => {
    if (!user) return toast.error("Login first");
    if (!selectedTime || selectedSeats.length === 0)
      return toast.error("Select time and seats");

    const showId = selectedTime?.showID || selectedTime?._id;
    try {
      const { data } = await axios.post(
        "/api/booking/create",
        { showID: showId, selectedSeats },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message);
        navigate("/my-bookings");
      } else toast.error(data.message);
    } catch (error) {
      console.error(error.message);
      toast.error("Booking failed");
    }
  };

  useEffect(() => { getShow(); }, [id]);
  useEffect(() => { if (selectedTime) getOccupiedSeats(selectedTime?.showID || selectedTime?._id); }, [selectedTime]);

  if (!show) return <Loading />;

  return (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      <div className="w-60 bg-primary/10 border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">Available Timing</p>
        <div className="mt-5 space-y-1">
          {show?.dateTime?.[date]?.length > 0 ? (
            show.dateTime[date].map((item) => (
              <div
                key={item.time}
                onClick={() => setSelectedTime(item)}
                className={`flex items-center gap-2 px-6 w-max rounded-r-md cursor-pointer transition 
                  ${selectedTime?.time === item.time ? "bg-primary text-white" : "hover:bg-primary/20"}`}
              >
                <ClockIcon className="w-4 h-4" />
                <p className="text-sm">{isoTimeFormate(item.time)}</p>
              </div>
            ))
          ) : (
            <p className="px-6 text-gray-400 text-sm">No timings available</p>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="0px" right="0px" />
        <h1 className="text-2xl font-semibold mb-4">Select your seat</h1>
        <img src={screenImage} alt="screen" className="mb-2" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>

        <div className="flex flex-col items-center mt-10 text-xs text-gray-300">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6">
            {groupRows[0].map((row) => renderSeats(row))}
          </div>
          <div className="grid grid-cols-2 gap-11">
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx}>{group.map((row) => renderSeats(row))}</div>
            ))}
          </div>
        </div>

        <button
          onClick={bookTickets}
          className="flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95"
        >
          Proceed to Checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SeatLayout;
