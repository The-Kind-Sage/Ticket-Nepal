import Booking from "../models/Booking.js";
import crypto from "crypto";

const ESEWA_CONFIG = {
  MERCHANT_CODE: "EPAYTEST",
  SECRET_KEY: "8gBm/:&EnhH.1/q",
  PAYMENT_URL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  SUCCESS_URL: "http://localhost:3000/api/payment/esewa/success",
  FAILURE_URL: "http://localhost:3000/api/payment/esewa/failure",
};

const generateSignature = (message) => {
  const hmac = crypto.createHmac("sha256", ESEWA_CONFIG.SECRET_KEY);
  hmac.update(message);
  return hmac.digest("base64");
};

export const esewaInit = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const total_amount = String(booking.amount);
    const transaction_uuid = `${booking._id}-${Date.now()}`;

    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_CONFIG.MERCHANT_CODE}`;
    const signature = generateSignature(message);

    const formData = {
      amount: total_amount,
      tax_amount: "0",
      total_amount: total_amount,
      transaction_uuid: transaction_uuid,
      product_code: ESEWA_CONFIG.MERCHANT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: ESEWA_CONFIG.SUCCESS_URL,
      failure_url: ESEWA_CONFIG.FAILURE_URL,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    };

    res.json({
      success: true,
      payment_url: ESEWA_CONFIG.PAYMENT_URL,
      formData,
    });
  } catch (error) {
    console.error("esewaInit error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// 2. SUCCESS CALLBACK
// ========================================
export const esewaSuccess = async (req, res) => {
  try {
    const { data } = req.query;
    // Redirect to My Bookings with a fail status if no data
    if (!data) return res.redirect("http://localhost:5173/my-bookings?status=failed");

    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));

    if (decoded.status !== "COMPLETE") {
      return res.redirect("http://localhost:5173/my-bookings?status=failed");
    }

    const bookingId = decoded.transaction_uuid.split("-")[0];
    const booking = await Booking.findById(bookingId);

    if (!booking) return res.redirect("http://localhost:5173/my-bookings?status=failed");

    // ✅ Update Booking Status
    booking.isPaid = true;
    booking.paymentMethod = "ESEWA";
    booking.paymentDate = new Date();
    booking.transactionId = decoded.transaction_code;

    await booking.save();

    // 🚀 REDIRECT TO MY BOOKINGS WITH SUCCESS STATUS
    return res.redirect("http://localhost:5173/my-bookings?status=success");
  } catch (error) {
    console.error("esewaSuccess error:", error.message);
    return res.redirect("http://localhost:5173/my-bookings?status=error");
  }
};

// ========================================
// 3. FAILURE CALLBACK
// ========================================
export const esewaFailure = async (req, res) => {
  // 🚀 REDIRECT TO MY BOOKINGS WITH FAILED STATUS
  return res.redirect("http://localhost:5173/my-bookings?status=failed");
};