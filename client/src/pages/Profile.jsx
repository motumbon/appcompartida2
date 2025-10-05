import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import { Camera, Lock, Trash2, User } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(user?.profileImage || null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!profileImage) {
      toast.error('Selecciona una imagen primero');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', profileImage);

      await usersAPI.uploadProfileImage(formData);
      toast.success('Imagen de perfil actualizada');
      setProfileImage(null);
    } catch (error) {
      toast.error('Error al subir imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await usersAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Contraseña actualizada exitosamente');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await usersAPI.deleteAccount();
      toast.success('Cuenta eliminada exitosamente');
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (error) {
      toast.error('Error al eliminar cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mi Perfil</h1>

      {/* Información del usuario */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700">
              <Camera size={20} />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            {user?.isAdmin && (
              <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Administrador
              </span>
            )}
            {profileImage && (
              <button
                onClick={handleUploadImage}
                disabled={loading}
                className="mt-3 btn btn-primary text-sm"
              >
                {loading ? 'Subiendo...' : 'Guardar nueva imagen'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Lock size={24} className="text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-800">Cambiar Contraseña</h3>
          </div>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="btn btn-secondary text-sm"
          >
            {showChangePassword ? 'Cancelar' : 'Cambiar'}
          </button>
        </div>

        {showChangePassword && (
          <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
            <div>
              <label className="label">Contraseña actual</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Nueva contraseña</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                className="input"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}
      </div>

      {/* Eliminar cuenta */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trash2 size={24} className="text-red-600" />
            <div>
              <h3 className="text-xl font-semibold text-red-800">Zona de Peligro</h3>
              <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteAccount(!showDeleteAccount)}
            className="btn btn-danger text-sm"
          >
            {showDeleteAccount ? 'Cancelar' : 'Eliminar cuenta'}
          </button>
        </div>

        {showDeleteAccount && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <p className="text-red-800 mb-4">
              ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción eliminará todos tus datos y no se puede revertir.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="btn btn-danger w-full"
            >
              {loading ? 'Eliminando...' : 'Confirmar eliminación de cuenta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
