// ============================================================================
// CANALES DE VENTA — los WhatsApp que atienden el proyecto
// ----------------------------------------------------------------------------
// Se muestran en "Elige tu asesor" de la página de contacto
// (src/app/contact/page.tsx). Los usuarios de la tabla `users` (rol SELLER)
// son otra cosa: sirven para asignar citas en el calendario, no para este
// listado público.
//
// Ojo con qué son estas entradas: el cliente no entregó asesores con nombre y
// apellido, sino los CANALES DE VENTA de cada empresa del grupo (formulario de
// inicio, sección 3). Por eso llevan `logo` en vez de `gender`: la ficha pinta
// el logotipo de la empresa y no un avatar de persona, que sería engañoso.
// Si más adelante llegan asesores con nombre, basta con darles `gender` y
// omitir `logo`.
// ============================================================================

import config from "@/config/config";

export interface AdviserData {
  id: string;
  name: string;
  role: string;
  /** Avatar de persona. Solo para asesores con nombre. */
  gender?: 'male' | 'female';
  /** Logotipo de la empresa, para canales corporativos. Tiene prioridad. */
  logo?: string;
  phone: string;
  email?: string;
  whatsappMessage: string;
}

const message = `Hola, vengo desde la web de ${config.company.buildingName}, deseo más información.`;

export const advisersData: AdviserData[] = [
  {
    id: 'oi-diamante-olimpo',
    name: 'OI Diamante / Olimpo',
    role: 'Canal de venta del proyecto',
    logo: '/identity/olimpo/logo.png',
    phone: '+51908922045',
    whatsappMessage: message,
  },
  {
    id: 'oi-tumbes',
    name: 'OI Tumbes',
    role: 'Soluciones Inmobiliarias',
    logo: '/identity/titanes/soluciones.png',
    phone: '+51938562802',
    whatsappMessage: message,
  },
  {
    id: 'titan',
    name: 'Titán',
    role: 'Titán Inmobiliaria',
    logo: '/identity/titanes/titan.png',
    phone: '+51953767985',
    whatsappMessage: message,
  },
  {
    id: 'titanio',
    name: 'Titanio',
    role: 'Titanio',
    logo: '/identity/titanes/titanio.png',
    phone: '+51966470254',
    whatsappMessage: message,
  },
];
