import { auth } from "@/auth";
import CalendarDashboard from "@/components/dashboard/calendar/CalendarDashboard";
import { Calendar } from "lucide-react";


export const metadata = {
  title: "Calendario de Citas - Dashboard",
};

import { redirect } from "next/navigation";

export default async function CalendarPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const currentUser = {
    id: session.user.id || "",
    role: (session.user.role as string) || "SELLER",
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
          <Calendar className="w-6 h-6 text-brand-orange animate-pulse" />
          Calendario
        </h1>
        <p className="text-gray-500 text-sm font-secondary">
          Gestiona la agenda de citas presenciales o virtuales con prospectos.
        </p>
      </div>

      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 min-h-[500px]">
        <CalendarDashboard currentUserId={currentUser.id} currentUserRole={currentUser.role} />
      </div>
    </div>
  );
}
