import { useState, useEffect } from 'react';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { fr } from '../lib/translations';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'] & {
  suppliers?: Database['public']['Tables']['suppliers']['Row'];
};

type InventoryTab = 'in_stock' | 'sold';

interface InventoryListProps {
  searchTerm: string;
  statusFilter: string;
  refreshTrigger: number;
  onEdit: (item: InventoryItem) => void;
  activeTab?: InventoryTab;
}

function InventoryList({ searchTerm, statusFilter, refreshTrigger, onEdit, activeTab = 'in_stock' }: InventoryListProps) {
  const t = fr.inventory;
  const tc = fr.common;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    loadItems();
  }, [searchTerm, statusFilter, refreshTrigger, activeTab]);

  const loadItems = async () => {
    setLoading(true);
    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        suppliers (*)
      `)
      .order('created_at', { ascending: false });

    // Tab filtering
    if (activeTab === 'in_stock') {
      // Show all items EXCEPT sold
      query = query.neq('status', 'sold');
      
      // Additional status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
    } else if (activeTab === 'sold') {
      // Show only sold items
      query = query.eq('status', 'sold');
    }

    // Search filter
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

  const handleDelete = async (item: InventoryItem) => {
    // Protection: ne pas supprimer si l'item est vendu
    if (item.status === 'sold') {
      alert('❌ Impossible de supprimer cet article car il a été vendu. Les articles vendus doivent être conservés pour l\'historique des ventes.');
      return;
    }

    // Demander confirmation
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'article ${item.item_id}?\n\nCette action est irréversible.`
    );

    if (!confirmDelete) return;

    setDeletingItem(item);

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', item.id);

    if (error) {
      console.error('Error deleting item:', error);
      alert('Erreur lors de la suppression de l\'article.');
    } else {
      alert('✅ Article supprimé avec succès!');
      loadItems(); // Recharger la liste
    }

    setDeletingItem(null);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      in_stock: 'bg-green-100 text-green-700',
      sold: 'bg-blue-100 text-blue-700',
      reserved: 'bg-yellow-100 text-yellow-700',
      returned: 'bg-orange-100 text-orange-700',
      doa: 'bg-red-100 text-red-700',
      personal_use: 'bg-purple-100 text-purple-700',
    };

    const statusLabels: Record<string, string> = {
      in_stock: t.inStock,
      sold: t.sold,
      reserved: t.reserved,
      returned: t.returned,
      doa: t.doa,
      personal_use: t.personalUse,
    };

    return (
      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">{tc.loading}...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.itemId}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.model}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.specs}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.condition}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.cost}
                </th>
                {activeTab === 'sold' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date vendu
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc.actions}
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
                  {activeTab === 'sold' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.sold_date ? new Date(item.sold_date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-600 hover:text-blue-800"
                        title={tc.view}
                      >
                        <Eye size={18} />
                      </button>
                      {activeTab === 'in_stock' && (
                        <>
                          <button
                            onClick={() => onEdit(item)}
                            className="text-blue-600 hover:text-blue-800"
                            title={tc.edit}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className={`${
                              item.status === 'sold' 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-red-600 hover:text-red-800'
                            }`}
                            title={item.status === 'sold' ? 'Impossible de supprimer (vendu)' : tc.delete}
                            disabled={item.status === 'sold' || deletingItem?.id === item.id}
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'sold' ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    {activeTab === 'sold' 
                      ? 'Aucun article vendu trouvé.' 
                      : t.noItems}
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
              <h2 className="text-2xl font-bold text-gray-900">{t.itemDetails}</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Edit2 size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t.itemId}</label>
                <p className="font-mono font-semibold text-lg">{selectedItem.item_id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">{tc.status}</label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">{t.model}</label>
                <p className="text-gray-900">{selectedItem.model_family} {selectedItem.screen_size}"</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">{t.year}</label>
                <p className="text-gray-900">{selectedItem.year}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">{t.chip}</label>
                <p className="text-gray-900">{selectedItem.chip}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">{t.ram}</label>
                <p className="text-gray-900">{selectedItem.ram_gb} GB</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">{t.storage}</label>
                <p className="text-gray-900">{selectedItem.storage_gb} GB</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">{t.conditionGrade}</label>
                <p className="text-gray-900">Grade {selectedItem.condition_grade}</p>
              </div>

              {selectedItem.serial_number && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t.serialNumber}</label>
                  <p className="text-gray-900 font-mono">{selectedItem.serial_number}</p>
                </div>
              )}

              {selectedItem.color && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t.color}</label>
                  <p className="text-gray-900">{selectedItem.color}</p>
                </div>
              )}

              {selectedItem.battery_cycle_count && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t.batteryCycleCount}</label>
                  <p className="text-gray-900">{selectedItem.battery_cycle_count}</p>
                </div>
              )}

              {selectedItem.battery_health_percent && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t.batteryHealth}</label>
                  <p className="text-gray-900">{selectedItem.battery_health_percent}%</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">{t.purchaseCost}</label>
                <p className="text-gray-900 font-semibold">${selectedItem.purchase_cost.toFixed(2)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">{t.purchaseDate}</label>
                <p className="text-gray-900">{new Date(selectedItem.purchase_date).toLocaleDateString('fr-FR')}</p>
              </div>

              {selectedItem.sold_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Date vendu</label>
                  <p className="text-gray-900">{new Date(selectedItem.sold_date).toLocaleDateString('fr-FR')}</p>
                </div>
              )}

              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">{t.conditionSummary}</label>
                <p className="text-gray-900">{selectedItem.condition_summary}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">{t.accessories}</label>
                <p className="text-gray-900">
                  {selectedItem.charger_included ? 'Chargeur' : ''}
                  {selectedItem.charger_included && selectedItem.box_included ? ' & ' : ''}
                  {selectedItem.box_included ? 'Boîte' : ''}
                  {!selectedItem.charger_included && !selectedItem.box_included ? t.none : ''}
                </p>
              </div>

              {selectedItem.notes && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">{tc.notes}</label>
                  <p className="text-gray-900">{selectedItem.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                {tc.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InventoryList;
