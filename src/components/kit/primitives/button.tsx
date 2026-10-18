"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/kit/primitives/spinner";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-foreground hover:bg-[color-mix(in_srgb,var(--accent-brand)_88%,var(--foreground))]",
        solid: "bg-foreground text-background hover:bg-foreground/90",
        default: "bg-foreground text-background hover:bg-foreground/90",
        outline: "border-border-strong bg-surface text-foreground hover:bg-sunken",
        secondary: "bg-sunken text-foreground hover:bg-raised",
        ghost: "bg-transparent text-foreground hover:bg-sunken",
        destructive: "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_srgb,var(--danger)_88%,var(--foreground))]",
        link: "h-auto rounded-none bg-transparent px-0 text-brand-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-control-sm px-2.5 text-[12.5px] [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-control-md px-3 text-[13px]",
        default: "h-control-md px-3 text-[13px]",
        lg: "h-control-lg px-4 text-sm",
        xs: "h-control-sm px-2 text-[12px] [&_svg:not([class*='size-'])]:size-3.5",
        icon: "h-control-md w-control-md p-0",
        "icon-sm": "h-control-sm w-control-sm p-0",
        "icon-xs": "h-control-sm w-control-sm p-0",
        "icon-lg": "h-control-lg w-control-lg p-0",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  },
);

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

function Button({
  className,
  variant = "solid",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  const resolved: ButtonSize = size === "default" ? "md" : (size ?? "md");
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size: resolved }), className)}
      {...props}
    >
      {loading ? <Spinner className="size-3.5" /> : null}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
