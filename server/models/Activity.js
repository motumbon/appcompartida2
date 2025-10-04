import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  comment: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null
  },
  registerInCalendar: {
    type: Boolean,
    default: false
  },
  calendarEventId: {
    type: String,
    default: null
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Activity', activitySchema);
