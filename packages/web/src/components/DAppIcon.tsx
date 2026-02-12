import { useState } from 'react';

interface DAppIconProps {
  url: string | undefined;
  name: string;
  size?: string;
}

export function DAppIcon({ url, name, size = 'w-8 h-8' }: DAppIconProps) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    const initial = name.charAt(0).toUpperCase() || '?';
    return (
      <div className={`${size} shrink-0 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300`}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      onError={() => setFailed(true)}
      className={`${size} shrink-0 rounded-lg object-contain bg-gray-800`}
    />
  );
}
