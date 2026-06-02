import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-extrabold tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-l from-primary to-primary/85 text-primary-foreground shadow-[0_10px_24px_hsl(var(--primary)/.22)] hover:shadow-[0_14px_32px_hsl(var(--primary)/.28)] hover:brightness-110 border border-primary/20",
        destructive: "bg-gradient-to-l from-destructive to-destructive/85 text-destructive-foreground shadow-[0_10px_24px_hsl(var(--destructive)/.22)] hover:brightness-110 border border-destructive/20",
        outline: "border border-border/80 bg-card/88 text-foreground shadow-sm hover:border-primary/45 hover:bg-primary/8 hover:text-primary hover:shadow-[0_8px_22px_hsl(var(--primary)/.10)]",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85 hover:shadow-md border border-border/40",
        ghost: "hover:bg-primary/10 hover:text-primary hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline shadow-none rounded-md px-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
})
Button.displayName = "Button"

export { Button, buttonVariants }
