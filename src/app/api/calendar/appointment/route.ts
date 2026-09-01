import { NextResponse } from "next/server";
import { createAppointment } from "@/app/actions/calendar";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.date || !data.prospectName || !data.prospectEmail || !data.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await createAppointment({
      ...data,
      sellerId: data.sellerId || undefined,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in create appointment API handler:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
