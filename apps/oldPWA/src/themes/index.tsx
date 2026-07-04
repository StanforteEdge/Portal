import { Suspense, lazy } from "react";

const RubickSideMenu = lazy(() => import("@/themes/Rubick/SideMenu"));

function Main() {
  return (
    <div>
      <Suspense
        fallback={
          <div className="p-6 animate-pulse">
            <div className="h-6 w-48 rounded bg-slate-200 mb-4"></div>
            <div className="h-[280px] rounded bg-slate-100"></div>
          </div>
        }
      >
        <RubickSideMenu />
      </Suspense>
    </div>
  );
}

export default Main;
