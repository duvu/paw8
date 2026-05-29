import type { ReactNode } from 'react';

type Tone = 'neutral' | 'error' | 'success' | 'warning';

const toneClasses: Record<Tone, { border: string; icon: string; bg: string }> = {
  neutral: {
    border: 'border-slate-200',
    icon: 'text-slate-500',
    bg: 'bg-slate-50/80',
  },
  error: {
    border: 'border-red-200',
    icon: 'text-red-600',
    bg: 'bg-red-50/90',
  },
  success: {
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50/90',
  },
  warning: {
    border: 'border-amber-200',
    icon: 'text-amber-600',
    bg: 'bg-amber-50/90',
  },
};

export function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-white/70 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function StatePanel({
  title,
  description,
  tone = 'neutral',
  action,
  className = '',
}: {
  title: string;
  description: string;
  tone?: Tone;
  action?: ReactNode;
  className?: string;
}) {
  const palette = toneClasses[tone];

  return (
    <Surface className={`p-6 ${palette.border} ${palette.bg} ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className={`text-sm font-semibold ${palette.icon}`}>{title}</p>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </Surface>
  );
}

export function MetricTile({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Surface className="p-5">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
        <div className="space-y-1">
          <p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          {description ? <p className="text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
    </Surface>
  );
}
