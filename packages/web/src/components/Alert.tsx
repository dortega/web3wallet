interface AlertProps {
  type: 'success' | 'error' | 'info';
  title: string;
  fields?: { label: string; value: string }[];
  onDismiss?: () => void;
}

const styles = {
  success: 'border-green-700 bg-green-950 text-green-200',
  error: 'border-red-700 bg-red-950 text-red-200',
  info: 'border-blue-700 bg-blue-950 text-blue-200',
};

export function Alert({ type, title, fields, onDismiss }: AlertProps) {
  return (
    <div className={`border rounded-lg p-4 ${styles[type]}`}>
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-sm">{title}</h3>
        {onDismiss && (
          <button onClick={onDismiss} className="text-sm opacity-60 hover:opacity-100">
            &times;
          </button>
        )}
      </div>
      {fields && fields.length > 0 && (
        <dl className="mt-2 space-y-1">
          {fields.map((f) => (
            <div key={f.label} className="flex gap-2 text-xs">
              <dt className="opacity-60 shrink-0">{f.label}:</dt>
              <dd className="font-mono break-all">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
