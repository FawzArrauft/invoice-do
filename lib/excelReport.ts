import ExcelJS from "exceljs";

export type TruckingReportRow = {
  tanggal: string;
  noDO: string;
  platNomor: string;
  supir: string;
  tujuan: string;
  beratKG: number;
  ongkir: number;
  keterangan: string;
};

export type TruckingReportParams = {
  periode: string;
  perusahaan: string;
  data: TruckingReportRow[];
};

/**
 * Generate laporan bulanan trucking ke Excel buffer
 * Format profesional dengan header, styling, SUM total, freeze pane, footer tanda tangan
 */
export async function generateTruckingReport(
  params: TruckingReportParams,
): Promise<Buffer> {
  const { periode, perusahaan, data } = params;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Logistics Billing System";
  wb.created = new Date();

  const ws = wb.addWorksheet("Laporan Bulanan", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.6,
        bottom: 0.6,
        header: 0.3,
        footer: 0.3,
      },
    },
  });

  // ===== Column widths =====
  ws.columns = [
    { key: "no", width: 6 },
    { key: "tanggal", width: 14 },
    { key: "noDO", width: 16 },
    { key: "platNomor", width: 16 },
    { key: "supir", width: 20 },
    { key: "tujuan", width: 22 },
    { key: "beratKG", width: 14 },
    { key: "ongkir", width: 18 },
    { key: "keterangan", width: 24 },
  ];

  const totalCols = 9; // A through I

  // ===== BARIS 1: Judul =====
  ws.mergeCells("A1:I1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "LAPORAN BULANAN TRUCKING";
  titleCell.font = { size: 16, bold: true, color: { argb: "FF1F2937" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 30;

  // ===== BARIS 3: Periode =====
  ws.getCell("A3").value = "Periode:";
  ws.getCell("A3").font = { bold: true, size: 11 };
  ws.mergeCells("B3:D3");
  ws.getCell("B3").value = periode;
  ws.getCell("B3").font = { size: 11 };

  // ===== BARIS 4: Nama Perusahaan =====
  ws.getCell("A4").value = "Perusahaan:";
  ws.getCell("A4").font = { bold: true, size: 11 };
  ws.mergeCells("B4:D4");
  ws.getCell("B4").value = perusahaan;
  ws.getCell("B4").font = { size: 11 };

  // ===== BARIS 6: Header Tabel =====
  const headerRowNum = 6;
  const headers = [
    "No",
    "Tanggal",
    "No DO",
    "Plat Nomor",
    "Supir",
    "Tujuan",
    "Berat (KG)",
    "Ongkir",
    "Keterangan",
  ];

  const headerRow = ws.getRow(headerRowNum);
  headerRow.values = headers;
  headerRow.height = 22;
  headerRow.font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  // Header styling — background abu muda
  for (let c = 1; c <= totalCols; c++) {
    const cell = ws.getCell(headerRowNum, c);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" }, // light gray
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF9CA3AF" } },
      left: { style: "thin", color: { argb: "FF9CA3AF" } },
      bottom: { style: "thin", color: { argb: "FF9CA3AF" } },
      right: { style: "thin", color: { argb: "FF9CA3AF" } },
    };
  }

  // ===== Freeze pane — freeze di header =====
  ws.views = [
    {
      state: "frozen",
      xSplit: 0,
      ySplit: headerRowNum, // Freeze at row 6 (header)
      topLeftCell: "A7",
      activeCell: "A7",
    },
  ];

  // ===== DATA ROWS =====
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFD1D5DB" } },
    left: { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    right: { style: "thin", color: { argb: "FFD1D5DB" } },
  };

  let rowIdx = headerRowNum + 1;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const row = ws.getRow(rowIdx);

    row.values = [
      i + 1,
      item.tanggal,
      item.noDO,
      item.platNomor,
      item.supir,
      item.tujuan,
      item.beratKG,
      item.ongkir,
      item.keterangan,
    ];

    row.height = 18;
    row.alignment = { vertical: "middle" };

    // Alternating row color
    if (i % 2 === 1) {
      for (let c = 1; c <= totalCols; c++) {
        ws.getCell(rowIdx, c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9FAFB" }, // very light gray
        };
      }
    }

    // Cell-specific formatting
    ws.getCell(rowIdx, 1).alignment = { horizontal: "center", vertical: "middle" }; // No
    ws.getCell(rowIdx, 2).alignment = { horizontal: "center", vertical: "middle" }; // Tanggal
    ws.getCell(rowIdx, 3).alignment = { horizontal: "center", vertical: "middle" }; // No DO
    ws.getCell(rowIdx, 4).alignment = { horizontal: "center", vertical: "middle" }; // Plat
    ws.getCell(rowIdx, 7).numFmt = "#,##0"; // Berat — number format
    ws.getCell(rowIdx, 7).alignment = { horizontal: "right", vertical: "middle" };
    ws.getCell(rowIdx, 8).numFmt = '"Rp"#,##0'; // Ongkir — currency IDR
    ws.getCell(rowIdx, 8).alignment = { horizontal: "right", vertical: "middle" };

    // Borders for all cells
    for (let c = 1; c <= totalCols; c++) {
      ws.getCell(rowIdx, c).border = thinBorder;
    }

    rowIdx++;
  }

  // ===== TOTAL ROW =====
  const totalRowNum = rowIdx;

  ws.mergeCells(`A${totalRowNum}:G${totalRowNum}`);
  const totalLabelCell = ws.getCell(`A${totalRowNum}`);
  totalLabelCell.value = "TOTAL ONGKIR";
  totalLabelCell.font = { bold: true, size: 11 };
  totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  // SUM formula untuk ongkir
  const ongkirCol = "H"; // kolom H = ongkir
  const dataStartRow = headerRowNum + 1;
  const dataEndRow = totalRowNum - 1;
  const totalOngkirCell = ws.getCell(`${ongkirCol}${totalRowNum}`);
  totalOngkirCell.value = {
    formula: `SUM(${ongkirCol}${dataStartRow}:${ongkirCol}${dataEndRow})`,
  };
  totalOngkirCell.numFmt = '"Rp"#,##0';
  totalOngkirCell.font = { bold: true, size: 11 };
  totalOngkirCell.alignment = { horizontal: "right", vertical: "middle" };

  // Total row styling — bold with double top border
  for (let c = 1; c <= totalCols; c++) {
    const cell = ws.getCell(totalRowNum, c);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };
    cell.border = {
      top: { style: "double", color: { argb: "FF374151" } },
      left: { style: "thin", color: { argb: "FF9CA3AF" } },
      bottom: { style: "thin", color: { argb: "FF9CA3AF" } },
      right: { style: "thin", color: { argb: "FF9CA3AF" } },
    };
  }

  ws.getRow(totalRowNum).height = 22;

  // ===== FOOTER =====
  const footerStartRow = totalRowNum + 3;

  // Dibuat tanggal
  const now = new Date();
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  ws.mergeCells(`F${footerStartRow}:I${footerStartRow}`);
  ws.getCell(`F${footerStartRow}`).value = `Dibuat tanggal: ${dateStr}`;
  ws.getCell(`F${footerStartRow}`).font = { size: 10 };
  ws.getCell(`F${footerStartRow}`).alignment = { horizontal: "center" };

  // Kolom tanda tangan
  const signRow = footerStartRow + 2;

  // Mengetahui
  ws.mergeCells(`A${signRow}:C${signRow}`);
  ws.getCell(`A${signRow}`).value = "Mengetahui,";
  ws.getCell(`A${signRow}`).font = { size: 10 };
  ws.getCell(`A${signRow}`).alignment = { horizontal: "center" };

  // Hormat Kami
  ws.mergeCells(`F${signRow}:I${signRow}`);
  ws.getCell(`F${signRow}`).value = "Hormat Kami,";
  ws.getCell(`F${signRow}`).font = { size: 10 };
  ws.getCell(`F${signRow}`).alignment = { horizontal: "center" };

  // Garis tanda tangan
  const lineRow = signRow + 4;

  ws.mergeCells(`A${lineRow}:C${lineRow}`);
  ws.getCell(`A${lineRow}`).value = "(__________________)";
  ws.getCell(`A${lineRow}`).alignment = { horizontal: "center" };
  ws.getCell(`A${lineRow}`).font = { size: 10 };

  ws.mergeCells(`F${lineRow}:I${lineRow}`);
  ws.getCell(`F${lineRow}`).value = "(__________________)";
  ws.getCell(`F${lineRow}`).alignment = { horizontal: "center" };
  ws.getCell(`F${lineRow}`).font = { size: 10 };

  // ===== Auto-fit column width (adjust based on data) =====
  ws.columns.forEach((col) => {
    if (!col.eachCell) return;
    let maxLen = (col.width as number) || 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value?.toString() || "";
      const len = val.length + 2;
      if (len > maxLen) maxLen = Math.min(len, 40);
    });
    col.width = maxLen;
  });

  // Write to buffer
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
