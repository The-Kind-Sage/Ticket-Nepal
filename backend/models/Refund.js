import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Booking", 
    required: true,
    unique: true // ⛔ Essential: Prevents duplicate refunds for the same seats/ID
  },
  userId: { type: String, required: true }, 
  email: { type: String, required: true },
  phone: { type: String, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    default: "Pending", 
    enum: ["Pending", "Approved", "Rejected"] 
  }
}, { timestamps: true });

const Refund = mongoose.models.user_Refund || mongoose.model("user_Refund", refundSchema);
export default Refund;