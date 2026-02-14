"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

export type MarkdownRendererProps = {
  children: string
  className?: string
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none break-words",
        "prose-p:leading-relaxed prose-pre:p-0",
        "prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-4",
        "prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-sm",
        "prose-a:text-primary prose-a:underline",
        className
      )}
      components={{
        pre({ children }) {
          return (
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              {children}
            </pre>
          )
        },
        code({ children, className: codeClassName }) {
          const isInline = !codeClassName
          if (isInline) {
            return (
              <code className="rounded bg-muted px-1 py-0.5 text-sm">
                {children}
              </code>
            )
          }
          return <code className={codeClassName}>{children}</code>
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
