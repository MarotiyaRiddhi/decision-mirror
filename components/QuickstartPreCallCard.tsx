'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type QuickstartPreCallCardProps = {
  isLoading: boolean;
  error: string | null;
  onStartConversation: () => void;
};

export function QuickstartPreCallCard({
  isLoading,
  error,
  onStartConversation,
}: QuickstartPreCallCardProps) {
  return (
    <div
      className="mx-auto flex w-[min(92vw,30rem)] animate-fade-up flex-col items-center rounded-[20px] border border-[#2b2b2b] px-10 py-10 text-center shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
      style={{
        backgroundImage:
          'linear-gradient(164.988deg, rgba(54,54,54,0.2) 1.0596%, rgba(0,0,0,0) 96.089%), linear-gradient(90deg, rgb(16,16,16) 0%, rgb(16,16,16) 100%)',
      }}
    >
      <h1 className="text-[32px] font-medium leading-[1.2] text-white">
        Decision Mirror
      </h1>

      <p className="mt-[14px] text-sm font-medium leading-6 text-muted-foreground">
        Think out loud. Challenge assumptions. Explore tradeoffs.
      </p>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Decision Mirror helps you reason through important decisions, startup
        ideas, career choices, and personal dilemmas without telling you what
        to do. It asks better questions so you can reach better conclusions.
      </p>

      <div className="mt-6 w-full rounded-xl border border-[#2b2b2b] bg-black/20 p-4 text-left">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Try asking:
        </p>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div>💭 Should I take this internship?</div>
          <div>🚀 Is my startup idea actually viable?</div>
          <div>📚 Am I learning the right skills?</div>
          <div>⚖️ What tradeoffs am I ignoring?</div>
        </div>
      </div>

      <Button
        onClick={onStartConversation}
        disabled={isLoading}
        className="mt-8 h-10 w-full rounded-lg border border-primary bg-primary text-sm font-medium text-black hover:border-white hover:bg-white hover:text-black disabled:hover:border-primary disabled:hover:bg-primary disabled:hover:text-black"
        aria-label={
          isLoading
            ? 'Starting reflection session'
            : 'Start reflection session'
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting...
          </>
        ) : (
          'Start Reflection Session'
        )}
      </Button>

      {error && (
        <p className="mt-3 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}