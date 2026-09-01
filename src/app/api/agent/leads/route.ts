import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq, or, isNull } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { lead_notion_id, nombre, telefono, email, notas, temperatura, estatus } = body;


    const db = await getDb();

    // If email is not provided, generate a temporary unique one to satisfy DB constraint
    const cleanPhone = (telefono || "").trim();
    const generatedEmail = `tel_${cleanPhone.replace(/[^0-9]/g, "") || Math.floor(Math.random() * 1000000)}@sofia.temp`;
    const cleanEmail = (email && email.includes("@")) ? email.trim().toLowerCase() : generatedEmail;

    let leadId = lead_notion_id;

    if (leadId) {
      // Update existing lead
      await db
        .update(prospects)
        .set({
          name: nombre || undefined,
          phone: cleanPhone || undefined,
          email: (email && email.includes("@")) ? cleanEmail : undefined,
          updatedAt: new Date(),
        })
        .where(eq(prospects.id, leadId));
    } else {
      // Check if prospect already exists by phone or email
      const existing = await db
        .select()
        .from(prospects)
        .where(
          or(
            cleanPhone ? eq(prospects.phone, cleanPhone) : undefined,
            eq(prospects.email, cleanEmail)
          )
        );

      if (existing.length > 0) {
        leadId = existing[0].id;
        // Update details if found
        await db
          .update(prospects)
          .set({
            name: nombre || existing[0].name,
            phone: cleanPhone || existing[0].phone,
            email: (email && email.includes("@")) ? cleanEmail : existing[0].email,
            updatedAt: new Date(),
          })
          .where(eq(prospects.id, leadId));
      } else {
        // Create new prospect
        const [newProspect] = await db
          .insert(prospects)
          .values({
            name: nombre || "Prospecto Anónimo",
            email: cleanEmail,
            phone: cleanPhone || null,
          })
          .returning();
        leadId = newProspect.id;
      }
    }

    return NextResponse.json({
      lead_notion_id: leadId,
      lead_id: leadId,
      nombre: nombre || "Prospecto Anónimo",
      telefono: cleanPhone,
      email: cleanEmail,
      estatus: estatus || "En proceso",
      temperatura: temperatura || "🌤 Warm",
      updated: true,
    });
  } catch (error: any) {
    console.error("Error saving lead for agent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
