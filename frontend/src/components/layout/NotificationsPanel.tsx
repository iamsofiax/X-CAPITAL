"use client";

import { useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Cpu,
  ShoppingBag,
  CheckCheck,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { UserNotification } from "@/store/useStore";
import { cn, formatRelativeTime } from "@/lib/utils";

type NotifType =
  | "trade"
  | "deposit"
  | "security"
  | "ai"
  | "commerce"
  | "system";

interface DisplayNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  href?: string;
}

const NOTIF_STYLES: Record<
  NotifType,
  { icon: React.ReactNode; color: string }
> = {
  trade: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: "bg-emerald-500/20 text-emerald-400",
  },
  deposit: {
    icon: <Wallet className="w-4 h-4" />,
    color: "bg-blue-500/20 text-blue-400",
  },
  security: {
    icon: <ShieldCheck className="w-4 h-4" />,
    color: "bg-amber-500/20 text-white/50",
  },
  ai: {
    icon: <Cpu className="w-4 h-4" />,
    color: "bg-white/[0.06] text-white/60",
  },
  commerce: {
    icon: <ShoppingBag className="w-4 h-4" />,
    color: "bg-red-500/20 text-red-400",
  },
  system: {
    icon: <Info className="w-4 h-4" />,
    color: "bg-white/10 text-white/70",
  },
};

function mapStoreType(type: UserNotification["type"]): NotifType {
  if (type === "transaction") return "deposit";
  if (type === "congratulations" || type === "reward") return "trade";
  return "system";
}

function toDisplayNotification(n: UserNotification): DisplayNotification {
  return {
    id: n.id,
    type: mapStoreType(n.type),
    title: n.title,
    message: n.message,
    time: formatRelativeTime(n.createdAt),
    read: n.read,
    href: n.externalLink,
  };
}

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export default function NotificationsPanel({
  open,
  onClose,
  anchorRef,
}: NotificationsPanelProps) {
  const { user, notifications, markNotificationRead, deleteNotification } =
    useStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const displayNotifications = useMemo(
    () =>
      notifications
        .filter((n) => n.userId === user?.id)
        .map(toDisplayNotification),
    [notifications, user?.id],
  );

  const unreadCount = displayNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const markAllRead = () => {
    displayNotifications
      .filter((n) => !n.read)
      .forEach((n) => markNotificationRead(n.id));
  };

  const handleClick = (notif: DisplayNotification) => {
    markNotificationRead(notif.id);
    if (notif.href) {
      onClose();
      router.push(notif.href);
    }
  };

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-node-panel border-2 border-node-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-node-border/60">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Node signals</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-node-signal/20 text-node-signal px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-xc-muted hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {displayNotifications.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-xc-muted">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No signals routed yet
          </div>
        ) : (
          displayNotifications.map((notif) => {
            const style = NOTIF_STYLES[notif.type];
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-white/[0.03] last:border-0",
                  notif.read
                    ? "hover:bg-white/[0.02]"
                    : "bg-white/[0.02] hover:bg-white/[0.04]",
                  notif.href && "cursor-pointer",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    style.color,
                  )}
                >
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        notif.read ? "text-white/70" : "text-white",
                      )}
                    >
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-node-signal flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-xc-muted mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-xc-muted/50 mt-1 block">
                    {notif.time}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                  {notif.href && (
                    <ArrowUpRight className="w-3.5 h-3.5 text-xc-muted/40" />
                  )}
                  <button
                    onClick={(e) => dismiss(notif.id, e)}
                    className="w-5 h-5 rounded flex items-center justify-center text-xc-muted/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
