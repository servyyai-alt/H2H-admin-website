import React, { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api.service';

type Card = { _id: string; title: string; subtitle: string; emoji: string; accent: string; actionCategory: string; active: boolean; order: number };
const blank = { title: '', subtitle: '', emoji: '📦', accent: '#FFF0E7', actionCategory: 'PARCEL', active: true, order: 0 };

export const HomeCards: React.FC = () => {
  const client = useQueryClient();
  const [editing, setEditing] = useState<Partial<Card> | null>(null);
  const { data = [], isLoading } = useQuery<Card[]>({ queryKey: ['home-cards'], queryFn: () => apiClient.get('/home-cards').then(r => r.data.data) });
  const save = useMutation({
    mutationFn: (card: Partial<Card>) => card._id ? apiClient.put(`/home-cards/${card._id}`, card) : apiClient.post('/home-cards', card),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['home-cards'] }); setEditing(null); },
  });
  const remove = useMutation({ mutationFn: (id: string) => apiClient.delete(`/home-cards/${id}`), onSuccess: () => client.invalidateQueries({ queryKey: ['home-cards'] }) });

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-xl font-semibold text-gray-900">Home Cards</h1><p className="text-sm text-gray-500 mt-1">Manage the cards moving below “Send something”.</p></div>
      <button className="btn-primary flex items-center gap-2" onClick={() => setEditing({ ...blank })}><Plus className="w-4 h-4" />Add card</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {isLoading ? <div className="text-sm text-gray-400">Loading cards...</div> : data.map(card => <div key={card._id} className={`card relative ${!card.active ? 'opacity-55' : ''}`}>
        <div className="flex items-start justify-between"><div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: card.accent }}>{card.emoji}</div><span className={`badge ${card.active ? 'badge-green' : 'badge-gray'}`}>{card.active ? 'Live' : 'Hidden'}</span></div>
        <h3 className="mt-4 font-semibold text-gray-900">{card.title}</h3><p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
        <div className="flex items-center justify-between mt-5"><span className="text-xs text-gray-400">Order {card.order}</span><div className="flex gap-2"><button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => setEditing(card)}><Pencil className="w-4 h-4" /></button><button className="p-2 rounded-lg hover:bg-red-50 text-red-500" onClick={() => remove.mutate(card._id)}><Trash2 className="w-4 h-4" /></button></div></div>
      </div>)}
    </div>
    {editing && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"><form className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(editing); }}>
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{editing._id ? 'Edit home card' : 'New home card'}</h2><button type="button" onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-400" /></button></div>
      <label className="block text-sm font-medium">Title<input className="input mt-1" required value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label>
      <label className="block text-sm font-medium">Subtitle<input className="input mt-1" required value={editing.subtitle || ''} onChange={e => setEditing({ ...editing, subtitle: e.target.value })} /></label>
      <div className="grid grid-cols-3 gap-3"><label className="block text-sm font-medium">Emoji<input className="input mt-1" value={editing.emoji || ''} onChange={e => setEditing({ ...editing, emoji: e.target.value })} /></label><label className="block text-sm font-medium">Accent<input className="input mt-1" type="color" value={editing.accent || '#FFF0E7'} onChange={e => setEditing({ ...editing, accent: e.target.value })} /></label><label className="block text-sm font-medium">Order<input className="input mt-1" type="number" value={editing.order ?? 0} onChange={e => setEditing({ ...editing, order: Number(e.target.value) })} /></label></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active !== false} onChange={e => setEditing({ ...editing, active: e.target.checked })} />Show on customer app</label>
      <button className="btn-primary w-full" disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save card'}</button>
    </form></div>}
  </div>;
};
