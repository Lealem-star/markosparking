const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const connectDB = async () => {
    if (!MONGODB_URI) {
        console.error('MongoDB connection string is not defined (set MONGODB_URI or MONODB_URI in .env)');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        mongoose.connection.once('open', () => {
            console.log('Connected to database');
        });

        mongoose.connection.on('error', (err) => {
            console.log('Error connecting to database  ', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });
    } catch (error) {
        console.error('Failed to connect to database:', error.message);
        console.error('Please check:');
        console.error('1. Your internet connection');
        console.error('2. MongoDB Atlas IP whitelist settings');
        console.error('3. MongoDB connection string in .env file');
        console.error('4. MongoDB Atlas cluster status');
    }
};

module.exports = { connectDB };
