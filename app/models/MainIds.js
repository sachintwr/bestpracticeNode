import mongoose from "mongoose";
const MainIdsSchema = new mongoose.Schema({
    username: {
        type: String,
        min: 3,
        max: 20,
        unique: true,
    },
    email: {
        type: String,
        require: true,
        max: 50,
        unique: true
    },
    profilePicture: {
        type: String,
        default: ""
    }
}, { timestamps: true });



export default mongoose.model("MainIds", MainIdsSchema);