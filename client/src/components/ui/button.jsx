//button

import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50";

const Button = React.forwardRef(
  (
    { className, testId, dataTest, "data-testid": testIdAttr, ...props },
    ref
  ) => {
    const finalTestId = testIdAttr ?? testId;
    const finalDataTest = dataTest;
    return (
      <button
        ref={ref}
        className={cn(base, className)}
        data-testid={finalTestId}
        data-test={finalDataTest}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
