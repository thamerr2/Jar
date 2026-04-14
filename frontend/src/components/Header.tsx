import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import {
  Bell, Sun, Moon, Menu, X, Search, Check, CheckCheck,
  AlertCircle, Info, Hammer, Wallet, Landmark, ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type?: string;
  createdAt: string;
  link?: string;
}

interface HeaderProps {
  onMenuToggle: () => void;
}

function NotificationIcon({ type }: { type?: string }) {
  const icons: Record<string, React.ReactNode> = {
    maintenance: <Hammer className="w-4 h-4 text-teal-600" />,
    payment:     <Wallet className="w-4 h-4 text-emerald-600" />,
    property:    <Landmark className="w-4 h-4 text-blue-600" />,
    warning:     <AlertCircle className="w-4 h-4 text-amber-500" />,
    info:        <Info className="w-4 h-4 text-blue-400" />
  };
  return <span>{icons[type ?? "info"] ?? <Info className="w-4 h-4 text-blue-400" />}</span>;
}

function groupByDate(notifications: Notification[]) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const groups: Record<string, Notification[]> = { today: [], yesterday: [], earlier: [] };
  for (const n of notifications) {
    const d = new Date(n.createdAt).toDateString();
    if (d === today) groups["today"].push(n);
    else if (d === yesterday) groups["yesterday"].push(n);
    else groups["earlier"].push(n);
  }
  return groups;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ type: string; id: string; label: string; path: string }>>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // WebSocket for real-time notifications
  useWebSocket(user?.id);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiRequest("GET", "/api/notifications"),
    enabled: !!user
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] })
  });

  const markAllRead = useMutation({
    mutationFn: () => Promise.all(
      notifications.filter(n => !n.read).map(n => apiRequest("PATCH", `/api/notifications/${n.id}/read`))
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] })
  });

  const unread = notifications.filter(n => !n.read).length;

  // Update tab title with unread count
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) Jar` : "Jar";
  }, [unread]);

  // Show toast for new notifications (from WS)
  const prevCountRef = useRef(notifications.length);
  useEffect(() => {
    if (notifications.length > prevCountRef.current) {
      const newest = notifications[0];
      if (newest && !newest.read) {
        toast({
          title: newest.title,
          description: newest.message
        });
      }
    }
    prevCountRef.current = notifications.length;
  }, [notifications]);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  };

  // Global search
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === "d" || e.key === "D") navigate("/dashboard");
        if (e.key === "m" || e.key === "M") navigate("/maintenance");
        if (e.key === "n" || e.key === "N") setDrawerOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const controller = new AbortController();
    setIsLoading(true);

    const run = async () => {
      try {
        const [props, reqs] = await Promise.all([
          apiRequest<any[]>("GET", `/api/properties`).catch(() => []),
          apiRequest<any[]>("GET", `/api/maintenance-requests`).catch(() => [])
        ]);
        const q = searchQuery.toLowerCase();
        const results = [
          ...((props || []).filter((p: any) => p.title?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q))
            .slice(0, 3).map((p: any) => ({ type: "Property", id: p.id, label: p.title, path: `/properties/${p.id}` }))),
          ...((reqs || []).filter((r: any) => r.title?.toLowerCase().includes(q))
            .slice(0, 3).map((r: any) => ({ type: "Maintenance", id: r.id, label: r.title, path: `/maintenance/${r.id}` })))
        ];
        if (!controller.signal.aborted) setSearchResults(results);
      } catch { /* ignore */ }
      finally { if (!controller.signal.aborted) setIsLoading(false); }
    };

    const timer = setTimeout(run, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery]);

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const displayedNotifications = activeTab === "unread" ? notifications.filter(n => !n.read) : notifications;
  const displayedGroups = groupByDate(displayedNotifications);

  return (
    <>
      {/* Progress bar during navigation */}
      <header className="h-16 border-b bg-background/95 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex-1" />

        {/* Global search trigger */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-muted-foreground w-48 lg:w-64 justify-start"
          onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          aria-label="Open search (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm flex-1 text-start">{t("common.search")}...</span>
          <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
        </Button>

        <div className="flex items-center gap-1">
          {/* Language switcher */}
          <Button variant="ghost" size="sm" onClick={toggleLang} className="font-medium text-sm">
            {i18n.language === "ar" ? "EN" : "عر"}
          </Button>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Notifications bell */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setDrawerOpen(true)}
              aria-label={`${t("notification.title")} - ${unread} unread`}
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center rounded-full font-bold animate-bounce-in">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          )}

          {/* User avatar */}
          {user && (
            <div
              className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity ms-1"
              title={user.name}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Notification Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className={cn(
            "fixed top-0 bottom-0 z-50 w-80 md:w-96 bg-background border-l flex flex-col shadow-2xl animate-slide-in-right",
            i18n.language === "ar" ? "left-0 border-r border-l-0" : "right-0"
          )}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-base">{t("notification.title")}</h2>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                  >
                    <CheckCheck className="w-3 h-3 me-1" />
                    {t("notification.markAllRead")}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} aria-label="Close notifications">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {(["all", "unread"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-medium transition-colors",
                    activeTab === tab
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "all" ? t("notification.all") : `${t("notification.unread")}${unread > 0 ? ` (${unread})` : ""}`}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {displayedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-16">
                  <Bell className="w-10 h-10 opacity-30" />
                  <p className="text-sm">{t("notification.noNotifications")}</p>
                </div>
              ) : (
                Object.entries(displayedGroups).map(([group, items]) =>
                  items.length > 0 ? (
                    <div key={group}>
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30">
                        {t(`notification.${group}`)}
                      </div>
                      {items.map(n => {
                        const isRecent = Date.now() - new Date(n.createdAt).getTime() < 3600000;
                        return (
                          <div
                            key={n.id}
                            className={cn(
                              "flex gap-3 p-4 border-b cursor-pointer hover:bg-muted/40 transition-colors",
                              !n.read && "bg-primary/5"
                            )}
                            onClick={() => {
                              if (!n.read) markRead.mutate(n.id);
                              if (n.link) navigate(n.link);
                            }}
                          >
                            <div className="mt-0.5 shrink-0">
                              <NotificationIcon type={n.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{n.title}</p>
                                {isRecent && <span className="pulse-dot shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                              {n.link && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null
                )
              )}
            </div>
          </aside>
        </>
      )}

      {/* Global Search Palette */}
      {searchOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
          />
          <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-zoom-in">
            <div className="bg-background rounded-xl shadow-2xl border overflow-hidden">
              <div className="flex items-center gap-3 p-3 border-b">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`${t("common.search")}...`}
                  className="border-0 shadow-none focus-visible:ring-0 text-base"
                />
                <Button variant="ghost" size="icon" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {isLoading && (
                  <div className="p-4 text-sm text-muted-foreground text-center">{t("notification.searching")}</div>
                )}
                {!isLoading && searchQuery && searchResults.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground text-center">{t("notification.noResults")}</div>
                )}
                {searchResults.length > 0 && (
                  <div className="p-2">
                    {searchResults.map(r => (
                      <button
                        key={r.id}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted text-start transition-colors"
                        onClick={() => { navigate(r.path); setSearchOpen(false); setSearchQuery(""); }}
                      >
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{r.type}</span>
                        <span className="text-sm flex-1 truncate">{r.label}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
                {!searchQuery && (
                  <div className="p-4 text-xs text-muted-foreground space-y-1">
                    <p>{t("notification.keyboardShortcuts")}</p>
                    <p><kbd className="bg-muted px-1 py-0.5 rounded">Alt+D</kbd> {t("notification.shortcutDashboard")}</p>
                    <p><kbd className="bg-muted px-1 py-0.5 rounded">Alt+M</kbd> {t("notification.shortcutMaintenance")}</p>
                    <p><kbd className="bg-muted px-1 py-0.5 rounded">Alt+N</kbd> {t("notification.shortcutNotifications")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
