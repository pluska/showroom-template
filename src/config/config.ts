export interface ConfigProps {
  appName: string;
  appDescription: string;
  domainName: string;
  resend: {
    fromNoReply: string;
    fromAdmin: string;
    supportEmail: string;
  };
  colors: {
    theme: "light" | "dark";
    main: string;
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
    email: string;
    website: string;
    buildingSocials: {
      facebook: string;
      instagram: string;
      tiktok: string;
    };
    realStateName: string;
    realStateSlogan: string;
    realStateSocials: {
      facebook: string;
      instagram: string;
      tiktok: string;
    };
    developer: string;
    developerSlogan: string;
    developerSocials: {
      facebook: string;
      instagram: string;
      tiktok: string;
    };
  };
}

const config: ConfigProps = {
  appName: "Project Name",
  appDescription: "Short project description goes here.",
  domainName: "project-domain.com",
  resend: {
    fromNoReply: `Project Name <noreply@project-domain.com>`,
    fromAdmin: `Admin at Project Name <admin@project-domain.com>`,
    supportEmail: "support@project-domain.com",
  },
  colors: {
    theme: "light",
    main: "#F59C1D", // Brand main color
  },
  auth: {
    loginUrl: "/api/auth/signin",
    callbackUrl: "/dashboard",
  },
  company: {
    name: "Company Name",
    address: "Company Address",
    buildingName: "Building Name",
    buildingAddress: "Building Address",
    email: "sales@project-domain.com",
    website: "https://project-domain.com/",
    buildingSocials: {
      facebook: "https://facebook.com/project",
      instagram: "https://instagram.com/project",
      tiktok: "https://tiktok.com/@project"
    },
    realStateName: "Real Estate Group",
    realStateSlogan: "Slogan of the real estate company",
    realStateSocials: {
      facebook: "https://facebook.com/realestate",
      instagram: "https://instagram.com/realestate",
      tiktok: "https://tiktok.com/@realestate"
    },
    developer: "Developer Name",
    developerSlogan: "Slogan of the developer",
    developerSocials: {
      facebook: "https://facebook.com/developer",
      instagram: "https://instagram.com/developer",
      tiktok: "https://tiktok.com/@developer"
    }
  }
};

export default config;
