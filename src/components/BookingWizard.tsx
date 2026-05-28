/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Hospital, Doctor, MedicalService, Booking } from '../types';
import { X, Calendar, Clock, ChevronRight, Check, Heart, Shield, DollarSign, Loader2 } from 'lucide-react';

interface BookingWizardProps {
  hospital: Hospital;
  doctors: Doctor[];
  services: MedicalService[];
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
  currentUser?: { name: string; phone: string; id: string } | null;
}

export default function BookingWizard({
  hospital,
  doctors,
  services,
  isOpen,
  onClose,
  onBookingSuccess,
  currentUser
}: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [bookingType, setBookingType] = useState<'appointment' | 'normal_bed' | 'icu_bed' | 'emergency_bed'>('appointment');
  const [selectedService, setSelectedService] = useState<MedicalService | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [patientName, setPatientName] = useState(currentUser?.name || '');
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '');
  
  // Advanced patient metrics for bed occupancy/prioritization
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientGender, setPatientGender] = useState<string>('Male');
  const [patientSeverity, setPatientSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  
  // Drag and drop clinic reports state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedReportName, setUploadedReportName] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      if (!patientName) setPatientName(currentUser.name);
      if (!patientPhone) setPatientPhone(currentUser.phone);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  // Generate next 4 calendar days (starting tomorrow / current demo date)
  const availableDates = [
    { label: 'Today (May 28)', value: '2026-05-28' },
    { label: 'Tomorrow (May 29)', value: '2026-05-29' },
    { label: 'Saturday (May 30)', value: '2026-05-30' },
    { label: 'Sunday (May 31)', value: '2026-05-31' }
  ];

  const timeSlots = [
    '09:00 AM - 09:30 AM',
    '10:15 AM - 10:45 AM',
    '11:30 AM - 12:00 PM',
    '02:00 PM - 02:30 PM',
    '03:45 PM - 04:15 PM',
    '05:30 PM - 06:00 PM',
    '07:15 PM - 07:45 PM'
  ];

  const handleServiceSelect = (service: MedicalService) => {
    setBookingType('appointment');
    setSelectedService(service);
    const doc = doctors.find(d => d.id === service.doctorId);
    if (doc) setSelectedDoctor(doc);
    setStep(2);
  };

  const handleBedSelect = (type: 'normal_bed' | 'icu_bed' | 'emergency_bed') => {
    setBookingType(type);
    setSelectedService(null);
    setSelectedDoctor(null);
    setStep(2);
  };

  const handleDateTimeConfirm = () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select both a date and a time slot');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleSubmitBooking = async () => {
    if (!patientName.trim() || !patientPhone.trim()) {
      setError('Please fill in patient name and emergency contact number');
      return;
    }

    if (bookingType !== 'appointment') {
      if (!patientAge.trim()) {
        setError('Please supply the patient\'s age for clinical triage prioritization');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('hospital_token') 
            ? `Bearer ${localStorage.getItem('hospital_token')}`
            : btoa('patient-1:patient@smarthospital.com:patient') // sandbox patient mode fallback
        },
        body: JSON.stringify({
          hospitalId: hospital.id,
          serviceId: selectedService?.id || undefined,
          doctorId: selectedDoctor?.id || undefined,
          bookingDate: selectedDate,
          timeSlot: selectedSlot,
          userName: patientName,
          userPhone: patientPhone,
          userId: currentUser?.id || 'patient-1',
          
          bookingType,
          patientSeverity,
          patientAge: patientAge ? parseInt(patientAge) : undefined,
          patientGender,
          uploadedReportUrl: uploadedReportName ? `uploads/simulated_${uploadedReportName}` : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place medical order');
      }

      onBookingSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Underlying booking system timeout');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop simulated actions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedReportName(e.dataTransfer.files[0].name);
    }
  };

  const selectSimulatedFile = () => {
    const filenames = ['MRI_Brain_Scan_Report.pdf', 'ECG_Stress_Test_Report.pdf', 'Hematology_Complete_Blood_Count.pdf', 'Chest_XRay_Radiology_Summary.pdf'];
    const randomName = filenames[Math.floor(Math.random() * filenames.length)];
    setUploadedReportName(randomName);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="glass-card rounded-3xl w-full max-w-lg shadow-2xl border border-white/10 bg-slate-950 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-900/60">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-sky-400 bg-sky-950/80 border border-sky-400/20 px-2 py-0.5 rounded">
              Secured Admission Gateway
            </span>
            <h3 className="text-lg font-bold text-white font-display mt-0.5">
              {bookingType === 'appointment' ? 'Book Outpatient Care' : 'Reserve Inpatient Bed'}
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-[320px]">{hospital.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Checkout Steps Indicator */}
        <div className="bg-slate-900/30 px-6 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-600'}`}>1</span>
            <span className={step === 1 ? 'text-white font-bold' : ''}>Category & Setup</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-600'}`}>2</span>
            <span className={step === 2 ? 'text-white font-bold' : ''}>Date & Time</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step >= 3 ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-600'}`}>3</span>
            <span className={step === 3 ? 'text-white font-bold' : ''}>Confirm Details</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-950/40 border-l-4 border-red-500 p-3 text-xs text-red-350 rounded-r">
              {error}
            </div>
          )}

          {/* STEP 1: SERVICE LISTINGS OR BED CLASS RESERVATIONS */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Category tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-2xl border border-white/5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setBookingType('appointment')}
                  className={`py-2 rounded-xl text-center font-bold transition-all cursor-pointer ${bookingType === 'appointment' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Outpatient Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType('normal_bed')}
                  className={`py-2 rounded-xl text-center font-bold transition-all cursor-pointer ${bookingType !== 'appointment' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Bed Reservation
                </button>
              </div>

              {bookingType === 'appointment' ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-350 uppercase tracking-widest font-mono">Available Healthcare Services</h4>
                  {services.length === 0 ? (
                    <div className="text-center py-8 text-slate-455">
                      <p className="text-xs">No specific outpatient services loaded for this clinic.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Please connect with emergency services directly.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {services.map(srv => {
                        const doc = doctors.find(d => d.id === srv.doctorId);
                        return (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => handleServiceSelect(srv)}
                            className="w-full text-left p-4 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-sky-500/40 hover:bg-sky-950/40 transition-all flex items-start justify-between group cursor-pointer"
                          >
                            <div className="flex-1 mr-3">
                              <h5 className="font-extrabold text-white group-hover:text-sky-400 transition-colors text-sm">{srv.name}</h5>
                              <span className="text-xs text-slate-400 font-medium inline-block mt-0.5">Assigned: {doc?.name || srv.doctorName || 'Senior Registrar'}</span>
                              <div className="flex items-center gap-2 mt-2 text-[10.5px] text-slate-500 font-mono">
                                <span>⏱️ {srv.durationMinutes} mins</span>
                                <span>•</span>
                                <span className="bg-slate-900 border border-white/5 group-hover:bg-sky-950 text-slate-400 group-hover:text-sky-305 px-1.5 py-0.2 rounded font-sans">Instant Token</span>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end shrink-0">
                              <div className="text-sky-400 font-extrabold text-base flex items-center font-mono">
                                <span className="text-xs mr-0.5">$</span>{srv.price}
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-1 font-mono">Select</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-350 uppercase tracking-widest font-mono">Secured Ward Admission Options</h4>
                  <div className="grid gap-3">
                    
                    {/* General Ward Bed */}
                    <button
                      type="button"
                      onClick={() => handleBedSelect('normal_bed')}
                      disabled={hospital.availableBeds === 0}
                      className="w-full text-left p-4 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-sky-500/45 hover:bg-sky-950/40 transition-all flex items-start justify-between group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <div className="flex-1 mr-3">
                        <span className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded text-[9px] font-mono border border-white/5 uppercase">General Ward Class</span>
                        <h5 className="font-extrabold text-white group-hover:text-sky-400 transition-colors text-sm mt-1.5">Standard Ward Reco Bed</h5>
                        <p className="text-xs text-slate-400 mt-1 leading-snug">Semi-private shared ward with dedicated nursing allocation.</p>
                        <div className="text-[10.5px] font-mono text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
                          <span>●</span>
                          <span>{hospital.availableBeds || 0} beds free today</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sky-404 font-extrabold text-base font-mono">$100<span className="text-xs font-normal">/day</span></span>
                        <div className="text-[10px] text-slate-505 font-mono mt-1 font-bold bg-sky-950 border border-sky-500/15 p-1 rounded">SELECT Bed</div>
                      </div>
                    </button>

                    {/* ICU Bed */}
                    <button
                      type="button"
                      onClick={() => handleBedSelect('icu_bed')}
                      disabled={(hospital.icuBedsAvailable || 0) === 0}
                      className="w-full text-left p-4 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-sky-505/45 hover:bg-sky-950/40 transition-all flex items-start justify-between group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <div className="flex-1 mr-3">
                        <span className="bg-amber-955/20 border border-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[9px] font-mono uppercase">Critical ICU Class</span>
                        <h5 className="font-extrabold text-white group-hover:text-sky-400 transition-colors text-sm mt-1.5">Intensive Care Unit (ICU)</h5>
                        <p className="text-xs text-slate-400 mt-1 leading-snug">Continuous biometric monitoring, ventilator support ready.</p>
                        <div className="text-[10.5px] font-mono text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
                          <span>●</span>
                          <span>{hospital.icuBedsAvailable || 0} critical beds free</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sky-404 font-extrabold text-base font-mono">$500<span className="text-xs font-normal">/day</span></span>
                        <div className="text-[10px] text-slate-505 font-mono mt-1 font-bold bg-sky-950 border border-sky-500/15 p-1 rounded">SELECT Bed</div>
                      </div>
                    </button>

                    {/* Emergency Trauma Bed */}
                    <button
                      type="button"
                      onClick={() => handleBedSelect('emergency_bed')}
                      disabled={(hospital.emergencyBedsAvailable || 0) === 0}
                      className="w-full text-left p-4 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-red-500/40 hover:bg-red-950/10 transition-all flex items-start justify-between group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <div className="flex-1 mr-3">
                        <span className="bg-rose-955/30 border border-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold">Priority Triage SOS</span>
                        <h5 className="font-extrabold text-white group-hover:text-red-400 transition-colors text-sm mt-1.5">Emergency Trauma Bed</h5>
                        <p className="text-xs text-slate-400 mt-1 leading-snug">Rapid assessment bed with immediate on-call surgical access.</p>
                        <div className="text-[10.5px] font-mono text-red-400 font-bold mt-2 flex items-center gap-1.5 animate-pulse">
                          <span>●</span>
                          <span>{hospital.emergencyBedsAvailable || 0} trauma slots free</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sky-404 font-extrabold text-base font-mono">$300<span className="text-xs font-normal">/day</span></span>
                        <div className="text-[10px] text-slate-505 font-mono mt-1 font-bold bg-sky-950 border border-sky-500/15 p-1 rounded">SELECT Bed</div>
                      </div>
                    </button>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DATE & TIME SELECTOR */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-mono text-[9px]">Admission Class:</p>
                  <p className="font-extrabold text-white text-sm mt-0.5">
                    {bookingType === 'appointment' ? `Outpatient: ${selectedService?.name}` : `${bookingType.replace('_', ' ').toUpperCase()} Bed holding`}
                  </p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-sky-400 font-bold hover:underline cursor-pointer">
                  Change
                </button>
              </div>

              {/* Date selection */}
              <div>
                <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-2 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-sky-405" />
                  Select Admission Start Date
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {availableDates.map(date => (
                    <button
                      key={date.value}
                      type="button"
                      onClick={() => setSelectedDate(date.value)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedDate === date.value
                          ? 'border-sky-505 bg-sky-955/60 text-sky-400 font-bold shadow-sm'
                          : 'border-white/10 bg-slate-900 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <p className="text-xs">{date.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots selection */}
              <div>
                <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-2 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-sky-405" />
                  Select Arrival Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1 font-mono">
                  {timeSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                        selectedSlot === slot
                          ? 'border-sky-505 bg-sky-955/60 text-sky-400 font-bold shadow-sm'
                          : 'border-white/10 bg-slate-900 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 text-xs font-bold border border-white/5 rounded-xl bg-slate-900 hover:bg-slate-850 transition-all text-slate-300 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDateTimeConfirm}
                  disabled={!selectedDate || !selectedSlot}
                  className="flex-1 py-3 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER CHECKOUT CONFIRM */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-slate-355 uppercase tracking-widest font-mono">Patient Clinical Dossier</h4>
              
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 font-mono">Patient Full Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter patient full name"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 font-mono">Emergency Core Phone</label>
                    <input
                      type="text"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>

                {/* Additional details for beds */}
                {bookingType !== 'appointment' && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-3.5 rounded-2xl border border-white/5">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-1 font-mono">Patient Age</label>
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="e.g. 45"
                        className="w-full px-2.5 py-2 bg-slate-900 border border-white/5 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-1 font-mono">Gender</label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-full px-2 py-2 bg-slate-900 border border-white/5 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-455 uppercase tracking-wider mb-1 font-mono">Triage Severity</label>
                      <select
                        value={patientSeverity}
                        onChange={(e) => setPatientSeverity(e.target.value as any)}
                        className="w-full px-2 py-2 bg-slate-900 border border-white/5 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                      >
                        <option value="Low">Green (Low)</option>
                        <option value="Medium">Yellow (Med)</option>
                        <option value="High">Orange (High)</option>
                        <option value="Critical">Red (Critical)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Drag and Drop Simulated reports upload */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Upload Laboratory Screeners or Diagnostic Reports
                  </label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={selectSimulatedFile}
                    className={`border border-dashed rounded-3xl p-4 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-sky-400 bg-sky-950/20' 
                        : uploadedReportName 
                        ? 'border-emerald-500/50 bg-emerald-950/10'
                        : 'border-white/10 hover:border-slate-700 bg-slate-900/50'
                    }`}
                  >
                    {uploadedReportName ? (
                      <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/10 text-left">
                        <div className="flex items-center gap-2 text-xs text-white">
                          <span className="text-emerald-400 text-lg">📄</span>
                          <div>
                            <p className="font-bold truncate max-w-[180px] text-xs">{uploadedReportName}</p>
                            <p className="text-[9.5px] text-slate-500 font-mono">Simulated file attached</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedReportName(null);
                          }}
                          className="text-[10px] text-rose-450 hover:text-rose-400 font-bold uppercase tracking-wider font-mono px-2 py-1 bg-slate-900 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <div className="text-2xl">📥</div>
                        <p className="text-xs font-bold text-white leading-snug">Drag & drop PDFs or Click to auto-attach clinical charts</p>
                        <p className="text-[10px] text-slate-505 font-mono">Supports PDF, JPEG, DICOM (Max 15MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 mt-4 text-xs space-y-3">
                <h5 className="font-bold text-slate-350 text-[10px] uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center justify-between font-mono">
                  <span>Secured Clinic Admission Slip</span>
                  <span className="text-sky-400">DEMO VERIFICATION</span>
                </h5>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-white text-sm">
                      {bookingType === 'appointment' 
                        ? (selectedService?.name || 'Primary G.P. Consultation') 
                        : `${bookingType.replace('_', ' ').toUpperCase()} Bed Allocation`}
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      {bookingType === 'appointment'
                        ? `${selectedDoctor?.name || 'Chief Hospital Specialist'} (${selectedDoctor?.qualification || 'M.D.'})`
                        : `${hospital.name} Clinical Core Ward Team`}
                    </p>
                    <p className="text-slate-500 mt-1 font-mono text-[11px] bg-slate-950 p-1 rounded inline-block">
                      ⏰ Start: {selectedDate} &bull; {selectedSlot}
                    </p>
                  </div>
                  <span className="font-bold text-white text-base font-mono">
                    ${bookingType === 'icu_bed' ? 500 : bookingType === 'emergency_bed' ? 300 : bookingType === 'normal_bed' ? 100 : (selectedService?.price || 120)}
                  </span>
                </div>

                <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Immediate Booking Triage allocation fee</span>
                  <span className="text-emerald-400 font-bold uppercase font-sans">0.00 waived</span>
                </div>

                <div className="flex justify-between items-center font-bold text-white text-sm border-t border-dashed border-white/10 pt-2.5">
                  <span className="uppercase font-mono text-[10.5px]">Estimate amount at Discharge desk</span>
                  <span className="text-base text-sky-400 font-mono">
                    ${bookingType === 'icu_bed' ? 500 : bookingType === 'emergency_bed' ? 300 : bookingType === 'normal_bed' ? 100 : (selectedService?.price || 120)}
                  </span>
                </div>
              </div>

              {/* Fast queue safety indicators */}
              <div className="flex gap-2.5 bg-sky-950/40 text-sky-200 border border-sky-800/20 p-3.5 rounded-2xl text-[11px] leading-snug">
                <Shield className="w-5 h-5 text-sky-505 shrink-0" />
                <div>
                  <p className="font-bold">Wait Estimate: {hospital.minWaitingTimeMinutes} Mins to Triage Room</p>
                  <p className="text-sky-305 mt-0.5">Your live queue position and unique token ID will be issued instantly upon final click and update patient counters.</p>
                </div>
              </div>

              {/* Checkout actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 text-xs font-bold border border-white/5 rounded-xl bg-slate-900 hover:bg-slate-850 transition-all text-slate-300 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={loading}
                  className="flex-1 py-3 text-xs font-bold bg-sky-600 hover:bg-sky-505 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Securing Bed allocation...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      Confirm Bed & Admit
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
