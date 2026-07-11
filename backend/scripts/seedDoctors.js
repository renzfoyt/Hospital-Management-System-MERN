import mongoose from "mongoose";
import dotenv from "dotenv";
import { Doctor } from "../models/Doctor.js";

dotenv.config();

// 👇 Edit/add entries as needed
const SAMPLE_DOCTORS = [
  {
    firstName: "Maria",
    lastName: "Santos",
    specialty: "Cardiology",
    subSpecialty: "Interventional Cardiology",
    department: "Cardiology",
    credentials: "MD, FPCP, FPCC",
    bio: "Specializes in adult cardiology and non-invasive cardiac diagnostics.",
    email: "m.santos@olivarezgeneral.ph",
    contactNumber: "09170000001",
    gender: "Female",
    clinicDays: ["Mon", "Wed", "Fri"],
    clinicHourIn: "8:00 AM",
    clinicHourOut: "5:00 PM",
    hmoAccepted: ["Maxicare", "Medicard"],
    availability: ["Mon 9AM-12PM", "Wed 1PM-5PM"],
    status: "active",
  },
  {
    firstName: "Juan",
    lastName: "Dela Cruz",
    specialty: "Pediatrics",
    subSpecialty: "Neonatology",
    department: "Pediatrics",
    credentials: "MD, FPPS",
    bio: "Focuses on newborn to adolescent care, well-child visits, and immunizations.",
    email: "j.delacruz@olivarezgeneral.ph",
    contactNumber: "09170000002",
    gender: "Male",
    clinicDays: ["Tue", "Thu"],
    clinicHourIn: "1:00 PM",
    clinicHourOut: "8:00 PM",
    hmoAccepted: ["Intellicare", "PhilHealth"],
    availability: ["Tue 9AM-12PM", "Thu 1PM-5PM"],
    status: "active",
  },
  {
    firstName: "Ana",
    lastName: "Reyes",
    specialty: "Dermatology",
    subSpecialty: "Cosmetic Dermatology",
    department: "Dermatology",
    credentials: "MD, FPDS",
    bio: "General and cosmetic dermatology for all ages.",
    email: "a.reyes@olivarezgeneral.ph",
    contactNumber: "09170000003",
    gender: "Female",
    clinicDays: ["Fri"],
    clinicHourIn: "9:00 AM",
    clinicHourOut: "3:00 PM",
    hmoAccepted: ["Maxicare", "Cocolife"],
    availability: ["Fri 9AM-3PM"],
    status: "active",
  },
  {
    firstName: "Carlos",
    lastName: "Villanueva",
    specialty: "OB-GYN",
    subSpecialty: "Maternal-Fetal Medicine",
    department: "Obstetrics & Gynecology",
    credentials: "MD, FPOGS",
    bio: "High-risk pregnancy management and general OB-GYN care.",
    email: "c.villanueva@olivarezgeneral.ph",
    contactNumber: "09170000004",
    gender: "Male",
    clinicDays: ["Mon", "Tue", "Sat"],
    clinicHourIn: "8:00 AM",
    clinicHourOut: "12:00 PM",
    hmoAccepted: ["Medicard", "PhilHealth"],
    availability: ["Mon 8AM-12PM", "Sat 8AM-12PM"],
    status: "active",
  },
  {
    firstName: "Bea",
    lastName: "Fernandez",
    specialty: "Orthopedics",
    subSpecialty: "Sports Medicine",
    department: "Orthopedics",
    credentials: "MD, PBOS",
    bio: "Manages sports injuries, fractures, and joint problems.",
    email: "b.fernandez@olivarezgeneral.ph",
    contactNumber: "09170000005",
    gender: "Female",
    clinicDays: ["Wed", "Thu"],
    clinicHourIn: "10:00 AM",
    clinicHourOut: "4:00 PM",
    hmoAccepted: ["Maxicare", "Intellicare", "Medicard"],
    availability: ["Wed 10AM-4PM", "Thu 10AM-4PM"],
    status: "active",
  },
  {
    firstName: "Ramon",
    lastName: "Torres",
    specialty: "Internal Medicine",
    subSpecialty: "Endocrinology",
    department: "Internal Medicine",
    credentials: "MD, FPCP",
    bio: "Diabetes, thyroid disorders, and general internal medicine.",
    email: "r.torres@olivarezgeneral.ph",
    contactNumber: "09170000006",
    gender: "Male",
    clinicDays: ["Mon", "Thu", "Sat"],
    clinicHourIn: "1:00 PM",
    clinicHourOut: "6:00 PM",
    hmoAccepted: ["PhilHealth", "Cocolife"],
    availability: ["Mon 1PM-6PM", "Thu 1PM-6PM"],
    status: "active",
  },
];

async function seedDoctors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    for (const doc of SAMPLE_DOCTORS) {
      const result = await Doctor.findOneAndUpdate(
        { firstName: doc.firstName, lastName: doc.lastName },
        { $set: doc },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      console.log(`Upserted: Dr. ${result.firstName} ${result.lastName}`);
    }

    console.log("Seeding complete.");
  } catch (error) {
    console.error("Error seeding doctors:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDoctors();