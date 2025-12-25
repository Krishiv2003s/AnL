import { Scale } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">AnL</span>
            <span className="text-muted-foreground">- Assets & Liabilities</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AnL. All rights reserved.
          </p>
        </div>

        {/* Ad space placeholder */}
        <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">Advertisement Space - Google Ads</p>
        </div>
      </div>
    </footer>
  );
}
