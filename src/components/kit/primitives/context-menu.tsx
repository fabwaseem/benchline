"use client";

import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { ChevronRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const item = "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] outline-none data-highlighted:bg-sunken";

export function ContextMenu(props: ContextMenuPrimitive.Root.Props) {
  return <ContextMenuPrimitive.Root {...props} />;
}

export function ContextMenuTrigger(props: ContextMenuPrimitive.Trigger.Props) {
  return <ContextMenuPrimitive.Trigger {...props} />;
}

export function ContextMenuContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner className="isolate z-50">
        <ContextMenuPrimitive.Popup className={cn("min-w-40 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none", className)}>
          {children}
        </ContextMenuPrimitive.Popup>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

export function ContextMenuItem({ className, ...props }: ContextMenuPrimitive.Item.Props) {
  return <ContextMenuPrimitive.Item className={cn(item, className)} {...props} />;
}

export function ContextMenuCheckboxItem({ className, children, ...props }: ContextMenuPrimitive.CheckboxItem.Props) {
  return (
    <ContextMenuPrimitive.CheckboxItem className={cn(item, className)} {...props}>
      <ContextMenuPrimitive.CheckboxItemIndicator className="ml-auto"><Check className="size-3.5" /></ContextMenuPrimitive.CheckboxItemIndicator>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

export function ContextMenuRadioGroup(props: ContextMenuPrimitive.RadioGroup.Props) {
  return <ContextMenuPrimitive.RadioGroup {...props} />;
}

export function ContextMenuRadioItem({ className, children, ...props }: ContextMenuPrimitive.RadioItem.Props) {
  return (
    <ContextMenuPrimitive.RadioItem className={cn(item, className)} {...props}>
      <ContextMenuPrimitive.RadioItemIndicator className="ml-auto"><Check className="size-3.5" /></ContextMenuPrimitive.RadioItemIndicator>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

export function ContextMenuSub(props: ContextMenuPrimitive.SubmenuRoot.Props) {
  return <ContextMenuPrimitive.SubmenuRoot {...props} />;
}

export function ContextMenuSubTrigger({ className, children, ...props }: ContextMenuPrimitive.SubmenuTrigger.Props) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger className={cn(item, className)} {...props}>
      {children}
      <ChevronRight className="ml-auto size-3.5" />
    </ContextMenuPrimitive.SubmenuTrigger>
  );
}

export function ContextMenuSeparator() {
  return <ContextMenuPrimitive.Separator className="my-1 h-px bg-border" />;
}
