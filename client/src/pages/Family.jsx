import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';

const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition';

const relations = [
  { value: 'spouse', label: '💑 Spouse' },
  { value: 'parent', label: '👴 Parent' },
  { value: 'child', label: '👶 Child' },
  { value: 'sibling', label: '👫 Sibling' },
  { value: 'caregiver', label: '👩‍⚕️ Caregiver' },
  { value: 'friend', label: '👤 Friend' },
  { value: 'doctor', label: '🏥 Doctor' },
  { value: 'society_team', label: '🏘️ Society SOS Team' },
  { value: 'other', label: '👥 Other' },
];

const relationIcons = {
  parent: '👴', child: '👶', spouse: '💑',
  sibling: '👫', caregiver: '👩‍⚕️', friend: '👤',
  doctor: '🏥', society_team: '🏘️', other: '👥',
};

const Family = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    relation: 'other',
    receiveAlerts: true,
    receiveSOS: true,
  });

  const { data, isLoading } = useQuery('family', () =>
    api.get('/family').then(r => r.data.data)
  );

  const addMutation = useMutation(d => api.post('/family', d), {
    onSuccess: () => {
      toast.success('✅ Member added!');
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries('family');
    },
    onError: e => toast.error(e.response?.data?.message || 'Error adding member'),
  });

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/family/${id}`, data),
    {
      onSuccess: () => {
        toast.success('✅ Member updated!');
        setEditMember(null);
        resetForm();
        queryClient.invalidateQueries('family');
      },
      onError: e => toast.error(e.response?.data?.message || 'Error updating member'),
    }
  );

  const deleteMutation = useMutation(id => api.delete(`/family/${id}`), {
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries('family');
    },
    onError: () => toast.error('Failed to remove member'),
  });

  // Send WhatsApp alert manually
  const alertMutation = useMutation(
    (member) => api.post('/sos', {
      lat: 18.5204, lng: 73.8567,
      type: 'family',
      targetPhone: member.whatsapp || member.phone,
      message: `🔔 Alert from MediGuardian!\nThis is a reminder/alert from your family member's MediGuardian app.\nPlease check on them.\n\n_MediGuardian Health App_`,
    }),
    {
      onSuccess: () => toast.success('📱 Alert sent via WhatsApp!'),
      onError: () => toast.error('Failed to send alert'),
    }
  );

  const resetForm = () => {
    setForm({
      name: '', phone: '', whatsapp: '',
      email: '', relation: 'other',
      receiveAlerts: true, receiveSOS: true,
    });
  };

  const handleEdit = (member) => {
    setEditMember(member._id);
    setForm({
      name: member.name || '',
      phone: member.phone || '',
      whatsapp: member.whatsapp || '',
      email: member.email || '',
      relation: member.relation || 'other',
      receiveAlerts: member.receiveAlerts !== false,
      receiveSOS: member.receiveSOS !== false,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.phone.trim()) { toast.error('Phone is required'); return; }

    if (editMember) {
      updateMutation.mutate({ id: editMember, data: form });
    } else {
      addMutation.mutate(form);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Remove ${name} from emergency contacts?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditMember(null);
    resetForm();
  };

  const members = data || [];

  return (
    <div className="min-h-screen bg-slate-900 pb-24">

      {/* Header */}
      <div className="bg-slate-800 px-5 pt-12 pb-5 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Family Members</h1>
            <p className="text-slate-400 text-sm mt-1">
              {members.length} emergency contact{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setEditMember(null); setShowForm(true); }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="mx-5 mt-5 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">

          <div className="bg-slate-700 px-5 py-3 flex items-center justify-between">
            <h3 className="text-white font-semibold">
              {editMember ? '✏️ Edit Member' : '➕ Add Family Member'}
            </h3>
            <button onClick={handleCancel} className="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <div className="p-5 space-y-4">

            {/* Name */}
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Pritish Hande"
                className={inputCls}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1.5">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9967623317"
                className={inputCls}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1.5">
                WhatsApp Number
                <span className="text-emerald-400 text-xs ml-1">(for alerts)</span>
              </label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="e.g. 919967623317 (with country code)"
                className={inputCls}
              />
              <p className="text-slate-500 text-xs mt-1">
                Format: 91XXXXXXXXXX (91 + 10 digit number)
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1.5">
                Email <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className={inputCls}
              />
            </div>

            {/* Relation */}
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1.5">Relation</label>
              <select
                value={form.relation}
                onChange={e => setForm({ ...form, relation: e.target.value })}
                className={inputCls}
              >
                {relations.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Notification Toggles */}
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-3">
                Notification Permissions
              </label>
              <div className="space-y-2">

                {/* Receive Alerts Toggle */}
                <div className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                  form.receiveAlerts
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-700'
                }`}
                  onClick={() => setForm({ ...form, receiveAlerts: !form.receiveAlerts })}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="text-white text-sm font-medium">Missed Dose Alerts</p>
                      <p className="text-slate-400 text-xs">Notify when medicine is missed</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${
                    form.receiveAlerts ? 'bg-blue-500' : 'bg-slate-600'
                  }`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      form.receiveAlerts ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>

                {/* Receive SOS Toggle */}
                <div className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                  form.receiveSOS
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-slate-600 bg-slate-700'
                }`}
                  onClick={() => setForm({ ...form, receiveSOS: !form.receiveSOS })}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚨</span>
                    <div>
                      <p className="text-white text-sm font-medium">SOS Emergency Alerts</p>
                      <p className="text-slate-400 text-xs">Notify during emergencies</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${
                    form.receiveSOS ? 'bg-red-500' : 'bg-slate-600'
                  }`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      form.receiveSOS ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>

              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={addMutation.isLoading || updateMutation.isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addMutation.isLoading || updateMutation.isLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : editMember ? '✅ Update Member' : '➕ Add Member'}
            </button>

          </div>
        </div>
      )}

      {/* Members List */}
      <div className="px-5 mt-5 space-y-3">

        {isLoading ? (
          <div className="flex justify-center mt-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-5xl mb-3">👨‍👩‍👧</p>
            <p className="text-white font-semibold mb-1 text-lg">No family members yet</p>
            <p className="text-slate-400 text-sm mb-6 px-8">
              Add emergency contacts who get notified when you miss medicine or send SOS
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-medium"
            >
              + Add First Contact
            </button>
          </div>
        ) : members.map(m => (
          <div key={m._id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">

            {/* Member Info */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  {relationIcons[m.relation] || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base">{m.name}</p>
                  <p className="text-slate-400 text-xs">
                    {relations.find(r => r.value === m.relation)?.label || m.relation}
                  </p>
                  <p className="text-slate-500 text-xs">📞 {m.phone}</p>
                  {m.whatsapp && (
                    <p className="text-emerald-400 text-xs">📱 {m.whatsapp}</p>
                  )}
                  {m.email && (
                    <p className="text-slate-500 text-xs">📧 {m.email}</p>
                  )}
                </div>
              </div>

             
            </div>

            {/* Action Buttons */}
            <div className="border-t border-slate-700 grid grid-cols-3 divide-x divide-slate-700">

              {/* Send Alert Button */}
              <button
                onClick={() => {
                  if (!m.whatsapp) {
                    toast.error('No WhatsApp number added for this contact');
                    return;
                  }
                  if (window.confirm(`Send WhatsApp alert to ${m.name}?`)) {
                    alertMutation.mutate(m);
                  }
                }}
                disabled={alertMutation.isLoading}
                className="flex flex-col items-center gap-1 py-3 text-blue-400 hover:bg-blue-500/10 transition text-xs font-medium"
              >
                <span className="text-lg">📱</span>
                <span>Send Alert</span>
              </button>

              {/* Edit Button */}
              <button
                onClick={() => handleEdit(m)}
                className="flex flex-col items-center gap-1 py-3 text-emerald-400 hover:bg-emerald-500/10 transition text-xs font-medium"
              >
                <span className="text-lg">✏️</span>
                <span>Edit</span>
              </button>

              {/* Remove Button */}
              <button
                onClick={() => handleDelete(m._id, m.name)}
                disabled={deleteMutation.isLoading}
                className="flex flex-col items-center gap-1 py-3 text-red-400 hover:bg-red-500/10 transition text-xs font-medium"
              >
                <span className="text-lg">🗑️</span>
                <span>Remove</span>
              </button>

            </div>
          </div>
        ))}

      </div>

     

    </div>
  );
};

export default Family;