//input

import * as React from "react";

const base =
  "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const Input = React.forwardRef(
  (
    { className, type, testId, dataTest, "data-testid": testIdAttr, ...props },
    ref
  ) => {
    const finalTestId = testIdAttr ?? testId;
    const finalDataTest = dataTest;
    return (
      <input
        type={type}
        className={[base, className].filter(Boolean).join(" ")}
        ref={ref}
        data-testid={finalTestId}
        data-test={finalDataTest}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
