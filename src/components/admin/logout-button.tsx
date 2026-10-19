"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/kit/primitives/button";

export function LogoutButton({ csrf }: { csrf: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={() => {
        setPending(true);
        void fetch("/api/admin/logout", {
          method: "POST",
          headers: { "x-csrf-token": csrf },
        }).finally(() => {
          router.push("/admin/login");
          router.refresh();
        });
      }}
    >
      Log out
    </Button>
  );
}
