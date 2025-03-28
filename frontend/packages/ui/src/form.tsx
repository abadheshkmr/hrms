"use client";

import * as React from "react";
import {
  useForm as useHookForm,
  Controller,
  FormProvider,
  UseFormProps,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "./utils";
import { cva, type VariantProps } from "class-variance-authority";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

// This function creates a wrapper around Controller to handle the generic type issues
function createControllerElement<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: ControllerProps<TFieldValues, TName>): React.ReactNode {
  // Use Controller as a regular function and explicitly type the return as ReactNode
  return Controller(props) as unknown as React.ReactNode;
}

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      {createControllerElement(props)}
    </FormFieldContext.Provider>
  );
};

// Update the return type of useFormField to include the error property
type FormFieldContextReturn = {
  id: string;
  name: string;
  formItemId: string | undefined;
  formItemDescriptionId: string | undefined;
  formMessageId: string | undefined;
  error?: { message?: string };
};

const useFormField = (): FormFieldContextReturn => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { name } = fieldContext;
  const id = itemContext?.id || `form-field-${name}`;

  return {
    id,
    name,
    formItemId: itemContext?.id,
    formItemDescriptionId: itemContext?.descriptionId,
    formMessageId: itemContext?.messageId,
    // Add error property (to be set later)
    error: undefined,
  };
};

type FormItemContextValue = {
  id: string;
  descriptionId?: string;
  messageId?: string;
};

const FormItemContext = React.createContext<FormItemContextValue | undefined>(
  undefined
);

// Define variants for FormItem if needed
const formItemVariants = cva("space-y-2");

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof formItemVariants>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider
      value={{
        id,
        descriptionId: `${id}-description`,
        messageId: `${id}-message`,
      }}
    >
      <div ref={ref} className={cn(formItemVariants(), className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

// Use a simple HTML label instead of the Label component to avoid type issues
type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
};

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>
(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        error && "text-destructive",
        className
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

// Define variants for FormControl
const formControlVariants = cva("");

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof formControlVariants>
>(({ ...props }, ref) => {
  const { error, formItemId, formItemDescriptionId, formMessageId } =
    useFormField();

  return (
    <div
      ref={ref}
      id={formItemId}
      className={cn(formControlVariants(), props.className)}
      aria-describedby={
        !error
          ? `${formItemDescriptionId}`
          : `${formItemDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

// Define variants for FormDescription
const formDescriptionVariants = cva("text-sm text-muted-foreground");

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & VariantProps<typeof formDescriptionVariants>
>(({ className, ...props }, ref) => {
  const { formItemDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formItemDescriptionId}
      className={cn(formDescriptionVariants(), className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

// Define variants for FormMessage
const formMessageVariants = cva("text-sm font-medium text-destructive");

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & VariantProps<typeof formMessageVariants>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn(formMessageVariants(), className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

/**
 * A hook for using forms with Zod schema validation
 */
function useForm<TSchema extends z.ZodType>(
  props: Omit<UseFormProps<z.infer<TSchema>>, "resolver"> & {
    schema: TSchema;
  }
) {
  const form = useHookForm<z.infer<TSchema>>({
    ...props,
    resolver: zodResolver(props.schema),
  });

  return form;
}

export {
  useForm,
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
