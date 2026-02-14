"use client"

import { cn } from "@/lib/utils"

export function TypingLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const dotSizes = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-bounce rounded-full bg-muted-foreground",
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 160}ms`,
            animationDuration: "1s",
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}
