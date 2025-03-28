"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "./utils";

// SelectContext to manage the select state
type SelectContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
};

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select provider");
  }
  return context;
}

// Root Select component
type SelectProps = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  name?: string;
  children?: React.ReactNode;
};

const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue,
  onValueChange,
  open: controlledOpen,
  onOpenChange,
  disabled = false,
  name,
  children,
}) => {
  const [open, setOpenState] = React.useState<boolean>(controlledOpen || false);
  const [value, setValueState] = React.useState<string>(controlledValue || defaultValue || "");
  
  // Handle controlled state
  const setOpen = React.useCallback((state: boolean | ((prevState: boolean) => boolean)) => {
    const newState = typeof state === "function" ? state(open) : state;
    setOpenState(newState);
    onOpenChange?.(newState);
  }, [open, onOpenChange]);

  const setValue = React.useCallback((newValue: string) => {
    setValueState(newValue);
    onValueChange?.(newValue);
  }, [onValueChange]);

  // Update state when controlled props change
  React.useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpenState(controlledOpen);
    }
  }, [controlledOpen]);

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setValueState(controlledValue);
    }
  }, [controlledValue]);

  return (
    <SelectContext.Provider
      value={{
        open,
        setOpen,
        value,
        onValueChange: setValue,
        disabled,
        name,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
};

// Group component for organizing items
type SelectGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
  className?: string;
};

const SelectGroup = React.forwardRef<HTMLDivElement, SelectGroupProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      {children}
    </div>
  )
);
SelectGroup.displayName = "SelectGroup";

// Value component (visual display of selected value)
type SelectValueProps = {
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
};

const SelectValue: React.FC<SelectValueProps> = ({ placeholder = "Select an option", className }) => {
  const { value } = useSelectContext();
  return <span className={className}>{value || placeholder}</span>;
};
SelectValue.displayName = "SelectValue";

// Trigger component (button that opens the select)
type SelectTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  className?: string;
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, disabled } = useSelectContext();

    return (
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

// Scroll button components
type ScrollButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

const SelectScrollUpButton = React.forwardRef<HTMLButtonElement, ScrollButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </button>
  )
);
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = React.forwardRef<HTMLButtonElement, ScrollButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </button>
  )
);
SelectScrollDownButton.displayName = "SelectScrollDownButton";

// Content component (the dropdown that appears)
type SelectContentProps = React.HTMLAttributes<HTMLDivElement> & {
  position?: "item-aligned" | "popper";
  className?: string;
};

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position = "popper", ...props }, ref) => {
    const { open } = useSelectContext();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted || !open) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50" onClick={(e) => e.stopPropagation()}>
        <div
          ref={ref}
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            position === "popper" &&
              "translate-y-1",
            className
          )}
          {...props}
        >
          <div className="overflow-auto max-h-96">
            <div className="p-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

// Label component
type SelectLabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
};

const SelectLabel = React.forwardRef<HTMLLabelElement, SelectLabelProps>
  (({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
      {...props}
    />
  ));
SelectLabel.displayName = "SelectLabel";

// Item component
type SelectItemProps = Omit<React.LiHTMLAttributes<HTMLLIElement>, "value"> & {
  value: string;
  disabled?: boolean;
};

const SelectItem = React.forwardRef<HTMLLIElement, SelectItemProps>(
  ({ className, children, value, disabled, ...props }, ref) => {
    const { onValueChange, value: selectedValue, setOpen } = useSelectContext();
    const isSelected = selectedValue === value;

    const handleSelect = () => {
      if (!disabled) {
        onValueChange(value);
        setOpen(false);
      }
    };

    return (
      <li
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-disabled={disabled ? "" : undefined}
        data-selected={isSelected ? "" : undefined}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          isSelected && "bg-accent text-accent-foreground",
          className
        )}
        onClick={handleSelect}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        <span>{children}</span>
      </li>
    );
  }
);
SelectItem.displayName = "SelectItem";

// Separator component
type SelectSeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  )
);
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
