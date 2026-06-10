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
    const dateStr = searchParams.get("date"); // e.g. "2026-06-12"
    const yearStr = searchParams.get("year"); // e.g. "2026"
    const monthStr = searchParams.get("month"); // e.g. "6" (1-12)

    const db = getDb();

    // 1. Fetch active sellers
    const activeSellers = await db
      .select({ id: users.id })
      .from(users)
      .where(isNull(users.deletedAt));
    const activeSellerIds = new Set(activeSellers.map((u) => u.id));

    if (activeSellerIds.size === 0) {
      return NextResponse.json({ days: [], hours: [] });
    }

    // 2. Fetch all weekly availabilities
    const weeklyAvails = await db
      .select()
      .from(availabilities);
    
    const activeAvails = weeklyAvails.filter((av) => activeSellerIds.has(av.userId));

    // 3. Fetch all calendar transfers
    const transfers = await db.select().from(calendarTransfers);

    // Helper to resolve the final seller responsible for a slot
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

    // CASE 1: Get available hours for a specific date
    if (dateStr) {
      const targetDate = new Date(dateStr + "T00:00:00");
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday...

      // Fetch appointments on this day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const dayAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            gte(appointments.date, startOfDay),
            lte(appointments.date, endOfDay),
            ne(appointments.status, "CANCELLED"),
            isNull(appointments.deletedAt)
          )
        );

      // Filter availabilities for this day of the week
      const dayAvails = activeAvails.filter((av) => av.dayOfWeek === dayOfWeek);

      const availableHoursSet = new Set<string>();

      for (const avail of dayAvails) {
        // Resolve who handles this slot on this day
        const effectiveSellerId = resolveEffectiveSeller(avail.userId, targetDate);
        if (!activeSellerIds.has(effectiveSellerId)) continue; // skip if receiver is inactive

        // Generate slots
        const [startH, startM] = avail.startTime.split(":").map(Number);
        const [endH, endM] = avail.endTime.split(":").map(Number);
        const duration = avail.slotDuration;

        let current = new Date(targetDate);
        current.setHours(startH, startM, 0, 0);

        const endLimit = new Date(targetDate);
        endLimit.setHours(endH, endM, 0, 0);

        while (current.getTime() < endLimit.getTime()) {
          const timeLabel = current.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          // Check if this effective seller has a booking at this time
          const isBusy = dayAppointments.some((app) => {
            const appDate = new Date(app.date);
            const appTimeLabel = appDate.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            // Match same time label and seller
            return appTimeLabel === timeLabel && app.sellerId === effectiveSellerId;
          });

          if (!isBusy) {
            availableHoursSet.add(timeLabel);
          }

          current.setMinutes(current.getMinutes() + duration);
        }
      }

      const hoursList = Array.from(availableHoursSet).sort();
      return NextResponse.json({ hours: hoursList });
    }

    // CASE 2: Get available days in a month
    if (yearStr && monthStr) {
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // 0-11
      const numDays = new Date(year, month + 1, 0).getDate();

      const availableDays: number[] = [];

      // Fetch all appointments in this month to avoid repetitive DB queries
      const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month, numDays, 23, 59, 59, 999);

      const monthAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            gte(appointments.date, startOfMonth),
            lte(appointments.date, endOfMonth),
            ne(appointments.status, "CANCELLED"),
            isNull(appointments.deletedAt)
          )
        );

      for (let day = 1; day <= numDays; day++) {
        const currentDate = new Date(year, month, day);
        // Skip past dates (only allow bookings for today onwards)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (currentDate.getTime() < today.getTime()) {
          continue;
        }

        const dayOfWeek = currentDate.getDay();
        const dayAvails = activeAvails.filter((av) => av.dayOfWeek === dayOfWeek);

        if (dayAvails.length === 0) continue;

        // Filter appointments on this specific day
        const dayAppointments = monthAppointments.filter((app) => {
          const appDate = new Date(app.date);
          return (
            appDate.getFullYear() === year &&
            appDate.getMonth() === month &&
            appDate.getDate() === day
          );
        });

        let dayHasFreeSlot = false;

        for (const avail of dayAvails) {
          const effectiveSellerId = resolveEffectiveSeller(avail.userId, currentDate);
          if (!activeSellerIds.has(effectiveSellerId)) continue;

          // Generate slots
          const [startH, startM] = avail.startTime.split(":").map(Number);
          const [endH, endM] = avail.endTime.split(":").map(Number);
          const duration = avail.slotDuration;

          let current = new Date(currentDate);
          current.setHours(startH, startM, 0, 0);

          const endLimit = new Date(currentDate);
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
              dayHasFreeSlot = true;
              break;
            }

            current.setMinutes(current.getMinutes() + duration);
          }

          if (dayHasFreeSlot) break;
        }

        if (dayHasFreeSlot) {
          availableDays.push(day);
        }
      }

      return NextResponse.json({ days: availableDays });
    }

    return NextResponse.json({ error: "Missing query parameters." }, { status: 400 });
  } catch (error: any) {
    console.error("Error calculating availability:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
