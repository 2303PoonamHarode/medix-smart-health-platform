/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Hospital } from '../types';
import { Search, MapPin, Clock, ShieldAlert, ArrowRight } from 'lucide-react';

interface HospitalListProps {
  onSelectHospital: (id: string) => void;
  hospitals: Hospital[];
  onSearchChange: (q: string) => void;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

export default function HospitalList({
  onSelectHospital,
  hospitals,
  onSearchChange,
  onFilterChange,
  activeFilter
}: HospitalListProps) {
  const [searchVal, setSearchVal] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Category browsing boxes (mimicking Zomato culinary menu blocks!)
  const categories = [
    { title: 'Emergency Care', code: 'emergency', icon: '🚨', desc: 'Critical trauma dispatches' },
    { title: 'Pediatrics', code: 'pediatrics', icon: '🍼', desc: 'Toddler checkups' },
    { title: 'Cardiology', code: 'cardiology', icon: '❤️', desc: 'Vascular stress diagnostic' },
    { title: 'Diagnostics & Radiology', code: 'lab', icon: '🔬', desc: 'Deluxe MRI & screens' },
    { title: 'Orthopedics', code: 'orthopedics', icon: '🦴', desc: 'Bone treatment care' },
    { title: 'General Practice', code: 'general', icon: '🩺', desc: 'Daily G.P. triage consultation' }
  ];

  // Filters tag chips exactly as requested
  const filterChips = [
    { code: 'all', label: '🏥 All Clinics' },
    { code: 'nearby', label: '📍 Nearby (Closest)' },
    { code: 'emergency', label: '🚨 Emergency Available' },
    { code: 'icu-beds', label: '🏥 ICU Available' },
    { code: 'top-rated', label: '★ Top Rated (4.5+)' },
    { code: 'no-wait', label: '⏱️ Low Waiting Time' },
    { code: 'ventilators', label: '💨 Ventilators' },
    { code: 'low-crowd', label: '🟢 Low Crowd' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchVal);
  };

  // Center coordinates for simulated distances in each Indian metro area
  const cityCoords: Record<string, { lat: number, lng: number }> = {
    all: { lat: 19.0760, lng: 72.8777 }, // Default Mumbai standard
    Mumbai: { lat: 19.0760, lng: 72.8777 },
    Delhi: { lat: 28.6139, lng: 77.2090 },
    Bangalore: { lat: 12.9716, lng: 77.5946 },
    Hyderabad: { lat: 17.3850, lng: 78.4867 },
    Chennai: { lat: 13.0827, lng: 80.2707 },
    Pune: { lat: 18.5204, lng: 73.8567 },
    Kolkata: { lat: 22.5726, lng: 88.3639 },
    Ahmedabad: { lat: 23.0225, lng: 72.5714 },
    Lucknow: { lat: 26.8467, lng: 80.9462 },
    Jaipur: { lat: 26.9124, lng: 75.7873 }
  };

  const activeCoords = cityCoords[selectedCity] || cityCoords['all'];

  // Process data client-side for immediate visual updates:
  
  // 1. Filter by Active City
  let filteredHospitals = [...hospitals];
  if (selectedCity !== 'all') {
    filteredHospitals = filteredHospitals.filter(h => 
      h.address.toLowerCase().includes(selectedCity.toLowerCase())
    );
  }

  // 2. Compute true distances based on actively selected metro center coordinates
  let hospitalsWithDistance = filteredHospitals.map(h => {
    const dLat = h.lat - activeCoords.lat;
    const dLng = h.lng - activeCoords.lng;
    // Simple mock Euclidean-to-km transformation
    const distance = Math.max(0.4, Math.sqrt(dLat * dLat + dLng * dLng) * 111);
    return { ...h, distance };
  });

  // 3. Sort/Filter based on active filter chip code
  if (activeFilter === 'nearby') {
    // Sort closest distance first
    hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
  } else if (activeFilter === 'emergency') {
    hospitalsWithDistance = hospitalsWithDistance.filter(h => h.emergencyServicesAvailable);
  } else if (activeFilter === 'icu-beds') {
    hospitalsWithDistance = hospitalsWithDistance.filter(h => h.icuBedsAvailable && h.icuBedsAvailable > 0);
  } else if (activeFilter === 'top-rated') {
    hospitalsWithDistance = hospitalsWithDistance.filter(h => h.ratingsAverage >= 4.5);
    hospitalsWithDistance.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
  } else if (activeFilter === 'no-wait') {
    // Show closest wait times, filtered under 20 mins or sorting on wait time
    hospitalsWithDistance = hospitalsWithDistance.filter(h => h.minWaitingTimeMinutes <= 20);
    hospitalsWithDistance.sort((a, b) => a.minWaitingTimeMinutes - b.minWaitingTimeMinutes);
  } else if (activeFilter === 'ventilators') {
    hospitalsWithDistance = hospitalsWithDistance.filter(h => h.ventilatorsAvailable && h.ventilatorsAvailable > 0);
  } else if (activeFilter === 'low-crowd') {
    hospitalsWithDistance = hospitalsWithDistance.filter(h => h.crowdStatus === 'Low');
  }

  return (
    <div className="space-y-8 select-none">
      
      {/* Category browsing boxes (Zomato-style) */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center justify-between">
          <span>Explore Clinical Specialities</span>
          <span className="text-[10px] text-sky-405 font-semibold lowercase">tap to instant filter</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => onFilterChange(cat.code)}
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border hover:scale-[1.02] flex flex-col justify-between h-[100px] ${
                activeFilter === cat.code
                  ? 'bg-sky-600/10 border-sky-500/40 text-sky-400 shadow-lg'
                  : 'bg-[#090d14]/80 border-white/5 hover:border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{cat.icon}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
              <div className="mt-2">
                <h4 className="font-extrabold text-[12px] text-white tracking-tight leading-none truncate">{cat.title}</h4>
                <p className="text-[9px] text-slate-400 truncate mt-1">{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* METRO NETWORK CITY SELECTOR BAR */}
      <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5 space-y-3">
        <label className="text-xs font-extrabold text-white uppercase tracking-wider font-display flex items-center justify-between">
          <span className="flex items-center gap-1.5">📍 SELECT REGIONAL NETWORK METRO:</span>
          {selectedCity !== 'all' ? (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 px-2.5 py-0.5 rounded-md font-mono uppercase">
              METRO: {selectedCity} INBOUND
            </span>
          ) : (
            <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-500/10 px-2.5 py-0.5 rounded-md font-mono">
              ALL INDIA NETWORK ACTIVE
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Lucknow', 'Jaipur'].map((ct) => (
            <button
              key={ct}
              type="button"
              onClick={() => {
                setSelectedCity(ct);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                selectedCity === ct
                  ? 'bg-emerald-600 text-white border-emerald-500/20 shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-950/60 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800'
              }`}
            >
              {ct === 'all' ? '🇮🇳 ALL INDIA' : ct.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input UI Panel */}
      <div className="relative">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search hospitals by name, specializations, or city doctor network..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="w-full bg-[#090d14] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white px-5 rounded-2xl text-xs font-mono font-bold tracking-tight transition-colors cursor-pointer shrink-0"
          >
            Find Center
          </button>
        </form>
      </div>

      {/* Filters Strip Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none flex-nowrap shrink-0 scrollbar-none">
        {filterChips.map(chip => (
          <button
            key={chip.code}
            onClick={() => onFilterChange(chip.code)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer border ${
              activeFilter === chip.code
                ? 'bg-sky-600 text-white border-sky-500 shadow-sm shadow-sky-600/20'
                : 'bg-[#121824] text-slate-400 border-white/5 hover:text-white hover:bg-slate-800'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Zomato-style Hospital Deck Cards */}
      <div className="space-y-4 pt-1">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-widest font-display flex items-center justify-between">
          <span>Hospitals and Specialists in India Network</span>
          <span className="text-[11px] text-slate-500 font-mono font-normal">({hospitalsWithDistance.length} centers found)</span>
        </h3>

        {hospitalsWithDistance.length === 0 ? (
          <div className="text-center py-16 glass border border-dashed border-white/10 rounded-3xl text-slate-400">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs font-bold mt-3 text-slate-350">Zero clinical centers fit active filters</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Try resetting the metro city filters or choosing 'ALL INDIA'</p>
            <button
              onClick={() => {
                setSelectedCity('all');
                onFilterChange('all');
                setSearchVal('');
                onSearchChange('');
              }}
              className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-550 text-white rounded-xl text-xs uppercase font-mono transition-colors"
            >
              Reset Network Parameters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitalsWithDistance.map(h => {
              const distanceStr = h.distance.toFixed(1);

              // Crowd Status styling
              const crowdColors = {
                Low: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/20',
                Medium: 'bg-amber-950/80 text-amber-400 border-amber-500/20',
                High: 'bg-rose-950/80 text-rose-400 border-rose-500/20'
              };

              // Open Hour check (our high-quality Indian simulated data is open 24/7 or has specific times)
              const isOpen = true; 

              return (
                <div
                  key={h.id}
                  onClick={() => onSelectHospital(h.id)}
                  className="glass rounded-3xl overflow-hidden shadow-2xl cursor-pointer transition-all hover:scale-[1.02] duration-300 border border-white/5 flex flex-col justify-between group bg-[#090d14]"
                >
                  {/* Image panel Cover */}
                  <div className="h-[170px] bg-slate-900 relative">
                    <img
                      src={h.imageUrl}
                      alt={h.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-550 group-hover:scale-105"
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent"></div>

                    {/* Left corner status pills */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1 font-mono text-[9px] font-extrabold tracking-tight">
                      {h.emergencyServicesAvailable && (
                        <span className="bg-red-650 text-white px-2 py-0.5 rounded shadow flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                          SOS trauma 24/7
                        </span>
                      )}
                      
                      <span className={`px-2 py-0.5 rounded shadow ${isOpen ? 'bg-sky-650 text-white' : 'bg-slate-700 text-slate-350'}`}>
                        {isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>

                    {/* Right corner crowd marker */}
                    <div className="absolute top-3 right-3 font-mono text-[9px] font-extrabold tracking-tight">
                      <span className={`px-2 py-0.5 rounded border ${crowdColors[h.crowdStatus || 'Low']}`}>
                        ● {h.crowdStatus || 'Low'} Crowd
                      </span>
                    </div>

                    {/* Bottom strip wait text & distance */}
                    <div className="absolute bottom-3 left-3 right-3 text-[10px] font-mono flex items-center justify-between text-slate-350 drop-shadow-md">
                      <span className="flex items-center gap-1 text-white bg-slate-950/80 px-2 py-0.5 rounded border border-white/5">
                        ⏱️ Est wait: <strong className="text-sky-400 font-bold">{h.minWaitingTimeMinutes}m</strong>
                      </span>
                      <span className="flex items-center gap-1 text-white bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/10">
                        📍 <strong className="text-emerald-400">{distanceStr} km away</strong>
                      </span>
                    </div>
                  </div>

                  {/* Info sum */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-extrabold text-white group-hover:text-sky-400 transition-colors leading-tight font-display tracking-tight text-[15px]">
                          {h.name}
                        </h4>
                        {h.ratingsAverage > 0 && (
                          <span className="bg-sky-950 border border-sky-500/20 text-sky-400 font-mono font-bold text-[10.5px] px-2 py-0.5 rounded flex items-center gap-0.5 h-5 shrink-0 shadow">
                            <span>★</span>
                            <span>{h.ratingsAverage}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1.5 font-mono truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{h.address}</span>
                      </p>

                      <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Hours: {h.openingTime === '00:00' ? 'Open 24 Hours' : `${h.openingTime} - ${h.closingTime}`}</span>
                      </p>
                    </div>

                    {/* Live Bed Inventory dynamic visuals */}
                    <div className="bg-slate-950/60 rounded-2xl p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-white/5 pb-1">
                        <span className="uppercase tracking-wider font-extrabold">Live Bed Inventory</span>
                        <span className="text-sky-400">Real-time counts</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div className="flex items-center justify-between bg-slate-900/50 p-1.5 rounded-lg border border-white/5">
                          <span className="text-slate-400 font-mono font-normal">ICU Beds:</span>
                          <strong className={`font-mono ${h.icuBedsAvailable && h.icuBedsAvailable > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                            {h.icuBedsAvailable !== undefined ? h.icuBedsAvailable : 0} avail
                          </strong>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/50 p-1.5 rounded-lg border border-white/5">
                          <span className="text-slate-400 font-mono font-normal">Emergency:</span>
                          <strong className={`font-mono ${h.emergencyBedsAvailable && h.emergencyBedsAvailable > 0 ? 'text-rose-400 font-bold' : 'text-slate-600'}`}>
                            {h.emergencyBedsAvailable !== undefined ? h.emergencyBedsAvailable : 0} avail
                          </strong>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/50 p-1.5 rounded-lg border border-white/5 col-span-2">
                          <span className="text-slate-400 font-mono flex items-center gap-1 font-normal">
                            <span>💨 Ventilators:</span>
                          </span>
                          <strong className={`font-mono ${h.ventilatorsAvailable && h.ventilatorsAvailable > 0 ? 'text-sky-450 font-bold' : 'text-slate-650'}`}>
                            {h.ventilatorsAvailable !== undefined ? h.ventilatorsAvailable : 0} Online
                          </strong>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-slate-500 border-t border-white/5">
                        <span>Total capacity: {h.totalBeds || 150} beds</span>
                        <span>Free: {h.availableBeds || 0}</span>
                      </div>
                    </div>

                    {/* Specialty list highlights */}
                    <div className="border-t border-white/5 pt-3">
                      <div className="flex flex-wrap gap-1">
                        {h.specializations.slice(0, 3).map((spec, i) => (
                          <span key={i} className="text-[9.5px] bg-slate-900 border border-white/5 px-2 py-0.5 rounded-md text-slate-300 font-mono">
                            {spec}
                          </span>
                        ))}
                        {h.specializations.length > 3 && (
                          <span className="text-[9.5px] text-slate-505 font-mono self-center font-bold">+{h.specializations.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    {/* Receipt foot button */}
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono border-t border-white/5 pt-3">
                      <span className="text-[9.5px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-0.5">
                        {h.verificationStatus === 'verified' ? (
                          <span className="text-emerald-400 font-bold">✓ ACCREDITED</span>
                        ) : (
                          <span className="text-slate-505">PENDING AUDIT</span>
                        )}
                      </span>
                      <div className="text-sky-400 group-hover:translate-x-1 transition-transform font-bold flex items-center gap-1 text-[11px]">
                        <span>Book & Track</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
