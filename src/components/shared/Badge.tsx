interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-surface-bright text-on-surface-variant border border-outline-variant/30',
  primary: 'bg-primary/15 text-[#1f4f5a] border border-primary/20',
  success: 'bg-success/20 text-[#1e5c5d] border border-success/30',
  warning: 'bg-warning/30 text-[#604910] border border-warning/40',
  error: 'bg-error/20 text-[#8a2f1c] border border-error/30',
  info: 'bg-info/30 text-[#1e5c5d] border border-info/40',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[0.6875rem]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ variant = 'default', size = 'sm', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full uppercase tracking-wider ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variant = {
    Low: 'info' as const,
    Medium: 'warning' as const,
    High: 'error' as const,
    Critical: 'error' as const,
  }[priority] || 'default' as const;
  return <Badge variant={variant}>{priority}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const variant = {
    Planning: 'info' as const,
    'In Progress': 'warning' as const,
    Review: 'primary' as const,
    Done: 'success' as const,
    Backlog: 'default' as const,
  }[status] || 'default' as const;
  return <Badge variant={variant}>{status}</Badge>;
}
