import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, BarChart3, FileText, Shield, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden hero-gradient">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -left-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 h-40 w-40 rounded-full bg-primary/10 blur-2xl animate-pulse-slow" />
      </div>

      <div className="container relative pt-32 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-white">AI-Powered Tax Analysis for India</span>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 font-display text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl animate-slide-up">
            <span className="text-primary/80">Your Financial</span>
            <br />
            <span className="text-primary">Assets & Liabilities</span>
            <br />
            <span className="text-primary/80">Simplified</span>
          </h1>

          {/* Subheading */}
          <p className="mb-10 text-lg text-primary/70 md:text-xl max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Upload your bank statements, Form 16, and ledgers. Get instant AI-powered analysis, 
            balance sheets, and personalized tax filing recommendations for India.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start Free Analysis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/auth">
                Sign In
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-primary/60 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Bank-grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>ITR-1 to ITR-4 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Latest Tax Rules 2024-25</span>
            </div>
          </div>
        </div>

        {/* Feature preview cards */}
        <div className="mt-20 grid gap-6 md:grid-cols-3 animate-scale-in" style={{ animationDelay: "0.4s" }}>
          <FeatureCard
            icon={Upload}
            title="Smart Upload"
            description="Upload PDF or Excel bank statements, Form 16, or business ledgers"
          />
          <FeatureCard
            icon={BarChart3}
            title="AI Analysis"
            description="Automatic categorization into Cash, Credit Card, Investments & more"
          />
          <FeatureCard
            icon={FileText}
            title="Tax Insights"
            description="Get ITR form recommendations, warnings & tax-saving opportunities"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="group rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-primary/10">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold text-primary">{title}</h3>
      <p className="text-sm text-primary/70">{description}</p>
    </div>
  );
}
