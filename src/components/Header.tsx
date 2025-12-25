import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Scale, LogOut, LayoutDashboard, Settings, Headphones, Zap } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">AnL</span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Analysis
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/balance-sheet">
                  <Scale className="mr-2 h-4 w-4" />
                  Bal. Sheet
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/support">
                  <Headphones className="mr-2 h-4 w-4" />
                  Support
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/subscription">
                  <Zap className="mr-2 h-4 w-4" />
                  Subscription
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth?mode=signup">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
