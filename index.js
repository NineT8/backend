import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import entryRoutes from './routes/entryRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the MindMapr API');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is ready at http://localhost:${PORT}`);
});
