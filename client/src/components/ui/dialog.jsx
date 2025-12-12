//dialog
import * as React from "react";
import { cn } from "@/lib/utils";

const Dialog = ({
  open,
  onOpenChange,
  children,
  testId,
  dataTest,
  "data-testid": testIdAttr,
}) => {
  const finalTestId = testIdAttr ?? testId;
  const finalDataTest = dataTest;
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = "");
    }
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000]"
      data-testid={finalTestId}
      data-test={finalDataTest}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
        data-testid="auth-overlay"
      />
      {children}
    </div>
  );
};

const DialogContent = React.forwardRef(
  (
    {
      className,
      children,
      testId,
      dataTest,
      "data-testid": testIdAttr,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      data-testid={testIdAttr ?? testId}
      data-test={dataTest}
      className={cn(
        "fixed left-1/2 top-1/2 z-[1001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white text-black p-0 shadow-lg focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
      <button
        aria-label="Close"
        className="absolute right-6 top-4 rounded-sm opacity-70 hover:opacity-100"
        onClick={() => props?.onClose?.()}
        data-testid="auth-close"
      >
        x
      </button>
    </div>
  )
);
DialogContent.displayName = "DialogContent";

export { Dialog, DialogContent };
