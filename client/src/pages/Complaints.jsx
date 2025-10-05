import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, MessageSquare, Paperclip, Download, X } from 'lucide-react';
import { complaintsAPI, usersAPI, contactsAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import moment from 'moment';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [userInstitutions, setUserInstitutions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientName: '',
    sharedWith: [],
    institution: '',
    priority: 'media',
    attachments: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [updateData, setUpdateData] = useState({ comment: '', status: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComplaints();
    loadUserInstitutions();
    loadContacts();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await complaintsAPI.getAll();
      setComplaints(response.data);
    } catch (error) {
      toast.error('Error al cargar reclamos');
    }
  };

  const loadUserInstitutions = async () => {
    try {
      const response = await usersAPI.getUserInstitutions();
      setUserInstitutions(response.data);
    } catch (error) {
      console.error('Error al cargar instituciones');
    }
  };

  const loadContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data.filter(c => c.isRegisteredUser));
    } catch (error) {
      console.error('Error al cargar contactos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('clientName', formData.clientName);
      formDataToSend.append('institution', formData.institution || '');
      formDataToSend.append('priority', formData.priority);
      
      // Agregar usuarios compartidos
      formData.sharedWith.forEach(userId => {
        formDataToSend.append('sharedWith[]', userId);
      });
      
      // Agregar archivos nuevos
      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });
      
      // Si es edición, mantener archivos existentes
      if (editingComplaint && formData.attachments) {
        formData.attachments.forEach(att => {
          formDataToSend.append('existingAttachments[]', JSON.stringify(att));
        });
      }
      
      if (editingComplaint) {
        await complaintsAPI.update(editingComplaint._id, formDataToSend);
        toast.success('Reclamo actualizado');
      } else {
        await complaintsAPI.create(formDataToSend);
        toast.success('Reclamo creado');
      }
      loadComplaints();
      handleCloseModal();
    } catch (error) {
      toast.error('Error al guardar reclamo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await complaintsAPI.addUpdate(selectedComplaint._id, updateData);
      toast.success('Actualización agregada');
      loadComplaints();
      setShowUpdateModal(false);
      setUpdateData({ comment: '', status: '' });
    } catch (error) {
      toast.error('Error al agregar actualización');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este reclamo?')) {
      try {
        await complaintsAPI.delete(id);
        toast.success('Reclamo eliminado');
        loadComplaints();
      } catch (error) {
        toast.error('Error');
      }
    }
  };

  const handleEdit = (complaint) => {
    setEditingComplaint(complaint);
    setFormData({
      title: complaint.title,
      description: complaint.description,
      clientName: complaint.clientName,
      sharedWith: complaint.sharedWith?.map(u => u._id) || [],
      institution: complaint.institution?._id || '',
      priority: complaint.priority,
      attachments: complaint.attachments || []
    });
    setSelectedFiles([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingComplaint(null);
    setSelectedFiles([]);
    setFormData({ title: '', description: '', clientName: '', sharedWith: [], institution: '', priority: 'media', attachments: [] });
  };

  const openUpdateModal = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateData({ comment: '', status: complaint.status });
    setShowUpdateModal(true);
  };

  const getPriorityColor = (priority) => {
    return { baja: 'bg-green-100 text-green-800', media: 'bg-yellow-100 text-yellow-800', alta: 'bg-orange-100 text-orange-800', critica: 'bg-red-100 text-red-800' }[priority];
  };

  const getStatusColor = (status) => {
    return { recibido: 'bg-blue-100 text-blue-800', en_revision: 'bg-yellow-100 text-yellow-800', resuelto: 'bg-green-100 text-green-800' }[status];
  };

  const handleStatusChange = async (complaint, newStatus) => {
    try {
      await complaintsAPI.update(complaint._id, { status: newStatus });
      toast.success('Estado actualizado');
      loadComplaints();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      toast.error('Máximo 5 archivos permitidos');
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (filename) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter(att => att.filename !== filename)
    });
  };

  const downloadAttachment = async (complaintId, filename, originalName) => {
    try {
      const response = await complaintsAPI.downloadAttachment(complaintId, filename);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Error al descargar archivo');
    }
  };

  const filteredComplaints = filterStatus === 'all' ? complaints : complaints.filter(c => c.status === filterStatus);

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Seguimiento de Reclamos</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />Agregar Reclamo
        </button>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {[{ value: 'all', label: 'Todos' }, { value: 'recibido', label: 'Recibidos' }, { value: 'en_revision', label: 'En Revisión' }, { value: 'resuelto', label: 'Resueltos' }].map(filter => (
          <button key={filter.value} onClick={() => setFilterStatus(filter.value)} className={`px-4 py-2 rounded-lg font-medium ${filterStatus === filter.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}>{filter.label}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <div key={complaint._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{complaint.title}</h3>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(complaint.status)}`}>{complaint.status.replace('_', ' ').toUpperCase()}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(complaint.priority)}`}>{complaint.priority.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openUpdateModal(complaint)} className="text-blue-600"><MessageSquare size={20} /></button>
                <button onClick={() => handleEdit(complaint)} className="text-blue-600"><Edit2 size={20} /></button>
                <button onClick={() => handleDelete(complaint._id)} className="text-red-600"><Trash2 size={20} /></button>
              </div>
            </div>
            <p className="text-gray-700 mb-4">{complaint.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
              <div><span className="font-semibold">Cliente:</span><p>{complaint.clientName}</p></div>
              {complaint.institution && <div><span className="font-semibold">Institución:</span><p>{complaint.institution.name}</p></div>}
              <div><span className="font-semibold">Fecha:</span><p>{moment(complaint.createdAt).format('DD/MM/YYYY')}</p></div>
            </div>

            {complaint.sharedWith && complaint.sharedWith.length > 0 && (
              <div className="mb-4">
                <span className="font-semibold text-sm text-gray-600">Compartido con:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {complaint.sharedWith.map((user) => (
                    <span key={user._id} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                      {user.name || user.username}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {complaint.attachments && complaint.attachments.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <span className="font-semibold text-gray-600 text-sm flex items-center gap-2">
                  <Paperclip size={16} />
                  Archivos adjuntos:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {complaint.attachments.map((file, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => downloadAttachment(complaint._id, file.filename, file.originalName)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-2"
                    >
                      <Download size={14} />
                      {file.originalName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <select
                value={complaint.status}
                onChange={(e) => handleStatusChange(complaint, e.target.value)}
                className="input text-sm"
              >
                <option value="recibido">Recibido</option>
                <option value="en_revision">En Revisión</option>
                <option value="resuelto">Resuelto</option>
              </select>
            </div>

            {complaint.updates && complaint.updates.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2">Actualizaciones:</h4>
                {complaint.updates.map((update, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{update.updatedBy?.username}</span>
                      <span className="text-gray-500">{moment(update.createdAt).format('DD/MM HH:mm')}</span>
                    </div>
                    <p className="text-sm">{update.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingComplaint ? 'Editar Reclamo' : 'Agregar Reclamo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Título *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input" required />
              </div>
              
              <div>
                <label className="label">Descripción *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input" rows="4" required />
              </div>
              
              <div>
                <label className="label">Cliente *</label>
                <input type="text" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className="input" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prioridad</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="input">
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="label">Institución</label>
                  <select value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} className="input">
                    <option value="">Ninguna</option>
                    {userInstitutions.map((inst) => (
                      <option key={inst._id} value={inst._id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Compartir con usuarios</label>
                <select
                  multiple
                  value={formData.sharedWith}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, sharedWith: selected });
                  }}
                  className="input h-32"
                >
                  {contacts
                    .filter(contact => contact.userId && contact.userId._id)
                    .map((contact) => (
                      <option key={contact.userId._id} value={contact.userId._id}>
                        {contact.name}
                      </option>
                    ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Mantén Ctrl/Cmd para seleccionar múltiples</p>
              </div>

              <div>
                <label className="label">Archivos adjuntos</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="input"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                />
                <p className="text-sm text-gray-500 mt-1">Máximo 5 archivos (PDF, Office, Imágenes)</p>
              </div>

              {editingComplaint && formData.attachments && formData.attachments.length > 0 && (
                <div>
                  <span className="text-sm font-semibold text-gray-600">Archivos existentes:</span>
                  <div className="space-y-2 mt-2">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200">
                        <span className="text-sm text-gray-700">{file.originalName}</span>
                        <button
                          type="button"
                          onClick={() => removeExistingAttachment(file.filename)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div>
                  <span className="text-sm font-semibold text-gray-600">Archivos nuevos:</span>
                  <div className="space-y-2 mt-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">{loading ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Agregar Actualización</h2>
            <form onSubmit={handleAddUpdate} className="space-y-4">
              <div><label className="label">Comentario *</label><textarea value={updateData.comment} onChange={(e) => setUpdateData({ ...updateData, comment: e.target.value })} className="input" rows="4" required /></div>
              <div><label className="label">Estado</label><select value={updateData.status} onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })} className="input"><option value="recibido">Recibido</option><option value="en_revision">En Revisión</option><option value="resuelto">Resuelto</option></select></div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">{loading ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" onClick={() => setShowUpdateModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
