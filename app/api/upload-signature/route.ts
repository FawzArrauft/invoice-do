import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  if (!["png", "jpg", "jpeg", "webp"].includes(ext)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const sb = supabaseServer();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const path = `signature-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("signatures").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = sb.storage.from("signatures").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
