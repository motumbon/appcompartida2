import { useState, useEffect } from 'react';
import { Upload, Search, RefreshCw, Calendar, User, FileSpreadsheet } from 'lucide-react';
import { stockAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import moment from 'moment';

const Stock = () => {
  const [stock, setStock] = useState({ items: [], uploadedBy: null, uploadedAt: null, fileName: null });
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({
    linea: '',
    codigo: '',
    material: '',
    observacion: '',
    status: ''
  });

  useEffect(() => {
    loadStock();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stock.items, filters]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const response = await stockAPI.getStock();
      setStock(response.data);
    } catch (error) {
      console.error('Error al cargar stock:', error);
      toast.error('Error al cargar stock');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea un archivo Excel
    const validExtensions = ['xls', 'xlsx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Por favor selecciona un archivo Excel (.xls o .xlsx)');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      await stockAPI.uploadExcel(file);
      toast.success('Stock actualizado exitosamente');
      loadStock();
      e.target.value = '';
    } catch (error) {
      console.error('Error al subir archivo:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      
      const errorData = error.response?.data;
      let errorMessage = errorData?.message || 'Error al subir archivo';
      
      // Si hay columnas detectadas, mostrarlas
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
    let filtered = [...stock.items];

    // Aplicar filtros
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(item => 
          String(item[key] || '').toLowerCase().includes(filters[key].toLowerCase())
        );
      }
    });

    setFilteredItems(filtered);
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const clearFilters = () => {
    setFilters({
      linea: '',
      codigo: '',
      material: '',
      observacion: '',
      status: ''
    });
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Status BO</h1>
          <p className="text-gray-600 mt-1">Gestión de Stock de Productos</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadStock}
            className="btn btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <label className="btn btn-primary flex items-center gap-2 cursor-pointer">
            <Upload size={20} />
            {uploading ? 'Subiendo...' : 'Subir Excel'}
            <input
              type="file"
              className="hidden"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Upload Info */}
      {stock.uploadedBy && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-blue-800">
                <User size={18} />
                <span className="font-semibold">
                  {stock.uploadedBy.name || stock.uploadedBy.username}
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Calendar size={18} />
                <span>{moment(stock.uploadedAt).format('DD/MM/YYYY HH:mm')}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <FileSpreadsheet size={18} />
                <span>{stock.fileName}</span>
              </div>
            </div>
            <div className="text-blue-800 font-semibold">
              {filteredItems.length} productos
            </div>
          </div>
        </div>
      )}

      {/* No data */}
      {stock.items.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileSpreadsheet size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay datos de stock
          </h3>
          <p className="text-gray-500 mb-6">
            Sube un archivo Excel para comenzar a visualizar el stock de productos
          </p>
          <label className="btn btn-primary inline-flex items-center gap-2 cursor-pointer">
            <Upload size={20} />
            Subir primer archivo
            <input
              type="file"
              className="hidden"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {/* Table */}
      {stock.items.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="mb-2">Línea</div>
                    <input
                      type="text"
                      value={filters.linea}
                      onChange={(e) => handleFilterChange('linea', e.target.value)}
                      placeholder="Filtrar..."
                      className="input-sm text-xs w-full"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="mb-2">Código</div>
                    <input
                      type="text"
                      value={filters.codigo}
                      onChange={(e) => handleFilterChange('codigo', e.target.value)}
                      placeholder="Filtrar..."
                      className="input-sm text-xs w-full"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="mb-2">Material</div>
                    <input
                      type="text"
                      value={filters.material}
                      onChange={(e) => handleFilterChange('material', e.target.value)}
                      placeholder="Filtrar..."
                      className="input-sm text-xs w-full"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="mb-2">Observación</div>
                    <input
                      type="text"
                      value={filters.observacion}
                      onChange={(e) => handleFilterChange('observacion', e.target.value)}
                      placeholder="Filtrar..."
                      className="input-sm text-xs w-full"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="mb-2">Status</div>
                    <input
                      type="text"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      placeholder="Filtrar..."
                      className="input-sm text-xs w-full"
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.linea}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.codigo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.material}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.observacion}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status?.toLowerCase().includes('stock') 
                          ? 'bg-green-100 text-green-800'
                          : item.status?.toLowerCase().includes('disponible')
                          ? 'bg-blue-100 text-blue-800'
                          : item.status?.toLowerCase().includes('bo tool')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Filter actions */}
          {Object.values(filters).some(f => f) && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Mostrando {filteredItems.length} de {stock.items.length} productos
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
              >
                <Search size={16} />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Stock;
