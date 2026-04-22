// src/components/Section.tsx
import React from 'react';

interface SectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'alternate' | 'dark';
}

export const Section: React.FC<SectionProps> = ({ 
  id, className = '', children, title, subtitle, variant = 'default' 
}) => {
  const bgVariants = {
    default: "bg-white",
    alternate: "bg-gradient-to-b from-emerald-50/50 via-teal-50/30 to-white",
    dark: "bg-slate-900 text-white"
  };

  return (
    <section id={id} className={`relative py-12 md:py-20 lg:py-28 overflow-hidden ${bgVariants[variant]} ${className}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 tracking-tight text-slate-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-base md:text-lg lg:text-xl text-slate-500 leading-relaxed">
                {subtitle}
              </p>
            )}
            <div className="mt-6 mx-auto w-20 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"></div>
          </div>
        )}
        {children}
      </div>
    </section>
  );
};