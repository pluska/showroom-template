import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { termsAndConditionsSections } from '@/data/legal';
import config from '@/config/config';

export const metadata: Metadata = {
  title: `Términos y Condiciones - ${config.appName}`,
  description: `Términos y condiciones de uso del sitio web de ${config.company.buildingName}.`,
};

export default function TerminosYCondicionesPage() {
  return <LegalPage title="Términos y Condiciones" sections={termsAndConditionsSections} />;
}
