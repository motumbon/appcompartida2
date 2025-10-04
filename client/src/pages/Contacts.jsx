import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, UserCheck, Building2 } from 'lucide-react';
import { contactsAPI, usersAPI, institutionsAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [userInstitutions, setUserInstitutions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showInstitutionsModal, setShowInstitutionsModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    loadContacts();
    loadInstitutions();
    loadUserInstitutions();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data);
    } catch (error) {
      toast.error('Error al cargar contactos');
    }
  };

  const loadInstitutions = async () => {
    try {
      const response = await institutionsAPI.getAll();
      setInstitutions(response.data);
    } catch (error) {
      toast.error('Error al cargar instituciones');
    }
  };

  const loadUserInstitutions = async () => {
    try {
      const response = await usersAPI.getUserInstitutions();
      setUserInstitutions(response.data);
    } catch (error) {
      console.error('Error al cargar instituciones del usuario');
    }
  };

  const handleEmailOrNameChange = async (value, field) => {
    setFormData({ ...formData, [field]: value });
    
    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.length >= 2) {
      // Buscar después de 300ms de inactividad
      const timeout = setTimeout(async () => {
        try {
          // Buscar usuarios registrados en el sistema
          const response = await usersAPI.autocomplete(value);
          const users = response.data || [];
          
          setSuggestedUsers(users);
          setShowSuggestions(users.length > 0);
        } catch (error) {
          console.error('Error al buscar usuarios:', error);
          setSuggestedUsers([]);
          setShowSuggestions(false);
        }
      }, 300);
      
      setSearchTimeout(timeout);
    } else {
      setSuggestedUsers([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectUser = (user) => {
    setFormData({
      ...formData,
      name: user.username,
      email: user.email
    });
    setSuggestedUsers([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingContact) {
        await contactsAPI.update(editingContact._id, formData);
        toast.success('Contacto actualizado exitosamente');
      } else {
        await contactsAPI.create(formData);
        toast.success('Contacto agregado exitosamente');
      }
      
      loadContacts();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este contacto?')) {
      try {
        await contactsAPI.delete(id);
        toast.success('Contacto eliminado exitosamente');
        loadContacts();
      } catch (error) {
        toast.error('Error al eliminar contacto');
      }
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      notes: contact.notes || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({ name: '', email: '', phone: '', notes: '' });
    setSuggestedUser(null);
  };

  const handleLinkInstitution = async (institutionId) => {
    try {
      await usersAPI.linkInstitution(institutionId);
      toast.success('Institución vinculada exitosamente');
      loadUserInstitutions();
    } catch (error) {
      toast.error('Error al vincular institución');
    }
  };

  const handleUnlinkInstitution = async (institutionId) => {
    if (window.confirm('¿Deseas desvincular esta institución?')) {
      try {
        await usersAPI.unlinkInstitution(institutionId);
        toast.success('Institución desvinculada exitosamente');
        loadUserInstitutions();
      } catch (error) {
        toast.error('Error al desvincular institución');
      }
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Contactos</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInstitutionsModal(true)}
            className="btn bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-2"
          >
            <Building2 size={20} />
            Mis Instituciones
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Agregar Contacto
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar contactos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <div key={contact._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{contact.name}</h3>
                  {contact.isRegisteredUser && (
                    <UserCheck size={18} className="text-green-500" title="Usuario registrado" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{contact.email}</p>
                {contact.phone && (
                  <p className="text-sm text-gray-600 mt-1">{contact.phone}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(contact)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(contact._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            {contact.notes && (
              <p className="text-sm text-gray-500 mt-2 italic">{contact.notes}</p>
            )}
          </div>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay contactos registrados</p>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingContact ? 'Editar Contacto' : 'Agregar Contacto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="label">Email o Nombre de Usuario *</label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleEmailOrNameChange(e.target.value, 'email')}
                  onFocus={() => formData.email && setShowSuggestions(suggestedUsers.length > 0)}
                  className="input"
                  placeholder="Comienza a escribir..."
                  required
                />
                {showSuggestions && suggestedUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestedUsers.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck size={16} className="text-green-500" />
                          <div>
                            <p className="font-semibold text-gray-800">{user.username}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleEmailOrNameChange(e.target.value, 'name')}
                  className="input"
                  required
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
                <label className="label">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows="3"
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

      {/* Institutions Modal */}
      {showInstitutionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Mis Instituciones</h2>
            
            {/* User's Institutions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Instituciones Vinculadas</h3>
              {userInstitutions.length > 0 ? (
                <div className="space-y-2">
                  {userInstitutions.map((inst) => (
                    <div key={inst._id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="font-medium">{inst.name}</span>
                      <button
                        onClick={() => handleUnlinkInstitution(inst._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No tienes instituciones vinculadas</p>
              )}
            </div>

            {/* Available Institutions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Instituciones Disponibles</h3>
              <div className="space-y-2">
                {institutions
                  .filter(inst => !userInstitutions.find(ui => ui._id === inst._id))
                  .map((inst) => (
                    <div key={inst._id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <span className="font-medium">{inst.name}</span>
                        {inst.description && (
                          <p className="text-sm text-gray-600">{inst.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleLinkInstitution(inst._id)}
                        className="btn btn-primary text-sm"
                      >
                        Vincular
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowInstitutionsModal(false)}
                className="btn btn-secondary w-full"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
