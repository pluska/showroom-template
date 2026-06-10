import { auth } from "@/auth";
import CalendarDashboard from "@/components/dashboard/calendar/CalendarDashboard";

export const runtime = "edge";

export const metadata = {
  title: "Calendario de Citas - Dashboard",
};

export default async function CalendarPage() {
  const session = await auth();

  const mockUser = {
    id: session?.user?.id || "mock-id",
    role: (session?.user?.role as string) || "SUPER_ADMIN",
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-primary text-brand-orange">Calendario</h1>
        <p className="text-gray-500 text-sm font-secondary">
          Gestiona la agenda de citas presenciales o virtuales con prospectos.
        </p>
      </div>

      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 min-h-[500px]">
        <CalendarDashboard currentUserId={mockUser.id} currentUserRole={mockUser.role} />
      </div>
    </div>
  );
}
