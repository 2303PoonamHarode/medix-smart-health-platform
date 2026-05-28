/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Hospital, Booking, Review, EmergencyRequest } from '../types';
import { Settings, CheckCircle2, ShieldAlert, Users, Trash2, ClipboardList, Activity, Heart, Star, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AdminPanelMain() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hospitals' | 'reviews' | 'sos' | 'bookings'>('hospitals');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const stResp = await fetch('/api/admin/stats');
      if (stResp.ok) {
        const parsedStats = await stResp.json();
        setStats(parsedStats);
      }

      // Fetch hospitals
      const hResp = await fetch('/api/hospitals');
      if (hResp.ok) {
        const hData = await hResp.json();
        setHospitals(hData);
      }

      // Fetch emergencies list
      const eResp = await fetch('/api/emergency/requests');
      if (eResp.ok) {
        const eData = await eResp.json();
        setEmergencies(eData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      // Fetch all patient reviews
      // In local demo mode, extract reviews of first hospital, but let's query detail lists or pre-populated reviewers
      const sampleResp = await fetch('/api/hospitals/hosp-1');
      if (sampleResp.ok) {
        const d1 = await sampleResp.json();
        setReviews(d1.reviews || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyHospital = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/verify-hospital/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        // Refresh local
        setHospitals(prev => prev.map(h => h.id === id ? { ...h, verificationStatus: status } : h));
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient statement?')) return;
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="w-10 h-10 border-4 border-white/5 border-t-sky-500 rounded-full animate-spin"></span>
        <p className="text-slate-500 font-mono text-xs">PULLING HEALTH CARE SYSTEM REGISTRY PARAMETERS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-1">
        <h2 className="text-xl md:text-2xl font-extrabold text-white font-display">System-Wide Audit & Moderation</h2>
        <p className="text-xs text-slate-400">Authorized command terminal verifying licenses, emergency rescue responses, and cleaning fraudulent user files.</p>
      </div>

      {/* Stats Board */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Clinics catalog</span>
            <p className="text-2xl font-extrabold text-white font-mono mt-1">{stats.totalHospitals}</p>
          </div>
          <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-2xl">
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Pending Licensing</span>
            <p className="text-2xl font-extrabold text-amber-400 font-mono mt-1">{stats.pendingHospitals}</p>
          </div>
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono">Verified Nodes</span>
            <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{stats.verifiedHospitals}</p>
          </div>
          <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl">
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider font-mono">Active SOS Dispatches</span>
            <p className="text-2xl font-extrabold text-red-500 font-mono mt-1">{stats.activeEmergencies}</p>
          </div>
          <div className="p-4 bg-sky-950/20 border border-sky-500/20 rounded-2xl">
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider font-mono">Settled Orders</span>
            <p className="text-2xl font-extrabold text-sky-300 font-mono mt-1">{stats.completedAppointments}</p>
          </div>
        </div>
      )}

      {/* Tabs list selector */}
      <div className="flex gap-4 border-b border-white/5 select-none text-xs pb-1.5 overflow-x-auto">
        {[
          { id: 'hospitals', label: 'Verify Clinics' },
          { id: 'reviews', label: 'Patient Statements Moderate' },
          { id: 'sos', label: 'SOS Request Logs' }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveTab(tb.id as any)}
            className={`pb-2 text-xs font-bold tracking-tight border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === tb.id
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tabs content box */}
      <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 shadow-xs min-h-[300px] text-xs">
        
        {/* HOSPITALS THERAPY VERIFY TAB */}
        {activeTab === 'hospitals' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider mb-2">Hospital Licensing Validation</h3>
            
            {hospitals.length === 0 ? (
              <p className="text-xs text-slate-500">No hospitals registered in the medical catalog database</p>
            ) : (
              <div className="grid gap-4">
                {hospitals.map(h => (
                  <div key={h.id} className="p-4 border border-white/5 rounded-2xl bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{h.name}</h4>
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                          h.verificationStatus === 'verified'
                            ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-500/20'
                            : h.verificationStatus === 'pending'
                            ? 'bg-amber-955/40 text-amber-400 border border-amber-500/20'
                            : 'bg-red-955/40 text-red-400 border border-red-500/20'
                        }`}>
                          {h.verificationStatus}
                        </span>
                      </div>
                      
                      <p className="text-slate-400">{h.address}</p>
                      
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                        <span>Staff Phone: {h.phone}</span>
                        <span>•</span>
                        <span>Documents Ref: {h.documents[0] || 'Awaiting uploads'}</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      {h.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => handleVerifyHospital(h.id, 'verified')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1 transition-all text-[11px] cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Approve Licence
                        </button>
                      )}
                      {h.verificationStatus !== 'rejected' && (
                        <button
                          onClick={() => handleVerifyHospital(h.id, 'rejected')}
                          className="px-3.5 py-1.5 bg-slate-900 border border-red-900/30 text-red-400 hover:bg-red-950/40 hover:text-red-300 font-bold rounded-lg flex items-center gap-1 transition-all text-[11px] cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Reject / Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS SCRUB TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider mb-2">Patient Feedback Moderation</h3>
            
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No feedback reviews requiring moderation right now</p>
            ) : (
              <div className="grid gap-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-4 border border-white/5 rounded-2xl bg-slate-900/40 flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-white">{rev.userName}</strong>
                        <div className="flex text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">{rev.text}</p>
                      
                      {rev.doctorName && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Assigned provider: {rev.doctorName}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="p-1.5 text-slate-400 hover:bg-red-950/40 rounded-lg hover:text-red-400 border border-white/5 transition-all cursor-pointer"
                      title="Moderate/Scrub review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SOS AUDITING TAB */}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider mb-2">Emergency Dispatch SOS Logs</h3>
            
            {emergencies.length === 0 ? (
              <div className="text-center py-8 text-slate-500 italic font-mono bg-slate-900/30 rounded-2xl border border-dashed border-white/10">
                ⭐ No emergencies currently registered. Excellent status!
              </div>
            ) : (
              <div className="grid gap-3">
                {emergencies.map(sos => (
                  <div key={sos.id} className="p-4 border border-red-950/55 rounded-2xl bg-red-950/15 hover:border-red-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] bg-red-950 text-red-400 px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wider">
                          SOS ID: {sos.id}
                        </span>
                        
                        <span className="bg-red-950/55 text-red-400 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-red-800/30">
                          ● STATUS: {sos.status}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-white text-sm mt-1">Caller: {sos.userName} — Tel: {sos.userPhone}</h4>
                      <p className="text-slate-400">Pickup address: <strong className="text-slate-300 font-medium">{sos.address}</strong></p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                        <span>Dispatched Trauma Center: {sos.hospitalName || 'Pending Rescue Center...'}</span>
                        <span>•</span>
                        <span>Estimated route: {sos.distanceKm || '3'} Km</span>
                        <span>•</span>
                        <span>Ambulance contact: {sos.ambulanceContact}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">Issued Call: {new Date(sos.createdAt).toLocaleTimeString()}</span>
                      
                      {sos.status !== 'completed' ? (
                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/emergency/${sos.id}/status`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'completed' })
                            });
                            if (res.ok) fetchAdminData();
                          }}
                          className="mt-2.5 px-3 py-1 bg-red-900/50 hover:bg-red-800/80 text-white border border-red-500/20 font-bold rounded-lg text-[10px] uppercase font-mono cursor-pointer"
                        >
                          Mark Rescue Done
                        </button>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-2.5 inline-block">
                          ✓ Completed Rescue Service
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
