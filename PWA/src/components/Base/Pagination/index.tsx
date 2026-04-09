import { twMerge } from "tailwind-merge";
import Button from "../Button";
import React from "react";

type PaginationProps = React.PropsWithChildren &
  React.ComponentPropsWithoutRef<"nav">;

function Pagination({ className, children }: PaginationProps) {
  return (
    <nav className={className}>
      <ul className="flex w-full mr-0 sm:w-auto sm:mr-auto">{children}</ul>
    </nav>
  );
}

interface LinkProps
  extends React.PropsWithChildren,
    Omit<React.ComponentPropsWithoutRef<"a">, "className"> {
  active?: boolean;
  className?: string;
}

Pagination.Link = ({ className, active, children, ...props }: LinkProps) => {
  const inferAriaLabel = () => {
    if (props["aria-label"]) return props["aria-label"];
    if (typeof children === "string" || typeof children === "number") return undefined;
    const nodes = React.Children.toArray(children);
    if (nodes.length !== 1) return undefined;
    const child = nodes[0];
    if (!React.isValidElement(child)) return undefined;
    const icon = (child.props as { icon?: string }).icon;
    switch (icon) {
      case "ChevronsLeft":
        return "First page";
      case "ChevronLeft":
        return "Previous page";
      case "ChevronRight":
        return "Next page";
      case "ChevronsRight":
        return "Last page";
      default:
        return undefined;
    }
  };

  return (
    <li className="flex-1 sm:flex-initial">
      <Button
        as="a"
        aria-label={inferAriaLabel()}
        className={twMerge([
          "min-w-0 sm:min-w-[40px] shadow-none font-normal flex items-center justify-center border-transparent text-slate-800 sm:mr-2 dark:text-slate-300 px-1 sm:px-3",
          active && "!box font-medium dark:bg-darkmode-400",
          className,
        ])}
        {...props}
      >
        {children}
      </Button>
    </li>
  );
};

export default Pagination;
