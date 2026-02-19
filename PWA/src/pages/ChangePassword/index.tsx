import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel } from "@/components/Base/Form";
import { Tab } from "@/components/Base/Headless";
import { changePassword } from "@/services/auth";
import { useState } from "react";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import PasswordInput from "@/components/Auth/PasswordInput";

type ChangePasswordFormValues = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

const schema: yup.ObjectSchema<ChangePasswordFormValues> = yup.object({
  current_password: yup.string().required("Current password is required"),
  new_password: yup
    .string()
    .required("New password is required")
    .min(8, "Minimum length is 8 characters"),
  confirm_password: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("new_password")], "Passwords do not match"),
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(
    null
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      setLoading(true);
      setNotice(null);
      await changePassword(values);
      setNotice({ tone: "success", message: "Password updated successfully." });
      reset();
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Settings</h2>
      </div>

      <div className="mt-5 intro-y box">
        <div className="px-5 border-b border-slate-200/60 dark:border-darkmode-400">
          <Tab.Group selectedIndex={1}>
            <Tab.List variant="link-tabs" className="flex-col sm:flex-row">
              <Tab>
                <Tab.Button className="py-4" onClick={() => navigate("/app/profile")}>
                  Profile
                </Tab.Button>
              </Tab>
              <Tab>
                <Tab.Button className="py-4">Security</Tab.Button>
              </Tab>
            </Tab.List>
          </Tab.Group>
        </div>
        <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
          <h2 className="mr-auto text-base font-medium">Change Password</h2>
        </div>

        <div className="p-5">
          {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mb-4" /> : null}
          <form className="space-y-4 max-w-xl" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <FormLabel htmlFor="current_password">Current Password</FormLabel>
              <PasswordInput
                id="current_password"
                autoComplete="current-password"
                {...register("current_password")}
              />
              {errors.current_password?.message ? (
                <p className="mt-2 text-sm text-danger">{errors.current_password.message}</p>
              ) : null}
            </div>

            <div>
              <FormLabel htmlFor="new_password">New Password</FormLabel>
              <PasswordInput
                id="new_password"
                autoComplete="new-password"
                {...register("new_password")}
              />
              {errors.new_password?.message ? (
                <p className="mt-2 text-sm text-danger">{errors.new_password.message}</p>
              ) : null}
            </div>

            <div>
              <FormLabel htmlFor="confirm_password">Confirm New Password</FormLabel>
              <PasswordInput
                id="confirm_password"
                autoComplete="new-password"
                {...register("confirm_password")}
              />
              {errors.confirm_password?.message ? (
                <p className="mt-2 text-sm text-danger">{errors.confirm_password.message}</p>
              ) : null}
            </div>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ChangePasswordPage;
