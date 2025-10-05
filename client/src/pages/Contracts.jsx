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
  const [filters, setFilters] = useState({});
  const [uploading, setUploading] = useState(false);
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
  }, [contract.items, selectedKam, filters]);

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
    try {
      await contractsAPI.uploadExcel(file);
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
    const endDate = moment(item.finValidez, ['DD-MM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'], true);
    
    if (!endDate.isValid()) return 'bg-gray-100 text-gray-800';
    
    const daysDiff = endDate.diff(today, 'days');
    
    if (daysDiff < 0) return 'bg-red-100 text-red-800';
    if (daysDiff <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusLabel = (item) => {
    if (!item.finValidez) return 'Sin fecha';
    
    const today = moment();
    const endDate = moment(item.finValidez, ['DD-MM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'], true);
    
    if (!endDate.isValid()) return 'Fecha inválida';
    
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

        {/* Información de carga */}
        {contract.uploadedBy && (
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
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vigentes</p>
                <p className="text-2xl font-bold text-green-600">{stats.vigentes}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Próximos a Vencer</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.proxVencer}</p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Filtro Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={filters.cliente || ''}
              onChange={(e) => handleFilterChange('cliente', e.target.value)}
              placeholder="Filtrar por cliente..."
              className="input w-full"
            />
          </div>

          {/* Filtro Nombre Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Cliente
            </label>
            <input
              type="text"
              value={filters.nomCliente || ''}
              onChange={(e) => handleFilterChange('nomCliente', e.target.value)}
              placeholder="Filtrar por nombre..."
              className="input w-full"
            />
          </div>

          {/* Filtro Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material
            </label>
            <input
              type="text"
              value={filters.material || ''}
              onChange={(e) => handleFilterChange('material', e.target.value)}
              placeholder="Filtrar por material..."
              className="input w-full"
            />
          </div>

          {/* Filtro Tipo Contrato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Contrato
            </label>
            <input
              type="text"
              value={filters.tipoCtto || ''}
              onChange={(e) => handleFilterChange('tipoCtto', e.target.value)}
              placeholder="Filtrar por tipo..."
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Línea</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KAM</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denominación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{item.linea}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.kamRepr}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.cliente}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.nomCliente}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.numPedido}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.material}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{item.denominacion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.inicioValidez}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.finValidez}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.tipoCtto}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item)}`}>
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
