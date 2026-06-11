"use client";

import { signOut } from "next-auth/react";
import { User } from "lucide-react";
import ThemeToggle from "@/components/UI/ThemeToggle";

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <header className="bg-base-100 shadow-sm border-b px-6 h-[72px] flex justify-between items-center shrink-0">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center">
              <span className="text-xs uppercase leading-none">{user.name?.charAt(0) || "U"}</span>
            </div>
          </div>
          <div className="flex flex-col text-sm">
            <span className="font-semibold">{user.name}</span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn btn-sm btn-outline btn-error"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
