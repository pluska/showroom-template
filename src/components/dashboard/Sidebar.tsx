"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building,
  Image as ImageIcon,
  BookOpen,
  Hammer,
  Palette,
  Settings,
  Map as MapIcon,
  Video,
  Route,
  MonitorPlay,
  Box,
  Calendar,
  History,
} from "lucide-react";

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const navigation = [
    { name: "Métricas", href: "/dashboard", icon: LayoutDashboard, visible: true },
    { name: "Calendario", href: "/dashboard/calendar", icon: Calendar, visible: true },
    { name: "Usuarios", href: "/dashboard/users", icon: Users, visible: isAdmin },
    { name: "Unidades", href: "/dashboard/units", icon: Building, visible: true },
    { name: "Multimedia", href: "/dashboard/media", icon: ImageIcon, visible: true },
    { name: "Brochure", href: "/dashboard/brochure", icon: BookOpen, visible: true },
    { name: "Avances de Obra", href: "/dashboard/progress", icon: Hammer, visible: isAdmin },
    { name: "Identidad", href: "/dashboard/identity", icon: Palette, visible: isSuperAdmin },
    { name: "Features", href: "/dashboard/features", icon: Settings, visible: isSuperAdmin },
    { name: "Mapa", href: "/dashboard/map", icon: MapIcon, visible: isSuperAdmin },
    { name: "El Edificio", href: "/dashboard/building", icon: Building, visible: isSuperAdmin },
    { name: "Recorridos", href: "/dashboard/tours", icon: Route, visible: isSuperAdmin },
    { name: "Video y Amenidades", href: "/dashboard/video-amenities", icon: Video, visible: isSuperAdmin },
    { name: "Maqueta", href: "/dashboard/maqueta", icon: Box, visible: isSuperAdmin },
    { name: "Logs (Restaurar)", href: "/dashboard/logs", icon: History, visible: isSuperAdmin },
  ];

  return (
    <div className="w-64 bg-base-100 shadow-md flex flex-col h-full">
      <div className="px-6 h-[72px] border-b flex flex-col justify-center">
        <h2 className="text-xl font-bold text-primary leading-tight">Admin Panel</h2>
        <p className="text-xs text-gray-500 capitalize leading-none mt-1">Rol: {role.replace('_', ' ').toLowerCase()}</p>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="menu bg-base-100 w-full">
          {navigation.map(
            (item) =>
              item.visible && (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 hover:bg-base-200 ${
                      pathname === item.href ? "active font-bold text-primary bg-primary/10" : ""
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
          )}
        </ul>
      </div>
    </div>
  );
}
