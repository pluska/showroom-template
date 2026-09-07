"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import config from '@/config/config';
import type { LegalSection } from '@/data/legal';

interface LegalPageProps {
  title: string;
  sections: LegalSection[];
}

/**
 * Contenedor de las páginas legales (privacidad, términos).
 *
 * El body de la app es `overflow-hidden` a pantalla completa, así que el
 * scroll tiene que vivir aquí dentro y no en la ventana.
 */
const LegalPage = ({ title, sections }: LegalPageProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-full w-full relative font-sans flex text-gray-800 bg-gray-50">
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

      <div className="relative z-10 w-full h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-24 pb-16">

          <header className="mb-10 border-b border-gray-200 pb-8">
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-secondary font-bold mb-3">
              {config.company?.realStateName}
            </p>
            <h1 className="text-brand-primary text-2xl sm:text-3xl font-bold uppercase tracking-wide font-secondary">
              {title}
            </h1>
          </header>

          <article className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-3 font-secondary">
                  {section.title}
                </h2>
                {section.body?.map((paragraph) => (
                  <p key={paragraph} className="text-gray-600 text-sm leading-relaxed mb-3">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="list-disc pl-5 space-y-1.5 mt-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="text-gray-600 text-sm leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                {section.footer?.map((paragraph) => (
                  <p key={paragraph} className="text-gray-600 text-sm leading-relaxed mt-3">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </article>

          <footer className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-primary text-[10px] uppercase font-bold tracking-widest transition-colors"
            >
              <ArrowLeft size={12} />
              Volver a contacto
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
