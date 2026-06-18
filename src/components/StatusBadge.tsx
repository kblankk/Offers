import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import type { CouponStatus } from "@/lib/types";

const MAP: Record<CouponStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  active: {
    label: "Ativo",
    cls: "text-emerald-700 bg-emerald-50 ring-emerald-600/15 dark:text-emerald-400 dark:bg-emerald-500/10 dark:ring-emerald-400/20",
    Icon: CheckCircle2,
  },
  expired: {
    label: "Expirado",
    cls: "text-rose-700 bg-rose-50 ring-rose-600/15 dark:text-rose-400 dark:bg-rose-500/10 dark:ring-rose-400/20",
    Icon: XCircle,
  },
  suspected_exhausted: {
    label: "Pode ter esgotado",
    cls: "text-amber-700 bg-amber-50 ring-amber-600/15 dark:text-amber-400 dark:bg-amber-500/10 dark:ring-amber-400/20",
    Icon: AlertTriangle,
  },
  unknown: {
    label: "Não verificado",
    cls: "text-zinc-600 bg-zinc-100 ring-zinc-500/15 dark:text-zinc-400 dark:bg-zinc-800 dark:ring-zinc-400/15",
    Icon: HelpCircle,
  },
};

export function StatusBadge({ status }: { status: CouponStatus }) {
  const { label, cls, Icon } = MAP[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
