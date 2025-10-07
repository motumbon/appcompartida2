import mongoose from 'mongoose';

const pushTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // Un usuario = un token (esto ya crea el índice)
  },
  token: {
    type: String,
    required: true
  },
  deviceInfo: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Índice removido - ya existe por el campo unique: true

export default mongoose.model('PushToken', pushTokenSchema);
