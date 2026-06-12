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

  if (!session || !session.user) {
    redirect("/login");
  }

  const currentUser = {
    name: session.user.name || "Usuario",
    email: session.user.email || "",
    role: (session.user.role as string) || "SELLER",
  };

  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar role={currentUser.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={currentUser} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-base-200 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
