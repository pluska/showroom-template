import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { units, floors } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { floorsData } from "@/data/floors";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recamaras = searchParams.get("recamaras") ? parseInt(searchParams.get("recamaras")!) : null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 3;

    const db = await getDb();
    
    // Query units and floors
    const dbUnits = await db
      .select({
        unit: units,
        floor: floors,
      })
      .from(units)
      .innerJoin(floors, eq(units.floorId, floors.id))
      .where(
        and(
          eq(units.state, "AVAILABLE"),
          eq(units.type, "APARTMENT"),
          isNull(units.deletedAt)
        )
      );

    // Map static price from floorsData for accuracy, fallback to default calculations
    const properties = dbUnits.map(({ unit, floor }) => {
      // Find matching static unit to get the price
      const staticFloor = floorsData.find(f => f.id === floor.id.replace("floor_", ""));
      const staticUnit = staticFloor?.units.find(u => u.id === unit.identifier);
      const price = staticUnit?.price || (floor.level * 150 + 800); // dynamic fallback price

      // Determine Duplex/Flat subtitle
      let subtitle = "Flat";
      if (unit.identifier === "801") {
        subtitle = "Duplex";
      }

      return {
        notion_id: unit.id,
        titulo: `Departamento ${unit.identifier} - ${subtitle}`,
        operacion: "Alquiler", // Template project is rentals / showroom
        precio: price,
        zona: "Santa Fe 190",
        m2: unit.areaSqm || 0,
        recamaras: unit.bedrooms || 0,
        banos: unit.bathrooms || 0,
      };
    });

    // Filter by bedrooms if requested
    let filtered = properties;
    if (recamaras !== null) {
      filtered = properties.filter(p => p.recamaras >= recamaras);
    }

    return NextResponse.json(filtered.slice(0, limit));
  } catch (error: any) {
    console.error("Error fetching properties for agent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
