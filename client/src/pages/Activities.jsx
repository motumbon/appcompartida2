import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calendar as CalendarIcon, Users, Building2, Paperclip, Download, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { activitiesAPI, contactsAPI, usersAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';

moment.locale('es');
const localizer = momentLocalizer(moment);

const Activities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [userInstitutions, setUserInstitutions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'pending', or 'completed'
  const [filterUser, setFilterUser] = useState('all'); // 'all', 'mine', or userId
  const [filterInstitution, setFilterInstitution] = useState('all'); // 'all' or institutionId
  const [formData, setFormData] = useState({
    subject: '',
    comment: '',
    sharedWith: [],
    institution: '',
    scheduledDate: '',
    attachments: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduledDateOnly, setScheduledDateOnly] = useState('');
  const [scheduledHour, setScheduledHour] = useState('');
  const [scheduledMinute, setScheduledMinute] = useState('00');
  const [scheduledPeriod, setScheduledPeriod] = useState('AM');

  useEffect(() => {
    loadActivities();
    loadContacts();
    loadUserInstitutions();
  }, []);

  // Combinar fecha + hora + minutos cuando cambian
  useEffect(() => {
    if (scheduledDateOnly && scheduledHour && scheduledMinute !== null && scheduledPeriod) {
      // Convertir hora AM/PM a formato 24h
      let hour24 = parseInt(scheduledHour);
      if (scheduledPeriod === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (scheduledPeriod === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      const dateTime = `${scheduledDateOnly}T${String(hour24).padStart(2, '0')}:${scheduledMinute}`;
      setFormData(prev => ({ ...prev, scheduledDate: dateTime }));
    } else if (!scheduledDateOnly) {
      // Si se borra la fecha, borrar scheduledDate
      setFormData(prev => ({ ...prev, scheduledDate: '' }));
    }
  }, [scheduledDateOnly, scheduledHour, scheduledMinute, scheduledPeriod]);

  const loadActivities = async () => {
    try {
      const response = await activitiesAPI.getAll();
      setActivities(response.data);
    } catch (error) {
      toast.error('Error al cargar actividades');
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
      const formDataToSend = new FormData();
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('comment', formData.comment);
      formDataToSend.append('institution', formData.institution || '');
      formDataToSend.append('scheduledDate', formData.scheduledDate || '');
      
      // Agregar usuarios compartidos
      formData.sharedWith.forEach(userId => {
        formDataToSend.append('sharedWith[]', userId);
      });
      
      // Agregar nuevos archivos
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });
      
      // Si estamos editando, enviar archivos existentes que se mantienen
      if (editingActivity && formData.attachments) {
        formDataToSend.append('existingAttachments', JSON.stringify(formData.attachments.map(a => a.filename)));
      }

      if (editingActivity) {
        await activitiesAPI.update(editingActivity._id, formDataToSend);
        toast.success('Actividad actualizada exitosamente');
      } else {
        await activitiesAPI.create(formDataToSend);
        toast.success('Actividad creada exitosamente');
      }
      
      loadActivities();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta actividad?')) {
      try {
        await activitiesAPI.delete(id);
        toast.success('Actividad eliminada exitosamente');
        loadActivities();
      } catch (error) {
        toast.error('Error al eliminar actividad');
      }
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      subject: activity.subject,
      comment: activity.comment || '',
      sharedWith: activity.sharedWith.map(u => u._id) || [],
      institution: activity.institution?._id || '',
      scheduledDate: activity.scheduledDate ? moment(activity.scheduledDate).format('YYYY-MM-DDTHH:mm') : '',
      attachments: activity.attachments || []
    });
    
    // Separar fecha y hora si existe
    if (activity.scheduledDate) {
      const date = moment(activity.scheduledDate);
      setScheduledDateOnly(date.format('YYYY-MM-DD'));
      
      // Convertir a formato 12h AM/PM
      let hour = date.hours();
      const period = hour >= 12 ? 'PM' : 'AM';
      if (hour > 12) hour -= 12;
      if (hour === 0) hour = 12;
      
      setScheduledHour(String(hour));
      setScheduledMinute(date.format('mm'));
      setScheduledPeriod(period);
    } else {
      setScheduledDateOnly('');
      setScheduledHour('');
      setScheduledMinute('00');
      setScheduledPeriod('AM');
    }
    
    setShowModal(true);
  };

  const removeExistingAttachment = (filename) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter(a => a.filename !== filename)
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingActivity(null);
    setSelectedFiles([]);
    setFormData({
      subject: '',
      comment: '',
      sharedWith: [],
      institution: '',
      scheduledDate: '',
      attachments: []
    });
    setScheduledDateOnly('');
    setScheduledHour('');
    setScheduledMinute('00');
    setScheduledPeriod('AM');
  };

  const handleFileChange = (e) => {
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

  const downloadAttachment = async (activityId, filename, originalName) => {
    try {
      const response = await activitiesAPI.downloadAttachment(activityId, filename);
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

  const handleSelectSlot = ({ start, end }) => {
    const now = new Date();
    const selectedDate = new Date(start);
    
    // Establecer fecha
    setScheduledDateOnly(moment(selectedDate).format('YYYY-MM-DD'));
    
    // Establecer hora actual en formato 12h
    let hour = now.getHours();
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    
    setScheduledHour(String(hour));
    
    // Redondear minutos al cuarto de hora más cercano
    const minutes = now.getMinutes();
    let roundedMinutes = '00';
    if (minutes >= 7 && minutes < 22) roundedMinutes = '15';
    else if (minutes >= 22 && minutes < 37) roundedMinutes = '30';
    else if (minutes >= 37 && minutes < 52) roundedMinutes = '45';
    else if (minutes >= 52) roundedMinutes = '00';
    
    setScheduledMinute(roundedMinutes);
    setScheduledPeriod(period);
    
    setFormData({
      subject: '',
      comment: '',
      sharedWith: [],
      institution: '',
      scheduledDate: '',
      attachments: []
    });
    setShowModal(true);
  };

  const handleStatusChange = async (activity, newStatus) => {
    try {
      await activitiesAPI.update(activity._id, { status: newStatus });
      toast.success('Estado actualizado');
      loadActivities();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  // Preparar eventos para el calendario
  const calendarEvents = activities
    .filter(a => a.scheduledDate && a.status !== 'completada')
    .map(a => ({
      id: a._id,
      title: a.subject,
      start: new Date(a.scheduledDate),
      end: new Date(a.scheduledDate),
      resource: a
    }));

  // Filtrar actividades según el modo de vista y filtros
  const getFilteredActivities = () => {
    let filtered = activities;

    // Aplicar filtro de vista
    if (viewMode === 'completed') {
      filtered = filtered.filter(a => a.status === 'completada');
    } else if (viewMode === 'pending') {
      filtered = filtered.filter(a => a.status === 'pendiente');
    } else if (viewMode === 'list') {
      // Lista muestra todas menos completadas
      filtered = filtered.filter(a => a.status !== 'completada');
    }
    // calendar muestra todas las que tienen fecha

    // Aplicar filtro de usuario
    if (filterUser === 'mine') {
      // Solo mis actividades no compartidas
      filtered = filtered.filter(a => {
        if (!a || !a.createdBy || !user) return false;
        // Normalizar IDs para comparación
        const activityCreatorId = a.createdBy?._id || a.createdBy;
        const currentUserId = user?._id || user?.id;
        
        if (!activityCreatorId || !currentUserId) return false;
        
        // Verificar si es mi actividad
        const isMyActivity = String(activityCreatorId) === String(currentUserId);
        
        // Verificar que no esté compartida con nadie
        const isNotShared = !a.sharedWith || a.sharedWith.length === 0;
        
        return isMyActivity && isNotShared;
      });
    } else if (filterUser !== 'all') {
      // Actividades compartidas con un usuario específico
      filtered = filtered.filter(a => 
        a && Array.isArray(a.sharedWith) && a.sharedWith.some(u => u && u._id === filterUser)
      );
    }

    // Aplicar filtro de institución
    if (filterInstitution !== 'all') {
      filtered = filtered.filter(a => 
        a.institution && a.institution._id === filterInstitution
      );
    }

    return filtered;
  };

  const filteredActivities = getFilteredActivities();

  // Determinar si una actividad fue compartida conmigo
  const isSharedWithMe = (activity) => {
    if (!activity || !activity.createdBy || !user) return false;
    const creatorId = activity.createdBy?._id?.toString() || activity.createdBy?._id;
    const currentUserId = user?._id?.toString() || user?._id;
    if (!creatorId || !currentUserId) return false;
    return creatorId !== currentUserId && 
           Array.isArray(activity.sharedWith) && activity.sharedWith.some(u => (u._id?.toString() || u._id || u.toString()) === currentUserId);
  };

  // Obtener color de fondo según si es compartida
  const getActivityBgColor = (activity) => {
    return isSharedWithMe(activity) ? 'bg-blue-50' : 'bg-white';
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      completada: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: 'Pendiente',
      completada: 'Completada'
    };
    return labels[status] || status;
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Actividades</h1>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Actividad
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Vista */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pending')}
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'pending' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Pendientes
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Calendario
              </button>
              <button
                type="button"
                onClick={() => setViewMode('completed')}
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'completed' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Completadas
              </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 flex-1">
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="input-sm text-sm flex-1 min-w-[180px]"
              >
                <option value="all">👥 Todos los usuarios</option>
                <option value="mine">👤 Mis actividades</option>
                {contacts
                  .filter(contact => contact.userId && contact.userId._id)
                  .map((contact) => (
                    <option key={contact.userId._id} value={contact.userId._id}>
                      🤝 {contact.name}
                    </option>
                  ))}
              </select>
              <select
                value={filterInstitution}
                onChange={(e) => setFilterInstitution(e.target.value)}
                className="input-sm text-sm flex-1 min-w-[180px]"
              >
                <option value="all">🏢 Todas las instituciones</option>
                {userInstitutions.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* List View */}
      {(viewMode === 'list' || viewMode === 'pending' || viewMode === 'completed') && (
        <div className="space-y-4">
          {viewMode === 'pending' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800">Actividades Pendientes</h3>
              <p className="text-sm text-yellow-600">Mostrando {filteredActivities.length} actividades pendientes</p>
            </div>
          )}
          {viewMode === 'completed' && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">Actividades Completadas</h3>
              <p className="text-sm text-green-600">Mostrando {filteredActivities.length} actividades completadas</p>
            </div>
          )}
          {filteredActivities.map((activity) => (
            <div key={activity._id} className={`${getActivityBgColor(activity)} rounded-lg shadow-md p-6 border-2 ${isSharedWithMe(activity) ? 'border-blue-300' : 'border-transparent'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{activity.subject}</h3>
                    {isSharedWithMe(activity) && (
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        Compartida conmigo
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.status)}`}>
                      {getStatusLabel(activity.status)}
                    </span>
                    {activity.scheduledDate && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        <CalendarIcon size={14} className="inline mr-1" />
                        En Calendario
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(activity)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(activity._id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {activity.comment && (
                <p className="text-gray-700 mb-4">{activity.comment}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-600">Creado por:</span>
                  <p className="text-gray-800">{activity.createdBy?.username}</p>
                </div>
                
                {activity.institution && (
                  <div>
                    <span className="font-semibold text-gray-600">Institución:</span>
                    <p className="text-gray-800">{activity.institution.name}</p>
                  </div>
                )}

                {activity.scheduledDate && (
                  <div>
                    <span className="font-semibold text-gray-600">Fecha programada:</span>
                    <p className="text-gray-800">{moment(activity.scheduledDate).format('DD/MM/YYYY HH:mm')}</p>
                  </div>
                )}
              </div>

              {activity.updatedAt && activity.updatedAt !== activity.createdAt && (
                <div className="mt-3 text-sm text-gray-500 italic">
                  <span className="font-semibold">Modificación:</span> {moment(activity.updatedAt).format('DD/MM/YYYY HH:mm')}
                </div>
              )}

              {activity.sharedWith && activity.sharedWith.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="font-semibold text-gray-600 text-sm">Compartido con:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activity.sharedWith.map((user) => (
                      <span key={user._id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {user.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activity.attachments && activity.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="font-semibold text-gray-600 text-sm flex items-center gap-2">
                    <Paperclip size={16} />
                    Archivos adjuntos:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activity.attachments.map((file, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => downloadAttachment(activity._id, file.filename, file.originalName)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-2"
                      >
                        <Download size={14} />
                        {file.originalName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <select
                  value={activity.status}
                  onChange={(e) => handleStatusChange(activity, e.target.value)}
                  className="input text-sm"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {viewMode === 'completed' && 'No hay actividades completadas'}
                {viewMode === 'pending' && 'No hay actividades pendientes'}
                {viewMode === 'list' && 'No hay actividades registradas'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow-md p-6" style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={(event) => handleEdit(event.resource)}
            onSelectSlot={handleSelectSlot}
            selectable
            messages={{
              next: "Siguiente",
              previous: "Anterior",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              noEventsInRange: "No hay actividades en este rango",
              showMore: (total) => `+ Ver más (${total})`
            }}
          />
        </div>
      )}

      {/* Add/Edit Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingActivity ? 'Editar Actividad' : 'Crear Actividad'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Asunto *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Comentario</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="input"
                  rows="4"
                />
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
                <label className="label">Fecha programada (opcional)</label>
                <input
                  type="date"
                  value={scheduledDateOnly}
                  onChange={(e) => {
                    setScheduledDateOnly(e.target.value);
                    // Si selecciona una fecha y no hay hora, establecer hora actual
                    if (e.target.value && !scheduledHour) {
                      const now = new Date();
                      let hour = now.getHours();
                      const period = hour >= 12 ? 'PM' : 'AM';
                      if (hour > 12) hour -= 12;
                      if (hour === 0) hour = 12;
                      setScheduledHour(String(hour));
                      setScheduledPeriod(period);
                      
                      // Redondear minutos
                      const minutes = now.getMinutes();
                      let roundedMinutes = '00';
                      if (minutes >= 7 && minutes < 22) roundedMinutes = '15';
                      else if (minutes >= 22 && minutes < 37) roundedMinutes = '30';
                      else if (minutes >= 37 && minutes < 52) roundedMinutes = '45';
                      else if (minutes >= 52) roundedMinutes = '00';
                      setScheduledMinute(roundedMinutes);
                    }
                  }}
                  className="input"
                />
                {scheduledDateOnly && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <label className="label text-sm">Hora *</label>
                      <select
                        value={scheduledHour}
                        onChange={(e) => setScheduledHour(e.target.value)}
                        required
                        className="input text-sm"
                      >
                        <option value="">--</option>
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label text-sm">Minutos *</label>
                      <select
                        value={scheduledMinute}
                        onChange={(e) => setScheduledMinute(e.target.value)}
                        required
                        className="input text-sm"
                      >
                        <option value="00">00</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-sm">AM/PM *</label>
                      <select
                        value={scheduledPeriod}
                        onChange={(e) => setScheduledPeriod(e.target.value)}
                        required
                        className="input text-sm"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">Las actividades con fecha aparecerán en el calendario</p>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Paperclip size={16} />
                  Adjuntar archivos (PDF, Imágenes, Office)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="input"
                />
                <p className="text-sm text-gray-500 mt-1">Máximo 5 archivos, 10MB cada uno</p>
                
                {/* Archivos existentes (al editar) */}
                {editingActivity && formData.attachments && formData.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Archivos actuales:</p>
                    <div className="space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200">
                          <span className="text-sm text-gray-700">{file.originalName}</span>
                          <button
                            type="button"
                            onClick={() => removeExistingAttachment(file.filename)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar archivo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Nuevos archivos a subir */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Nuevos archivos:</p>
                    <div className="space-y-2">
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

export default Activities;
