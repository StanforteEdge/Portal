import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import clsx from "clsx";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel } from "@/components/Base/Form";
import { requestPasswordReset } from "@/services/auth";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { BRAND_LOGO_ICON_DARK } from "@/constants/branding";

type ForgotPasswordForm = {
  email: string;
};

const schema: yup.ObjectSchema<ForgotPasswordForm> = yup.object({
  email: yup.string().required("Email is required").email("Enter a valid email"),
});

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(
    null
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordForm) => {
    try {
      setLoading(true);
      setNotice(null);
      await requestPasswordReset(values.email);
      setNotice({
        tone: "success",
        message: "If the email exists, a reset link was sent.",
      });
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to send reset link.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={clsx([
        "p-3 sm:px-8 relative h-screen lg:overflow-hidden bg-primary xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600",
        "before:hidden before:xl:block before:content-[''] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-ml-[13%] before:absolute before:inset-y-0 before:left-0 before:transform before:rotate-[-4.5deg] before:bg-primary/20 before:rounded-[100%] before:dark:bg-darkmode-400",
        "after:hidden after:xl:block after:content-[''] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-ml-[13%] after:absolute after:inset-y-0 after:left-0 after:transform after:rotate-[-4.5deg] after:bg-primary after:rounded-[100%] after:dark:bg-darkmode-700",
      ])}
    >
      <ThemeSwitcher />
      <div className="container relative z-10 sm:px-10">
        <div className="flex h-screen py-5">
          <div className="w-full px-5 py-8 mx-auto my-auto bg-white rounded-md shadow-md sm:px-8 sm:w-3/4 lg:w-2/4 xl:w-1/3 dark:bg-darkmode-600">
            <div className="flex items-center justify-center mb-4 xl:hidden">
              <img
                alt="Stanforte Edge"
                className="w-8 h-8"
                src={BRAND_LOGO_ICON_DARK}
                width={32}
                height={32}
              />
              <span className="ml-2 text-base font-medium text-slate-700 dark:text-slate-200">
                Stanforte Edge
              </span>
            </div>
            <h2 className="text-2xl font-bold">Forgot Password</h2>
            <p className="mt-2 text-slate-500">
              Enter your work email. We will send a reset link.
            </p>
            {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <FormLabel htmlFor="forgot-email">Email</FormLabel>
                <FormInput
                  id="forgot-email"
                  type="email"
                  placeholder="you@stanforteedge.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email?.message ? (
                  <p className="mt-2 text-sm text-danger">{errors.email.message}</p>
                ) : null}
              </div>
              <Button
                variant="primary"
                type="submit"
                className="w-full py-3"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
            <div className="mt-4 text-sm">
              <Link to="/login" className="text-primary">
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
