import { Doctor, ServiceItem, BlogPost, Testimonial, Department, FAQItem } from '@/types/frontend/types';
import { Stethoscope, Activity, Heart, Eye, Baby, Brain, Microscope, Pill, Bone, ActivitySquare } from 'lucide-react';

export const DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    specialty: "Cardiology",
    image: "https://picsum.photos/id/1011/300/300",
    bio: "Over 15 years of experience in cardiovascular health. Board certified.",
    availability: "Mon, Wed, Fri"
  },
  {
    id: 2,
    name: "Dr. James Wilson",
    specialty: "Pediatrics",
    image: "https://picsum.photos/id/1025/300/300",
    bio: "Dedicated to the health and well-being of children and adolescents.",
    availability: "Mon - Thu"
  },
  {
    id: 3,
    name: "Dr. Elena Rodriguez",
    specialty: "Neurology",
    image: "https://picsum.photos/id/1012/300/300",
    bio: "Specializing in migraines, epilepsy, and neurodegenerative disorders.",
    availability: "Tue, Thu, Sat"
  },
  {
    id: 4,
    name: "Dr. Mark Stevens",
    specialty: "Orthopedics",
    image: "https://picsum.photos/id/1005/300/300",
    bio: "Expert in sports injuries and joint replacement surgeries.",
    availability: "Wed, Fri"
  },
  {
    id: 5,
    name: "Dr. Emily Blunt",
    specialty: "General Practice",
    image: "https://picsum.photos/id/338/300/300",
    bio: "Providing comprehensive primary care for families and individuals.",
    availability: "Mon, Tue, Wed, Thu, Fri"
  }
];

export const DEPARTMENTS: Department[] = [
  { id: 'Cardiology', name: 'Cardiology', icon: Heart, description: 'Heart & Vascular Care' },
  { id: 'Pediatrics', name: 'Pediatrics', icon: Baby, description: 'Child & Adolescent Care' },
  { id: 'Neurology', name: 'Neurology', icon: Brain, description: 'Brain & Spine Disorders' },
  { id: 'Orthopedics', name: 'Orthopedics', icon: Bone, description: 'Bones & Joints' },
  { id: 'General Practice', name: 'General Practice', icon: Stethoscope, description: 'Primary Care' },
  { id: 'Laboratory', name: 'Laboratory', icon: Microscope, description: 'Diagnostics & Testing' },
];

export const SERVICES: ServiceItem[] = [
  {
    id: 1,
    title: "General Checkup",
    description: "Comprehensive physical examinations and preventative care.",
    priceRange: "$50 - $150",
    icon: Stethoscope
  },
  {
    id: 2,
    title: "Cardiology",
    description: "Heart screenings, ECG, and cardiovascular consultations.",
    priceRange: "$150 - $400",
    icon: Heart
  },
  {
    id: 3,
    title: "Pediatrics",
    description: "Vaccinations, growth monitoring, and child sickness care.",
    priceRange: "$60 - $200",
    icon: Baby
  },
  {
    id: 4,
    title: "Neurology",
    description: "Advanced diagnostics for nervous system disorders.",
    priceRange: "$200 - $500",
    icon: Brain
  },
  {
    id: 5,
    title: "Laboratory",
    description: "Full-service blood work, urinalysis, and pathology.",
    priceRange: "$30 - $300",
    icon: Microscope
  },
  {
    id: 6,
    title: "Pharmacy",
    description: "On-site and online prescription fulfillment.",
    priceRange: "Varies",
    icon: Pill
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "10 Tips for a Heart-Healthy Diet",
    excerpt: "Learn which foods can help lower your cholesterol and improve heart function.",
    date: "Oct 12, 2023",
    category: "Nutrition",
    image: "https://picsum.photos/id/1080/600/400"
  },
  {
    id: 2,
    title: "Understanding Seasonal Allergies",
    excerpt: "Why do we get allergies and how can we manage them effectively this spring?",
    date: "Sep 28, 2023",
    category: "Wellness",
    image: "https://picsum.photos/id/1060/600/400"
  },
  {
    id: 3,
    title: "The Importance of Regular Screening",
    excerpt: "Early detection saves lives. Find out which screenings you need at your age.",
    date: "Sep 15, 2023",
    category: "Prevention",
    image: "https://picsum.photos/id/1050/600/400"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Alice M.",
    comment: "The staff was incredibly friendly and Dr. Chen took the time to explain everything clearly.",
    rating: 5
  },
  {
    id: 2,
    name: "Robert P.",
    comment: "Online booking was a breeze. Very modern facility.",
    rating: 5
  },
  {
    id: 3,
    name: "Jiang L.",
    comment: "Telemedicine service saved me a trip when I was feeling too sick to drive.",
    rating: 4
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "How do I make an appointment?",
    answer: "You can book an appointment online through our 'Book Appointment' page, or by calling our reception desk. We also accept walk-ins for emergencies."
  },
  {
    question: "Do you accept insurance?",
    answer: "Yes, we accept most major insurance plans. Please bring your insurance card with you to your visit. You can check our accepted insurance list on the Services page."
  },
  {
    question: "What should I bring to my first visit?",
    answer: "Please bring a valid photo ID, your insurance card, and a list of any current medications you are taking. If you have previous medical records, bringing them is also helpful."
  },
  {
    question: "How can I access my test results?",
    answer: "You can access your test results, prescription history, and medical records securely through our Patient Portal. You will need to register for an account first."
  },
  {
    question: "Do you offer telemedicine services?",
    answer: "Yes, we offer secure video consultations for many types of visits. You can select 'Telemedicine' when booking your appointment online."
  }
];
