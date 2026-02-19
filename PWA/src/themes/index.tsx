import { Suspense, lazy } from "react";

const RubickSideMenu = lazy(() => import("@/themes/Rubick/SideMenu"));

function Main() {
  return (
    <div>
      <Suspense fallback={<div className="p-6 text-slate-500">Loading layout...</div>}>
        <RubickSideMenu />
      </Suspense>
    </div>
  );
}

export default Main;
