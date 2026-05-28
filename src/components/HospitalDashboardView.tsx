/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Hospital, Doctor, MedicalService, Booking, QueueStatus } from '../types';
import { Plus, Trash2, ShieldAlert, Check, X, Users, ClipboardList, Settings, Sparkles, Loader2, Calendar, Phone, MapPin } from 'lucide-react';

interface HospitalDashboardViewProps {
  currentUser: { id: string; email: string; name: string } | null;
}

export default function HospitalDashboardView({ currentUser }: HospitalDashboardViewProps) {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<MedicalService[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'doctors' | 'services' | 'bookings'>('overview');
  
  // Registration form states
  const [registering, setRegistering] = useState(false);
  const [hospName, setHospName] = useState('');
  const [hospImage, setHospImage] = useState('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80');
  const [hospAddress, setHospAddress] = useState('789 West Medical Center, Sector 4');
  const [hospPhone, setHospPhone] = useState('+1 (555) 304-9844');
  const [hospSpecializations, setHospSpecializations] = useState('Emergency Medicine, Cardiology, General Consultation');
  const [hospEmergency, setHospEmergency] = useState(true);
  const [hospOpen, setHospOpen] = useState('08:00');
  const [hospClose, setHospClose] = useState('22:00');
  const [hospCerts, setHospCerts] = useState('Federal Board Hospital Certification, JCI Standard Level-2 License');
  const [hospDocs, setHospDocs] = useState('license-file-2026.pdf');
  const [regError, setRegError] = useState('');

  // Doctor Form
  const [newDocName, setNewDocName] = useState('');
  const [newDocQual, setNewDocQual] = useState('');
  const [newDocExp, setNewDocExp] = useState(5);
  const [newDocSpec, setNewDocSpec] = useState('General Consultation');
  const [newDocFees, setNewDocFees] = useState(80);

  // Service Form
  const [newSName, setNewSName] = useState('');
  const [newSPrice, setNewSPrice] = useState(90);
  const [newSDur, setNewSDur] = useState(30);
  const [newSByDoc, setNewSByDoc] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/hospitals/owner/me', {
        headers: {
          'Authorization': localStorage.getItem('hospital_token') 
            ? `Bearer ${localStorage.getItem('hospital_token')}`
            : ''
        }
      });
      if (response.status === 404) {
        // Not registered yet, allow registration
        setHospital(null);
        return;
      }
      if (!response.ok) {
        throw new Error('Verification failure pulling hospital registry data');
      }
      const hospData = await response.json() as Hospital;
      setHospital(hospData);

      // Fetch linked doctors, services, and bookings
      const detailResponse = await fetch(`/api/hospitals/${hospData.id}`);
      if (detailResponse.ok) {
        const fullDetail = await detailResponse.json();
        setDoctors(fullDetail.doctors || []);
        setServices(fullDetail.services || []);
      }

      const bookingsResponse = await fetch(`/api/bookings/hospital/${hospData.id}`);
      if (bookingsResponse.ok) {
        const bData = await bookingsResponse.json();
        setBookings(bData.sort((a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (e: any) {
      setError(e.message || 'Error occurred fetching database dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  // REGISTER HOSPITAL SUBMIT
  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospName.trim() || !hospAddress.trim()) {
      setRegError('Hospital Name and Location address are strictly required');
      return;
    }
    setRegError('');
    setRegistering(true);

    try {
      // Create new panel credentials
      const response = await fetch('/api/hospitals/register-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email,
          password: 'hospital123', // safe sandbox bypass
          hospitalName: hospName,
          imageUrl: hospImage,
          address: hospAddress,
          phone: hospPhone,
          specializations: hospSpecializations.split(',').map(s => s.trim()),
          emergencyServicesAvailable: hospEmergency,
          openingTime: hospOpen,
          closingTime: hospClose,
          certificates: hospCerts.split(',').map(c => c.trim()),
          documents: [hospDocs]
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Server error saving hospital credentials');
      }

      // Re-trigger sync
      await fetchDashboardData();
    } catch (err: any) {
      setRegError(err.message || 'Error saving clinic panel registration profile');
    } finally {
      setRegistering(false);
    }
  };

  // ADD DOCTOR
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocQual.trim()) return;
    try {
      const response = await fetch(`/api/hospitals/${hospital?.id}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDocName,
          qualification: newDocQual,
          experienceYears: newDocExp,
          specialization: newDocSpec,
          consultationFees: newDocFees
        })
      });
      if (response.ok) {
        const resultDoc = await response.json();
        setDoctors(prev => [...prev, resultDoc]);
        setNewDocName('');
        setNewDocQual('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // REMOVE DOCTOR
  const handleRemoveDoctor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this doctor from the registry?')) return;
    try {
      const response = await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDoctors(prev => prev.filter(d => d.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ADD TREATMENT SERVICE
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSName.trim() || !newSByDoc) return;
    try {
      const response = await fetch(`/api/hospitals/${hospital?.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSName,
          price: newSPrice,
          durationMinutes: newSDur,
          availability: true,
          doctorId: newSByDoc
        })
      });
      if (response.ok) {
        const resSrv = await response.json();
        setServices(prev => [...prev, resSrv]);
        setNewSName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // REMOVE TREATMENT SERVICE
  const handleRemoveService = async (id: string) => {
    if (!confirm('Are you sure you want to remove this medical service offering?')) return;
    try {
      const response = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setServices(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ACCEPT / DISCHARGE QUEUE BOOKING OPERATION
  const handleUpdateBookingStatus = async (bookingId: string, nextStatus: QueueStatus) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus })
      });
      if (response.ok) {
        // Redownload state to update positions ahead / sync properly
        const bResp = await fetch(`/api/bookings/hospital/${hospital?.id}`);
        if (bResp.ok) {
          const updatedBookings = await bResp.json();
          setBookings(updatedBookings.sort((a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="w-10 h-10 border-4 border-white/5 border-t-sky-500 rounded-full animate-spin"></span>
        <p className="text-slate-500 font-mono text-xs">PULLING CLINIC RECORDS FOR OWNER CONTROLS...</p>
      </div>
    );
  }

  // FIRST FLOW: NOT CONFIGURED HOSPITAL -> DISPLAY SIGNUP/REGISTRATION FORM
  if (!hospital) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-950/40 border border-white/5 p-8 rounded-3xl shadow-xl mt-4">
        <div className="space-y-1 text-center pb-6 border-b border-white/5">
          <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950/40 border border-sky-500/20 px-2.5 py-0.5 rounded tracking-wider">
            Owner Panel Onboarding
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-white font-display mt-2">Hospital Branch Registration</h2>
          <p className="text-xs text-slate-400">Provide medical certifications, trauma licenses, opening details, and doctor listings to instantiate your clinic console.</p>
        </div>

        {regError && (
          <div className="my-4 bg-red-950/30 border-l-4 border-red-500 p-3 text-xs text-red-700 font-medium rounded-r">
            {regError}
          </div>
        )}

        <form onSubmit={handleRegisterHospital} className="space-y-4 pt-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Hospital Name</label>
              <input
                type="text"
                required
                value={hospName}
                onChange={(e) => setHospName(e.target.value)}
                placeholder="City Community Health Clinic"
                className="w-full px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Profile Cover Image URL</label>
              <input
                type="text"
                value={hospImage}
                onChange={(e) => setHospImage(e.target.value)}
                placeholder="Unsplash img / HTTPS only"
                className="w-full px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Geographic Site Address</label>
            <input
              type="text"
              required
              value={hospAddress}
              onChange={(e) => setHospAddress(e.target.value)}
              placeholder="12 Medical Dr, Manhattan New York"
              className="w-full px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone Line</label>
              <input
                type="text"
                value={hospPhone}
                onChange={(e) => setHospPhone(e.target.value)}
                placeholder="+1 (555) 304-9844"
                className="w-full px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-405 uppercase mb-1">Opening Time</label>
              <input
                type="time"
                value={hospOpen}
                onChange={(e) => setHospOpen(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-405 uppercase mb-1">Closing Time</label>
              <input
                type="time"
                value={hospClose}
                onChange={(e) => setHospClose(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Hospital Specialties (comma separated)</label>
            <input
              type="text"
              value={hospSpecializations}
              onChange={(e) => setHospSpecializations(e.target.value)}
              placeholder="Pediatrics, cardiology, minor cuts..."
              className="w-full px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-4 bg-slate-900/30 border border-white/5 rounded-2xl space-y-3">
            <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wide">Accreditations & Licence Uploads</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Official Certificates (comma separated)</label>
                <input
                  type="text"
                  value={hospCerts}
                  onChange={(e) => setHospCerts(e.target.value)}
                  placeholder="State Trauma Certification, JCI standard license"
                  className="w-full px-3 py-1.5 bg-slate-950/60 border border-white/5 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-555"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Uploaded PDF File reference</label>
                <input
                  type="text"
                  value={hospDocs}
                  onChange={(e) => setHospDocs(e.target.value)}
                  placeholder="health-certificate-2026.pdf"
                  className="w-full px-3 py-1.5 bg-slate-950/60 border border-white/5 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-555"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="emergency_check"
              checked={hospEmergency}
              onChange={(e) => setHospEmergency(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 bg-slate-950 border-white/5 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
            />
            <label htmlFor="emergency_check" className="font-bold text-slate-300">
              Emergency Trauma Facility Available (SOS Dials Enabled)
            </label>
          </div>

          <button
            type="submit"
            disabled={registering}
            className="w-full py-3 bg-sky-600 hover:bg-sky-505 text-white rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-all mt-4 cursor-pointer"
          >
            {registering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Registering Branch Core...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-white" />
                Activate Hospital Console
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // SECOND FLOW: CONFIGURED -> SHOW MULTI-TAB DASHBOARD
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-start">
      
      {/* Sidebar Control Index */}
      <div className="lg:col-span-3 bg-slate-950/40 border border-white/5 rounded-3xl p-5 shadow-xs space-y-4 select-none">
        <div className="pb-3 border-b border-white/5 text-center lg:text-left">
          <h2 className="text-sm font-extrabold text-white font-display truncate">{hospital.name}</h2>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono mt-0.5 inline-block">Branch Commander ID: {hospital.id}</span>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1.5 lg:pb-0 font-display">
          {[
            { id: 'overview', label: 'Monitor Console', icon: ClipboardList },
            { id: 'doctors', label: 'Manage Staff', icon: Users },
            { id: 'services', label: 'Medical Catalog', icon: Settings },
            { id: 'bookings', label: 'Patient Queue list', icon: ClipboardList }
          ].map(item => {
            const Icon = item.icon;
            const isSubSel = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`w-full text-left p-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
                  isSubSel
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20 shadow-sm shadow-sky-505/10'
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main SubTab Workspace */}
      <div className="lg:col-span-9 bg-slate-950/40 border border-white/5 rounded-3xl p-6 shadow-xs min-h-[400px]">
        
        {/* TAB 1: OVERVIEW & BRAND STATS */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            <div className="p-4 bg-sky-950/20 border border-sky-500/20 text-sky-300 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-white">Clinical Approval Status: <span className="uppercase text-sky-400 font-black">{hospital.verificationStatus}</span></p>
                <p className="opacity-90 mt-1 text-slate-400">If pending, an Admin will check corporate health licenses and flip verified markers on the public directory.</p>
              </div>
            </div>

            {/* Quick counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Queue Total</p>
                <p className="text-2xl font-extrabold text-slate-105 font-mono mt-1">{bookings.length}</p>
              </div>
              <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Staff Count</p>
                <p className="text-2xl font-extrabold text-slate-105 font-mono mt-1">{doctors.length}</p>
              </div>
              <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Offerings</p>
                <p className="text-2xl font-extrabold text-slate-105 font-mono mt-1">{services.length}</p>
              </div>
              <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Verified Certs</p>
                <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{hospital.certificates.length}</p>
              </div>
            </div>

            {/* General Settings metadata and hours */}
            <div className="border border-white/5 bg-slate-900/20 rounded-2xl p-4 text-xs space-y-3">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-2 border-b border-white/5 flex items-center justify-between">
                <span>Core Settings Metadata</span>
                <span className="text-sky-400">Active</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-slate-500">Clinic Address: <strong className="text-slate-300">{hospital.address}</strong></p>
                  <p className="text-slate-500">Dispatch Hotline: <strong className="text-slate-300">{hospital.phone}</strong></p>
                  <p className="text-slate-505">Specialities: <strong className="text-slate-300">{hospital.specializations.join(', ')}</strong></p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-slate-500">Standard Base Wait: <strong className="text-slate-300">{hospital.minWaitingTimeMinutes} Minutes</strong></p>
                  <p className="text-slate-500">Timetable Grid: <strong className="text-slate-300">{hospital.openingTime} to {hospital.closingTime}</strong></p>
                  <p className="text-slate-500">Accredited Accords: <strong className="text-slate-300 truncate inline-block max-w-[200px]">{hospital.certificates.join(', ')}</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF DOCTORS COMPILER */}
        {activeSubTab === 'doctors' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">Physician Roster Registry</h3>

            {/* Doctors quick add form */}
            <form onSubmit={handleAddDoctor} className="bg-slate-900/30 border border-white/5 p-4 rounded-2xl text-xs space-y-3">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wide text-slate-350">Add New Attending MD</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Dr. Allison House"
                    className="w-full px-3 py-1.5 border border-white/5 bg-slate-950/60 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Degree Qualifications</label>
                  <input
                    type="text"
                    required
                    value={newDocQual}
                    onChange={(e) => setNewDocQual(e.target.value)}
                    placeholder="MD Pediatric, Fellow Johns Hopkins"
                    className="w-full px-3 py-1.5 border border-white/5 bg-slate-950/60 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Clinic Specialization</label>
                  <select
                    value={newDocSpec}
                    onChange={(e) => setNewDocSpec(e.target.value)}
                    className="w-full px-2 py-1.5 border border-white/5 bg-slate-950 text-slate-100 rounded-lg focus:outline-none focus:border-sky-500"
                  >
                    <option value="General Consultation" className="bg-slate-950 text-slate-100">General Consultation</option>
                    <option value="Emergency Medicine" className="bg-slate-950 text-slate-100">Emergency Medicine</option>
                    <option value="Pediatrics" className="bg-slate-950 text-slate-100">Pediatrics</option>
                    <option value="Cardiology" className="bg-slate-950 text-slate-100">Cardiology</option>
                    <option value="Radiology" className="bg-slate-950 text-slate-100">Radiology</option>
                    <option value="Internal Medicine" className="bg-slate-950 text-slate-100">Internal Medicine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={newDocExp}
                    onChange={(e) => setNewDocExp(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 border border-white/5 bg-slate-950/60 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={newDocFees}
                    onChange={(e) => setNewDocFees(parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-1.5 border border-white/5 bg-slate-950/60 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg font-mono flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Enroll Doctor</span>
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="font-bold text-[11px] uppercase text-slate-500">Current Staff Active</h4>
              {doctors.length === 0 ? (
                <p className="text-xs text-slate-550 italic">No doctors listed under your dashboard directory yet</p>
              ) : (
                <div className="grid gap-2">
                  {doctors.map(d => (
                    <div key={d.id} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl flex items-center justify-between text-xs hover:border-slate-800">
                      <div>
                        <p className="font-bold text-white">{d.name}</p>
                        <p className="text-slate-400 text-[10.5px] mt-0.5">{d.specialization} — {d.qualification}</p>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-[11px]">
                        <span className="text-slate-400">${d.consultationFees} / visit</span>
                        <span className="text-slate-400">{d.experienceYears} yrs</span>
                        <button
                          onClick={() => handleRemoveDoctor(d.id)}
                          className="p-1.5 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TREATMENTS SERVICE CONTROL */}
        {activeSubTab === 'services' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">Treatments Menu Catalog</h3>

            {/* Service quick add form */}
            <form onSubmit={handleAddService} className="bg-slate-900/30 border border-white/5 p-4 rounded-2xl text-xs space-y-3">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wide text-slate-350">Add Service Catalog Offering</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Service Title</label>
                  <input
                    type="text"
                    required
                    value={newSName}
                    onChange={(e) => setNewSName(e.target.value)}
                    placeholder="General Consultation, Scanning MRI, Deluxe Lab screen..."
                    className="w-full px-3 py-1.5 border border-white/5 bg-slate-950/60 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Attending Physician Appointed</label>
                  <select
                    required
                    value={newSByDoc}
                    onChange={(e) => setNewSByDoc(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-white/5 bg-slate-950 text-slate-100 rounded-lg focus:outline-none focus:border-sky-500"
                  >
                    <option value="" className="bg-slate-950 text-slate-100">-- Assign MD provider --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id} className="bg-slate-950 text-slate-100">{d.name} ({d.specialization})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Target Consultation Price ($)</label>
                  <input
                    type="number"
                    value={newSPrice}
                    onChange={(e) => setNewSPrice(parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-1.5 border border-white/5 bg-slate-950/60 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Average Duration (Minutes)</label>
                  <input
                    type="number"
                    value={newSDur}
                    onChange={(e) => setNewSDur(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-1.5 border border-white/5 bg-slate-950/60 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={doctors.length === 0}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold rounded-lg font-mono flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Service Catalog Item</span>
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="font-bold text-[11px] uppercase text-slate-500">Active Offerings Catalog</h4>
              {services.length === 0 ? (
                <p className="text-xs text-slate-550 italic">No services listed yet. Add one above to let clients book appointments!</p>
              ) : (
                <div className="grid gap-2">
                  {services.map(s => (
                    <div key={s.id} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl flex items-center justify-between text-xs hover:border-slate-800">
                      <div>
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-slate-400 text-[10.5px] mt-0.5">Appointed Physician: {s.doctorName || 'MD General Practice Registration'}</p>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-[11px]">
                        <span className="text-slate-400">${s.price} fee</span>
                        <span className="text-slate-400">{s.durationMinutes} mins</span>
                        <button
                          onClick={() => handleRemoveService(s.id)}
                          className="p-1.5 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: QUEUE BOOKINGS CONTROL */}
        {activeSubTab === 'bookings' && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">Patient Booking Queues</h3>
            
            {bookings.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/40 border border-white/5 border-dashed rounded-2xl text-slate-500">
                <p className="text-xs">No active appointment orders booked for your branch yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {bookings.map(bo => (
                  <div key={bo.id} className="p-5 border border-white/5 rounded-2xl hover:border-white/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 text-xs">
                    <div className="space-y-1 mr-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wide text-[10px]">
                          Token: {bo.tokenNumber}
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                          bo.queueStatus === 'Completed'
                            ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400'
                            : bo.queueStatus === 'Consultation Started'
                            ? 'bg-amber-950/40 border border-amber-500/20 text-amber-400'
                            : 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-400'
                        }`}>
                          {bo.queueStatus}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-white text-sm mt-1">{bo.userName}</h4>
                      <p className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" /> {bo.userPhone}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-slate-450 font-mono mt-1 pt-1 border-t border-white/5">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-550" /> {bo.bookingDate}</span>
                        <span className="text-slate-700">•</span>
                        <span className="text-slate-400">Time: {bo.timeSlot}</span>
                        <span className="text-slate-700">•</span>
                        <span className="text-emerald-400 font-bold">Treatment: {bo.serviceName}</span>
                      </div>
                    </div>

                    {/* ACTIONS: STEP EXECUTORS FOR THE REAL-TIME METRIC */}
                    <div className="flex flex-col items-end shrink-0 gap-2">
                      <span className="text-[10px] text-slate-500 font-mono font-medium">Position in line: #{bo.queueStatus === 'Completed' ? 'Closed' : bo.queuePosition}</span>
                      
                      {bo.queueStatus !== 'Completed' ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {bo.queueStatus === 'Waiting' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(bo.id, 'Doctor Assigned')}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer"
                            >
                              Assign Attendant
                            </button>
                          )}
                          {bo.queueStatus === 'Doctor Assigned' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(bo.id, 'Consultation Started')}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-505 text-white rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer"
                            >
                              Start Consult
                            </button>
                          )}
                          {bo.queueStatus === 'Consultation Started' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(bo.id, 'Completed')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer"
                            >
                              Discharge Patient
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-emerald-405 font-bold bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded text-[10px] uppercase tracking-wide">
                          ✓ Treatment Resolved
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
