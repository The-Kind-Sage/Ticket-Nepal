import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user: { type: String, required: true, ref: "User" }, // Clerk User ID
    show: { 
  type: mongoose.Schema.Types.ObjectId,
  ref: "Show",
  required: true
},
    amount: { type: Number, required: true },
    seats: { type: [String], required: true }, // Array of booked seat identifiers
    isPaid: { type: Boolean, default: false },
    status: { type: String, enum: ['Paid', 'Refunded', 'Hold'], default: 'Hold' },
    paymentLink: { type: String },
    genres: { type: Array, default: [] } // Store genres from the show's movie
}, { timestamps: true });

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
