import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password === process.env.APP_PASSWORD) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth-token", "ok", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    });
    return res;
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
