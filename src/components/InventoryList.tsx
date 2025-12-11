import { useState, useEffect } from 'react';
import { Edit2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'] & {
  suppliers?: Database['public']['Tables']['suppliers']['Row'];
};

interface InventoryListProps {
  searchTerm: string;
  statusFilter: string;
  refreshTrigger: number;
}

function InventoryList({ searchTerm, statusFilter, refreshTrigger }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    loadItems();
  }, [searchTerm, statusFilter, refreshTrigger]);

  const loadItems = async () => {
    setLoading(true);
    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        suppliers (*)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (searchTerm) {
      query = query.or(
        `item_id.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,model_family.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading items:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      in_stock: 'bg-green-100 text-green-800',
      sold: 'bg-blue-100 text-blue-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      returned: 'bg-orange-100 text-orange-800',
      doa: 'bg-red-100 text-red-800',
      personal_use: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Loading inventory...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-gray-900">
                      {item.item_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{item.model_family}</div>
                      <div className="text-gray-500">{item.screen_size}" {item.year}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.chip} / {item.ram_gb}GB / {item.storage_gb}GB
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      Grade {item.condition_grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.purchase_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No items found. Add your first inventory item to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Item Details</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Edit2 size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Item ID</label>
                <p className="font-mono font-semibold text-lg">{selectedItem.item_id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Model</label>
                <p className="text-gray-900">{selectedItem.model_family} {selectedItem.screen_size}"</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Year</label>
                <p className="text-gray-900">{selectedItem.year}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Chip</label>
                <p className="text-gray-900">{selectedItem.chip}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">RAM</label>
                <p className="text-gray-900">{selectedItem.ram_gb} GB</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Storage</label>
                <p className="text-gray-900">{selectedItem.storage_gb} GB</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Condition Grade</label>
                <p className="text-gray-900">Grade {selectedItem.condition_grade}</p>
              </div>

              {selectedItem.serial_number && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="text-gray-900 font-mono">{selectedItem.serial_number}</p>
                </div>
              )}

              {selectedItem.color && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Color</label>
                  <p className="text-gray-900">{selectedItem.color}</p>
                </div>
              )}

              {selectedItem.battery_cycle_count && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Battery Cycles</label>
                  <p className="text-gray-900">{selectedItem.battery_cycle_count}</p>
                </div>
              )}

              {selectedItem.battery_health_percent && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Battery Health</label>
                  <p className="text-gray-900">{selectedItem.battery_health_percent}%</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Cost</label>
                <p className="text-gray-900 font-semibold">${selectedItem.purchase_cost.toFixed(2)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                <p className="text-gray-900">{new Date(selectedItem.purchase_date).toLocaleDateString()}</p>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Condition Summary</label>
                <p className="text-gray-900">{selectedItem.condition_summary}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Accessories</label>
                <p className="text-gray-900">
                  {selectedItem.charger_included ? 'Charger' : ''}
                  {selectedItem.charger_included && selectedItem.box_included ? ' & ' : ''}
                  {selectedItem.box_included ? 'Box' : ''}
                  {!selectedItem.charger_included && !selectedItem.box_included ? 'None' : ''}
                </p>
              </div>

              {selectedItem.notes && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-900">{selectedItem.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InventoryList;
