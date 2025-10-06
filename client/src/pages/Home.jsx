import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserCircle, Calendar, CheckSquare, AlertCircle, 
  FileText, Users, Building2, Package, StickyNote, Settings, X
} from 'lucide-react';
import { activitiesAPI, tasksAPI, complaintsAPI, contractsAPI, authAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';

const Home = () => {
  const { user, isAdmin, refreshUser } = useAuth();
  const [stats, setStats] = useState({
    activities: 0,
    tasks: 0,
    complaints: 0,
    contracts: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [activitiesRes, tasksRes, complaintsRes, contractsRes] = await Promise.all([
        activitiesAPI.getAll(),
        tasksAPI.getAll(),
        complaintsAPI.getAll(),
        contractsAPI.getContracts()
      ]);

      setStats({
        activities: activitiesRes.data.length,
        tasks: tasksRes.data.length,
        complaints: complaintsRes.data.length,
        contracts: contractsRes.data.items ? contractsRes.data.items.length : 0
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Todas las interfaces disponibles
  const allAvailableCards = [
    {
      id: 'contacts',
      title: 'Contactos',
      icon: UserCircle,
      color: 'bg-blue-500',
      link: '/contacts',
      description: 'Gestiona tus contactos e instituciones'
    },
    {
      id: 'activities',
      title: 'Actividades',
      icon: Calendar,
      color: 'bg-green-500',
      link: '/activities',
      description: 'Planifica y registra actividades',
      stat: stats.activities
    },
    {
      id: 'tasks',
      title: 'Tareas',
      icon: CheckSquare,
      color: 'bg-purple-500',
      link: '/tasks',
      description: 'Seguimiento de tareas pendientes',
      stat: stats.tasks
    },
    {
      id: 'complaints',
      title: 'Reclamos',
      icon: AlertCircle,
      color: 'bg-orange-500',
      link: '/complaints',
      description: 'Gestiona reclamos de clientes',
      stat: stats.complaints
    },
    {
      id: 'contracts',
      title: 'Contratos',
      icon: FileText,
      color: 'bg-indigo-500',
      link: '/contracts',
      description: 'Visualiza información de contratos',
      stat: stats.contracts
    },
    {
      id: 'stock',
      title: 'Status BO',
      icon: Package,
      color: 'bg-cyan-500',
      link: '/stock',
      description: 'Consulta el estado de Back Orders'
    },
    {
      id: 'notes',
      title: 'Notas',
      icon: StickyNote,
      color: 'bg-yellow-500',
      link: '/notes',
      description: 'Crea y comparte notas'
    }
  ];

  // Filtrar cards según preferencias del usuario
  const userQuickAccess = user?.quickAccessItems || ['contacts', 'activities', 'tasks', 'complaints', 'contracts'];
  const mainCards = allAvailableCards.filter(card => userQuickAccess.includes(card.id));

  const adminCards = [
    {
      title: 'Gestión de Usuarios',
      icon: Users,
      color: 'bg-red-500',
      link: '/admin/users',
      description: 'Administra usuarios del sistema'
    },
    {
      title: 'Gestión de Instituciones',
      icon: Building2,
      color: 'bg-teal-500',
      link: '/admin/institutions',
      description: 'Administra instituciones'
    }
  ];

  const handleOpenCustomize = () => {
    setSelectedItems([...userQuickAccess]);
    setShowCustomizeModal(true);
  };

  const handleToggleItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSaveQuickAccess = async () => {
    try {
      await authAPI.updateQuickAccess(selectedItems);
      await refreshUser(); // Recargar datos del usuario
      toast.success('Accesos rápidos actualizados exitosamente');
      setShowCustomizeModal(false);
    } catch (error) {
      toast.error('Error al actualizar accesos rápidos');
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Bienvenido, {user?.username}!
          </h1>
          <p className="text-gray-600">
            Panel de control - App Trabajo en Terreno 2.0
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Actividades</p>
                <p className="text-3xl font-bold text-gray-800">{stats.activities}</p>
              </div>
              <Calendar className="text-green-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tareas Pendientes</p>
                <p className="text-3xl font-bold text-gray-800">{stats.tasks}</p>
              </div>
              <CheckSquare className="text-purple-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Reclamos Activos</p>
                <p className="text-3xl font-bold text-gray-800">{stats.complaints}</p>
              </div>
              <AlertCircle className="text-orange-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Contratos</p>
                <p className="text-3xl font-bold text-gray-800">{stats.contracts}</p>
              </div>
              <FileText className="text-indigo-500" size={40} />
            </div>
          </div>
        </div>
      )}

      {/* Main Cards */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Accesos Rápidos</h2>
          <button
            onClick={handleOpenCustomize}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Settings size={18} />
            Personalizar
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="text-white" size={28} />
                  </div>
                  {card.stat !== undefined && (
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {card.stat}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Admin Cards */}
      {isAdmin && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Administración</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.link}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-200"
                >
                  <div className={`${card.color} p-3 rounded-lg inline-block mb-4`}>
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Personalización */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Personalizar Accesos Rápidos</h2>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Selecciona las interfaces que quieres ver en tus accesos rápidos. Puedes agregar o quitar las que prefieras.
              </p>

              <div className="space-y-3">
                {allAvailableCards.map((card) => {
                  const Icon = card.icon;
                  const isSelected = selectedItems.includes(card.id);
                  
                  return (
                    <label
                      key={card.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleItem(card.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className={`${card.color} p-2 rounded-lg`}>
                        <Icon className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{card.title}</h3>
                        <p className="text-sm text-gray-600">{card.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-4">
                  {selectedItems.length} de {allAvailableCards.length} interfaces seleccionadas
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCustomizeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveQuickAccess}
                    disabled={selectedItems.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
