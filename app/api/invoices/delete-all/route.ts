import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// DELETE - Delete all invoices (with confirmation code for safety)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const confirmCode = searchParams.get("confirm");

    // Safety check - require confirmation code
    if (confirmCode !== "DELETE_ALL_INVOICES") {
      return NextResponse.json(
        { error: "Invalid confirmation code. Use ?confirm=DELETE_ALL_INVOICES" },
        { status: 400 }
      );
    }

    const sb = supabaseServer();

    // First, delete all invoice items (foreign key constraint)
    const { error: itemsError } = await sb
      .from("invoice_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (workaround for Supabase)

    if (itemsError) {
      console.error("Failed to delete invoice items:", itemsError);
      throw new Error(itemsError.message);
    }

    // Then, delete all invoices
    const { error: invoicesError, count } = await sb
      .from("invoices")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (invoicesError) {
      console.error("Failed to delete invoices:", invoicesError);
      throw new Error(invoicesError.message);
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Successfully deleted ${count || 0} invoices`,
      deletedCount: count || 0
    });
  } catch (err) {
    console.error("Delete all invoices failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
