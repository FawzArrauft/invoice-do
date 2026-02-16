export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

// Colors matching the design
const colors = {
  black: "#1a1a1a",
  gold: "#e6b800",
  lightGray: "#f5f5f5",
  darkGray: "#333333",
  white: "#ffffff",
};

function idr(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sb = supabaseServer();

    const { data: invoice, error } = await sb
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { data: items } = await sb
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    const subtotal = items?.reduce((sum, it) => sum + (it.ongkir || 0), 0) || 0;

    const styles = StyleSheet.create({
      page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        backgroundColor: colors.white,
      },
      // Header section
      header: {
        backgroundColor: colors.black,
        padding: 20,
        marginBottom: 15,
      },
      title: {
        fontSize: 36,
        fontWeight: "bold",
        color: colors.gold,
        fontFamily: "Helvetica-Bold",
      },
      // Invoice info row
      infoRow: {
        flexDirection: "row",
        marginBottom: 5,
      },
      infoLabel: {
        backgroundColor: colors.gold,
        padding: 6,
        width: 90,
        fontSize: 9,
      },
      infoValue: {
        backgroundColor: colors.lightGray,
        padding: 6,
        width: 120,
        fontSize: 9,
      },
      // Address section
      addressRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        marginBottom: 25,
      },
      addressBlock: {
        width: "45%",
      },
      addressTitle: {
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
      },
      addressText: {
        fontSize: 10,
        color: colors.darkGray,
        fontStyle: "italic",
      },
      // Table
      tableHeader: {
        flexDirection: "row",
        backgroundColor: colors.black,
        paddingVertical: 8,
        paddingHorizontal: 4,
      },
      tableHeaderText: {
        color: colors.gold,
        fontSize: 9,
        fontWeight: "bold",
        fontFamily: "Helvetica-Bold",
      },
      tableRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: "#dddddd",
        paddingVertical: 8,
        paddingHorizontal: 4,
        backgroundColor: colors.lightGray,
      },
      tableRowAlt: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: "#dddddd",
        paddingVertical: 8,
        paddingHorizontal: 4,
        backgroundColor: colors.white,
      },
      // Column widths - center aligned
      colNopol: { width: "12%", textAlign: "center" },
      colTujuan: { width: "16%", textAlign: "center" },
      colJenis: { width: "16%", textAlign: "center" },
      colOngkir: { width: "15%", textAlign: "center" },
      colBerat: { width: "10%", textAlign: "center" },
      colKeterangan: { width: "31%", textAlign: "center" },
      // Totals section
      totalsContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
      },
      totalsBox: {
        width: 200,
      },
      totalRow: {
        flexDirection: "row",
        borderWidth: 0.5,
        borderColor: "#cccccc",
      },
      totalLabel: {
        width: "50%",
        padding: 8,
        backgroundColor: colors.lightGray,
        fontSize: 9,
      },
      totalValue: {
        width: "50%",
        padding: 8,
        textAlign: "right",
        fontSize: 9,
      },
      amountDueLabel: {
        width: "50%",
        padding: 8,
        backgroundColor: colors.gold,
        fontSize: 9,
        fontWeight: "bold",
        fontFamily: "Helvetica-Bold",
      },
      amountDueValue: {
        width: "50%",
        padding: 8,
        textAlign: "right",
        fontSize: 9,
        fontWeight: "bold",
        fontFamily: "Helvetica-Bold",
      },
      // Transfer section
      transferSection: {
        marginTop: 25,
      },
      transferTitle: {
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
      },
      transferText: {
        fontSize: 10,
        color: colors.darkGray,
        marginBottom: 2,
      },
      transferHighlight: {
        fontSize: 10,
        color: "#cc0000",
        fontStyle: "italic",
      },
      // Signature section - below Amount Due
      signatureBox: {
        marginTop: 25,
        width: 200,
        alignItems: "center",
      },
      signatureLine: {
        width: 180,
        borderBottomWidth: 1,
        borderBottomColor: colors.black,
        marginBottom: 5,
      },
      signatureLabel: {
        fontSize: 10,
        textAlign: "center",
      },
      signatureImage: {
        width: 120,
        height: 50,
        marginBottom: 5,
      },
    });

    const InvoiceDocument = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>INVOICE</Text>
          </View>

          {/* Invoice Info */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invoice #:</Text>
            <Text style={styles.infoValue}>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invoice Date:</Text>
            <Text style={styles.infoValue}>{invoice.tanggal}</Text>
          </View>

          {/* Address Row */}
          <View style={styles.addressRow}>
            <View style={styles.addressBlock}>
              <Text style={styles.addressTitle}>Kepada Yth</Text>
              <Text style={styles.addressText}>{invoice.kepada_yth || "Name/Company Name"}</Text>
            </View>
            <View style={styles.addressBlock}>
              <Text style={styles.addressTitle}>Bill From:</Text>
              <Text style={styles.addressText}>{invoice.bill_from || "HR Ekspedisi"}</Text>
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNopol]}>Nopol</Text>
            <Text style={[styles.tableHeaderText, styles.colTujuan]}>Tujuan</Text>
            <Text style={[styles.tableHeaderText, styles.colJenis]}>Jenis</Text>
            <Text style={[styles.tableHeaderText, styles.colOngkir]}>Ongkir (RP)</Text>
            <Text style={[styles.tableHeaderText, styles.colBerat]}>Berat (KG)</Text>
            <Text style={[styles.tableHeaderText, styles.colKeterangan]}>Keterangan</Text>
          </View>

          {/* Table Rows */}
          {items?.map((it, i) => (
            <View style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={i}>
              <Text style={styles.colNopol}>{it.nopol}</Text>
              <Text style={styles.colTujuan}>{it.tujuan}</Text>
              <Text style={styles.colJenis}>{it.jenis}</Text>
              <Text style={styles.colOngkir}>{idr(it.ongkir)}</Text>
              <Text style={styles.colBerat}>{it.berat}</Text>
              <Text style={styles.colKeterangan}>{it.keterangan || ""}</Text>
            </View>
          ))}

          {/* Totals and Signature - Right Side */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{idr(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.amountDueLabel}>Amount Due:</Text>
                <Text style={styles.amountDueValue}>{idr(subtotal)}</Text>
              </View>
              
              {/* Signature directly below Amount Due */}
              <View style={styles.signatureBox}>
                {invoice.signature_url && (
                  // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image doesn't support alt
                  <Image src={invoice.signature_url} style={styles.signatureImage} />
                )}
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>{invoice.signature_name || "Signature"}</Text>
              </View>
            </View>
          </View>

          {/* Transfer Section */}
          <View style={styles.transferSection}>
            <Text style={styles.transferTitle}>Transfer Ke:</Text>
            <View style={{ marginTop: 4 }}>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ ...styles.transferText, width: 80 }}>Bank</Text>
                <Text style={styles.transferText}>: {invoice.bank_name || "-"}</Text>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ ...styles.transferText, width: 80 }}>No. Rekening</Text>
                <Text style={styles.transferText}>: {invoice.no_rekening || "-"}</Text>
              </View>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ ...styles.transferText, width: 80 }}>A/N</Text>
                <Text style={styles.transferText}>: {invoice.account_name || "-"}</Text>
              </View>
            </View>
          </View>
        </Page>
      </Document>
    );

    const pdfBuffer = await renderToBuffer(<InvoiceDocument />);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
