/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDB, saveDB, hashPassword } from './database';
import { 
  User, Hospital, Doctor, MedicalService, Booking, Review, EmergencyRequest, QueueStatus,
  TelemedicineSession, MedicalReport, FamilyMember, BloodStock, BloodDonor, SmartNotification,
  DigitalPrescription
} from './src/types';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Google Gen AI client with a safe fallback to prevent crashes when the API key is not yet set up
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("No GEMINI_API_KEY environment variable. AI features will fallback to clinical simulation mode.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Helper: Simple session authenticator (checks Authorization header 'Bearer user-id_email_role')
  // This bypasses complex crypto crashes and lets AI Studio preview authenticate instantly
  function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      (req as any).user = undefined;
      return next();
    }
    const tokenPart = authHeader.substring(7);
    const decoded = Buffer.from(tokenPart, 'base64').toString('ascii');
    const [id, email, role] = decoded.split(':');
    
    const db = getDB();
    const user = db.users.find(u => u.id === id && u.email === email && u.role === role);
    if (user) {
      (req as any).user = user;
    } else {
      (req as any).user = undefined;
    }
    next();
  }

  app.use(authenticate);

  // ==========================================
  // Auth API
  // ==========================================
  
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name, phone, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const db = getDB();
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newId = 'user-' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      id: newId,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      phone: phone || '',
      role: role as any,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDB(db);

    const token = Buffer.from(`${newUser.id}:${newUser.email}:${newUser.role}`).toString('base64');
    res.status(201).json({ user: { id: newUser.id, email: newUser.email, name: newUser.name, phone: newUser.phone, role: newUser.role }, token });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = Buffer.from(`${user.id}:${user.email}:${user.role}`).toString('base64');
    res.json({ user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role }, token });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!(req as any).user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const u = (req as any).user;
    res.json({ user: { id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role } });
  });

  // ==========================================
  // Hospitals API
  // ==========================================

  // Hospital Signup with custom properties
  app.post('/api/hospitals/register-panel', (req, res) => {
    // Requires a logged-in User whose role is 'hospital', or creates one
    const { email, password, hospitalName, imageUrl, address, phone, specializations, emergencyServicesAvailable, openingTime, closingTime, certificates, documents } = req.body;
    
    if (!email || !password || !hospitalName || !address) {
      return res.status(400).json({ error: 'Missing hospital registration information' });
    }

    const db = getDB();
    
    // Create Owner user first
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already registered for owner profile' });
    }

    const newOwnerId = 'owner-' + Math.random().toString(36).substr(2, 9);
    const newOwner: User = {
      id: newOwnerId,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name: hospitalName + ' Owner',
      phone: phone || '',
      role: 'hospital',
      createdAt: new Date().toISOString()
    };
    db.users.push(newOwner);

    // Create Hospital details
    const newHospId = 'hosp-' + Math.random().toString(36).substr(2, 9);
    const newHospital: Hospital = {
      id: newHospId,
      userId: newOwnerId,
      name: hospitalName,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80',
      address,
      lat: 40.71 + (Math.random() - 0.5) * 0.05, // seed random coordinates in local demo area
      lng: -74.00 + (Math.random() - 0.5) * 0.05,
      phone: phone || '+1 (555) 000-1111',
      specializations: Array.isArray(specializations) ? specializations : ['General Consultation'],
      emergencyServicesAvailable: emergencyServicesAvailable === 'true' || emergencyServicesAvailable === true,
      openingTime: openingTime || '09:00',
      closingTime: closingTime || '20:00',
      verificationStatus: 'pending', // Pending verification by Admin
      ratingsAverage: 0,
      totalReviews: 0,
      minWaitingTimeMinutes: 10,
      documents: Array.isArray(documents) ? documents : ['Uploaded Doc'],
      certificates: Array.isArray(certificates) ? certificates : ['Awaiting physical upload'],
      createdAt: new Date().toISOString()
    };

    db.hospitals.push(newHospital);
    saveDB(db);

    const token = Buffer.from(`${newOwner.id}:${newOwner.email}:${newOwner.role}`).toString('base64');
    res.status(201).json({
      user: { id: newOwner.id, email: newOwner.email, name: newOwner.name, role: newOwner.role },
      hospital: newHospital,
      token
    });
  });

  // GET LIST (With searching/filtering Zomato style!)
  app.get('/api/hospitals', (req, res) => {
    const db = getDB();
    const { search, category, filter } = req.query;
    
    let filtered = db.hospitals;

    // Search terms
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(q) || 
        h.address.toLowerCase().includes(q) ||
        h.specializations.some(s => s.toLowerCase().includes(q))
      );
    }

    // Category / Specialization filter
    if (category) {
      const cat = (category as string).toLowerCase();
      filtered = filtered.filter(h => 
        h.specializations.some(s => s.toLowerCase().includes(cat))
      );
    }

    // Filters (Zomato homepage tags)
    if (filter) {
      const f = filter as string;
      if (f === 'emergency') {
        filtered = filtered.filter(h => h.emergencyServicesAvailable);
      } else if (f === 'top-rated') {
        filtered = filtered.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
      } else if (f === 'no-wait') {
        filtered = filtered.filter(h => h.minWaitingTimeMinutes <= 15);
      } else if (f === 'multi-specialty') {
        filtered = filtered.filter(h => h.specializations.length >= 3);
      } else if (f === 'open-now') {
        // Mock Open Now logic checking current hours
        filtered = filtered.filter(h => h.openingTime === '00:00' || h.closingTime >= '21:00');
      } else if (f === 'verified') {
        filtered = filtered.filter(h => h.verificationStatus === 'verified');
      } else if (f === 'icu-beds') {
        filtered = filtered.filter(h => h.icuBedsAvailable && h.icuBedsAvailable > 0);
      } else if (f === 'emergency-beds') {
        filtered = filtered.filter(h => h.emergencyBedsAvailable && h.emergencyBedsAvailable > 0);
      } else if (f === 'ventilators') {
        filtered = filtered.filter(h => h.ventilatorsAvailable && h.ventilatorsAvailable > 0);
      } else if (f === 'low-crowd') {
        filtered = filtered.filter(h => h.crowdStatus === 'Low');
      } else if (f === 'lowest-fee') {
        filtered = [...filtered].sort((a, b) => {
          const docsA = db.doctors.filter(d => d.hospitalId === a.id);
          const docsB = db.doctors.filter(d => d.hospitalId === b.id);
          const minA = docsA.length > 0 ? Math.min(...docsA.map(d => d.consultationFees)) : 999;
          const minB = docsB.length > 0 ? Math.min(...docsB.map(d => d.consultationFees)) : 999;
          return minA - minB;
        });
      }
    }

    res.json(filtered);
  });

  // GET SINGLE DETAIL
  app.get('/api/hospitals/:id', (req, res) => {
    const db = getDB();
    const hospital = db.hospitals.find(h => h.id === req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // Embed associated doctors, services, and reviews
    const doctors = db.doctors.filter(d => d.hospitalId === hospital.id);
    const services = db.services.filter(s => s.hospitalId === hospital.id);
    const reviews = db.reviews.filter(r => r.hospitalId === hospital.id);

    res.json({
      hospital,
      doctors,
      services,
      reviews
    });
  });

  // Update Hospital stats/settings (Hospital dashboard)
  app.put('/api/hospitals/:id', (req, res) => {
    const db = getDB();
    const hospitalIndex = db.hospitals.findIndex(h => h.id === req.params.id);
    if (hospitalIndex === -1) {
      return res.status(404).json({ error: 'Hospital clinic not found' });
    }

    const currentHosp = db.hospitals[hospitalIndex];
    const { name, imageUrl, address, phone, openingTime, closingTime, emergencyServicesAvailable, minWaitingTimeMinutes, specializations } = req.body;

    db.hospitals[hospitalIndex] = {
      ...currentHosp,
      name: name || currentHosp.name,
      imageUrl: imageUrl || currentHosp.imageUrl,
      address: address || currentHosp.address,
      phone: phone || currentHosp.phone,
      openingTime: openingTime || currentHosp.openingTime,
      closingTime: closingTime || currentHosp.closingTime,
      emergencyServicesAvailable: emergencyServicesAvailable !== undefined ? (emergencyServicesAvailable === 'true' || emergencyServicesAvailable === true) : currentHosp.emergencyServicesAvailable,
      minWaitingTimeMinutes: minWaitingTimeMinutes !== undefined ? parseInt(minWaitingTimeMinutes) : currentHosp.minWaitingTimeMinutes,
      specializations: Array.isArray(specializations) ? specializations : currentHosp.specializations
    };

    saveDB(db);
    res.json(db.hospitals[hospitalIndex]);
  });

  // ==========================================
  // Doctors & Services (Dashboard Panel)
  // ==========================================

  // Add doctor to hospital
  app.post('/api/hospitals/:id/doctors', (req, res) => {
    const { name, qualification, experienceYears, specialization, consultationFees, availabilityStatus } = req.body;
    if (!name || !qualification || !specialization) {
      return res.status(400).json({ error: 'Missing doctor data' });
    }

    const db = getDB();
    const newDocObj: Doctor = {
      id: 'doc-' + Math.random().toString(36).substr(2, 9),
      hospitalId: req.params.id,
      name,
      qualification,
      experienceYears: parseInt(experienceYears) || 1,
      specialization,
      consultationFees: parseInt(consultationFees) || 50,
      availabilityStatus: availabilityStatus || 'available',
      createdAt: new Date().toISOString()
    };

    db.doctors.push(newDocObj);
    saveDB(db);
    res.status(201).json(newDocObj);
  });

  // Remove doctor
  app.delete('/api/doctors/:id', (req, res) => {
    const db = getDB();
    db.doctors = db.doctors.filter(d => d.id !== req.params.id);
    saveDB(db);
    res.json({ success: true, message: 'Doctor profile removed' });
  });

  // Add service to hospital
  app.post('/api/hospitals/:id/services', (req, res) => {
    const { name, price, durationMinutes, availability, doctorId } = req.body;
    if (!name || !price || !doctorId) {
      return res.status(400).json({ error: 'Missing service parameters' });
    }

    const db = getDB();
    const assignedDoc = db.doctors.find(d => d.id === doctorId);

    const newSrvObj: MedicalService = {
      id: 'srv-' + Math.random().toString(36).substr(2, 9),
      hospitalId: req.params.id,
      name,
      price: parseInt(price),
      durationMinutes: parseInt(durationMinutes) || 30,
      availability: availability === 'true' || availability === true,
      doctorId,
      doctorName: assignedDoc ? assignedDoc.name : 'Unassigned Doctor'
    };

    db.services.push(newSrvObj);
    saveDB(db);
    res.status(201).json(newSrvObj);
  });

  // Remove service
  app.delete('/api/services/:id', (req, res) => {
    const db = getDB();
    db.services = db.services.filter(s => s.id !== req.params.id);
    saveDB(db);
    res.json({ success: true, message: 'Medical service removed' });
  });

  // Find hospital owned by user ID
  app.get('/api/hospitals/owner/me', (req, res) => {
    const userObj = (req as any).user;
    if (!userObj || userObj.role !== 'hospital') {
      return res.status(403).json({ error: 'Only registered hospital owners can edit dashboard parameters' });
    }
    const db = getDB();
    const hospital = db.hospitals.find(h => h.userId === userObj.id);
    if (!hospital) {
      return res.status(404).json({ error: 'No hospital assigned to this owner account yet' });
    }
    res.json(hospital);
  });

  // ==========================================
  // Booking & Appointment Management Flow
  // ==========================================

  // Create booking (Generating Token Number & Queue position like buying food)
  app.post('/api/bookings', (req, res) => {
    const { 
      hospitalId, 
      serviceId, 
      doctorId, 
      bookingDate, 
      timeSlot, 
      userName, 
      userPhone, 
      userId,
      bookingType = 'appointment',
      patientSeverity = 'Low',
      patientAge,
      patientGender,
      uploadedReportUrl
    } = req.body;

    if (!hospitalId || !bookingDate || !timeSlot) {
      return res.status(400).json({ error: 'Essential booking parameters missing' });
    }

    const db = getDB();
    const hospital = db.hospitals.find(h => h.id === hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Core hospital node not found' });
    }

    // Auto-resolve or fall back for service/doctor if it's a direct bed booking
    let service = serviceId ? db.services.find(s => s.id === serviceId) : null;
    let doctor = doctorId ? db.doctors.find(d => d.id === doctorId) : null;

    if (!service && bookingType !== 'appointment') {
      // Auto-assign first service of this hospital
      service = db.services.find(s => s.hospitalId === hospitalId) || {
        id: 'srv-bed-fallback',
        hospitalId,
        name: `${bookingType.replace('_', ' ').toUpperCase()} Booking & Triage`,
        price: bookingType === 'icu_bed' ? 500 : bookingType === 'emergency_bed' ? 300 : 100,
        durationMinutes: 60,
        availability: true,
        doctorId: doctorId || 'doc-1'
      };
    }

    if (!doctor && bookingType !== 'appointment') {
      // Auto-assign first doctor of this hospital
      doctor = db.doctors.find(d => d.hospitalId === hospitalId) || {
        id: 'doc-bed-fallback',
        hospitalId,
        name: 'Chief On-Duty Medical Registrar',
        qualification: 'Chief Medical Specialist',
        experienceYears: 10,
        specialization: 'Emergency & Critical Care',
        consultationFees: 150,
        availabilityStatus: 'available',
        createdAt: new Date().toISOString()
      };
    }

    if (bookingType === 'appointment' && (!service || !doctor)) {
      return res.status(400).json({ error: 'Doctor and service selection is mandatory for outpatient appointments' });
    }

    // Decrement available beds as needed
    if (bookingType === 'normal_bed') {
      if (hospital.availableBeds && hospital.availableBeds > 0) {
        hospital.availableBeds--;
        if (hospital.occupiedBeds !== undefined) hospital.occupiedBeds++;
      } else if (hospital.availableBeds !== undefined) {
        return res.status(400).json({ error: 'No Normal Beds currently available' });
      }
    } else if (bookingType === 'icu_bed') {
      if (hospital.icuBedsAvailable && hospital.icuBedsAvailable > 0) {
        hospital.icuBedsAvailable--;
        if (hospital.occupiedBeds !== undefined) hospital.occupiedBeds++;
      } else if (hospital.icuBedsAvailable !== undefined) {
        return res.status(400).json({ error: 'No ICU beds currently available at this facility' });
      }
    } else if (bookingType === 'emergency_bed') {
      if (hospital.emergencyBedsAvailable && hospital.emergencyBedsAvailable > 0) {
        hospital.emergencyBedsAvailable--;
        if (hospital.occupiedBeds !== undefined) hospital.occupiedBeds++;
      } else if (hospital.emergencyBedsAvailable !== undefined) {
        return res.status(400).json({ error: 'No Emergency trauma beds currently available' });
      }
    }

    // Calculate current queuing number for this hospital on this day
    const sameHospitalSameDay = db.bookings.filter(b => 
      b.hospitalId === hospitalId && 
      b.bookingDate === bookingDate &&
      b.queueStatus !== 'Completed' && 
      b.status === 'confirmed'
    );

    const position = sameHospitalSameDay.length + 1;
    // Estimated wait calculation
    const estWait = (hospital.minWaitingTimeMinutes) + (position - 1) * 15;

    // Build unique medical coupon code token e.g. "H1-D04-89" or "ICU-Grace-89"
    const randomHex = Math.floor(Math.random() * 90) + 10;
    const tokenNumber = bookingType === 'icu_bed' 
      ? `ICU-${randomHex}` 
      : bookingType === 'emergency_bed'
      ? `ER-${randomHex}`
      : bookingType === 'normal_bed'
      ? `BED-${randomHex}`
      : `${hospital.name.split(' ')[0].substring(0,2).toUpperCase()}-${randomHex}`;

    const userObj = (req as any).user;
    const newBooking: Booking = {
      id: 'book-' + Math.random().toString(36).substr(2, 9),
      tokenNumber,
      userId: userId || userObj?.id || 'guest-user',
      userName: userName || userObj?.name || 'Anonymous Patient',
      userPhone: userPhone || userObj?.phone || '+1 (555) 441-2026',
      hospitalId,
      hospitalName: hospital.name,
      serviceId: service ? service.id : 'srv-bed-fallback',
      serviceName: service ? service.name : 'Emergency Bed Booking Room',
      doctorId: doctor ? doctor.id : 'doc-bed-fallback',
      doctorName: doctor ? doctor.name : 'On-Duty Emergency Team',
      bookingDate,
      timeSlot,
      status: 'confirmed', // immediately confirm for streamlined demo
      queuePosition: position,
      estimatedWaitingTimeMinutes: estWait,
      queueStatus: 'Waiting',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),

      bookingType,
      patientSeverity,
      patientAge: patientAge ? parseInt(patientAge) : undefined,
      patientGender,
      uploadedReportUrl
    };

    // Reflect bed deduction in DB
    const hospIndex = db.hospitals.findIndex(h => h.id === hospitalId);
    if (hospIndex !== -1) {
      db.hospitals[hospIndex] = hospital;
    }

    db.bookings.push(newBooking);
    saveDB(db);
    res.status(201).json(newBooking);
  });

  // Get current active patient bookings
  app.get('/api/bookings/my', (req, res) => {
    const db = getDB();
    const userObj = (req as any).user;
    const userId = userObj ? userObj.id : 'patient-1'; // fallback patient-1 for demo
    const bookings = db.bookings.filter(b => b.userId === userId);
    res.json(bookings);
  });

  // Get all bookings for hospital (hospital panel)
  app.get('/api/bookings/hospital/:hospId', (req, res) => {
    const db = getDB();
    const bookings = db.bookings.filter(b => b.hospitalId === req.params.hospId);
    res.json(bookings);
  });

  // Real-time Queue updates (updates target postion and decrement all subsequent ones in queue!)
  app.post('/api/bookings/:id/status', (req, res) => {
    const { nextStatus } = req.body; // 'Waiting' | 'Doctor Assigned' | 'Consultation Started' | 'Completed'
    if (!nextStatus) {
      return res.status(400).json({ error: 'Missing status update payload' });
    }

    const db = getDB();
    const bookingIndex = db.bookings.findIndex(b => b.id === req.params.id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Booking appointment missing' });
    }

    const targetBooking = db.bookings[bookingIndex];
    const prevStatus = targetBooking.queueStatus;
    targetBooking.queueStatus = nextStatus as QueueStatus;
    targetBooking.updatedAt = new Date().toISOString();

    // If status becomes COMPLETED or REJECTED/CANCELLED, shift all subsequent patients on the same day/doctor up by 1 position!
    if (nextStatus === 'Completed') {
      targetBooking.queuePosition = 0;
      targetBooking.estimatedWaitingTimeMinutes = 0;

      if (targetBooking.bookingType && targetBooking.bookingType !== 'appointment') {
        const hospitalIndex = db.hospitals.findIndex(h => h.id === targetBooking.hospitalId);
        if (hospitalIndex !== -1) {
          const hospital = db.hospitals[hospitalIndex];
          if (targetBooking.bookingType === 'normal_bed' && hospital.availableBeds !== undefined) {
            hospital.availableBeds = Math.min(hospital.totalBeds || 150, hospital.availableBeds + 1);
            if (hospital.occupiedBeds && hospital.occupiedBeds > 0) hospital.occupiedBeds--;
          } else if (targetBooking.bookingType === 'icu_bed' && hospital.icuBedsAvailable !== undefined) {
            hospital.icuBedsAvailable++;
            if (hospital.occupiedBeds && hospital.occupiedBeds > 0) hospital.occupiedBeds--;
          } else if (targetBooking.bookingType === 'emergency_bed' && hospital.emergencyBedsAvailable !== undefined) {
            hospital.emergencyBedsAvailable++;
            if (hospital.occupiedBeds && hospital.occupiedBeds > 0) hospital.occupiedBeds--;
          }
          db.hospitals[hospitalIndex] = hospital;
        }
      }

      // Adjust queue positions of others in same hospital/doctor
      db.bookings = db.bookings.map(b => {
        if (
          b.hospitalId === targetBooking.hospitalId &&
          b.doctorId === targetBooking.doctorId &&
          b.bookingDate === targetBooking.bookingDate &&
          b.queueStatus === 'Waiting' &&
          b.queuePosition > 1
        ) {
          b.queuePosition = b.queuePosition - 1;
          b.estimatedWaitingTimeMinutes = Math.max(0, b.estimatedWaitingTimeMinutes - 15);
        }
        return b;
      });
    }

    db.bookings[bookingIndex] = targetBooking;
    saveDB(db);
    res.json({ success: true, booking: targetBooking, bookings: db.bookings });
  });

  // ==========================================
  // Reviews & Rating System APIS
  // ==========================================
  app.post('/api/reviews', (req, res) => {
    const { hospitalId, rating, text, doctorId, doctorRating } = req.body;
    if (!hospitalId || !rating || !text) {
      return res.status(400).json({ error: 'Missing review payload' });
    }

    const db = getDB();
    const hospital = db.hospitals.find(h => h.id === hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital clinic not found' });
    }

    const assignedDoc = doctorId ? db.doctors.find(d => d.id === doctorId) : undefined;

    const userObj = (req as any).user;
    const newReview: Review = {
      id: 'rev-' + Math.random().toString(36).substr(2, 9),
      userId: userObj?.id || 'guest-patient',
      userName: userObj?.name || 'Vocal Healthcare Advocate',
      hospitalId,
      rating: parseInt(rating),
      text,
      doctorId,
      doctorName: assignedDoc ? assignedDoc.name : undefined,
      doctorRating: doctorRating ? parseInt(doctorRating) : undefined,
      createdAt: new Date().toISOString()
    };

    db.reviews.push(newReview);

    // Recalculate hospital ratings average
    const hospReviews = db.reviews.filter(r => r.hospitalId === hospitalId);
    const sumRatings = hospReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = parseFloat((sumRatings / hospReviews.length).toFixed(1));

    hospital.ratingsAverage = avg;
    hospital.totalReviews = hospReviews.length;

    saveDB(db);
    res.status(201).json(newReview);
  });

  // ==========================================
  // Emergency SOS dispatch APIs (Large Floating Red Widget)
  // ==========================================
  app.post('/api/emergency/sos', (req, res) => {
    const { lat, lng, address, userName, userPhone } = req.body;
    
    const db = getDB();
    
    // Auto-calculate nearest hospital that has emergencyServicesAvailable = true!
    const emergencyHospList = db.hospitals.filter(h => h.emergencyServicesAvailable);
    
    let closestHosp = emergencyHospList[0];
    let minDistance = 5.0; // seed default base km

    if (lat && lng && emergencyHospList.length > 0) {
      // Haversine / Pythagorean simplified distance estimation for local demo area
      emergencyHospList.forEach(h => {
        const dLat = h.lat - parseFloat(lat);
        const dLng = h.lng - parseFloat(lng);
        const dist = Math.sqrt(dLat*dLat + dLng*dLng) * 111; // conversion to km approx
        if (dist < minDistance) {
          minDistance = parseFloat(dist.toFixed(2));
          closestHosp = h;
        }
      });
    }

    const ambulancePhone = closestHosp 
      ? `+1 (555) SOS-${closestHosp.name.split(' ')[0].toUpperCase()}`
      : '+1 (555) Emergency-991';

    const userObj = (req as any).user;
    const newSOS: EmergencyRequest = {
      id: 'sos-' + Math.random().toString(36).substr(2, 9),
      userId: userObj?.id,
      userName: userName || userObj?.name || 'SOS Active Dispatcher',
      userPhone: userPhone || userObj?.phone || '+1 (555) 911-3000',
      hospitalId: closestHosp?.id,
      hospitalName: closestHosp?.name || 'Nearest Regional Command Center',
      lat: lat ? parseFloat(lat) : 40.712,
      lng: lng ? parseFloat(lng) : -74.008,
      address: address || 'Broad St & Wall St, Metropolitan Area',
      status: 'requested',
      distanceKm: minDistance,
      ambulanceContact: ambulancePhone,
      createdAt: new Date().toISOString()
    };

    db.emergencies.push(newSOS);
    saveDB(db);
    res.status(201).json(newSOS);
  });

  app.get('/api/emergency/requests', (req, res) => {
    const db = getDB();
    res.json(db.emergencies);
  });

  app.post('/api/emergency/:id/status', (req, res) => {
    const { status } = req.body; // 'requested' | 'dispatched' | 'arrived' | 'completed'
    if (!status) {
      return res.status(400).json({ error: 'Missing status' });
    }

    const db = getDB();
    const index = db.emergencies.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Emergency case file not found' });
    }

    db.emergencies[index].status = status;
    saveDB(db);
    res.json(db.emergencies[index]);
  });

  // ==========================================
  // Admin Controller Panel APIs
  // ==========================================
  app.post('/api/admin/verify-hospital/:id', (req, res) => {
    // verifying a new hospital clinic
    const { status } = req.body; // 'verified' | 'rejected'
    if (!status) {
      return res.status(400).json({ error: 'No status parameter' });
    }

    const db = getDB();
    const index = db.hospitals.findIndex(h => h.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    db.hospitals[index].verificationStatus = status;
    saveDB(db);
    res.json(db.hospitals[index]);
  });

  app.delete('/api/admin/reviews/:id', (req, res) => {
    const db = getDB();
    db.reviews = db.reviews.filter(r => r.id !== req.params.id);
    saveDB(db);
    res.json({ success: true, message: 'Review scrubbed by hospital moderation admin' });
  });

  app.get('/api/admin/stats', (req, res) => {
    const db = getDB();
    res.json({
      totalUsers: db.users.length,
      totalHospitals: db.hospitals.length,
      verifiedHospitals: db.hospitals.filter(h => h.verificationStatus === 'verified').length,
      pendingHospitals: db.hospitals.filter(h => h.verificationStatus === 'pending').length,
      totalBookings: db.bookings.length,
      activeEmergencies: db.emergencies.filter(e => e.status !== 'completed').length,
      completedAppointments: db.bookings.filter(b => b.queueStatus === 'Completed').length
    });
  });

  // ==========================================
  // DIGITAL LAB RECORDS & LABS ROUTERS
  // ==========================================
  app.get('/api/reports', (req, res) => {
    const db = getDB();
    const patientId = req.query.patientId || (req as any).user?.id || 'patient-1';
    const list = db.reports.filter(r => r.patientId === patientId);
    res.json(list);
  });

  app.post('/api/reports', (req, res) => {
    const { patientId, patientName, testName, sampleType, hospitalId, hospitalName, doctorName, status, findings, doctorComments } = req.body;
    const db = getDB();
    const id = 'rep-' + Math.random().toString(36).substr(2, 9);
    
    const newReport: MedicalReport = {
      id,
      patientId: patientId || 'patient-1',
      patientName: patientName || 'John Doe',
      testName: testName || 'Blood Count',
      sampleType: sampleType || 'Whole Blood Sample',
      hospitalId: hospitalId || 'hosp-1',
      hospitalName: hospitalName || 'City Grace Hospital',
      doctorName: doctorName || 'Dr. Evelyn Carter',
      status: status || 'sample_collected',
      findings: Array.isArray(findings) ? findings : ['Pre-analytical scanning stage complete.'],
      doctorComments: doctorComments || '',
      qrCodeAccessUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=report-${id}`,
      createdAt: new Date().toISOString()
    };

    db.reports.push(newReport);
    saveDB(db);

    // Push smart notification alert
    db.notifications.push({
      id: 'ntf-' + Math.random().toString(36).substr(2, 9),
      userId: patientId || 'patient-1',
      title: 'Lab Report Added / Updated',
      message: `Your clinical test lab report for '${testName}' has been posted in CareQuest. status: ${status}.`,
      type: 'report',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    saveDB(db);

    res.status(201).json(newReport);
  });

  app.post('/api/reports/:id/ai-explain', async (req, res) => {
    const db = getDB();
    const repIndex = db.reports.findIndex(r => r.id === req.params.id);
    if (repIndex === -1) {
      return res.status(404).json({ error: 'Laboratory report file not found' });
    }
    const report = db.reports[repIndex];
    const client = getAIClient();

    if (client) {
      try {
        const prompt = `You are an expert clinical laboratory analyst assistant built into CareQuest Smart Healthcare platform. Please translate the following patient test parameters into encouraging, highly accessible, easy-to-understand plain language. Do not tell them they will die. Highlight three positive takeaways first.
        
        Patient Name: ${report.patientName}
        Test Procedure: ${report.testName}
        Source Medical Center: ${report.hospitalName}
        Clinical Findings Parameters:
        ${report.findings.join('; ')}
        
        Keep your output structure elegant and educational. Format strictly in Markdown starting with "### CareQuest AI Layman Analysis" and split into sections: "#### Overview", "#### Meaning of details", and "#### Healthy lifestyle actions".`;
        
        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        });

        const text = response.text || 'Reassuring results detected. Maintain simple diets and active physical stamina.';
        db.reports[repIndex].aiBriefingExplanation = text;
        saveDB(db);
        return res.json({ success: true, explanation: text });
      } catch (err: any) {
        console.error("Gemini lab briefing fail:", err);
      }
    }

    // High quality clinical seed translation fallbacks
    const simulatedExplanations: Record<string, string> = {
      'Blood Count': '### CareQuest AI Layman Analysis\n\n#### Overview\nYour blood profiles indicate superb general baseline health with zero markers of immune stress or vascular fatigue.\n\n#### Meaning of details\n* **Hemoglobin: 14.2 g/dL** - Represents optimal iron absorption and excellent stamina.\n* **White Cells: 6.8** - Confirms absolute absence of physical chronic infections.\n* **Platelets: 245** - Displays fast clotting safety cells.\n\n#### Healthy lifestyle actions\nConsider taking simple multi-formula capsule supplements, hydrating early in the mornings, and maintaining three weekly cardiac jogging runs.',
      'MRI Scan': '### CareQuest AI Layman Analysis\n\n#### Overview\nYour computed MRI cerebral scan represents top-tier structural symmetry. No lesions detected.\n\n#### Meaning of details\n* **Primary Neuronal Matrix** - Smooth cranial tissue with pristine neural communication lanes.\n* **Liquids circulation** - Completely clear of pressure or high fluid volume blocks.\n\n#### Healthy lifestyle actions\nTake 7-8 hours deep sleep nightly and practice mindfulness twice daily.',
      'default': '### CareQuest AI Layman Analysis\n\nAll cellular systems and molecular parameters read back in pristine, self-healing status indices. Make sure to hydrate daily, feed balanced nutrient compounds, and preserve yearly wellness checks!'
    };

    const simText = simulatedExplanations[report.testName] || simulatedExplanations['default'];
    db.reports[repIndex].aiBriefingExplanation = simText;
    saveDB(db);
    res.json({ success: true, explanation: simText });
  });

  // ==========================================
  // FAMILY REGISTER NETWORKS
  // ==========================================
  app.get('/api/family', (req, res) => {
    const db = getDB();
    const userId = (req as any).user?.id || 'patient-1';
    const list = db.familyMembers.filter(f => f.patientOwnerId === userId);
    res.json(list);
  });

  app.post('/api/family', (req, res) => {
    const { name, relationship, age, gender, bloodGroup, allergies, chronicConditions, pastMedicalHistory } = req.body;
    if (!name || !relationship) {
      return res.status(400).json({ error: 'Name and relation type parameters are missing' });
    }
    const db = getDB();
    const userId = (req as any).user?.id || 'patient-1';

    const newMember: FamilyMember = {
      id: 'fam-' + Math.random().toString(36).substr(2, 9),
      patientOwnerId: userId,
      name,
      relationship,
      age: parseInt(age) || 30,
      gender: gender || 'Male',
      bloodGroup: bloodGroup || 'O+',
      allergies: Array.isArray(allergies) ? allergies : [],
      chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
      pastMedicalHistory: Array.isArray(pastMedicalHistory) ? pastMedicalHistory : []
    };

    db.familyMembers.push(newMember);
    saveDB(db);
    res.status(201).json(newMember);
  });

  app.delete('/api/family/:id', (req, res) => {
    const db = getDB();
    db.familyMembers = db.familyMembers.filter(f => f.id !== req.params.id);
    saveDB(db);
    res.json({ success: true, message: 'Family member profile decoupled' });
  });

  // ==========================================
  // BLOOD DONATION AND SUPPLY EXCHANGE
  // ==========================================
  app.get('/api/blood/donors', (req, res) => {
    const db = getDB();
    const { lat, lng } = req.query;
    let list = db.bloodDonors;

    if (lat && lng) {
      const pLat = parseFloat(lat as string);
      const pLng = parseFloat(lng as string);
      list = list.map(d => {
        const dLat = d.lat - pLat;
        const dLng = d.lng - pLng;
        const dist = parseFloat((Math.sqrt(dLat*dLat + dLng*dLng) * 111).toFixed(1));
        return { ...d, distanceKm: dist };
      }).sort((a,b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }
    res.json(list);
  });

  app.get('/api/blood/stocks', (req, res) => {
    const db = getDB();
    res.json(db.bloodStocks);
  });

  app.post('/api/blood/requests', (req, res) => {
    const { bloodGroup, patientLat, patientLng, patientAddress, quantityUnits = 2 } = req.body;
    if (!bloodGroup) {
      return res.status(400).json({ error: 'Target Blood type group parameter is crucial' });
    }
    const db = getDB();
    const matchingDonors = db.bloodDonors.filter(d => d.bloodGroup === bloodGroup && d.isAvailable);

    if (matchingDonors.length === 0) {
      return res.json({
        success: false,
        message: `Temporary deficit: No certified active ${bloodGroup} donors available near site. Dispatched automatic priority requests to regional medical blood banking centers.`,
        closestDonor: null
      });
    }

    let closest = matchingDonors[0];
    let minD = 999.0;
    const pLat = patientLat ? parseFloat(patientLat) : 40.7128;
    const pLng = patientLng ? parseFloat(patientLng) : -74.0060;

    matchingDonors.forEach(d => {
      const dLat = d.lat - pLat;
      const dLng = d.lng - pLng;
      const dist = Math.sqrt(dLat*dLat + dLng*dLng) * 111;
      if (dist < minD) {
        minD = dist;
        closest = d;
      }
    });

    res.json({
      success: true,
      message: `Critical Donor Matched! ${closest.name} (${bloodGroup}) has accepted the regional transfusion dispatch alert near ${patientAddress || 'Current Hospital'}. Contact: ${closest.phone}.`,
      closestDonor: {
        ...closest,
        distanceKm: parseFloat(minD.toFixed(1))
      }
    });
  });

  // ==========================================
  // TELEMEDICINE REUNIONS AND PRESCRIPTIONS
  // ==========================================
  app.get('/api/telemedicine/sessions', (req, res) => {
    const db = getDB();
    const userId = (req as any).user?.id || 'patient-1';
    let list = db.telemedicineSessions;

    if ((req as any).user?.role === 'patient') {
      list = list.filter(s => s.patientId === userId);
    } else if ((req as any).user?.role === 'hospital') {
      // Show clinic related telemedicine sessions
      const hospitalObj = db.hospitals.find(h => h.userId === (req as any).user.id);
      if (hospitalObj) {
        list = list.filter(s => s.doctorId === 'doc-1' || s.doctorId === 'doc-2');
      }
    }
    res.json(list);
  });

  app.post('/api/telemedicine/sessions/:id/messages', (req, res) => {
    const { text, fileUrl } = req.body;
    const db = getDB();
    const idx = db.telemedicineSessions.findIndex(s => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Telemedicine workspace context missing' });
    }

    const userObj = (req as any).user || { id: 'patient-1', name: 'John Doe', role: 'patient' };
    const newMsg = {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      senderId: userObj.id,
      senderName: userObj.name,
      senderRole: userObj.role === 'hospital' ? 'doctor' : 'patient' as any,
      text: text || '',
      fileUrl,
      timestamp: new Date().toISOString()
    };

    db.telemedicineSessions[idx].chatMessages.push(newMsg);
    saveDB(db);
    res.status(201).json(newMsg);
  });

  app.post('/api/telemedicine/sessions/:id/prescription', (req, res) => {
    const { symptoms, diagnosis, medications, suggestions } = req.body;
    const db = getDB();
    const idx = db.telemedicineSessions.findIndex(s => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Clinical appointment workspace missing' });
    }

    const parentSess = db.telemedicineSessions[idx];
    const rxId = 'rx-' + Math.random().toString(36).substr(2, 9);
    
    const newRx: DigitalPrescription = {
      id: rxId,
      sessionId: parentSess.id,
      doctorName: parentSess.doctorName,
      doctorQualification: 'MD, Emergency Registrar Consultant',
      patientName: parentSess.patientName,
      patientAge: 35,
      date: new Date().toISOString().split('T')[0],
      symptoms: symptoms || 'Acute common respiratory stress',
      diagnosis: diagnosis || 'Viral non-bacterial strain congestion',
      medications: Array.isArray(medications) ? medications : [
        { name: 'Paracetamol 650mg', dosage: '1 tablet', frequency: 'Three times daily after nourishment', duration: '3 days' }
      ],
      suggestions: Array.isArray(suggestions) ? suggestions : [
        'Complete safe steam inhalations twice daily before resting.',
        'Drink clear filtered lukewarm liquids.'
      ],
      qrCodeUrl: `https://api.qrservers.com/v1/create-qr-code/?size=150x150&data=prescription-${rxId}`
    };

    db.telemedicineSessions[idx].prescription = newRx;
    saveDB(db);

    // Push notification to user
    db.notifications.push({
      id: 'ntf-' + Math.random().toString(36).substr(2, 9),
      userId: parentSess.patientId,
      title: 'Digital Prescription Issued',
      message: `Your medical consultant Dr. ${parentSess.doctorName} has generated a new clinical digital prescription docket. Scan to unlock in pharmacy.`,
      type: 'appointment',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    saveDB(db);

    res.status(201).json(newRx);
  });

  // ==========================================
  // METROPOLITAN HOSPITAL AI TRIAGE ANALYSER
  // ==========================================
  app.post('/api/ai/symptom-check', async (req, res) => {
    const { symptoms, patientAge, patientGender, patientHistory = '' } = req.body;
    if (!symptoms) {
      return res.status(400).json({ error: 'Symptoms parameter is required' });
    }

    const client = getAIClient();
    if (client) {
      try {
        const schema = {
          type: Type.OBJECT,
          properties: {
            detectedSeverity: {
              type: Type.STRING,
              description: "Must be: 'Low' | 'Medium' | 'High' | 'Critical'"
            },
            urgencyAdvice: {
              type: Type.STRING
            },
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedSpecialist: {
              type: Type.STRING
            },
            suggestedHospitalCategory: {
              type: Type.STRING
            },
            crowdLevelPrediction: {
              type: Type.STRING,
              description: "Must be: 'Low' | 'Medium' | 'High'"
            },
            estimatedQueueWaitingTimeMinutes: {
              type: Type.INTEGER
            }
          },
          required: [
            'detectedSeverity', 'urgencyAdvice', 'possibleCauses', 
            'recommendedSpecialist', 'suggestedHospitalCategory', 
            'crowdLevelPrediction', 'estimatedQueueWaitingTimeMinutes'
          ]
        };

        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Analyze patient symptoms: ${symptoms}. Gender: ${patientGender || 'Unspecified'}, Age: ${patientAge || 30}, History: ${patientHistory}. Provide detailed medical recommendations in the JSON schema.`,
          config: {
            systemInstruction: "You are the advanced server triage algorithm on CareQuest. Assess urgency and give immediate medical advice.",
            responseMimeType: 'application/json',
            responseSchema: schema
          }
        });

        const text = response.text;
        const parsed = JSON.parse(text);
        return res.json({ success: true, analysis: parsed, isSimulated: false });
      } catch (err: any) {
        console.error("Gemini symptom parser fail, seeking fallback:", err);
      }
    }

    // High fidelity medical seed fallbacks
    let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    let urgency = 'Reassuring index. Refrain from heavy physical exertion, rest, and check in if spikes develop.';
    let causes = ['Mild atmospheric throat allergy', 'Common respiratory virus'];
    let specialist = 'General Physician';
    let hospitalCategory = 'City Grace Emergency Hospital';
    let crowd: 'Low' | 'Medium' | 'High' = 'Low';
    let waitAmt = 15;

    const query = symptoms.toLowerCase();
    if (query.includes('chest') || query.includes('breath') || query.includes('stroke') || query.includes('unconscious') || query.includes('heart pain') || query.includes('heart attack')) {
      severity = 'Critical';
      urgency = 'CRITICAL ALERT: Potentially life-threatening cardiovascular risk detected. Please lie flat, keep airway clear, and dispatch a CareQuest RED SOS ambulance instantly!';
      causes = ['Acute coronary syndromic pressure', 'Vascular pulmonary block', 'Cardiovascular angina'];
      specialist = 'Interventional Cardiologist Consultant';
      hospitalCategory = 'Metro Heart & Vascular Institute';
      crowd = 'High';
      waitAmt = 5;
    } else if (query.includes('children') || query.includes('fever') || query.includes('child') || query.includes('son') || query.includes('daughter') || query.includes('baby')) {
      severity = 'Medium';
      urgency = 'Ensure constant fluid absorption. Monitor temperature spikes closely via rectal readings. Consult pediatrician.';
      causes = ['Seasonal pediatric viral fever', 'Environmental allergen inflammation'];
      specialist = 'Pediatrics Consultant';
      hospitalCategory = 'St. Jude Children Specialty Clinic';
      crowd = 'Medium';
      waitAmt = 12;
    } else if (query.includes('heart') || query.includes('blood pressure') || query.includes('hypertension') || query.includes('pulse')) {
      severity = 'High';
      urgency = 'Perform BP measurement immediately. Sit low, reduce ambient lighting, and proceed to cardiologist triage.';
      causes = ['Cardiovascular hypertension flare', 'Vestibular neural disruption'];
      specialist = 'Cardiology Specialist';
      hospitalCategory = 'Metro Heart & Vascular Institute';
      crowd = 'High';
      waitAmt = 20;
    }

    res.json({
      success: true,
      analysis: {
        detectedSeverity: severity,
        urgencyAdvice: urgency,
        possibleCauses: causes,
        recommendedSpecialist: specialist,
        suggestedHospitalCategory: hospitalCategory,
        crowdLevelPrediction: crowd,
        estimatedQueueWaitingTimeMinutes: waitAmt
      },
      isSimulated: true
    });
  });

  // ==========================================
  // SMART INTERNAL IN-APP ALERTS
  // ==========================================
  app.get('/api/notifications', (req, res) => {
    const db = getDB();
    const userId = (req as any).user?.id || 'patient-1';
    res.json(db.notifications.filter(n => n.userId === userId));
  });

  app.post('/api/notifications/read', (req, res) => {
    const db = getDB();
    const userId = (req as any).user?.id || 'patient-1';
    db.notifications = db.notifications.map(n => {
      if (n.userId === userId) n.isRead = true;
      return n;
    });
    saveDB(db);
    res.json({ success: true, message: 'All notifications cleared' });
  });


  // ==========================================
  // Vite Integration & Static Servers
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve SPA index file
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Hospital server booting running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
