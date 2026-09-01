import { NextResponse } from "next/server";
import { trackPageView } from "@/app/actions/analytics";

export async function POST(request: Request) {
  try {
    const { path, deviceType } = await request.json();
    if (!path) {
      return NextResponse.json({ success: false, error: "Missing path" }, { status: 400 });
    }

    const result = await trackPageView(path, deviceType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in analytics hit endpoint:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
