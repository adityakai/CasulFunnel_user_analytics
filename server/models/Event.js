import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['page_view', 'click'],
      index: true
    },
    pageUrl: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    click: {
      x: Number,
      y: Number
    },
    viewport: {
      width: Number,
      height: Number
    },
    userAgent: String
  },
  { timestamps: true }
);

eventSchema.index({ sessionId: 1, timestamp: 1 });
eventSchema.index({ pageUrl: 1, type: 1, timestamp: -1 });

export default mongoose.model('Event', eventSchema);
