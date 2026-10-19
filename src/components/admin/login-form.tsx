"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/kit/primitives/button";
import { Input } from "@/components/kit/primitives/input";
import { Notice } from "@/components/kit/notice";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/admin/login", { method: "POST", body: new FormData(event.currentTarget) });
    if (response.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    setPending(false);
    if (response.status === 429) setMessage("Too many attempts. Wait a few minutes and try again.");
    else if (response.status === 404) setMessage("Admin is not available.");
    else setMessage("That password is not right.");
  }

  return (
    <div className="card w-full max-w-sm p-6">
      <Logo />
      <p className="mt-6 font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Private</p>
      <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">Usage for this Benchline. The password stays on the server.</p>
      <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="text-[12px] text-muted-foreground" htmlFor="admin-password">
          Password
        </label>
        <Input id="admin-password" name="password" type="password" autoComplete="current-password" required autoFocus />
        {message ? <Notice tone="bad" role="alert" title={message} /> : null}
        <Button type="submit" variant="primary" loading={pending}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
