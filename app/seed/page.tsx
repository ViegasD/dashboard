"use client";

import { useState, useTransition } from "react";
import { runAiSeed } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, FolderKanban, Target, Repeat2 } from "lucide-react";

const PLACEHOLDER = `Tell me about yourself and what you want to track. For example:

I'm a software developer working on a personal portfolio website and learning TypeScript. I also want to get healthier — I'm trying to run 3x a week and sleep earlier. I have a goal to launch my portfolio by end of June.`;

export default function AiSeedPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<{ projects: number; goals: number; habits: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setError(null);
    startTransition(async () => {
      const res = await runAiSeed(prompt);
      if (res.error) setError(res.error);
      else if (res.data) setResult(res.data);
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          AI Dashboard Seed
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Describe your life, projects, goals, and routines. GPT-4o will create them in your dashboard automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full min-h-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          placeholder={PLACEHOLDER}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isPending}
          required
        />
        <Button type="submit" disabled={isPending || !prompt.trim()}>
          {isPending ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate & Save
            </>
          )}
        </Button>
      </form>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-green-600 text-base">Done! Created:</CardTitle>
            <CardDescription>Your dashboard has been populated. Go explore!</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-500" />
                <span><strong>{result.projects}</strong> project{result.projects !== 1 ? "s" : ""}</span>
              </li>
              <li className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span><strong>{result.goals}</strong> goal{result.goals !== 1 ? "s" : ""}</span>
              </li>
              <li className="flex items-center gap-2">
                <Repeat2 className="w-4 h-4 text-green-500" />
                <span><strong>{result.habits}</strong> habit{result.habits !== 1 ? "s" : ""}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
