import { Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePerformance } from './PerformanceContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PerformanceToggle() {
  const { performanceMode, togglePerformanceMode, webglAvailable } = usePerformance();

  if (!webglAvailable) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePerformanceMode}
          className="relative"
          data-testid="button-performance-toggle"
          aria-label={performanceMode ? 'Activar efectos 3D' : 'Modo performance'}
        >
          {performanceMode ? (
            <ZapOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Zap className="h-4 w-4 text-yellow-500" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{performanceMode ? 'Activar efectos 3D' : 'Modo Performance (sin 3D)'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
