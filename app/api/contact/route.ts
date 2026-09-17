import { NextResponse } from "next/server";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

type UnknownRecord = Record<string, unknown>;

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as UnknownRecord;
    const name = clean(input.name, 100);
    const email = clean(input.email, 200).toLowerCase();
    const projectType = clean(input.projectType, 100);
    const message = clean(input.message, 5000);
    const honeypot = clean(input.companyWebsite, 300);
    const openedAt = Number(input.openedAt);

    // Quietly accept automated honeypot submissions without storing them.
    if (honeypot) return NextResponse.json({ received: true }, { status: 201 });
    if (!name || !projectType || message.length < 10 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please complete every field with a valid email and a short project brief." }, { status: 400 });
    }
    if (Number.isFinite(openedAt) && Date.now() - openedAt < 900) {
      return NextResponse.json({ error: "Please wait a moment, then send your message again." }, { status: 429 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      project_type: projectType,
      message,
    });
    if (error) throw error;
    return NextResponse.json({ received: true }, { status: 201 });
  } catch (error) {
    console.error("Contact message submission failed.", error);
    return NextResponse.json({ error: "The inbox is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
