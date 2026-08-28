import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logs, prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const {
      call_id,
      lead_id,
      transcript,
      duracion_seg,
      resumen,
      temperatura,
      lead_score,
      proximos_pasos,
      zona_interes,
      presupuesto_detectado,
      tipo_operacion,
    } = body;

    const db = await getDb();

    // 1. Update prospect if lead_id is provided
    if (lead_id) {
      // In SQLite, we can store temperature and notes inside the logs or update prospect columns.
      // Since prospect doesn't have custom columns for temperature/score/budget,
      // we can append this info to the prospect's address or store it in details.
      // Let's also log it clearly.
      try {
        const existing = await db.select().from(prospects).where(eq(prospects.id, lead_id));
        if (existing.length > 0) {
          const notesText = `[Clasificación: ${temperatura} | Score: ${lead_score}/10] Resumen: ${resumen} | Próximos pasos: ${proximos_pasos}`;
          await db
            .update(prospects)
            .set({
              address: existing[0].address ? `${existing[0].address} | ${notesText}` : notesText,
              updatedAt: new Date(),
            })
            .where(eq(prospects.id, lead_id));
        }
      } catch (err) {
        console.error("Failed to update prospect notes:", err);
      }
    }

    // 2. Insert into logs table
    const details = {
      call_id,
      transcript: transcript ? transcript.substring(0, 1500) : "",
      duracion_seg,
      resumen,
      temperatura,
      lead_score,
      proximos_pasos,
      zona_interes,
      presupuesto_detectado,
      tipo_operacion,
      date: new Date().toISOString(),
    };

    const [newLog] = await db
      .insert(logs)
      .values({
        userId: "agent_sofia",
        userName: "Sofía (Agente de Voz)",
        action: "CALL_ENDED",
        entityType: "prospect",
        entityId: lead_id || "unknown",
        details: JSON.stringify(details),
      })
      .returning();

    return NextResponse.json({
      success: true,
      log_id: newLog.id,
      lead_id,
      call_id,
    });
  } catch (error: any) {
    console.error("Error logging call for agent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
