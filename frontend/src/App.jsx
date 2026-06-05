import React from "react";
import { Route, Routes, useLocation, Outlet } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import SeatLayout from "./pages/SeatLayout";
import Favourite from "./pages/Favourite";
import MyBooking from "./pages/MyBooking";

// Admin pages
import Layout from "./pages/admin/Layout";
import Dashbord from "./pages/admin/Dashbord";
import AddShows from "./pages/admin/AddShows";
import ListShows from "./pages/admin/ListShows";
import ListBooking from "./pages/admin/ListBooking";
import AddMovie from "./pages/admin/AddMovie";

import { useAppContext } from "./context/AppContext";

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const { user, isAdmin, adminChecked } = useAppContext(); // ✅ include adminChecked

  return (
    <>
      <Toaster />

      {/* Show Navbar only for non-admin routes */}
      {!isAdminRoute && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/seatlayout/:id/:date" element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBooking />} />
        <Route path="/favorite" element={<Favourite />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            !adminChecked ? (
              <div className="min-h-screen flex justify-center items-center">
                <p className="text-gray-500 text-lg">Loading...</p>
              </div>
            ) : user && isAdmin ? (
              // ✅ Render admin layout with Outlet for nested pages
              <Layout>
                <Outlet />
              </Layout>
            ) : (
              <div className="min-h-screen flex justify-center items-center">
                {user ? (
                  <p className="text-red-500 text-lg">
                    You are not authorized to access this page.
                  </p>
                ) : (
                  <SignIn fallbackRedirectUrl={"/admin"} />
                )}
              </div>
            )
          }
        >
          {/* Nested admin pages */}
          <Route index element={<Dashbord />} />
          <Route path="add-shows" element={<AddShows />} />
          <Route path="list-shows" element={<ListShows />} />
          <Route path="list-bookings" element={<ListBooking />} />
          <Route path="add-movie" element={<AddMovie />} />
        </Route>
      </Routes>

      {/* Show Footer only for non-admin routes */}
      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;
