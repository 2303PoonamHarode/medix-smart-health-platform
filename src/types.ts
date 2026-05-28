/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'patient' | 'hospital' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface Hospital {
  id: string;
  userId: string; // link to owner user
  name: string;
  imageUrl: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  specializations: string[];
  emergencyServicesAvailable: boolean;
  openingTime: string;
  closingTime: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  ratingsAverage: number;
  totalReviews: number;
  minWaitingTimeMinutes: number;
  documents: string[]; // Mock URLs / certs
  certificates: string[];
  createdAt: string;

  // New Live Bed & Tracker fields
  totalBeds?: number;
  availableBeds?: number;
  occupiedBeds?: number;
  icuBedsAvailable?: number;
  emergencyBedsAvailable?: number;
  ventilatorsAvailable?: number;
  crowdStatus?: 'Low' | 'Medium' | 'High'; // Low=Green, Medium=Yellow, High=Red
  ambulanceAvailable?: boolean;
  distanceKm?: number;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  name: string;
  qualification: string;
  experienceYears: number;
  specialization: string;
  consultationFees: number;
  availabilityStatus: 'available' | 'busy' | 'away';
  createdAt: string;

  // New Live Doctor fields
  isOnline?: boolean;
  availableToday?: boolean;
  nextAvailableTime?: string;
  consultationTiming?: string;
  emergencyConsultationAvailable?: boolean;
  patientsInQueueCount?: number;
}

export interface MedicalService {
  id: string;
  hospitalId: string;
  name: string; // General Consultation, Specialist Consultation, Lab Test, etc
  price: number;
  durationMinutes: number;
  availability: boolean;
  doctorId: string;
  doctorName?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';
export type QueueStatus = 'Waiting' | 'Doctor Assigned' | 'Consultation Started' | 'Completed';

export interface Booking {
  id: string;
  tokenNumber: string;
  userId: string;
  userName: string;
  userPhone: string;
  hospitalId: string;
  hospitalName: string;
  serviceId: string;
  serviceName: string;
  doctorId: string;
  doctorName: string;
  bookingDate: string;
  timeSlot: string;
  status: BookingStatus;
  queuePosition: number;
  estimatedWaitingTimeMinutes: number;
  queueStatus: QueueStatus;
  updatedAt: string;
  createdAt: string;

  // Bed Booking and Clinical Severity additions
  bookingType?: 'appointment' | 'normal_bed' | 'icu_bed' | 'emergency_bed';
  patientSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
  patientAge?: number;
  patientGender?: string;
  uploadedReportUrl?: string; // simulation of file receipts
  estimatedAdmissionTimeMinutes?: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  hospitalId: string;
  rating: number; // 1-5
  text: string;
  doctorId?: string; // Optional doctor review
  doctorName?: string;
  doctorRating?: number;
  createdAt: string;
}

export interface EmergencyRequest {
  id: string;
  userId?: string;
  userName: string;
  userPhone: string;
  hospitalId?: string;
  hospitalName?: string;
  lat: number;
  lng: number;
  address: string;
  status: 'requested' | 'dispatched' | 'arrived' | 'completed';
  ambulanceContact: string;
  distanceKm?: number;
  createdAt: string;

  // Uber-like Live Tracking parameters
  ambulanceId?: string;
  ambulanceLicense?: string;
  driverName?: string;
  driverPhone?: string;
  estimatedTimeArrivalMinutes?: number;
  criticalityLevel?: 'Yellow' | 'Orange' | 'Red'; // Yellow=General, Orange=Severe, Red=Life-threatening
}

export interface QueueToken {
  bookingId: string;
  tokenNumber: string;
  hospitalId: string;
  doctorName: string;
  patientName: string;
  serviceName: string;
  position: number;
  waitingCount: number;
  status: QueueStatus;
  estimatedMinutes: number;
}

// ==========================================
// TELEMEDICINE & VIDEO CONSULTATION SYSTEM
// ==========================================

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'patient' | 'doctor';
  text: string;
  fileUrl?: string; // Report share / diagnostics
  timestamp: string;
}

export interface Medication {
  name: string;
  dosage: string; // e.g. "500mg"
  frequency: string; // e.g. "Three times daily after meals"
  duration: string; // e.g. "5 days"
}

export interface DigitalPrescription {
  id: string;
  sessionId: string;
  doctorName: string;
  doctorQualification: string;
  patientName: string;
  patientAge: number;
  date: string;
  symptoms: string;
  diagnosis: string;
  medications: Medication[];
  suggestions: string[];
  qrCodeUrl: string; // Scan to retrieve / fulfill
}

export interface TelemedicineSession {
  id: string;
  bookingId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  timeSlot: string;
  meetingCode: string;
  videoStatus: 'pending' | 'joining' | 'ongoing' | 'disconnected';
  chatMessages: ChatMessage[];
  prescription?: DigitalPrescription;
}

// ==========================================
// ONLINE LAB REPORT & DIGITAL LAB SYSTEM
// ==========================================

export type LabReportStatus = 'sample_collected' | 'testing_in_progress' | 'report_ready' | 'delivered';

export interface MedicalReport {
  id: string;
  patientId: string;
  patientName: string;
  testName: 'Blood Count' | 'MRI Scan' | 'CT Scan' | 'ECG Rhythm' | 'Chest X-Ray' | 'Urinalysis';
  sampleType: string;
  hospitalId: string;
  hospitalName: string;
  doctorName?: string;
  status: LabReportStatus;
  pdfUrl?: string;
  findings: string[];
  aiBriefingExplanation?: string; // Simple layman AI parsed summary
  doctorComments?: string;
  qrCodeAccessUrl: string;
  createdAt: string;
}

// ==========================================
// FAMILY HEALTH MANAGEMENT SYSTEM
// ==========================================

export interface FamilyMember {
  id: string;
  patientOwnerId: string;
  name: string;
  relationship: 'Spouse' | 'Parent' | 'Child' | 'Sibling' | 'Other';
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  pastMedicalHistory: string[];
}

// ==========================================
// BLOOD BANK & DONOR SYSTEM
// ==========================================

export interface BloodStock {
  hospitalId: string;
  hospitalName: string;
  inventory: {
    'A+': number;
    'A-': number;
    'B+': number;
    'B-': number;
    'AB+': number;
    'AB-': number;
    'O+': number;
    'O-': number;
  };
}

export interface BloodDonor {
  id: string;
  name: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  age: number;
  address: string;
  lat: number;
  lng: number;
  isAvailable: boolean;
  lastDonationDate: string;
  distanceKm?: number;
}

// ==========================================
// SMART SYSTEM NOTIFICATION MGR
// ==========================================

export interface SmartNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'report' | 'emergency' | 'appointment' | 'feedback';
  isRead: boolean;
  createdAt: string;
}

