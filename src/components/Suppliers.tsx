import { useState, useEffect } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { fr } from '../lib/translations';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];

function Suppliers() {
  const t = fr.suppliers;
  const tc = fr.common;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SupplierInsert>>({
    supplier_code: '',
    supplier_name: '',
    supplier_type: 'wholesaler',
    is_active: true,
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('supplier_code');

    if (error) {
      console.error('Error loading suppliers:', error);
    } else {
      setSuppliers(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_code || !formData.supplier_name || !formData.supplier_type) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    const supplierData = {
      ...formData,
      supplier_code: formData.supplier_code.toUpperCase(),
    };

    if (editingId) {
      const { error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating supplier:', error);
        alert('Erreur lors de la mise à jour du fournisseur');
      } else {
        setEditingId(null);
        loadSuppliers();
      }
    } else {
      const { error } = await supabase
        .from('suppliers')
        .insert([supplierData as SupplierInsert]);

      if (error) {
        console.error('Error adding supplier:', error);
        alert('Erreur lors de l\'ajout du fournisseur. Le code existe peut-être déjà.');
      } else {
        setIsAddingNew(false);
        loadSuppliers();
      }
    }

    setFormData({
      supplier_code: '',
      supplier_name: '',
      supplier_type: 'wholesaler',
      is_active: true,
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData(supplier);
    setIsAddingNew(false);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      supplier_code: '',
      supplier_name: '',
      supplier_type: 'wholesaler',
      is_active: true,
    });
  };

  const supplierTypes = [
    { value: 'wholesaler', label: t.wholesaler },
    { value: 'trade-in', label: t.tradeIn },
    { value: 'marketplace', label: t.marketplace },
    { value: 'other', label: t.other },
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-600 mt-1">{t.subtitle}</p>
          </div>
          {!isAddingNew && !editingId && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={18} />
              {t.addSupplier}
            </button>
          )}
        </div>

        {(isAddingNew || editingId) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? t.editSupplier : t.addSupplier}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.supplierCode} *
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_code}
                    onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value.toUpperCase() })}
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="DTC"
                    disabled={!!editingId}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t.codeHelper}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.supplierName} *
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Direct Tech Canada"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.supplierType} *
                  </label>
                  <select
                    value={formData.supplier_type}
                    onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {supplierTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.contactName}
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name || ''}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.contactPhone}
                  </label>
                  <input
                    type="text"
                    value={formData.contact_phone || ''}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.contactEmail}
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tc.notes}
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{tc.active}</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingId ? tc.update : tc.save}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {tc.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.code}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.name}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.type}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.contact}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-gray-900">
                      {supplier.supplier_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">{supplier.supplier_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {supplier.supplier_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {supplier.contact_name || supplier.contact_phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {supplier.is_active ? (
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        {tc.active}
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {tc.inactive}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t.noSuppliers}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Suppliers;
