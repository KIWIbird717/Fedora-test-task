import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { TooltipProvider } from '@fedora-meetings/web-ui';
import { ColorSchemeToggle } from '../features/color-scheme/ui/color-scheme-toggle';
import { queryClient, router } from './router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200} skipDelayDuration={0}>
        <div className="fixed right-4 top-4 z-50">
          <ColorSchemeToggle />
        </div>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
