import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserCircle, Calendar, CheckSquare, AlertCircle, 
  FileText, Users, Building2, TrendingUp 
} from 'lucide-react';
import { activitiesAPI, tasksAPI, complaintsAPI, contractsAPI } from '../services/api';

const Home = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    activities: 0,
    tasks: 0,
    complaints: 0,
    contracts: 0
  });
  const [loading, setLoading] = useState(true);

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

  const mainCards = [
    {
      title: 'Contactos',
      icon: UserCircle,
      color: 'bg-blue-500',
      link: '/contacts',
      description: 'Gestiona tus contactos e instituciones'
    },
    {
      title: 'Actividades',
      icon: Calendar,
      color: 'bg-green-500',
      link: '/activities',
      description: 'Planifica y registra actividades',
      stat: stats.activities
    },
    {
      title: 'Tareas',
      icon: CheckSquare,
      color: 'bg-purple-500',
      link: '/tasks',
      description: 'Seguimiento de tareas pendientes',
      stat: stats.tasks
    },
    {
      title: 'Reclamos',
      icon: AlertCircle,
      color: 'bg-orange-500',
      link: '/complaints',
      description: 'Gestiona reclamos de clientes',
      stat: stats.complaints
    },
    {
      title: 'Contratos',
      icon: FileText,
      color: 'bg-indigo-500',
      link: '/contracts',
      description: 'Visualiza información de contratos',
      stat: stats.contracts
    }
  ];

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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ¡Bienvenido, {user?.username}!
        </h1>
        <p className="text-gray-600">
          Panel de control - App Trabajo en Terreno 2.0
        </p>
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Accesos Rápidos</h2>
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
    </div>
  );
};

export default Home;
