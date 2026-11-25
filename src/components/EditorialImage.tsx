import { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { sanitizeSafeUrl } from '../utils/formatters';

interface EditorialImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function EditorialImage({ src, alt, className = '' }: EditorialImageProps) {
  const [hasError, setHasError] = useState(false);
  const safeSrc = sanitizeSafeUrl(src);

  if (!safeSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 dark:text-slate-500 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Newspaper className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.5} />
        <span className="text-xs font-medium line-clamp-2 max-w-[20ch]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
