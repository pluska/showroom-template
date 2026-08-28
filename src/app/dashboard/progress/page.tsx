import { auth } from "@/auth";
import { getProgressUpdates } from "@/app/actions/progress";
import ProgressDashboard from "@/components/dashboard/progress/ProgressDashboard";


export const metadata = {
  title: "Gestión de Avances de Obra - Dashboard",
};

import { redirect } from "next/navigation";

export default async function ProgressPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }
  
  const currentUser = {
    id: session.user.id || "",
    name: session.user.name || "",
    email: session.user.email || "",
    role: (session.user.role as string) || "SELLER",
  };

  const updates = await getProgressUpdates();

  const serializedUpdates = updates.map((u) => ({
    id: u.id,
    title: u.title,
    date: new Date(u.date),
    mediaUrl: u.mediaUrl,
    description: u.description,
    createdAt: u.createdAt ? new Date(u.createdAt) : null,
    deletedAt: u.deletedAt ? new Date(u.deletedAt) : null,
  }));

  return (
    <ProgressDashboard 
      initialUpdates={serializedUpdates} 
      currentUser={currentUser} 
    />
  );
}
