/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Booking, BookingStatus, QueueStatus } from '../types';
import { Activity, Clock, Users, CheckCircle, RefreshCw, Sparkles, ChevronRight, MessageSquare, PhoneCall } from 'lucide-react';

interface QueueTrackerPanelProps {
  booking: Booking;
  onRefreshStatus?: () => void;
  showSimulateButtons?: boolean;
}

export default function QueueTrackerPanel({
  booking,
  onRefreshStatus,
  showSimulateButtons = false
}: QueueTrackerPanelProps) {
  const [currentBooking, setCurrentBooking] = useState<Booking>(booking);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(true);

  useEffect(() => {
    setCurrentBooking(booking);
  }, [booking]);

  // Simulated live-connection socket progression ticks
  useEffect(() => {
    const timer = setInterval(() => {
      setSynced(false);
      setTimeout(() => setSynced(true), 400);
    }, 45000); // Pulse indicator every 45 secs for aesthetic visual interest
    
    return () => clearInterval(timer);
  }, []);

  const handleSimulateUpdate = async (nextStatus: QueueStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${currentBooking.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCurrentBooking(data.booking);
        if (onRefreshStatus) onRefreshStatus();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statusesList: { status: QueueStatus; label: string; desc: string }[] = [
    { status: 'Waiting', label: 'Ticket Issued', desc: 'Secure token checked into local regional medical register.' },
    { status: 'Doctor Assigned', label: 'Doctor Assigned', desc: 'Medical files transferred to attending primary specialist.' },
    { status: 'Consultation Started', label: 'Consultation Active', desc: 'Patient in cabin. Live diagnostics underway.' },
    { status: 'Completed', label: 'Treatment Completed', desc: 'Prescription filed and token cycle cleared.' }
  ];

  // Helper to determine index of active state
  const getStatusIndex = (st: QueueStatus) => {
    if (st === 'Waiting') return 0;
    if (st === 'Doctor Assigned') return 1;
    if (st === 'Consultation Started') return 2;
    if (st === 'Completed') return 3;
    return -1;
  };

  const activeIndex = getStatusIndex(currentBooking.queueStatus);

  return (
    <div className="bg-slate-905 border border-white/5 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background radial soft sky highlights */}
      <div className="absolute right-0 top-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Real-time Web Socket telemetry line */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full inline-block ${synced ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'}`}></span>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">
            {synced ? 'LIVE SOCKET SYNC : CHANNEL #103' : 'POLLING RECONNECT fallback...'}
          </span>
        </div>
        <button
          onClick={onRefreshStatus}
          className="p-1 px-[10px] bg-slate-900 hover:bg-slate-850 transition-colors rounded-lg border border-white/5 text-[10px] text-sky-400 font-mono flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
          FORCE PULL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Token summary widget */}
        <div className="md:col-span-5 bg-slate-950/90 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="text-center md:text-left">
            <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950/80 border border-sky-800/40 px-2.5 py-1 rounded">
              Active Medical Token
            </span>
            <div className="text-5xl font-extrabold font-mono text-sky-400 tracking-tight mt-4">
              {currentBooking.tokenNumber}
            </div>
            <p className="text-sm font-semibold text-sky-200 truncate opacity-90 mt-2">{currentBooking.hospitalName}</p>
            <p className="text-xs text-slate-400 mt-1">G.P. Appointed: <strong className="text-slate-350 font-medium">{currentBooking.doctorName}</strong></p>
          </div>

          {/* Core USP indicators */}
          <div className="grid grid-cols-3 gap-2.5 border-t border-white/5 pt-4 mt-4 select-none">
            <div className="bg-slate-900 border border-white/5 px-2 py-3 rounded-xl text-center">
              <Clock className="w-4 h-4 text-sky-400 mx-auto" />
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Est. Wait</p>
              <p className="text-xs font-bold font-mono text-sky-305 mt-0.5">
                {currentBooking.queueStatus === 'Completed' ? '0' : currentBooking.estimatedWaitingTimeMinutes}m
              </p>
            </div>
            <div className="bg-slate-900 border border-white/5 px-2 py-3 rounded-xl text-center">
              <Users className="w-4 h-4 text-sky-400 mx-auto" />
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Pos. Ahead</p>
              <p className="text-xs font-bold font-mono text-sky-305 mt-0.5">
                {currentBooking.queueStatus === 'Completed' ? '0' : Math.max(0, currentBooking.queuePosition - 1)}
              </p>
            </div>
            <div className="bg-slate-900 border border-white/5 px-2 py-3 rounded-xl text-center">
              <Activity className="w-4 h-4 text-sky-500 mx-auto" />
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Status</p>
              <p className="text-[10px] font-bold text-slate-200 truncate mt-0.5" title={currentBooking.queueStatus}>
                {currentBooking.queueStatus.split(' ')[0]}
              </p>
            </div>
          </div>
          
          <div className="bg-sky-950/30 border border-sky-900/30 p-2.5 rounded-xl text-[10px] text-sky-300 mt-3 flex items-center gap-2 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Present your token code at front-desk on arrival!</span>
          </div>
        </div>

        {/* Live Vertical Swiggy/Uber-inspired Progression timeline */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-4">
          <h4 className="text-xs uppercase font-extrabold text-slate-400 font-mono tracking-wider ml-1">Live Progression Sequence</h4>
          
          <div className="relative pl-6 space-y-5 border-l border-white/5 ml-3">
            {statusesList.map((stepItem, idx) => {
              const isPast = activeIndex > idx;
              const isActive = activeIndex === idx;
              const isUpcoming = activeIndex < idx;

              return (
                <div key={idx} className="relative group">
                  {/* Glowing vertical marker dots */}
                  <span className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border-2 transition-all ${
                    isPast
                      ? 'bg-sky-500 border-sky-400 shadow-md shadow-sky-500/20'
                      : isActive
                      ? 'bg-slate-950 border-sky-400 animate-pulse w-5 h-5 -left-[32px] ring-2 ring-sky-500/40'
                      : 'bg-slate-900 border-slate-700'
                  }`}>
                    {isPast && <CheckCircle className="w-full h-full text-slate-950 fill-sky-500 p-0" />}
                  </span>

                  <div className={`transition-all rounded-xl p-2.5 -my-1 ${isActive ? 'bg-slate-900 border border-white/5 shadow-lg' : ''}`}>
                    <h5 className={`font-bold text-xs ${
                      isPast ? 'text-slate-400 line-through' : isActive ? 'text-sky-300' : 'text-slate-500'
                    }`}>
                      {stepItem.label}
                    </h5>
                    <p className={`text-[10.5px] mt-0.5 leading-relaxed ${isActive ? 'text-slate-350' : 'text-slate-500'}`}>
                      {stepItem.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hospital/Admin simulations buttons if allowed */}
          {showSimulateButtons && (
            <div className="border-t border-white/5 pt-4 mt-2 flex flex-wrap gap-2 items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-450 font-mono bg-sky-950/60 px-2 py-0.5 rounded">
                SIMULATION TRIGGER (DEMO TESTBED)
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSimulateUpdate('Doctor Assigned')}
                  className="bg-slate-900 hover:bg-slate-850 text-[10px] font-bold text-sky-400 border border-white/5 px-2 py-1 rounded"
                >
                  Trigger Doctor Assigned
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSimulateUpdate('Consultation Started')}
                  className="bg-slate-900 hover:bg-slate-850 text-[10px] font-bold text-amber-400 border border-white/5 px-2 py-1 rounded"
                >
                  Start Consultation
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSimulateUpdate('Completed')}
                  className="bg-sky-600 hover:bg-sky-500 text-[10px] font-bold text-white px-2 py-1 rounded shadow"
                >
                  Discharge Patient
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
