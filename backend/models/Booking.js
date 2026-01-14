import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user: { type: String, required: true, ref: "User" }, // Clerk User ID
    show: { type: String, required: true, ref: "Show" }, // Show ID
    amount: { type: Number, required: true },
    seats: { type: [String], required: true }, // Array of booked seat identifiers
    isPaid: { type: Boolean, default: false },
    paymentLink: { type: String }
}, { timestamps: true });

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
