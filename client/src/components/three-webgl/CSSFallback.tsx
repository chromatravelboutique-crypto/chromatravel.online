interface CSSFallbackProps {
  className?: string;
}

export function CSSFallback({ className = '' }: CSSFallbackProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div 
        className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl animate-pulse" 
        style={{ animationDuration: '4s' }}
      />
      <div 
        className="absolute -right-20 bottom-20 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl animate-pulse" 
        style={{ animationDelay: '1s', animationDuration: '4s' }} 
      />
      <div 
        className="absolute left-1/3 top-1/4 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" 
        style={{ animationDelay: '2s', animationDuration: '4s' }} 
      />
      <div 
        className="absolute right-1/4 top-1/2 h-24 w-24 rounded-full bg-orange-500/20 blur-3xl animate-pulse" 
        style={{ animationDelay: '0.5s', animationDuration: '4s' }} 
      />
    </div>
  );
}
