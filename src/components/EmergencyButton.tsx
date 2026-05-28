/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ShieldCheck, Plus, AlertTriangle, Phone, MapPin, Compass, ShieldOff, Loader2, Ambulance, Sparkles } from 'lucide-react';
import MapOverlay from './MapOverlay';
import { Hospital, EmergencyRequest } from '../types';

interface EmergencyButtonProps {
  hospitals: Hospital[];
  onSOSCreated?: (request: EmergencyRequest) => void;
  currentUser?: { name: string; phone: string; id: string } | null;
}

export default function EmergencyButton({
  hospitals,
  onSOSCreated,
  currentUser
}: EmergencyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sosRecord, setSosRecord] = useState<EmergencyRequest | null>(null);
  const [userAddress, setUserAddress] = useState('Broad St & Wall St, Downtown Metro');
  const [gpsError, setGpsError] = useState('');
  const [gpsCoords, setGpsCoords] = useState({ lat: 40.712, lng: -74.008 });

  const triggerSOS = async () => {
    setLoading(true);
    setGpsError('');

    // Fetch live navigator geolocation if authorized by metadata constraints
    let activeLat = gpsCoords.lat;
    let activeLng = gpsCoords.lng;

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        activeLat = position.coords.latitude;
        activeLng = position.coords.longitude;
        setGpsCoords({ lat: activeLat, lng: activeLng });
      } catch (e) {
        console.warn("Geolocation denied or timed out. Falling back to default coordinates.");
      }
    }

    try {
      const response = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: activeLat,
          lng: activeLng,
          address: userAddress,
          userName: currentUser?.name || 'SOS Emergency Patient',
          userPhone: currentUser?.phone || '+1 (555) 911-0026'
        })
      });

      const data = await response.json() as EmergencyRequest;
      if (!response.ok) throw new Error('Could not register direct SOS alert');

      setSosRecord(data);
      if (onSOSCreated) onSOSCreated(data);
    } catch (err: any) {
      setGpsError(err.message || 'SOS request registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSosRecord(null);
  };

  return (
    <>
      {/* Floating Red SOS Button with glowing wave animation */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={() => setIsOpen(true)}
          className="sos-pulse-button w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex flex-col items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 border-2 border-white cursor-pointer"
        >
          <AlertTriangle className="w-6 h-6 animate-bounce" />
          <span className="text-[10px] font-extrabold tracking-wider uppercase font-mono mt-0.5">SOS</span>
        </button>
      </div>

      {/* Primary Emergency Overlay Model Screen */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/95 z-55 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 text-white rounded-3xl overflow-hidden shadow-2xl p-6">
            
            {/* Header section with RED color theme */}
            <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-bold font-mono tracking-widest text-red-500 bg-red-950/64 px-2.5 py-1 rounded">
                  RED-ALERT TRAUMA HOTLINE
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold font-display text-white tracking-tight mt-2 flex items-center gap-2">
                  <Ambulance className="w-6 h-6 text-red-500 animate-pulse" />
                  Smart Emergency Assist Panel
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  One-tap medical dispatch system immediately scanning surrounding trauma sectors, transmitting GPS coordinates, and reserving active ambulance routes.
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/60 rounded-xl text-xs font-bold transition-all font-mono cursor-pointer"
              >
                CLOSE [esc]
              </button>
            </div>

            {gpsError && (
              <div className="mb-4 bg-red-950/50 border-l-4 border-red-500 p-3 text-xs text-red-400 font-medium rounded-r">
                {gpsError}
              </div>
            )}

            {!sosRecord ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Geolocation input on the left */}
                <div className="md:col-span-5 space-y-4">
                  <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-red-400 flex items-center gap-1.5 mb-2">
                      <Compass className="w-4 h-4 text-red-500" />
                      1-Tap Coordinate dispatch
                    </h3>
                    <p className="text-[11px] text-slate-350 leading-relaxed mb-4">
                      On clicking the dispatcher button, the platform checks your browser coordinates and notifies the closest registered verified trauma center.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pick-Up Address Landmark</label>
                        <input
                          type="text"
                          value={userAddress}
                          onChange={(e) => setUserAddress(e.target.value)}
                          placeholder="Room 403, Wall Street Block D"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:outline-none px-3 py-2 rounded-xl text-xs text-slate-100 placeholder-slate-600"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={triggerSOS}
                        disabled={loading}
                        className="w-full py-3.5 bg-red-600 hover:bg-red-700 font-extrabold font-mono text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-500/20 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            CALIBRATING GPS DISTANCE...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-white" />
                            CONFIRM AND REQUEST RESCUE
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick voice calls and ambulance options */}
                  <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl text-xs space-y-3">
                    <h4 className="font-bold text-slate-300 text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-red-500" />
                      Regional Trauma Voice Lines
                    </h4>
                    
                    <div className="space-y-2">
                      <a href="tel:911" className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/40 text-[11px] font-bold text-slate-205">
                        <span>Central Rescue Hotline</span>
                        <span className="text-red-500 font-mono">Dial 911</span>
                      </a>
                      <a href="tel:555" className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-205">
                        <span>Attendant Nurse Teleconsult</span>
                        <span className="text-emerald-500 font-mono">+1 (555) HELP</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Satellite interactive telemetry map on the right */}
                <div className="md:col-span-7">
                  <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-1.5 ml-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500 animate-ping" />
                    Surrounding Emergency Stations Scan
                  </h3>
                  
                  <MapOverlay
                    hospitals={hospitals}
                    userLat={gpsCoords.lat}
                    userLng={gpsCoords.lng}
                    sosActive={false}
                  />
                </div>
              </div>
            ) : (
              // DISPATCH REPORT DETAILS WRAPPER (AFTER SOS CONFIRMED)
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* Active alert telemetry bill receipt */}
                <div className="md:col-span-5 bg-slate-950 border border-red-950 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-ping inline-block"></span>
                      <span className="text-[10px] uppercase font-bold text-red-400 font-mono tracking-widest bg-red-950 border border-red-800 px-2 py-0.5 rounded">
                        DISPATCH RECORD ASSIGNED
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <p className="text-slate-400 text-[11px] uppercase tracking-wide">Rescue Station:</p>
                      <h4 className="text-lg font-extrabold text-white font-display leading-snug">{sosRecord.hospitalName}</h4>
                      <p className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pickup: {sosRecord.address}</span>
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-slate-850 pt-3">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-mono">Estimated Distance</span>
                        <strong className="text-white font-mono">{sosRecord.distanceKm || '2.40'} Km</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-mono">Dispatched Courier</span>
                        <strong className="text-emerald-400 font-mono">AMBULANCE UNIT #9</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px] border-t border-dashed border-slate-800 pt-2">
                        <span className="text-slate-400 font-mono">Siren Hot Dial</span>
                        <a href={`tel:${sosRecord.ambulanceContact}`} className="text-red-400 font-bold font-mono hover:underline hover:scale-105 transition-transform">
                          {sosRecord.ambulanceContact}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-950/20 border border-red-550/20 p-3 rounded-xl text-[11.5px] text-red-400 font-mono mt-4 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-spin" style={{ animationDuration: '6s' }} />
                    <div>
                      <p className="font-bold uppercase text-[10px]">Active Transceiver</p>
                      <p className="text-[10.5px] opacity-85 mt-0.5">Ambulance siren verified. ATTENDANT TEAM DISPATCHED. Make sure accessways are cleared.</p>
                    </div>
                  </div>
                </div>

                {/* Animated active telemetry map routing towards the user coordinate */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-red-400 font-mono mb-2 flex items-center gap-1.5 ml-1">
                      <Ambulance className="w-4 h-4 animate-bounce text-red-500" />
                      Siren Tracking Telemetry Vector Active
                    </h3>

                    <MapOverlay
                      hospitals={hospitals}
                      selectedHospitalId={sosRecord.hospitalId}
                      userLat={gpsCoords.lat}
                      userLng={gpsCoords.lng}
                      sosActive={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
