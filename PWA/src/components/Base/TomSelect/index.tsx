import "@/assets/css/vendors/tom-select.css";
import { createRef, useEffect, useId } from "react";
import { setValue, init, updateValue } from "./tom-select";
import TomSelectPlugin from "tom-select";
import { useRef, useMemo } from "react";
import clsx from "clsx";

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};
type TomSettings = Record<string, any>;
type TomInput = { tomselect?: unknown };

export interface TomSelectElement
  extends HTMLSelectElement,
    Omit<TomInput, keyof HTMLSelectElement | "tomselect"> {
  TomSelect: TomSelectPlugin;
}

export interface TomSelectProps<T extends string | string[] = string | string[]>
  extends React.PropsWithChildren,
    Omit<React.ComponentPropsWithoutRef<"select">, "onChange"> {
  value: T;
  onOptionAdd?: (value: string) => void;
  onChange: (e: {
    target: {
      value: T;
    };
  }) => void;
  options?: RecursivePartial<TomSettings>;
  getRef?: (el: TomSelectElement) => void;
}

function TomSelect<T extends string | string[]>({
  className = "",
  options = {},
  value,
  onOptionAdd = () => {},
  onChange = () => {},
  getRef = () => {},
  children,
  ...computedProps
}: TomSelectProps<T>) {
  const props = {
    className: className,
    options: options,
    value: value,
    onOptionAdd: onOptionAdd,
    onChange: onChange,
    getRef: getRef,
  };
  const initialRender = useRef(true);
  const tomSelectRef = createRef<TomSelectElement>();
  const generatedId = useId();

  // Compute all default options
  const computedOptions = useMemo(() => {
    let options: TomSelectProps<T>["options"] = {
      ...props.options,
      plugins: {
        dropdown_input: {},
        ...props.options.plugins,
      },
    };

    if (Array.isArray(props.value)) {
      options = {
        persist: false,
        create: true,
        onDelete: function (values: string[]) {
          return confirm(
            values.length > 1
              ? "Are you sure you want to remove these " +
                  values.length +
                  " items?"
              : 'Are you sure you want to remove "' + values[0] + '"?'
          );
        },
        ...options,
        plugins: {
          remove_button: {
            title: "Remove this item",
          },
          ...options.plugins,
        },
      };
    }

    return options;
  }, [props.options]);

  useEffect(() => {
    if (tomSelectRef.current) {
      props.getRef(tomSelectRef.current);

      if (initialRender.current) {
        // Unique attribute
        tomSelectRef.current.setAttribute(
          "data-id",
          "_" + Math.random().toString(36).substr(2, 9)
        );

        // Clone the select element to prevent tom select remove the original element
        const clonedEl = tomSelectRef.current.cloneNode(
          true
        ) as TomSelectElement;
        const originalId = tomSelectRef.current.getAttribute("id");

        // Save initial classnames
        const classNames = tomSelectRef.current?.getAttribute("class");
        classNames && clonedEl.setAttribute("data-initial-class", classNames);

        // Hide original element
        if (originalId) {
          clonedEl.setAttribute("id", originalId);
          tomSelectRef.current.setAttribute("data-original-id", originalId);
          tomSelectRef.current.removeAttribute("id");
        }
        tomSelectRef.current.setAttribute("aria-hidden", "true");
        tomSelectRef.current.setAttribute("tabindex", "-1");
        tomSelectRef.current?.parentNode &&
          tomSelectRef.current?.parentNode.appendChild(clonedEl);
        tomSelectRef.current.setAttribute("hidden", "true");

        // Initialize tom select
        setValue(clonedEl, props);
        init(tomSelectRef.current, clonedEl, props, computedOptions);

        initialRender.current = false;
      } else {
        const clonedEl = document.querySelectorAll(
          `[data-id='${tomSelectRef.current.getAttribute(
            "data-id"
          )}'][data-initial-class]`
        )[0] as TomSelectElement;
        const value = props.value;
        updateValue(
          tomSelectRef.current,
          clonedEl,
          value,
          props,
          computedOptions
        );
      }
    }
  }, [tomSelectRef, props.value, props.className]);

  return (
    <select
      {...computedProps}
      id={computedProps.id || generatedId}
      ref={tomSelectRef}
      value={props.value}
      onChange={(e) => {
        if (props.onChange) {
          props.onChange({
            target: {
              value: e.target.value as T,
            },
          });
        }
      }}
      className={clsx(["tom-select", props.className])}
    >
      {children}
    </select>
  );
}

export default TomSelect;
