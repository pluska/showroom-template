import { auth } from "@/auth";
import { getProgressUpdates } from "@/app/actions/progress";
import ProgressDashboard from "@/components/dashboard/progress/ProgressDashboard";

export const runtime = "edge";

export const metadata = {
  title: "Gestión de Avances de Obra - Dashboard",
};

export default async function ProgressPage() {
  const session = await auth();
  
  const currentUser = {
    id: session?.user?.id || "mock-id",
    name: session?.user?.name || "Dev User",
    email: session?.user?.email || "dev@example.com",
    role: (session?.user?.role as string) || "SUPER_ADMIN",
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
