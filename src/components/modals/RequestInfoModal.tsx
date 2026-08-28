import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createProspectAction } from '@/app/actions/calendar';
import config from '@/config/config';

interface RequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: string;
  unitIdentifier?: string;
  floorId: string;
}

export default function RequestInfoModal({ isOpen, onClose, unitId, unitIdentifier, floorId }: RequestInfoModalProps) {
  const [formData, setFormData] = useState({
    nombres: '',
    apellido: '',
    documentType: 'DNI',
    documentNumber: '',
    celular: '',
    email: '',
    contactPreference: '',
    horario: '',
    terms: false,
    auth: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;

    if (!formData.nombres.trim()) newErrors.nombres = 'Obligatorio';
    else if (!nameRegex.test(formData.nombres)) newErrors.nombres = 'Inválido';

    if (!formData.apellido.trim()) newErrors.apellido = 'Obligatorio';
    else if (!nameRegex.test(formData.apellido)) newErrors.apellido = 'Inválido';

    if (!formData.documentNumber.trim()) {
        newErrors.documentNumber = 'Obligatorio';
    } else {
        if (formData.documentType === 'DNI' && !/^\d{8}$/.test(formData.documentNumber)) newErrors.documentNumber = '8 dígitos';
        if (formData.documentType === 'RUC' && !/^\d{11}$/.test(formData.documentNumber)) newErrors.documentNumber = '11 dígitos';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Obligatorio';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Inválido';

    if (!formData.contactPreference) newErrors.contactPreference = 'Requerido';
    else if (['Llamada', 'Whatsapp'].includes(formData.contactPreference) && !formData.celular.trim()) {
        newErrors.celular = 'Requerido';
    }

    if (!formData.terms) newErrors.terms = 'Requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        setIsSubmitting(true);
        try {
            // 1. Guardar prospecto en la base de datos
            await createProspectAction({
                name: `${formData.nombres} ${formData.apellido}`,
                email: formData.email,
                phone: formData.celular,
                unitId: unitId
            });

            // 2. Enviar correo vía PHP Mailer (config.mailerUrl)
            if (config.mailerUrl) {
                await fetch(config.mailerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        nombreCompleto: `${formData.nombres} ${formData.apellido}`,
                        proyecto: config.company?.buildingName || config.appName,
                        unidad: unitIdentifier || unitId.replace(/^unit_\d+_/, '').replace(/^unit_pb_/, 'PB ').toUpperCase(),
                        piso: floorId,
                        unitId: unitId.replace('unit_', ''),
                        floorId
                    }),
                }).catch(e => console.error("Error al enviar vía mailer PHP:", e));
            }
        } catch (err) {
            console.error("Error storing prospect:", err);
        } finally {
            setIsSubmitting(false);
        }
        onClose();
        alert('Gracias, nos pondremos en contacto contigo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[90%] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 uppercase tracking-wide">Solicita información</h2>
            <p className="text-sm text-brand-primary mt-1 font-medium">
              Interés en Unidad {unitIdentifier || unitId.replace(/^unit_\d+_/, '').replace(/^unit_pb_/, 'PB ').toUpperCase()}, Piso {floorId}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Row 1: Names */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <input
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleChange}
                        placeholder="Nombres *"
                        className={`w-full px-0 py-2 border-b text-sm focus:outline-none transition-colors placeholder-gray-400 ${errors.nombres ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`}
                      />
                      {errors.nombres && <span className="text-[10px] text-red-500">{errors.nombres}</span>}
                  </div>
                  <div className="space-y-1">
                      <input
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleChange}
                        placeholder="Apellidos *"
                        className={`w-full px-0 py-2 border-b text-sm focus:outline-none transition-colors placeholder-gray-400 ${errors.apellido ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`}
                      />
                      {errors.apellido && <span className="text-[10px] text-red-500">{errors.apellido}</span>}
                  </div>
              </div>

              {/* Row 2: Document */}
              <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-1">
                      <select
                        name="documentType"
                        value={formData.documentType}
                        onChange={handleChange}
                        className="w-full px-0 py-2 border-b border-gray-200 text-sm focus:outline-none focus:border-brand-primary bg-transparent text-gray-700"
                      >
                          <option value="DNI">DNI</option>
                          <option value="RUC">RUC</option>
                          <option value="CE">CE</option>
                      </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                      <input
                        name="documentNumber"
                        value={formData.documentNumber}
                        onChange={handleChange}
                        placeholder="Nro. Documento *"
                        type="tel"
                        className={`w-full px-0 py-2 border-b text-sm focus:outline-none transition-colors placeholder-gray-400 ${errors.documentNumber ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`}
                      />
                      {errors.documentNumber && <span className="text-[10px] text-red-500">{errors.documentNumber}</span>}
                  </div>
              </div>

              {/* Row 3: Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <input
                        name="celular"
                        value={formData.celular}
                        onChange={handleChange}
                        placeholder="Celular"
                        type="tel"
                        className={`w-full px-0 py-2 border-b text-sm focus:outline-none transition-colors placeholder-gray-400 ${errors.celular ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`}
                      />
                      {errors.celular && <span className="text-[10px] text-red-500">{errors.celular}</span>}
                  </div>
                  <div className="space-y-1">
                      <input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email *"
                        type="email"
                        className={`w-full px-0 py-2 border-b text-sm focus:outline-none transition-colors placeholder-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`}
                      />
                      {errors.email && <span className="text-[10px] text-red-500">{errors.email}</span>}
                  </div>
              </div>

              {/* Row 4: Preferences */}
              <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <select
                        name="contactPreference"
                        value={formData.contactPreference}
                        onChange={handleChange}
                        className={`w-full px-0 py-2 border-b text-sm focus:outline-none bg-transparent transition-colors ${errors.contactPreference ? 'border-red-500' : 'border-gray-200 focus:border-brand-primary'}`}
                      >
                          <option value="" disabled className="text-gray-400">Medio de contacto *</option>
                          <option value="Llamada">Llamada</option>
                          <option value="Correo">Correo</option>
                          <option value="Whatsapp">Whatsapp</option>
                      </select>
                      {errors.contactPreference && <span className="text-[10px] text-red-500">{errors.contactPreference}</span>}
                   </div>
                   <div className="space-y-1">
                      <input
                        name="horario"
                        type="time"
                        value={formData.horario}
                        onChange={handleChange}
                        className="w-full px-0 py-2 border-b border-gray-200 text-sm focus:outline-none focus:border-brand-primary bg-transparent text-gray-700 placeholder-gray-400"
                        placeholder="Horario preferido"
                      />
                      <label className="text-[10px] text-gray-400">Horario de preferencia</label>
                   </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                 <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        name="terms"
                        id="terms" 
                        checked={formData.terms}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 accent-brand-primary"
                    />
                    <label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer select-none">
                      Acepto las <a href="#" className="underline font-bold hover:text-brand-primary">Políticas de Privacidad</a> y <a href="#" className="underline font-bold hover:text-brand-primary">Términos y Condiciones</a>. *
                    </label>
                 </div>
                 {errors.terms && <span className="text-[10px] text-red-500 block pl-7">{errors.terms}</span>}

                 <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        name="auth"
                        id="auth" 
                        checked={formData.auth}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 accent-brand-primary"
                    />
                    <label htmlFor="auth" className="text-xs text-gray-500 cursor-pointer select-none">
                      Autorizo el uso de mis datos para fines comerciales y prospección.
                    </label>
                 </div>
              </div>

              <div className="pt-4 pb-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-lg text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>

            </form>
        </div>
      </div>
    </div>
  );
}
