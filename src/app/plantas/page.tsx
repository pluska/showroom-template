import { redirect } from 'next/navigation';
import { getFloorsData } from '@/app/actions/units';
import { getEntryFloorId } from '@/data/floors';

export default async function PlantasRedirect() {
  const floorsData = await getFloorsData();
  const defaultFloor = floorsData[floorsData.length - 1]?.id || getEntryFloorId();
  redirect(`/plantas/${defaultFloor}`);
}
