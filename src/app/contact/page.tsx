"use client";
import { useState } from 'react';
import { Facebook, Instagram, Menu } from 'lucide-react'; 
import { getAssetUrl } from '@/utils/assets';
import Sidebar from '@/components/layout/Sidebar';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import config from '@/config/config';
import Adviser from '@/components/Adviser';
import { advisersData } from '@/data/advisers';

const TikTokIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

const Contact = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [tempTime, setTempTime] = useState({ hour: '09', minute: '00', period: 'AM' });
  const [activeSection, setActiveSection] = useState<'form' | 'advisers'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    nombres: '',
    apellido: '',
    documentType: 'DNI',
    documentNumber: '',
    celular: '',
    email: '',
    project: config.company?.buildingName || 'Project Name',
    contactPreference: '',
    horarioHora: '',
    horarioMinuto: '',
    horarioPeriodo: 'AM',
    terms: false,
    auth: false,
    mensaje: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sanitization to prevent basic injection
  const sanitizeInput = (value: string) => {
    return value.replace(/[<>'"/]/g, "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-expect-error Checked property exists on target
    const checked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : sanitizeInput(value)
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        // Also clear main horario error if one of the parts is changed
        if (name === 'horarioHora' || name === 'horarioMinuto') delete newErrors.horario;
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Nombres & Apellidos: Letters only (and spaces/accents)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
    if (!formData.nombres.trim()) newErrors.nombres = 'El nombre es obligatorio.';
    else if (!nameRegex.test(formData.nombres)) newErrors.nombres = 'Nombre inválido.';

    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio.';
    else if (!nameRegex.test(formData.apellido)) newErrors.apellido = 'Apellido inválido.';

    // Document Validation
    if (!formData.documentNumber.trim()) {
        newErrors.documentNumber = 'Número de documento obligatorio.';
    } else {
        if (formData.documentType === 'DNI' && !/^\d{8}$/.test(formData.documentNumber)) {
            newErrors.documentNumber = 'DNI debe tener 8 dígitos.';
        } else if (formData.documentType === 'RUC' && !/^\d{11}$/.test(formData.documentNumber)) {
            newErrors.documentNumber = 'RUC debe tener 11 dígitos.';
        } else if (formData.documentType === 'CE' && !/^[a-zA-Z0-9]{9,12}$/.test(formData.documentNumber)) {
             newErrors.documentNumber = 'CE inválido.';
        }
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Email obligatorio.';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Email inválido.';

    // Contact Preference
    if (!formData.contactPreference) {
        newErrors.contactPreference = 'Seleccione medio de contacto.';
    } else if (['Llamada', 'Whatsapp'].includes(formData.contactPreference)) {
        if (!formData.celular.trim()) {
             newErrors.celular = 'Celular obligatorio para este medio.';
        }
    }

    // Horario
    if (!formData.horarioHora || !formData.horarioMinuto) {
        newErrors.horario = 'Indique hora y minutos.';
    }

    // Terms
    if (!formData.terms) {
        newErrors.terms = 'Debe aceptar las políticas.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        setIsSubmitting(true);
        const fullPayload = {
            ...formData,
            horario: `${formData.horarioHora}:${formData.horarioMinuto} ${formData.horarioPeriodo || 'AM'}`
        };
        
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullPayload)
            });

            if (response.ok) {
                alert('Gracias, tu mensaje ha sido enviado correctamente.');
                // Reset form
                setFormData({
                    nombres: '',
                    apellido: '',
                    documentType: 'DNI',
                    documentNumber: '',
                    celular: '',
                    email: '',
                    project: config.company?.buildingName || 'Project Name',
                    contactPreference: '',
                    horarioHora: '',
                    horarioMinuto: '',
                    horarioPeriodo: 'AM',
                    terms: false,
                    auth: false,
                    mensaje: ''
                });
            } else {
                const data = await response.json() as { error?: string };
                alert(`Error al enviar el mensaje: ${data.error || 'Intente nuevamente.'}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error de conexión. Por favor intente nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    } else {
        console.log('Validation Errors:', errors);
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden font-sans flex text-gray-800">
      
      {/* Sidebar & Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Menu Trigger (Top Left) */}
      <div className="fixed top-6 left-6 z-50 group">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-white bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full transition-all hover:scale-105 cursor-pointer shadow-lg"
        >
          <Menu size={24} />
        </button>
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-secondary tracking-wider uppercase">
          Menú
        </span>
      </div>

      {/* Full Screen Toggle (Top Right) */}
      <div className="fixed top-6 right-6 z-50">
           <FullScreenToggle />
      </div>

      {/* BACKGROUND LAYER (Video) */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={getAssetUrl('videos/walk.mp4')} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* CENTERED/RIGHT PANEL - Restored White Theme with New Form */}
      <div className="relative z-10 w-full md:w-[600px] lg:w-[650px] bg-white h-full ml-auto shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto">
        

        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex flex-col items-start shrink-0 space-y-3">
             <h1 className="text-brand-primary text-lg font-bold uppercase tracking-widest font-secondary">
                 Contacto
             </h1>
             
             <p className="text-gray-500 text-[10px] leading-relaxed">
                 {config.company?.buildingAddress || config.company?.address}
             </p>

             <div className="flex gap-4">
                 {config.company?.buildingSocials?.facebook && (
                    <a href={config.company.buildingSocials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-primary transition-colors"><Facebook size={18} /></a>
                 )}
                 {config.company?.buildingSocials?.instagram && (
                    <a href={config.company.buildingSocials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-primary transition-colors"><Instagram size={18} /></a>
                 )}
                 {config.company?.buildingSocials?.tiktok && (
                    <a href={config.company.buildingSocials.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-primary transition-colors"><TikTokIcon size={18} /></a>
                 )}
             </div>
        </div>

        {/* Content Area */}
        <div className="px-8 py-2">
          
          {activeSection === 'form' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-gray-800 font-bold mb-6 text-sm uppercase tracking-wider">¿Tienes alguna consulta?</h2>
               
               <form onSubmit={handleSubmit} className="space-y-4 pb-8">
                  
                  {/* Row 1: Name / Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <input 
                              name="nombres"
                              value={formData.nombres}
                              onChange={handleChange}
                              type="text" 
                              placeholder="Nombres *" 
                              className={`w-full border-b py-2 text-gray-800 text-sm focus:outline-none transition-colors placeholder:text-gray-400 ${errors.nombres ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`} 
                          />
                          {errors.nombres && <span className="text-[10px] text-red-500">{errors.nombres}</span>}
                      </div>
                      <div className="space-y-1">
                          <input 
                              name="apellido"
                              value={formData.apellido}
                              onChange={handleChange}
                              type="text" 
                              placeholder="Apellido *" 
                              className={`w-full border-b py-2 text-gray-800 text-sm focus:outline-none transition-colors placeholder:text-gray-400 ${errors.apellido ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`} 
                          />
                           {errors.apellido && <span className="text-[10px] text-red-500">{errors.apellido}</span>}
                      </div>
                  </div>

                  {/* Row 2: Document Type / Number */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <div className="relative">
                              <select 
                                  name="documentType"
                                  value={formData.documentType}
                                  onChange={handleChange}
                                  className="w-full border-b border-gray-200 py-2 text-gray-800 text-sm focus:outline-none focus:border-brand-primary transition-colors appearance-none bg-transparent cursor-pointer"
                              >
                                  <option value="DNI">DNI</option>
                                  <option value="RUC">RUC</option>
                                  <option value="CE">CE</option>
                              </select>
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                          </div>
                      </div>
                      <div className="space-y-1">
                          <input 
                              name="documentNumber"
                              value={formData.documentNumber}
                              onChange={handleChange}
                              type="tel" 
                              placeholder="Número de documento *" 
                              className={`w-full border-b py-2 text-gray-800 text-sm focus:outline-none transition-colors placeholder:text-gray-400 ${errors.documentNumber ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`} 
                          />
                          {errors.documentNumber && <span className="text-[10px] text-red-500">{errors.documentNumber}</span>}
                      </div>
                  </div>

                  {/* Row 3: Cell / Email */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <input 
                              name="celular"
                              value={formData.celular}
                              onChange={handleChange}
                              type="tel" 
                              placeholder={['Llamada', 'Whatsapp'].includes(formData.contactPreference) ? "Celular *" : "Celular (Opcional)"}
                              className={`w-full border-b py-2 text-gray-800 text-sm focus:outline-none transition-colors placeholder:text-gray-400 ${errors.celular ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`} 
                          />
                          {errors.celular && <span className="text-[10px] text-red-500">{errors.celular}</span>}
                      </div>
                      <div className="space-y-1">
                          <input 
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              type="email" 
                              placeholder="Email *" 
                              className={`w-full border-b py-2 text-gray-800 text-sm focus:outline-none transition-colors placeholder:text-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`} 
                          />
                          {errors.email && <span className="text-[10px] text-red-500">{errors.email}</span>}
                      </div>
                  </div>

                  {/* Deseo ser contactado por */}
                  <div className="space-y-1">
                      <div className="relative">
                          <select 
                              name="contactPreference"
                              value={formData.contactPreference}
                              onChange={handleChange}
                              className={`w-full border-b py-2 text-gray-800 text-sm focus:outline-none transition-colors appearance-none bg-transparent cursor-pointer ${errors.contactPreference ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`}
                          >
                              <option value="" disabled className="text-gray-400">Deseo ser contactado por *</option>
                              <option value="Llamada">Llamada</option>
                              <option value="Correo">Correo</option>
                              <option value="Whatsapp">Whatsapp</option>
                          </select>
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                      </div>
                      {errors.contactPreference && <span className="text-[10px] text-red-500">{errors.contactPreference}</span>}
                  </div>

                  {/* Horario (Custom Time Picker) */}
                  <div className="space-y-1 relative">
                       <p className="text-gray-400 text-xs mb-1">Horario de preferencia *</p>
                       
                       {/* Trigger Field */}
                       <button
                          type="button"
                          onClick={() => {
                              if (!isTimePickerOpen) {
                                  // Initialize temp state with current values or defaults
                                  setTempTime({
                                      hour: formData.horarioHora || '09',
                                      minute: formData.horarioMinuto || '00',
                                      period: formData.horarioPeriodo || 'AM'
                                  });
                              }
                              setIsTimePickerOpen(!isTimePickerOpen);
                          }}
                          className={`w-full border-b py-2 text-left text-sm focus:outline-none transition-colors flex justify-between items-center ${errors.horario ? 'border-red-500' : 'border-gray-200 hover:border-brand-primary'}`}
                       >
                          <span className={formData.horarioHora ? "text-gray-800" : "text-gray-400"}>
                              {formData.horarioHora && formData.horarioMinuto 
                                  ? `${formData.horarioHora}:${formData.horarioMinuto} ${formData.horarioPeriodo || 'AM'}` 
                                  : 'Seleccionar hora'}
                          </span>
                          <div className="text-gray-400">
                               <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                       </button>
                       
                       {errors.horario && <span className="text-[10px] text-red-500">{errors.horario}</span>}

                       {/* Popover */}
                       {isTimePickerOpen && (
                          <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 p-4 w-64 animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex items-center justify-center gap-3">
                                  
                                  {/* Hour Input */}
                                  <div className="flex flex-col items-center">
                                      <label className="text-[10px] text-gray-400 uppercase font-bold mb-1">Hora</label>
                                      <div className="flex flex-col items-center gap-1">
                                           <button 
                                              type="button"
                                              onClick={() => {
                                                  const current = parseInt(tempTime.hour) || 9;
                                                  const next = current >= 12 ? 1 : current + 1;
                                                  setTempTime(prev => ({ ...prev, hour: String(next).padStart(2, '0') }));
                                              }}
                                              className="text-gray-400 hover:text-brand-primary transition-colors"
                                           >
                                              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 7L6 2L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                           </button>
                                           
                                           <input 
                                              value={tempTime.hour}
                                              onChange={(e) => {
                                                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                                  if (val === '' || (parseInt(val) <= 12 && parseInt(val) > 0)) {
                                                      setTempTime(prev => ({ ...prev, hour: val }));
                                                  }
                                              }}
                                              onBlur={(e) => {
                                                  let val = parseInt(e.target.value) || 9;
                                                  if (val < 1) val = 1;
                                                  if (val > 12) val = 12;
                                                  setTempTime(prev => ({ ...prev, hour: String(val).padStart(2, '0') }));
                                              }}
                                              type="text"
                                              className="w-12 text-center font-bold text-xl text-gray-800 focus:outline-none border-b-2 border-transparent focus:border-brand-primary bg-transparent"
                                              placeholder="09"
                                           />

                                           <button 
                                              type="button"
                                              onClick={() => {
                                                  const current = parseInt(tempTime.hour) || 9;
                                                  const prevVal = current <= 1 ? 12 : current - 1;
                                                  setTempTime(prev => ({ ...prev, hour: String(prevVal).padStart(2, '0') }));
                                              }}
                                              className="text-gray-400 hover:text-brand-primary transition-colors"
                                           >
                                              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                           </button>
                                      </div>
                                  </div>

                                  <div className="text-gray-300 font-bold text-xl self-center pb-4">:</div>

                                  {/* Minute Input */}
                                  <div className="flex flex-col items-center">
                                      <label className="text-[10px] text-gray-400 uppercase font-bold mb-1">Min</label>
                                      <div className="flex flex-col items-center gap-1">
                                           <button 
                                              type="button"
                                              onClick={() => {
                                                  const current = parseInt(tempTime.minute) || 0;
                                                  const next = (current + 15) % 60;
                                                  setTempTime(prev => ({ ...prev, minute: String(next).padStart(2, '0') }));
                                              }}
                                              className="text-gray-400 hover:text-brand-primary transition-colors"
                                           >
                                              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 7L6 2L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                           </button>
                                           
                                           <input 
                                              value={tempTime.minute}
                                              onChange={(e) => {
                                                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                                                   if (val === '' || parseInt(val) < 60) {
                                                      setTempTime(prev => ({ ...prev, minute: val }));
                                                  }
                                              }}
                                              onBlur={(e) => {
                                                  const val = parseInt(e.target.value) || 0;
                                                  setTempTime(prev => ({ ...prev, minute: String(val).padStart(2, '0') }));
                                              }}
                                              type="text"
                                              className="w-12 text-center font-bold text-xl text-gray-800 focus:outline-none border-b-2 border-transparent focus:border-brand-primary bg-transparent"
                                              placeholder="00"
                                           />

                                           <button 
                                              type="button"
                                              onClick={() => {
                                                  const current = parseInt(tempTime.minute) || 0;
                                                  const prevVal = (current - 15 + 60) % 60;
                                                  setTempTime(prev => ({ ...prev, minute: String(prevVal).padStart(2, '0') }));
                                              }}
                                              className="text-gray-400 hover:text-brand-primary transition-colors"
                                           >
                                              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                           </button>
                                      </div>
                                  </div>

                                  {/* Period */}
                                  <div className="flex flex-col items-center">
                                      <label className="text-[10px] text-gray-400 uppercase font-bold mb-1">AM/PM</label>
                                      <div className="flex flex-col gap-2 pt-1">
                                          {['AM', 'PM'].map(p => (
                                              <button
                                                  key={p}
                                                  type="button"
                                                  onClick={() => {
                                                      setTempTime(prev => ({ ...prev, period: p }));
                                                  }}
                                                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${tempTime.period === p ? 'bg-brand-primary text-white shadow-md scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                              >
                                                  {p}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Done Button */}
                              <button
                                  type="button"
                                  onClick={() => {
                                      setFormData(prev => ({
                                          ...prev,
                                          horarioHora: tempTime.hour,
                                          horarioMinuto: tempTime.minute,
                                          horarioPeriodo: tempTime.period
                                      }));
                                      if (errors.horario) {
                                          setErrors(prev => {
                                              const newErrors = { ...prev };
                                              delete newErrors.horario;
                                              return newErrors;
                                          });
                                      }
                                      setIsTimePickerOpen(false);
                                  }}
                                  className="w-full mt-4 bg-gray-800 text-white py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors"
                              >
                                  Listo
                              </button>
                          </div>
                       )}
                       
                       {/* Backdrop to close when clicking outside */}
                       {isTimePickerOpen && (
                          <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsTimePickerOpen(false)}
                          />
                       )}
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3 pt-4">
                      <div className="flex flex-col gap-1">
                          <div className="flex items-start gap-3">
                              <input 
                                  name="terms"
                                  checked={formData.terms}
                                  onChange={handleChange}
                                  type="checkbox" 
                                  id="terms" 
                                  className="mt-1 w-4 h-4 border-gray-300 rounded text-brand-primary focus:ring-brand-primary cursor-pointer" 
                              />
                              <label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer select-none">
                                  Acepto las <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" className="underline font-bold text-gray-600 hover:text-brand-primary">Políticas de Privacidad</a> y <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="underline font-bold text-gray-600 hover:text-brand-primary">Términos y Condiciones</a> de {config.company?.realStateName}. *
                              </label>
                          </div>
                          {errors.terms && <span className="text-[10px] text-red-500 pl-7">{errors.terms}</span>}
                      </div>
                       <div className="flex items-start gap-3">
                          <input 
                              name="auth"
                              checked={formData.auth}
                              onChange={handleChange}
                              type="checkbox" 
                              id="auth" 
                              className="mt-1 w-4 h-4 border-gray-300 rounded text-brand-primary focus:ring-brand-primary cursor-pointer" 
                          />
                          <label htmlFor="auth" className="text-xs text-gray-500 cursor-pointer select-none">
                              Autorizo a {config.company?.realStateName} para que realice las actividades de prospección comercial y marketing descritas in las <a href="#" className="underline font-bold text-gray-600 hover:text-brand-primary">Políticas de Privacidad</a>
                          </label>
                      </div>
                  </div>

                  {/* Mensaje / Comentarios */}
                  <div className="space-y-1 pt-2">
                      <textarea 
                          name="mensaje"
                          value={formData.mensaje}
                          onChange={handleChange}
                          placeholder="Mensaje o comentarios adicionales (opcional)" 
                          className="w-full border-b border-gray-200 py-2 text-gray-800 text-sm focus:outline-none focus:border-brand-primary transition-colors placeholder:text-gray-400 min-h-[80px] resize-none" 
                      />
                  </div>

                  {/* Submit */}
                  <div className="space-y-4 mt-8">
                      <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-brand-primary hover:bg-brand-light-orange text-white font-secondary font-bold text-xs uppercase tracking-widest py-4 rounded-full transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isSubmitting ? 'Enviando...' : 'Enviar respuesta'}
                      </button>

                      <button 
                          type="button"
                          onClick={() => setActiveSection('advisers')}
                          className="w-full bg-white border border-gray-100 text-gray-800 font-secondary font-bold text-xs uppercase tracking-widest py-4 rounded-full transition-all hover:bg-gray-50 shadow-sm flex items-center justify-center gap-2"
                      >
                          Elige tu asesor
                      </button>
                  </div>
               </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-gray-800 font-bold text-sm uppercase tracking-wider">Asesores</h2>
                  <button 
                    onClick={() => setActiveSection('form')}
                    className="text-gray-400 hover:text-brand-primary text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Volver
                  </button>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                  {advisersData.map(adviser => (
                      <Adviser key={adviser.id} adviser={adviser} variant="row" />
                  ))}
               </div>
            </div>
          )}
        </div>



        {/* Footer info */}
        <div className="px-8 pb-4 mt-auto space-y-4 bg-gray-50/50">
             <div>
                <h3 className="text-gray-800 text-xs font-bold uppercase mb-2">{config.company?.realStateName}</h3>
                <p className="text-gray-500 text-[10px] leading-relaxed mb-2">
                    {config.company?.realStateSlogan}
                </p>
                <div className="flex gap-4">
                    {config.company?.realStateSocials?.facebook && (
                        <a href={config.company.realStateSocials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-primary transition-colors"><Facebook size={16} /></a>
                    )}
                    {config.company?.realStateSocials?.instagram && (
                        <a href={config.company.realStateSocials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-primary transition-colors"><Instagram size={16} /></a>
                    )}
                    {config.company?.realStateSocials?.tiktok && (
                        <a href={config.company.realStateSocials.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-primary transition-colors"><TikTokIcon size={16} /></a>
                    )}
                </div>
             </div>

             <div>
                <h3 className="text-gray-800 text-xs font-bold uppercase mb-2">{config.company?.developer}</h3>
                <p className="text-gray-500 text-[10px] leading-relaxed mb-2">
                    {config.company?.developerSlogan}
                </p>
                <div className="flex gap-4">
                    {config.company?.developerSocials?.facebook && (
                        <a href={config.company.developerSocials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-primary transition-colors"><Facebook size={16} /></a>
                    )}
                    {config.company?.developerSocials?.instagram && (
                        <a href={config.company.developerSocials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-primary transition-colors"><Instagram size={16} /></a>
                    )}
                    {config.company?.developerSocials?.tiktok && (
                        <a href={config.company.developerSocials.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-primary transition-colors"><TikTokIcon size={16} /></a>
                    )}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
