"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "./utils";

// Custom Dialog implementation using HTML and React to avoid version compatibility issues
type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

type DialogContextType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a Dialog provider");
  }
  return context;
};

const Dialog: React.FC<DialogProps> = ({
  open = false,
  onOpenChange,
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      setIsOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

type DialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  (props, ref) => {
    const { onOpenChange } = useDialog();
    
    // Using simple button implementation to avoid type issues with advanced patterns
    
    return (
      <button
        type="button"
        ref={ref}
        onClick={() => onOpenChange(true)}
        {...props}
      />
    );
  }
);
DialogTrigger.displayName = "DialogTrigger";

type DialogPortalProps = {
  children: React.ReactNode;
};

const DialogPortal: React.FC<DialogPortalProps> = ({ children }) => {
  // In a real implementation, we would use createPortal here
  // but for simplicity, we'll just render the children
  return <>{children}</>;
};

type DialogOverlayProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...props }, ref) => {
    const { open, onOpenChange } = useDialog();
    
    if (!open) return null;
    
    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 bg-black/80 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
          className
        )}
        onClick={() => onOpenChange(false)}
        {...props}
      />
    );
  }
);
DialogOverlay.displayName = "DialogOverlay";

type DialogCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, ...props }, ref) => {
    const { onOpenChange } = useDialog();
    
    return (
      <button
        ref={ref}
        className={cn("focus:outline-none", className)}
        onClick={() => onOpenChange(false)}
        {...props}
      />
    );
  }
);
DialogClose.displayName = "DialogClose";

type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useDialog();
    
    if (!open) return null;
    
    return (
      <DialogPortal>
        <DialogOverlay />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg transition-all sm:rounded-lg",
            open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
            className
          )}
          {...props}
        >
          {children}
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = "DialogContent";

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const DialogFooter: React.FC<DialogFooterProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  className?: string;
};

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
);
DialogTitle.displayName = "DialogTitle";

type DialogDescriptionProps = React.HTMLAttributes<HTMLParagraphElement> & {
  className?: string;
};

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
