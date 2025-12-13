import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { fr } from '../lib/translations';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];
type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory_items']['Insert'];

interface InventoryItemFormProps {
  suppliers: Supplier[];
  editingItem?: InventoryItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

function InventoryItemForm({ suppliers, editingItem, onCancel, onSuccess }: InventoryItemFormProps) {
  const t = fr.inventory;
  const tc = fr.common;
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [formData, setFormData] = useState<Partial<InventoryInsert>>({
    supplier_id: '',
    supplier_item_number: '',
    model_family: 'MacBook Pro',
    screen_size: '14',
    chip: 'M1',
    ram_gb: 8,
    storage_gb: 256,
    year: new Date().getFullYear(),
    condition_grade: 'A',
    condition_summary: '',
    charger_included: true,
    box_included: false,
    purchase_cost: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'in_stock',
    po_id: null,
  });

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    }
  }, [editingItem]);

  useEffect(() => {
    if (formData.supplier_id) {
      loadPurchaseOrders(formData.supplier_id);
    }
  }, [formData.supplier_id]);

  const loadPurchaseOrders = async (supplierId: string) => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error loading POs:', error);
    } else {
      setPurchaseOrders(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id || !formData.supplier_item_number) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);
    if (!selectedSupplier) {
      alert('Veuillez sélectionner un fournisseur valide');
      return;
    }

    const itemId = `${selectedSupplier.supplier_code}${formData.supplier_item_number}`;

    if (editingItem) {
      const { id, item_id, created_at, ...updateData } = formData as InventoryItem;
      const { error } = await supabase
        .from('inventory_items')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id);

      if (error) {
        console.error('Error updating item:', error);
        alert('Erreur lors de la mise à jour de l\'article');
      } else {
        onSuccess();
      }
    } else {
      const { error } = await supabase
        .from('inventory_items')
        .insert([{
          ...formData,
          item_id: itemId,
        } as InventoryInsert]);

      if (error) {
        console.error('Error adding item:', error);
        alert('Erreur lors de l\'ajout de l\'article. L\'ID existe peut-être déjà.');
      } else {
        onSuccess();
      }
    }
  };

  const modelFamilies = ['MacBook Pro', 'MacBook Air', 'MacBook'];
  const screenSizes = ['13', '14', '15', '16'];
  const chips = ['M1', 'M2', 'M3', 'M1 Pro', 'M1 Max', 'M2 Pro', 'M2 Max', 'M3 Pro', 'M3 Max', 'i5', 'i7', 'i9'];
  const conditionGrades = ['A', 'B', 'C'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">
        {editingItem ? t.editItem : t.addNewItem}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">{t.identification}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.supplier} *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value, po_id: null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingItem}
                >
                  <option value="">{t.selectSupplier}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplier_code} - {supplier.supplier_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.supplierItemNumber} *
                </label>
                <input
                  type="text"
                  value={formData.supplier_item_number}
                  onChange={(e) => setFormData({ ...formData, supplier_item_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="286775"
                  required
                  disabled={!!editingItem}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.purchaseOrder}
                </label>
                <select
                  value={formData.po_id || ''}
                  onChange={(e) => setFormData({ ...formData, po_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.supplier_id}
                >
                  <option value="">{t.noPO}</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} - {new Date(po.order_date).toLocaleDateString('fr-FR')} ({po.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.modelFamily} *
                </label>
                <select
                  value={formData.model_family}
                  onChange={(e) => setFormData({ ...formData, model_family: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {modelFamilies.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.screenSize} *
                </label>
                <select
                  value={formData.screen_size}
                  onChange={(e) => setFormData({ ...formData, screen_size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {screenSizes.map((size) => (
                    <option key={size} value={size}>{size}"</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.chip} *
                </label>
                <select
                  value={formData.chip}
                  onChange={(e) => setFormData({ ...formData, chip: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {chips.map((chip) => (
                    <option key={chip} value={chip}>{chip}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.ram} *
                </label>
                <input
                  type="number"
                  value={formData.ram_gb}
                  onChange={(e) => setFormData({ ...formData, ram_gb: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="4"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.storage} *
                </label>
                <input
                  type="number"
                  value={formData.storage_gb}
                  onChange={(e) => setFormData({ ...formData, storage_gb: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="128"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.year} *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="2010"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.serialNumber}
                </label>
                <input
                  type="text"
                  value={formData.serial_number || ''}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.color}
                </label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.keyboardLayout}
                </label>
                <input
                  type="text"
                  value={formData.keyboard_layout || ''}
                  onChange={(e) => setFormData({ ...formData, keyboard_layout: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.osInstalled}
                </label>
                <input
                  type="text"
                  value={formData.os_installed || ''}
                  onChange={(e) => setFormData({ ...formData, os_installed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">{t.condition}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.conditionGrade} *
                </label>
                <select
                  value={formData.condition_grade}
                  onChange={(e) => setFormData({ ...formData, condition_grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {conditionGrades.map((grade) => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.batteryCycleCount}
                </label>
                <input
                  type="number"
                  value={formData.battery_cycle_count || ''}
                  onChange={(e) => setFormData({ ...formData, battery_cycle_count: parseInt(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.batteryHealth}
                </label>
                <input
                  type="number"
                  value={formData.battery_health_percent || ''}
                  onChange={(e) => setFormData({ ...formData, battery_health_percent: parseInt(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.conditionSummary} *
                </label>
                <textarea
                  value={formData.condition_summary}
                  onChange={(e) => setFormData({ ...formData, condition_summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder={t.conditionSummaryHelper}
                  required
                />
                <p className="text-xs text-gray-500 mt-1 italic">{t.conditionSummaryHelper}</p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.charger_included}
                    onChange={(e) => setFormData({ ...formData, charger_included: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{t.chargerIncluded}</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.box_included}
                    onChange={(e) => setFormData({ ...formData, box_included: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{t.boxIncluded}</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">{t.purchaseDetails}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.purchaseCost} *
                </label>
                <input
                  type="number"
                  value={formData.purchase_cost}
                  onChange={(e) => setFormData({ ...formData, purchase_cost: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.purchaseDate} *
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tc.notes}
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder={tc.notesHelper}
                />
                <p className="text-xs text-gray-500 mt-1 italic">{tc.notesHelper}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {editingItem ? tc.update : tc.save}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            {tc.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default InventoryItemForm;
