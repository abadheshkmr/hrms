"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "./utils";

// Toast context and provider
type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "info";
  duration?: number;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

type ToastProviderProps = {
  children: React.ReactNode;
};

const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    if (toast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  }, [removeToast]);

  const updateToast = React.useCallback((id: string, toast: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...toast } : t))
    );
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        updateToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

// Toast Viewport Component
type ToastViewportProps = React.HTMLAttributes<HTMLOListElement> & {
  className?: string;
};

const ToastViewport = React.forwardRef<HTMLOListElement, ToastViewportProps>(
  ({ className, ...props }, ref) => {
    const { toasts } = useToast();
    
    return (
      <ol
        ref={ref}
        className={cn(
          "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
          className
        )}
        {...props}
      >
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            id={toast.id}
            variant={toast.variant}
            className={""}
          >
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
            {toast.action}
          </Toast>
        ))}
      </ol>
    );
  }
);
ToastViewport.displayName = "ToastViewport";

// Toast styling
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
        success:
          "success group border-green-800 bg-green-700 text-white",
        info:
          "info group border-blue-800 bg-blue-700 text-white"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Toast component
type ToastElementProps = React.HTMLAttributes<HTMLLIElement> & 
  VariantProps<typeof toastVariants> & {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
  };

const Toast = React.forwardRef<HTMLLIElement, ToastElementProps>(
  ({ className, variant, id, title, description, action, children, ...props }, ref) => {
    const { removeToast } = useToast();
    const [open, setOpen] = React.useState(true);

    React.useEffect(() => {
      if (!open) {
        setTimeout(() => removeToast(id), 300); // Allow for exit animation
      }
    }, [open, id, removeToast]);

    return (
      <li
        ref={ref}
        role="status"
        aria-live="polite"
        data-state={open ? "open" : "closed"}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="grid gap-1">
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
        {action && <ToastAction>{action}</ToastAction>}
        <ToastClose onClick={() => setOpen(false)} />
        {children}
      </li>
    );
  }
);
Toast.displayName = "Toast";

// Toast action component
type ToastActionProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  altText?: string;
  className?: string;
};

const ToastAction = React.forwardRef<HTMLButtonElement, ToastActionProps>(
  ({ className, altText, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
        className
      )}
      aria-label={altText}
      {...props}
    />
  )
);
ToastAction.displayName = "ToastAction";

// Toast close button
type ToastCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

const ToastClose = React.forwardRef<HTMLButtonElement, ToastCloseProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
        className
      )}
      aria-label="Close"
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  )
);
ToastClose.displayName = "ToastClose";

// Toast title component
type ToastTitleProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const ToastTitle = React.forwardRef<HTMLDivElement, ToastTitleProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  )
);
ToastTitle.displayName = "ToastTitle";

// Toast description component
type ToastDescriptionProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const ToastDescription = React.forwardRef<HTMLDivElement, ToastDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
);
ToastDescription.displayName = "ToastDescription";

// Type definitions for external use
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

// Custom hook to expose the toast functionality
function useToastHook() {
  const { addToast, removeToast, updateToast } = useToast();

  return {
    toast: (props: Omit<Toast, "id">) => addToast(props),
    dismiss: (id: string) => removeToast(id),
    update: (id: string, props: Partial<Toast>) => updateToast(id, props),
  };
}

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  useToastHook as useToast,
};
