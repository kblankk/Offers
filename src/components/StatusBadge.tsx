import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import type { CouponStatus } from "@/lib/types";

const MAP: Record<
  CouponStatus,
  { label: string; cls: string; Icon: typeof CheckCircle2 }
> = {
  active: {
    label: "Ativo",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Icon: CheckCircle2,
  },
  expired: {
    label: "Expirado",
    cls: "bg-rose-50 text-rose-700 ring-rose-600/20",
    Icon: XCircle,
  },
  suspected_exhausted: {
    label: "Pode ter esgotado",
    cls: "bg-amber-50 text-amber-700 ring-amber-600/20",
    Icon: AlertTriangle,
  },
  unknown: {
    label: "Nao verificado",
    cls: "bg-slate-100 text-slate-600 ring-slate-500/20",
    Icon: HelpCircle,
  },
};

export function StatusBadge({ status }: { status: CouponStatus }) {
  const { label, cls, Icon } = MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
