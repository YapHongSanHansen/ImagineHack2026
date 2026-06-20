import { cn } from '../lib/format';

export default function Card({ title, subtitle, right, className = '', bodyClass = '', children }) {
  return (
    <div className={cn('panel p-5', className)}>
      {(title || right) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-text-hi">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-text-dim">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  );
}
