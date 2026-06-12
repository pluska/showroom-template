import { auth } from "@/auth";
import { Users, Building, Eye, FileText, LayoutDashboard } from "lucide-react";

export const metadata = {
  title: "Dashboard - Santa Fe 170",
};

export default async function DashboardPage() {
  const session = await auth();

  // Placeholder data for the metrics
  const stats = [
    { title: "Visitas Totales", value: "1,200", change: "+14%", icon: Eye, color: "text-brand-orange" },
    { title: "Prospectos (Formularios)", value: "45", change: "+5%", icon: FileText, color: "text-brand-light-orange" },
    { title: "Unidades Reservadas", value: "12", change: "+2%", icon: Building, color: "text-brand-dark-orange" },
    { title: "Vendedores Activos", value: "3", change: "0%", icon: Users, color: "text-brand-yellow" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-brand-orange animate-pulse" />
          Resumen de Actividad
        </h1>
        <p className="text-gray-500 text-sm font-secondary">Bienvenido de nuevo, {session?.user?.name}. Aquí tienes un vistazo general.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6 flex flex-row items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                <div className="text-2xl font-bold mt-1">{stat.value}</div>
                <div className="text-xs text-success mt-1">{stat.change} este mes</div>
              </div>
              <div className={`p-3 rounded-full bg-base-200 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Unidades Populares */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg border-b pb-2 font-primary text-brand-orange">Unidades Más Visitadas</h2>
            <div className="space-y-4 mt-2">
              {[
                { unit: "Apt 402 - Tipo 1", views: 342, progress: 85 },
                { unit: "Apt 1205 - Tipo 3", views: 289, progress: 70 },
                { unit: "Apt 301 - Tipo 2", views: 156, progress: 40 },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.unit}</span>
                    <span className="text-gray-500">{item.views} visitas</span>
                  </div>
                  <progress className="progress progress-warning w-full" value={item.progress} max="100"></progress>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Origen de Visitas */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg border-b pb-2 font-primary text-brand-orange">Dispositivos</h2>
            <div className="flex flex-col justify-center gap-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-orange"></div>
                  <span className="text-sm font-secondary">Móvil</span>
                </div>
                <span className="font-medium">65%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-light-orange"></div>
                  <span className="text-sm font-secondary">Escritorio</span>
                </div>
                <span className="font-medium">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-dark-orange"></div>
                  <span className="text-sm font-secondary">Tablet</span>
                </div>
                <span className="font-medium">5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
