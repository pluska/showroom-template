"use client";
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { contactConfig } from '@/data/contact';
import { Mail, Phone, MapPin, Send, Facebook, Instagram } from 'lucide-react';

const ContactPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      // Simulate API
      setTimeout(() => {
          setIsSubmitting(false);
          setSubmitted(true);
      }, 1500);
  };

  return (
    <div className="h-full w-full bg-white relative overflow-hidden font-sans flex flex-col md:flex-row">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Menu Trigger */}
      <div className="fixed top-6 left-6 z-50 group">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-white bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full transition-all hover:scale-105 cursor-pointer shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-secondary tracking-wider uppercase">
            Menú
        </span>
      </div>

      <div className="fixed top-6 right-6 z-50">
        <FullScreenToggle />
      </div>

      {/* Main Content Split */}
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">
          
          {/* Left: Info & Form */}
          <div className="flex-1 p-8 lg:p-24 flex flex-col justify-center max-w-2xl mx-auto lg:mx-0">
              
              <div className="mb-12">
                  <span className="text-brand-primary font-bold tracking-widest uppercase text-xs mb-2 block">Contacto</span>
                  <h1 className="text-4xl lg:text-5xl font-light text-neutral-900 mb-6">{contactConfig.title}</h1>
                  <p className="text-neutral-500 leading-relaxed font-light text-lg">
                      {contactConfig.description}
                  </p>
              </div>

              {submitted ? (
                  <div className="bg-green-50 text-green-800 p-8 rounded-2xl flex flex-col items-center text-center border border-green-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Send size={24} className="text-green-600" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">¡Mensaje Enviado!</h3>
                    <p className="text-neutral-600">Nos pondremos en contacto contigo a la brevedad.</p>
                    <button 
                        onClick={() => { setSubmitted(false); setFormData({name: '', email: '', phone: '', message: ''}); }}
                        className="mt-6 text-sm font-bold text-green-700 underline"
                    >
                        Enviar otro mensaje
                    </button>
                  </div>
              ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Nombre</label>
                              <input 
                                required
                                type="text"
                                className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent"
                                placeholder="Tu nombre completo"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Teléfono</label>
                              <input 
                                required
                                type="tel"
                                className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent"
                                placeholder="+54 9 ..."
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                              />
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Email</label>
                          <input 
                            required
                            type="email"
                            className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Mensaje</label>
                          <textarea 
                            required
                            rows={3}
                            className="w-full border-b border-gray-200 py-2 focus:outline-none focus:border-brand-primary transition-colors bg-transparent resize-none"
                            placeholder="¿En qué podemos ayudarte?"
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                          />
                      </div>

                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-4 bg-neutral-900 text-white font-bold uppercase tracking-widest text-sm rounded-full hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center gap-2"
                      >
                          {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                          {!isSubmitting && <Send size={16} />}
                      </button>
                  </form>
              )}

              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                      <h4 className="flex items-center gap-2 font-bold text-neutral-900 mb-2">
                          <MapPin size={18} className="text-brand-primary" />
                          Oficina de Ventas
                      </h4>
                      <p className="text-sm text-neutral-500 font-light leading-relaxed whitespace-pre-line">
                          {contactConfig.address}
                      </p>
                  </div>
                  <div>
                      <h4 className="flex items-center gap-2 font-bold text-neutral-900 mb-2">
                          <Phone size={18} className="text-brand-primary" />
                          Contacto
                      </h4>
                      <p className="text-sm text-neutral-500 font-light mb-1">{contactConfig.phone}</p>
                      <p className="text-sm text-neutral-500 font-light">{contactConfig.email}</p>
                      
                      <div className="flex gap-4 mt-4">
                          {contactConfig.social.facebook && (
                              <a href={contactConfig.social.facebook} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-blue-600 transition-colors">
                                  <Facebook size={20} />
                              </a>
                          )}
                          {contactConfig.social.instagram && (
                              <a href={contactConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-pink-600 transition-colors">
                                  <Instagram size={20} />
                              </a>
                          )}
                      </div>
                  </div>
              </div>

          </div>

          {/* Right: Map / Image */}
          <div className="lg:w-1/2 h-64 lg:h-full bg-neutral-100 relative">
              <iframe 
                src={contactConfig.mapUrl} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale hover:grayscale-0 transition-all duration-700"
              ></iframe>
          </div>

      </div>
    </div>
  );
};

export default ContactPage;
