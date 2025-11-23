import mongoose from 'mongoose';

const entrySchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        content: {
            type: String,
            required: true,
        },
        mood_label: {
            type: String,
        },
        mood_confidence: {
            type: Number,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

const Entry = mongoose.model('Entry', entrySchema);

export default Entry;
