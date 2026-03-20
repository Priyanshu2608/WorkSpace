import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: string;
  className?: string;
}

export default function StatCard({ icon: Icon, label, value, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-surface-container rounded-xl p-5 border border-outline-variant/10 hover:border-outline-variant/25 transition-all group ${className}`}>
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-lg bg-primary-container/20 text-primary group-hover:bg-primary-container/30 transition-colors">
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-xs text-success font-medium">{trend}</span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold font-[family-name:var(--font-family-display)]">{value}</p>
        <p className="text-sm text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  );
}
