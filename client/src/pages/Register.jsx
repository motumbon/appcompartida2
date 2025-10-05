import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que el email sea de Gmail
    if (!formData.email.endsWith('@gmail.com')) {
      toast.error('El email debe ser una dirección válida de Gmail');
      return;
    }

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud de contraseña
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const result = await register(formData);

    if (result.success) {
      if (result.pending) {
        // Mostrar mensaje de pendiente de aprobación
        setPendingApproval(true);
        toast.success(result.message || 'Solicitud de registro enviada');
      } else {
        // Registro exitoso y aprobado (admin)
        toast.success('¡Registro exitoso!');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {pendingApproval ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
              <UserPlus className="text-yellow-600" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Solicitud Pendiente de Aprobación</h1>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                Tu solicitud de registro ha sido enviada exitosamente.
              </p>
              <p className="text-gray-700 mb-4">
                Un administrador debe aprobar tu cuenta antes de que puedas iniciar sesión.
              </p>
              <p className="text-sm text-gray-600">
                Recibirás una notificación una vez que tu cuenta sea aprobada.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
            >
              Volver al Inicio de Sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <UserPlus className="text-primary-600" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Crear Cuenta</h1>
              <p className="text-gray-600 mt-2">Regístrate para comenzar</p>
            </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="label">
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              placeholder="Elige un nombre de usuario"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email (Gmail)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="tucorreo@gmail.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Debe ser una dirección de Gmail válida</p>
          </div>

          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
