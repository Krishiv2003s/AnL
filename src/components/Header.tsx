import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Scale, LogOut, LayoutDashboard, Settings, Headphones, Newspaper, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function Header() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => {
    const items = user ? [
      { to: "/dashboard", label: "Analysis", icon: LayoutDashboard },
      { to: "/news", label: "News", icon: Newspaper },
      { to: "/balance-sheet", label: "Bal. Sheet", icon: Scale },
      { to: "/support", label: "Support", icon: Headphones },
      { to: "/settings", label: "Settings", icon: Settings },
    ] : [
      { to: "/dashboard", label: "Analysis", icon: LayoutDashboard },
      { to: "/news", label: "News", icon: Newspaper },
      { to: "/balance-sheet", label: "Bal. Sheet", icon: Scale },
      { to: "/support", label: "Support", icon: Headphones },
    ];

    return (
      <>
        {items.map((item) => (
          <Button key={item.to} variant="ghost" size={mobile ? "lg" : "sm"} asChild className={mobile ? "w-full justify-start" : ""}>
            <Link to={item.to}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
        {user ? (
          <Button variant="outline" size={mobile ? "lg" : "sm"} onClick={handleSignOut} className={mobile ? "w-full justify-start" : ""}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        ) : (
          <>
            <Button variant="ghost" size={mobile ? "lg" : "sm"} asChild className={mobile ? "w-full justify-start" : ""}>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="hero" size={mobile ? "lg" : "sm"} asChild className={mobile ? "w-full" : ""}>
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </>
        )}
      </>
    );
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

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          <NavItems />
        </nav>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left font-display text-xl font-bold flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Scale className="h-4 w-4 text-primary-foreground" />
                  </div>
                  AnL
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <NavItems mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
