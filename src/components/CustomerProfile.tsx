import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];
type Sale = Database['public']['Tables']['sales']['Row'] & {
  inventory_items?: Database['public']['Tables']['inventory_items']['Row'];
};

interface CustomerProfileProps {
  customerId: string;
  onBack: () => void;
}

function CustomerProfile({ customerId, onBack }: CustomerProfileProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    setLoading(true);

    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    if (customerError) {
      console.error('Error loading customer:', customerError);
    } else {
      setCustomer(customerData);
    }

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        *,
        inventory_items (*)
      `)
      .eq('customer_id', customerId)
      .order('sale_date', { ascending: false });

    if (salesError) {
      console.error('Error loading sales:', salesError);
    } else {
      setSales(salesData || []);
    }

    setLoading(false);
  };

  if (loading || !customer) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Loading customer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = sales.reduce((sum, sale) => sum + sale.sale_price, 0);
  const totalProfit = sales.reduce((sum, sale) => {
    if (sale.inventory_items) {
      return sum + (sale.sale_price - sale.inventory_items.purchase_cost);
    }
    return sum;
  }, 0);
  const lastPurchaseDate = sales.length > 0 ? new Date(sales[0].sale_date).toLocaleDateString() : 'N/A';

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Customers
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-gray-600 mt-1">{customer.phone}</p>
              {customer.email && (
                <p className="text-gray-600">{customer.email}</p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                {customer.customer_type.replace('_', '/')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Source</label>
              <p className="text-gray-900 mt-1">{customer.source}</p>
            </div>

            {customer.ig_handle && (
              <div>
                <label className="text-sm font-medium text-gray-500">Instagram</label>
                <p className="text-gray-900 mt-1">{customer.ig_handle}</p>
              </div>
            )}

            {customer.preferred_contact && (
              <div>
                <label className="text-sm font-medium text-gray-500">Preferred Contact</label>
                <p className="text-gray-900 mt-1 capitalize">{customer.preferred_contact}</p>
              </div>
            )}

            {customer.notes && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900 mt-1">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{sales.length}</p>
              </div>
              <ShoppingBag className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${totalProfit.toFixed(2)}</p>
              </div>
              <DollarSign className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Purchase</p>
              <p className="text-lg font-bold text-gray-900 mt-2">{lastPurchaseDate}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Purchase History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => {
                  const profit = sale.inventory_items
                    ? sale.sale_price - sale.inventory_items.purchase_cost
                    : 0;

                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900">
                          {sale.inventory_items?.item_id || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.inventory_items
                          ? `${sale.inventory_items.model_family} ${sale.inventory_items.screen_size}"`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${sale.inventory_items?.purchase_cost.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${sale.sale_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${profit.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {sale.channel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No purchase history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerProfile;
