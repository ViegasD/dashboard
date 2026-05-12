"use client";

import { useRef, useState, useTransition } from "react";
import { createUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export function CreateUserForm() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: `User ${result.email} created successfully.` });
        formRef.current?.reset();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="w-4 h-4" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="name" type="text" placeholder="Name (optional)" />
          <Input name="password" type="password" placeholder="Password (min 6 chars)" required minLength={6} />
          <div className="sm:col-span-3 flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create User"}
            </Button>
            {message && (
              <p className={message.type === "error" ? "text-destructive text-sm" : "text-green-600 text-sm"}>
                {message.text}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
