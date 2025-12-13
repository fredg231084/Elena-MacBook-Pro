import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import InventoryItemForm from './InventoryItemForm';
import InventoryList from './InventoryList';
import { fr } from '../lib/translations';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

type InventoryTab = 'in_stock' | 'sold';

function Inventory() {
  const t = fr.inventory;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<InventoryTab>('in_stock');

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

  const handleItemSaved = () => {
    setIsAddingItem(false);
    setEditingItem(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsAddingItem(false);
  };

  const handleCancel = () => {
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleTabChange = (tab: InventoryTab) => {
    setActiveTab(tab);
    setStatusFilter('all'); // Reset filter when changing tabs
    setSearchTerm(''); // Reset search when changing tabs
  };

  // Status options based on active tab
  const getStatusOptions = () => {
    if (activeTab === 'in_stock') {
      return [
        { value: 'all', label: t.allStatus },
        { value: 'in_stock', label: t.inStock },
        { value: 'reserved', label: t.reserved },
        { value: 'returned', label: t.returned },
        { value: 'doa', label: t.doa },
        { value: 'personal_use', label: t.personalUse },
      ];
    } else {
      return [
        { value: 'all', label: t.allStatus },
        { value: 'sold', label: t.sold },
      ];
    }
  };

  const statusOptions = getStatusOptions();

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600 mt-1">{t.subtitle}</p>
            </div>
            {!isAddingItem && !editingItem && (
              <button
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={18} />
                {t.addItem}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 italic">{t.helperText}</p>
        </div>

        {(isAddingItem || editingItem) && (
          <InventoryItemForm
            suppliers={suppliers}
            editingItem={editingItem}
            onCancel={handleCancel}
            onSuccess={handleItemSaved}
          />
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => handleTabChange('in_stock')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'in_stock'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📦 En stock
              </button>
              <button
                onClick={() => handleTabChange('sold')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'sold'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✅ Vendus
              </button>
            </nav>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
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
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <InventoryList
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          refreshTrigger={refreshTrigger}
          onEdit={handleEdit}
          activeTab={activeTab}
        />

        <footer className="mt-8 text-center text-sm text-gray-500">
          {fr.common.footer}
        </footer>
      </div>
    </div>
  );
}

export default Inventory;
