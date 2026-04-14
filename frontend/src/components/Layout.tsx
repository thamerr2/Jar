import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Landmark, Hammer, Wallet, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { key: "dashboard",   icon: LayoutGrid,       path: "/dashboard",   roles: ["super_admin", "owner", "tenant", "contractor", "union_admin"] },
  { key: "properties",  icon: Landmark,          path: "/properties",  roles: ["super_admin", "owner", "union_admin"] },
  { key: "maintenance", icon: Hammer,            path: "/maintenance", roles: ["super_admin", "owner", "tenant", "contractor", "union_admin"] },
  { key: "payments",    icon: Wallet,            path: "/payments",    roles: ["super_admin", "owner", "tenant", "contractor", "union_admin"] },
  { key: "settings",    icon: SlidersHorizontal, path: "/settings",    roles: ["super_admin", "owner", "tenant", "contractor", "union_admin"] }
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();

  const visibleMobileNav = mobileNav.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuToggle={() => isMobile ? setSidebarOpen(prev => !prev) : setSidebarCollapsed(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-page-in pb-20 md:pb-6" style={{ backgroundColor: '#F8FAFC' }}>
          {children}
        </main>
      </div>

      {/* Mobile overlay sidebar */}
      {isMobile && (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={false}
          onToggleCollapse={() => {}}
        />
      )}

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav className="mobile-tab-bar safe-area-bottom" role="navigation" aria-label="Mobile navigation">
          {visibleMobileNav.map(item => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
            return (
              <Link key={item.key} href={item.path}>
                <a className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                  <span className="hidden xs:block">{t(`nav.${item.key}`)}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
