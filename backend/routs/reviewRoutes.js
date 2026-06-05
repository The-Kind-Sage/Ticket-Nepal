import express from 'express';
import { addReview, getMovieReviews, deleteReview } from '../controllers/reviewController.js';
import authUser from '../middleware/authUser.js';

const reviewRouter = express.Router();

// Public can view reviews
reviewRouter.get('/:movieID', getMovieReviews);

// Only logged in users can add reviews
reviewRouter.post('/add', authUser, addReview);

// ADD THIS: Route for deleting a review
reviewRouter.delete('/delete/:id', authUser, deleteReview);

export default reviewRouter;