// routes/userRoutes.js
import express from 'express';
import {
  getFavoriteMovies,
  getUserBookings,
  updateFavoriteMovie
} from '../controllers/userControllers.js';

const userRouter = express.Router();

userRouter.get('/bookings', getUserBookings);
userRouter.post('/favorite-movie', updateFavoriteMovie);
userRouter.get('/favorite', getFavoriteMovies);

export default userRouter;
