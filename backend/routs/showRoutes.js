import express from "express";
import { addNewShow, getAllShows, getNowShowingMovies, getSingleShow, getMoviesByGenre } from "../controllers/ShowController.js";

const showRouter = express.Router();

showRouter.get('/now-playing', getNowShowingMovies)
showRouter.post('/add', addNewShow)
showRouter.get('/all', getAllShows)
showRouter.get('/genre/:genre', getMoviesByGenre)
showRouter.get('/:movieID', getSingleShow)

export default showRouter;
