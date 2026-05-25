"use client";

import { signOut } from "next-auth/react";
import { User } from "lucide-react";

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <header className="bg-base-100 shadow-sm border-b px-6 py-3 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-8">
              <span className="text-xs uppercase">{user.name?.charAt(0) || "U"}</span>
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
