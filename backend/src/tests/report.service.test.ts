import { ReportService } from '../services/report.service';

describe('ReportService', () => {
  const mockUser: any = {
    nome: 'Fotógrafo de Teste',
    email: 'test@foto.com',
    pixKey: 'test-pix-key'
  };

  const mockSettlements = [
    {
      amount: 100,
      role: 'CAPTACAO',
      orderId: 'order-1',
      order: {
        total: 150,
        createdAt: new Date('2026-05-10T10:00:00Z'),
        event: { title: 'Casamento A' }
      }
    },
    {
      amount: 200,
      role: 'EDICAO',
      orderId: 'order-2',
      order: {
        total: 250,
        createdAt: new Date('2026-05-11T15:00:00Z'),
        event: { title: 'Batizado B' }
      }
    }
  ];

  describe('generateTaxReportCSV', () => {
    it('should generate a CSV with UTF-8 BOM', () => {
      const csv = ReportService.generateTaxReportCSV(mockSettlements);
      expect(csv.startsWith('\uFEFF')).toBe(true);
    });

    it('should contain the correct columns and data', () => {
      const csv = ReportService.generateTaxReportCSV(mockSettlements);
      expect(csv).toContain('Data;Pedido;Evento;Papel;Valor Bruto (R$);Taxa Plataforma (R$);Valor Líquido (R$)');
      expect(csv).toContain('Casamento A');
      expect(csv).toContain('150.00');
      expect(csv).toContain('50.00'); // 150 - 100
      expect(csv).toContain('100.00');
    });

    // I-01: Teste de array vazio
    it('should return only header when settlements is empty', () => {
      const csv = ReportService.generateTaxReportCSV([]);
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('Data;Pedido');
      // Apenas o header + BOM, sem linhas de dados
      const lines = csv.split('\n').filter(l => l.trim().length > 0);
      expect(lines.length).toBe(1); // apenas o header
    });
  });

  describe('generateTaxReportPDF', () => {
    it('should return a Buffer', async () => {
      const buffer = await ReportService.generateTaxReportPDF(mockUser, 2026, 5, mockSettlements);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    // I-01: Teste de array vazio
    it('should return a valid Buffer even with no settlements', async () => {
      const buffer = await ReportService.generateTaxReportPDF(mockUser, 2026, 5, []);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0); // PDF válido, mesmo sem dados
    });
  });

  describe('generatePayoutReceiptPDF', () => {
    it('should return a Buffer for payout receipt', async () => {
      const mockPayoutItem = {
        amount: 300,
        recipientName: 'Fotógrafo de Teste',
        pixKey: 'test-pix-key',
        id: 'payout-1',
        paidAt: new Date(),
        payout: {
          weekStart: new Date('2026-05-01'),
          weekEnd: new Date('2026-05-07')
        }
      };
      const buffer = await ReportService.generatePayoutReceiptPDF(mockPayoutItem);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});

