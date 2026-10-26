import React, { useState } from 'react';
import { Image, Sparkles, Send, Bell, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { HomeBanners } from '../content/HomeBanners';
import { HomeCards } from '../content/HomeCards';
import { adminService } from '../../services/admin.service';

export const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'banners' | 'cards' | 'broadcast'>('banners');

  // Broadcast state
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    description: '',
    targetAudience: 'ALL' as 'ALL' | 'CUSTOMERS' | 'PARTNERS',
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const broadcastMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; targetAudience: 'ALL' | 'CUSTOMERS' | 'PARTNERS' }) =>
      adminService.broadcastNotification(payload),
    onSuccess: (res) => {
      setBroadcastForm({ title: '', description: '', targetAudience: 'ALL' });
      setFeedback({ type: 'success', message: res.message || 'Broadcast announcement sent successfully!' });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to send broadcast';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.description.trim()) return;
    broadcastMutation.mutate(broadcastForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Content Management & Broadcasts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Super Admin portal for customer mobile app marketing, categories, and push announcements
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'banners' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            Home Banners
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Home Action Cards
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'broadcast' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Broadcast Notification
          </button>
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

      {/* Tab Panels */}
      {activeTab === 'banners' && <HomeBanners />}

      {activeTab === 'cards' && <HomeCards />}

      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm max-w-2xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Broadcast Push Notification</h2>
              <p className="text-xs text-gray-500">Send an instant platform announcement or critical update to users</p>
            </div>
          </div>

          <form onSubmit={handleBroadcastSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Target Audience
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ALL', label: 'All Users (Everyone)' },
                  { id: 'CUSTOMERS', label: 'Customers Only' },
                  { id: 'PARTNERS', label: 'Delivery Partners Only' },
                ].map(aud => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setBroadcastForm({ ...broadcastForm, targetAudience: aud.id as any })}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      broadcastForm.targetAudience === aud.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Announcement Title
              </label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="e.g. Service Update: Operating Hours Extended"
                value={broadcastForm.title}
                onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Announcement Message
              </label>
              <textarea
                rows={4}
                required
                maxLength={300}
                placeholder="Write message content delivered to user app notifications..."
                value={broadcastForm.description}
                onChange={e => setBroadcastForm({ ...broadcastForm, description: e.target.value })}
                className="input"
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">
                {300 - broadcastForm.description.length} characters left
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={broadcastMutation.isPending}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Send className="w-4 h-4" />
                {broadcastMutation.isPending ? 'Broadcasting...' : 'Broadcast Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
