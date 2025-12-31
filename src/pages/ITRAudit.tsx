import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ITRFileUpload } from "@/components/ITRFileUpload";
import { analyzeITR } from "@/lib/itr-audit-utils";
import type { ITRData, AISData, Form26ASData, AuditResult } from "@/lib/itr-audit-utils";
import {
    ShieldCheck,
    Info,
    FileText,
    CheckCircle2,
    Activity,
    AlertTriangle,
    XCircle,
    History,
    Trash2,
    ArrowRight,
    Zap,
    Loader2,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ITRAudit() {
    const { toast } = useToast();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AuditResult | null>(null);

    const [targetItrFiles, setTargetItrFiles] = useState<{ file: File; type: string; id: string }[]>([]);
    const [supportingDocs, setSupportingDocs] = useState<{ file: File; type: string; id: string }[]>([]);

    const handleAudit = async () => {
        const allFiles = [...targetItrFiles, ...supportingDocs];
        if (allFiles.length === 0) return;

        setIsAnalyzing(true);
        setResult(null);

        // Mock processing delay
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const hasItr = targetItrFiles.some((f) => f.type.startsWith("itr"));
        const hasAis = supportingDocs.some((f) => f.type === "ais");
        const has26as = supportingDocs.some((f) => f.type === "form_26as");

        // Mock extracted data
        const mockItr: ITRData = {
            salary: 1200000,
            interestIncome: 45000,
            dividendIncome: 12000,
            capitalGains: 0,
            deductions: {
                section80C: 160000,
                section80D: 25000,
                section80G: 0,
                rentClaimed: hasItr ? 700000 : 0,
            },
            taxPaid: 150000,
            tdsClaimed: 140000,
        };

        const mockAis: AISData = {
            salary: 1200000,
            interestIncome: hasAis ? 58000 : 45000,
            dividendIncome: hasAis ? 15000 : 12000,
            transactions: [],
        };

        const mock26AS: Form26ASData = {
            totalTds: has26as ? 145000 : 140000,
        };

        const analysis = analyzeITR(mockItr, mockAis, mock26AS);
        setResult(analysis);
        setIsAnalyzing(false);

        toast({
            title: "Audit Analysis Complete",
            description: `Reconciled ${hasItr ? "ITR" : "data"} against ${supportingDocs.length} supporting document(s).`,
        });
    };

    return (
        <div className="min-h-screen bg-background grid-bg">
            <Header />

            <main className="container pt-24 pb-20">
                {/* Hero Section */}
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 font-mono">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">
                            Compliance-First Validation
                        </span>
                    </div>
                    <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                        AI-Style ITR Self-Audit & <br />Verification Tool
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        "Before the tax system checks your return, check it yourself."
                        Identify mismatches between your ITR, AIS, and Form 26AS.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground/60 font-mono tracking-wider uppercase">
                        <span>• AIS Reconciliation</span>
                        <span>• TDS Verification</span>
                        <span>• Deduction Accuracy</span>
                        <span>• Scrutiny Pattern Checks</span>
                    </div>
                </div>

                {/* Legal Disclaimer Box */}
                <div className="max-w-5xl mx-auto mb-12 p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <div className="flex gap-4">
                        <Info className="h-6 w-6 text-primary shrink-0" />
                        <div className="text-sm space-y-2 text-muted-foreground">
                            <p className="font-bold text-foreground">Legal Positioning & Disclaimer:</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 list-disc pl-4 font-mono text-[11px]">
                                <li>Not government-approved or affiliated.</li>
                                <li>Does not file or submit ITRs.</li>
                                <li>Does not replace professional tax advice.</li>
                                <li>Self-verification and readiness tool only.</li>
                                <li>Mirroring logical rules, not proprietary systems.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Upload Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="grid gap-6">
                            <ITRFileUpload
                                title="1. ITR for Audit"
                                description="The file you want to audit for flags"
                                allowedTypes={["itr_json", "itr_pdf"]}
                                isUploading={isAnalyzing}
                                onChange={setTargetItrFiles}
                                maxFiles={1}
                            />

                            <ITRFileUpload
                                title="2. Supporting Baseline"
                                description="Files to compare against (AIS, 26AS)"
                                allowedTypes={["ais", "form_26as", "bank_statement"]}
                                isUploading={isAnalyzing}
                                onChange={setSupportingDocs}
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <Button
                                onClick={handleAudit}
                                disabled={targetItrFiles.length === 0 || isAnalyzing}
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold uppercase tracking-widest shadow-xl shadow-primary/20"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Running Audit...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-5 w-5" />
                                        Run Self-Audit Analysis
                                    </>
                                )}
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground mt-3 font-mono">
                                Comparison engine will run against the added baseline.
                            </p>
                        </div>

                        <div className="ticker-card p-6 space-y-4">
                            <h3 className="font-display font-semibold flex items-center gap-2">
                                <Lock className="h-4 w-4 text-primary" />
                                Privacy & Security
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Your documents are encrypted during analysis and auto-deleted immediately after.
                                No data is shared or stored permanently.
                            </p>
                            <div className="flex items-center gap-2 text-xs font-mono text-profit">
                                <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
                                End-to-End Encrypted Analysis
                            </div>
                        </div>
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-7">
                        {!result && !isAnalyzing ? (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center ticker-card border-dashed">
                                <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <h3 className="text-xl font-display font-semibold mb-2">Ready for Analysis</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                                    Upload your draft ITR and at least one supporting document (AIS/26AS) to see audit results.
                                </p>
                                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
                                    <div className="p-4 rounded-xl bg-secondary/30 text-left border border-border/50">
                                        <CheckCircle2 className="h-5 w-5 text-profit mb-2" />
                                        <p className="text-xs font-bold font-mono">STEP 1</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">Upload Files</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-secondary/30 text-left border border-border/50">
                                        <Activity className="h-5 w-5 text-primary mb-2" />
                                        <p className="text-xs font-bold font-mono">STEP 2</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">Review Risk Flags</p>
                                    </div>
                                </div>
                            </div>
                        ) : isAnalyzing ? (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center ticker-card">
                                <div className="relative mb-8">
                                    <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                    <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-display font-bold mb-2">Reconciling Data...</h3>
                                <p className="text-muted-foreground animate-pulse font-mono text-xs uppercase tracking-widest">
                                    Checking TDS vs Form 26AS • Reconciling AIS interest • Validating 80C limits
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                {/* Risk Score Card */}
                                <div className={cn(
                                    "p-8 rounded-2xl border-2 flex flex-col md:flex-row items-center gap-8",
                                    result?.riskScore === "low" ? "bg-profit/5 border-profit/20" :
                                        result?.riskScore === "medium" ? "bg-warning/5 border-warning/20" :
                                            "bg-loss/5 border-loss/20"
                                )}>
                                    <div className="relative shrink-0">
                                        <div className={cn(
                                            "h-32 w-32 rounded-full border-8 flex items-center justify-center",
                                            result?.riskScore === "low" ? "border-profit/20 text-profit" :
                                                result?.riskScore === "medium" ? "border-warning/20 text-warning" :
                                                    "border-loss/20 text-loss"
                                        )}>
                                            <span className="text-2xl font-bold font-mono uppercase">
                                                {result?.riskScore}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-2 -right-2 p-2 rounded-full",
                                            result?.riskScore === "low" ? "bg-profit" :
                                                result?.riskScore === "medium" ? "bg-warning" :
                                                    "bg-loss"
                                        )}>
                                            {result?.riskScore === "low" ? <CheckCircle2 className="h-6 w-6 text-white" /> :
                                                result?.riskScore === "medium" ? <AlertTriangle className="h-6 w-6 text-white" /> :
                                                    <XCircle className="h-6 w-6 text-white" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-display font-bold mb-2">
                                            {result?.riskScore === "low" ? "Consistency Verified" :
                                                result?.riskScore === "medium" ? "Corrections Recommended" :
                                                    "High-Risk Flags Detected"}
                                        </h3>
                                        <p className="text-muted-foreground mb-4 text-sm">
                                            {result?.riskScore === "low" ? "Your ITR appears consistent with supporting documents. Ready for filing." :
                                                result?.riskScore === "medium" ? "We found minor mismatches or unclaimed credits that should be reviewed." :
                                                    "Significant mismatches or rule violations found. High probability of scrutiny triggers."}
                                        </p>
                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                            <div className="px-3 py-1 rounded-full bg-secondary text-[10px] font-bold font-mono uppercase">
                                                {result?.summary.totalIncomeMismatches} Income Mismatches
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-secondary text-[10px] font-bold font-mono uppercase">
                                                {result?.summary.totalDeductionFlags} Deduction Flags
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Issues */}
                                <div className="space-y-4">
                                    <h4 className="font-display font-bold text-lg flex items-center gap-2">
                                        <History className="h-5 w-5 text-primary" />
                                        Audit Findings
                                    </h4>
                                    {result?.issues.map((issue) => (
                                        <div key={issue.id} className="ticker-card p-5 border-l-4 overflow-hidden relative" style={{
                                            borderLeftColor: issue.severity === "error" ? "var(--loss)" :
                                                issue.severity === "warning" ? "var(--warning)" : "var(--primary)"
                                        }}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase",
                                                        issue.severity === "error" ? "bg-loss text-white" :
                                                            issue.severity === "warning" ? "bg-warning text-white" : "bg-primary text-white"
                                                    )}>
                                                        {issue.severity}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Source: {issue.sourceDocument}</span>
                                                </div>
                                                {issue.amountDifference && (
                                                    <span className="text-sm font-mono font-bold text-loss">
                                                        -₹{issue.amountDifference.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            <h5 className="font-bold mb-1">{issue.title}</h5>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {issue.description}
                                            </p>
                                            <div className="p-3 bg-secondary/50 rounded-lg flex gap-3 items-start">
                                                <CheckCircle2 className="h-4 w-4 text-profit shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-profit uppercase mb-1 tracking-widest">Recommended Action</p>
                                                    <p className="text-sm text-foreground">{issue.recommendation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => setResult(null)} className="font-mono text-xs uppercase tracking-widest h-10">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                    <Button className="bg-primary hover:bg-primary/90 font-mono text-xs uppercase tracking-widest h-10">
                                        Export Report
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
