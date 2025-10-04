import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Building2 } from 'lucide-react';
import { institutionsAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';

const AdminInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const response = await institutionsAPI.getAll();
      setInstitutions(response.data);
    } catch (error) {
      toast.error('Error al cargar instituciones');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingInstitution) {
        await institutionsAPI.update(editingInstitution._id, formData);
        toast.success('Institución actualizada');
      } else {
        await institutionsAPI.create(formData);
        toast.success('Institución creada');
      }
      
      loadInstitutions();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar institución');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta institución?')) {
      try {
        await institutionsAPI.delete(id);
        toast.success('Institución eliminada');
        loadInstitutions();
      } catch (error) {
        toast.error('Error al eliminar institución');
      }
    }
  };

  const handleEdit = (institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      description: institution.description || '',
      address: institution.address || '',
      phone: institution.phone || '',
      email: institution.email || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInstitution(null);
    setFormData({ name: '', description: '', address: '', phone: '', email: '' });
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Instituciones</h1>
          <p className="text-gray-600 mt-2">Administra las instituciones del sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Agregar Institución
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {institutions.map((institution) => (
          <div key={institution._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <Building2 className="text-teal-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{institution.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(institution)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(institution._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {institution.description && (
              <p className="text-sm text-gray-600 mb-3">{institution.description}</p>
            )}
            
            <div className="space-y-1 text-sm text-gray-500">
              {institution.address && <p>📍 {institution.address}</p>}
              {institution.phone && <p>📞 {institution.phone}</p>}
              {institution.email && <p>📧 {institution.email}</p>}
            </div>
          </div>
        ))}
      </div>

      {institutions.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 text-lg">No hay instituciones registradas</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingInstitution ? 'Editar Institución' : 'Agregar Institución'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>

              <div>
                <label className="label">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
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

export default AdminInstitutions;
