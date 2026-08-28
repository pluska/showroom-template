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
  // PLANTILLA — RELLENAR. Un asesor por canal de venta; se recorren siempre,
  // así que el array puede tener uno o siete. Con el array vacío, el bloque de
  // asesores no se pinta.
  //
  // `logo` es una ruta bajo public/ (ver public/README.md) y `phone` va en
  // formato internacional sin espacios: es lo que se le pasa a wa.me.
  {
    id: 'canal-1',
    name: 'RELLENAR Nombre',
    role: 'RELLENAR Canal de venta',
    logo: '/identity/realstate/logo.png',
    phone: '+00000000000',
    whatsappMessage: message,
  },
];
