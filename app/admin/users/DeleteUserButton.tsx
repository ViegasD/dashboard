"use client";

import { useTransition } from "react";
import { deleteUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteUserButton({ id, email }: { id: string; email: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return;
    startTransition(() => deleteUser(id));
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      disabled={isPending}
      onClick={handleClick}
      title="Delete user"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
