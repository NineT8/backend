import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Entry from '../models/Entry.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all entries with pagination, sorting, and filtering
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { sortBy, order, search, mood } = req.query;

        // Build query
        const query = { user: req.user._id };

        if (search) {
            query.content = { $regex: search, $options: 'i' };
        }

        if (mood && mood !== 'all') {
            query.mood_label = mood;
        }

        // Build sort object
        let sort = {};
        if (sortBy === 'oldest') {
            sort.created_at = 1;
        } else {
            // Default to newest
            sort.created_at = -1;
        }

        const count = await Entry.countDocuments(query);
        const entries = await Entry.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        res.json({
            entries,
            pagination: {
                total: count,
                page,
                pages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all entries without pagination (for analytics)
router.get('/all', protect, async (req, res) => {
    try {
        const entries = await Entry.find({ user: req.user._id }).sort({ created_at: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single entry
router.get('/:id', protect, async (req, res) => {
    try {
        const entry = await Entry.findById(req.params.id);

        if (entry && entry.user.toString() === req.user._id.toString()) {
            res.json(entry);
        } else {
            res.status(404).json({ message: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create entry with AI analysis
router.post('/', protect, async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    let mood_label = 'neutral';
    let mood_confidence = 0.0;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Analyze the mood of this journal entry: "${content}". 
        Return ONLY a JSON object: {"mood": "happy|sad|stressed|calm|angry|neutral", "confidence": 0.0-1.0}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            mood_label = parsed.mood.toLowerCase();
            mood_confidence = parsed.confidence;
        }
    } catch (error) {
        console.error('AI Analysis failed:', error);
    }

    try {
        const entry = await Entry.create({
            user: req.user._id,
            content,
            mood_label,
            mood_confidence,
        });

        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update entry
router.put('/:id', protect, async (req, res) => {
    const { content } = req.body;

    try {
        const entry = await Entry.findById(req.params.id);

        if (entry && entry.user.toString() === req.user._id.toString()) {
            entry.content = content || entry.content;
            const updatedEntry = await entry.save();
            res.json(updatedEntry);
        } else {
            res.status(404).json({ message: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete entry
router.delete('/:id', protect, async (req, res) => {
    try {
        const entry = await Entry.findById(req.params.id);

        if (entry && entry.user.toString() === req.user._id.toString()) {
            await entry.deleteOne();
            res.json({ message: 'Entry removed' });
        } else {
            res.status(404).json({ message: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
