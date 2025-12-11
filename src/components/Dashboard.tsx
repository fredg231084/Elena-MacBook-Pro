import { useState, useEffect } from 'react';
import { DollarSign, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'] & {
  suppliers?: Database['public']['Tables']['suppliers']['Row'];
};
type Sale = Database['public']['Tables']['sales']['Row'] & {
  inventory_items?: Database['public']['Tables']['inventory_items']['Row'];
  customers?: Database['public']['Tables']['customers']['Row'];
};

type DateRange = 'today' | 'week' | 'month' | 'last_month' | 'all';

function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return monthAgo.toISOString().split('T')[0];
      case 'last_month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return lastMonthStart.toISOString().split('T')[0];
      default:
        return null;
    }
  };

  const loadData = async () => {
    setLoading(true);

    let salesQuery = supabase
      .from('sales')
      .select(`
        *,
        inventory_items (*),
        customers (*)
      `)
      .order('sale_date', { ascending: false });

    const dateFilter = getDateFilter();
    if (dateFilter && dateRange !== 'all') {
      salesQuery = salesQuery.gte('sale_date', dateFilter);
    }

    const { data: salesData, error: salesError } = await salesQuery;

    if (salesError) {
      console.error('Error loading sales:', salesError);
    } else {
      setSales(salesData || []);
    }

    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory_items')
      .select(`
        *,
        suppliers (*)
      `);

    if (inventoryError) {
      console.error('Error loading inventory:', inventoryError);
    } else {
      setInventory(inventoryData || []);
    }

    setLoading(false);
  };

  const calculateStats = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.sale_price, 0);
    const totalProfit = sales.reduce((sum, sale) => {
      if (sale.inventory_items) {
        return sum + (sale.sale_price - sale.inventory_items.purchase_cost);
      }
      return sum;
    }, 0);
    const unitsSold = sales.length;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalProfit, unitsSold, avgMargin };
  };

  const getTopModelsByProfit = () => {
    const modelStats: Record<string, { units: number; profit: number; margin: number; revenue: number }> = {};

    sales.forEach(sale => {
      if (sale.inventory_items) {
        const model = `${sale.inventory_items.model_family} ${sale.inventory_items.screen_size}"`;
        const profit = sale.sale_price - sale.inventory_items.purchase_cost;

        if (!modelStats[model]) {
          modelStats[model] = { units: 0, profit: 0, margin: 0, revenue: 0 };
        }

        modelStats[model].units += 1;
        modelStats[model].profit += profit;
        modelStats[model].revenue += sale.sale_price;
      }
    });

    Object.keys(modelStats).forEach(model => {
      const stats = modelStats[model];
      stats.margin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
    });

    return Object.entries(modelStats)
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 5);
  };

  const getTopSuppliersByProfit = () => {
    const supplierStats: Record<string, {
      units: number;
      profit: number;
      margin: number;
      revenue: number;
      avgDays: number;
      totalDays: number;
    }> = {};

    sales.forEach(sale => {
      if (sale.inventory_items && sale.inventory_items.suppliers) {
        const supplierName = sale.inventory_items.suppliers.supplier_name;
        const profit = sale.sale_price - sale.inventory_items.purchase_cost;
        const purchaseDate = new Date(sale.inventory_items.purchase_date);
        const saleDate = new Date(sale.sale_date);
        const daysToSell = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

        if (!supplierStats[supplierName]) {
          supplierStats[supplierName] = { units: 0, profit: 0, margin: 0, revenue: 0, avgDays: 0, totalDays: 0 };
        }

        supplierStats[supplierName].units += 1;
        supplierStats[supplierName].profit += profit;
        supplierStats[supplierName].revenue += sale.sale_price;
        supplierStats[supplierName].totalDays += daysToSell;
      }
    });

    Object.keys(supplierStats).forEach(supplier => {
      const stats = supplierStats[supplier];
      stats.margin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
      stats.avgDays = stats.units > 0 ? Math.round(stats.totalDays / stats.units) : 0;
    });

    return Object.entries(supplierStats)
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 5);
  };

  const getTopCustomers = () => {
    const customerStats: Record<string, { purchases: number; spent: number; profit: number; lastPurchase: string }> = {};

    sales.forEach(sale => {
      if (sale.customers) {
        const customerName = sale.customers.name;
        const profit = sale.inventory_items ? sale.sale_price - sale.inventory_items.purchase_cost : 0;

        if (!customerStats[customerName]) {
          customerStats[customerName] = { purchases: 0, spent: 0, profit: 0, lastPurchase: sale.sale_date };
        }

        customerStats[customerName].purchases += 1;
        customerStats[customerName].spent += sale.sale_price;
        customerStats[customerName].profit += profit;

        if (new Date(sale.sale_date) > new Date(customerStats[customerName].lastPurchase)) {
          customerStats[customerName].lastPurchase = sale.sale_date;
        }
      }
    });

    return Object.entries(customerStats)
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 5);
  };

  const getInventoryStats = () => {
    const inStock = inventory.filter(item => item.status === 'in_stock');
    const totalValue = inStock.reduce((sum, item) => sum + item.purchase_cost, 0);

    const agingBuckets = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    const now = new Date();
    inStock.forEach(item => {
      const purchaseDate = new Date(item.purchase_date);
      const days = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

      if (days <= 30) agingBuckets['0-30'] += 1;
      else if (days <= 60) agingBuckets['31-60'] += 1;
      else if (days <= 90) agingBuckets['61-90'] += 1;
      else agingBuckets['90+'] += 1;
    });

    const modelCounts: Record<string, { count: number; value: number }> = {};
    inStock.forEach(item => {
      const model = `${item.model_family} ${item.screen_size}"`;
      if (!modelCounts[model]) {
        modelCounts[model] = { count: 0, value: 0 };
      }
      modelCounts[model].count += 1;
      modelCounts[model].value += item.purchase_cost;
    });

    return {
      totalUnits: inStock.length,
      totalValue,
      agingBuckets,
      modelCounts: Object.entries(modelCounts).sort((a, b) => b[1].count - a[1].count),
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const topModels = getTopModelsByProfit();
  const topSuppliers = getTopSuppliersByProfit();
  const topCustomers = getTopCustomers();
  const inventoryStats = getInventoryStats();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your business performance</p>
          </div>
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalProfit.toFixed(2)}</p>
              </div>
              <TrendingUp className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Units Sold</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.unitsSold}</p>
              </div>
              <ShoppingCart className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Margin</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgMargin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="text-green-600" size={40} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Models by Profit</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topModels.map(([model, data], idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-gray-900">{model}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{data.units}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">${data.profit.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{data.margin.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {topModels.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Suppliers by Profit</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topSuppliers.map(([supplier, data], idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-gray-900">{supplier}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{data.units}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">${data.profit.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{data.avgDays}</td>
                    </tr>
                  ))}
                  {topSuppliers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Customers</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Spent</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topCustomers.map(([customer, data], idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-gray-900">{customer}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{data.purchases}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${data.spent.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">${data.profit.toFixed(2)}</td>
                    </tr>
                  ))}
                  {topCustomers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="text-blue-600" size={32} />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Units in Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{inventoryStats.totalUnits}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">${inventoryStats.totalValue.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Inventory Aging</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600">0-30 days</p>
                    <p className="text-lg font-semibold text-green-700">{inventoryStats.agingBuckets['0-30']}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-xs text-gray-600">31-60 days</p>
                    <p className="text-lg font-semibold text-yellow-700">{inventoryStats.agingBuckets['31-60']}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-xs text-gray-600">61-90 days</p>
                    <p className="text-lg font-semibold text-orange-700">{inventoryStats.agingBuckets['61-90']}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-xs text-gray-600">90+ days</p>
                    <p className="text-lg font-semibold text-red-700">{inventoryStats.agingBuckets['90+']}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory by Model</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units in Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventoryStats.modelCounts.map(([model, data], idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 text-sm text-gray-900">{model}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{data.count}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${data.value.toFixed(2)}</td>
                  </tr>
                ))}
                {inventoryStats.modelCounts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No inventory items in stock
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

export default Dashboard;
