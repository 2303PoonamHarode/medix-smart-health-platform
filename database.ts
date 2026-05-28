/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  User, Hospital, Doctor, MedicalService, Booking, Review, EmergencyRequest, QueueStatus,
  TelemedicineSession, MedicalReport, FamilyMember, BloodStock, BloodDonor, SmartNotification 
} from './src/types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory and file exist
function initializeDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const existing = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(existing);
      if (parsed.users && parsed.hospitals && parsed.hospitals.length >= 30 && parsed.reports) {
        return; // Already initialized correctly with advanced fields
      }
    } catch (e) {
      console.error("Corrupted database file. Re-initializing...", e);
    }
  }

  // Prepopulate with a rich set of Zomato-inspired healthcare data
  const initialData = getSeedData();
  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
}

export interface DBStore {
  users: User[];
  hospitals: Hospital[];
  doctors: Doctor[];
  services: MedicalService[];
  bookings: Booking[];
  reviews: Review[];
  emergencies: EmergencyRequest[];
  reports: MedicalReport[];
  familyMembers: FamilyMember[];
  bloodDonors: BloodDonor[];
  bloodStocks: BloodStock[];
  telemedicineSessions: TelemedicineSession[];
  notifications: SmartNotification[];
}

export function getDB(): DBStore {
  initializeDB();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as DBStore;
  } catch (err) {
    console.error("Error reading db.json, returning empty template", err);
    return { 
      users: [], hospitals: [], doctors: [], services: [], bookings: [], reviews: [], emergencies: [],
      reports: [], familyMembers: [], bloodDonors: [], bloodStocks: [], telemedicineSessions: [], notifications: [] 
    };
  }
}

export function saveDB(data: DBStore) {
  initializeDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Quick password hashing helper via sha256 (no external heavy bcrypt required)
export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', 'med-token-salt-2026').update(password).digest('hex');
}

