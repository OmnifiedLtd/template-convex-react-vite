import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * SectionHeader - Typography-based section header for card-less layouts.
 *
 * Use this instead of Card + CardHeader when you want visual hierarchy
 * without the visual weight of a card container. The header creates
 * structure through typography and spacing alone.
 *
 * @example
 * ```tsx
 * <SectionHeader
 *   icon={<Package className="h-5 w-5" />}
 *   title="Brand Pack Export"
 *   description="Download multiple variants in a single zip file"
 * />
 * <SectionContent>
 *   {children}
 * </SectionContent>
 * ```
 */
interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional icon displayed before the title */
  icon?: React.ReactNode
  /** Section title - required */
  title: string
  /** Optional description shown below the title */
  description?: string
  /** Right-aligned action element (button, badge, etc.) */
  action?: React.ReactNode
  /** Size variant - affects title size and spacing */
  size?: "default" | "large"
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, icon, title, description, action, size = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start justify-between gap-4",
        size === "large" ? "mb-6" : "mb-4",
        className,
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          <h3
            className={cn(
              "font-semibold leading-none tracking-tight text-foreground",
              size === "large" ? "text-xl" : "text-base",
            )}
          >
            {title}
          </h3>
        </div>
        {description && (
          <p
            className={cn(
              "text-muted-foreground mt-1",
              size === "large" ? "text-sm" : "text-xs",
              icon && "ml-7", // Align with title when icon present
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  ),
)
SectionHeader.displayName = "SectionHeader"

/**
 * SectionContent - Content container for card-less sections.
 *
 * Provides consistent padding and spacing without card styling.
 * Use with SectionHeader for complete card-less section layout.
 */
interface SectionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spacing between child elements */
  spacing?: "tight" | "default" | "loose"
}

const SectionContent = React.forwardRef<HTMLDivElement, SectionContentProps>(
  ({ className, spacing = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        spacing === "tight" && "space-y-2",
        spacing === "default" && "space-y-4",
        spacing === "loose" && "space-y-6",
        className,
      )}
      {...props}
    />
  ),
)
SectionContent.displayName = "SectionContent"

/**
 * SectionDivider - Subtle visual separator between sections.
 *
 * Use sparingly - prefer whitespace for separation. This divider
 * is for when you need explicit visual separation within a column.
 */
interface SectionDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style of the divider */
  variant?: "line" | "space" | "dots"
}

const SectionDivider = React.forwardRef<HTMLDivElement, SectionDividerProps>(
  ({ className, variant = "space", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "my-8",
        variant === "line" && "border-t border-border",
        variant === "dots" &&
          "flex justify-center gap-1 [&>span]:w-1 [&>span]:h-1 [&>span]:rounded-full [&>span]:bg-border",
        className,
      )}
      aria-hidden="true"
      {...props}
    >
      {variant === "dots" && (
        <>
          <span />
          <span />
          <span />
        </>
      )}
    </div>
  ),
)
SectionDivider.displayName = "SectionDivider"

/**
 * SectionGroup - Groups related content with consistent spacing.
 *
 * Provides a container for a complete section (header + content)
 * with appropriate bottom margin for stacking sections.
 */
interface SectionGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether this is the last section (removes bottom margin) */
  last?: boolean
}

const SectionGroup = React.forwardRef<HTMLDivElement, SectionGroupProps>(
  ({ className, last, ...props }, ref) => (
    <div ref={ref} className={cn(!last && "mb-10", className)} {...props} />
  ),
)
SectionGroup.displayName = "SectionGroup"

/**
 * ColumnHeader - Large header for the top of a column.
 *
 * Use at the top of left or right columns to establish the main
 * content area's purpose. Larger than SectionHeader.
 */
interface ColumnHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column title - required */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
}

const ColumnHeader = React.forwardRef<HTMLDivElement, ColumnHeaderProps>(
  ({ className, title, subtitle, ...props }, ref) => (
    <div ref={ref} className={cn("mb-6", className)} {...props}>
      <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  ),
)
ColumnHeader.displayName = "ColumnHeader"

export { SectionHeader, SectionContent, SectionDivider, SectionGroup, ColumnHeader }
