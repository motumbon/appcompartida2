import { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, Calendar, AlertTriangle, CheckCircle, Clock, Filter, X, TrendingUp } from 'lucide-react';
import { contractsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import moment from 'moment';

const Contracts = () => {
  const [contract, setContract] = useState({ items: [], uploadedBy: null, uploadedAt: null, fileName: null });
  const [filteredData, setFilteredData] = useState([]);
  const [selectedKam, setSelectedKam] = useState('');
  const [kamOptions, setKamOptions] = useState([]);
  const [clienteOptions, setClienteOptions] = useState([]);
  const [filters, setFilters] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    vigentes: 0,
    proxVencer: 0,
    vencidos: 0
  });
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [contract.items, selectedKam, filters, statusFilter]);

  useEffect(() => {
    // Actualizar opciones de clientes cuando cambia el KAM
    if (selectedKam && contract.items.length > 0) {
      const clientesDeKam = contract.items
        .filter(item => item.kamRepr === selectedKam)
        .map(item => item.nomCliente)
        .filter(Boolean);
      const uniqueClientes = [...new Set(clientesDeKam)].sort();
      setClienteOptions(uniqueClientes);
    } else if (contract.items.length > 0) {
      const todosClientes = contract.items
        .map(item => item.nomCliente)
        .filter(Boolean);
      const uniqueClientes = [...new Set(todosClientes)].sort();
      setClienteOptions(uniqueClientes);
    } else {
      setClienteOptions([]);
    }
  }, [selectedKam, contract.items]);

  const loadContracts = async () => {
    try {
      const response = await contractsAPI.getContracts();
      setContract(response.data);
      
      if (response.data.items && response.data.items.length > 0) {
        // Extraer KAMs únicos
        const kams = [...new Set(response.data.items.map(item => item.kamRepr).filter(Boolean))].sort();
        setKamOptions(kams);
        
        // Si solo hay un KAM, seleccionarlo automáticamente
        if (kams.length === 1) {
          setSelectedKam(kams[0]);
        }
      }
    } catch (error) {
      toast.error('Error al cargar contratos');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor selecciona un archivo Excel (.xls o .xlsx)');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      await contractsAPI.uploadExcel(file, (progress) => {
        setUploadProgress(progress);
      });
      
      setUploadProgress(100);
      toast.success('Contratos actualizados exitosamente');
      loadContracts();
      e.target.value = '';
    } catch (error) {
      console.error('Error al subir archivo:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      
      const errorData = error.response?.data;
      let errorMessage = errorData?.message || 'Error al subir archivo';
      
      if (errorData?.columnas) {
        console.error('Columnas detectadas en el Excel:', errorData.columnas);
        errorMessage += '\n\nColumnas detectadas: ' + errorData.columnas.join(', ');
      }
      
      toast.error(errorMessage, { autoClose: 10000 });
      e.target.value = '';
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const applyFilters = () => {
    let filtered = [...contract.items];

    // Filtro principal por KAM
    if (selectedKam) {
      filtered = filtered.filter(item => item.kamRepr === selectedKam);
    }

    // Aplicar otros filtros
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(item =>
          String(item[key] || '').toLowerCase().includes(filters[key].toLowerCase())
        );
      }
    });

    // Filtro por estado (vigente, próximo a vencer, vencido)
    if (statusFilter) {
      const today = moment();
      filtered = filtered.filter(item => {
        if (!item.finValidez) return statusFilter === 'sin-fecha';
        
        const endDate = moment(item.finValidez, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
        if (!endDate.isValid()) return statusFilter === 'sin-fecha';
        
        const daysDiff = endDate.diff(today, 'days');
        
        if (statusFilter === 'vigentes') return daysDiff > 30;
        if (statusFilter === 'proxVencer') return daysDiff >= 0 && daysDiff <= 30;
        if (statusFilter === 'vencidos') return daysDiff < 0;
        return true;
      });
    }

    setFilteredData(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (data) => {
    const today = moment();
    const stats = {
      total: data.length,
      vigentes: 0,
      proxVencer: 0,
      vencidos: 0
    };

    data.forEach(item => {
      if (item.finValidez) {
        const endDate = moment(item.finValidez, ['DD-MM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'], true);
        
        if (endDate.isValid()) {
          const daysDiff = endDate.diff(today, 'days');
          
          if (daysDiff < 0) {
            stats.vencidos++;
          } else if (daysDiff <= 30) {
            stats.proxVencer++;
          } else {
            stats.vigentes++;
          }
        }
      }
    });

    setStats(stats);
  };

  const getStatusColor = (item) => {
    if (!item.finValidez) return 'bg-gray-100 text-gray-800';
    
    const today = moment();
    // Intentar múltiples formatos de fecha
    const endDate = moment(item.finValidez, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY'], true);
    
    if (!endDate.isValid()) {
      console.log('Fecha inválida:', item.finValidez);
      return 'bg-gray-100 text-gray-800';
    }
    
    const daysDiff = endDate.diff(today, 'days');
    
    if (daysDiff < 0) return 'bg-red-100 text-red-800';
    if (daysDiff <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusLabel = (item) => {
    if (!item.finValidez) return 'Sin fecha';
    
    const today = moment();
    // Intentar múltiples formatos de fecha
    const endDate = moment(item.finValidez, ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY'], true);
    
    if (!endDate.isValid()) {
      console.log('Fecha no reconocida:', item.finValidez);
      return 'Fecha inválida';
    }
    
    const daysDiff = endDate.diff(today, 'days');
    
    if (daysDiff < 0) return `Vencido (${Math.abs(daysDiff)} días)`;
    if (daysDiff <= 30) return `Vence en ${daysDiff} días`;
    return 'Vigente';
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedKam('');
    setStatusFilter('');
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Contratos</h1>
          <div className="flex gap-3">
            {isAdmin && (
              <label className="btn btn-primary flex items-center gap-2 cursor-pointer">
                <Upload size={20} />
                {uploading ? 'Subiendo...' : 'Subir Excel'}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>

        {/* Barra de progreso de carga */}
        {uploading && (
          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-blue-900">Subiendo archivo...</p>
              <p className="text-sm font-bold text-blue-600">{uploadProgress}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {uploadProgress < 100 ? 'Procesando archivo Excel...' : 'Finalizando...'}
            </p>
          </div>
        )}

        {/* Información de carga */}
        {contract.uploadedBy && !uploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Última actualización por: {contract.uploadedBy.name || contract.uploadedBy.username}
                </p>
                <p className="text-xs text-blue-700">
                  {moment(contract.uploadedAt).format('DD/MM/YYYY HH:mm')} - {contract.fileName}
                </p>
              </div>
            </div>
            <p className="text-lg font-bold text-blue-900">
              {contract.items.length} contratos
            </p>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div 
            onClick={() => setStatusFilter(statusFilter === '' ? '' : '')}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-shadow ${statusFilter === '' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="text-blue-500" size={32} />
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === 'vigentes' ? '' : 'vigentes')}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition-shadow ${statusFilter === 'vigentes' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vigentes</p>
                <p className="text-2xl font-bold text-green-600">{stats.vigentes}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === 'proxVencer' ? '' : 'proxVencer')}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-shadow ${statusFilter === 'proxVencer' ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Próximos a Vencer</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.proxVencer}</p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === 'vencidos' ? '' : 'vencidos')}
            className={`bg-white rounded-lg shadow p-4 border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-shadow ${statusFilter === 'vencidos' ? 'ring-2 ring-red-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
              </div>
              <AlertTriangle className="text-red-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
          {(selectedKam || Object.keys(filters).some(k => filters[k])) && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <X size={16} />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro principal KAM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KAM / Representante *
            </label>
            <select
              value={selectedKam}
              onChange={(e) => setSelectedKam(e.target.value)}
              className="input w-full"
            >
              <option value="">Todos los KAMs</option>
              {kamOptions.map(kam => (
                <option key={kam} value={kam}>{kam}</option>
              ))}
            </select>
          </div>

          {/* Filtro Nombre Cliente (Dropdown) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Cliente
            </label>
            <select
              value={filters.nomCliente || ''}
              onChange={(e) => handleFilterChange('nomCliente', e.target.value)}
              className="input w-full"
            >
              <option value="">Todos los clientes</option>
              {clienteOptions.map(cliente => (
                <option key={cliente} value={cliente}>{cliente}</option>
              ))}
            </select>
          </div>

          {/* Filtro Material (filtra por Denominación) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material
            </label>
            <input
              type="text"
              value={filters.denominacion || ''}
              onChange={(e) => handleFilterChange('denominacion', e.target.value)}
              placeholder="Filtrar por material..."
              className="input w-full"
            />
          </div>

          {/* Filtro Línea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Línea
            </label>
            <input
              type="text"
              value={filters.linea || ''}
              onChange={(e) => handleFilterChange('linea', e.target.value)}
              placeholder="Filtrar por línea..."
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      {contract.items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay contratos cargados</h3>
          <p className="text-gray-500 mb-4">Sube un archivo Excel con la hoja "DDBB" para comenzar</p>
          {isAdmin && (
            <label className="btn btn-primary inline-flex items-center gap-2 cursor-pointer">
              <Upload size={20} />
              Subir Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full table-auto">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '80px' }}>Línea</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '100px' }}>Cliente</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '200px' }}>Nombre Cliente</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>Nº Pedido</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '120px' }}>Material</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '250px' }}>Denominación</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '100px' }}>Inicio</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '100px' }}>Fin</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap" style={{ minWidth: '150px' }}>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-700">{item.linea}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{item.cliente}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{item.nomCliente}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{item.numPedido}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{item.material}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">
                      <div className="max-w-xs overflow-hidden text-ellipsis" title={item.denominacion}>
                        {item.denominacion}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700">{item.inicioValidez}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{item.finValidez}</td>
                    <td className="px-3 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(item)}`}>
                        {getStatusLabel(item)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && contract.items.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron contratos con los filtros aplicados</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {filteredData.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-semibold">{filteredData.length}</span> de <span className="font-semibold">{contract.items.length}</span> contratos
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Contracts;
