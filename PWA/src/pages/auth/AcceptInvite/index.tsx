import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import clsx from "clsx";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel } from "@/components/Base/Form";
import { acceptInvite } from "@/services/auth";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import PasswordInput from "@/components/Auth/PasswordInput";
import { BRAND_LOGO_FULL_WHITE } from "@/constants/branding";

type AcceptInviteForm = {
  new_password: string;
  confirm_password: string;
};

const schema: yup.ObjectSchema<AcceptInviteForm> = yup.object({
  new_password: yup
    .string()
    .required("Password is required")
    .min(8, "Minimum length is 8 characters"),
  confirm_password: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("new_password")], "Passwords do not match"),
});

function AcceptInvitePage() {
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
  } = useForm<AcceptInviteForm>({
    resolver: yupResolver(schema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const onSubmit = async (values: AcceptInviteForm) => {
    if (!token) {
      setNotice({ tone: "error", message: "Missing invite token." });
      return;
    }

    try {
      setLoading(true);
      setNotice(null);
      await acceptInvite({
        token,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      setNotice({ tone: "success", message: "Invite accepted. You can now sign in." });
      navigate("/login", { replace: true });
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to accept invite.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={clsx([
        "p-3 sm:px-8 relative h-screen lg:overflow-hidden bg-primary xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600",
      ])}
    >
      <ThemeSwitcher />
      <div className="container relative z-10 sm:px-10">
        <div className="flex h-screen py-5">
          <div className="absolute inset-x-0 top-8 flex items-center justify-center xl:hidden">
            <img
              alt="Stanforte Edge"
              className="w-44 h-auto"
              src={BRAND_LOGO_FULL_WHITE}
              width={176}
              height={44}
            />
          </div>
          <div className="w-full px-5 py-8 mx-auto my-auto bg-white rounded-md shadow-md sm:px-8 sm:w-3/4 lg:w-2/4 xl:w-1/3 dark:bg-darkmode-600">
            <h2 className="text-2xl font-bold">Accept Invitation</h2>
            <p className="mt-2 text-slate-500">
              Set your password to activate your Stanforte Edge account.
            </p>
            {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <FormLabel htmlFor="invite-password">Password</FormLabel>
                <PasswordInput
                  id="invite-password"
                  autoComplete="new-password"
                  {...register("new_password")}
                />
                {errors.new_password?.message ? (
                  <p className="mt-2 text-sm text-danger">{errors.new_password.message}</p>
                ) : null}
              </div>
              <div>
                <FormLabel htmlFor="invite-password-confirm">Confirm Password</FormLabel>
                <PasswordInput
                  id="invite-password-confirm"
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
                {loading ? "Activating..." : "Activate account"}
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

export default AcceptInvitePage;
