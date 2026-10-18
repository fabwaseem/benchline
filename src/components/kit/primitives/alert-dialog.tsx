"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import type { ComponentProps } from "react";
import { Button } from "@/components/kit/primitives/button";
import { cn } from "@/lib/utils";

export function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root {...props} />;
}

export function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger {...props} />;
}

export function AlertDialogContent({ className, children, ...props }: AlertDialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/20" />
      <AlertDialogPrimitive.Popup
        className={cn("fixed top-1/2 left-1/2 z-50 w-[min(100%-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none", className)}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return <AlertDialogPrimitive.Title className={cn("text-base font-medium", className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.Description.Props) {
  return <AlertDialogPrimitive.Description className={cn("mt-1 text-[13px] text-muted-foreground", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />;
}

export function AlertDialogCancel(props: ComponentProps<typeof Button>) {
  return (
    <AlertDialogPrimitive.Close render={<Button variant="outline" />}>
      {props.children ?? "Cancel"}
    </AlertDialogPrimitive.Close>
  );
}

export function AlertDialogAction({ children, ...props }: ComponentProps<typeof Button>) {
  return (
    <AlertDialogPrimitive.Close render={<Button variant="destructive" {...props} />}>
      {children ?? "Continue"}
    </AlertDialogPrimitive.Close>
  );
}
