import mongoose from 'mongoose';

const pushTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // Un usuario = un token
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

pushTokenSchema.index({ user: 1 });

export default mongoose.model('PushToken', pushTokenSchema);
