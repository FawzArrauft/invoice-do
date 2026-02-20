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
  gold: "#f8d237",
  lightGray: "#f5f5f5",
  darkGray: "#333333",
  white: "#ffffff",
  lightYellow: "#ffe710",
};

function idr(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
}

function formatDateDMY(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
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

    // Sort items by tanggal_item ascending (earlier dates first)
    const sortedItems =
      items?.sort((a, b) => {
        const dateA = a.tanggal_item ? new Date(a.tanggal_item).getTime() : 0;
        const dateB = b.tanggal_item ? new Date(b.tanggal_item).getTime() : 0;
        return dateA - dateB;
      }) || [];

    // Check if there's any murti type item
    const hasMurtiType =
      sortedItems?.some((it) => it.type === "murti") || false;

    // Check if there's any japfa type item
    const hasJapfaType =
      sortedItems?.some((it) => it.type === "japfa") || false;

    const subtotal =
      sortedItems?.reduce((sum, it) => sum + (it.ongkir || 0), 0) || 0;
    const totalKuli =
      sortedItems?.reduce((sum, it) => sum + (it.kuli || 0), 0) || 0;
    const totalUangMakan =
      sortedItems?.reduce((sum, it) => sum + (it.uang_makan || 0), 0) || 0;
    const grandTotal = subtotal + totalKuli + totalUangMakan;

    const styles = StyleSheet.create({
      page: {
        padding: 25,
        fontSize: 10,
        fontFamily: "Helvetica",
        backgroundColor: colors.white,
      },
      // Header section
      header: {
        backgroundColor: colors.white,
        padding: 6,
        marginBottom: 4,
      },
      title: {
        fontSize: 28,
        fontWeight: "bold",
        color: colors.black,
        fontFamily: "Helvetica-Bold",
      },
      // Invoice info row
      infoRow: {
        flexDirection: "row",
        marginBottom: 5,
      },

      infoSection: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 6,
      },

      infoItem: {
        flex: 1,
        flexDirection: "row",
      },

      infoLabel: {
        backgroundColor: colors.gold,
        padding: 6,
        width: 90,
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: colors.black,
      },
      infoValue: {
        backgroundColor: colors.lightGray,
        padding: 6,
        width: 120,
        fontSize: 10,
        color: colors.black,
      },
      // Address section
      addressRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
        marginBottom: 8,
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
        color: colors.black,
        fontFamily: "Helvetica",
      },
      // Table
      tableHeader: {
        flexDirection: "row",
        backgroundColor: colors.lightYellow,
        paddingVertical: 5,
        paddingHorizontal: 4,
      },
      tableHeaderText: {
        color: colors.black,
        fontSize: 10,
        fontWeight: "bold",
        fontFamily: "Helvetica-Bold",
      },
      tableRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: "#dddddd",
        paddingVertical: 4,
        paddingHorizontal: 4,
        backgroundColor: colors.lightGray,
      },
      tableRowAlt: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: "#dddddd",
        paddingVertical: 4,
        paddingHorizontal: 4,
        backgroundColor: colors.white,
      },
      // Column widths - center aligned (default: with Jenis, no Uang Makan)
      colTanggal: { width: "11%", textAlign: "center" },
      colNopol: { width: "13%", textAlign: "center", paddingLeft: 6 },
      colTujuan: { width: "20%", textAlign: "center", paddingLeft: 4 },
      colJenis: { width: "13%", textAlign: "center" },
      colOngkir: { width: "13%", textAlign: "center" },
      colKuli: { width: "12%", textAlign: "center", paddingLeft: 4 },
      colBerat: { width: "11%", textAlign: "center", paddingLeft: 4 },
      colKeterangan: { width: "16%", textAlign: "center" },
      // Column widths for murti (without Jenis)
      colTanggalMurti: { width: "13%", textAlign: "center" },
      colNopolMurti: { width: "15%", textAlign: "center", paddingLeft: 6 },
      colTujuanMurti: { width: "17%", textAlign: "center", paddingLeft: 4 },
      colOngkirMurti: { width: "15%", textAlign: "center" },
      colKuliMurti: { width: "14%", textAlign: "center", paddingLeft: 4 },
      colBeratMurti: { width: "13%", textAlign: "center", paddingLeft: 4 },
      colKeteranganMurti: { width: "13%", textAlign: "center" },
      // Column widths for Japfa (with Jenis + Uang Makan, no Kuli)
      colTanggalJapfa: { width: "10%", textAlign: "center" },
      colNopolJapfa: { width: "13%", textAlign: "center", paddingLeft: 6 },
      colTujuanJapfa: { width: "20%", textAlign: "center", paddingLeft: 4 },
      colJenisJapfa: { width: "11%", textAlign: "center" },
      colOngkirJapfa: { width: "13%", textAlign: "center" },
      colUangMakanJapfa: { width: "13%", textAlign: "center" },
      colBeratJapfa: { width: "10%", textAlign: "center", paddingLeft: 4 },
      colKeteranganJapfa: { width: "17%", textAlign: "center" },
      // Bottom section (transfer + totals side by side)
      bottomContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginTop: 10,
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
        flex: 1,
        marginRight: 20,
      },
      transferTitle: {
        fontSize: 11,
        fontWeight: "bold",
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
      },
      transferText: {
        fontSize: 10,
        color: colors.black,
        marginBottom: 2,
      },
      transferHighlight: {
        fontSize: 10,
        color: "#cc0000",
        fontStyle: "italic",
      },
      // Signature section - below Amount Due
      signatureIntro: {
        fontSize: 10,
        marginBottom: 8,
        color: colors.black,
      },
      signatureBox: {
        marginTop: 15,
        width: 200,
        alignItems: "center",
      },
      signatureLine: {
        width: 120,
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
        height: 65,
        marginBottom: 5,
      },
    });

    const InvoiceDocument = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>INVOICE HR</Text>
          </View>

          {/* Invoice Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Invoice #:</Text>
              <Text style={styles.infoValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Invoice Date:</Text>
              <Text style={styles.infoValue}>
                {formatDateDMY(invoice.tanggal)}
              </Text>
            </View>
          </View>

          {/* Address Row */}
          <View style={styles.addressRow}>
            <View style={styles.addressBlock}>
              <Text style={styles.addressTitle}>Kepada Yth</Text>
              <Text style={styles.addressText}>
                {invoice.kepada_yth || "Name/Company Name"}
              </Text>
            </View>
            <View style={styles.addressBlock}>
              <Text style={styles.addressTitle}>Bill From:</Text>
              <Text style={styles.addressText}>
                {invoice.bill_from || "HR Ekspedisi"}
              </Text>
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader} fixed>
            {hasJapfaType ? (
              <>
                <Text style={[styles.tableHeaderText, styles.colTanggalJapfa]}>
                  Tanggal
                </Text>
                <Text style={[styles.tableHeaderText, styles.colNopolJapfa]}>
                  Nopol
                </Text>
                <Text style={[styles.tableHeaderText, styles.colTujuanJapfa]}>
                  Tujuan
                </Text>
                <Text style={[styles.tableHeaderText, styles.colJenisJapfa]}>
                  Jenis
                </Text>
                <Text style={[styles.tableHeaderText, styles.colOngkirJapfa]}>
                  Ongkir (RP)
                </Text>
                <Text style={[styles.tableHeaderText, styles.colUangMakanJapfa]}>
                  Uang Makan (RP)
                </Text>
                <Text style={[styles.tableHeaderText, styles.colBeratJapfa]}>
                  Berat
                </Text>
                <Text
                  style={[styles.tableHeaderText, styles.colKeteranganJapfa]}
                >
                  Keterangan
                </Text>
              </>
            ) : hasMurtiType ? (
              <>
                <Text style={[styles.tableHeaderText, styles.colTanggalMurti]}>
                  Tanggal
                </Text>
                <Text style={[styles.tableHeaderText, styles.colNopolMurti]}>
                  Nopol
                </Text>
                <Text style={[styles.tableHeaderText, styles.colTujuanMurti]}>
                  Tujuan
                </Text>
                <Text style={[styles.tableHeaderText, styles.colOngkirMurti]}>
                  Biaya Kirim (RP)
                </Text>
                <Text style={[styles.tableHeaderText, styles.colKuliMurti]}>
                  Kuli (RP)
                </Text>
                <Text style={[styles.tableHeaderText, styles.colBeratMurti]}>
                  Berat
                </Text>
                <Text
                  style={[styles.tableHeaderText, styles.colKeteranganMurti]}
                >
                  Keterangan
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.tableHeaderText, styles.colTanggal]}>
                  Tanggal
                </Text>
                <Text style={[styles.tableHeaderText, styles.colNopol]}>
                  Nopol
                </Text>
                <Text style={[styles.tableHeaderText, styles.colTujuan]}>
                  Tujuan
                </Text>
                <Text style={[styles.tableHeaderText, styles.colJenis]}>
                  Jenis
                </Text>
                <Text style={[styles.tableHeaderText, styles.colOngkir]}>
                  Ongkir (RP)
                </Text>
                <Text style={[styles.tableHeaderText, styles.colKuli]}>
                  Kuli (RP)
                </Text>
                <Text style={[styles.tableHeaderText, styles.colBerat]}>
                  Berat
                </Text>
                <Text style={[styles.tableHeaderText, styles.colKeterangan]}>
                  Keterangan
                </Text>
              </>
            )}
          </View>

          {/* Table Rows */}
          {sortedItems?.map((it, i) => (
            <View
              style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              key={i}
              wrap={false}
            >
              {hasJapfaType ? (
                <>
                  <Text style={styles.colTanggalJapfa}>
                    {formatDateDMY(it.tanggal_item)}
                  </Text>
                  <Text style={styles.colNopolJapfa}>{it.nopol}</Text>
                  <Text style={styles.colTujuanJapfa}>{it.tujuan}</Text>
                  <Text style={styles.colJenisJapfa}>{it.jenis}</Text>
                  <Text style={styles.colOngkirJapfa}>{idr(it.ongkir)}</Text>
                  <Text style={styles.colUangMakanJapfa}>
                    {it.uang_makan ? idr(it.uang_makan) : "-"}
                  </Text>
                  <Text style={styles.colBeratJapfa}>{it.berat}</Text>
                  <Text style={styles.colKeteranganJapfa}>
                    {it.keterangan || ""}
                  </Text>
                </>
              ) : hasMurtiType ? (
                <>
                  <Text style={styles.colTanggalMurti}>
                    {formatDateDMY(it.tanggal_item)}
                  </Text>
                  <Text style={styles.colNopolMurti}>{it.nopol}</Text>
                  <Text style={styles.colTujuanMurti}>{it.tujuan}</Text>
                  <Text style={styles.colOngkirMurti}>{idr(it.ongkir)}</Text>
                  <Text style={styles.colKuliMurti}>
                    {it.kuli ? idr(it.kuli) : "-"}
                  </Text>
                  <Text style={styles.colBeratMurti}>{it.berat}</Text>
                  <Text style={styles.colKeteranganMurti}>
                    {it.keterangan || ""}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.colTanggal}>
                    {formatDateDMY(it.tanggal_item)}
                  </Text>
                  <Text style={styles.colNopol}>{it.nopol}</Text>
                  <Text style={styles.colTujuan}>{it.tujuan}</Text>
                  <Text style={styles.colJenis}>{it.jenis}</Text>
                  <Text style={styles.colOngkir}>{idr(it.ongkir)}</Text>
                  <Text style={styles.colKuli}>
                    {it.kuli ? idr(it.kuli) : "-"}
                  </Text>
                  <Text style={styles.colBerat}>{it.berat}</Text>
                  <Text style={styles.colKeterangan}>
                    {it.keterangan || ""}
                  </Text>
                </>
              )}
            </View>
          ))}

          {/* Bottom Section: Transfer (kiri) + Totals & Signature (kanan) */}
          <View wrap={false} style={styles.bottomContainer}>

            {/* Transfer Section - Kiri */}
            <View style={styles.transferSection}>
              <Text style={styles.transferTitle}>Transfer Ke:</Text>
              <View style={{ marginTop: 4 }}>
                <View style={{ flexDirection: "row", marginBottom: 2 }}>
                  <Text style={{ ...styles.transferText, width: 80 }}>Bank</Text>
                  <Text style={styles.transferText}>
                    : {invoice.bank_name || "-"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 2 }}>
                  <Text style={{ ...styles.transferText, width: 80 }}>
                    No. Rekening
                  </Text>
                  <Text style={styles.transferText}>
                    : {invoice.no_rekening || "-"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 2 }}>
                  <Text style={{ ...styles.transferText, width: 80 }}>A/N</Text>
                  <Text style={styles.transferText}>
                    : {invoice.account_name || "-"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Totals & Signature - Kanan */}
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{idr(subtotal)}</Text>
              </View>
              {totalKuli > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Kuli:</Text>
                  <Text style={styles.totalValue}>{idr(totalKuli)}</Text>
                </View>
              )}
              {totalUangMakan > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Uang Makan:</Text>
                  <Text style={styles.totalValue}>{idr(totalUangMakan)}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.amountDueLabel}>Amount Due:</Text>
                <Text style={styles.amountDueValue}>{idr(grandTotal)}</Text>
              </View>

              {/* Signature */}
              <View style={styles.signatureBox}>
                <Text style={styles.signatureIntro}>Hormat Kami, </Text>
                {invoice.signature_url && (
                  // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image doesn't support alt
                  <Image
                    src={invoice.signature_url}
                    style={styles.signatureImage}
                  />
                )}
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>
                  {invoice.signature_name || "Signature"}
                </Text>
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
    const message =
      err instanceof Error ? err.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
