import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calendar as CalendarIcon, Users, Building2 } from 'lucide-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { activitiesAPI, contactsAPI, usersAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';

moment.locale('es');
const localizer = momentLocalizer(moment);

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [userInstitutions, setUserInstitutions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', or 'completed'
  const [formData, setFormData] = useState({
    subject: '',
    comment: '',
    sharedWith: [],
    institution: '',
    registerInCalendar: false,
    scheduledDate: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActivities();
    loadContacts();
    loadUserInstitutions();
  }, []);

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
      const dataToSend = {
        ...formData,
        sharedWith: formData.sharedWith.map(id => id),
        institution: formData.institution || null,
        scheduledDate: formData.scheduledDate || null
      };

      if (editingActivity) {
        await activitiesAPI.update(editingActivity._id, dataToSend);
        toast.success('Actividad actualizada exitosamente');
      } else {
        await activitiesAPI.create(dataToSend);
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
      registerInCalendar: activity.registerInCalendar,
      scheduledDate: activity.scheduledDate ? moment(activity.scheduledDate).format('YYYY-MM-DDTHH:mm') : ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingActivity(null);
    setFormData({
      subject: '',
      comment: '',
      sharedWith: [],
      institution: '',
      registerInCalendar: false,
      scheduledDate: ''
    });
  };

  const handleSelectSlot = ({ start, end }) => {
    setFormData({
      subject: '',
      comment: '',
      sharedWith: [],
      institution: '',
      registerInCalendar: true,
      scheduledDate: moment(start).format('YYYY-MM-DDTHH:mm')
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

  // Filtrar actividades según el modo de vista
  const filteredActivities = viewMode === 'completed'
    ? activities.filter(a => a.status === 'completada')
    : activities.filter(a => a.status !== 'completada');

  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_progreso: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };
    return labels[status] || status;
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Actividades</h1>
        <div className="flex gap-3">
          <div className="flex gap-2 bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded ${viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
            >
              Calendario
            </button>
            <button
              onClick={() => setViewMode('completed')}
              className={`px-4 py-2 rounded ${viewMode === 'completed' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
            >
              Completadas
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Actividad
          </button>
        </div>
      </div>

      {/* List View */}
      {(viewMode === 'list' || viewMode === 'completed') && (
        <div className="space-y-4">
          {viewMode === 'completed' && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">Actividades Completadas</h3>
              <p className="text-sm text-green-600">Mostrando {filteredActivities.length} actividades completadas</p>
            </div>
          )}
          {filteredActivities.map((activity) => (
            <div key={activity._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{activity.subject}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.status)}`}>
                      {getStatusLabel(activity.status)}
                    </span>
                    {activity.registerInCalendar && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        <CalendarIcon size={14} className="inline mr-1" />
                        En Calendario
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(activity)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
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

              {/* Status buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <select
                  value={activity.status}
                  onChange={(e) => handleStatusChange(activity, e.target.value)}
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

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
              {viewMode === 'completed' ? 'No hay actividades completadas' : 'No hay actividades registradas'}
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
                  {contacts.map((contact) => (
                    <option key={contact.userId._id} value={contact.userId._id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Mantén Ctrl/Cmd para seleccionar múltiples</p>
              </div>

              <div>
                <label className="label">Fecha programada</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="registerInCalendar"
                  checked={formData.registerInCalendar}
                  onChange={(e) => setFormData({ ...formData, registerInCalendar: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="registerInCalendar" className="text-sm text-gray-700 cursor-pointer">
                  Registrar actividad en el calendario
                </label>
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
