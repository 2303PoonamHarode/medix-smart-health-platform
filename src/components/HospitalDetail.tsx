/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Hospital, Doctor, MedicalService, Review } from '../types';
import { ShieldCheck, Plus, Clock, FileText, Star, ArrowLeft, Phone, MapPin, UserCheck, Stethoscope } from 'lucide-react';
import ReviewsList from './ReviewsList';
import BookingWizard from './BookingWizard';

interface HospitalDetailProps {
  hospitalId: string;
  onBack: () => void;
  currentUser?: { name: string; phone: string; id: string } | null;
  onBookingCreated: () => void;
}

export default function HospitalDetail({
  hospitalId,
  onBack,
  currentUser,
  onBookingCreated
}: HospitalDetailProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'doctors' | 'reviews'>('about');
  const [data, setData] = useState<{
    hospital: Hospital;
    doctors: Doctor[];
    services: MedicalService[];
    reviews: Review[];
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hospitals/${hospitalId}`);
      if (!response.ok) throw new Error('Could not pull clinic profile records');
      const resData = await response.json();
      setData(resData);
    } catch (e: any) {
      setError(e.message || 'Networking connection failure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></span>
        <p className="text-slate-500 font-mono text-xs">PULLING CLINIC PROFILE RECORDS...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-sm font-semibold">{error || 'Hospital records misplaced'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700">
          Return to directory
        </button>
      </div>
    );
  }

  const { hospital, doctors, services, reviews } = data;

  const handleReviewAdded = (newReview: Review) => {
    setData(prev => {
      if (!prev) return null;
      const updatedReviews = [newReview, ...prev.reviews];
      // Recalculate rating locally to represent instant sync!
      const avg = parseFloat((updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1));
      return {
        ...prev,
        reviews: updatedReviews,
        hospital: {
          ...prev.hospital,
          ratingsAverage: avg,
          totalReviews: updatedReviews.length
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Return Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-bold transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Listing Directory</span>
      </button>

      {/* Hero Hospital Billboard Cover */}
      <div className="glass rounded-3xl overflow-hidden shadow-md">
        <div className="h-[250px] md:h-[320px] bg-slate-900 relative">
          <img
            src={hospital.imageUrl}
            alt={hospital.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-80"
          />
          {/* Gradients to transition beautiful covers */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>

          {/* Floaters inside photo billboard */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap justify-between items-end gap-4 text-white">
            <div className="space-y-1.5 max-w-[480px]">
              {hospital.emergencyServicesAvailable && (
                <span className="bg-red-650 text-white font-mono uppercase text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider mr-1">
                  🔴 SOS Trauma Emergency Active
                </span>
              )}
              {hospital.verificationStatus === 'verified' && (
                <span className="bg-emerald-600 text-white font-mono uppercase text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider">
                  ✓ VERIFIED CLINICAL NODE
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-extrabold font-display leading-tight tracking-tight drop-shadow-md">
                {hospital.name}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 flex items-center gap-1 mt-1 font-mono drop-shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{hospital.address}</span>
              </p>
            </div>

            <div className="bg-slate-950/60 backdrop-blur border border-white/10 p-2.5 px-4 rounded-2xl flex items-center gap-3 self-end shadow-lg">
              <div className="text-center">
                <div className="text-amber-300 font-mono text-xl font-extrabold flex items-center gap-1 justify-center">
                  <span>★</span>
                  <span>{hospital.ratingsAverage || 'N/A'}</span>
                </div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wide font-mono mt-0.5">Rating</div>
              </div>
              <div className="border-l border-white/10 h-8"></div>
              <div className="text-center">
                <div className="text-sky-300 font-mono text-xl font-extrabold">⏱︎ {hospital.minWaitingTimeMinutes}m</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wide font-mono mt-0.5">Wait Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="p-4 bg-slate-950/40 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-400 font-mono px-6">
          <div className="flex gap-4 flex-wrap">
            <span className="flex items-center gap-1"><Phone className="w-4 h-4 text-sky-450" /> {hospital.phone}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-sky-450" /> {hospital.openingTime === '00:00' ? 'Open 24/7' : `Hours: ${hospital.openingTime} - ${hospital.closingTime}`}</span>
          </div>

          <button
            onClick={() => setIsBookingOpen(true)}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Book Appointment
          </button>
        </div>
      </div>

      {/* Tabs Menu Zomato Inspiration Style */}
      <div className="border-b border-white/10 flex gap-6 overflow-x-auto select-none py-1">
        {[
          { id: 'about', label: 'About Hospital' },
          { id: 'services', label: 'Medical Treatments' },
          { id: 'doctors', label: 'Professional Staff' },
          { id: 'reviews', label: `Reviews (${reviews.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'border-sky-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="glass rounded-3xl p-6 shadow-xl min-h-[250px]">
        {/* ABOUT CORE */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white font-display uppercase tracking-wider mb-2.5">Comprehensive Bio Overview</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                Founded to serve local patient populations, {hospital.name} is a high-performance clinical facility specialized in patient-first treatments. Powered by state-of-the-art telemetry queues, it offers minimal diagnostic delays and emergency SOS ambulance dispatches automatically calibrated in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-sky-400" />
                  Recognized Specialties
                </h4>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {hospital.specializations.map((spec, i) => (
                    <span key={i} className="bg-slate-900 text-slate-300 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-medium font-mono">
                      + {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  Credentials & Accreditations
                </h4>
                {hospital.certificates.map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{cert}</span>
                  </div>
                ))}
                {hospital.documents && hospital.documents[0] && (
                  <div className="mt-3 text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Licence Record Reference: {hospital.documents[0].split('/').slice(-1)[0]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SERVICES / TREATMENTS LIST */}
        {activeTab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">Clinical Treatment Offerings</h3>
              <span className="text-[10px] text-sky-400 font-bold uppercase bg-sky-950/40 border border-sky-500/10 px-2 py-0.5 rounded">Menu Prices Guaranteed</span>
            </div>

            {services.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No services custom configured for this hospital branch yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(srv => (
                  <div key={srv.id} className="p-4 bg-slate-950/45 border border-white/5 rounded-2xl hover:border-sky-500/35 transition-colors flex items-start justify-between group">
                    <div className="mr-3">
                      <h4 className="font-bold text-white group-hover:text-sky-400 transition-colors">{srv.name}</h4>
                      <p className="text-xs text-slate-405 mt-0.5">Care provider: {srv.doctorName || 'Senior Registrar'}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-mono">
                        <span>⏱ {srv.durationMinutes} minutes</span>
                        <span>•</span>
                        <span className="text-slate-400 font-medium">Standard slot checkout available</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sky-400 font-extrabold text-base font-mono">${srv.price}</span>
                      <button
                        onClick={() => setIsBookingOpen(true)}
                        className="mt-2 block px-2.5 py-1 border border-sky-500 text-[10px] uppercase font-bold text-sky-400 rounded-lg bg-slate-950 hover:bg-sky-950/70 transition-colors cursor-pointer"
                      >
                        Book slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DOCTORS STAFF */}
        {activeTab === 'doctors' && (
          <div>
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider mb-4">Active Physicians Registry</h3>
            
            {doctors.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No doctors configured for registration under this branch.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {doctors.map(doc => {
                  const docOnline = doc.isOnline !== undefined ? doc.isOnline : true;
                  const availToday = doc.availableToday !== undefined ? doc.availableToday : true;
                  const queueCount = doc.patientsInQueueCount !== undefined ? doc.patientsInQueueCount : 2;

                  return (
                    <div key={doc.id} className="p-5 glass rounded-2xl flex flex-col justify-between border border-white/5 bg-slate-950/40 relative hover:border-sky-500/30 transition-all max-w-full">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 border ${
                            docOnline
                              ? 'bg-emerald-950/60 border-emerald-500/20 text-emerald-450'
                              : 'bg-slate-900 border-white/5 text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${docOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                            {docOnline ? 'Online Now' : 'Offline'}
                          </span>
                          
                          {doc.emergencyConsultationAvailable && (
                            <span className="bg-rose-950/70 border border-rose-500/20 text-rose-400 text-[8.5px] font-mono tracking-tight font-extrabold px-1.5 py-0.5 rounded shadow">
                              🚨 SOS ON-CALL
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-white text-base font-display mt-2">{doc.name}</h4>
                        <p className="text-xs text-slate-305 mt-0.5 font-medium">{doc.specialization}</p>
                        <p className="text-[10px] text-slate-450 mt-1 font-mono">{doc.qualification}</p>

                        {/* Practical availability details lists */}
                        <div className="space-y-1.5 mt-3 pt-2.5 border-t border-white/5 text-[11px] font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Available Today:</span>
                            <span className={availToday ? 'text-sky-450 font-bold' : 'text-slate-505'}>
                              {availToday ? 'Yes ✅' : 'No ❌'}
                            </span>
                          </div>
                          {doc.consultationTiming && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Hours:</span>
                              <span className="text-slate-200">{doc.consultationTiming}</span>
                            </div>
                          )}
                          {doc.nextAvailableTime && (
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold">Next Slot:</span>
                              <span className="text-sky-400 font-bold">{doc.nextAvailableTime}</span>
                            </div>
                          )}
                          <div className="flex justify-between bg-slate-900/40 p-1.5 rounded border border-white/5 mt-2">
                            <span className="text-slate-400">Current Queue:</span>
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <span>●</span>
                              <span>{queueCount} active</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Exp: {doc.experienceYears} Years</span>
                        <strong className="text-white font-bold text-sm">Fees: ${doc.consultationFees}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS SATISFACTION BOARD */}
        {activeTab === 'reviews' && (
          <ReviewsList
            hospitalId={hospital.id}
            reviews={reviews}
            doctors={doctors}
            onReviewAdded={handleReviewAdded}
          />
        )}
      </div>

      {/* Embedded Booking Checkout Wizard Overlay */}
      {isBookingOpen && (
        <BookingWizard
          hospital={hospital}
          doctors={doctors}
          services={services}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          currentUser={currentUser}
          onBookingSuccess={() => {
            setIsBookingOpen(false);
            onBookingCreated();
          }}
        />
      )}
    </div>
  );
}
