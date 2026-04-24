export interface HomepageData {
  hero: {
    logo: string;
    button: string;
  };
  intro: {
    poster: string;
    video: string;
  };
  slides: {
    text: string;
    highlight?: string;
  }[];
}

export const homepageData: HomepageData = {
  hero: {
    logo: "/identity/logo_homepage.png",
    button: "Entrar"
  },
  intro: {
    poster: "/intro.jpg",
    video: "/videos/walk.mp4"
  },
  slides: [
    {
      text: "{{highlight}} es un edificio boutique ubicado estratégicamente en el corazón de Pueblo Libre.",
      highlight: "Santa Fe 190"
    },
    {
      text: "Exclusividad de solo 15 departamentos, con áreas desde 52.90 m² hasta 134.50 m²."
    },
    {
      text: "Conectividad total en una zona tranquila, rodeada de parques y cerca de todo lo que necesitas."
    },
    {
      text: "Una propuesta moderna de 8 pisos que destaca por su diseño funcional y acabados contemporáneos."
    }
  ]
};
