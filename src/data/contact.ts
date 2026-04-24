export interface ContactConfig {
  title: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  officeHours: string;
  mapUrl: string;
  mapCoordinates: {
    lat: number;
    lng: number;
  };
  social: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  form: {
    labels: {
      name: string;
      lastName: string;
      docNumber: string;
      email: string;
      phone: string;
      preference: string;
      schedule: string;
      terms: string;
      auth: string;
    }
  }
}

export const contactConfig: ContactConfig = {
  title: "Agenda una visita",
  description: "Estamos listos para ayudarte a encontrar tu próximo hogar. Déjanos tus datos y nos pondremos en contacto contigo a la brevedad.",
  address: "Dirección del Proyecto\nPueblo Libre, Lima",
  phone: "+51 999 999 999",
  email: "ventas@proyecto.com",
  officeHours: "Lunes a Domingo de 10:00 am a 6:00 pm",
  mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.442!2d-77.067632!3d-12.07592!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDA0JzMzLjMiUyA3N8KwMDQnMDMuNSJX!5e0!3m2!1sen!2spe!4v1234567890",
  mapCoordinates: {
    lat: -12.07592, 
    lng: -77.067632
  },
  social: {
    facebook: "https://facebook.com/project",
    instagram: "https://instagram.com/project",
    tiktok: "https://tiktok.com/@project",
    whatsapp: "https://wa.me/51999999999"
  },
  form: {
    labels: {
      name: "Nombres",
      lastName: "Apellidos",
      docNumber: "Número de documento",
      email: "Email",
      phone: "Celular",
      preference: "Deseo ser contactado por",
      schedule: "Horario de preferencia",
      terms: "Acepto las Políticas de Privacidad y Términos y Condiciones",
      auth: "Autorizo a actividades de prospección comercial"
    }
  }
};
