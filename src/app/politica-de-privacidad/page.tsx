import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { privacyPolicySections } from '@/data/legal';
import config from '@/config/config';

export const metadata: Metadata = {
  title: `Políticas de Privacidad - ${config.appName}`,
  description: `Política de privacidad y tratamiento de datos personales de ${config.company.realStateName}.`,
};

export default function PoliticaDePrivacidadPage() {
  return <LegalPage title="Políticas de Privacidad" sections={privacyPolicySections} />;
}
