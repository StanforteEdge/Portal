import ThemeSwitcher from "@/components/ThemeSwitcher";
import illustrationUrl from "@/assets/images/illustration.svg";
import { BRAND_LOGO_ICON_DARK } from "@/constants/branding";
import { FormInput, FormCheck } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  loginThunk,
  selectAuthState,
  selectIsAuthenticated,
} from "@/stores/authSlice";
import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { resolveRedirectPath } from "@/utils/resolveRedirectPath";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

const loginSchema: yup.ObjectSchema<LoginFormValues> = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address")
    .test(
      "corporate-domain",
      "Use your stanforteedge.com email",
      (value) => !!value && value.toLowerCase().endsWith("@stanforteedge.com")
    ),
  password: yup.string().required("Password is required"),
  remember: yup.boolean().optional(),
});

function Main() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authState = useAppSelector(selectAuthState);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const redirectFrom = (location.state as { from?: string } | null)?.from;
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  useEffect(() => {
    if (isAuthenticated && authState.user) {
      const redirectPath = redirectFrom || resolveRedirectPath(authState.user.roles ?? []);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, authState.user, navigate, redirectFrom]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setNotice(null);
      const result = await dispatch(
        loginThunk({ email: values.email, password: values.password })
      ).unwrap();

      const redirectPath = redirectFrom || resolveRedirectPath(result.user.roles ?? []);
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      const message =
        typeof error === "string" && error
          ? error
          : "Unable to login. Please verify your credentials.";
      setNotice({ tone: "error", message });
    }
  };

  return (
    <>
      <div
        className={clsx([
          "p-3 sm:px-8 relative h-screen lg:overflow-hidden bg-primary xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600",
          "before:hidden before:xl:block before:content-[''] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-ml-[13%] before:absolute before:inset-y-0 before:left-0 before:transform before:rotate-[-4.5deg] before:bg-primary/20 before:rounded-[100%] before:dark:bg-darkmode-400",
          "after:hidden after:xl:block after:content-[''] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-ml-[13%] after:absolute after:inset-y-0 after:left-0 after:transform after:rotate-[-4.5deg] after:bg-primary after:rounded-[100%] after:dark:bg-darkmode-700",
        ])}
      >
        <ThemeSwitcher />
        <div className="container relative z-10 sm:px-10">
          <div className="block grid-cols-2 gap-4 xl:grid">
            {/* BEGIN: Login Info */}
            <div className="flex-col hidden min-h-screen xl:flex">
              <Link to="/" className="flex items-center pt-5 -intro-x">
                <img alt="Stanforte Edge" className="w-6" src={BRAND_LOGO_ICON_DARK} />
                <span className="ml-3 text-lg text-white">Stanforte Edge</span>
              </Link>
              <div className="my-auto">
                <img
                  alt="Stanforte Edge Portal"
                  className="w-1/2 -mt-16 -intro-x"
                  src={illustrationUrl}
                />
                <div className="mt-10 text-4xl font-medium leading-tight text-white -intro-x">
                  A few more clicks to <br />
                  sign in to your account.
                </div>
                <div className="mt-5 text-lg text-white -intro-x text-opacity-70 dark:text-slate-400">
                  Creating shared prosperity.
                </div>
              </div>
            </div>
            {/* END: Login Info */}
            {/* BEGIN: Login Form */}
            <div className="flex h-screen py-5 my-10 xl:h-auto xl:py-0 xl:my-0">
              <div className="w-full px-5 py-8 mx-auto my-auto bg-white rounded-md shadow-md xl:ml-20 dark:bg-darkmode-600 xl:bg-transparent sm:px-8 xl:p-0 xl:shadow-none sm:w-3/4 lg:w-2/4 xl:w-auto">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <h2 className="text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left">
                    Sign In
                  </h2>
                  {notice ? (
                    <AppNotice
                      tone={notice.tone}
                      message={notice.message}
                      className="mt-4"
                    />
                  ) : null}
                  <div className="mt-2 text-center intro-x text-slate-400 xl:hidden">
                    Enter your corporate credentials to continue.
                  </div>
                  <div className="mt-8 intro-x space-y-4">
                    <div>
                      <FormInput
                        type="text"
                        className="block px-4 py-3 intro-x min-w-full xl:min-w-[350px]"
                        placeholder="Email"
                        autoComplete="email"
                        {...register("email")}
                      />
                      {errors.email?.message && (
                        <p className="mt-2 text-sm text-danger">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <FormInput
                        type="password"
                        className="block px-4 py-3 intro-x min-w-full xl:min-w-[350px]"
                        placeholder="Password"
                        autoComplete="current-password"
                        {...register("password")}
                      />
                      {errors.password?.message && (
                        <p className="mt-2 text-sm text-danger">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex mt-4 text-xs intro-x text-slate-600 dark:text-slate-500 sm:text-sm">
                    <div className="flex items-center mr-auto">
                      <FormCheck.Input
                        id="remember-me"
                        type="checkbox"
                        className="mr-2 border"
                        {...register("remember")}
                      />
                      <label
                        className="cursor-pointer select-none"
                        htmlFor="remember-me"
                      >
                        Remember me
                      </label>
                    </div>
                    <Link to="/forgot-password" className="text-primary">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="mt-5 text-center intro-x xl:mt-8 xl:text-left">
                    <Button
                      variant="primary"
                      className="w-full px-4 py-3 align-top xl:w-32 xl:mr-3"
                      type="submit"
                      disabled={authState.loading}
                    >
                      {authState.loading ? "Signing In..." : "Login"}
                    </Button>
                  </div>
                </form>
                <div className="mt-10 text-center intro-x xl:mt-24 text-slate-600 dark:text-slate-500 xl:text-left">
                  Having trouble? Contact your administrator for access.
                </div>
              </div>
            </div>
            {/* END: Login Form */}
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
