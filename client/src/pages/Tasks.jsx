import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Users } from 'lucide-react';
import { tasksAPI, contactsAPI, usersAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [userInstitutions, setUserInstitutions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'completed'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sharedWith: [],
    institution: '',
    priority: 'media',
    dueDate: '',
    checklist: []
  });
  const [newCheckItem, setNewCheckItem] = useState('');
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
        sharedWith: formData.sharedWith.filter(id => id),
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
      sharedWith: task.sharedWith?.map(u => u._id) || [],
      institution: task.institution?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? moment(task.dueDate).format('YYYY-MM-DD') : '',
      checklist: task.checklist || []
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setNewCheckItem('');
    setFormData({
      title: '',
      description: '',
      sharedWith: [],
      institution: '',
      priority: 'media',
      dueDate: '',
      checklist: []
    });
  };

  const handleToggleComplete = async (task) => {
    try {
      console.log('handleToggleComplete llamado con task:', task);
      if (!task || !task._id) {
        toast.error('Error: tarea inválida');
        return;
      }
      
      const newStatus = task.status === 'completada' ? 'pendiente' : 'completada';
      const completedAt = newStatus === 'completada' ? new Date() : null;
      console.log('Actualizando tarea:', { newStatus, completedAt });
      await tasksAPI.update(task._id, { status: newStatus, completedAt });
      toast.success(newStatus === 'completada' ? 'Tarea completada' : 'Tarea marcada como pendiente');
      loadTasks();
    } catch (error) {
      console.error('Error en handleToggleComplete:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleToggleCheckItem = async (task, itemIndex) => {
    try {
      if (!task || !Array.isArray(task.checklist) || !task.checklist[itemIndex]) {
        toast.error('Error: checklist inválido');
        return;
      }
      
      const updatedChecklist = [...task.checklist];
      updatedChecklist[itemIndex] = {
        ...updatedChecklist[itemIndex],
        completed: !updatedChecklist[itemIndex].completed,
        completedAt: !updatedChecklist[itemIndex].completed ? new Date() : null
      };
      await tasksAPI.update(task._id, { checklist: updatedChecklist });
      loadTasks();
    } catch (error) {
      console.error('Error en handleToggleCheckItem:', error);
      toast.error('Error al actualizar checklist');
    }
  };

  const addChecklistItem = () => {
    if (newCheckItem.trim()) {
      setFormData({
        ...formData,
        checklist: [...formData.checklist, { text: newCheckItem.trim(), completed: false }]
      });
      setNewCheckItem('');
    }
  };

  const removeChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index)
    });
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

  const isSharedWithMe = (task) => {
    if (!task || !task.createdBy || !user) {
      console.log('isSharedWithMe: validación inicial falló', { task: !!task, createdBy: !!task?.createdBy, user: !!user });
      return false;
    }
    
    const creatorId = (task.createdBy?._id || task.createdBy)?.toString();
    const currentUserId = (user?._id || user?.id)?.toString();
    
    if (!creatorId || !currentUserId) {
      console.log('isSharedWithMe: IDs no disponibles', { creatorId, currentUserId });
      return false;
    }
    
    const isNotCreator = creatorId !== currentUserId;
    const isShared = Array.isArray(task.sharedWith) && task.sharedWith.some(u => {
      const sharedUserId = (u?._id || u)?.toString();
      return sharedUserId === currentUserId;
    });
    
    console.log('isSharedWithMe:', { 
      taskTitle: task.title,
      creatorId, 
      currentUserId, 
      isNotCreator, 
      sharedWithCount: task.sharedWith?.length,
      isShared,
      result: isNotCreator && isShared
    });
    
    return isNotCreator && isShared;
  };

  const canEditTask = (task) => {
    if (!task || !task.createdBy || !user) {
      console.log('canEditTask: validación inicial falló');
      return false;
    }
    
    const creatorId = (task.createdBy?._id || task.createdBy)?.toString();
    const currentUserId = (user?._id || user?.id)?.toString();
    
    if (!creatorId || !currentUserId) {
      console.log('canEditTask: IDs no disponibles', { creatorId, currentUserId });
      return false;
    }
    
    const isCreator = creatorId === currentUserId;
    const sharedWithMe = isSharedWithMe(task);
    
    console.log('canEditTask:', {
      taskTitle: task.title,
      isCreator,
      sharedWithMe,
      result: isCreator || sharedWithMe
    });
    
    return isCreator || sharedWithMe;
  };

  const filteredTasks = viewMode === 'pending'
    ? tasks.filter(t => t.status === 'pendiente')
    : tasks.filter(t => t.status === 'completada');

  const getChecklistProgress = (checklist) => {
    if (!checklist || checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tareas</h1>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Crear Tarea
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex gap-2 bg-white rounded-lg shadow-sm p-1 inline-flex">
        <button
          type="button"
          onClick={() => setViewMode('pending')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            viewMode === 'pending'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Pendientes ({tasks.filter(t => t.status === 'pendiente').length})
        </button>
        <button
          type="button"
          onClick={() => setViewMode('completed')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            viewMode === 'completed'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Completadas ({tasks.filter(t => t.status === 'completada').length})
        </button>
      </div>

      {/* Tasks Grid */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task._id} className={`rounded-lg shadow-md p-6 border-2 ${
            isSharedWithMe(task) ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(task)}
                  disabled={!canEditTask(task)}
                  className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    task.status === 'completada'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-500'
                  } ${!canEditTask(task) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {task.status === 'completada' && <Check size={16} />}
                </button>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 ${
                    task.status === 'completada' ? 'line-through text-gray-500' : 'text-gray-800'
                  }`}>{task.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {isSharedWithMe(task) && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Users size={14} />
                        Compartida conmigo
                      </span>
                    )}
                    {task.sharedWith && task.sharedWith.length > 0 && !isSharedWithMe(task) && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                        <Users size={14} />
                        Compartida ({task.sharedWith.length})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {canEditTask(task) && (
                  <button
                    type="button"
                    onClick={() => handleEdit(task)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit2 size={20} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(task._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Eliminar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-gray-700 mb-4 ml-9">{task.description}</p>
            )}

            {/* Checklist */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="mb-4 ml-9">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-600">
                    Checklist ({task.checklist.filter(item => item.completed).length}/{task.checklist.length})
                  </span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${getChecklistProgress(task.checklist)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {task.checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCheckItem(task, index)}
                        disabled={!canEditTask(task)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          item.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        } ${!canEditTask(task) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {item.completed && <Check size={14} />}
                      </button>
                      <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4 ml-9">
              <div>
                <span className="font-semibold text-gray-600">Creado por:</span>
                <p className="text-gray-800">{task.createdBy?.name || task.createdBy?.username}</p>
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
                  <p className={`${moment(task.dueDate).isBefore(moment()) && task.status !== 'completada' ? 'text-red-600 font-semibold' : 'text-gray-800'}`}>
                    {moment(task.dueDate).format('DD/MM/YYYY')}
                  </p>
                </div>
              )}
            </div>

            {task.sharedWith && task.sharedWith.length > 0 && (
              <div className="ml-9 pb-2">
                <span className="font-semibold text-gray-600 text-sm">Compartida con:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.sharedWith.map((user) => (
                    <span key={user._id} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                      {user.name || user.username}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {task.status === 'completada' && task.completedAt && (
              <div className="ml-9 text-sm text-gray-500 italic">
                Completada el {moment(task.completedAt).format('DD/MM/YYYY HH:mm')}
              </div>
            )}
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
                <label className="label">Compartir con</label>
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
                <p className="text-sm text-gray-500 mt-1">Mantén Ctrl/Cmd para seleccionar múltiples. Los usuarios podrán ver y editar la tarea.</p>
              </div>

              <div>
                <label className="label">Checklist</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                    placeholder="Agregar elemento a la checklist"
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={addChecklistItem}
                    className="btn btn-secondary"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {formData.checklist.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {formData.checklist.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="text-sm text-gray-700">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
