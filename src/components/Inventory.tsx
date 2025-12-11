import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import AddInventoryItem from './AddInventoryItem';
import InventoryList from './InventoryList';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

function Inventory() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('supplier_code');

    if (error) {
      console.error('Error loading suppliers:', error);
    } else {
      setSuppliers(data || []);
    }
  };

  const handleItemAdded = () => {
    setIsAddingItem(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600 mt-1">Manage your MacBook inventory</p>
          </div>
          {!isAddingItem && (
            <button
              onClick={() => setIsAddingItem(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Item
            </button>
          )}
        </div>

        {isAddingItem && (
          <AddInventoryItem
            suppliers={suppliers}
            onCancel={() => setIsAddingItem(false)}
            onSuccess={handleItemAdded}
          />
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by item ID, serial, model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="sold">Sold</option>
                <option value="reserved">Reserved</option>
                <option value="returned">Returned</option>
                <option value="doa">DOA</option>
                <option value="personal_use">Personal Use</option>
              </select>
            </div>
          </div>
        </div>

        <InventoryList
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}

export default Inventory;
