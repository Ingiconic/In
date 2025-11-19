import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "gradient-primary text-white shadow-glow hover:shadow-neon hover:scale-105 transform before:absolute before:inset-0 before:bg-white/20 before:translate-y-full before:transition-transform before:duration-500 hover:before:translate-y-0",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl hover:scale-105",
        outline: "border-2 border-primary/50 bg-background/50 backdrop-blur-sm text-primary hover:bg-primary/10 hover:border-primary hover:shadow-glow",
        secondary: "gradient-secondary text-white shadow-glow hover:shadow-neon hover:scale-105 transform",
        accent: "gradient-accent text-white shadow-glow hover:shadow-neon hover:scale-105 transform",
        ghost: "hover:bg-primary/10 hover:text-primary backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "gradient-hero text-white font-bold shadow-neon hover:scale-110 transform hover:shadow-glow before:absolute before:inset-0 before:bg-white/20 before:translate-x-full before:transition-transform before:duration-700 hover:before:translate-x-0",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-glow hover:shadow-lg hover:scale-105",
        glass: "bg-white/5 backdrop-blur-xl border border-white/20 text-foreground hover:bg-white/10 hover:border-white/30 shadow-glass",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-13 rounded-2xl px-10 text-base",
        xl: "h-16 rounded-3xl px-12 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
