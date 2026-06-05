import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { updateUserPreferredGenres, syncUserWithClerk } from "./userControllers.js";

// Check seat availability
export const checkSeatAvailability = async (showID, selectedSeats) => {
    try {
        const show = await Show.findById(showID);
        if (!show) return false;

        const occupiedSeats = show.occupaiedSeats || {};
        const isAnyTaken = selectedSeats.some(seat => occupiedSeats[seat] !== undefined);
        return !isAnyTaken;
    } catch (error) {
        console.error("checkSeatAvailability error:", error.message);
        return false;
    }
};

// Create booking
export const createBooking = async (req, res) => {
    try {
        const { userId } = req.auth(); // from auth middleware
        const { showID, selectedSeats } = req.body;

        // SYNC USER DATA FROM CLERK TO DATABASE
        await syncUserWithClerk(userId);

        // Check seat availability
        const available = await checkSeatAvailability(showID, selectedSeats);
        if (!available) {
            return res.json({ success: false, message: "Some seats are already booked." });
        }

        // Fetch show data
        const showData = await Show.findById(showID);
        if (!showData) return res.json({ success: false, message: "Show not found" });

        // Extract genres from the show
        const movieGenres = showData.genres || [];

        // Create booking
        const booking = await Booking.create({
            user: userId,
            show: showID,
            amount: showData.showprice * selectedSeats.length,
            seats: selectedSeats,
            isPaid: false,
            genres: movieGenres // Add genres to booking
        });

        // Mark seats as occupied
        showData.occupaiedSeats = showData.occupaiedSeats || {};
        selectedSeats.forEach(seat => (showData.occupaiedSeats[seat] = userId));
        showData.markModified("occupaiedSeats");
        await showData.save();

        // Update user's preferred genres based on their bookings
        await updateUserPreferredGenres(userId);

        // esewa payment gateway initialize 

        res.json({ success: true, message: "Booking created successfully", booking });
    } catch (error) {
        console.error("createBooking error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get occupied seats
export const getOccupiedSeats = async (req, res) => {
    try {
        const { showID } = req.params;
        const show = await Show.findById(showID);
        if (!show) return res.json({ success: false, message: "Show not found" });

        const occupiedSeats = Object.keys(show.occupaiedSeats || {});
        res.json({ success: true, occupiedSeats });
    } catch (error) {
        console.error("getOccupiedSeats error:", error.message);
        res.json({ success: false, message: error.message });
    }
};