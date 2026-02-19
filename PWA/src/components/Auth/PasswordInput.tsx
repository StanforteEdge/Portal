import { forwardRef, useState } from "react";
import clsx from "clsx";
import Lucide from "@/components/Base/Lucide";
import { FormInput } from "@/components/Base/Form";

type PasswordInputProps = Omit<React.ComponentPropsWithoutRef<typeof FormInput>, "type">;
type PasswordInputRef = React.ComponentPropsWithRef<typeof FormInput>["ref"];

const PasswordInput = forwardRef((props: PasswordInputProps, ref: PasswordInputRef) => {
  const [show, setShow] = useState(false);
  const { className, ...rest } = props;

  return (
    <div className="relative">
      <FormInput
        {...rest}
        ref={ref}
        type={show ? "text" : "password"}
        className={clsx(className, "pr-10")}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        onClick={() => setShow((value) => !value)}
      >
        <Lucide icon={show ? "EyeOff" : "Eye"} className="w-4 h-4" />
      </button>
    </div>
  );
});

export default PasswordInput;
