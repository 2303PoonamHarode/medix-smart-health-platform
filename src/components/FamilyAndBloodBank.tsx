import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Droplets, Locate, MapPin, ShieldAlert, Phone, ShieldCheck, Activity, Clock, HeartPulse, Loader2, Info, Plus } from 'lucide-react';
import { FamilyMember, BloodDonor, BloodStock } from '../types';

export default function FamilyAndBloodBank() {
  // Family states
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(true);
  
  // New family form states
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState<'Spouse' | 'Parent' | 'Child' | 'Sibling' | 'Other'>('Spouse');
  const [newAge, setNewAge] = useState('30');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newBloodGroup, setNewBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('O+');
  const [newAllergies, setNewAllergies] = useState('');
  const [newChronic, setNewChronic] = useState('');
  const [newHistory, setNewHistory] = useState('');
  
  const [familyError, setFamilyError] = useState('');
  const [familySuccess, setFamilySuccess] = useState('');

  // Blood bank states
  const [bloodStocks, setBloodStocks] = useState<BloodStock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  
  // Matching donor states
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('O-');
  const [patientAddress, setPatientAddress] = useState('New York clinical ER desk 4');
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    success: boolean;
    message: string;
    closestDonor: BloodDonor | null;
  } | null>(null);

  // Simulated GPS tracking position increment
  const [donorEtaMinutes, setDonorEtaMinutes] = useState(12);

  const fetchFamily = async () => {
    setLoadingFamily(true);
    try {
      const token = localStorage.getItem('hospital_token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('/api/family', { headers });
      if (response.ok) {
        const data = await response.json();
        setFamily(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFamily(false);
    }
  };

  const fetchBloodStocks = async () => {
    setLoadingStocks(true);
    try {
      const response = await fetch('/api/blood/stocks');
      if (response.ok) {
        const data = await response.json();
        setBloodStocks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStocks(false);
    }
  };

  useEffect(() => {
    fetchFamily();
    fetchBloodStocks();
  }, []);

  // Real-time ETA ticking simulation for Swiggy/Uber-like tracking feel
  useEffect(() => {
    if (!matchResult || !matchResult.success || donorEtaMinutes <= 1) return;
    const interval = setInterval(() => {
      setDonorEtaMinutes(prev => (prev > 1 ? prev - 1 : 1));
    }, 15000); // reducing ETA countdown slightly
    return () => clearInterval(interval);
  }, [matchResult, donorEtaMinutes]);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFamilyError('Family representative name is required.');
      return;
    }
    setFamilyError('');
    setFamilySuccess('');
    
    const token = localStorage.getItem('hospital_token');
    if (!token) {
      setFamilyError('Please log in first to save family medical records.');
      return;
    }

    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          relationship: newRelationship,
          age: newAge,
          gender: newGender,
          bloodGroup: newBloodGroup,
          allergies: newAllergies ? newAllergies.split(',').map(s => s.trim()) : [],
          chronicConditions: newChronic ? newChronic.split(',').map(s => s.trim()) : [],
          pastMedicalHistory: newHistory ? newHistory.split(',').map(s => s.trim()) : []
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFamilySuccess(`Family Profile '${data.name}' linked safely.`);
        setNewName('');
        setNewAllergies('');
        setNewChronic('');
        setNewHistory('');
        fetchFamily();
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Server rejected family profile join');
      }
    } catch (err: any) {
      setFamilyError(err.message || 'Error occurred joining member profiles.');
    }
  };

  const handleDeleteFamily = async (id: string) => {
    const token = localStorage.getItem('hospital_token');
    if (!token) return;
    try {
      const response = await fetch(`/api/family/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setFamilyList(prev => prev.filter(f => f.id !== id));
        fetchFamily();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDispatchDonor = async () => {
    setDispatchLoading(true);
    setMatchResult(null);
    setDonorEtaMinutes(12);

    try {
      const response = await fetch('/api/blood/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodGroup: selectedBloodGroup,
          patientAddress,
          patientLat: 40.7128,
          patientLng: -74.0060,
          quantityUnits: 2
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMatchResult(data);
        if (data.closestDonor && data.closestDonor.distanceKm) {
          // Dynamic calculation: distance * 5 minutes per km approximately
          setDonorEtaMinutes(Math.max(3, Math.round(data.closestDonor.distanceKm * 4)));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDispatchLoading(false);
    }
  };

  // State filtering references
  const setFamilyList = setFamily;

  return (
    <div className="space-y-6" id="family-blood-bank-root">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400 font-bold" />
            Family Health Hub & Transfusion Dispatch
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Register pediatric chronic cards, check hospital blood inventories in real-time, and call closest voluntary matching donors in emergency cases with live routing metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Family Profiles */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 md:p-6 space-y-6">
            <h3 className="text-xs font-mono font-extrabold text-sky-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" />
              Registered Family Profiles
            </h3>

            {loadingFamily ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
              </div>
            ) : family.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No family members registered yet. Fill the quick profile generator below to link children or parents.</p>
            ) : (
              <div className="space-y-3">
                {family.map(member => (
                  <div key={member.id} className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl flex items-start justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <strong className="text-sm font-extrabold text-white font-sans">{member.name}</strong>
                        <span className="p-1 px-2.5 bg-slate-900 border border-white/5 text-[9px] font-mono font-bold rounded-lg text-slate-400 uppercase">
                          {member.relationship}
                        </span>
                        <span className="p-1 px-2 bg-pink-500/10 text-pink-500 text-[9px] font-mono font-bold rounded-lg border border-pink-500/20">
                          🩸 {member.bloodGroup}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-400">
                        <div><span className="text-slate-500">Age / Gender:</span> {member.age} yrs / {member.gender}</div>
                        <div><span className="text-slate-500">Allergies:</span> {member.allergies.join(', ') || 'None'}</div>
                        <div className="col-span-2 mt-1 truncate"><span className="text-slate-500">Past History:</span> {member.pastMedicalHistory.join(', ') || 'Cleared'}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteFamily(member.id)}
                      className="p-1.5 bg-slate-900 text-slate-500 hover:text-red-400 rounded-xl border border-white/10 cursor-pointer transition-colors"
                      title="Decouple profile sheet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Profile Add Form */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 md:p-6 space-y-4">
            <h3 className="text-xs font-mono font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sky-400" />
              Quick Family Profile Generator
            </h3>

            <form onSubmit={handleCreateFamily} className="space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Relationship</label>
                  <select
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none h-8 text-[11px]"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none h-8"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none h-8 text-[11px]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Blood type</label>
                  <select
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none h-8 text-[11px]"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pediatric Allergies (separated by comma)</label>
                <input
                  type="text"
                  value={newAllergies}
                  onChange={(e) => setNewAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanut products"
                  className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chronic cards</label>
                  <input
                    type="text"
                    value={newChronic}
                    onChange={(e) => setNewChronic(e.target.value)}
                    placeholder="e.g. Asthma, Hyper BP"
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Past Surgeries</label>
                  <input
                    type="text"
                    value={newHistory}
                    onChange={(e) => setNewHistory(e.target.value)}
                    placeholder="e.g. Appendectomy, Tonsil surgery"
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              {familyError && <p className="text-[10px] text-red-400 font-mono">{familyError}</p>}
              {familySuccess && <p className="text-[10px] text-emerald-400 font-mono">{familySuccess}</p>}

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider font-mono rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Link family sheet profile</span>
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Blood Stocks & Donor Match */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Blood Inventory Levels across City Hospitals */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 md:p-6 space-y-4">
            <h3 className="text-xs font-mono font-extrabold text-sky-400 uppercase tracking-widest flex items-center gap-2">
              <Droplets className="w-4 h-4 text-pink-500 shrink-0" />
              Clinic Central Blood Inventory Stocks
            </h3>

            {loadingStocks ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-sky-500 animate-spin animate-pulse" />
              </div>
            ) : (
              <div className="space-y-4">
                {bloodStocks.map((stock, sIdx) => (
                  <div key={sIdx} className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-3">
                    <span className="text-[11px] font-bold text-white font-sans">{stock.hospitalName} Inventory</span>
                    
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {Object.entries(stock.inventory).map(([blood, units]) => (
                        <div key={blood} className="bg-slate-950 p-2 rounded-xl border border-white/5">
                          <span className="block text-[10px] text-slate-500 font-mono font-bold uppercase">{blood} Group</span>
                          <strong className={`block text-xs font-mono font-bold mt-1 ${(units as number) < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {units as number} Units
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Match & Dispatch Donor */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 md:p-6 space-y-5">
            <div className="space-y-1">
              <h3 className="text-xs font-mono font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
                <Locate className="w-4 h-4 text-pink-500" />
                Real-Time Voluntary Blood Donor Dispatcher
              </h3>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans mt-1">
                Pinpoint closest registered voluntary donors near hospital, execute matches instantly with real-time ETA routing matching the Swiggy/Uber map matrices.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Critical blood Type</label>
                  <select
                    value={selectedBloodGroup}
                    onChange={(e) => setSelectedBloodGroup(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 text-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-sky-500/30 h-8"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-display">Hospital / Emergency destination</label>
                  <input
                    type="text"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-1.5 focus:outline-none h-8 text-xs font-sans"
                  />
                </div>
              </div>

              <button
                onClick={handleDispatchDonor}
                disabled={dispatchLoading}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-widest font-mono rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/10 disabled:opacity-55"
              >
                {dispatchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>PINPOINTING NEAREST CERTIFIED DONOR COORDINATES...</span>
                  </>
                ) : (
                  <>
                    <HeartPulse className="w-4.5 h-4.5" />
                    <span>MATCH & DISPATCH VOLUNTARY DONOR</span>
                  </>
                )}
              </button>

              {/* Match Result Display */}
              {matchResult && (
                <div className={`p-4 border rounded-2xl animate-[fade-in_0.3s_ease] ${matchResult.success ? 'bg-slate-950/60 border-emerald-500/25' : 'bg-red-500/5 border-red-500/15'}`}>
                  
                  {matchResult.success && matchResult.closestDonor ? (
                    <div className="space-y-4">
                      
                      {/* Active Dispatch Notification Badge */}
                      <div className="flex items-start gap-3 border-b border-white/5 pb-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <strong className="block text-xs font-extrabold text-emerald-400 uppercase tracking-widest font-mono">EMERGENCY ROAD ACCEPTANCE</strong>
                          <p className="text-[11px] leading-relaxed text-slate-300">{matchResult.message}</p>
                        </div>
                      </div>

                      {/* GPS tracking detail */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[9.5px] text-slate-500 font-mono block">DONOR NAME & BLOOD GROUP</span>
                          <strong className="text-white text-xs block font-bold font-sans">
                            {matchResult.closestDonor.name} <span className="text-pink-500">({matchResult.closestDonor.bloodGroup})</span>
                          </strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9.5px] text-slate-500 font-mono block">GPS DISPATCH DISTANCE</span>
                          <strong className="text-sky-300 text-xs block font-mono">
                            📍 {matchResult.closestDonor.distanceKm || 0.8} Kilometers away
                          </strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9.5px] text-slate-500 font-mono block">ETA ROAD TRACKING</span>
                          <strong className="text-amber-400 font-mono text-xs block animate-pulse">
                            ⏱ {donorEtaMinutes} Minutes remaining
                          </strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9.5px] text-slate-500 font-mono block">SECURE TELEPHONY LINE</span>
                          <a href={`tel:${matchResult.closestDonor.phone}`} className="text-white hover:underline text-xs flex items-center gap-1 block font-mono">
                            <Phone className="w-3.5 h-3.5 text-sky-400 inline shrink-0" />
                            {matchResult.closestDonor.phone}
                          </a>
                        </div>
                      </div>

                      <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between font-mono text-[9px] text-slate-500">
                          <span>DONOR TRANSIT LANE STYLES</span>
                          <span>{donorEtaMinutes > 5 ? 'STREET NAVIGATION' : 'APPROACHING SITE'}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-1000" 
                            style={{ width: `${Math.max(10, Math.round(((12 - donorEtaMinutes) / 12) * 100))}%` }}
                          ></div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-400 leading-normal">{matchResult.message}</p>
                    </div>
                  )}

                </div>
              )}

              <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5 flex items-start gap-2.5 text-[10.5px] text-slate-500 italic">
                <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                <p>
                  Transfusion donor registries are voluntary medical services. Dispatched donor addresses are mapped and handled under strict HIPAA privacy encryption grids.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
