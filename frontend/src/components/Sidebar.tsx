import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutGrid, Landmark, Hammer, HardHat, Wallet,
  LineChart, SlidersHorizontal, ShieldCheck, LogOut, X,
  ChevronLeft, ChevronRight, Briefcase, FileCheck, UserCircle,
  Users, Wrench
} from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
  { key: "dashboard",   icon: LayoutGrid,        path: "/dashboard",   roles: ["owner", "tenant", "contractor", "union_admin"] },
  { key: "properties",  icon: Landmark,           path: "/properties",  roles: ["owner", "union_admin"] },
  { key: "maintenance", icon: Hammer,             path: "/maintenance", roles: ["owner", "tenant", "contractor", "union_admin"] },
  { key: "contractors", icon: HardHat,            path: "/contractors", roles: ["owner", "union_admin"] },
  { key: "payments",    icon: Wallet,             path: "/payments",    roles: ["owner", "tenant", "contractor", "union_admin"] },
  { key: "reports",     icon: LineChart,          path: "/reports",     roles: ["owner", "union_admin"] },
  { key: "settings",    icon: SlidersHorizontal,  path: "/settings",    roles: ["owner", "tenant", "contractor", "union_admin"] },
];

const superAdminNavItems = [
  { key: "dashboard",   icon: LayoutGrid,        path: "/dashboard" },
  { key: "management",  icon: ShieldCheck,       path: "/admin" },
  { key: "maintenance", icon: Wrench,            path: "/maintenance" },
  { key: "properties",  icon: Landmark,          path: "/properties" },
  { key: "contractors", icon: HardHat,           path: "/contractors" },
  { key: "payments",    icon: Wallet,            path: "/payments" },
  { key: "reports",     icon: LineChart,         path: "/reports" },
  { key: "settings",    icon: SlidersHorizontal, path: "/settings" },
];

const contractorItems = [
  { key: "jobs",      icon: Briefcase,    path: "/jobs" },
  { key: "myQuotes",  icon: FileCheck,    path: "/my-quotes" },
  { key: "profile",   icon: UserCircle,   path: "/contractor-profile" }
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isRTL = i18n.language === "ar";
  const appName = i18n.language === "ar" ? "جار" : "Jar";

  const visible = user?.role === "super_admin"
    ? superAdminNavItems
    : navItems.filter(item => user && item.roles.includes(user.role));
  const isContractor = user?.role === "contractor";

  const sidebarWidth = collapsed ? "lg:w-16" : "lg:w-64";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-50 h-full sidebar-gradient text-sidebar-foreground flex flex-col transition-all duration-300",
          "lg:static lg:z-auto",
          sidebarWidth,
          isRTL
            ? (open ? "right-0 w-64 translate-x-0" : "right-0 w-64 translate-x-full lg:translate-x-0")
            : (open ? "left-0 w-64 translate-x-0" : "left-0 w-64 -translate-x-full lg:translate-x-0")
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-300",
          collapsed ? "lg:justify-center p-3" : "justify-between p-4"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Jar" className="w-8 h-8 rounded-lg object-contain shrink-0" />
              <span className="text-xl font-bold text-sidebar-foreground">{appName}</span>
            </div>
          )}
          {collapsed && (
            <img src="/logo.svg" alt="Jar" className="w-8 h-8 rounded-lg object-contain" />
          )}

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground/70 hover:text-white p-1"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex text-sidebar-foreground/70 hover:text-white p-1 rounded"
              aria-label="Collapse sidebar"
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Collapse expand button when collapsed */}
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center py-2 text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent transition-colors"
            aria-label="Expand sidebar"
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        {/* User info */}
        {user && !collapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'rgba(136,217,176,0.2)', border: '1px solid rgba(136,217,176,0.25)', color: '#88D9B0' }}>
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{t(`roles.${user.role}`)}</p>
              </div>
            </div>
          </div>
        )}

        {user && collapsed && (
          <div className="flex justify-center py-3 border-b border-sidebar-border lg:flex hidden">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(136,217,176,0.2)', border: '1px solid rgba(136,217,176,0.25)', color: '#88D9B0' }} title={user.name}>
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" role="navigation" aria-label="Main navigation">
          {visible.map(item => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
            return (
              <Link key={item.key} href={item.path}>
                <a
                  onClick={onClose}
                  title={collapsed ? t(`nav.${item.key}`) : undefined}
                  aria-label={t(`nav.${item.key}`)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    collapsed ? "lg:justify-center" : "",
                    isActive
                      ? "nav-glass-active"
                      : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="lg:block">{t(`nav.${item.key}`)}</span>}
                </a>
              </Link>
            );
          })}

          {/* Contractor-specific nav items */}
          {isContractor && !collapsed && (
            <div className="pt-2 border-t border-sidebar-border mt-2">
              {contractorItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link key={item.key} href={item.path}>
                    <a
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "nav-glass-active"
                          : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{t(`nav.${item.key}`)}</span>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={() => { logout(); onClose(); }}
            aria-label={t("nav.logout")}
            title={collapsed ? t("nav.logout") : undefined}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-white/5 hover:text-white transition-colors",
              collapsed ? "lg:justify-center" : ""
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t("nav.logout")}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
