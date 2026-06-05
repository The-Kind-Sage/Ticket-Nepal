import crypto from "crypto";

export const ESEWA_CONFIG = {
  MERCHANT_CODE: "EPAYTEST",
  PAYMENT_URL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",

  SUCCESS_URL: "http://localhost:3000/api/payment/esewa/success",
  FAILURE_URL: "http://localhost:3000/api/payment/esewa/failure",

  SECRET: "8gBm/:&EnhH.1/q"
};

// ✅ CORRECT SIGNATURE FUNCTION
export const generateSignature = (message) => {
  const hash = crypto
    .createHmac("sha256", ESEWA_CONFIG.SECRET)
    .update(message)
    .digest("base64");

  return hash;
};
