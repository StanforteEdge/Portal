import { useContext, useEffect, useRef } from "react";
import { formInlineContext } from "../FormInline";
import { twMerge } from "tailwind-merge";

type FormLabelProps = React.PropsWithChildren &
  React.ComponentPropsWithoutRef<"label">;

function FormLabel(props: FormLabelProps) {
  const formInline = useContext(formInlineContext);
  const labelRef = useRef<HTMLLabelElement | null>(null);

  useEffect(() => {
    if (props.htmlFor || !labelRef.current) return;
    const parent = labelRef.current.parentElement;
    if (!parent) return;
    const control = parent.querySelector("input, select, textarea") as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | null;
    if (control?.id) {
      labelRef.current.htmlFor = control.id;
    }
  }, [props.htmlFor, props.children]);

  return (
    <label
      {...props}
      ref={labelRef}
      className={twMerge([
        "inline-block mb-2",
        formInline && "mb-2 sm:mb-0 sm:mr-5 sm:text-right",
        props.className,
      ])}
    >
      {props.children}
    </label>
  );
}

export default FormLabel;
