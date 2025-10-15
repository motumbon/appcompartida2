import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import { Trash2, RotateCcw, Shield, User } from 'lucide-react';
import moment from 'moment';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  };

  const handleDelete = async (userId, username) => {
    if (username === 'administrador') {
      toast.error('No se puede eliminar al administrador principal');
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar al usuario ${username}?`)) {
      try {
        await usersAPI.delete(userId);
        toast.success('Usuario eliminado exitosamente');
        loadUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar usuario');
      }
    }
  };

  const handleResetPassword = async (userId, username) => {
    if (window.confirm(`¿Resetear contraseña de ${username}? La nueva contraseña será: 123abc`)) {
      try {
        await usersAPI.resetPassword(userId);
        toast.success(`Contraseña reseteada a "123abc" para ${username}`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al resetear contraseña');
      }
    }
  };

  const handlePermissionChange = async (userId, username, permissionType, value) => {
    if (username === 'administrador') {
      toast.error('No se puede modificar al administrador principal');
      return;
    }

    try {
      const updateData = {};
      
      if (permissionType === 'isAdmin') {
        updateData.isAdmin = value;
      } else {
        updateData.permissions = {
          [permissionType]: value
        };
      }

      await usersAPI.updatePermissions(userId, updateData);
      toast.success('Permisos actualizados');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar permisos');
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <p className="text-gray-600 mt-2">Administra los usuarios registrados en el sistema</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Admin</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actividades</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tareas</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reclamos</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Contratos</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status BO</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notas</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fichas Técnicas</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => {
                const permissions = user.permissions || {
                  activities: true,
                  tasks: true,
                  complaints: true,
                  contracts: true,
                  stock: true,
                  notes: true,
                  rawMaterials: true
                };

                return (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${user.isAdmin ? 'bg-red-100' : 'bg-blue-100'}`}>
                          {user.isAdmin ? (
                            <Shield className="text-red-600" size={18} />
                          ) : (
                            <User className="text-blue-600" size={18} />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={user.isAdmin}
                        onChange={(e) => handlePermissionChange(user._id, user.username, 'isAdmin', e.target.checked)}
                        disabled={user.username === 'administrador'}
                        className={`w-4 h-4 ${user.username === 'administrador' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.activities}
                        onChange={(e) => handlePermissionChange(user._id, user.username, 'activities', e.target.checked)}
                        disabled={user.username === 'administrador'}
                        className={`w-4 h-4 ${user.username === 'administrador' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.tasks}
                        onChange={(e) => handlePermissionChange(user._id, user.username, 'tasks', e.target.checked)}
                        disabled={user.username === 'administrador'}
                        className={`w-4 h-4 ${user.username === 'administrador' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.complaints}
                        onChange={(e) => handlePermissionChange(user._id, user.username, 'complaints', e.target.checked)}
                        disabled={user.username === 'administrador'}
                        className={`w-4 h-4 ${user.username === 'administrador' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.contracts}
                        onChange={(e) => handlePermissionChange(user._id, user.username, 'contracts', e.target.checked)}
                        disabled={user.username === 'administrador'}
                        className={`w-4 h-4 ${user.username === 'administrador' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.stock}
                        onChange={(e) => handlePermissionChange(user._id, user.username, 'stock', e.target.checked)}
                        disabled={user.username === 'administrador'}
                        className={`w-4 h-4 ${user.username === 'administrador' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.notes}
                        onChange={(e) => handlePermissionChange(user._id, user.username, 'notes', e.target.checked)}
                        disabled={user.username === 'administrador'}
                        className={`w-4 h-4 ${user.username === 'administrador' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions.rawMaterials}
                        onChange={(e) => handlePermissionChange(user._id, user.username, 'rawMaterials', e.target.checked)}
                        disabled={user.username === 'administrador'}
                        className={`w-4 h-4 ${user.username === 'administrador' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => handleResetPassword(user._id, user.username)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Resetear contraseña a 123abc"
                        >
                          <RotateCcw size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.username)}
                          disabled={user.username === 'administrador'}
                          className={`${
                            user.username === 'administrador'
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-800'
                          }`}
                          title={user.username === 'administrador' ? 'No se puede eliminar' : 'Eliminar usuario'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay usuarios registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
