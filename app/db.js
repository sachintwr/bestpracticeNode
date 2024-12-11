import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const connection = await mongoose.connect('mongodb://localhost:27017/mydatabase');
        console.log(`MongoDB Connected: ${connection.connection.host}`);

        // Event listeners for MongoDB connection events
        mongoose.connection.on('error', (error) => {
            console.error(`MongoDB connection error: ${error}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            // Attempt to reconnect
            connectDB();
        });
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};


export default connectDB;
