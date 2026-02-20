import clsx from "clsx";
import { Link } from "react-router-dom";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Button from "@/components/Base/Button";
import { BRAND_LOGO_FULL_WHITE } from "@/constants/branding";

function RegisterPage() {
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
            <h2 className="text-2xl font-bold">Account Setup</h2>
            <p className="mt-3 text-slate-600">
              Self-registration is disabled. Accounts are created by Admin/HR and
              activated via invite email.
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/login" className="flex-1">
                <Button variant="primary" className="w-full">
                  Go to login
                </Button>
              </Link>
              <Link to="/forgot-password" className="flex-1">
                <Button variant="outline-secondary" className="w-full">
                  Forgot password
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
