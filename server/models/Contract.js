import mongoose from 'mongoose';

const contractItemSchema = new mongoose.Schema({
  linea: {
    type: String,
    trim: true
  },
  kamRepr: {
    type: String,
    trim: true
  },
  cliente: {
    type: String,
    trim: true
  },
  nomCliente: {
    type: String,
    trim: true
  },
  numPedido: {
    type: String,
    trim: true
  },
  material: {
    type: String,
    trim: true
  },
  denominacion: {
    type: String,
    trim: true
  },
  inicioValidez: {
    type: String,
    trim: true
  },
  finValidez: {
    type: String,
    trim: true
  },
  tipoCtto: {
    type: String,
    trim: true
  }
});

const contractSchema = new mongoose.Schema({
  items: [contractItemSchema],
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
  },
  batchId: {
    type: String,
    required: true
  },
  chunkIndex: {
    type: Number,
    default: 0
  },
  totalChunks: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model('Contract', contractSchema);
