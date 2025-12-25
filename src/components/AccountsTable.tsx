import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface Account {
  account_name: string;
  category: string;
  total_credit: number;
  total_debit: number;
  net_balance: number;
  is_taxable: boolean;
  classification: "asset" | "liability" | "neutral";
  tax_implications: string;
}

interface AccountsTableProps {
  accounts: Account[];
}

const categoryLabels: Record<string, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  investment: "Investment",
  salary: "Salary",
  loan: "Loan",
  expense: "Expense",
  income: "Income",
  other: "Other",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function AccountsTable({ accounts }: AccountsTableProps) {
  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    <div className="ticker-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Transaction Breakdown</h3>
              <p className="text-sm text-muted-foreground">
                {accounts.length} accounts categorized
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground">LIVE DATA</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Account</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Category</TableHead>
              <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-profit">Credit</TableHead>
              <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-loss">Debit</TableHead>
              <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">Net Balance</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Type</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Taxable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account, index) => (
              <TableRow 
                key={index} 
                className="border-border/20 hover:bg-secondary/30 transition-colors"
              >
                <TableCell className="font-medium">{account.account_name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {categoryLabels[account.category] || account.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1 text-profit font-mono">
                    <TrendingUp className="h-3 w-3" />
                    {formatCurrency(account.total_credit)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1 text-loss font-mono">
                    <TrendingDown className="h-3 w-3" />
                    {formatCurrency(account.total_debit)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  <span className={account.net_balance >= 0 ? "text-profit" : "text-loss"}>
                    {formatCurrency(account.net_balance)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={account.classification as "asset" | "liability" | "neutral"}
                    className="font-mono text-xs"
                  >
                    {account.classification.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${account.is_taxable ? 'bg-warning' : 'bg-profit'}`} />
                    <span className={`text-xs font-mono ${account.is_taxable ? 'text-warning' : 'text-profit'}`}>
                      {account.is_taxable ? "YES" : "NO"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}