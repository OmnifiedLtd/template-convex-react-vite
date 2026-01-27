import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EditableTextProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  showEditIcon?: boolean;
  variant?: "inline" | "block";
}

export function EditableText({
  value,
  onSave,
  placeholder = "Enter text...",
  className,
  inputClassName,
  maxLength = 100,
  minLength = 1,
  required = true,
  showEditIcon = true,
  variant = "inline",
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update editValue when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedValue = editValue.trim();

    // Validation
    if (required && trimmedValue.length < minLength) {
      setEditValue(value); // Reset to original
      setIsEditing(false);
      return;
    }

    if (trimmedValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch {
      setEditValue(value); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Small delay to allow button clicks
            setTimeout(() => {
              if (isEditing) handleSave();
            }, 150);
          }}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={isSaving}
          className={cn(
            "bg-transparent border-b border-primary outline-none px-0 py-0.5 text-inherit font-inherit",
            variant === "block" && "w-full",
            inputClassName
          )}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-3.5 w-3.5 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1 cursor-pointer hover:text-primary transition-colors",
        className
      )}
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setIsEditing(true);
        }
      }}
    >
      <span className={cn(!value && "text-muted-foreground italic")}>
        {value || placeholder}
      </span>
      {showEditIcon && (
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
      )}
    </div>
  );
}
