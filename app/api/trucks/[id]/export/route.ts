import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { formatRupiah } from "@/lib/calculation";

const formatIDR = formatRupiah;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sb = supabaseServer();

    // Get truck info
    const { data: truck } = await sb
      .from("trucks")
      .select("nopol")
      .eq("id", id)
      .single();

    // Get cargo data
    const { data: cargoList } = await sb
      .from("truck_cargo")
      .select("*")
      .eq("truck_id", id)
      .order("tanggal", { ascending: false });

    const cargo = cargoList || [];

    // Build cargo rows (matching template: No, Cargo, Freight Cost, Cargo Type, Balen, Balen Freight Cost, Balen Cargo Type, Total Cost, Notes)
    // Total is stored in database (calculated via Result modal)
    const cargoRows = cargo.map((c, i) => {
      const total = c.total;
      return `
      <Row>
        <Cell ss:StyleID="BorderCenter"><Data ss:Type="Number">${i + 1}</Data></Cell>
        <Cell ss:StyleID="BorderCenter"><Data ss:Type="String">${c.cargo || ""}</Data></Cell>
        <Cell ss:StyleID="BorderCenter"><Data ss:Type="String">${formatIDR(c.freight_cost)}</Data></Cell>
        <Cell ss:StyleID="BorderCenter"><Data ss:Type="String">${c.cargo_type || ""}</Data></Cell>
        <Cell ss:StyleID="BorderCenter"><Data ss:Type="String">${c.balen || ""}</Data></Cell>
        <Cell ss:StyleID="BorderCenter"><Data ss:Type="String">${formatIDR(c.balen_freight_cost)}</Data></Cell>
        <Cell ss:StyleID="BorderCenter"><Data ss:Type="String">${c.balen_cargo_type || ""}</Data></Cell>
        <Cell ss:StyleID="BorderCenter"><Data ss:Type="String">${total != null ? formatIDR(total) : "-"}</Data></Cell>
        <Cell ss:StyleID="BorderCenter"><Data ss:Type="String">${c.notes || ""}</Data></Cell>
      </Row>`;
    }).join("");

    // Calculate total all (sum of saved totals only)
    const totalAll = cargo.reduce((sum, c) => sum + (c.total || 0), 0);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Center">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="BorderCenter">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Bold="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="14"/>
      <Alignment ss:Horizontal="Center"/>
    </Style>
    <Style ss:ID="TotalLabel">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="TotalValue">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
  </Styles>
  
  <Worksheet ss:Name="Truck ${truck?.nopol || "Data"}">
    <Table>
      <Column ss:Width="40"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="150"/>
      
      <!-- Title -->
      <Row>
        <Cell ss:MergeAcross="8" ss:StyleID="Title"><Data ss:Type="String">TRUCK : ${truck?.nopol || ""} (Truck that's Assign)</Data></Cell>
      </Row>
      
      <!-- Cargo Table Header -->
      <Row ss:StyleID="Header">
        <Cell ss:StyleID="Header"><Data ss:Type="String">No</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Cargo</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Freight Cost</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Cargo Type</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Balen</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Balen Freight Cost</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Balen Cargo Type</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Total Cost</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Notes</Data></Cell>
      </Row>
      ${cargoRows}
      ${cargo.length === 0 ? `
      <Row>
        <Cell ss:MergeAcross="8" ss:StyleID="BorderCenter"><Data ss:Type="String">No cargo data</Data></Cell>
      </Row>
      ` : ""}
      <!-- Total All Row -->
      <Row>
        <Cell ss:MergeAcross="6" ss:StyleID="TotalLabel"><Data ss:Type="String">Total All</Data></Cell>
        <Cell ss:StyleID="TotalValue"><Data ss:Type="String">${formatIDR(totalAll)}</Data></Cell>
        <Cell ss:StyleID="BorderCenter"></Cell>
      </Row>
      
    </Table>
  </Worksheet>
</Workbook>`;

    const nopol = truck?.nopol?.replace(/\s+/g, "-") || "truck";
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="${nopol}-${new Date().toISOString().slice(0, 10)}.xls"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
