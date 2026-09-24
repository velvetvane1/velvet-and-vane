import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  HiOutlineCurrencyDollar,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { StatCard, StatusBadge } from '@/components/admin/StatCard';
import { TextSkeleton } from '@/components/ui/Loader';
import adminApi from '@/services/adminApi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi
      .getDashboard()
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard data'));
  }, []);

  if (error) {
    return (
      <div className="glass p-8 text-center text-ivory/60">
        <p className="mb-2">{error}</p>
        <p className="text-xs text-ivory/40">
          Make sure the backend is running and you're signed in with a staff account.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TextSkeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const { stats, recentOrders, salesByDay, topProducts } = data;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-2">Overview</p>
        <h1 className="heading-display text-3xl md:text-4xl">Good to see you back.</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard label="Revenue (Paid)" value={`$${stats.totalRevenue.toLocaleString()}`} icon={HiOutlineCurrencyDollar} />
        <StatCard label="Total Orders" value={stats.orderCount} icon={HiOutlineClipboardList} to="/admin/orders" />
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders}
          icon={HiOutlineClock}
          to="/admin/orders?status=pending"
          highlight={stats.pendingOrders > 0}
        />
        <StatCard label="Customers" value={stats.customerCount} icon={HiOutlineUsers} to="/admin/customers" />
        <StatCard label="Active Products" value={stats.productCount} icon={HiOutlineShoppingBag} to="/admin/products" />
        <StatCard
          label="Low Stock Alerts"
          value={stats.lowStockCount}
          icon={HiOutlineExclamationCircle}
          to="/admin/inventory"
          highlight={stats.lowStockCount > 0}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-sm">
          <p className="text-sm text-ivory/60 mb-4">Revenue — last 30 days</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesByDay}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5A0F24" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#5A0F24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(201, 164, 108, 0.24)" vertical={false} />
              <XAxis dataKey="_id" tick={{ fill: '#8a8477', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8a8477', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid rgba(201, 164, 108, 0.45)', color: '#191517', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#5A0F24" strokeWidth={2} fill="url(#goldFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-6 rounded-sm">
          <p className="text-sm text-ivory/60 mb-4">Top Products by Units Sold</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="_id"
                type="category"
                width={110}
                tick={{ fill: '#8a8477', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid rgba(201, 164, 108, 0.45)', color: '#191517', fontSize: 12 }}
              />
              <Bar dataKey="unitsSold" fill="#7A1833" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10">
          <p className="text-sm text-ivory/70">Recent Orders</p>
          <Link to="/admin/orders" className="text-xs text-gold hover:underline">View all</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ivory/40 border-b border-gold/10">
              <th className="px-6 py-3 font-normal">Order</th>
              <th className="px-6 py-3 font-normal">Customer</th>
              <th className="px-6 py-3 font-normal">Total</th>
              <th className="px-6 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order._id} className="border-b border-gold/5 last:border-0 hover:bg-gold/5">
                <td className="px-6 py-3">
                  <Link to={`/admin/orders/${order._id}`} className="text-gold hover:underline flex items-center gap-1.5">
                    <HiOutlineClock className="text-xs" /> {order.orderNumber}
                  </Link>
                </td>
                <td className="px-6 py-3 text-ivory/70">{order.user?.name || 'Guest'}</td>
                <td className="px-6 py-3">${order.total.toFixed(2)}</td>
                <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-ivory/40">No orders yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
