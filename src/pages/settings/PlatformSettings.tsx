import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, DollarSign, Clock, MapPin, Smartphone,
  AlertTriangle, Save, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { PlatformSettings as IPlatformSettings } from '../../types/admin';

export const PlatformSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.getSettings(),
  });

  const [formData, setFormData] = useState<IPlatformSettings>({
    fareRules: {
      baseFare: 40,
      perKmRate: 12,
      surgePricingMultiplier: 1.0,
      platformCommissionRate: 15,
    },
    serviceAvailability: {
      operatingHoursStart: '07:00',
      operatingHoursEnd: '23:00',
      maxDeliveryRadiusKm: 25,
      activeCities: ['Vellore', 'Katpadi'],
    },
    systemConfig: {
      minAppVersion: '1.0.0',
      maintenanceMode: false,
    },
  });

  useEffect(() => {
    if (data) {
      setFormData({
        fareRules: {
          baseFare: data.fareRules?.baseFare ?? 40,
          perKmRate: data.fareRules?.perKmRate ?? 12,
          surgePricingMultiplier: data.fareRules?.surgePricingMultiplier ?? 1.0,
          platformCommissionRate: data.fareRules?.platformCommissionRate ?? 15,
        },
        serviceAvailability: {
          operatingHoursStart: data.serviceAvailability?.operatingHoursStart || '07:00',
          operatingHoursEnd: data.serviceAvailability?.operatingHoursEnd || '23:00',
          maxDeliveryRadiusKm: data.serviceAvailability?.maxDeliveryRadiusKm ?? 25,
          activeCities: data.serviceAvailability?.activeCities || ['Vellore'],
        },
        systemConfig: {
          minAppVersion: data.systemConfig?.minAppVersion || '1.0.0',
          maintenanceMode: !!data.systemConfig?.maintenanceMode,
        },
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<IPlatformSettings>) => adminService.updateSettings(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setFeedback({ type: 'success', message: res.message || 'Platform settings updated successfully' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update settings';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const [newCity, setNewCity] = useState('');
  const handleAddCity = () => {
    if (newCity.trim() && !formData.serviceAvailability.activeCities.includes(newCity.trim())) {
      setFormData(prev => ({
        ...prev,
        serviceAvailability: {
          ...prev.serviceAvailability,
          activeCities: [...prev.serviceAvailability.activeCities, newCity.trim()],
        },
      }));
      setNewCity('');
    }
  };

  const handleRemoveCity = (city: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAvailability: {
        ...prev.serviceAvailability,
        activeCities: prev.serviceAvailability.activeCities.filter(c => c !== city),
      },
    }));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading platform settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-600" />
            Platform Settings & Rules
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Owner configuration for pricing, operational coverage, and platform maintenance
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Commission & Pricing Rules */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Commission & Pricing Rules</h2>
              <p className="text-xs text-gray-500">Define customer delivery fares and platform commission deductions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Base Fare (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.fareRules.baseFare}
                onChange={e => setFormData({
                  ...formData,
                  fareRules: { ...formData.fareRules, baseFare: Number(e.target.value) }
                })}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Starting fare charged for every delivery order</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Per Kilometer Rate (₹ / km)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={formData.fareRules.perKmRate}
                onChange={e => setFormData({
                  ...formData,
                  fareRules: { ...formData.fareRules, perKmRate: Number(e.target.value) }
                })}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Incremental charge per kilometer of delivery distance</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Surge Pricing Multiplier (x)
              </label>
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.1"
                required
                value={formData.fareRules.surgePricingMultiplier}
                onChange={e => setFormData({
                  ...formData,
                  fareRules: { ...formData.fareRules, surgePricingMultiplier: Number(e.target.value) }
                })}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Multiplier applied during high demand (1.0 = normal pricing)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Platform Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                required
                value={formData.fareRules.platformCommissionRate}
                onChange={e => setFormData({
                  ...formData,
                  fareRules: { ...formData.fareRules, platformCommissionRate: Number(e.target.value) }
                })}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Percentage deducted from delivery fare as platform revenue</p>
            </div>
          </div>
        </div>

        {/* Section 2: Service Availability & Geofence */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Service Availability & Operating Hours</h2>
              <p className="text-xs text-gray-500">Configure business hours and delivery coverage radius</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Operating Hours Start
              </label>
              <input
                type="time"
                required
                value={formData.serviceAvailability.operatingHoursStart}
                onChange={e => setFormData({
                  ...formData,
                  serviceAvailability: { ...formData.serviceAvailability, operatingHoursStart: e.target.value }
                })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Operating Hours End
              </label>
              <input
                type="time"
                required
                value={formData.serviceAvailability.operatingHoursEnd}
                onChange={e => setFormData({
                  ...formData,
                  serviceAvailability: { ...formData.serviceAvailability, operatingHoursEnd: e.target.value }
                })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Maximum Delivery Radius (km)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={formData.serviceAvailability.maxDeliveryRadiusKm}
                onChange={e => setFormData({
                  ...formData,
                  serviceAvailability: { ...formData.serviceAvailability, maxDeliveryRadiusKm: Number(e.target.value) }
                })}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Orders exceeding this radius from pickup are prohibited</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Active Operational Cities
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Vellore"
                  value={newCity}
                  onChange={e => setNewCity(e.target.value)}
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddCity}
                  className="px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.serviceAvailability.activeCities.map(city => (
                  <span
                    key={city}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-medium"
                  >
                    <MapPin className="w-3 h-3" />
                    {city}
                    <button
                      type="button"
                      onClick={() => handleRemoveCity(city)}
                      className="text-blue-500 hover:text-blue-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: System Configuration & Maintenance */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">System Configuration & Maintenance</h2>
              <p className="text-xs text-gray-500">Control application versions and emergency maintenance state</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Minimum Supported App Version
              </label>
              <input
                type="text"
                required
                value={formData.systemConfig.minAppVersion}
                onChange={e => setFormData({
                  ...formData,
                  systemConfig: { ...formData.systemConfig, minAppVersion: e.target.value }
                })}
                placeholder="1.0.0"
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Apps older than this version will prompt users to upgrade</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Maintenance Mode
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Temporarily pause new order bookings for system updates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.systemConfig.maintenanceMode}
                    onChange={e => setFormData({
                      ...formData,
                      systemConfig: { ...formData.systemConfig, maintenanceMode: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-sm text-sm"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving Settings...' : 'Save All Platform Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
