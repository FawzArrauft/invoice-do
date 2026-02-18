import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";
import { encryptData, decryptData, maskAccountNumber } from "@/lib/encryption";

const BankSchema = z.object({
  name: z.string().min(1, "Bank name is required"),
  noRekening: z.string().min(1, "Account number is required"),
  accountName: z.string().min(1, "Account holder name is required"),
});

// GET - List all bank accounts (decrypted for authorized use)
export async function GET() {
  try {
    const sb = supabaseServer();
    
    const { data, error } = await sb
      .from("bank_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Decrypt account numbers for display
    const decryptedData = data?.map((bank) => {
      try {
        const decryptedNoRekening = decryptData(bank.no_rekening_encrypted);
        return {
          id: bank.id,
          name: bank.name,
          noRekening: decryptedNoRekening,
          noRekeningMasked: maskAccountNumber(decryptedNoRekening),
          accountName: bank.account_name,
          createdAt: bank.created_at,
        };
      } catch {
        // If decryption fails (old unencrypted data), return masked
        return {
          id: bank.id,
          name: bank.name,
          noRekening: bank.no_rekening || "",
          noRekeningMasked: maskAccountNumber(bank.no_rekening || ""),
          accountName: bank.account_name,
          createdAt: bank.created_at,
        };
      }
    }) || [];

    return NextResponse.json({ data: decryptedData });
  } catch (err) {
    console.error("Failed to fetch banks:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch banks" },
      { status: 500 }
    );
  }
}

// POST - Create new bank account (encrypted)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = BankSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, noRekening, accountName } = parsed.data;
    
    // Encrypt the account number before storing
    const encryptedNoRekening = encryptData(noRekening);

    const sb = supabaseServer();
    
    const { data, error } = await sb
      .from("bank_accounts")
      .insert([
        {
          name,
          no_rekening_encrypted: encryptedNoRekening,
          account_name: accountName,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        noRekening,
        noRekeningMasked: maskAccountNumber(noRekening),
        accountName: data.account_name,
      },
    });
  } catch (err) {
    console.error("Failed to create bank:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create bank" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a bank account
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Bank ID is required" }, { status: 400 });
    }

    const sb = supabaseServer();
    
    const { error } = await sb
      .from("bank_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete bank:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete bank" },
      { status: 500 }
    );
  }
}
