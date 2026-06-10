"use client";
import { useState, useEffect, useTransition } from 'react';
import { Facebook, Instagram, Menu, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Mail, Phone, MapPin, Check, AlertTriangle, X } from 'lucide-react'; 
import { getAssetUrl } from '@/utils/assets';
import Sidebar from '@/components/layout/Sidebar';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import config from '@/config/config';
import Adviser from '@/components/Adviser';
import { advisersData } from '@/data/advisers';
import { createAppointment } from '@/app/actions/calendar';
import { getUnits } from '@/app/actions/units';

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
  const [activeSection, setActiveSection] = useState<'form' | 'advisers' | 'booking'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Custom Confirmation Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'validation';
    title: string;
    message: string;
    details?: {
      date?: string;
      time?: string;
      meetingType?: string;
    };
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

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

  // ----------------------------------------------------
  // PUBLIC CALENDAR BOOKING STATE (PHASE 2)
  // ----------------------------------------------------
  const [bookingYear, setBookingYear] = useState<number>(new Date().getFullYear());
  const [bookingMonth, setBookingMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>(''); // YYYY-MM-DD
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [selectedBookingHour, setSelectedBookingHour] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<number>(1); // 1: Pick day/hour, 2: Form
  const [unitsList, setUnitsList] = useState<any[]>([]);

  // Booking Form Fields
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingUnits, setBookingUnits] = useState<string[]>([]);
  const [bookingMeetingType, setBookingMeetingType] = useState<'VIRTUAL' | 'IN_PERSON'>('VIRTUAL');

  // Load Units List
  useEffect(() => {
    getUnits().then(data => setUnitsList(data.filter((u: any) => u.state !== 'COMMON_AREA'))).catch(err => console.error("Error loading units:", err));
  }, []);

  // Fetch Available Days when month/year changes
  useEffect(() => {
    if (activeSection === 'booking') {
      fetch(`/api/calendar/availability?year=${bookingYear}&month=${bookingMonth + 1}`)
        .then(res => res.json())
        .then((data: any) => {
          if (data.days) {
            setAvailableDays(data.days);
          }
        })
        .catch(err => console.error("Error fetching available days:", err));
    }
  }, [bookingYear, bookingMonth, activeSection]);

  // Fetch Available Hours when day selected
  const handleSelectDay = (day: number) => {
    const monthStr = String(bookingMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateFormatted = `${bookingYear}-${monthStr}-${dayStr}`;
    
    setSelectedBookingDate(dateFormatted);
    setSelectedBookingHour('');

    fetch(`/api/calendar/availability?date=${dateFormatted}`)
      .then(res => res.json())
      .then((data: any) => {
        if (data.hours) {
          setAvailableHours(data.hours);
        }
      })
      .catch(err => console.error("Error fetching hours:", err));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail) {
      setModalState({
        isOpen: true,
        type: 'validation',
        title: 'Campos Incompletos',
        message: 'Por favor, completa los campos obligatorios (*).'
      });
      return;
    }

    const [hours, minutes] = selectedBookingHour.split(':');
    const finalDate = new Date(selectedBookingDate + 'T00:00:00');
    finalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    setIsSubmitting(true);
    startTransition(async () => {
      try {
        await createAppointment({
          date: finalDate,
          type: bookingMeetingType,
          prospectName: bookingName,
          prospectEmail: bookingEmail,
          prospectPhone: bookingPhone || undefined,
          prospectAddress: bookingAddress || undefined,
          unitsOfInterest: bookingUnits,
          sendEmail: true,
        });

        const dateFormatted = new Date(selectedBookingDate + 'T00:00:00').toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        setModalState({
          isOpen: true,
          type: 'success',
          title: '¡Cita Confirmada!',
          message: 'Tu cita ha sido agendada con éxito. Te hemos enviado un correo de confirmación.',
          details: {
            date: dateFormatted,
            time: selectedBookingHour,
            meetingType: bookingMeetingType === 'VIRTUAL' ? 'Virtual (Enlace de videollamada)' : 'Presencial (En sala de ventas)'
          }
        });
        
        // Reset Booking Panel
        setBookingName('');
        setBookingEmail('');
        setBookingPhone('');
        setBookingAddress('');
        setBookingUnits([]);
        setSelectedBookingDate('');
        setSelectedBookingHour('');
        setBookingStep(1);
        setActiveSection('form'); // Back to contact form on success
      } catch (error: any) {
        setModalState({
          isOpen: true,
          type: 'error',
          title: 'Error de Reserva',
          message: 'No pudimos procesar tu cita en este momento: ' + error.message
        });
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  // Helper calendar days generator
  const getDaysInMonth = () => {
    const days = [];
    const date = new Date(bookingYear, bookingMonth, 1);
    
    // Previous month padding days
    const startDay = date.getDay(); // 0 is Sun, 1 is Mon...
    const prevMonthPadding = startDay === 0 ? 6 : startDay - 1; // Mon-first

    const prevYear = bookingMonth === 0 ? bookingYear - 1 : bookingYear;
    const prevMon = bookingMonth === 0 ? 11 : bookingMonth - 1;
    const numDaysPrev = new Date(prevYear, prevMon + 1, 0).getDate();

    for (let i = numDaysPrev - prevMonthPadding + 1; i <= numDaysPrev; i++) {
      days.push({ day: i, isCurrentMonth: false, fullDate: new Date(prevYear, prevMon, i) });
    }

    // Current month days
    const numDaysCurr = new Date(bookingYear, bookingMonth + 1, 0).getDate();
    for (let i = 1; i <= numDaysCurr; i++) {
      days.push({ day: i, isCurrentMonth: true, fullDate: new Date(bookingYear, bookingMonth, i) });
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (bookingMonth === 0) {
      setBookingMonth(11);
      setBookingYear(prev => prev - 1);
    } else {
      setBookingMonth(prev => prev - 1);
    }
    setSelectedBookingDate('');
    setAvailableHours([]);
    setSelectedBookingHour('');
  };

  const handleNextMonth = () => {
    if (bookingMonth === 11) {
      setBookingMonth(0);
      setBookingYear(prev => prev + 1);
    } else {
      setBookingMonth(prev => prev + 1);
    }
    setSelectedBookingDate('');
    setAvailableHours([]);
    setSelectedBookingHour('');
  };

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
        if (name === 'horarioHora' || name === 'horarioMinuto') delete newErrors.horario;
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;

    if (!formData.nombres.trim()) newErrors.nombres = 'El nombre es obligatorio.';
    else if (!nameRegex.test(formData.nombres)) newErrors.nombres = 'Nombre inválido.';

    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio.';
    else if (!nameRegex.test(formData.apellido)) newErrors.apellido = 'Apellido inválido.';

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Email obligatorio.';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Email inválido.';

    if (!formData.contactPreference) {
        newErrors.contactPreference = 'Seleccione medio de contacto.';
    } else if (['Llamada', 'Whatsapp'].includes(formData.contactPreference)) {
        if (!formData.celular.trim()) {
             newErrors.celular = 'Celular obligatorio para este medio.';
        }
    }

    if (!formData.horarioHora || !formData.horarioMinuto) {
        newErrors.horario = 'Indique hora y minutos.';
    }

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
                setModalState({
                  isOpen: true,
                  type: 'success',
                  title: '¡Mensaje Enviado!',
                  message: 'Gracias por contactarnos. Tu mensaje ha sido enviado correctamente y un asesor se comunicará contigo lo antes posible.'
                });
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
                setModalState({
                  isOpen: true,
                  type: 'error',
                  title: 'Error de Envío',
                  message: `Hubo un error al enviar el mensaje: ${data.error || 'Intente nuevamente.'}`
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setModalState({
              isOpen: true,
              type: 'error',
              title: 'Error de Conexión',
              message: 'Error de conexión. Por favor comprueba tu red e intente nuevamente.'
            });
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

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

      {/* CENTERED/RIGHT PANEL */}
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
          
          {/* SECTION 1: ORIGINAL CONTACT FORM */}
          {activeSection === 'form' && (
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

                  {/* Preference dropdown */}
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

                  {/* Horario Preference */}
                  <div className="space-y-1 relative">
                       <p className="text-gray-400 text-xs mb-1">Horario de preferencia *</p>
                       <button
                          type="button"
                          onClick={() => {
                              if (!isTimePickerOpen) {
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

                       {isTimePickerOpen && (
                          <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 p-4 w-64 animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex items-center justify-center gap-3">
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

                                  <div className="flex flex-col items-center">
                                      <label className="text-[10px] text-gray-400 uppercase font-bold mb-1">AM/PM</label>
                                      <div className="flex flex-col gap-2 pt-1">
                                          {['AM', 'PM'].map(p => (
                                              <button
                                                  key={p}
                                                  type="button"
                                                  onClick={() => setTempTime(prev => ({ ...prev, period: p }))}
                                                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${tempTime.period === p ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                              >
                                                  {p}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                              <button
                                  type="button"
                                  onClick={() => {
                                      setFormData(prev => ({
                                          ...prev,
                                          horarioHora: tempTime.hour,
                                          horarioMinuto: tempTime.minute,
                                          horarioPeriodo: tempTime.period
                                      }));
                                      setIsTimePickerOpen(false);
                                  }}
                                  className="w-full mt-4 bg-gray-800 text-white py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors"
                              >
                                  Listo
                              </button>
                          </div>
                       )}
                       {isTimePickerOpen && (
                          <div className="fixed inset-0 z-40" onClick={() => setIsTimePickerOpen(false)} />
                       )}
                  </div>

                  {/* Policies Checkbox */}
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
                                  Acepto las <a href="#" className="underline font-bold text-gray-600 hover:text-brand-primary">Políticas de Privacidad</a> y <a href="#" className="underline font-bold text-gray-600 hover:text-brand-primary">Términos y Condiciones</a> de {config.company?.realStateName}. *
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
                              Autorizo a {config.company?.realStateName} para que realice las actividades de prospección comercial y marketing descritas.
                          </label>
                      </div>
                  </div>

                  {/* Mensaje */}
                  <div className="space-y-1 pt-2">
                      <textarea 
                          name="mensaje"
                          value={formData.mensaje}
                          onChange={handleChange}
                          placeholder="Mensaje o comentarios adicionales (opcional)" 
                          className="w-full border-b border-gray-200 py-2 text-gray-800 text-sm focus:outline-none focus:border-brand-primary transition-colors placeholder:text-gray-400 min-h-[80px] resize-none" 
                      />
                  </div>

                  {/* Submit Button Controls */}
                  <div className="space-y-4 mt-8">
                      <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-brand-primary hover:bg-brand-light-orange text-white font-secondary font-bold text-xs uppercase tracking-widest py-4 rounded-full transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                          {isSubmitting ? 'Enviando...' : 'Enviar respuesta'}
                      </button>

                      <button 
                          type="button"
                          onClick={() => setActiveSection('booking')}
                          className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-secondary font-bold text-xs uppercase tracking-widest py-4 rounded-full transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                          <CalendarIcon size={14} /> Fija una cita con nosotros
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
          )}

          {/* SECTION 2: DYNAMIC CALENDAR BOOKING FORM (PHASE 2) */}
          {activeSection === 'booking' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
              <h2 className="text-gray-800 font-extrabold mb-4 text-sm uppercase tracking-wider text-primary">Fija una cita con nosotros</h2>
              
              {bookingStep === 1 ? (
                <div className="space-y-6">
                  {/* Calendar Month Selector */}
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="font-bold text-sm text-gray-800">
                      {monthNames[bookingMonth]} {bookingYear}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" onClick={handlePrevMonth} className="btn btn-circle btn-xs btn-ghost text-gray-500">
                        <ChevronLeft size={16} />
                      </button>
                      <button type="button" onClick={handleNextMonth} className="btn btn-circle btn-xs btn-ghost text-gray-500">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Weekday Names */}
                    <div className="grid grid-cols-7 text-center bg-gray-50 py-2 border-b border-gray-100 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                      {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map(name => (
                        <div key={name}>{name}</div>
                      ))}
                    </div>

                    {/* Month Days */}
                    <div className="grid grid-cols-7 bg-white text-center">
                      {getDaysInMonth().map((d, index) => {
                        const isAvailable = d.isCurrentMonth && availableDays.includes(d.day);
                        const isSelected = selectedBookingDate === `${bookingYear}-${String(bookingMonth + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;

                        return (
                          <div 
                            key={index} 
                            onClick={() => {
                              if (isAvailable) handleSelectDay(d.day);
                            }}
                            style={isSelected ? { backgroundColor: config.colors.main, color: '#ffffff' } : isAvailable ? { backgroundColor: `${config.colors.main}1A` } : undefined}
                            className={`h-11 flex items-center justify-center text-xs font-semibold border-b border-r border-gray-100 transition-all ${
                              !d.isCurrentMonth ? 'text-gray-300 bg-gray-50/20 pointer-events-none' : ''
                            } ${
                              isAvailable ? 'cursor-pointer hover:scale-[1.05] border-primary/20' : 'text-gray-400 pointer-events-none'
                            }`}
                          >
                            <span 
                              className={`w-7 h-7 flex items-center justify-center rounded-full ${
                                isAvailable && !isSelected ? 'text-primary font-bold' : ''
                              }`}
                              style={isAvailable && !isSelected ? { color: config.colors.main } : undefined}
                            >
                              {d.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hours Selection */}
                  {selectedBookingDate && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <h3 className="font-bold text-xs uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                        <Clock size={14} /> Horas Disponibles para el {new Date(selectedBookingDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </h3>

                      {availableHours.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {availableHours.map(hour => (
                            <button
                              key={hour}
                              type="button"
                              onClick={() => {
                                setSelectedBookingHour(hour);
                                setBookingStep(2);
                              }}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                                selectedBookingHour === hour 
                                  ? 'bg-gray-800 text-white border-gray-800 shadow-md scale-105'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              {hour}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No hay horarios disponibles para este día.</p>
                      )}
                    </div>
                  )}

                  {/* Back to Classic Contact Form Button */}
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setActiveSection('form')}
                      className="w-full bg-white border border-gray-200 text-gray-600 font-secondary font-bold text-xs uppercase tracking-widest py-3.5 rounded-full hover:bg-gray-50 transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      ¿Quieres que nosotros te contactemos?
                    </button>
                  </div>
                </div>
              ) : (
                // STEP 2: Fill Personal Information
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl space-y-1.5 text-xs text-gray-600">
                    <p className="font-extrabold text-gray-800 flex items-center gap-1.5"><CalendarIcon size={14} className="text-primary" /> Detalles de tu reserva:</p>
                    <p><strong>Fecha:</strong> {new Date(selectedBookingDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p><strong>Hora:</strong> {selectedBookingHour} hs</p>
                  </div>

                  <div className="form-control">
                    <input 
                      type="text" 
                      placeholder="Nombre Completo *"
                      value={bookingName}
                      onChange={(e) => setBookingName(sanitizeInput(e.target.value))}
                      className="w-full border-b border-gray-200 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-400 text-gray-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <input 
                        type="email" 
                        placeholder="Correo Electrónico *"
                        value={bookingEmail}
                        onChange={(e) => setBookingEmail(sanitizeInput(e.target.value))}
                        className="w-full border-b border-gray-200 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-400 text-gray-800"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <input 
                        type="tel" 
                        placeholder="Celular / Teléfono (Opcional)"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(sanitizeInput(e.target.value))}
                        className="w-full border-b border-gray-200 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-400 text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <input 
                      type="text" 
                      placeholder="Dirección Física (Opcional)"
                      value={bookingAddress}
                      onChange={(e) => setBookingAddress(sanitizeInput(e.target.value))}
                      className="w-full border-b border-gray-200 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder:text-gray-400 text-gray-800"
                    />
                  </div>

                  {/* Meeting Type Selection */}
                  <div className="form-control">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">Tipo de Reunión</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="bookingType"
                          checked={bookingMeetingType === "VIRTUAL"}
                          onChange={() => setBookingMeetingType("VIRTUAL")}
                          className="radio radio-primary radio-xs"
                        />
                        Reunión Virtual
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer">
                        <input
                          type="radio"
                          name="bookingType"
                          checked={bookingMeetingType === "IN_PERSON"}
                          onChange={() => setBookingMeetingType("IN_PERSON")}
                          className="radio radio-primary radio-xs"
                        />
                        Visita Presencial
                      </label>
                    </div>
                  </div>

                  {/* Units checklist */}
                  <div className="form-control">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">Unidades de interés</label>
                    <div className="border border-gray-150 rounded-xl p-3 max-h-24 overflow-y-auto grid grid-cols-3 gap-2">
                      {unitsList.map(u => (
                        <label key={u.id} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bookingUnits.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBookingUnits(prev => [...prev, u.id]);
                              } else {
                                setBookingUnits(prev => prev.filter(id => id !== u.id));
                              }
                            }}
                            className="checkbox checkbox-primary checkbox-xs"
                          />
                          {u.identifier}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit and Back */}
                  <div className="space-y-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-secondary font-bold text-xs uppercase tracking-widest py-4 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Confirmando...' : 'Confirmar cita'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="w-full bg-white border border-gray-200 text-gray-600 font-secondary font-bold text-xs uppercase tracking-widest py-3 rounded-full hover:bg-gray-50 transition-all flex items-center justify-center gap-1"
                    >
                      Atrás
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* SECTION 3: ADVISERS DISPLAY */}
          {activeSection === 'advisers' && (
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

      {/* Custom Confirmation Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Glassmorphic Backdrop */}
          <div 
            className="absolute inset-0 bg-black/45 backdrop-blur-md"
            onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
          />
          
          {/* Card Container */}
          <div className="relative bg-white/95 backdrop-blur-lg border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 transform scale-100 transition-all duration-350 animate-in zoom-in-95">
            {/* Header Icon */}
            <div className="flex justify-center">
              {modalState.type === 'success' ? (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center animate-bounce shadow-lg"
                  style={{ backgroundColor: `${config.colors.main}1E`, color: config.colors.main }}
                >
                  <Check size={32} strokeWidth={3} />
                </div>
              ) : modalState.type === 'error' ? (
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center animate-pulse shadow-lg">
                  <AlertTriangle size={32} strokeWidth={2} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-550 flex items-center justify-center shadow-lg animate-pulse">
                  <AlertTriangle size={32} strokeWidth={2} className="text-amber-500" />
                </div>
              )}
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900 font-secondary tracking-wide uppercase">
                {modalState.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed font-sans">
                {modalState.message}
              </p>
            </div>

            {/* Optional Details (e.g. Booking Details) */}
            {modalState.details && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left space-y-2 text-xs text-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 font-bold text-gray-800 border-b border-gray-150 pb-1.5 uppercase tracking-wide text-[10px]">
                  <CalendarIcon size={14} style={{ color: config.colors.main }} /> Detalles de la cita
                </div>
                <div>
                  <span className="text-gray-400 font-semibold uppercase tracking-wider text-[9px] block">Fecha:</span>
                  <span className="font-bold text-gray-800 capitalize">{modalState.details.date}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[9px] block">Hora:</span>
                    <span className="font-bold text-gray-800">{modalState.details.time} hs</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[9px] block">Modalidad:</span>
                    <span className="font-bold text-gray-800">{modalState.details.meetingType}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Accept Button */}
            <button
              onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
              style={{ backgroundColor: config.colors.main }}
              className="w-full hover:opacity-90 text-white font-secondary font-bold text-xs uppercase tracking-widest py-4 rounded-full transition-all shadow-md transform hover:scale-[1.02] cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
