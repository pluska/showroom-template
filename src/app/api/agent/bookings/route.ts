import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  users,
  appointments,
  prospects,
  prospectUnits,
  availabilities,
  units,
} from "@/lib/db/schema";
import { eq, and, isNull, or, gte, lte } from "drizzle-orm";
import { Resend } from "resend";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const {
      lead_notion_id,
      nombre_cliente,
      email_cliente,
      start_time,
      propiedad_titulo,
      notas_visita,
    } = body;


    const db = await getDb();
    const bookingDate = new Date(start_time);

    // 1. Resolve Prospect
    let prospectId = lead_notion_id;
    if (!prospectId && email_cliente) {
      const existing = await db
        .select()
        .from(prospects)
        .where(eq(prospects.email, email_cliente.trim().toLowerCase()));
      if (existing.length > 0) {
        prospectId = existing[0].id;
      }
    }

    if (!prospectId) {
      // Create new prospect
      const cleanPhone = body.telefono_cliente || null;
      const cleanEmail = email_cliente ? email_cliente.trim().toLowerCase() : `prospect_${Date.now()}@sofia.temp`;
      const [newProspect] = await db
        .insert(prospects)
        .values({
          name: nombre_cliente || "Prospecto Sofia",
          email: cleanEmail,
          phone: cleanPhone,
        })
        .returning();
      prospectId = newProspect.id;
    }

    // 2. Resolve Unit ID of Interest
    let resolvedUnitId: string | null = null;
    let identifierStr = "";
    if (propiedad_titulo) {
      // Extract number from title, e.g. "Departamento 302" -> "302"
      const match = propiedad_titulo.match(/\d+/);
      if (match) {
        identifierStr = match[0];
        const dbUnits = await db
          .select()
          .from(units)
          .where(and(eq(units.identifier, identifierStr), isNull(units.deletedAt)));
        if (dbUnits.length > 0) {
          resolvedUnitId = dbUnits[0].id;
        }
      }
    }

    // Link prospect to unit if found
    if (prospectId && resolvedUnitId) {
      // Delete existing and insert new
      await db.delete(prospectUnits).where(eq(prospectUnits.prospectId, prospectId));
      await db.insert(prospectUnits).values({
        prospectId,
        unitId: resolvedUnitId,
      });
    }

    // 3. Resolve Assigned Seller
    let finalSellerId = "";
    const dayOfWeek = bookingDate.getDay();
    const timeStr = bookingDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Query weekly availability
    const availableSellers = await db
      .select({ userId: availabilities.userId })
      .from(availabilities)
      .where(
        and(
          eq(availabilities.dayOfWeek, dayOfWeek),
          lte(availabilities.startTime, timeStr),
          gte(availabilities.endTime, timeStr)
        )
      );

    const activeSellers = await db
      .select()
      .from(users)
      .where(isNull(users.deletedAt));

    const activeSellerIds = new Set(activeSellers.map((u) => u.id));
    const candidates = availableSellers
      .map((av) => av.userId)
      .filter((id) => activeSellerIds.has(id));

    if (candidates.length > 0) {
      finalSellerId = candidates[0];
    } else if (activeSellers.length > 0) {
      // Fallback: assign to the first active user
      finalSellerId = activeSellers[0].id;
    } else {
      throw new Error("No active users found in database to assign the booking.");
    }

    // 4. Create Appointment
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        sellerId: finalSellerId,
        type: "VIRTUAL", // Default type
        date: bookingDate,
        prospectName: nombre_cliente || "Prospecto Sofia",
        prospectEmail: email_cliente || null,
        prospectId,
        sendEmail: true,
        status: "SCHEDULED",
        notes: notas_visita || null,
      })
      .returning();

    // 5. Trigger Resend Email Notification (if configured)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && email_cliente) {
      try {
        const resend = new Resend(resendApiKey);
        const sellerArr = await db.select().from(users).where(eq(users.id, finalSellerId));
        const sellerName = sellerArr[0]?.name || "Asesor Inmobiliario";
        const sellerEmail = sellerArr[0]?.email || "ventas@santafe.com";

        await resend.emails.send({
          from: "Santa Fe 190 <no-reply@kayen.work>",
          to: [email_cliente.trim().toLowerCase()],
          subject: "Confirmación de Visita Virtual - Santa Fe 190",
          html: `
            <h3>¡Hola ${nombre_cliente}!</h3>
            <p>Tu visita virtual para el departamento <strong>${identifierStr || "Santa Fe"}</strong> ha sido agendada con éxito.</p>
            <p><strong>Fecha y hora:</strong> ${bookingDate.toLocaleString("es-ES", { timeZone: "America/Lima" })} (Hora de Lima)</p>
            <p><strong>Tu asesor:</strong> ${sellerName} (${sellerEmail})</p>
            <br/>
            <p>Saludos,<br/>Equipo Inmobiliario Santa Fe 190</p>
          `,
        });
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }

    return NextResponse.json({
      booking_uid: newAppointment.id,
      start: start_time,
      cliente: nombre_cliente,
      propiedad: propiedad_titulo || `Departamento ${identifierStr}`,
      estatus_lead: "Cita agendada",
      notion_actualizado: true,
    });
  } catch (error: any) {
    console.error("Error creating booking for agent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
