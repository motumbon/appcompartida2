import { useState, useEffect } from 'react';
import { Upload, Trash2, Edit2, FileSpreadsheet } from 'lucide-react';
import { contractsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import moment from 'moment';

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const response = await contractsAPI.getAll();
      setContracts(response.data);
    } catch (error) {
      toast.error('Error al cargar contratos');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    try {
      const response = await contractsAPI.upload(selectedFile);
      toast.success(response.data.message);
      loadContracts();
      setShowModal(false);
      setSelectedFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este contrato?')) {
      try {
        await contractsAPI.delete(id);
        toast.success('Contrato eliminado');
        loadContracts();
      } catch (error) {
        toast.error('Error al eliminar contrato');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      activo: 'bg-green-100 text-green-800',
      finalizado: 'bg-gray-100 text-gray-800',
      cancelado: 'bg-red-100 text-red-800',
      suspendido: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Contratos</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Upload size={20} />
            Cargar Excel
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Solo los administradores pueden cargar archivos de contratos.
          </p>
        </div>
      )}

      {/* Contracts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Contrato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institución</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contract.contractNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {contract.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {contract.institution?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {moment(contract.startDate).format('DD/MM/YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {moment(contract.endDate).format('DD/MM/YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ${contract.amount?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                      {contract.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(contract._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <FileSpreadsheet className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">No hay contratos cargados</p>
            {isAdmin && (
              <p className="text-gray-400 text-sm mt-2">Sube un archivo Excel para comenzar</p>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Cargar Archivo Excel</h2>
            
            <div className="mb-6">
              <label className="label">Seleccionar archivo Excel</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="input"
              />
              {selectedFile && (
                <p className="text-sm text-green-600 mt-2">
                  Archivo seleccionado: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold mb-2">Formato esperado del Excel:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Numero de Contrato o contractNumber</li>
                <li>• Cliente o clientName</li>
                <li>• Fecha Inicio o startDate</li>
                <li>• Fecha Fin o endDate</li>
                <li>• Monto o amount (opcional)</li>
                <li>• Estado o status (opcional)</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {uploading ? 'Subiendo...' : 'Subir'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFile(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
