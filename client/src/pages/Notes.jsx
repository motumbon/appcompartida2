import { useState, useEffect } from 'react';
import { StickyNote, Plus, Edit2, Trash2, X, Share2, Clock } from 'lucide-react';
import { notesAPI, contactsAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import moment from 'moment';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    comment: '',
    sharedWith: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotes();
    loadContacts();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await notesAPI.getNotes();
      setNotes(response.data);
    } catch (error) {
      toast.error('Error al cargar notas');
    }
  };

  const loadContacts = async () => {
    try {
      const response = await contactsAPI.getContacts();
      setContacts(response.data);
    } catch (error) {
      console.error('Error al cargar contactos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingNote) {
        await notesAPI.updateNote(editingNote._id, formData);
        toast.success('Nota actualizada exitosamente');
      } else {
        await notesAPI.createNote(formData);
        toast.success('Nota creada exitosamente');
      }
      
      loadNotes();
      handleCloseModal();
    } catch (error) {
      toast.error(editingNote ? 'Error al actualizar nota' : 'Error al crear nota');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta nota?')) return;

    try {
      await notesAPI.deleteNote(id);
      toast.success('Nota eliminada exitosamente');
      loadNotes();
    } catch (error) {
      toast.error('Error al eliminar nota');
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      subject: note.subject,
      comment: note.comment,
      sharedWith: note.sharedWith.map(c => c._id)
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setFormData({
      subject: '',
      comment: '',
      sharedWith: []
    });
  };

  const handleContactToggle = (contactId) => {
    setFormData(prev => ({
      ...prev,
      sharedWith: prev.sharedWith.includes(contactId)
        ? prev.sharedWith.filter(id => id !== contactId)
        : [...prev.sharedWith, contactId]
    }));
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notas</h1>
          <p className="text-gray-600 mt-1">Gestiona tus notas y compártelas con contactos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Nota
        </button>
      </div>

      {/* Lista de Notas */}
      {notes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <StickyNote className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay notas</h3>
          <p className="text-gray-500 mb-4">Crea tu primera nota para comenzar</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Nota
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-5 border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-2">
                  {note.subject}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(note)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 whitespace-pre-wrap line-clamp-4">
                {note.comment}
              </p>

              {note.sharedWith && note.sharedWith.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Share2 size={12} />
                    <span>Compartido con:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {note.sharedWith.map((contact) => (
                      <span
                        key={contact._id}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {contact.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-gray-500 pt-3 border-t border-gray-200">
                <Clock size={12} />
                <span>{moment(note.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                {note.updatedAt !== note.createdAt && (
                  <span className="text-gray-400 ml-1">(editada)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar Nota */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {editingNote ? 'Editar Nota' : 'Nueva Nota'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Asunto */}
              <div>
                <label className="label">
                  Asunto *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input"
                  placeholder="Título de la nota"
                  required
                />
              </div>

              {/* Comentario */}
              <div>
                <label className="label">
                  Comentario *
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="input min-h-[150px] resize-y"
                  placeholder="Escribe tu nota aquí..."
                  required
                />
              </div>

              {/* Compartir con */}
              <div>
                <label className="label flex items-center gap-2">
                  <Share2 size={16} />
                  Compartir con Contactos
                </label>
                {contacts.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No hay contactos disponibles</p>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {contacts.map((contact) => (
                        <label
                          key={contact._id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.sharedWith.includes(contact._id)}
                            onChange={() => handleContactToggle(contact._id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                            {contact.email && (
                              <p className="text-xs text-gray-500">{contact.email}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : editingNote ? 'Actualizar' : 'Crear Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
