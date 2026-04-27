import {
  Chip,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import type { PartyTransaction } from "@stanforte/shared";
import { asDate, asMoney } from "./helpers";

export function CustomerTransactionsTab({ customerId }: { customerId: string }) {
  const { data: transactions } = useCachedQuery(
    `finance:contact:${customerId}:transactions`,
    () => financeApi.getContactTransactions(customerId),
    { ttlMs: 30_000, storage: "memory" },
  );
  const rows = Array.isArray(transactions) ? transactions : [];

  if (!rows.length) {
    return <EmptyState title="No transactions" description="Transactions will appear here once recorded." />;
  }

  return (
    <Table caption="Customer transactions">
      <TableHead>
        <TableHeaderRow>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Reference</TableHeaderCell>
          <TableHeaderCell className="text-right">Amount</TableHeaderCell>
          <TableHeaderCell className="text-right">Balance</TableHeaderCell>
        </TableHeaderRow>
      </TableHead>
      <TableBody>
        {rows.map((tx: PartyTransaction) => (
          <TableRow key={tx.id}>
            <TableCell>{asDate(tx.date)}</TableCell>
            <TableCell>
              <Chip
                variant={
                  tx.type === "invoice"
                    ? "warning"
                    : tx.type === "payment" || tx.type === "receipt"
                      ? "success"
                      : "neutral"
                }
              >
                {tx.type.replace("_", " ")}
              </Chip>
            </TableCell>
            <TableCell>{tx.reference || "-"}</TableCell>
            <TableCell className="text-right">{asMoney(tx.amount)}</TableCell>
            <TableCell className="text-right">{asMoney(tx.balance)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
