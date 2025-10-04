import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { tasksAPI, contactsAPI, usersAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import moment from 'moment';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [userInstitutions, setUserInstitutions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [],
    institution: '',
    priority: 'media',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
    loadContacts();
    loadUserInstitutions();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (error) {
      toast.error('Error al cargar tareas');
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

  const loadUserInstitutions = async () => {
    try {
      const response = await usersAPI.getUserInstitutions();
      setUserInstitutions(response.data);
    } catch (error) {
      console.error('Error al cargar instituciones');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        assignedTo: formData.assignedTo.map(id => id),
        institution: formData.institution || null,
        dueDate: formData.dueDate || null
      };

      if (editingTask) {
        await tasksAPI.update(editingTask._id, dataToSend);
        toast.success('Tarea actualizada exitosamente');
      } else {
        await tasksAPI.create(dataToSend);
        toast.success('Tarea creada exitosamente');
      }
      
      loadTasks();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta tarea?')) {
      try {
        await tasksAPI.delete(id);
        toast.success('Tarea eliminada exitosamente');
        loadTasks();
      } catch (error) {
        toast.error('Error al eliminar tarea');
      }
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo.map(u => u._id) || [],
      institution: task.institution?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? moment(task.dueDate).format('YYYY-MM-DD') : ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      assignedTo: [],
      institution: '',
      priority: 'media',
      dueDate: ''
    });
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksAPI.update(task._id, { status: newStatus });
      toast.success('Estado actualizado');
      loadTasks();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      baja: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_progreso: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus);

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tareas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Crear Tarea
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'pendiente', label: 'Pendientes' },
          { value: 'en_progreso', label: 'En Progreso' },
          { value: 'completada', label: 'Completadas' }
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === filter.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{task.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                    Prioridad: {task.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(task)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Editar"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(task._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Eliminar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-gray-700 mb-4">{task.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <span className="font-semibold text-gray-600">Creado por:</span>
                <p className="text-gray-800">{task.createdBy?.username}</p>
              </div>
              
              {task.institution && (
                <div>
                  <span className="font-semibold text-gray-600">Institución:</span>
                  <p className="text-gray-800">{task.institution.name}</p>
                </div>
              )}

              {task.dueDate && (
                <div>
                  <span className="font-semibold text-gray-600">Fecha límite:</span>
                  <p className={`text-gray-800 ${moment(task.dueDate).isBefore(moment()) && task.status !== 'completada' ? 'text-red-600 font-semibold' : ''}`}>
                    {moment(task.dueDate).format('DD/MM/YYYY')}
                  </p>
                </div>
              )}
            </div>

            {task.assignedTo && task.assignedTo.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <span className="font-semibold text-gray-600 text-sm">Asignado a:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.assignedTo.map((user) => (
                    <span key={user._id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {user.username}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status selector */}
            <div className="flex gap-2">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task, e.target.value)}
                className="input text-sm"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay tareas en esta categoría</p>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingTask ? 'Editar Tarea' : 'Crear Tarea'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  rows="4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prioridad</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="label">Fecha límite</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Institución</label>
                <select
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="input"
                >
                  <option value="">Ninguna</option>
                  {userInstitutions.map((inst) => (
                    <option key={inst._id} value={inst._id}>{inst.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Asignar a usuarios</label>
                <select
                  multiple
                  value={formData.assignedTo}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, assignedTo: selected });
                  }}
                  className="input h-32"
                >
                  {contacts.map((contact) => (
                    <option key={contact.userId._id} value={contact.userId._id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Mantén Ctrl/Cmd para seleccionar múltiples</p>
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

export default Tasks;
