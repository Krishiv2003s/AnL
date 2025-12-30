
export interface AuditIssue {
    id: string;
    severity: "error" | "warning" | "info";
    title: string;
    description: string;
    recommendation: string;
    sourceDocument: string;
    amountDifference?: number;
}

export interface ITRData {
    salary: number;
    interestIncome: number;
    dividendIncome: number;
    capitalGains: number;
    deductions: {
        section80C: number;
        section80D: number;
        section80G: number;
        rentClaimed: number;
    };
    taxPaid: number;
    tdsClaimed: number;
}

export interface AISData {
    salary?: number;
    interestIncome?: number;
    dividendIncome?: number;
    tds?: number;
    transactions: { date: string; description: string; amount: number }[];
}

export interface Form26ASData {
    totalTds: number;
}

export interface AuditResult {
    riskScore: "low" | "medium" | "high";
    issues: AuditIssue[];
    summary: {
        totalIncomeMismatches: number;
        totalDeductionFlags: number;
        totalTdsMismatches: number;
    };
}

export const analyzeITR = (
    itr: ITRData,
    ais: AISData,
    form26as: Form26ASData,
    previousItr?: ITRData
): AuditResult => {
    const issues: AuditIssue[] = [];
    let incomeMismatches = 0;
    let deductionFlags = 0;
    let tdsMismatches = 0;

    // 1. AIS vs ITR Interest Mismatch
    if (ais.interestIncome && ais.interestIncome > itr.interestIncome + 100) {
        incomeMismatches++;
        issues.push({
            id: "AIS_INT_MISMATCH",
            severity: "error",
            title: "Interest Income Mismatch",
            description: `AIS shows ₹${ais.interestIncome.toLocaleString()} interest, but only ₹${itr.interestIncome.toLocaleString()} reported in ITR.`,
            recommendation: "Update ITR to include all interest income from bank statements and AIS.",
            sourceDocument: "AIS",
            amountDifference: ais.interestIncome - itr.interestIncome,
        });
    }

    // 2. AIS vs ITR Dividend Mismatch
    if (ais.dividendIncome && ais.dividendIncome > itr.dividendIncome + 10) {
        incomeMismatches++;
        issues.push({
            id: "AIS_DIV_MISMATCH",
            severity: "warning",
            title: "Dividend Income Mismatch",
            description: `AIS shows ₹${ais.dividendIncome.toLocaleString()} dividend, but ₹${itr.dividendIncome.toLocaleString()} reported.`,
            recommendation: "Ensure all dividends reflected in AIS are reported in Schedule OS.",
            sourceDocument: "AIS",
            amountDifference: ais.dividendIncome - itr.dividendIncome,
        });
    }

    // 3. TDS Verification (26AS vs ITR)
    if (form26as.totalTds > itr.tdsClaimed + 100) {
        tdsMismatches++;
        issues.push({
            id: "TDS_NOT_CLAIMED",
            severity: "warning",
            title: "Unclaimed TDS",
            description: `Form 26AS shows ₹${form26as.totalTds.toLocaleString()} TDS, but only ₹${itr.tdsClaimed.toLocaleString()} claimed.`,
            recommendation: "Claim the full TDS amount shown in Form 26AS to avoid losing tax credits.",
            sourceDocument: "Form 26AS",
            amountDifference: form26as.totalTds - itr.tdsClaimed,
        });
    }

    // 4. Deduction Limits (80C, 80D)
    if (itr.deductions.section80C > 150000) {
        deductionFlags++;
        issues.push({
            id: "LIMIT_80C_EXCEEDED",
            severity: "error",
            title: "80C Limit Exceeded",
            description: `Section 80C deduction claimed is ₹${itr.deductions.section80C.toLocaleString()}, which exceeds the ₹1,50,000 limit.`,
            recommendation: "Restrict 80C claims to the maximum statutory limit of ₹1.5 Lakh.",
            sourceDocument: "ITR",
        });
    }

    if (itr.deductions.section80D > 100000) {
        deductionFlags++;
        issues.push({
            id: "LIMIT_80D_EXCEEDED",
            severity: "error",
            title: "80D Limit Exceeded",
            description: "Health insurance deduction exceeds realistic limits for senior citizens and families.",
            recommendation: "Verify premiums against actual receipts and statutory limits.",
            sourceDocument: "ITR",
        });
    }

    // 5. Pattern Analysis: Rent vs Salary
    if (itr.salary > 0 && itr.deductions.rentClaimed > itr.salary * 0.5) {
        deductionFlags++;
        issues.push({
            id: "HIGH_RENT_CLAIM",
            severity: "warning",
            title: "High Rent Claimed",
            description: "Rent claimed exceeds 50% of the reported salary income.",
            recommendation: "Ensure you have rent receipts and PAN of the landlord as this is a high-risk flag.",
            sourceDocument: "ITR",
        });
    }

    // 6. Year-on-Year Anomaly Detection
    if (previousItr) {
        if (itr.salary < previousItr.salary * 0.7) {
            issues.push({
                id: "YOY_SALARY_DROP",
                severity: "info",
                title: "Significant Salary Drop",
                description: "Your salary income has dropped significantly compared to last year.",
                recommendation: "Maintain proof of job change or leave without pay for verification.",
                sourceDocument: "Previous ITR",
            });
        }
    }

    // Risk Scoring
    let riskScore: "low" | "medium" | "high" = "low";
    if (incomeMismatches > 0 || deductionFlags > 1) {
        riskScore = "high";
    } else if (tdsMismatches > 0 || deductionFlags > 0) {
        riskScore = "medium";
    }

    return {
        riskScore,
        issues,
        summary: {
            totalIncomeMismatches: incomeMismatches,
            totalDeductionFlags: deductionFlags,
            totalTdsMismatches: tdsMismatches,
        },
    };
};
