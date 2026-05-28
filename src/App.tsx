/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Hospital, Booking, User } from './types';
import HospitalList from './components/HospitalList';
import HospitalDetail from './components/HospitalDetail';
import HospitalDashboardView from './components/HospitalDashboardView';
import AdminPanelMain from './components/AdminPanelMain';
import QueueTrackerPanel from './components/QueueTrackerPanel';
import EmergencyButton from './components/EmergencyButton';
import { HeartPulse, UserCircle2, Loader2, LogOut, Sparkles, MapPin, Compass, ShieldCheck, Ticket, Users, FileSignature } from 'lucide-react';

import AISymptomChecker from './components/AISymptomChecker';
import DigitalLabRecords from './components/DigitalLabRecords';
import FamilyAndBloodBank from './components/FamilyAndBloodBank';


export default function App() {
  // Navigation Routing States
  const [currentScreen, setCurrentScreen] = useState<'home' | 'dashboard' | 'admin' | 'tracking' | 'ai-analyzer' | 'lab-reports' | 'family-blood'>('home');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  
  // Real-time medical lists
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [selectedBookingTrack, setSelectedBookingTrack] = useState<Booking | null>(null);
  
  // Searching/Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Authenticated Profile States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [roleInput, setRoleInput] = useState<'patient' | 'hospital' | 'admin'>('patient');

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  // Sync hospitals lists with backend APIs
  const fetchHospitals = async (search = '', filter = 'all') => {
    setHospitalsLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (search) qParams.append('search', search);
      if (filter && filter !== 'all') qParams.append('filter', filter);
      
      const response = await fetch(`/api/hospitals?${qParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
      }
    } catch (e) {
      console.error("Failed to query hospital list index data", e);
    } finally {
      setHospitalsLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem('hospital_token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('/api/bookings/my', { headers });
      if (response.ok) {
        const data = await response.json();
        setMyBookings(data.sort((a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        
        // If we are currently tracking a booking, update its referenced layout properties dynamically!
        if (selectedBookingTrack) {
          const fresh = data.find((b: Booking) => b.id === selectedBookingTrack.id);
          if (fresh) setSelectedBookingTrack(fresh);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHospitals();
    const token = localStorage.getItem('hospital_token');
    if (token) {
      // Decode standard base64 session token
      try {
        const decoded = atob(token);
        const [id, email, role] = decoded.split(':');
        fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          if (res.ok) {
            res.json().then(d => {
              setCurrentUser(d.user);
            });
          }
        });
      } catch (e) {
        console.warn("Invalid preserved session token, flushing...", e);
        localStorage.removeItem('hospital_token');
      }
    }
    fetchMyBookings();
  }, []);

  // Periodic Polling Fallback synchronizer matching modern food delivery trackers!
  useEffect(() => {
    const trackerPoll = setInterval(() => {
      fetchMyBookings();
    }, 4000); // Poll list queue changes every 4 seconds
    return () => clearInterval(trackerPoll);
  }, [selectedBookingTrack]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const targetUrl = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login' 
      ? { email: emailInput, password: passwordInput }
      : { email: emailInput, password: passwordInput, name: nameInput, phone: phoneInput, role: roleInput };

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Identity provider verification failure');
      }

      // Save token in browser
      localStorage.setItem('hospital_token', data.token);
      setCurrentUser(data.user);
      setIsAuthModalOpen(false);
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
      setPhoneInput('');

      // Refresh listings database metrics
      fetchMyBookings();
      fetchHospitals();
    } catch (err: any) {
      setAuthError(err.message || 'Error executing credential exchange');
    } finally {
      setAuthLoading(false);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('hospital_token');
    setCurrentUser(null);
    setMyBookings([]);
    setSelectedBookingTrack(null);
    setCurrentScreen('home');
    setSelectedHospitalId(null);
  };

  return (
    <div className="bg-[#05070a] min-h-screen text-[#f8fafc] flex flex-col font-sans transition-colors relative pb-24">
      
      {/* Immersive Top Visual Banner Grid */}
      <header className="sticky top-0 glass border-b border-white/5 z-35 select-none">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Logo Brand banner */}
          <div 
            onClick={() => {
              setCurrentScreen('home');
              setSelectedHospitalId(null);
              setSelectedBookingTrack(null);
            }} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="p-2 bg-sky-500 text-slate-950 rounded-2xl group-hover:bg-sky-400 transition-colors">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm md:text-base text-white font-display flex items-center gap-1 leading-none">
                <span>CareQuest</span>
                <span className="text-sky-500">Smart Queue</span>
              </h1>
              <p className="text-[9.5px] text-slate-500 tracking-wider font-mono uppercase font-semibold mt-0.5">Healthcare Startup</p>
            </div>
          </div>

          {/* Navigation Controls Row */}
          <nav className="hidden lg:flex items-center gap-1 font-display">
            <button
              onClick={() => {
                setCurrentScreen('home');
                setSelectedHospitalId(null);
                setSelectedBookingTrack(null);
                fetchHospitals('', 'all');
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className={`p-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${currentScreen === 'home' && !selectedHospitalId ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              <span>Explore Clinics</span>
            </button>
            <button
              onClick={() => {
                setCurrentScreen('tracking');
                setSelectedBookingTrack(myBookings[0] || null);
              }}
              className={`p-2 px-4 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${currentScreen === 'tracking' ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              <span>Patient Tokens</span>
              {myBookings.filter(b => b.queueStatus !== 'Completed').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                  {myBookings.filter(b => b.queueStatus !== 'Completed').length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                  return;
                }
                setCurrentScreen('ai-analyzer');
              }}
              className={`p-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${currentScreen === 'ai-analyzer' ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>AI Triage</span>
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                  return;
                }
                setCurrentScreen('lab-reports');
              }}
              className={`p-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${currentScreen === 'lab-reports' ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              <FileSignature className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lab Files</span>
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                  return;
                }
                setCurrentScreen('family-blood');
              }}
              className={`p-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${currentScreen === 'family-blood' ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span>Family Hub</span>
            </button>

            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthMode('login');
                  setRoleInput('hospital');
                  setIsAuthModalOpen(true);
                  return;
                }
                setCurrentScreen('dashboard');
              }}
              className={`p-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentScreen === 'dashboard' ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              <span>Hospital Panel</span>
            </button>

            {/* Quick Admin bypass */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthMode('login');
                  setRoleInput('admin');
                  setIsAuthModalOpen(true);
                  return;
                }
                setCurrentScreen('admin');
              }}
              className={`p-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentScreen === 'admin' ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              <span>Sys auditor</span>
            </button>
          </nav>

          {/* Account Authentication profile block */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 text-right bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5">
                  <div>Logged: <span className="font-bold text-white">{currentUser.name.split(' ')[0]}</span></div>
                  <div className="text-[9px] uppercase font-bold text-sky-400 mt-0.5">{currentUser.role} console</div>
                </span>
                
                <button
                  onClick={logoutUser}
                  className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-red-400 transition-colors border border-white/10 cursor-pointer"
                  title="Logout Profile"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <UserCircle2 className="w-4 h-4 text-white" />
                <span>Account Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body Content width constraint */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Mobile quick-bar indicators */}
        <div className="lg:hidden flex justify-center gap-1.5 glass p-2.5 rounded-2xl border border-white/5 shadow-lg select-none">
          <button
            onClick={() => {
              setCurrentScreen('home');
              setSelectedHospitalId(null);
            }}
            className={`flex-1 py-2 rounded-xl text-[11px] font-extrabold text-center transition-all ${currentScreen === 'home' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
          >
            Directory
          </button>
          <button
            onClick={() => {
              setCurrentScreen('tracking');
              setSelectedBookingTrack(myBookings[0] || null);
            }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold text-center transition-all ${currentScreen === 'tracking' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
          >
            My Tokens ({myBookings.filter(b => b.queueStatus !== 'Completed').length})
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthMode('login');
                setIsAuthModalOpen(true);
                return;
              }
              setCurrentScreen('ai-analyzer');
            }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold text-center transition-all ${currentScreen === 'ai-analyzer' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
          >
            AI Triage
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthMode('login');
                setIsAuthModalOpen(true);
                return;
              }
              setCurrentScreen('lab-reports');
            }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold text-center transition-all ${currentScreen === 'lab-reports' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
          >
            Labs
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthMode('login');
                setIsAuthModalOpen(true);
                return;
              }
              setCurrentScreen('family-blood');
            }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold text-center transition-all ${currentScreen === 'family-blood' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
          >
            Family
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthMode('login');
                setRoleInput('hospital');
                setIsAuthModalOpen(true);
                return;
              }
              setCurrentScreen('dashboard');
            }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold text-center transition-all ${currentScreen === 'dashboard' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
          >
            Dashboard
          </button>
        </div>

        {/* 1. DISCOVERY DIRECTORY PAGE (HOME SCREEN) */}
        {currentScreen === 'home' && (
          <>
            {!selectedHospitalId ? (
              <HospitalList
                hospitals={hospitals}
                onSelectHospital={(id) => setSelectedHospitalId(id)}
                onSearchChange={(q) => {
                  setSearchQuery(q);
                  fetchHospitals(q, activeFilter);
                }}
                onFilterChange={(f) => {
                  setActiveFilter(f);
                  fetchHospitals(searchQuery, f);
                }}
                activeFilter={activeFilter}
              />
            ) : (
              // 2. HOSPITAL DETAIL PROFILE OVERLAY VIEW
              <HospitalDetail
                hospitalId={selectedHospitalId}
                onBack={() => setSelectedHospitalId(null)}
                currentUser={currentUser}
                onBookingCreated={() => {
                  // Post-booking re-direct directly to Tracking monitor pane!
                  fetchMyBookings().then(() => {
                    setCurrentScreen('tracking');
                  });
                }}
              />
            )}
          </>
        )}

        {/* 3. PATIENTS TOKENS STATUS QUEUE TRACKER (TRACKING SCREEN) */}
        {currentScreen === 'tracking' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-white/10">
              <h2 className="text-xl md:text-2xl font-extrabold text-white font-display flex items-center gap-1.5">
                <Ticket className="w-5 h-5 text-sky-400 shrink-0" />
                Live Active Medical Tokens
              </h2>
              <p className="text-xs text-slate-400">Live countdown countdowns keeping you out of crowded hospital waiting rooms. Match your ETA dynamically!</p>
            </div>

            {myBookings.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center text-slate-400 max-w-lg mx-auto border border-white/10">
                <Ticket className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
                <h3 className="font-extrabold text-base text-white font-display mt-4">No active consultations</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Once you book standard G.P. triage services or scan checks on CareQuest, your token docket registers here instantly.</p>
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="mt-5 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold font-mono shadow-md cursor-pointer transition-colors"
                >
                  Discover Clinics
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Bookings catalog thread on the left */}
                <div className="lg:col-span-4 space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono ml-1">My Medical appointments</h3>
                  
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {myBookings.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBookingTrack(b)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          selectedBookingTrack?.id === b.id
                            ? 'bg-sky-950/60 border-sky-500/40 text-white shadow-lg shadow-sky-500/5'
                            : b.queueStatus === 'Completed'
                            ? 'bg-slate-900/40 border-white/5 opacity-65 hover:opacity-100 text-slate-400'
                            : 'bg-slate-900/60 border-white/5 text-slate-350 hover:border-white/10 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded ${
                            selectedBookingTrack?.id === b.id
                              ? 'bg-slate-950 text-sky-400 border border-sky-500/10'
                              : 'bg-slate-950 text-slate-400 border border-white/5'
                          }`}>
                            ID: {b.tokenNumber}
                          </span>
                          
                          <span className={`text-[9px] uppercase font-bold font-mono ${
                            b.queueStatus === 'Completed'
                              ? 'text-emerald-400'
                              : selectedBookingTrack?.id === b.id
                              ? 'text-sky-300 animate-pulse'
                              : 'text-indigo-400'
                          }`}>
                            ● {b.queueStatus}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs mt-3 truncate leading-snug text-white">{b.hospitalName}</h4>
                        <p className={`text-[10.5px] mt-0.5 ${selectedBookingTrack?.id === b.id ? 'text-slate-300' : 'text-slate-400'}`}>G.P: {b.doctorName}</p>

                        <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-2.5 text-[10px] font-mono">
                          <span className={selectedBookingTrack?.id === b.id ? 'text-slate-300' : 'text-slate-500'}>Slot: {b.timeSlot.split(' ')[0]}</span>
                          <strong className={selectedBookingTrack?.id === b.id ? 'text-sky-300' : 'text-slate-450'}>Est wait: {b.queueStatus === 'Completed' ? 'Closed' : `${b.estimatedWaitingTimeMinutes}m`}</strong>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main progression track console on the right */}
                <div className="lg:col-span-8">
                  {selectedBookingTrack ? (
                    <QueueTrackerPanel
                      booking={selectedBookingTrack}
                      onRefreshStatus={fetchMyBookings}
                      showSimulateButtons={true} // Allow users to play/test queue movements easily!
                    />
                  ) : (
                    <div className="text-center py-20 glass border border-white/5 rounded-3xl text-slate-400">
                      Select any medical token docket on the left to inspect its live physical tracking progression.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* 4. HOSPITAL REGISTER / DASHBOARD MANAGER */}
        {currentScreen === 'dashboard' && (
          <HospitalDashboardView currentUser={currentUser} />
        )}

        {/* 5. ADMIN HEALTH VERIFY SYSTEM-WIDE AUDITOR */}
        {currentScreen === 'admin' && (
          <AdminPanelMain />
        )}

        {/* 6. AI SYMPTOM ANALYZER & TRIAGE MATRICES */}
        {currentScreen === 'ai-analyzer' && (
          <AISymptomChecker />
        )}

        {/* 7. SECURE LABORATORY PATIENT RECORDS */}
        {currentScreen === 'lab-reports' && (
          <DigitalLabRecords />
        )}

        {/* 8. FAMILY PROFILE & BLOOD EXCHANGE */}
        {currentScreen === 'family-blood' && (
          <FamilyAndBloodBank />
        )}

      </main>

      {/* Floating emergency node overlay triggers on click */}
      <EmergencyButton
        hospitals={hospitals}
        currentUser={currentUser}
        onSOSCreated={() => {
          // Alert user SOS dispatched.
        }}
      />      {/* Account Signup Authentication pop-up overlay */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div 
            className="glass rounded-3xl w-full max-w-sm border border-white/10 p-6 shadow-2xl relative select-none animate-[fade-in_0.3s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center pb-4 border-b border-white/10 text-white">
              <h3 className="text-lg font-bold text-white font-display">
                {authMode === 'login' ? 'Welcome Back To CareQuest' : 'Create CareQuest Account'}
              </h3>
              <p className="text-xs text-slate-450 mt-1">
                {authMode === 'login' ? 'Provide registered email passcode credentials.' : 'Verify clinic license and list specialists.'}
              </p>
            </div>

            {authError && (
              <div className="my-3 bg-red-955/40 border-l-4 border-red-500 p-2.5 text-[11px] text-red-200 font-medium rounded-r border border-white/5">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 pt-4 text-xs text-slate-300">
              
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Full Representative Name</label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="John Doe / Dr. Sarah Carter"
                      className="w-full px-3 py-2 bg-slate-955 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500/50 text-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Telephone line</label>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+1 (555) 019-2026"
                      className="w-full px-3 py-2 bg-slate-955 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500/50 text-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Identify Council Role</label>
                    <select
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value as any)}
                      className="w-full px-2.5 py-2 bg-slate-955 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500/50"
                    >
                      <option value="patient">Patient Client (Browse and Book)</option>
                      <option value="hospital">Hospital Command (Update Clinics and Roster)</option>
                      <option value="admin">Regulatory Auditor (License Reviewer)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Authentication Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full px-3 py-2 bg-slate-955 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500/50 text-white font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Credentials Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-955 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500/50 text-white font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-sky-600 border border-sky-500 hover:bg-sky-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-1 mt-2 cursor-pointer disabled:opacity-55 transition-colors"
              >
                {authLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{authMode === 'login' ? 'Confirm Account' : 'Initialize Account'}</span>
                )}
              </button>
            </form>

            <div className="pt-4 mt-4 border-t border-white/10 text-center text-xs text-slate-400 flex justify-center gap-1 select-none">
              <span>{authMode === 'login' ? "Don't have an audit profile yet?" : "Already registered?"}</span>
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-sky-450 font-bold hover:underline"
              >
                {authMode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Persistent mini-banner helper explaining account bypass */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 glass text-slate-300 border-t border-white/5 z-30 font-mono text-[9px] flex items-center justify-center gap-4 px-4 select-none">
        <span className="opacity-75 uppercase">Demo Quick Bypass Accounts:</span>
        <div className="flex gap-3 text-sky-450 font-extrabold max-w-[600px] overflow-hidden truncate">
          <span>Patient: patient@smarthospital.com / patient123</span>
          <span className="text-white/20">|</span>
          <span>Owner: owner@citygrace.com / hospital123</span>
          <span className="text-white/20">|</span>
          <span>Auditor: admin@smarthospital.com / admin123</span>
        </div>
      </footer>
    </div>
  );
}
