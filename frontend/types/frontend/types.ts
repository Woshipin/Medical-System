import { LucideIcon } from "lucide-react";

export enum View {
  HOME = 'HOME',
  ABOUT = 'ABOUT',
  DEPARTMENTS = 'DEPARTMENTS',
  PROVIDERS = 'PROVIDERS',
  SERVICES = 'SERVICES',
  BLOG = 'BLOG',
  CONTACT = 'CONTACT',
  APPOINTMENT = 'APPOINTMENT',
  PROFILE  = 'PROFILE ',
  TELEMEDICINE = 'TELEMEDICINE',
  PAYMENT = 'PAYMENT',
  FAQ = 'FAQ',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER'
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  image: string;
  bio: string;
  availability: string;
}

export interface ServiceItem {
  id: number;
  title: string;
  description: string;
  priceRange: string;
  icon: LucideIcon;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
}

export interface Testimonial {
  id: number;
  name: string;
  comment: string;
  rating: number;
}

export interface Department {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}