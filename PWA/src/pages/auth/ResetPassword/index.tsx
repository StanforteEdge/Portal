import { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import clsx from "clsx";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel } from "@/components/Base/Form";
import { resetPassword } from "@/services/auth";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import PasswordInput from "@/components/Auth/PasswordInput";
import { BRAND_LOGO_ICON_DARK } from "@/constants/branding";

type ResetPasswordForm = {
  new_password: string;
  confirm_password: string;
};

const schema: yup.ObjectSchema<ResetPasswordForm> = yup.object({
  new_password: yup
    .string()
    .required("New password is required")
    .min(8, "Minimum length is 8 characters"),
  confirm_password: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("new_password")], "Passwords do not match"),
});

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(
    null
  );
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: yupResolver(schema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const onSubmit = async (values: ResetPasswordForm) => {
    if (!token) {
      setNotice({ tone: "error", message: "Missing reset token." });
      return;
    }
    try {
      setLoading(true);
      setNotice(null);
      await resetPassword({ token, new_password: values.new_password });
      setNotice({
        tone: "success",
        message: "Password reset successful. Sign in with your new password.",
      });
      navigate("/login", { replace: true });
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to reset password.",
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
            <h2 className="text-2xl font-bold">Reset Password</h2>
            <p className="mt-2 text-slate-500">Set a new password for your account.</p>
            {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <FormLabel htmlFor="reset-password">New Password</FormLabel>
                <PasswordInput
                  id="reset-password"
                  autoComplete="new-password"
                  {...register("new_password")}
                />
                {errors.new_password?.message ? (
                  <p className="mt-2 text-sm text-danger">{errors.new_password.message}</p>
                ) : null}
              </div>
              <div>
                <FormLabel htmlFor="confirm-password">Confirm Password</FormLabel>
                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  {...register("confirm_password")}
                />
                {errors.confirm_password?.message ? (
                  <p className="mt-2 text-sm text-danger">{errors.confirm_password.message}</p>
                ) : null}
              </div>
              <Button
                variant="primary"
                type="submit"
                className="w-full py-3"
                disabled={loading}
              >
                {loading ? "Saving..." : "Reset password"}
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

export default ResetPasswordPage;
