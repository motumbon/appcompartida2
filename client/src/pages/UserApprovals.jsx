import { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, Mail, User } from 'lucide-react';
import { authAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import moment from 'moment';

const UserApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const response = await authAPI.getPendingUsers();
      setPendingUsers(response.data);
    } catch (error) {
      toast.error('Error al cargar solicitudes pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await authAPI.approveUser(userId);
      toast.success('Usuario aprobado exitosamente');
      loadPendingUsers();
    } catch (error) {
      toast.error('Error al aprobar usuario');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('¿Estás seguro de rechazar esta solicitud? El usuario será eliminado permanentemente.')) {
      return;
    }

    try {
      await authAPI.rejectUser(userId);
      toast.success('Usuario rechazado y eliminado');
      loadPendingUsers();
    } catch (error) {
      toast.error('Error al rechazar usuario');
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Aprobación de Usuarios</h1>
        <p className="text-gray-600 mt-2">Gestiona las solicitudes de registro de nuevos usuarios</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Clock className="mx-auto text-gray-400 mb-4 animate-spin" size={64} />
          <p className="text-gray-500">Cargando solicitudes...</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <UserCheck className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay solicitudes pendientes</h3>
          <p className="text-gray-500">Todas las solicitudes de registro han sido procesadas</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">
              Solicitudes Pendientes ({pendingUsers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="text-gray-400" size={20} />
                        <span className="font-medium text-gray-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="text-gray-400" size={16} />
                        <span className="text-gray-700">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="text-gray-400" size={16} />
                        {moment(user.createdAt).format('DD/MM/YYYY HH:mm')}
                        <span className="text-xs text-gray-500">
                          ({moment(user.createdAt).fromNow()})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(user._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors text-sm font-medium"
                        >
                          <UserCheck size={16} />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(user._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium"
                        >
                          <UserX size={16} />
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApprovals;
