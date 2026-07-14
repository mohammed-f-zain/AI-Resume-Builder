import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-sm text-[#141f2e] placeholder:text-[#6b7c93] transition-colors focus:border-[#1db4ce] focus:outline-none focus:ring-2 focus:ring-[#1db4ce]/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#141f2e] placeholder:text-[#6b7c93] transition-colors focus:border-[#1db4ce] focus:outline-none focus:ring-2 focus:ring-[#1db4ce]/20",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-[#141f2e]",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
