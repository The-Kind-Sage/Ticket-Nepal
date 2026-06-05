import express from "express";
import { esewaInit, esewaSuccess, esewaFailure } 
  from "../controllers/paymentController.js";

const router = express.Router();

// INIT PAYMENT
router.post("/esewa/init", esewaInit);

// SUCCESS CALLBACK
router.get("/esewa/success", esewaSuccess);

// FAILURE CALLBACK
router.get("/esewa/failure", esewaFailure);

export default router;
