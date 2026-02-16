import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n || 0);
}

export async function GET() {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("muatan")
    .select(`
      *,
      trucks (nopol)
    `)
    .order("tanggal", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Build Excel XML content with center-aligned cells
  const rows = data?.map((m, i) => {
    const nopol = (m.trucks as { nopol: string } | null)?.nopol || "";
    return `
      <Row>
        <Cell ss:StyleID="Center"><Data ss:Type="Number">${i + 1}</Data></Cell>
        <Cell ss:StyleID="Center"><Data ss:Type="String">${m.tanggal || ""}</Data></Cell>
        <Cell ss:StyleID="Center"><Data ss:Type="String">${nopol}</Data></Cell>
        <Cell ss:StyleID="Center"><Data ss:Type="String">${m.jenis_muatan || ""}</Data></Cell>
        <Cell ss:StyleID="Center"><Data ss:Type="Number">${m.balen || 0}</Data></Cell>
        <Cell ss:StyleID="Center"><Data ss:Type="String">Rp ${formatIDR(m.ongkos)}</Data></Cell>
        <Cell ss:StyleID="Center"><Data ss:Type="String">${m.keterangan || ""}</Data></Cell>
      </Row>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Center">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Bold="1"/>
      <Interior ss:Color="#1a1a1a" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Muatan">
    <Table>
      <Column ss:Width="40"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="120"/>
      <Column ss:Width="60"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">No</Data></Cell>
        <Cell><Data ss:Type="String">Tanggal</Data></Cell>
        <Cell><Data ss:Type="String">Nopol</Data></Cell>
        <Cell><Data ss:Type="String">Jenis Muatan</Data></Cell>
        <Cell><Data ss:Type="String">Balen</Data></Cell>
        <Cell><Data ss:Type="String">Ongkos</Data></Cell>
        <Cell><Data ss:Type="String">Ket</Data></Cell>
      </Row>
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel",
      "Content-Disposition": `attachment; filename="muatan-${new Date().toISOString().slice(0, 10)}.xls"`,
    },
  });
}
