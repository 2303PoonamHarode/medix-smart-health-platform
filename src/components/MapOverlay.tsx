/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Hospital } from '../types';
import { MapPin, Navigation, Compass, Plus, Ambulance } from 'lucide-react';

interface MapOverlayProps {
  hospitals: Hospital[];
  selectedHospitalId?: string;
  onSelectHospital?: (id: string) => void;
  userLat?: number;
  userLng?: number;
  sosActive?: boolean;
}

export default function MapOverlay({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  userLat = 40.712,
  userLng = -74.008,
  sosActive = false
}: MapOverlayProps) {
  // Center of our SVG coordinates representation (covering New York City latitude/longitude boundaries)
  const mapCenterLat = 40.718;
  const mapCenterLng = -73.97;
  const scaleX = 4000; // scaling longitudes to pixels
  const scaleY = -5000; // scaling latitudes to pixels (negative to flip screen Y coordinates)

  function toXY(lat: number, lng: number) {
    const x = 250 + (lng - mapCenterLng) * scaleX;
    const y = 250 + (lat - mapCenterLat) * scaleY;
    // clamping
    return {
      x: Math.max(10, Math.min(490, x)),
      y: Math.max(10, Math.min(490, y))
    };
  }

  const userXY = toXY(userLat, userLng);

  // Pick nearest hospital for emergency SOS
  const emergencyHospitals = hospitals.filter(h => h.emergencyServicesAvailable);
  const targetSosHospital = emergencyHospitals[0]; // fallback
  const sosHospXY = targetSosHospital ? toXY(targetSosHospital.lat, targetSosHospital.lng) : { x: 320, y: 180 };

  return (
    <div className="relative w-full h-[400px] md:h-[450px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* Telemetry Header */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/95 border border-slate-800 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-slate-300 font-mono backdrop-blur-sm shadow-md">
        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
        <span>GPS METROPOLITAN ACTIVE AREA SCAN</span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex gap-2 font-mono">
        <div className="bg-slate-900/95 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-emerald-400 backdrop-blur">
          Lat: {userLat.toFixed(4)} Lng: {userLng.toFixed(4)}
        </div>
      </div>

      {/* SVG Interactive Map Grid */}
      <div className="flex-1 w-full bg-slate-950 relative overflow-hidden">
        {/* Futuristic Map Grids and Concentric Circles */}
        <svg className="w-full h-full" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="radar-wave" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.15" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Concentric rings centered around the patient */}
          <circle cx={userXY.x} cy={userXY.y} r="60" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3,6" strokeOpacity="0.3" />
          <circle cx={userXY.x} cy={userXY.y} r="140" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="5,10" strokeOpacity="0.15" />
          <circle cx={userXY.x} cy={userXY.y} r="220" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4,8" strokeOpacity="0.08" />

          {/* Abstract roads / grid networks for design realism */}
          <path d="M 50,0 L 50,500 M 150,0 L 150,500 M 350,0 L 350,500 M 450,0 L 450,500" stroke="#1e293b" strokeWidth="1" strokeOpacity="0.4" />
          <path d="M 0,100 L 500,100 M 0,220 L 500,220 M 0,380 L 500,380" stroke="#1e293b" strokeWidth="1" strokeOpacity="0.4" />
          
          {/* Diagonal avenues */}
          <path d="M 0,0 L 500,500 M 0,500 L 500,0" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,8" strokeOpacity="0.3" />

          {/* Active SOS route mapping with ambulance indicator */}
          {sosActive && targetSosHospital && (
            <>
              {/* Pulsating emergency radar circle around the closest hospital */}
              <circle cx={sosHospXY.x} cy={sosHospXY.y} r="35" fill="url(#radar-wave)" className="animate-pulse" />
              
              {/* Route line */}
              <path
                d={`M ${userXY.x},${userXY.y} L ${sosHospXY.x},${sosHospXY.y}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="8,6"
                className="animate-[dash_15s_linear_infinite]"
              />
              {/* Secondary glowing trace line */}
              <path
                d={`M ${userXY.x},${userXY.y} L ${sosHospXY.x},${sosHospXY.y}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeOpacity="0.6"
              />
            </>
          )}

          {/* Standard Hospital Pin connect overlay to selected clinic */}
          {!sosActive && selectedHospitalId && hospitals.find(h => h.id === selectedHospitalId) && (() => {
            const currentSelected = hospitals.find(h => h.id === selectedHospitalId)!;
            const targetXY = toXY(currentSelected.lat, currentSelected.lng);
            return (
              <>
                <line
                  x1={userXY.x}
                  y1={userXY.y}
                  x2={targetXY.x}
                  y2={targetXY.y}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  strokeOpacity="0.75"
                />
                <circle cx={targetXY.x} cy={targetXY.y} r="15" fill="none" stroke="#10b981" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }} />
              </>
            );
          })()}
        </svg>

        {/* User Patient PIN layer */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-25"
          style={{ left: userXY.x, top: userXY.y }}
        >
          <div className="relative group">
            <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-75 animate-ping -left-1 -top-1"></span>
            <div className="bg-emerald-500 text-white rounded-full p-1.5 shadow-lg border-2 border-slate-900 flex items-center justify-center relative">
              <Navigation className="w-3.5 h-3.5 rotate-45 text-slate-950 fill-white" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-slate-900 text-[10px] text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
              YOU (My Position)
            </div>
          </div>
        </div>

        {/* CSS Animation defined inline to enable the SOS path dash array moving forward like a real map! */}
        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -120;
            }
          }
        `}</style>

        {/* Hospital markers layer */}
        {hospitals.map(h => {
          const xy = toXY(h.lat, h.lng);
          const isSelected = h.id === selectedHospitalId;
          const isEmergency = h.emergencyServicesAvailable;

          return (
            <div
              key={h.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform duration-300 hover:scale-125"
              style={{ left: xy.x, top: xy.y }}
              onClick={() => onSelectHospital?.(h.id)}
            >
              <div className="relative group">
                <div
                  className={`rounded-xl p-1.5 shadow-xl border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-500 border-white text-white scale-110 z-30'
                      : isEmergency
                      ? 'bg-red-950/90 border-red-500/50 text-red-400 hover:border-red-400'
                      : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-emerald-500'
                  }`}
                >
                  {isEmergency ? (
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Hover Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 shadow-lg pointer-events-none hidden group-hover:block whitespace-nowrap z-40 max-w-[200px]">
                  <p className="text-xs font-semibold truncate">{h.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-slate-800 text-amber-400 font-bold px-1 rounded">⭐ {h.ratingsAverage || 'N/A'}</span>
                    <span className="text-[9px] text-slate-400 font-mono">⏱️ {h.minWaitingTimeMinutes}m wait</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Legend Footer */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-lg inline-block flex items-center justify-center text-[8px] text-white font-bold">+</span>
            <span>Emergency Trauma Center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-800 border border-slate-600 rounded-full inline-block"></span>
            <span>Standard Clinic</span>
          </div>
        </div>

        {sosActive && targetSosHospital && (
          <div className="flex items-center gap-2 text-red-400 font-bold animate-pulse">
            <Ambulance className="w-4 h-4 ml-1" />
            <span>DISPATCHING NEAREST AMBULANCE TO YOUR GPS PIN</span>
          </div>
        )}
      </div>
    </div>
  );
}
