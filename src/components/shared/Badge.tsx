interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-surface-bright text-on-surface-variant',
  primary: 'bg-primary-container/30 text-primary',
  success: 'bg-green-500/15 text-success',
  warning: 'bg-yellow-500/15 text-warning',
  error: 'bg-red-500/15 text-error',
  info: 'bg-blue-500/15 text-info',
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
