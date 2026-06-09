import { auth } from "@/auth";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // TEMPORARY: Disable auth check for UI development
  /*
  if (!session) {
    redirect("/login");
  }
  */

  // Use real session if available, otherwise mock it
  const mockUser = {
    name: session?.user?.name || "Dev User",
    email: session?.user?.email || "dev@example.com",
    role: (session?.user?.role as string) || "ADMIN",
  };

  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar role={mockUser.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={mockUser} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-base-200 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
