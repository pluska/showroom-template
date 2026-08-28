import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  users,
  availabilities,
  appointments,
  calendarTransfers,
} from "@/lib/db/schema";
import { and, isNull, ne, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date"); // e.g. "2026-06-12"
    const yearStr = searchParams.get("year"); // e.g. "2026"
    const monthStr = searchParams.get("month"); // e.g. "6" (1-12)
    const typeParam = searchParams.get("type"); // "VIRTUAL" | "IN_PERSON" (optional)
    const sellerIdParam = searchParams.get("sellerId"); // Filter by specific seller (optional)
    const sellersParam = searchParams.get("sellers"); // "true" to return active sellers list

    // Keep availability consistent with appointment creation: an availability
    // is only bookable for a meeting type if it matches that type or is "BOTH".
    const matchesType = (meetingType: string) =>
      !typeParam || meetingType === typeParam || meetingType === "BOTH";

    const db = await getDb();

    // CASE 0: Return active sellers list (public endpoint for booking UI)
    if (sellersParam === "true") {
      const activeSellers = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(isNull(users.deletedAt));

      // Only return sellers who have at least one availability configured
      const allAvails = await db.select().from(availabilities);
      const sellersWithAvailability = new Set(allAvails.map((av) => av.userId));

      const sellers = activeSellers
        .filter((s) => sellersWithAvailability.has(s.id))
        .map((s) => ({ id: s.id, name: s.name }));

      return NextResponse.json({ sellers });
    }

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
    
    // Filter by active sellers, and optionally by a specific seller
    let activeAvails = weeklyAvails.filter((av) => activeSellerIds.has(av.userId));
    if (sellerIdParam) {
      activeAvails = activeAvails.filter((av) => av.userId === sellerIdParam);
    }

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
      const targetDate = new Date(dateStr + "T00:00:00-05:00"); // Use Peru midnight
      const peruTargetDate = new Date(targetDate.getTime() - 5 * 3600000);
      const dayOfWeek = peruTargetDate.getUTCDay(); // Use Peru weekday

      // Fetch appointments on this day in Peru time
      const startOfDay = new Date(dateStr + "T00:00:00-05:00");
      const endOfDay = new Date(dateStr + "T23:59:59.999-05:00");

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

      // Filter availabilities for this day of the week and meeting type
      const dayAvails = activeAvails.filter(
        (av) => av.dayOfWeek === dayOfWeek && matchesType(av.meetingType)
      );

      const nowInPeru = new Date(Date.now() - 5 * 3600000);
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
        current.setUTCMinutes(current.getUTCMinutes() + (startH * 60 + startM));

        const endLimit = new Date(targetDate);
        endLimit.setUTCMinutes(endLimit.getUTCMinutes() + (endH * 60 + endM));

        while (current.getTime() < endLimit.getTime()) {
          const slotPeru = new Date(current.getTime() - 5 * 3600000);

          // Skip past slots
          if (slotPeru.getTime() <= nowInPeru.getTime()) {
            current.setUTCMinutes(current.getUTCMinutes() + duration);
            continue;
          }

          const timeLabel = `${String(slotPeru.getUTCHours()).padStart(2, "0")}:${String(slotPeru.getUTCMinutes()).padStart(2, "0")}`;

          // Check if this effective seller has a booking at this time
          const isBusy = dayAppointments.some((app) => {
            const appDate = new Date(app.date);
            const appPeruDate = new Date(appDate.getTime() - 5 * 3600000);
            const appTimeLabel = `${String(appPeruDate.getUTCHours()).padStart(2, "0")}:${String(appPeruDate.getUTCMinutes()).padStart(2, "0")}`;
            const appEffectiveSellerId = resolveEffectiveSeller(app.sellerId, targetDate);
            // Match same time label and seller (original or effective)
            return appTimeLabel === timeLabel && (appEffectiveSellerId === effectiveSellerId || app.sellerId === effectiveSellerId);
          });

          if (!isBusy) {
            availableHoursSet.add(timeLabel);
          }

          current.setUTCMinutes(current.getUTCMinutes() + duration);
        }
      }

      const hoursList = Array.from(availableHoursSet).sort();
      return NextResponse.json({ hours: hoursList });
    }

    // CASE 2: Get available days in a month
    if (yearStr && monthStr) {
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // 0-11
      const numDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

      const availableDays: number[] = [];

      // Fetch all appointments in this month to avoid repetitive DB queries in Peru timezone boundaries
      const startOfMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00-05:00`;
      const endOfMonthStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(numDays).padStart(2, '0')}T23:59:59.999-05:00`;
      const startOfMonth = new Date(startOfMonthStr);
      const endOfMonth = new Date(endOfMonthStr);

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

      const nowInPeru = new Date(Date.now() - 5 * 3600000);
      const todayInPeru = new Date(Date.UTC(nowInPeru.getUTCFullYear(), nowInPeru.getUTCMonth(), nowInPeru.getUTCDate()));

      for (let day = 1; day <= numDays; day++) {
        const currentDate = new Date(Date.UTC(year, month, day));
        // Skip past dates (only allow bookings for today onwards)
        if (currentDate.getTime() < todayInPeru.getTime()) {
          continue;
        }

        const dayOfWeek = currentDate.getUTCDay();
        const dayAvails = activeAvails.filter(
          (av) => av.dayOfWeek === dayOfWeek && matchesType(av.meetingType)
        );

        if (dayAvails.length === 0) continue;

        // Filter appointments on this specific day in Peru timezone
        const dayAppointments = monthAppointments.filter((app) => {
          const appDate = new Date(app.date);
          const appPeruDate = new Date(appDate.getTime() - 5 * 3600000);
          return (
            appPeruDate.getUTCFullYear() === year &&
            appPeruDate.getUTCMonth() === month &&
            appPeruDate.getUTCDate() === day
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

          let current = new Date(Date.UTC(year, month, day, 5, 0, 0, 0)); // 00:00 Peru is 05:00 UTC
          current.setUTCMinutes(current.getUTCMinutes() + (startH * 60 + startM));

          const endLimit = new Date(Date.UTC(year, month, day, 5, 0, 0, 0));
          endLimit.setUTCMinutes(endLimit.getUTCMinutes() + (endH * 60 + endM));

          while (current.getTime() < endLimit.getTime()) {
            const slotPeru = new Date(current.getTime() - 5 * 3600000);

            // Skip past slots
            if (slotPeru.getTime() <= nowInPeru.getTime()) {
              current.setUTCMinutes(current.getUTCMinutes() + duration);
              continue;
            }

            const timeLabel = `${String(slotPeru.getUTCHours()).padStart(2, "0")}:${String(slotPeru.getUTCMinutes()).padStart(2, "0")}`;

            const isBusy = dayAppointments.some((app) => {
              const appDate = new Date(app.date);
              const appPeruDate = new Date(appDate.getTime() - 5 * 3600000);
              const appTimeLabel = `${String(appPeruDate.getUTCHours()).padStart(2, "0")}:${String(appPeruDate.getUTCMinutes()).padStart(2, "0")}`;
              const appEffectiveSellerId = resolveEffectiveSeller(app.sellerId, currentDate);
              // Match same time label and seller (original or effective)
              return appTimeLabel === timeLabel && (appEffectiveSellerId === effectiveSellerId || app.sellerId === effectiveSellerId);
            });

            if (!isBusy) {
              dayHasFreeSlot = true;
              break;
            }

            current.setUTCMinutes(current.getUTCMinutes() + duration);
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
