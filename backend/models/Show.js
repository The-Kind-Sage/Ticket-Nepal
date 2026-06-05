import mongoose from "mongoose";
import Movie from "./Movies.js";

const showSchema = new mongoose.Schema({
    Movie: { type: String, required: true, ref: 'Movie' },
    showTime: { type: Date, required: true },
    showprice: { type: Number, required: true },
    occupaiedSeats: { type: Object, default: {} },
    genres: { type: Array, default: [] }, // Store genres from the associated movie
}, { minimize: false });

const Show = mongoose.models.Show || mongoose.model("Show", showSchema);
export default Show;