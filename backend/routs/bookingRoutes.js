import express from "express";
import { createBooking, getOccupiedSeats } from "../controllers/BookingControllers.js";



const  bookingRouter = express.Router();



bookingRouter.post('/create', createBooking);
bookingRouter.get('/seats/:showID', getOccupiedSeats);

export default bookingRouter;
