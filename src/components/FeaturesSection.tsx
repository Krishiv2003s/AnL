import { 
  FileSpreadsheet, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Building2,
  Receipt
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: FileSpreadsheet,
      title: "Multi-Format Support",
      description: "Upload PDF bank statements, Excel ledgers, Form 16, and more. Our AI extracts data accurately.",
    },
    {
      icon: CreditCard,
      title: "Smart Categorization",
      description: "Transactions automatically sorted into Cash, Credit Card, Bank Transfer, Salary, Investments, and Expenses.",
    },
    {
      icon: Wallet,
      title: "Balance Sheet Generation",
      description: "Instant asset and liability breakdown with net worth calculation for any financial period.",
    },
    {
      icon: TrendingUp,
      title: "Tax Regime Comparison",
      description: "Compare Old vs New tax regime to find which saves you more based on your actual numbers.",
    },
    {
      icon: AlertTriangle,
      title: "Red Flag Alerts",
      description: "Get warnings for cash limit violations, crypto trading, TDS mismatches, and compliance issues.",
    },
    {
      icon: CheckCircle2,
      title: "ITR Form Recommendation",
      description: "Know exactly which ITR form to file—ITR-1, ITR-2, ITR-3, or ITR-4—based on your income sources.",
    },
    {
      icon: Building2,
      title: "Business Ready",
      description: "Perfect for freelancers, small businesses, and professionals with complex income streams.",
    },
    {
      icon: Receipt,
      title: "Deduction Finder",
      description: "Discover eligible deductions under 80C, 80D, HRA, and the latest budget provisions.",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold mb-4">
            Everything You Need for
            <span className="text-accent"> Tax Filing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powered by AI analysis using the latest Indian tax regulations and budget announcements
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-lg animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all group-hover:bg-accent group-hover:text-accent-foreground group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
