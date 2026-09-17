import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requirePortfolioAdmin } from "../../../lib/projects/repository";
import { normalizeSiteSettings } from "../../../lib/settings/types";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const auth = await requirePortfolioAdmin();
    if (!auth.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!auth.isAdmin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    const input = await request.json();
    const settings = normalizeSiteSettings(input);
    const { error } = await auth.supabase.from("site_settings").upsert({ id: "main", content: settings }, { onConflict: "id" });
    if (error) throw error;
    revalidatePath("/", "layout");
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save site settings." }, { status: 400 });
  }
}
