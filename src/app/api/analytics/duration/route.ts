import { NextResponse } from "next/server";
import { updatePageViewDuration } from "@/app/actions/analytics";

export async function POST(request: Request) {
  try {
    const { id, duration } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing page view ID" }, { status: 400 });
    }

    const val = parseInt(duration, 10);
    if (isNaN(val) || val < 0) {
      return NextResponse.json({ success: false, error: "Invalid duration" }, { status: 400 });
    }

    const result = await updatePageViewDuration(id, val);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in analytics duration endpoint:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
