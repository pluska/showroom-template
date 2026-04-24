import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: string;
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({ isOpen, onClose, unitId }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      // Reset after showing success
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', phone: '', email: '', message: '' });
        onClose();
      }, 2000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden scale-100 animate-fade-in-up">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="p-8">
            <div className="mb-6">
                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest mb-2">
                    Consulta
                </span>
                <h2 className="text-2xl font-light text-gray-900">
                   Unidad <span className="font-semibold">{unitId}</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Déjanos tus datos y un asesor te contactará a la brevedad.
                </p>
            </div>

            {submitted ? (
                <div className="bg-green-50 text-green-800 p-8 rounded-xl flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <Send size={20} className="text-green-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">¡Mensaje Enviado!</h3>
                    <p className="text-sm">Gracias por tu interés. Nos pondremos en contacto pronto.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nombre Completo</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA07A]/50 focus:border-[#BFA07A] transition-all"
                            placeholder="Tu nombre"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Teléfono</label>
                            <input 
                                type="tel" 
                                required
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA07A]/50 focus:border-[#BFA07A] transition-all"
                                placeholder="+54 9 ..."
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Email</label>
                            <input 
                                type="email" 
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA07A]/50 focus:border-[#BFA07A] transition-all"
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Mensaje</label>
                        <textarea 
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BFA07A]/50 focus:border-[#BFA07A] transition-all resize-none"
                            placeholder="Estoy interesado en esta unidad..."
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                        {isSubmitting ? (
                           <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                           <>Enviar Consulta <Send size={14} /></>
                        )}
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationModal;
