import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory_items']['Insert'];

interface AddInventoryItemProps {
  suppliers: Supplier[];
  onCancel: () => void;
  onSuccess: () => void;
}

function AddInventoryItem({ suppliers, onCancel, onSuccess }: AddInventoryItemProps) {
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id || !formData.supplier_item_number) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);
    if (!selectedSupplier) {
      alert('Please select a valid supplier');
      return;
    }

    const itemId = `${selectedSupplier.supplier_code}${formData.supplier_item_number}`;

    const { error } = await supabase
      .from('inventory_items')
      .insert([{
        ...formData,
        item_id: itemId,
      } as InventoryInsert]);

    if (error) {
      console.error('Error adding item:', error);
      alert('Error adding item. Item ID may already exist.');
    } else {
      onSuccess();
    }
  };

  const modelFamilies = ['MacBook Pro', 'MacBook Air', 'MacBook'];
  const screenSizes = ['13', '14', '15', '16'];
  const chips = ['M1', 'M2', 'M3', 'M1 Pro', 'M1 Max', 'M2 Pro', 'M2 Max', 'M3 Pro', 'M3 Max', 'i5', 'i7', 'i9'];
  const conditionGrades = ['A', 'B', 'C'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Identification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplier_code} - {supplier.supplier_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Item Number *
                </label>
                <input
                  type="text"
                  value={formData.supplier_item_number}
                  onChange={(e) => setFormData({ ...formData, supplier_item_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="286775"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Family *
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
                  Screen Size *
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
                  Chip *
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
                  RAM (GB) *
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
                  Storage (GB) *
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
                  Year *
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
                  Serial Number
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
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Space Gray, Silver, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keyboard Layout
                </label>
                <input
                  type="text"
                  value={formData.keyboard_layout || ''}
                  onChange={(e) => setFormData({ ...formData, keyboard_layout: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="US, Canadian, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OS Installed
                </label>
                <input
                  type="text"
                  value={formData.os_installed || ''}
                  onChange={(e) => setFormData({ ...formData, os_installed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="macOS Sonoma, etc."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Condition</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition Grade *
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
                  Battery Cycle Count
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
                  Battery Health %
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
                  Condition Summary *
                </label>
                <textarea
                  value={formData.condition_summary}
                  onChange={(e) => setFormData({ ...formData, condition_summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Brief description of item condition"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.charger_included}
                    onChange={(e) => setFormData({ ...formData, charger_included: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Charger Included</span>
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
                  <span className="text-sm font-medium text-gray-700">Box Included</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Purchase Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Cost ($) *
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
                  Purchase Date *
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
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check size={18} />
            Save Item
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <X size={18} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddInventoryItem;
