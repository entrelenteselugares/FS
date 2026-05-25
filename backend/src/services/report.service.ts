import PDFDocument from 'pdfkit';
import { User } from '@prisma/client';

// ── Tipos explícitos para dados financeiros (evita `any` silencioso) ──────────

interface SettlementRecord {
  amount: number | string;
  role: string;
  orderId: string;
  order: {
    total: number | string;
    createdAt: Date | string;
    event?: { title?: string } | null;
  };
}

interface PayoutReceiptItem {
  amount: number | string;
  recipientName: string;
  pixKey?: string | null;
  id: string;
  paidAt?: Date | string | null;
  payout: {
    weekStart: Date | string;
    weekEnd: Date | string;
  };
}

export const ReportService = {
  /**
   * Gera o Relatório Mensal de Receitas Brutas (Modelo MEI) em PDF
   */
  async generateTaxReportPDF(professional: User, year: number, month: number, settlements: SettlementRecord[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Cores Midnight Luxury (Light Version)
      const brandColor = '#14b8a6'; // brand-tactical
      const textColor = '#1f2937';
      const mutedColor = '#6b7280';

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('FOTO SEGUNDO', { align: 'right' });
      doc.fontSize(10).font('Helvetica-Oblique').fillColor(brandColor).text('MIDNIGHT LUXURY EXPERIENCE', { align: 'right' });
      doc.moveDown(2);

      // Título do Relatório
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(16).text('RELATÓRIO MENSAL DE RECEITAS BRUTAS', { underline: true });
      doc.fontSize(10).font('Helvetica').text(`Período de Competência: ${month.toString().padStart(2, '0')}/${year}`);
      doc.moveDown();

      // Dados do Profissional
      doc.font('Helvetica-Bold').text('IDENTIFICAÇÃO DO PRESTADOR:');
      doc.font('Helvetica').text(`Nome: ${professional.nome}`);
      doc.text(`E-mail: ${professional.email}`);
      doc.text(`PIX: ${professional.pixKey || 'Não informado'}`);
      doc.moveDown();

      // Resumo Financeiro
      const totalBruto = settlements.reduce((acc, s) => acc + Number(s.order.total), 0);
      const totalLiquido = settlements.reduce((acc, s) => acc + Number(s.amount), 0);
      const totalTaxas = totalBruto - totalLiquido;

      // W-02 fix: Captura o Y antes do rect() para posicionamento relativo confiável
      const summaryTop = doc.y;
      doc.rect(50, summaryTop, 500, 80).fillAndStroke('#f9fafb', '#e5e7eb');
      doc.fillColor(textColor).font('Helvetica-Bold').text('RESUMO DO MÊS', 60, summaryTop + 8);
      
      doc.font('Helvetica').text(`Receita Bruta Total (Serviços):`, 70, summaryTop + 24);
      doc.font('Helvetica-Bold').text(`R$ ${totalBruto.toFixed(2)}`, 350, summaryTop + 24);
      
      doc.font('Helvetica').text(`Total de Taxas da Plataforma:`, 70, summaryTop + 40);
      doc.font('Helvetica-Bold').text(`R$ ${totalTaxas.toFixed(2)}`, 350, summaryTop + 40);
      
      doc.font('Helvetica').text(`Valor Líquido Recebido:`, 70, summaryTop + 56);
      doc.font('Helvetica-Bold').fillColor(brandColor).text(`R$ ${totalLiquido.toFixed(2)}`, 350, summaryTop + 56);
      
      doc.fillColor(textColor).moveDown(6);

      // Tabela de Lançamentos
      doc.font('Helvetica-Bold').fontSize(12).text('DETALHAMENTO DE VENDAS');
      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('DATA', 50, tableTop);
      doc.text('PEDIDO', 120, tableTop);
      doc.text('EVENTO', 200, tableTop);
      doc.text('BRUTO', 380, tableTop);
      doc.text('LÍQUIDO', 450, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#e5e7eb').stroke();

      let currentY = tableTop + 25;
      doc.font('Helvetica').fontSize(8);

      settlements.forEach((s, i) => {
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }

        const dateStr = new Date(s.order.createdAt).toLocaleDateString('pt-BR');
        doc.text(dateStr, 50, currentY);
        doc.text(s.orderId.slice(-8).toUpperCase(), 120, currentY);
        doc.text(s.order.event?.title || 'Venda Direta', 200, currentY, { width: 170, height: 10, ellipsis: true });
        doc.text(`R$ ${Number(s.order.total).toFixed(2)}`, 380, currentY);
        doc.text(`R$ ${Number(s.amount).toFixed(2)}`, 450, currentY);

        currentY += 20;
      });

      // Rodapé
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor(mutedColor).text(
          `Documento gerado eletronicamente pela plataforma Foto Segundo em ${new Date().toLocaleString('pt-BR')}. Este relatório é para fins gerenciais de controle de MEI.`,
          50,
          780,
          { align: 'center', width: 500 }
        );
      }

      doc.end();
    });
  },

  /**
   * Gera o Recibo de Repasse (Comprovante de Liquidação) em PDF
   */
  async generatePayoutReceiptPDF(payoutItem: PayoutReceiptItem): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const brandColor = '#14b8a6';
      const textColor = '#1f2937';

      // Design de Recibo Premium
      doc.fontSize(24).font('Helvetica-Bold').text('RECIBO DE REPASSE', { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor(brandColor).text('FOTO SEGUNDO | MIDNIGHT LUXURY', { align: 'center' });
      doc.moveDown(3);

      doc.fillColor(textColor).fontSize(12).font('Helvetica');
      doc.text(`Declaramos para os devidos fins que o valor de:`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(32).font('Helvetica-Bold').text(`R$ ${Number(payoutItem.amount).toFixed(2)}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`foi liquidado em favor de:`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).font('Helvetica-Bold').text(payoutItem.recipientName, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(10).font('Helvetica').text(`Referente ao período de ${new Date(payoutItem.payout.weekStart).toLocaleDateString('pt-BR')} a ${new Date(payoutItem.payout.weekEnd).toLocaleDateString('pt-BR')}.`, { align: 'center' });
      doc.moveDown(2);

      // Detalhes da Transação
      doc.rect(50, doc.y, 500, 100).stroke('#e5e7eb');
      let detailY = doc.y + 15;
      doc.fontSize(9).font('Helvetica-Bold').text('DETALHES DA LIQUIDAÇÃO', 70, detailY);
      detailY += 20;
      doc.font('Helvetica').text(`Status:`, 70, detailY);
      doc.font('Helvetica-Bold').text(`LIQUIDADO / PAGO`, 200, detailY);
      detailY += 15;
      doc.font('Helvetica').text(`Data de Pagamento:`, 70, detailY);
      doc.font('Helvetica-Bold').text(payoutItem.paidAt ? new Date(payoutItem.paidAt).toLocaleString('pt-BR') : 'Processado', 200, detailY);
      detailY += 15;
      doc.font('Helvetica').text(`Chave PIX:`, 70, detailY);
      doc.font('Helvetica-Bold').text(payoutItem.pixKey || 'Saldo Interno', 200, detailY);
      detailY += 15;
      doc.font('Helvetica').text(`ID Transação:`, 70, detailY);
      doc.font('Helvetica-Bold').text(payoutItem.id.toUpperCase(), 200, detailY);

      doc.moveDown(10);
      doc.fontSize(8).fillColor('#9ca3af').text('FOTO SEGUNDO INTERMEDIAÇÕES LTDA', { align: 'center' });
      doc.text('Este documento é um comprovante de repasse de valores intermediados pela plataforma.', { align: 'center' });

      doc.end();
    });
  },

  /**
   * Gera o Relatório em CSV
   */
  generateTaxReportCSV(settlements: SettlementRecord[]): string {
    const header = 'Data;Pedido;Evento;Papel;Valor Bruto (R$);Taxa Plataforma (R$);Valor Líquido (R$)\n';
    const rows = settlements.map(s => {
      const bruto = Number(s.order.total);
      const liquido = Number(s.amount);
      const taxa = bruto - liquido;
      const date = new Date(s.order.createdAt).toLocaleDateString('pt-BR');
      const event = s.order.event?.title || 'Venda Direta';
      
      return `${date};${s.orderId};${event};${s.role};${bruto.toFixed(2)};${taxa.toFixed(2)};${liquido.toFixed(2)}`;
    }).join('\n');

    return '\uFEFF' + header + rows;
  }
};
