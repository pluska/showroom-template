import React from 'react';
import { MessageCircle } from 'lucide-react';
import { AdviserData } from '@/data/advisers';

const FemaleAvatarIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 4C8 4 6 7 6 11C6 13 6.5 15 5.5 16.5C6.5 17.5 8 18.5 10 19V19.5C10 20.5 11 21.5 12 21.5C13 21.5 14 20.5 14 19.5V19C16 18.5 17.5 17.5 18.5 16.5C17.5 15 18 13 18 11C18 7 16 4 12 4Z" fill="currentColor" fillOpacity="0.8" />
        <path d="M9 13C9 15 10.5 17 12 17C13.5 17 15 15 15 13V12C15 10 13.5 8 12 8C10.5 8 9 10 9 12V13Z" fill="currentColor" fillOpacity="0.3" />
        <path d="M5 24C5 20 8 18.5 8 18.5L10 21H14L16 18.5C16 18.5 19 20 19 24H5Z" fill="currentColor" fillOpacity="0.6" />
        <path d="M10 18.5L12 21L14 18.5L12 19.5L10 18.5Z" fill="white" fillOpacity="0.5" />
    </svg>
);

const MaleAvatarIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M7 9C7 6 9 4 12 4C15 4 17 6 17 9C17 10 16.5 11 15.5 12V13C15.5 15.5 14 17.5 12 17.5C10 17.5 8.5 15.5 8.5 13V12C7.5 11 7 10 7 9Z" fill="currentColor" fillOpacity="0.8" />
        <path d="M8.5 13V12C9.5 13 10.5 13.5 12 13.5C13.5 13.5 14.5 13 15.5 12V13C15.5 15.5 14 17.5 12 17.5C10 17.5 8.5 15.5 8.5 13Z" fill="currentColor" fillOpacity="0.3" />
        <path d="M4 24C4 19 7 17.5 7 17.5L10 21H14L17 17.5C17 17.5 20 19 20 24H4Z" fill="currentColor" fillOpacity="0.6" />
        <path d="M12 17.5L10 21L12 24L14 21L12 17.5Z" fill="white" fillOpacity="0.5" />
    </svg>
);

interface AdviserProps {
  adviser: AdviserData;
  variant?: 'compact' | 'row';
}

// Un canal corporativo se identifica con su logotipo; solo los asesores con
// nombre llevan avatar de persona. Poner una silueta humana sobre "Titanio"
// haría pasar por asesor lo que es la central de una empresa.
const Avatar = ({ adviser, size }: { adviser: AdviserData; size: string }) => {
  if (adviser.logo) {
    return <img src={adviser.logo} alt={adviser.name} className={`${size} object-contain relative z-10`} />;
  }
  return adviser.gender === 'female'
    ? <FemaleAvatarIcon className={`${size} relative z-10`} />
    : <MaleAvatarIcon className={`${size} relative z-10`} />;
};

const Adviser: React.FC<AdviserProps> = ({ adviser, variant = 'compact' }) => {
  const whatsappUrl = `https://wa.me/${adviser.phone.replace(/\D/g, '')}?text=${encodeURIComponent(adviser.whatsappMessage)}`;

  if (variant === 'row') {
    return (
      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-6 bg-white p-6 rounded-3xl border border-transparent shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300 w-full"
      >
        <div className="relative w-20 h-20 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 group-hover:bg-gray-100 transition-colors shrink-0">
          <div className="absolute inset-0 bg-brand-primary/5 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500" />
          <Avatar adviser={adviser} size="w-12 h-12" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 border-4 border-white rounded-full flex items-center justify-center z-20 shadow-sm">
            <MessageCircle size={14} className="text-white fill-current" />
          </div>
        </div>
        
        <div className="flex flex-col text-left">
          <h3 className="text-gray-800 text-lg font-bold mb-0.5 group-hover:text-brand-primary transition-colors">{adviser.name}</h3>
          {adviser.role && (
            <p className="text-gray-500 text-[11px] leading-tight">{adviser.role}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-brand-primary font-bold text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
            <span>Contactar ahora</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center text-center gap-3 bg-white p-4 rounded-3xl border border-transparent shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300"
    >
      <div className="relative w-16 h-16 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 group-hover:bg-gray-100 transition-colors shrink-0">
        <div className="absolute inset-0 bg-brand-primary/5 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500" />
        <Avatar adviser={adviser} size="w-10 h-10" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center z-20 shadow-sm">
          <MessageCircle size={12} className="text-white fill-current" />
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <h3 className="text-gray-800 text-[11px] font-bold group-hover:text-brand-primary transition-colors uppercase tracking-wider">{adviser.name}</h3>
      </div>
    </a>
  );
};

export default Adviser;
