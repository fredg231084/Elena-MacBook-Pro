import { useState, useEffect } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import AddSale from './AddSale';

type Sale = Database['public']['Tables']['sales']['Row'] & {
  inventory_items?: Database['public']['Tables']['inventory_items']['Row'];
  customers?: Database['public']['Tables']['customers']['Row'];
};

function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        inventory_items (*),
        customers (*)
      `)
      .order('sale_date', { ascending: false });

    if (error) {
      console.error('Error loading sales:', error);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  };

  const handleSaleAdded = () => {
    setIsAddingSale(false);
    loadSales();
  };

  const calculateProfit = (salePrice: number, purchaseCost: number) => {
    return salePrice - purchaseCost;
  };

  const calculateMargin = (salePrice: number, purchaseCost: number) => {
    if (salePrice === 0) return 0;
    return ((salePrice - purchaseCost) / salePrice) * 100;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Loading sales...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.sale_price, 0);
  const totalProfit = sales.reduce((sum, sale) => {
    if (sale.inventory_items) {
      return sum + calculateProfit(sale.sale_price, sale.inventory_items.purchase_cost);
    }
    return sum;
  }, 0);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
            <p className="text-gray-600 mt-1">Track and manage your sales</p>
          </div>
          {!isAddingSale && (
            <button
              onClick={() => setIsAddingSale(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Sale
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{sales.length}</p>
              </div>
              <DollarSign className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${totalRevenue.toFixed(2)}</p>
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
        </div>

        {isAddingSale && (
          <AddSale
            onCancel={() => setIsAddingSale(false)}
            onSuccess={handleSaleAdded}
          />
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    Customer
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
                    Margin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => {
                  const profit = sale.inventory_items
                    ? calculateProfit(sale.sale_price, sale.inventory_items.purchase_cost)
                    : 0;
                  const margin = sale.inventory_items
                    ? calculateMargin(sale.sale_price, sale.inventory_items.purchase_cost)
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
                        {sale.customers?.name || 'Walk-in'}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {margin.toFixed(1)}%
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
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No sales recorded yet. Add your first sale to get started.
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

export default Sales;
