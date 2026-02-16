import app from '../app.js';
import connectDB from '../database/connection.js';

// Cache database connection for serverless
let isConnected = false;

export default async function handler(req, res) {
    try {
        // Ensure database is connected before handling the request
        if (!isConnected) {
            await connectDB();
            isConnected = true;
        }

        // Forward request to Express app
        return app(req, res);
    } catch (error) {
        console.error('Serverless function error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
}
