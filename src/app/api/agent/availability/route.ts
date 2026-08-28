import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  users,
  availabilities,
  appointments,
  calendarTransfers,
} from "@/lib/db/schema";
import { and, isNull, ne, gte, lte } from "drizzle-orm";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaInicioStr = searchParams.get("fecha_inicio"); // e.g. "2026-06-12" or "2026-06-12T00:00:00Z"
    const fechaFinStr = searchParams.get("fecha_fin");     // e.g. "2026-06-15" or "2026-06-15T23:59:59Z"

    if (!fechaInicioStr || !fechaFinStr) {
      return NextResponse.json({ error: "Missing fecha_inicio or fecha_fin." }, { status: 400 });
    }

    const startDate = new Date(fechaInicioStr.includes("T") ? fechaInicioStr : `${fechaInicioStr}T00:00:00`);
    const endDate = new Date(fechaFinStr.includes("T") ? fechaFinStr : `${fechaFinStr}T23:59:59`);

    const db = await getDb();

    // 1. Fetch active sellers
    const activeSellers = await db
      .select({ id: users.id })
      .from(users)
      .where(isNull(users.deletedAt));
    const activeSellerIds = new Set(activeSellers.map((u) => u.id));

    if (activeSellerIds.size === 0) {
      return NextResponse.json({ slots_disponibles: [], total: 0, resumen: "" });
    }

    // 2. Fetch all weekly availabilities
    const weeklyAvails = await db.select().from(availabilities);
    const activeAvails = weeklyAvails.filter((av) => activeSellerIds.has(av.userId));

    // 3. Fetch all calendar transfers
    const transfers = await db.select().from(calendarTransfers);

    const resolveEffectiveSeller = (origSellerId: string, date: Date): string => {
      let currentId = origSellerId;
      let visited = new Set<string>();
      const time = date.getTime();

      while (true) {
        if (visited.has(currentId)) break;
        visited.add(currentId);

        const activeT = transfers.find(
          (t) =>
            t.fromSellerId === currentId &&
            new Date(t.startDate).getTime() <= time &&
            new Date(t.endDate).getTime() >= time
        );

        if (activeT) {
          currentId = activeT.toSellerId;
        } else {
          break;
        }
      }
      return currentId;
    };

    // 4. Query appointments in range
    const rangeAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.date, startDate),
          lte(appointments.date, endDate),
          ne(appointments.status, "CANCELLED"),
          isNull(appointments.deletedAt)
        )
      );

    const slots: string[] = [];
    const slotsByDay: Record<string, string[]> = {};

    const tempDate = new Date(startDate);
    // Iterate day-by-day
    while (tempDate.getTime() <= endDate.getTime()) {
      const dayStr = tempDate.toISOString().split("T")[0];
      const dayOfWeek = tempDate.getDay();
      const dayAvails = activeAvails.filter((av) => av.dayOfWeek === dayOfWeek);

      const dayAppointments = rangeAppointments.filter((app) => {
        const appDate = new Date(app.date);
        return appDate.toISOString().split("T")[0] === dayStr;
      });

      const daySlotsSet = new Set<string>();

      for (const avail of dayAvails) {
        const effectiveSellerId = resolveEffectiveSeller(avail.userId, tempDate);
        if (!activeSellerIds.has(effectiveSellerId)) continue;

        const [startH, startM] = avail.startTime.split(":").map(Number);
        const [endH, endM] = avail.endTime.split(":").map(Number);
        const duration = avail.slotDuration;

        let current = new Date(tempDate);
        current.setHours(startH, startM, 0, 0);

        const endLimit = new Date(tempDate);
        endLimit.setHours(endH, endM, 0, 0);

        while (current.getTime() < endLimit.getTime()) {
          const timeLabel = current.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          const isBusy = dayAppointments.some((app) => {
            const appDate = new Date(app.date);
            const appTimeLabel = appDate.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            return appTimeLabel === timeLabel && app.sellerId === effectiveSellerId;
          });

          if (!isBusy) {
            daySlotsSet.add(timeLabel);
            const isoTime = `${dayStr}T${timeLabel}:00`;
            if (!slots.includes(isoTime)) {
              slots.push(isoTime);
            }
          }

          current.setMinutes(current.getMinutes() + duration);
        }
      }

      if (daySlotsSet.size > 0) {
        slotsByDay[dayStr] = Array.from(daySlotsSet).sort();
      }

      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Generate summary
    const summaryLines: string[] = [];
    const daysOfWeekNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    Object.entries(slotsByDay).sort().forEach(([dayStr, times]) => {
      const dateObj = new Date(`${dayStr}T00:00:00`);
      const dayName = daysOfWeekNames[dateObj.getDay()];
      summaryLines.push(`${dayName} (${dayStr}): ${times.join(", ")}`);
    });

    return NextResponse.json({
      slots_disponibles: slots.sort(),
      total: slots.length,
      resumen: summaryLines.join(" | ") || "No hay horarios disponibles.",
    });
  } catch (error: any) {
    console.error("Error fetching availability range for agent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
