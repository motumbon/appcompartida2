import mongoose from 'mongoose';

const rawMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Anestesia', 'Oncología', 'Tube Feeds', 'Soporte Oral', 'Polvos', '3CB', 'Materias Primas']
  },
  parentCategory: {
    type: String,
    enum: ['Fichas Técnicas', 'Enterales', 'Parenterales', null],
    default: null
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  }
}, {
  timestamps: true
});

export default mongoose.model('RawMaterial', rawMaterialSchema);
