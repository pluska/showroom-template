"use client";

// ============================================================================
// GRUPO INMOBILIARIO — Titanes y las empresas que lo componen
// ----------------------------------------------------------------------------
// A diferencia de Océano, aquí detrás del proyecto no hay UNA inmobiliaria:
// hay un grupo (Titanes) formado por varias empresas. Este componente pinta
// esa jerarquía: el grupo arriba, sus miembros debajo.
//
// Los logos de los miembros van sobre una pastilla clara a propósito. Dos de
// ellos (JDM y Titanio) son azul marino y verde oscuro sobre transparente:
// puestos directamente sobre el panel oscuro del menú, desaparecen. La
// pastilla es lo que garantiza que los cuatro se lean, y sigue valiendo para
// los que entren después sin tener que mirar de qué color es cada uno.
//
// Nada asume que son cuatro: se recorre `config.company.realStateMembers`.
// ============================================================================

import config from '@/config/config';

const members = config.company?.realStateMembers ?? [];

export default function RealStateGroup({ compact = false }: { compact?: boolean }) {
  const groupName = config.company?.realStateName;
  const groupLogo = config.logos?.realStateWhite;

  if (!groupName && members.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      {groupLogo && (
        <a
          href={config.company?.realStateWebsite || undefined}
          target={config.company?.realStateWebsite ? '_blank' : undefined}
          rel="noopener noreferrer"
          title={groupName}
          className="transition-opacity hover:opacity-100 opacity-90"
        >
          <img
            src={groupLogo}
            alt={groupName}
            className={`${compact ? 'h-8' : 'h-10'} w-auto object-contain`}
          />
        </a>
      )}

      {members.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {members.map((member) => {
            const chip = (
              <span
                title={member.name}
                className="bg-white/92 rounded-md px-2 py-1 flex items-center justify-center transition-transform hover:scale-105"
              >
                <img
                  src={member.logo}
                  alt={member.name}
                  className={`${compact ? 'h-3.5' : 'h-4'} w-auto object-contain`}
                />
              </span>
            );

            // Sin web declarada el logotipo se muestra igual, pero sin enlace:
            // Titán y Titanio todavía no dieron la suya.
            return member.website ? (
              <a key={member.id} href={member.website} target="_blank" rel="noopener noreferrer">
                {chip}
              </a>
            ) : (
              <span key={member.id}>{chip}</span>
            );
          })}
        </div>
      )}
    </div>
  );
}
