import { GestarianDocument, QuarterlyReport } from '../types';

/**
 * Genera el Libro de Facturas Emitidas en formato XML / XLS compatible con Excel
 * Reconocido nativamente por Microsoft Excel, LibreOffice y Google Sheets.
 */
export function generateExcelXmlReport(report: QuarterlyReport): string {
  const rows = report.invoices.map((inv) => `
      <Row>
        <Cell><Data ss:Type="String">${inv.number}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.date}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.clientCif}</Data></Cell>
        <Cell><Data ss:Type="String"><![CDATA[${inv.clientName}]]></Data></Cell>
        <Cell><Data ss:Type="Number">${inv.subtotal.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.applyIva ? inv.ivaRate : 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.ivaAmount.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.applyIrpf ? inv.irpfRate : 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.irpfAmount.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${inv.total.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="String">${inv.status.toUpperCase()}</Data></Cell>
      </Row>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F2942" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Total">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Libro Facturas ${report.quarter}">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="180"/>
   <Column ss:Width="100"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="60"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">NÚMERO</Data></Cell>
    <Cell><Data ss:Type="String">FECHA</Data></Cell>
    <Cell><Data ss:Type="String">NIF/CIF</Data></Cell>
    <Cell><Data ss:Type="String">CLIENTE</Data></Cell>
    <Cell><Data ss:Type="String">BASE IMPONIBLE</Data></Cell>
    <Cell><Data ss:Type="String">% IVA</Data></Cell>
    <Cell><Data ss:Type="String">CUOTA IVA</Data></Cell>
    <Cell><Data ss:Type="String">% IRPF</Data></Cell>
    <Cell><Data ss:Type="String">RETENCIÓN</Data></Cell>
    <Cell><Data ss:Type="String">TOTAL FACTURA</Data></Cell>
    <Cell><Data ss:Type="String">ESTADO</Data></Cell>
   </Row>
   ${rows}
   <Row ss:StyleID="Total">
    <Cell><Data ss:Type="String">TOTALES ${report.quarter}</Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String"></Data></Cell>
    <Cell><Data ss:Type="String">${report.invoices.length} facturas</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalSubtotal.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalIva.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalIrpf.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="Number">${report.totalGross.toFixed(2)}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Genera el archivo para software contable SAGE (Despachos y 50c)
 * Formato CSV estándar con separador punto y coma y cuentas del PGC
 */
export function generateSageReport(report: QuarterlyReport): string {
  const header = 'ASIENTO;FECHA;CUENTA;CONCEPTO;DEBE;HABER;FACTURA;NIF\n';
  let asiento = 1;
  const lines: string[] = [];

  report.invoices.forEach((inv) => {
    const fecha = inv.date.replace(/-/g, '');
    const clienteCta = `43000000`;
    const ventasCta = `70500000`;
    const ivaCta = `47700021`;

    // Apunte Cliente (Debe Total)
    lines.push(
      `${asiento};${fecha};${clienteCta};Fra ${inv.number} ${inv.clientName};${inv.total.toFixed(2)};0.00;${inv.number};${inv.clientCif}`
    );
    // Apunte Ingresos (Haber Base)
    lines.push(
      `${asiento};${fecha};${ventasCta};Fra ${inv.number} Base Imponible;0.00;${inv.subtotal.toFixed(2)};${inv.number};${inv.clientCif}`
    );
    // Apunte IVA Repercutido (Haber IVA)
    if (inv.ivaAmount > 0) {
      lines.push(
        `${asiento};${fecha};${ivaCta};Fra ${inv.number} IVA 21%;0.00;${inv.ivaAmount.toFixed(2)};${inv.number};${inv.clientCif}`
      );
    }
    asiento++;
  });

  return header + lines.join('\n');
}

/**
 * Genera enlace de importación contable para A3ASESOR / A3eco (Wolters Kluwer)
 */
export function generateA3Report(report: QuarterlyReport): string {
  const lines: string[] = [
    `# A3ECO - ENLACE CONTABLE FACTURAS EMITIDAS - TRIMESTRE ${report.quarter} ${report.year}`,
    `# CÓDIGO EMPRESA;FECHA;SERIE;NUMERO;NIF_CLIENTE;NOMBRE_CLIENTE;BASE;TIPO_IVA;CUOTA_IVA;TOTAL`,
  ];

  report.invoices.forEach((inv) => {
    lines.push(
      `00001;${inv.date};${inv.series || 'A'};${inv.number};${inv.clientCif};${inv.clientName};${inv.subtotal.toFixed(2)};${inv.applyIva ? inv.ivaRate : 0};${inv.ivaAmount.toFixed(2)};${inv.total.toFixed(2)}`
    );
  });

  return lines.join('\n');
}

/**
 * Descarga en el navegador cualquier cadena como archivo
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
