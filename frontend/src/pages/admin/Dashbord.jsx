import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UsersIcon, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import BlurCircle from '../../components/BlurCircle';
import { dateFormat } from '../../lib/dateFormate';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { axios, getToken, user, resolveMovieImage } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    activeShows: [],
    totalUsers: 0
  });

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingShowId, setEditingShowId] = useState(null);
  const [editPayload, setEditPayload] = useState({ showTime: "", showprice: "" });

  const dashboardCards = [
    { title: "Total Bookings", value: dashboardData.totalBookings || "0", icon: ChartLineIcon },
    { title: "Total Revenue", value: `${currency} ${dashboardData.totalEarnings || "0"}`, icon: CircleDollarSignIcon },
    { title: "Active Shows", value: dashboardData.activeShows?.length || "0", icon: PlayCircleIcon },
    { title: "Total Users", value: dashboardData.totalUsers || "0", icon: UsersIcon }
  ];

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error(data.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      toast.error("Dashboard data fetch failed");
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE SHOW LOGIC ---
  const handleDeleteShow = async (showId) => {
    if (!window.confirm("Are you sure you want to delete this show? This will also affect existing bookings.")) return;

    try {
      setDeletingId(showId);
      
      const token = await getToken();
      // ✅ URL matched to: adminRouter.delete("/delete-show/:id", ...)
      const { data } = await axios.delete(`/api/admin/delete-show/${showId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success("Show deleted successfully");
        
        // Remove from UI immediately
        setDashboardData(prev => ({
          ...prev,
          activeShows: prev.activeShows.filter(show => show._id !== showId)
        }));
      } else {
        // This handles the "Cannot delete show due to paid bookings" message from backend
        toast.error(data.message || "Failed to delete show");
      }
    } catch (error) {
      console.error("Delete error details:", error.response);
      toast.error(error.response?.data?.message || "Error connecting to server");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditShow = (show) => {
    setEditingShowId(show._id);
    setEditPayload({
      showTime: new Date(show.showTime).toISOString().slice(0, 16),
      showprice: show.showprice?.toString() || "",
    });
  };

  const handleSaveShow = async (showId) => {
    try {
      const token = await getToken();
      const body = {
        showTime: editPayload.showTime,
        showprice: Number(editPayload.showprice),
      };
      const { data } = await axios.put(`/api/admin/update-show/${showId}`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success("Show updated successfully");
        setDashboardData((prev) => ({
          ...prev,
          activeShows: prev.activeShows.map((show) =>
            show._id === showId
              ? { ...show, showTime: data.show.showTime, showprice: data.show.showprice }
              : show
          ),
        }));
        setEditingShowId(null);
      } else {
        toast.error(data.message || "Failed to update show");
      }
    } catch (error) {
      console.error("Update show error:", error.response || error);
      toast.error(error.response?.data?.message || "Error updating show");
    }
  };

  const handleCancelEdit = () => {
    setEditingShowId(null);
    setEditPayload({ showTime: "", showprice: "" });
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  if (loading) return <Loading />;

  return (
    <div className="pb-20">
      <Title text1="Admin" text2=" Dashboard" />

      {/* Dashboard Cards */}
      <div className="relative flex flex-wrap gap-4 mt-6">
        <BlurCircle top="-100px" left="0" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-6 py-5 bg-primary/5 border border-primary/10 rounded-2xl hover:bg-primary/10 transition-all duration-300"
            >
              <div>
                <h1 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{card.title}</h1>
                <p className="text-2xl font-black mt-1 text-white">{card.value}</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Shows Header */}
      <div className="mt-12 flex items-center justify-between">
        <p className="text-xl font-bold">Active Shows</p>
        <span className="text-xs text-gray-500 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/5">
          {dashboardData.activeShows.length} Shows Found
        </span>
      </div>

      <div className="relative flex flex-wrap gap-6 mt-6">
        <BlurCircle top="100px" left="10%" />

        {dashboardData.activeShows.length === 0 ? (
          <div className="w-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-gray-500">No active shows scheduled at the moment.</p>
          </div>
        ) : (
          dashboardData.activeShows.map((show) => (
            <div
              key={show._id}
              className="w-56 group relative rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/5 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 shadow-xl"
            >
              {/* DELETE BUTTON */}
              <button
                disabled={deletingId === show._id}
                onClick={() => handleDeleteShow(show._id)}
                className={`absolute top-2 left-2 z-20 p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-lg ${deletingId === show._id ? 'cursor-wait animate-pulse' : ''}`}
                title="Delete Show"
              >
                <Trash2 size={16} />
              </button>

              {/* Movie Poster */}
              <div className="relative aspect-[2/3] overflow-hidden">
                <img
                  src={resolveMovieImage(show.Movie)}
                  alt={show.Movie?.title || "Unknown Movie"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { e.target.src = "https://placehold.co/500x750?text=Error+Loading"; }}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
                  <StarIcon className="w-3 h-3 text-pink-500 fill-pink-500" />
                  <span className="text-[10px] font-bold">{show.Movie?.vote_average?.toFixed(1) || "0.0"}</span>
                </div>
              </div>

              {/* Movie Details */}
              <div className="p-4 space-y-2">
                <p className="font-bold text-sm truncate text-white group-hover:text-primary transition-colors">
                  {show.Movie?.title || "Unknown Movie"}
                </p>

                {editingShowId === show._id ? (
                  <div className="space-y-2">
                    <input
                      type="datetime-local"
                      value={editPayload.showTime}
                      onChange={(e) => setEditPayload((prev) => ({ ...prev, showTime: e.target.value }))}
                      className="w-full text-xs p-2 rounded bg-black border border-white/20"
                    />
                    <input
                      type="number"
                      min="0"
                      value={editPayload.showprice}
                      onChange={(e) => setEditPayload((prev) => ({ ...prev, showprice: e.target.value }))}
                      className="w-full text-xs p-2 rounded bg-black border border-white/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveShow(show._id)}
                        className="flex-1 py-2 rounded-lg bg-primary text-black font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-primary font-black text-base">
                        {currency}{show.showprice || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">
                        {dateFormat(show.showTime).split(',')[0]}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 bg-white/5 p-1 rounded mt-2 text-center border border-white/5">
                      {dateFormat(show.showTime).split(',')[1]}
                    </p>
                    <button
                      onClick={() => handleEditShow(show)}
                      className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Edit Date/Time/Price
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;