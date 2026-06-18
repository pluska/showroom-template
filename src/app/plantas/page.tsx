import { redirect } from 'next/navigation';
import { getFloorsData } from '@/app/actions/units';

export default async function PlantasRedirect() {
  const floorsData = await getFloorsData();
  const defaultFloor = floorsData.find(f => f.id === '9') ? '9' : (floorsData[0]?.id || '1');
  redirect(`/plantas/${defaultFloor}`);
}
