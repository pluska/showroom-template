import { NextResponse } from "next/server";
import { getActiveBrochure } from "@/app/actions/brochure";

export const runtime = "edge";

export async function GET() {
  try {
    const active = await getActiveBrochure();
    if (active) {
      return NextResponse.json({ url: active.url });
    }
    return NextResponse.json({ url: null });
  } catch (error) {
    console.error("Error fetching active brochure:", error);
    return NextResponse.json({ url: null }, { status: 500 });
  }
}
