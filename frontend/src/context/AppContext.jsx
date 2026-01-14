import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Set base URL from environment variable
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
 const [shows, setShows] = useState([]);
  const [favoritesMovies, setFavoritesMovies] = useState([]);
  const image_base_url = import.meta.env.VITE_TMDB_BASE_URL;

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ------------------------------
  // Fetch admin status
  // ------------------------------
  const fetchIsAdmin = async () => {
    try {
      const token = await getToken();
      const res = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("ADMIN API RESPONSE:", res.data);
      setIsAdmin(res.data.isAdmin);
    } catch (error) {
      console.error("Admin check failed:", error);
      setIsAdmin(false);
    } finally {
      setAdminChecked(true); // Mark admin check as done
    }
  };

  // ------------------------------
  // Fetch all shows
  // ------------------------------
 const fetchShows = async () => {
  try {
    const res = await axios.get("/api/show/all-tmdb"); // new endpoint
    if (res.data.success) {
      setShows(res.data.shows);
    } else {
      toast.error(res.data.message || "Failed to fetch shows");
    }
  } catch (error) {
    console.error("Fetch shows error:", error);
  }
};


  // ------------------------------
  // Fetch user's favorite movies
  // ------------------------------
 const fetchFavoritesMovies = async () => {
  try {
    const token = await getToken();
   const res = await axios.get('/api/users/favorite', {
  headers: { Authorization: `Bearer ${token}` },
});
    if (res.data.success && Array.isArray(res.data.movies)) {
      setFavoritesMovies(res.data.movies);
    } else {
      setFavoritesMovies([]); // always fallback
      toast.error(res.data.message || "Failed to fetch favorite movies");
    }
  } catch (error) {
    console.error("Fetch favorites error:", error);
    setFavoritesMovies([]); // fallback
  }
};


  // ------------------------------
  // Load shows once on mount
  // ------------------------------
  useEffect(() => {
    fetchShows();
  }, []);

  // ------------------------------
  // Load user-related data once Clerk user is loaded
  // ------------------------------
  useEffect(() => {
    if (isLoaded && user) {
      fetchIsAdmin();
      fetchFavoritesMovies();
    }
  }, [isLoaded, user]);

  // ------------------------------
  // Protect admin routes
  // ------------------------------
  useEffect(() => {
    if (!adminChecked) return; // wait until admin check finishes

    if (!isAdmin && location.pathname.startsWith("/admin")) {
      toast.error("You are not authorized to access admin panel");
      navigate("/"); // redirect non-admin users
    }
  }, [adminChecked, isAdmin, location.pathname, navigate]);

  // ------------------------------
  // Context value
  // ------------------------------
  const value = {
    user,
    isAdmin,
    adminChecked,
    shows,
    favoritesMovies,
    fetchIsAdmin,
    fetchFavoritesMovies,
    getToken,
    navigate,
    axios,
    image_base_url,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
