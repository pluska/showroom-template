export interface ConfigProps {
  appName: string;
  appDescription: string;
  domainName: string;
  resend: {
    fromNoReply: string;
    fromAdmin: string;
    supportEmail: string;
  };
  mailerUrl: string;
  colors: {
    theme: "light" | "dark";
    main: string;
    /** Acento dorado del logotipo. */
    accent: string;
  };
  /**
   * Logotipos. Las variantes `*White` son monocromas, para fondos oscuros:
   * el logo a color es azul marino y sobre negro no se lee.
   */
  logos: {
    project: string;
    projectWhite: string;
    realState: string;
    realStateWhite: string;
    /**
     * Emblema cuadrado para el pin del mapa. El logotipo largo, metido en un
     * círculo de 80 px, no se lee. Si no se declara, se usa `project`.
     */
    mapPin?: string;
  };
  auth: {
    loginUrl: string;
    callbackUrl: string;
  };
  company: {
    name: string;
    address: string;
    buildingName: string;
    buildingAddress: string;
    /** [longitud, latitud] del proyecto. Centra el mapa y ancla el marcador. */
    buildingCoordinates: [number, number];
    email: string;
    website: string;
    maquetaUrl?: string;
    buildingSocials: {
      facebook: string;
      instagram: string;
      // Opcional: si la cuenta no existe se omite y el ícono no se renderiza.
      tiktok?: string;
    };
    /**
     * El grupo inmobiliario detrás del proyecto. En este proyecto NO es una
     * sola empresa: Titanes es un grupo y lo componen las de `realStateMembers`.
     */
    realStateName: string;
    realStateSlogan: string;
    realStateWebsite: string;
    realStateSocials: {
      facebook: string;
      instagram: string;
      tiktok?: string;
    };
    /**
     * Empresas que integran el grupo inmobiliario. Se recorren siempre: nada
     * asume que son cuatro.
     */
    realStateMembers: {
      id: string;
      name: string;
      /** Ruta bajo public/. */
      logo: string;
      /** Sin web, el logotipo se pinta pero no enlaza. */
      website?: string;
    }[];
    developer: string;
    developerSlogan: string;
    developerWebsite: string;
    developerSocials: {
      facebook: string;
      instagram: string;
      tiktok?: string;
    };
  };
}

// ============================================================================
// PLANTILLA — RELLENAR POR PROYECTO
// ----------------------------------------------------------------------------
// Este archivo es la ÚNICA fuente de la identidad del proyecto: nombre, marca,
// colores, correos, redes y grupo inmobiliario. Ningún componente debe
// hardcodear ninguno de estos valores; si hace falta uno nuevo, se añade a
// `ConfigProps` y se consume desde aquí.
//
// Todo lo que dice RELLENAR está vacío a propósito: la app compila y renderiza
// con textos y enlaces neutros, así que un valor olvidado se ve, no se cuela.
// Los enlaces vacíos no se pintan y los logos vacíos no rompen el layout.
//
// Ejemplo real y completo de este archivo: repositorio de El Olimpo de Tumbes.
// ============================================================================
const config: ConfigProps = {
  appName: "", // RELLENAR: "Urbanización <Nombre>"
  appDescription: "", // RELLENAR: una frase, se usa como <meta description>
  domainName: "", // RELLENAR: dominio sin protocolo
  // El dominio debe estar VERIFICADO en Resend: cualquier remitente que no
  // pertenezca a él es rechazado en el envío.
  resend: {
    fromNoReply: "", // RELLENAR: "<Proyecto> <noreply@dominio>"
    fromAdmin: "", // RELLENAR: "Admin <Proyecto> <admin@dominio>"
    supportEmail: "", // RELLENAR: buzón que recibe los formularios de contacto
  },
  // Mailer PHP propio del cliente. Si se deja vacío, el formulario cae a Resend.
  mailerUrl: process.env.NEXT_PUBLIC_MAILER_URL || "",
  // Muestrear del logotipo si el cliente no entrega manual de marca. Al
  // cambiarlos, actualizar también las variables equivalentes en globals.css.
  colors: {
    theme: "light",
    main: "#1f2937", // RELLENAR: color principal de marca
    accent: "#b08d57", // RELLENAR: acento de marca
  },
  // Rutas bajo public/. Las variantes *White son MONOCROMAS, para fondos
  // oscuros: un logo a color sobre negro no se lee. Ver public/README.md.
  logos: {
    project: "/identity/project/logo.png",
    projectWhite: "/identity/project/logo-white.png",
    realState: "/identity/realstate/logo.png",
    realStateWhite: "/identity/realstate/logo-white.png",
  },
  auth: {
    loginUrl: "/api/auth/signin",
    callbackUrl: "/dashboard",
  },
  company: {
    name: "", // RELLENAR
    address: "", // RELLENAR
    // `buildingName` se conserva por compatibilidad de interfaz con la variante
    // vertical: en un proyecto horizontal el "edificio" es la urbanización.
    buildingName: "", // RELLENAR
    buildingAddress: "", // RELLENAR
    // RELLENAR: [longitud, latitud]. Centra el mapa y ancla el marcador.
    // OJO con el orden: es lon/lat (GeoJSON), no lat/lon.
    buildingCoordinates: [0, 0],
    email: "", // RELLENAR
    website: "", // RELLENAR
    // Sin cuenta, se omite la clave y el ícono no se renderiza.
    buildingSocials: {
      facebook: "",
      instagram: "",
    },
    realStateName: "", // RELLENAR: la inmobiliaria o el grupo
    realStateSlogan: "", // RELLENAR
    realStateWebsite: "", // RELLENAR
    realStateSocials: {
      facebook: "",
      instagram: "",
    },
    // Empresas que integran el grupo inmobiliario, si es un grupo. Se recorren
    // siempre: nada asume cuántas son, y con el array vacío la sección no se
    // pinta. Sin `website`, el logotipo se muestra pero no enlaza.
    realStateMembers: [],
    // El estudio que construye el showroom. Se muestra en el pie.
    developer: "", // RELLENAR
    developerSlogan: "", // RELLENAR
    developerWebsite: "", // RELLENAR
    developerSocials: {
      facebook: "",
      instagram: "",
    },
  },
};

export default config;
