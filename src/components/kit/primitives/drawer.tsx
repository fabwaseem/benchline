"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/kit/primitives/button";

export function Drawer(props: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root {...props} />;
}

export function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger {...props} />;
}

export function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/20" />
      <DrawerPrimitive.Popup
        className={cn("fixed inset-y-0 right-0 z-50 flex w-[min(100%,22rem)] flex-col border-l border-border bg-background p-4 shadow-md outline-none", className)}
        {...props}
      >
        {children}
        <DrawerPrimitive.Close aria-label="Close" render={<Button variant="ghost" size="icon-sm" className="absolute top-3 right-3" />}>
          <XIcon />
        </DrawerPrimitive.Close>
      </DrawerPrimitive.Popup>
    </DrawerPrimitive.Portal>
  );
}

export function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return <DrawerPrimitive.Title className={cn("text-base font-medium", className)} {...props} />;
}

export function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return <DrawerPrimitive.Description className={cn("text-[13px] text-muted-foreground", className)} {...props} />;
}
