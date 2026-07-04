import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FinanceService } from '../finance.service';

describe('FinanceService budget revisions', () => {
  const prisma: any = {
    financeBudget: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    financeBudgetRevision: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    financeBudgetRevisionLine: { createMany: jest.fn(), deleteMany: jest.fn() },
    financeBudgetAssumption: { createMany: jest.fn(), deleteMany: jest.fn() },
    financeBudgetPortfolio: { createMany: jest.fn(), deleteMany: jest.fn() },
    financeFund: { findUnique: jest.fn() },
    financeGrant: { findUnique: jest.fn() },
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
  };

  const service = new FinanceService(prisma, {} as any, {} as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('creates a draft revision when creating a budget', async () => {
    prisma.financeBudget.create.mockResolvedValue({ id: 'budget-1' });
    prisma.financeBudgetRevision.create.mockResolvedValue({ id: 'rev-1', budgetId: 'budget-1', revisionNumber: 1, status: 'draft' });
    prisma.financeBudget.findUnique.mockResolvedValue({
      id: 'budget-1',
      name: 'July OPEX',
      status: 'draft',
      currentActiveRevisionId: null,
      draftRevisionId: 'rev-1',
      revisions: [{ id: 'rev-1', revisionNumber: 1, status: 'draft', lines: [] }],
      lines: [],
      assumptions: [],
      portfolio: [],
      fund: null,
      grant: null,
    });

    const dto = {
      name: 'July OPEX',
      scope_type: 'team',
      budget_type: 'team',
      period_type: 'monthly',
      month: 7,
      fiscal_year: 2026,
      team_id: '4',
      lines: [{ line_name: 'Rent', total_amount: 100000 }],
    };

    const result = await (service as any).createBudget(dto, '9');

    expect(prisma.financeBudgetRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          budgetId: 'budget-1',
          revisionNumber: 1,
          status: 'draft',
        }),
      }),
    );
    expect(result.id).toBe('budget-1');
  });

  it('updates the draft revision instead of overwriting the approved baseline', async () => {
    prisma.financeBudget.findUnique.mockResolvedValueOnce({
      id: 'budget-1',
      currentActiveRevisionId: 'rev-1',
      draftRevisionId: 'rev-2',
      status: 'approved',
    });
    prisma.financeBudgetRevision.update.mockResolvedValue({ id: 'rev-2', budgetId: 'budget-1', revisionNumber: 2, status: 'draft' });
    prisma.financeBudget.findUnique.mockResolvedValueOnce({
      id: 'budget-1',
      draftRevisionId: 'rev-2',
      currentActiveRevisionId: 'rev-1',
      revisions: [{ id: 'rev-2', revisionNumber: 2, status: 'draft', lines: [] }],
      lines: [], assumptions: [], portfolio: [], fund: null, grant: null,
    });

    await (service as any).updateBudget('budget-1', {
      name: 'July OPEX Revised',
      scope_type: 'team',
      budget_type: 'team',
      period_type: 'monthly',
      month: 7,
      fiscal_year: 2026,
      team_id: '4',
      lines: [{ line_name: 'Rent', total_amount: 120000 }],
    }, '9');

    expect(prisma.financeBudgetRevision.update).toHaveBeenCalled();
  });
});
