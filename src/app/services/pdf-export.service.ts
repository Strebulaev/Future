import { Injectable } from '@angular/core';

// Объявляем pdfmake как глобальную переменную
declare const pdfMake: any;
declare const pdfFonts: any;

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  constructor() {
    // Инициализация шрифтов
    try {
      pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.default?.pdfMake?.vfs;
    } catch (e) {
      console.error('Error initializing pdfmake fonts', e);
    }
  }

  exportToPdf(plan: any): void {
    const docDefinition = {
      content: [
        { text: plan.title, style: 'header' },
        { text: `Старт: ${plan.startPoint}`, style: 'subheader' },
        ...plan.branches.map((branch: any) => ({
          text: branch.name,
          style: 'branch'
        }))
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, margin: [0, 10, 0, 5] },
        branch: { fontSize: 12, margin: [0, 5, 0, 5] }
      }
    };

    try {
      pdfMake.createPdf(docDefinition).download(`${plan.title}.pdf`);
    } catch (e) {
      console.error('Error generating PDF', e);
    }
  }
}