function getSeedData(): DBStore {
  const adminPwdHash = hashPassword('admin123');
  const patientPwdHash = hashPassword('patient123');
  const hospitalPwdHash = hashPassword('hospital123');

  const users: User[] = [
    {
      id: 'admin-1',
      email: 'admin@smarthospital.com',
      passwordHash: adminPwdHash,
      name: 'Dr. Sarah Jenkins (Admin)',
      phone: '+91 98765 43210',
      role: 'admin',
      createdAt: new Date().toISOString()
    },
    {
      id: 'patient-1',
      email: 'patient@smarthospital.com',
      passwordHash: patientPwdHash,
      name: 'John Doe',
      phone: '+91 99999 88888',
      role: 'patient',
      createdAt: new Date().toISOString()
    },
    {
      id: 'hospowner-1',
      email: 'owner@citygrace.com',
      passwordHash: hospitalPwdHash,
      name: 'Metro Care Group',
      phone: '+91 91234 56789',
      role: 'hospital',
      createdAt: new Date().toISOString()
    },
    {
      id: 'hospowner-2',
      email: 'owner@metroheart.com',
      passwordHash: hospitalPwdHash,
      name: 'Fortis Apollo Management',
      phone: '+91 98888 77777',
      role: 'hospital',
      createdAt: new Date().toISOString()
    }
  ];

  const firstNames = [
    'Rajesh', 'Amit', 'Priya', 'Anjali', 'Vikram', 'Sneha', 'Srinivas', 'Kavitha', 'Rahul', 'Sanjay',
    'Aditya', 'Divya', 'Deepak', 'Arjun', 'Meera', 'Rohan', 'Neha', 'Alok', 'Sunita', 'Manish',
    'Preeti', 'Karan', 'Shalini', 'Pankaj', 'Vijay', 'Jyoti', 'Sunil', 'Asha', 'Ravi', 'Geeta',
    'Nikhil', 'Tanvi', 'Vikas', 'Pooja', 'Abhishek', 'Kiran', 'Sandeep', 'Swati', 'Harish', 'Anil'
  ];

  const lastNames = [
    'Kumar', 'Patel', 'Sharma', 'Mehta', 'Singh', 'Iyer', 'Rao', 'Reddy', 'Deshmukh', 'Joshi',
    'Choudhury', 'Nair', 'Verma', 'Gupta', 'Banerjee', 'Chatterjee', 'Sen', 'Dutta', 'Naidu', 'Sinha',
    'Pillai', 'Pandey', 'Mishra', 'Trivedi', 'Saxena', 'Bose', 'Rathore', 'Menon', 'Gowda', 'Shetty'
  ];

  const qualifications = [
    'MD, Cardiology (AIIMS Delhi)',
    'MBBS, MS, Orthopedics (KGMU Lucknow)',
    'MD, Pediatrics (PGIMER Chandigarh)',
    'MCh, Neurosurgery (MAMC Delhi)',
    'MD, DM, Gastroenterology (CMC Vellore)',
    'MBBS, DNB, Critical Care (Tata Memorial)',
    'MD, Internal Medicine (Stanford Medical)',
    'MD, FACP, Pulmonology (Johns Hopkins)'
  ];

  const hospitalTemplates = [
    {
      name: 'Apollo Hospital Greams Road',
      city: 'Chennai',
      address: '21 Greams Lane, Off Greams Road, Chennai',
      phone: '+91 44 2829 0200',
      lat: 13.0601,
      lng: 80.2525,
      specializations: ['Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Gastroenterology', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'Fortis Memorial Research Institute',
      city: 'Delhi',
      address: 'Sector 44, Opposite HUDA City Centre, Gurugram, Delhi NCR',
      phone: '+91 124 496 2200',
      lat: 28.4595,
      lng: 77.0266,
      specializations: ['Neurology', 'Cardiology', 'Organ Transplant', 'Emergency Medicine', 'Pediatrics'],
      imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      category: 'Super speciality center'
    },
    {
      name: 'Max Super Speciality Hospital Saket',
      city: 'Delhi',
      address: '1 & 2, Press Enclave Road, Saket, New Delhi',
      phone: '+91 11 2651 5050',
      lat: 28.5276,
      lng: 77.2104,
      specializations: ['Oncology', 'Cardiovascular Sciences', 'Orthopedics', 'Pediatrics', 'Obstetrics & Gynecology', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1538108176447-280586497d96?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'Manipal Hospital HAL Airport Road',
      city: 'Bangalore',
      address: '98, HAL Airport Road, Bangalore',
      phone: '+91 80 2502 4444',
      lat: 12.9592,
      lng: 77.6444,
      specializations: ['Nephrology', 'Laparoscopic Surgery', 'Emergency Medicine', 'Pediatrics', 'Internal Medicine', 'Cardiology'],
      imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
      category: 'Super speciality center'
    },
    {
      name: 'Kokilaben Dhirubhai Ambani Hospital',
      city: 'Mumbai',
      address: 'Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai',
      phone: '+91 22 3099 9999',
      lat: 19.1311,
      lng: 72.8258,
      specializations: ['Robotic Surgery', 'Cardiology', 'Neurology', 'Pediatrics', 'Trauma Care', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'Medanta - The Medicity',
      city: 'Delhi',
      address: 'CH Baktawar Singh Road, Sector 38, Gurugram, Delhi NCR',
      phone: '+91 124 414 1414',
      lat: 28.4232,
      lng: 77.0394,
      specializations: ['Cardiology', 'Liver Transplant', 'Cancer Institute', 'Neurology', 'Urology', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1502740479796-62dd93477ad7?w=600&auto=format&fit=crop&q=80',
      category: 'Cardiology-focused'
    },
    {
      name: 'Sir H. N. Reliance Foundation Hospital',
      city: 'Mumbai',
      address: 'Raja Rammohan Roy Road, Prarthana Samaj, Girgaon, Mumbai',
      phone: '+91 22 6130 3030',
      lat: 18.9565,
      lng: 72.8208,
      specializations: ['Pediatrics', 'Oncology', 'Cardiovascular Surgery', 'Orthopedics', 'Spine Surgery', 'Internal Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=600&auto=format&fit=crop&q=80',
      category: 'Private'
    },
    {
      name: 'Tata Memorial Hospital',
      city: 'Mumbai',
      address: 'Dr. Ernest Borges Road, Parel, Mumbai',
      phone: '+91 22 2417 7000',
      lat: 19.0033,
      lng: 72.8422,
      specializations: ['Oncology', 'Radiotherapy', 'Chemotherapy', 'Haematoncology', 'Surgical Oncology', 'Laboratory Screening'],
      imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      category: 'Government'
    },
    {
      name: 'Lilavati Hospital & Research Centre',
      city: 'Mumbai',
      address: 'A-791, Bandra Reclamation, Bandra West, Mumbai',
      phone: '+91 22 2675 1000',
      lat: 19.0511,
      lng: 72.8211,
      specializations: ['Internal Medicine', 'Cardiology', 'Gastroenterology', 'Urology', 'Orthopedics', 'Pediatrics'],
      imageUrl: 'https://images.unsplash.com/photo-1504813184591-015578c1c4b6?w=600&auto=format&fit=crop&q=80',
      category: 'Private'
    },
    {
      name: 'Ruby General Hospital',
      city: 'Kolkata',
      address: 'Kasba Connector, E.M. Bypass, Kolkata',
      phone: '+91 33 6687 1800',
      lat: 22.5115,
      lng: 88.4014,
      specializations: ['Emergency Medicine', 'General Surgery', 'Obstetrics & Gynecology', 'Critical Care', 'Internal Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&auto=format&fit=crop&q=80',
      category: 'Emergency Trauma center'
    },
    {
      name: 'AMRI Hospital Salt Lake',
      city: 'Kolkata',
      address: 'JC-16 & 17, Block-JC, Sector III, Salt Lake, Kolkata',
      phone: '+91 33 2335 7710',
      lat: 22.5658,
      lng: 88.4111,
      specializations: ['Pediatrics', 'Neurology', 'Pulmonology', 'Orthopedics', 'Oncology', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1619088410280-979b55a61af2?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'Yashoda Hospital Secunderabad',
      city: 'Hyderabad',
      address: 'Alexander Road, Secunderabad, Hyderabad',
      phone: '+91 40 4567 4567',
      lat: 17.4411,
      lng: 78.5011,
      specializations: ['Neurology', 'Nephrology', 'Cardiology', 'Organ Transplant', 'Emergency Medicine', 'Urology'],
      imageUrl: 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=600&auto=format&fit=crop&q=80',
      category: 'Super speciality center'
    },
    {
      name: 'KIMS Hospital Secunderabad',
      city: 'Hyderabad',
      address: 'Minister Road, Secunderabad, Hyderabad',
      phone: '+91 40 4488 5000',
      lat: 17.4334,
      lng: 78.4831,
      specializations: ['Cardiology', 'Rheumatology', 'Pulmonology', 'Oncology', 'Geriatrics', 'Pediatrics'],
      imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'Gleneagles Global Health City',
      city: 'Chennai',
      address: '439, Cheran Nagar, Perumbakkam, Chennai',
      phone: '+91 44 4477 7000',
      lat: 12.9022,
      lng: 80.2052,
      specializations: ['Hepatology', 'Organ Transplant', 'Gastroenterology', 'Critical Care', 'Cardiology', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      category: 'Super speciality center'
    },
    {
      name: 'SIMS Hospital Vadapalani',
      city: 'Chennai',
      address: '1, Jawaharlal Nehru Salai, Vadapalani, Chennai',
      phone: '+91 44 2000 2001',
      lat: 13.0494,
      lng: 80.2091,
      specializations: ['Oncology', 'Cardiac Sciences', 'Neuro Sciences', 'Orthopedics', 'Emergency Care', 'Pediatrics'],
      imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80',
      category: 'Super speciality center'
    },
    {
      name: 'Aster CMI Hospital Hebbal',
      city: 'Bangalore',
      address: 'New Airport Road, Hebbal, Bangalore',
      phone: '+91 80 4342 0100',
      lat: 13.0485,
      lng: 77.5937,
      specializations: ['Pediatrics', 'Cardiology', 'Gastric Sciences', 'Urology', 'Internal Medicine', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'Sakra World Hospital Marathahalli',
      city: 'Bangalore',
      address: 'Devarabisanahalli, Outer Ring Road, Bangalore',
      phone: '+91 80 4969 4969',
      lat: 12.9366,
      lng: 77.6894,
      specializations: ['Orthopedics', 'Neurosciences', 'Rehabilitation Medicine', 'Cardiac Sciences', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1502740479796-62dd93477ad7?w=600&auto=format&fit=crop&q=80',
      category: 'Super speciality center'
    },
    {
      name: 'Narayana Health City',
      city: 'Bangalore',
      address: 'Bommasandra Industrial Area, Anekal Taluk, Hosur Road, Bangalore',
      phone: '+91 80 7122 2222',
      lat: 12.8122,
      lng: 77.6925,
      specializations: ['Cardiology', 'Oncology', 'Neurology', 'Organ Transplant', 'Nephrology', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'Sahyadri Specialty Hospital Deccan',
      city: 'Pune',
      address: 'Plot No. 30C, Karve Road, Deccan Gymkhana, Pune',
      phone: '+91 20 6721 3000',
      lat: 18.5142,
      lng: 73.8398,
      specializations: ['Neurology', 'Oncology', 'Orthopedics', 'Internal Medicine', 'General Surgery', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1619088410280-979b55a61af2?w=600&auto=format&fit=crop&q=80',
      category: 'Super speciality center'
    },
    {
      name: 'Jehangir Hospital Pune',
      city: 'Pune',
      address: '32, Sassoon Road, Central Pune, Pune',
      phone: '+91 20 6681 9999',
      lat: 18.5292,
      lng: 73.8761,
      specializations: ['Critical Care', 'Pediatrics', 'Cardiology', 'Emergency Medicine', 'Gastroenterology', 'Spine Care'],
      imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
      category: 'Private'
    },
    {
      name: 'Ruby Hall Clinic Sassoon Rd',
      city: 'Pune',
      address: '40, Sassoon Road, Opposite Railway Station, Pune',
      phone: '+91 20 6645 0505',
      lat: 18.5298,
      lng: 73.8755,
      specializations: ['Oncology', 'Cardiovascular Surgery', 'Robotic Surgery', 'Pediatrics', 'Neurology', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'Shalby Hospital SG Highway',
      city: 'Ahmedabad',
      address: 'Opposite Karnavati Club, S.G. Highway, Ahmedabad',
      phone: '+91 79 4020 3000',
      lat: 23.0231,
      lng: 72.5065,
      specializations: ['Orthopedics', 'Joint Replacement', 'Cardiology', 'Spine Surgery', 'Oncology', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80',
      category: 'Super speciality center'
    },
    {
      name: 'Sterling Hospital Memnagar',
      city: 'Ahmedabad',
      address: 'Sterling Hospital Road, Memnagar, Ahmedabad',
      phone: '+91 79 4001 1111',
      lat: 23.0488,
      lng: 72.5322,
      specializations: ['Critical Care', 'Internal Medicine', 'Cardiovascular Surgery', 'Gastroenterology', 'Orthopedics', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1538108176447-280586497d96?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'Sahara Hospital Gomti Nagar',
      city: 'Lucknow',
      address: 'Viram Khand 1, Gomti Nagar, Lucknow',
      phone: '+91 522 678 0001',
      lat: 26.8521,
      lng: 81.0022,
      specializations: ['Neuro Surgery', 'Gastroenterology', 'Pediatrics', 'Orthopedics', 'Emergency Medicine', 'Cardiology'],
      imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'SGPGI Lucknow Raebareli Rd',
      city: 'Lucknow',
      address: 'Raebareli Road, Lucknow',
      phone: '+91 522 266 8700',
      lat: 26.7588,
      lng: 80.9388,
      specializations: ['Endocrinology', 'Gastroenterology', 'Neurology', 'Immunology', 'Renal Transplant', 'Cardiology'],
      imageUrl: 'https://images.unsplash.com/photo-1502740479796-62dd93477ad7?w=600&auto=format&fit=crop&q=80',
      category: 'Government'
    },
    {
      name: 'King George Medical University Hospital',
      city: 'Lucknow',
      address: 'Shah Mina Road, Chowk, Lucknow',
      phone: '+91 522 225 7540',
      lat: 26.8688,
      lng: 80.9169,
      specializations: ['Trauma Care', 'Surgery', 'Pediatric Medicine', 'Obstetrics', 'Ophthalmology', 'Cardiology'],
      imageUrl: 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=600&auto=format&fit=crop&q=80',
      category: 'Government'
    },
    {
      name: 'Apex Super Speciality Hospital',
      city: 'Jaipur',
      address: 'SP-4, Malviya Industrial Area, Malviya Nagar, Jaipur',
      phone: '+91 141 410 1111',
      lat: 26.8488,
      lng: 75.8239,
      specializations: ['Oncology', 'Cardiovascular Sciences', 'Orthopedics', 'Neurosciences', 'Emergency Medicine', 'Pediatrics'],
      imageUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&auto=format&fit=crop&q=80',
      category: 'Private'
    },
    {
      name: 'Sawai Man Singh Hospital',
      city: 'Jaipur',
      address: 'Jawaharlal Nehru Marg, Ashok Nagar, Jaipur',
      phone: '+91 141 251 8234',
      lat: 26.9038,
      lng: 75.8119,
      specializations: ['Trauma & Emergency Care', 'Burn Unit', 'Cardiothoracic Surgery', 'Internal Medicine', 'Pediatrics'],
      imageUrl: 'https://images.unsplash.com/photo-1619088410280-979b55a61af2?w=600&auto=format&fit=crop&q=80',
      category: 'Government'
    },
    {
      name: 'Eternal Hospital EHCC Circle',
      city: 'Jaipur',
      address: '3A, Near Jawahar Circle, Tonk Road, Jaipur',
      phone: '+91 141 511 1111',
      lat: 26.8322,
      lng: 75.7988,
      specializations: ['Interventional Cardiology', 'Electrophysiology', 'Vascular Surgery', 'Oncology', 'Orthopedics', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
      category: 'Cardiology-focused'
    },
    {
      name: 'Continental Hospital Gachibowli',
      city: 'Hyderabad',
      address: 'Plot No. 3, Road No. 2, IT Financial District, Gachibowli, Hyderabad',
      phone: '+91 40 6700 0000',
      lat: 17.4188,
      lng: 78.3422,
      specializations: ['Trauma & Critical Care', 'Oncology', 'Surgical Gastroenterology', 'Pediatrics', 'Neurology', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      category: 'Multi-speciality'
    },
    {
      name: 'CARE Hospital Banjara Hills',
      city: 'Hyderabad',
      address: 'Road No. 1, Banjara Hills, Hyderabad',
      phone: '+91 40 6165 6565',
      lat: 17.4111,
      lng: 78.4488,
      specializations: ['Cardiology', 'Internal Medicine', 'Rheumatology', 'Nephrology', 'Critical Care', 'Emergency Medicine'],
      imageUrl: 'https://images.unsplash.com/photo-1502740479796-62dd93477ad7?w=600&auto=format&fit=crop&q=80',
      category: 'Private'
    },
    {
      name: 'Medipoint Hospital Aundh',
      city: 'Pune',
      address: 'New DP Road, Near Vidya Vidyalaya, Aundh, Pune',
      phone: '+91 20 2729 7733',
      lat: 18.5631,
      lng: 73.8052,
      specializations: ['Pediatrics', 'Obstetrics & Gynecology', 'General Medicine', 'ENT', 'Emergency Medicine', 'Orthopedics'],
      imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80',
      category: 'Private'
    }
  ];

  const hospitals: Hospital[] = [];
  const doctors: Doctor[] = [];
  const services: MedicalService[] = [];

  hospitalTemplates.forEach((temp, i) => {
    const hospId = `hosp-${i + 1}`;
    const ownerUserId = i % 2 === 0 ? 'hospowner-1' : 'hospowner-2';

    // Bed distributions based on indices
    const totalBeds = 150 + ((i * 17) % 350); // range 150-500
    const availableBeds = 15 + ((i * 13) % (totalBeds - 100));
    const occupiedBeds = totalBeds - availableBeds;
    const icuBedsAvailable = 10 + ((i * 7) % 65); // range 10-75
    const emergencyBedsAvailable = 5 + ((i * 11) % 43); // range 5-48
    const ventilatorsAvailable = 5 + ((i * 3) % 25); // range 5-30
    const crowdStatus = (i % 3 === 0) ? 'Low' : (i % 3 === 1) ? 'Medium' : 'High';
    const minWaitingTimeMinutes = 5 + ((i * 8) % 80); // range 5-85
    const ratingDecimal = 4.0 + ((i * 3) % 10) / 10; // range 4.0-4.9

    // Build Hospital object
    hospitals.push({
      id: hospId,
      userId: ownerUserId,
      name: temp.name,
      imageUrl: temp.imageUrl,
      address: `${temp.address}, ${temp.city}`,
      lat: temp.lat,
      lng: temp.lng,
      phone: temp.phone,
      specializations: temp.specializations,
      emergencyServicesAvailable: true,
      openingTime: '00:00',
      closingTime: '23:59',
      verificationStatus: 'verified',
      ratingsAverage: ratingDecimal,
      totalReviews: 20 + ((i * 19) % 180),
      minWaitingTimeMinutes: minWaitingTimeMinutes,
      documents: [`https://example.com/certs/licence-hosp-${i + 1}.pdf`],
      certificates: ['JCI Gold Accreditation', 'NABH Certified Service Standard'],
      createdAt: new Date().toISOString(),

      totalBeds,
      availableBeds,
      occupiedBeds,
      icuBedsAvailable,
      emergencyBedsAvailable,
      ventilatorsAvailable,
      crowdStatus: crowdStatus as 'Low' | 'Medium' | 'High',
      ambulanceAvailable: true
    });

    // Make 6 to 10 doctors per hospital programmatically to satisfy 5-25 range for each.
    const numDoctors = 6 + (i % 5); // Either 6, 7, 8, 9, 10
    for (let d = 0; d < numDoctors; d++) {
      const docId = `doc-${hospId}-${d + 1}`;
      const spec = temp.specializations[d % temp.specializations.length];
      const fn = firstNames[(i * 11 + d * 3) % firstNames.length];
      const ln = lastNames[(i * 7 + d * 5) % lastNames.length];
      const docName = `Dr. ${fn} ${ln}`;
      
      const exp = 3 + ((i * d + 7) % 22); // range 3-24 yrs
      const fees = 300 + (((i * 13 + d * 9) % 17) * 100); // multiple of 100, range ₹300-₹1900
      const statusSeed = (d % 3 === 0) ? 'busy' : (d % 5 === 0) ? 'away' : 'available';
      const patientsQueue = (i * 2 + d) % 8; // range 0-7 patient count

      const qual = qualifications[(i * d) % qualifications.length];

      const doctorObj: Doctor = {
        id: docId,
        hospitalId: hospId,
        name: docName,
        qualification: qual,
        experienceYears: exp,
        specialization: spec,
        consultationFees: fees,
        availabilityStatus: statusSeed as 'available' | 'busy' | 'away',
        createdAt: new Date().toISOString(),

        isOnline: statusSeed === 'available',
        availableToday: statusSeed !== 'away',
        nextAvailableTime: statusSeed === 'available' ? 'Available Now' : statusSeed === 'busy' ? 'In 30 mins' : 'Tomorrow 09:30 AM',
        consultationTiming: '09:00 AM - 05:00 PM',
        emergencyConsultationAvailable: true,
        patientsInQueueCount: patientsQueue
      };

      doctors.push(doctorObj);

      // Add a Medical Service mapped to this doctor
      services.push({
        id: `srv-${hospId}-${d + 1}`,
        hospitalId: hospId,
        name: `${spec} consultation with ${docName}`,
        price: fees,
        durationMinutes: 30,
        availability: statusSeed === 'available',
        doctorId: docId,
        doctorName: docName
      });
    }
  });

  const bookings: Booking[] = [
    {
      id: 'booking-seed-1',
      tokenNumber: 'H1-E08',
      userId: 'patient-1',
      userName: 'John Doe',
      userPhone: '+91 99999 88888',
      hospitalId: 'hosp-1',
      hospitalName: 'Apollo Hospital Greams Road',
      serviceId: 'srv-hosp-1-1',
      serviceName: 'Cardiology consultation with Dr. Rajesh Kumar',
      doctorId: 'doc-hosp-1-1',
      doctorName: 'Dr. Rajesh Kumar',
      bookingDate: '2026-05-28',
      timeSlot: '11:15 AM - 11:45 AM',
      status: 'confirmed',
      queuePosition: 2,
      estimatedWaitingTimeMinutes: 15,
      queueStatus: 'Waiting',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ];

  const reviews: Review[] = [
    {
      id: 'rev-1',
      userId: 'patient-1',
      userName: 'John Doe',
      hospitalId: 'hosp-1',
      rating: 5,
      text: 'Extremely professional and streamlined system! Literally booked emergency consultation, got my token number H1-E08 in seconds, and saw Dr. Rajesh within 15 minutes of my arrival.',
      doctorId: 'doc-hosp-1-1',
      doctorName: 'Dr. Rajesh Kumar',
      doctorRating: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: 'rev-2',
      userId: 'patient-1',
      userName: 'John Doe',
      hospitalId: 'hosp-2',
      rating: 5,
      text: 'Dr. Nair is an outstanding expert. Guided me calmly through my heart evaluation stress check.',
      doctorId: 'doc-hosp-2-1',
      doctorName: 'Dr. Priya Nair',
      doctorRating: 5,
      createdAt: new Date().toISOString()
    }
  ];

  const reports: MedicalReport[] = [
    {
      id: 'rep-1',
      patientId: 'patient-1',
      patientName: 'John Doe',
      testName: 'Blood Count',
      sampleType: 'Whole Blood (EDTA)',
      hospitalId: 'hosp-1',
      hospitalName: 'Apollo Hospital Greams Road',
      doctorName: 'Dr. Rajesh Kumar',
      status: 'report_ready',
      pdfUrl: '#download-pdf-count',
      findings: [
        'Hemoglobin: 14.5 g/dL (Normal Range: 13.8 - 17.2)',
        'White Blood Cells: 6.5 x10^3/uL (Normal Range: 4.5 - 11.0)',
        'Platelets: 250 x10^3/uL (Normal Range: 150 - 450)',
        'Red Blood Cell Count: 5.1 x10^6/uL (Normal Range: 4.7 - 6.1)'
      ],
      aiBriefingExplanation: 'Your hematology profiles are excellent! Your oxygen-carrying hemoglobin is perfectly balanced, and the immune white cell count indicates you are not fighting any active infections. Keep up a standard diet and stay hydrated.',
      doctorComments: 'Routine levels look fabulous. Continue with current vitamins.',
      qrCodeAccessUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=report-rep-1',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
    }
  ];

  const familyMembers: FamilyMember[] = [
    {
      id: 'fam-1',
      patientOwnerId: 'patient-1',
      name: 'Jane Doe',
      relationship: 'Spouse',
      age: 28,
      gender: 'Female',
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Peanuts'],
      chronicConditions: ['Asthma'],
      pastMedicalHistory: ['Appendectomy (2018)']
    }
  ];

  // Distribute regional blood donors matching our cities near actual coords
  const bloodDonors: BloodDonor[] = [
    {
      id: 'donor-1',
      name: 'Amit Deshmukh',
      bloodGroup: 'O-',
      phone: '+91 99887 76655',
      age: 31,
      address: 'Andheri West, Mumbai',
      lat: 19.1300,
      lng: 72.8200,
      isAvailable: true,
      lastDonationDate: '2026-02-15'
    },
    {
      id: 'donor-2',
      name: 'Kshitij Sharma',
      bloodGroup: 'AB+',
      phone: '+91 98765 43210',
      age: 26,
      address: 'Saket, New Delhi',
      lat: 28.5200,
      lng: 77.2100,
      isAvailable: true,
      lastDonationDate: '2026-03-20'
    },
    {
      id: 'donor-3',
      name: 'Rahul Hegde',
      bloodGroup: 'B-',
      phone: '+91 91234 56789',
      age: 42,
      address: 'HAL Airport Rd, Bangalore',
      lat: 12.9500,
      lng: 77.6400,
      isAvailable: true,
      lastDonationDate: '2026-05-01'
    },
    {
      id: 'donor-4',
      name: 'Srinivas Mylari',
      bloodGroup: 'O+',
      phone: '+91 98888 77777',
      age: 35,
      address: 'Gachibowli, Hyderabad',
      lat: 17.4100,
      lng: 78.3400,
      isAvailable: true,
      lastDonationDate: '2026-04-18'
    },
    {
      id: 'donor-5',
      name: 'Vikram Iyer',
      bloodGroup: 'A-',
      phone: '+91 94440 12345',
      age: 29,
      address: 'Greams Road, Chennai',
      lat: 13.0600,
      lng: 80.2500,
      isAvailable: true,
      lastDonationDate: '2026-01-20'
    }
  ];

  // Generate bloodStock entries for all 32 hospitals
  const bloodStocks: BloodStock[] = hospitals.map(h => ({
    hospitalId: h.id,
    hospitalName: h.name,
    inventory: {
      'A+': 15 + (parseInt(h.id.replace('hosp-', '')) * 3) % 40,
      'A-': 2 + (parseInt(h.id.replace('hosp-', '')) * 1) % 15,
      'B+': 12 + (parseInt(h.id.replace('hosp-', '')) * 5) % 35,
      'B-': 3 + (parseInt(h.id.replace('hosp-', '')) * 1) % 10,
      'AB+': 4 + (parseInt(h.id.replace('hosp-', '')) * 2) % 25,
      'AB-': 1 + (parseInt(h.id.replace('hosp-', '')) * 1) % 10,
      'O+': 20 + (parseInt(h.id.replace('hosp-', '')) * 7) % 50,
      'O-': 5 + (parseInt(h.id.replace('hosp-', '')) * 3) % 20,
    }
  }));

  const telemedicineSessions: TelemedicineSession[] = [
    {
      id: 'tele-1',
      bookingId: 'booking-seed-1',
      patientId: 'patient-1',
      patientName: 'John Doe',
      doctorId: 'doc-hosp-1-1',
      doctorName: 'Dr. Rajesh Kumar',
      specialization: 'Cardiology',
      date: '2026-05-28',
      timeSlot: '11:15 AM - 11:45 AM',
      meetingCode: 'cq-rajesh-john-99',
      videoStatus: 'pending',
      chatMessages: [
        {
          id: 'msg-1',
          senderId: 'patient-1',
          senderName: 'John Doe',
          senderRole: 'patient',
          text: 'Hello doctor, I completed my routine Blood Panel Count. Are my results stable?',
          timestamp: new Date(Date.now() - 600000).toISOString()
        },
        {
          id: 'msg-2',
          senderId: 'doc-hosp-1-1',
          senderName: 'Dr. Rajesh Kumar',
          senderRole: 'doctor',
          text: 'Hi John, I just reviewed your CBC panel. They look outstanding! Let us hop on our telemedicine consultation to brief you.',
          timestamp: new Date(Date.now() - 300000).toISOString()
        }
      ],
      prescription: {
        id: 'rx-1',
        sessionId: 'tele-1',
        doctorName: 'Dr. Rajesh Kumar',
        doctorQualification: 'MD, Cardiology (AIIMS)',
        patientName: 'John Doe',
        patientAge: 35,
        date: '2026-05-28',
        symptoms: 'Routine cardiovascular follow-up check',
        diagnosis: 'Excellent healthy hematocrit index check',
        medications: [
          {
            name: 'Multivitamin Formula-Z',
            dosage: '1 capsule',
            frequency: 'Once daily after breakfast',
            duration: '30 days'
          }
        ],
        suggestions: [
          'Maintain active physical exercises (150 mins per week)',
          'Ensure safe hydration (3-4L pure fluids daily)'
        ],
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=prescription-rx-1'
      }
    }
  ];

  const notifications: SmartNotification[] = [
    {
      id: 'ntf-1',
      userId: 'patient-1',
      title: 'Lab Report Completed',
      message: 'Your Complete Blood Count sample report is ready for download. Tap here to read your AI analysis.',
      type: 'report',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ntf-2',
      userId: 'patient-1',
      title: 'Queue Update Notification',
      message: 'Your token H1-E08 has moved to "Consultation Started". Dr. Rajesh Kumar is ready.',
      type: 'appointment',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ];

  return {
    users,
    hospitals,
    doctors,
    services,
    bookings,
    reviews,
    emergencies: [],
    reports,
    familyMembers,
    bloodDonors,
    bloodStocks,
    telemedicineSessions,
    notifications
  };
}

