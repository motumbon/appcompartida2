import mongoose from 'mongoose';

const stockItemSchema = new mongoose.Schema({
  linea: {
    type: String,
    trim: true
  },
  codigo: {
    type: String,
    trim: true
  },
  material: {
    type: String,
    trim: true
  },
  observacion: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    trim: true
  }
});

const stockSchema = new mongoose.Schema({
  items: [stockItemSchema],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  fileName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Stock', stockSchema);
