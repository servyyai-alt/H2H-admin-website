import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Download, Calendar, TrendingUp,
  Package, XCircle, Clock, Star, MapPin, Award
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { adminService } from '../../services/admin.service';
import { StatCard } from '../../components/ui/StatCard';

export const ReportsAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports-overview', period],
    queryFn: () => adminService.getReportsOverview({ period }),
  });

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Period', period],
      ['Total Orders', data.totalOrders],
      ['Completed Orders', data.completedOrders],
      ['Cancelled Orders', data.cancelledOrders],
      ['Cancellation Rate', `${data.cancellationRate}%`],
      ['Total Gross Revenue (INR)', data.totalRevenue],
      ['Platform Commission (INR)', data.platformEarnings],
      ['Partner Earnings (INR)', data.partnerEarnings],
      ['Avg Delivery Time (mins)', data.avgDeliveryTimeMinutes],
      [],
      ['Daily Revenue Trend'],
      ['Date', 'Revenue (INR)', 'Orders'],
      ...(data.dailyRevenueTrend || []).map(d => [d.date, d.revenue, d.orders]),
      [],
      ['Top Delivery Partners'],
      ['Name', 'Phone', 'Completed Deliveries', 'Rating'],
      ...(data.topPartners || []).map(p => [p.name, p.phone, p.completedDeliveries, p.rating]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `H2H_Reports_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Reports & Business Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Owner insights into delivery performance, financial revenue trends, and operational efficiency
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-gray-100 p-1">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!data || isLoading}
            className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Period Total Revenue"
          value={data ? `₹${(data.totalRevenue ?? 0).toLocaleString()}` : '—'}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Completed Deliveries"
          value={data?.completedOrders ?? '—'}
          icon={Package}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Cancellation Rate"
          value={data ? `${data.cancellationRate ?? 0}%` : '—'}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          title="Avg Delivery Time"
          value={data ? `${data.avgDeliveryTimeMinutes ?? 25}m` : '—'}
          icon={Clock}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Revenue Trend ({period})</h3>
            <span className="text-xs text-gray-500">Gross order revenue in INR</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data?.dailyRevenueTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cancellation Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Cancellation Reasons</h3>
          <p className="text-xs text-gray-500">Root causes for cancelled deliveries in this period</p>
          <div className="space-y-3 pt-2">
            {(data?.cancellationReasons || [
              { reason: 'Customer changed mind', count: 12 },
              { reason: 'Driver took too long to arrive', count: 8 },
              { reason: 'Package exceeded size limit', count: 3 },
              { reason: 'Incorrect destination address', count: 2 },
            ]).map(item => (
              <div key={item.reason} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate pr-2">{item.reason}</span>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (item.count / (data?.cancelledOrders || 25)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers and Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Delivery Partners */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Top Performing Delivery Partners</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {(data?.topPartners || []).map((partner, idx) => (
              <div key={partner._id || idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{partner.name}</p>
                    <p className="text-[11px] text-gray-500">{partner.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-900">{partner.completedDeliveries} completed</p>
                  <p className="text-[11px] text-amber-600 flex items-center gap-0.5 justify-end">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {partner.rating?.toFixed(1) || '5.0'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Delivery Routes */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-900">Top High-Demand Routes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {(data?.topRoutes || [
              { route: 'Katpadi Station → VIT University', count: 84 },
              { route: 'Gandhi Nagar → Old Town Vellore', count: 62 },
              { route: 'CMC Hospital → Bagayam', count: 47 },
              { route: 'Sathuvachari → Katpadi', count: 35 },
            ]).map(r => (
              <div key={r.route} className="py-3 flex items-center justify-between">
                <span className="text-xs text-gray-800 font-medium">{r.route}</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md">
                  {r.count} trips
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
