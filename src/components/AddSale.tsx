import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type SaleInsert = Database['public']['Tables']['sales']['Insert'];

interface AddSaleProps {
  onCancel: () => void;
  onSuccess: () => void;
}

function AddSale({ onCancel, onSuccess }: AddSaleProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<Partial<SaleInsert>>({
    sale_price: 0,
    sale_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    channel: 'walk-in',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    customer_type: 'retail',
    source: 'walk-in',
  });

  useEffect(() => {
    loadAvailableItems();
    loadCustomers();
  }, []);

  const loadAvailableItems = async () => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('status', 'in_stock')
      .order('item_id');

    if (error) {
      console.error('Error loading items:', error);
    } else {
      setItems(data || []);
    }
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading customers:', error);
    } else {
      setCustomers(data || []);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Please fill in name and phone');
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([newCustomer])
      .select()
      .single();

    if (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer');
    } else {
      setCustomers([...customers, data]);
      setFormData({ ...formData, customer_id: data.id });
      setIsAddingCustomer(false);
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        customer_type: 'retail',
        source: 'walk-in',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.item_id || !formData.sale_price) {
      alert('Please fill in all required fields');
      return;
    }

    const { error: saleError } = await supabase
      .from('sales')
      .insert([formData as SaleInsert]);

    if (saleError) {
      console.error('Error adding sale:', saleError);
      alert('Error adding sale');
      return;
    }

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        status: 'sold',
        sold_date: new Date().toISOString(),
      })
      .eq('id', formData.item_id);

    if (updateError) {
      console.error('Error updating item status:', updateError);
    }

    onSuccess();
  };

  const filteredItems = items.filter(item =>
    item.item_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model_family.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paymentMethods = ['cash', 'interac', 'credit_card', 'bank_transfer'];
  const channels = ['walk-in', 'marketplace', 'instagram', 'shopify', 'referral', 'other'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add New Sale</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Item *
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              placeholder="Search by item ID, model, or serial..."
            />
            <select
              value={formData.item_id || ''}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Item</option>
              {filteredItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_id} - {item.model_family} {item.screen_size}" ({item.chip}, {item.ram_gb}GB, {item.storage_gb}GB) - ${item.purchase_cost.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            {!isAddingCustomer ? (
              <div className="flex gap-2">
                <select
                  value={formData.customer_id || ''}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value || null })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No customer / Walk-in</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomer(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  New Customer
                </button>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-md p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Name *"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone *"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newCustomer.customer_type}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customer_type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="dealer">Dealer</option>
                    <option value="friend_family">Friend/Family</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddCustomer}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Add Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomer(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Price ($) *
            </label>
            <input
              type="number"
              value={formData.sale_price}
              onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Date *
            </label>
            <input
              type="date"
              value={formData.sale_date}
              onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel *
            </label>
            <select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {channels.map((channel) => (
                <option key={channel} value={channel}>
                  {channel.replace('-', ' ').toUpperCase()}
                </option>
              ))}
            </select>
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

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check size={18} />
            Complete Sale
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

export default AddSale;
