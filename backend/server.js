import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import questionRoutes from './src/routes/questionRoutes.js';
import checkerRoutes from './src/routes/checkerRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js'

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/admin",adminRoutes)
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/checker", checkerRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));