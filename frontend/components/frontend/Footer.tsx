// components/Footer.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Leaf, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* 品牌信息 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <Leaf size={24} className="text-emerald-500" />
              <span className="text-xl font-bold">GreenLife<span className="text-emerald-500">Med</span></span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Providing compassionate, world-class healthcare to our community. Your health is our top priority.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-emerald-400 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-emerald-400 transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-emerald-400 transition-colors"><Instagram size={20} /></a>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/doctor" className="hover:text-emerald-400 transition-colors">Find a Doctor</Link>
              </li>
              <li>
                <Link href="/service" className="hover:text-emerald-400 transition-colors">Medical Services</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-emerald-400 transition-colors">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* 我们的服务 */}
          <div>
            <h3 className="text-white font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/service" className="hover:text-emerald-400 transition-colors">Telemedicine</Link></li>
              <li><Link href="/service" className="hover:text-emerald-400 transition-colors">Pediatrics</Link></li>
              <li><Link href="/service" className="hover:text-emerald-400 transition-colors">Cardiology</Link></li>
              <li><Link href="/service" className="hover:text-emerald-400 transition-colors">Laboratory Services</Link></li>
            </ul>
          </div>

          {/* 联系我们 */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>123 Health Avenue,<br/>Wellness District, CA 90210</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-emerald-500 shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-emerald-500 shrink-0" />
                <span>contact@greenlifemed.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* 底部版权信息 */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} GreenLife Medical Center. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};