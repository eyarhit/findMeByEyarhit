import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  async generateMultiPagePdf(htmlContent: HTMLElement, fileName: string): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm margins
      const pageHeight = pdf.internal.pageSize.getHeight() - 4;

      // Create canvas with proper scaling
      const canvas = await html2canvas(htmlContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        windowHeight: htmlContent.scrollHeight,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Calculate number of full pages needed
      const fullPages = Math.floor(imgHeight / pageHeight);
      const remainder = imgHeight % pageHeight;

      // Add first page
      pdf.addImage({
        imageData: imgData,
        x: 10,
        y: 10,
        width: imgWidth,
        height: imgHeight,
        compression: 'FAST',
        format: 'PNG'
      });

      // Add additional pages only if needed
      for (let i = 1; i <= fullPages; i++) {
        pdf.addPage();
        pdf.addImage({
          imageData: imgData,
          x: 10,
          y: 10 - (i * pageHeight),
          width: imgWidth,
          height: imgHeight,
          compression: 'FAST',
          format: 'PNG'
        });
      }

      // Add partial page if needed
      if (remainder > 0) {
        pdf.addPage();
        pdf.addImage({
          imageData: imgData,
          x: 10,
          y: 10 - ((fullPages + 1) * pageHeight),
          width: imgWidth,
          height: imgHeight,
          compression: 'FAST',
          format: 'PNG'
        });
      }

      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  }
     async SauvegarderMultiPagePdf(htmlContent: HTMLElement, fileName: string): Promise<Blob> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm margins
      const pageHeight = pdf.internal.pageSize.getHeight() - 4;

      // Create canvas with proper scaling
      const canvas = await html2canvas(htmlContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        windowHeight: htmlContent.scrollHeight,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Calculate number of full pages needed
      const fullPages = Math.floor(imgHeight / pageHeight);
      const remainder = imgHeight % pageHeight;

      // Add first page
      pdf.addImage({
        imageData: imgData,
        x: 10,
        y: 10,
        width: imgWidth,
        height: imgHeight,
        compression: 'FAST',
        format: 'PNG'
      });

      // Add additional pages only if needed
      for (let i = 1; i <= fullPages; i++) {
        pdf.addPage();
        pdf.addImage({
          imageData: imgData,
          x: 10,
          y: 10 - (i * pageHeight),
          width: imgWidth,
          height: imgHeight,
          compression: 'FAST',
          format: 'PNG'
        });
      }

      // Add partial page if needed
      if (remainder > 0) {
        pdf.addPage();
        pdf.addImage({
          imageData: imgData,
          x: 10,
          y: 10 - ((fullPages + 1) * pageHeight),
          width: imgWidth,
          height: imgHeight,
          compression: 'FAST',
          format: 'PNG'
        });
      }

      // Correct way to get PDF as Blob
      const pdfOutput = pdf.output('arraybuffer');
      return new Blob([pdfOutput], { type: 'application/pdf' });
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  }
}