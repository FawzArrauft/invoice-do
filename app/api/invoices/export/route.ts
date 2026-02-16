import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { z } from "zod";

const BodySchema = z.object({
  header: z.object({
    tanggal: z.string(),   // e.g. 2026-02-14
    nopol: z.string(),
    tujuan: z.string(),
  }),
  items: z.array(
    z.object({
      ongkir: z.number().nonnegative(),
      berat: z.number().nonnegative().optional().default(0),
      keterangan: z.string().optional().default(""),
    })
  ).min(1),
  footer: z.object({
    tanggalFooter: z.string(),
    noRekening: z.string(),
    signatureName: z.string().optional().default(""),
  }),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { header, items, footer } = parsed.data;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Invoice", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  // Column layout
  ws.columns = [
    { header: "ID", key: "id", width: 6 },
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Plat Nomor", key: "nopol", width: 14 },
    { header: "Tujuan", key: "tujuan", width: 18 },
    { header: "Ongkir", key: "ongkir", width: 14 },
    { header: "Berat (kg/zak)", key: "berat", width: 14 },
    { header: "Keterangan", key: "ket", width: 26 },
  ];

  // Title
  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = "INVOICE ONGKIR";
  ws.getCell("A1").font = { size: 16, bold: true };
  ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

  // Header block
  ws.getCell("A3").value = "Tanggal";
  ws.getCell("B3").value = header.tanggal;
  ws.getCell("D3").value = "Plat Nomor";
  ws.getCell("E3").value = header.nopol;

  ws.getCell("A4").value = "Tujuan";
  ws.getCell("B4").value = header.tujuan;

  ["A3","A4","D3"].forEach(a => ws.getCell(a).font = { bold: true });

  // Table header row
  const tableStartRow = 6;
  const headerRow = ws.getRow(tableStartRow);
  headerRow.values = ["ID", "Tanggal", "Plat Nomor", "Tujuan", "Ongkir", "Berat (kg/zak)", "Keterangan"];
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 18;

  // Borders for header
  for (let c = 1; c <= 7; c++) {
    const cell = ws.getCell(tableStartRow, c);
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  // Data rows
  let rowIdx = tableStartRow + 1;
  let total = 0;

  items.forEach((it, i) => {
    total += it.ongkir;
    const r = ws.getRow(rowIdx);
    r.values = [
      i + 1,
      header.tanggal,
      header.nopol,
      header.tujuan,
      it.ongkir,
      it.berat ?? 0,
      it.keterangan ?? "",
    ];

    // format + borders
    ws.getCell(rowIdx, 5).numFmt = '"Rp"#,##0';
    for (let c = 1; c <= 7; c++) {
      ws.getCell(rowIdx, c).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      ws.getCell(rowIdx, c).alignment = { vertical: "middle" };
    }
    rowIdx++;
  });

  // Total row
  ws.mergeCells(`A${rowIdx}:D${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = "TOTAL ONGKIR";
  ws.getCell(`A${rowIdx}`).font = { bold: true };
  ws.getCell(`A${rowIdx}`).alignment = { horizontal: "right" };

  ws.getCell(rowIdx, 5).value = total;
  ws.getCell(rowIdx, 5).numFmt = '"Rp"#,##0';
  ws.getCell(rowIdx, 5).font = { bold: true };

  for (let c = 1; c <= 7; c++) {
    ws.getCell(rowIdx, c).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  rowIdx += 2;

  // Footer
  ws.getCell(`E${rowIdx}`).value = footer.tanggalFooter;
  ws.getCell(`E${rowIdx}`).alignment = { horizontal: "center" };

  rowIdx += 1;
  ws.getCell(`E${rowIdx}`).value = "Tanda Tangan";
  ws.getCell(`E${rowIdx}`).alignment = { horizontal: "center" };
  rowIdx += 3;

  ws.getCell(`E${rowIdx}`).value = footer.signatureName || "(________________)";
  ws.getCell(`E${rowIdx}`).alignment = { horizontal: "center" };

  rowIdx += 2;
  ws.getCell(`A${rowIdx}`).value = "No Rekening:";
  ws.getCell(`B${rowIdx}`).value = footer.noRekening;
  ws.getCell(`A${rowIdx}`).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `invoice-${header.tanggal}-${header.nopol}.xlsx`.replaceAll(" ", "-");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
