import { getProgressUpdates } from "@/app/actions/progress";
import ConstructionProgressClient, { ProgressUpdateClient } from "@/components/progress/ConstructionProgressClient";


export const metadata = {
  title: "Avance de Obra",
  description: "Revisa el avance mensual de la construcción de nuestro proyecto.",
};

const MONTHS_SPANISH = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const formatSpanishDateString = (dateVal: Date): string => {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS_SPANISH[d.getMonth()]} ${d.getFullYear()}`;
};

const getMediaType = (url: string): "image" | "video" => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  const lowercaseUrl = url.toLowerCase();
  if (videoExtensions.some(ext => lowercaseUrl.endsWith(ext))) {
    return "video";
  }
  return "image";
};

export default async function ConstructionProgressPage() {
  const updates = await getProgressUpdates();

  // Map updates to match the client-side properties
  const serializedUpdates: ProgressUpdateClient[] = updates.map((u) => ({
    id: u.id,
    title: u.title,
    date: formatSpanishDateString(u.date),
    description: u.description || "",
    mediaUrl: u.mediaUrl,
    mediaType: getMediaType(u.mediaUrl),
  }));

  // Reverse updates so they display chronologically or keep query sorting (descending by default from actions).
  // Note: the original page had March first then April (which is chronological ascending order: March 2026, April 2026).
  // Since getProgressUpdates returns descending order (newest first), we can reverse it for the client slideshow if we want chronological progression
  // Let's reverse it to have the timeline flow ascending (oldest to newest), matching the original mock array ordering!
  const chronologicalUpdates = [...serializedUpdates].reverse();

  return <ConstructionProgressClient initialUpdates={chronologicalUpdates} />;
}
