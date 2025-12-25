import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-primary">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-4xl font-bold text-primary-foreground mb-6">
            Ready to Simplify Your Tax Filing?
          </h2>
          <p className="text-lg text-primary-foreground/70 mb-10">
            Join thousands of Indians who trust AnL for accurate financial analysis and tax insights. 
            Start your free analysis today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-primary-foreground/50">
              No credit card required • Free tier available
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
