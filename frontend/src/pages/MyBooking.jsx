import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFormate";
import { useAppContext } from "../context/AppContext";

const MyBooking = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const { axios, getToken, user, image_base_url } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/users/bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setBookings(data.bookings || []);
    } catch (error) {
      console.error("getMyBookings error:", error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) getMyBookings();
  }, [user]);

  if (isLoading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" left="600px" />

      <h1 className="text-lg font-semibold mb-4">My Booking</h1>

      {bookings.length === 0 && (
        <p className="text-gray-400 mt-6">You have no bookings yet.</p>
      )}

      {bookings.map((item, index) => {
        const bookedSeats = item.seats || []; // <-- FIXED
        const movie = item.show?.Movie || {};
        const showTime = item.show?.showTime || item.show?.showDateTime; // fallback if property differs

        return (
          <div
            key={index}
            className="flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
          >
            <div className="flex flex-col md:flex-row">
              <img
                src={movie.poster_path ? image_base_url + movie.poster_path : ""}
                alt={movie.title || "Movie Poster"}
                className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded"
              />
              <div className="flex flex-col p-4">
                <p className="text-lg font-semibold">{movie.title || "-"}</p>
                <p className="text-gray-400 text-sm">
                  {movie.runtime ? timeFormat(movie.runtime) : "-"}
                </p>
                <p className="text-gray-400 text-sm mt-auto">
                  {showTime ? dateFormat(showTime) : "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:items-end md:text-right justify-between p-4">
              <div className="flex items-center gap-4">
                <p className="text-2xl font-semibold mb-3">
                  {currency}
                  {item.amount || 0}
                </p>
                {!item.isPaid && (
                  <button className="bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer">
                    Pay Now
                  </button>
                )}
              </div>

              <div className="text-sm">
                <p>
                  <span className="text-gray-400">Total Tickets:</span>{" "}
                  {bookedSeats.length}
                </p>
                <p>
                  <span className="text-gray-400">Seat Number:</span>{" "}
                  {bookedSeats.join(", ") || "-"}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyBooking;
