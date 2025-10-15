import { useState, useEffect } from 'react';
import { Upload, Trash2, Download, Eye, FileText, ChevronRight } from 'lucide-react';
import { rawMaterialsAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const RawMaterials = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Estructura de categorías
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categoryStructure = {
    'IV Drugs': {
      children: [
        { name: 'Anestesia', parent: 'IV Drugs' },
        { name: 'Oncología', parent: 'IV Drugs' },
      ]
    },
    'Enterales': {
      children: [
        { name: 'Tube Feeds', parent: 'Enterales' },
        { name: 'Soporte Oral', parent: 'Enterales' },
        { name: 'Polvos', parent: 'Enterales' }
      ]
    },
    'Parenterales': {
      children: [
        { name: '3CB', parent: 'Parenterales' },
        { name: 'Materias Primas', parent: 'Parenterales' }
      ]
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, selectedParent, selectedCategory]);

  const loadDocuments = async () => {
    try {
      const response = await rawMaterialsAPI.getAll();
      setDocuments(response.data);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      toast.error('Error al cargar documentos');
    }
  };

  const filterDocuments = () => {
    if (!selectedCategory) {
      setFilteredDocuments([]);
      return;
    }

    const filtered = documents.filter(doc => 
      doc.category === selectedCategory &&
      doc.parentCategory === selectedParent
    );
    setFilteredDocuments(filtered);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no debe superar 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Selecciona un archivo PDF');
      return;
    }

    if (!uploadTitle.trim()) {
      toast.error('Ingresa un título para el documento');
      return;
    }

    if (!selectedCategory) {
      toast.error('Selecciona una categoría primero');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadTitle);
      formData.append('category', selectedCategory);
      formData.append('parentCategory', selectedParent || '');

      await rawMaterialsAPI.upload(formData);
      
      toast.success('Documento subido exitosamente');
      setSelectedFile(null);
      setUploadTitle('');
      setShowUploadModal(false);
      loadDocuments();
    } catch (error) {
      console.error('Error al subir documento:', error);
      toast.error(error.response?.data?.message || 'Error al subir documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      await rawMaterialsAPI.delete(id);
      toast.success('Documento eliminado exitosamente');
      loadDocuments();
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error al eliminar documento');
    }
  };

  const handleDownload = async (id, originalName) => {
    try {
      const response = await rawMaterialsAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar documento:', error);
      toast.error('Error al descargar documento');
    }
  };

  const handleView = async (id) => {
    try {
      const response = await rawMaterialsAPI.download(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Limpiar el URL después de un tiempo
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error al ver documento:', error);
      toast.error('Error al ver documento');
    }
  };

  const handleCategorySelect = (category, parent) => {
    setSelectedCategory(category);
    setSelectedParent(parent);
    setShowUploadModal(false);
  };

  const handleBackToParent = () => {
    setSelectedCategory(null);
    setSelectedParent(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Fichas Técnicas</h1>
        {selectedCategory && user?.isAdmin && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Upload size={20} />
            Subir Documento
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      {(selectedParent || selectedCategory) && (
        <div className="mb-6 flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={handleBackToParent}
            className="text-blue-600 hover:underline"
          >
            Fichas Técnicas
          </button>
          {selectedParent && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <span className="text-gray-600">{selectedParent}</span>
            </>
          )}
          {selectedCategory && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <span className="font-semibold text-gray-800">{selectedCategory}</span>
            </>
          )}
        </div>
      )}

      {!selectedCategory ? (
        /* Vista de categorías principales */
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(categoryStructure).map(([parentName, { children }]) => (
              <div key={parentName} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">{parentName}</h3>
                <div className="space-y-2">
                  {children.map((child) => (
                    <button
                      key={child.name}
                      type="button"
                      onClick={() => handleCategorySelect(child.name, child.parent)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-left flex items-center justify-between group"
                    >
                      <span>{child.name}</span>
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Vista de documentos de la categoría seleccionada */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Documentos de {selectedCategory}
          </h2>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No hay documentos en esta categoría</p>
              {user?.isAdmin && (
                <p className="text-gray-400 text-sm mt-2">
                  Usa el botón "Subir Documento" para agregar archivos PDF
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <FileText size={32} className="text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate" title={doc.title}>
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-500">{formatFileSize(doc.fileSize)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(doc._id)}
                      className="flex-1 btn btn-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                      title="Ver documento"
                    >
                      <Eye size={16} />
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc._id, doc.originalName)}
                      className="flex-1 btn btn-sm bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1"
                      title="Descargar"
                    >
                      <Download size={16} />
                      Descargar
                    </button>
                    {user?.isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc._id)}
                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de subida de documento */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Subir Documento PDF</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="label">Título del documento *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="input w-full"
                  placeholder="Ej: Ficha técnica XYZ"
                  required
                />
              </div>

              <div>
                <label className="label">Categoría seleccionada</label>
                <div className="bg-gray-100 p-3 rounded border border-gray-300">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{selectedParent}</span> → {selectedCategory}
                  </p>
                </div>
              </div>

              <div>
                <label className="label">Archivo PDF *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="input w-full"
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Archivo seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Tamaño máximo: 10MB
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1"
                >
                  {loading ? 'Subiendo...' : 'Subir'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setUploadTitle('');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterials;
