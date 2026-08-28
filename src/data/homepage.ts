import config from "@/config/config";

export interface HomepageData {
  hero: {
    logo: string;
    button: string;
  };
  intro: {
    poster: string;
    fallback?: string;
    video: string;
  };
  slides: {
    text: string;
    highlight?: string;
  }[];
}

export const homepageData: HomepageData = {
  hero: {
    logo: config.logos.projectWhite,
    button: "Entrar"
  },
  intro: {
    poster: "homepage/intro.webp",
    fallback: "homepage/fallback.webp",
    video: "homepage/intro_video.mp4"
  },
  // Descripciones comerciales entregadas por el cliente en el formulario de
  // inicio de proyecto (sección 7). Se transcriben LITERALES: las cifras son
  // compromisos comerciales —el bono de S/ 52,250, el tope de ingresos de
  // S/ 3,715, los 35 m² y los lotes desde 66 m²— y no se redondean ni se
  // reescriben. Lo único añadido es el corte `highlight`, que solo decide qué
  // parte de la frase va resaltada.
  slides: [
    {
      text: "{{highlight}} Un proyecto habitacional en el nuevo eje de desarrollo y crecimiento de Tumbes.",
      highlight: "Vive conectado en el Sector Puyango."
    },
    {
      text: "{{highlight}} con el Bono Techo Propio de S/ 52,250, en una urbanización formal, estructurada y segura.",
      highlight: "Tu casa propia es posible"
    },
    {
      text: "{{highlight}} 2 dormitorios, sala-comedor, cocina, baño, lavandería y estacionamiento en lotes desde 66 m².",
      highlight: "Distribución eficiente en 35 m²:"
    },
    {
      text: "{{highlight}} luz, agua y desagüe, además de áreas verdes, cancha deportiva y un moderno club house.",
      highlight: "Disfruta de servicios completos:"
    },
    {
      text: "{{highlight}} ideal para grupos familiares sin propiedades inscritas y con ingresos menores a S/ 3,715.",
      highlight: "Aplica a Techo Propio:"
    },
    {
      text: "{{highlight}} Casas de 35 m² en lotes desde 66 m², ubicadas estratégicamente junto al Aeropuerto Internacional.",
      highlight: "Asegura tu hogar en Tumbes."
    }
  ]
};
