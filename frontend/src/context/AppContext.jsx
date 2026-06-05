import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [shows, setShows] = useState([]);
  const [favoritesMovies, setFavoritesMovies] = useState([]);
  
  // NEW: State for admin dashboard data so it's globally accessible
  const [dashboardData, setDashboardData] = useState(null);

  const image_base_url = import.meta.env.VITE_BACKEND_URL;

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchIsAdmin = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsAdmin(res.data.isAdmin);
    } catch (error) {
      console.error("Admin check failed:", error);
      setIsAdmin(false);
    } finally {
      setAdminChecked(true); 
    }
  };

  // NEW: Global function to fetch/refresh Dashboard data
  // Using useCallback so it can be called inside other useEffects safely
  const fetchDashboardData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setDashboardData(data.dashboardData);
    } catch (error) {
      console.error("Dashboard refresh failed:", error);
    }
  }, [isAdmin, getToken]);

  const fetchShows = async () => {
    try {
      const res = await axios.get("/api/show/all-tmdb");
      if (res.data.success) {
        setShows(res.data.shows);
      }
    } catch (error) {
      console.error("Fetch shows error:", error);
    }
  };

  const fetchFavoritesMovies = async () => {
    try {
      const token = await getToken();
      const res = await axios.get('/api/users/favorite', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.movies)) {
        setFavoritesMovies(res.data.movies);
      } else {
        setFavoritesMovies([]);
      }
    } catch (error) {
      console.error("Fetch favorites error:", error);
      setFavoritesMovies([]);
    }
  };

  // --- HELPER: RESOLVE POSTER URL ---
  // Adding this to context means you don't have to rewrite image logic in 10 files
  const resolveMovieImage = (movie) => {
    if (!movie) return "https://via.placeholder.com/500x750?text=No+Data";
    const path = movie.poster_path || movie.poster;
    if (!path) return "https://via.placeholder.com/500x750?text=No+Image";

    if (path.includes('uploads') || !path.startsWith('/')) {
      const cleanPath = path.replace(/\\/g, '/').replace(/^\//, "");
      return `${image_base_url}/${cleanPath}`;
    }
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      fetchIsAdmin();
      fetchFavoritesMovies();
    }
  }, [isLoaded, user]);

  // Trigger dashboard fetch once admin status is confirmed
  useEffect(() => {
    if (isAdmin) fetchDashboardData();
  }, [isAdmin, fetchDashboardData]);

  useEffect(() => {
    if (!adminChecked) return;
    if (!isAdmin && location.pathname.startsWith("/admin")) {
      toast.error("Unauthorized Access");
      navigate("/");
    }
  }, [adminChecked, isAdmin, location.pathname, navigate]);

  const value = {
    user,
    isAdmin,
    adminChecked,
    shows,
    favoritesMovies,
    dashboardData,      // NEW
    fetchDashboardData, // NEW
    resolveMovieImage,  // NEW
    fetchIsAdmin,
    fetchFavoritesMovies,
    fetchShows,         // Added so you can manual refresh
    getToken,
    navigate,
    axios,
    image_base_url,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);