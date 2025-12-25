import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  TrendingDown,
  CheckCircle2,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxComparisonProps {
  totalIncome: number;
  salaryIncome?: number;
}

// Tax slabs for FY 2024-25
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.2 },
  { min: 1000000, max: Infinity, rate: 0.3 },
];

const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.1 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.2 },
  { min: 1500000, max: Infinity, rate: 0.3 },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const calculateTax = (income: number, slabs: typeof OLD_REGIME_SLABS) => {
  let tax = 0;
  let remainingIncome = income;

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    const taxableInSlab = Math.min(remainingIncome, slab.max - slab.min);
    tax += taxableInSlab * slab.rate;
    remainingIncome -= taxableInSlab;
  }

  return tax;
};

export function TaxComparison({ totalIncome, salaryIncome = 0 }: TaxComparisonProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [deductions, setDeductions] = useState({
    section80C: 150000,
    section80D: 25000,
    hra: 0,
    lta: 0,
    standardDeduction: 50000,
    nps80CCD: 50000,
  });

  // Calculate total deductions for Old Regime
  const totalOldDeductions =
    deductions.section80C +
    deductions.section80D +
    deductions.hra +
    deductions.lta +
    deductions.standardDeduction +
    deductions.nps80CCD;

  // New Regime only gets standard deduction of 75000 (increased in Budget 2024)
  const newRegimeStandardDeduction = 75000;

  // Taxable income calculations
  const oldRegimeTaxableIncome = Math.max(0, totalIncome - totalOldDeductions);
  const newRegimeTaxableIncome = Math.max(0, totalIncome - newRegimeStandardDeduction);

  // Tax calculations
  const oldRegimeTax = calculateTax(oldRegimeTaxableIncome, OLD_REGIME_SLABS);
  const newRegimeTax = calculateTax(newRegimeTaxableIncome, NEW_REGIME_SLABS);

  // Rebate under section 87A
  const oldRegimeRebate = oldRegimeTaxableIncome <= 500000 ? Math.min(oldRegimeTax, 12500) : 0;
  const newRegimeRebate = newRegimeTaxableIncome <= 700000 ? Math.min(newRegimeTax, 25000) : 0;

  // Final tax after rebate
  const oldRegimeFinalTax = Math.max(0, oldRegimeTax - oldRegimeRebate);
  const newRegimeFinalTax = Math.max(0, newRegimeTax - newRegimeRebate);

  // Add 4% cess
  const oldRegimeTotalTax = oldRegimeFinalTax * 1.04;
  const newRegimeTotalTax = newRegimeFinalTax * 1.04;

  // Determine better regime
  const savings = Math.abs(oldRegimeTotalTax - newRegimeTotalTax);
  const betterRegime = oldRegimeTotalTax < newRegimeTotalTax ? "old" : "new";

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-accent" />
          Tax Regime Comparison
          <Badge variant="info" className="ml-auto">
            FY 2024-25
          </Badge>
        </CardTitle>
        <CardDescription>
          Compare your tax liability under Old vs New tax regime
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Old Regime */}
          <div
            className={cn(
              "rounded-xl border-2 p-4 transition-all",
              betterRegime === "old"
                ? "border-success bg-success/5"
                : "border-border bg-muted/30"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">Old Regime</h3>
              {betterRegime === "old" && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Better Choice
                </Badge>
              )}
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(oldRegimeTotalTax)}</p>
            <p className="text-sm text-muted-foreground">
              Taxable: {formatCurrency(oldRegimeTaxableIncome)}
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deductions claimed</span>
                <span className="text-success">-{formatCurrency(totalOldDeductions)}</span>
              </div>
              {oldRegimeRebate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">87A Rebate</span>
                  <span className="text-success">-{formatCurrency(oldRegimeRebate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* New Regime */}
          <div
            className={cn(
              "rounded-xl border-2 p-4 transition-all",
              betterRegime === "new"
                ? "border-success bg-success/5"
                : "border-border bg-muted/30"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">New Regime</h3>
              {betterRegime === "new" && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Better Choice
                </Badge>
              )}
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(newRegimeTotalTax)}</p>
            <p className="text-sm text-muted-foreground">
              Taxable: {formatCurrency(newRegimeTaxableIncome)}
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standard Deduction</span>
                <span className="text-success">-{formatCurrency(newRegimeStandardDeduction)}</span>
              </div>
              {newRegimeRebate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">87A Rebate</span>
                  <span className="text-success">-{formatCurrency(newRegimeRebate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Savings highlight */}
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
          <Sparkles className="h-5 w-5 text-accent" />
          <p className="font-medium">
            You save{" "}
            <span className="text-accent font-bold">{formatCurrency(savings)}</span> by choosing{" "}
            <span className="text-accent font-bold">
              {betterRegime === "old" ? "Old Regime" : "New Regime"}
            </span>
          </p>
        </div>

        {/* Toggle Details */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Hide Deduction Details
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Customize Deductions
            </>
          )}
        </Button>

        {/* Deduction inputs */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Adjust your deductions to see how they affect your tax calculation
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="80c">Section 80C (PPF, ELSS, etc.)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="80c"
                    type="number"
                    className="pl-9"
                    value={deductions.section80C}
                    onChange={(e) =>
                      setDeductions({ ...deductions, section80C: Math.min(150000, Number(e.target.value)) })
                    }
                    max={150000}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Max: ₹1,50,000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="80d">Section 80D (Health Insurance)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="80d"
                    type="number"
                    className="pl-9"
                    value={deductions.section80D}
                    onChange={(e) =>
                      setDeductions({ ...deductions, section80D: Math.min(100000, Number(e.target.value)) })
                    }
                    max={100000}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Max: ₹1,00,000 (with parents)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hra">HRA Exemption</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hra"
                    type="number"
                    className="pl-9"
                    value={deductions.hra}
                    onChange={(e) =>
                      setDeductions({ ...deductions, hra: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nps">NPS 80CCD(1B)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nps"
                    type="number"
                    className="pl-9"
                    value={deductions.nps80CCD}
                    onChange={(e) =>
                      setDeductions({ ...deductions, nps80CCD: Math.min(50000, Number(e.target.value)) })
                    }
                    max={50000}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Max: ₹50,000 (additional)</p>
              </div>
            </div>
          </div>
        )}

        {/* Tax Slabs Reference */}
        <Separator />
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Old Regime Slabs</h4>
            <div className="space-y-1 text-muted-foreground">
              <p>₹0 - ₹2.5L: 0%</p>
              <p>₹2.5L - ₹5L: 5%</p>
              <p>₹5L - ₹10L: 20%</p>
              <p>Above ₹10L: 30%</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">New Regime Slabs</h4>
            <div className="space-y-1 text-muted-foreground">
              <p>₹0 - ₹3L: 0%</p>
              <p>₹3L - ₹7L: 5%</p>
              <p>₹7L - ₹10L: 10%</p>
              <p>₹10L - ₹12L: 15%</p>
              <p>₹12L - ₹15L: 20%</p>
              <p>Above ₹15L: 30%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
