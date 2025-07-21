import * as XLSX from 'xlsx';
import { SaleData } from '../types';

export const generateExcel = (saleData: SaleData): void => {
    // --- Main Data (Columns A, B) ---
    const main_data: (string | number | Date | XLSX.CellObject)[][] = [
        // Title
        [{ v: 'Resumen de Venta', t: 's', s: { font: { sz: 16, bold: true } } }],
        [], // Spacer

        // Client Details section
        [{ v: 'Detalles del Cliente', t: 's', s: { font: { sz: 14, bold: true, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FF4F46E5" } } } }],
        ['Fecha y Hora', saleData.timestamp],
        ['Nombre Completo', saleData.clientFullName],
        ['CPF', saleData.clientCpf],
        ['Teléfono', saleData.phone],
        ['Tipo de Cliente', saleData.clientType],
        ['Idioma', saleData.language ? saleData.language.toUpperCase() : ''],
        [], // Spacer

        // Sale Details section
        [{ v: 'Detalles de la Venta', t: 's', s: { font: { sz: 14, bold: true, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FF4F46E5" } } } }],
        ['Fecha de Compra', saleData.purchaseDate],
        ['Producto(s)', saleData.product],
        ['Precio Total', { v: `R$ ${(saleData.totalProductPrice || 0).toFixed(2)}`, t: 's', s: { alignment: { horizontal: 'left' } } }],
        ['Anticipo', { v: `R$ ${(saleData.downPayment || 0).toFixed(2)}`, t: 's', s: { alignment: { horizontal: 'left' } } }],
        ['Cuotas', `${saleData.installments} de R$ ${(saleData.installmentPrice || 0).toFixed(2)}`],
        ['Sistema de Pago', saleData.paymentSystem],
        ['Fecha de Inicio de Pago', saleData.paymentStartDate],
        ['Vendedor', saleData.vendedor],
        ['Garante', saleData.guarantor],
        ['Nombre Tienda', saleData.storeName],
        [], // Spacer
        
        // Location & References section
        [{ v: 'Ubicaciones y Referencias', t: 's', s: { font: { sz: 14, bold: true, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FF4F46E5" } } } }],
        ['Ubicación Trabajo', saleData.workLocation],
        ['Dirección Trabajo', saleData.workAddress],
        ['Ubicación Casa', saleData.homeLocation],
        ['Dirección Casa', saleData.homeAddress],
        ['Referencia 1', `${saleData.reference1Name} (${saleData.reference1Relationship})`],
        ['Referencia 2', `${saleData.reference2Name} (${saleData.reference2Relationship})`],
        ['Foto Perfil Instagram', saleData.photoInstagramFileName ? 'Sí' : 'No'],
        [], // Spacer

        // Photos section
        [{ v: 'Fotos Adjuntas', t: 's', s: { font: { sz: 14, bold: true, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FF4F46E5" } } } }],
        ['Foto Tienda', saleData.photoStoreFileName ? 'Sí' : 'No'],
        ['Contrato (Frente)', saleData.photoContractFrontFileName ? 'Sí' : 'No'],
        ['Contrato (Verso)', saleData.photoContractBackFileName ? 'Sí' : 'No'],
        ['ID (Frente)', saleData.photoIdFrontFileName ? 'Sí' : 'No'],
        ['ID (Verso)', saleData.photoIdBackFileName ? 'Sí' : 'No'],
        ['CPF', saleData.photoCpfFileName ? 'Sí' : 'No'],
        ['Foto Casa', saleData.photoHomeFileName ? 'Sí' : 'No'],
        ['Foto Cara', saleData.photoFaceFileName ? 'Sí' : 'No'],
        ['Foto Código Teléfono', saleData.photoPhoneCodeFileName ? 'Sí' : 'No'],
        [], // Spacer

        // Notes section
        [{ v: 'Observaciones', t: 's', s: { font: { sz: 14, bold: true, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FF4F46E5" } } } }],
        [{ v: saleData.notes, t: 's', s: { alignment: { wrapText: true } } }],
    ];

    const ws = XLSX.utils.aoa_to_sheet(main_data);

    // --- Column Widths ---
    ws['!cols'] = [
        { wch: 25 }, // A: Keys
        { wch: 40 }, // B: Values
    ];

    // --- Merges & Styles ---
    const merges: XLSX.Range[] = [];
    
    for (let R = 0; R < main_data.length; ++R) {
        const row = main_data[R];
        // Merge section headers and single-cell rows like title and notes
        if (row.length === 1 && typeof row[0] === 'object' && (row[0] as XLSX.CellObject)?.s) {
            merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 1 } });
        }
        // Style keys in column A to be bold
        if (row.length > 1) {
             const cell_address = { c: 0, r: R };
             const cell_ref = XLSX.utils.encode_cell(cell_address);
             const cell = ws[cell_ref];
             if (cell && cell.v) {
                const currentStyle = cell.s || {};
                const currentFont = (currentStyle as any).font || {};
                cell.s = { ...currentStyle, font: { ...currentFont, bold: true } };
             }
        }
    }
    
    ws['!merges'] = merges;

    // --- File Generation ---
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ResumenVenta');

    const fileName = `Venta-${saleData.clientFullName.replace(/\s/g, '_')}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
};
