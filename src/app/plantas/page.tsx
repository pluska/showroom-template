import { redirect } from 'next/navigation';
import { floorsData } from '@/data/floors';

export default function PlantasRedirect() {
  const defaultFloor = floorsData[0]?.id || '1';
  redirect(`/plantas/${defaultFloor}`);
}
