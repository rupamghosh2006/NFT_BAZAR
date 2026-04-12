interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="w-16 h-16 text-white/20 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-white/80 mb-1">{title}</h3>
      {description && <p className="text-sm text-white/40 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}