import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Lucide from "@/components/Base/Lucide";
import Breadcrumb from "@/components/Base/Breadcrumb";
import { FormInput } from "@/components/Base/Form";
import { Menu, Popover } from "@/components/Base/Headless";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { logoutThunk, selectAuthState } from "@/stores/authSlice";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/services/notifications";
import { buildAppBreadcrumbs } from "@/utils/breadcrumbs";
import { formatDisplayDate, formatPersonName } from "@/utils/formatting";

function Main() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const breadcrumbs = useMemo(() => buildAppBreadcrumbs(location.pathname), [location.pathname]);

  const userName = formatPersonName(auth.user as any);
  const roleLabel = (auth.user?.roles?.[0] as string | undefined)?.replaceAll("_", " ") || "Staff";

  const loadNotifications = async () => {
    try {
      const [items, unread] = await Promise.all([listNotifications(), getUnreadNotificationCount()]);
      setNotifications(items.slice(0, 8));
      setUnreadCount(unread);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const openNotification = async (item: NotificationItem) => {
    if (item.status === "unread") {
      await markNotificationRead(item.id).catch(() => undefined);
    }
    if (item.link) {
      navigate(item.link);
      return;
    }
    const requestId = item.data?.requestId || item.data?.request_id;
    if (requestId) {
      navigate(`/appOld/requests/request/${requestId}`);
      return;
    }
    navigate("/appOld/requests");
  };

  const logout = async () => {
    await dispatch(logoutThunk());
    navigate("/login");
  };

  return (
    <div className="relative z-[51] flex h-[67px] items-center border-b border-slate-200">
      <Breadcrumb className="hidden mr-auto -intro-x sm:flex">
        {breadcrumbs.map((crumb, index) => (
          <Breadcrumb.Link key={index} to={crumb.path} active={index === breadcrumbs.length - 1}>
            {crumb.label}
          </Breadcrumb.Link>
        ))}
      </Breadcrumb>

      <div className="relative mr-3 intro-x sm:mr-6">
        <div className="relative hidden sm:block">
          <FormInput
            type="text"
            className="border-transparent w-56 shadow-none rounded-full bg-slate-300/50 pr-8 transition-[width] duration-300 ease-in-out focus:border-transparent focus:w-72 dark:bg-darkmode-400/70"
            placeholder="Search..."
          />
          <Lucide
            icon="Search"
            className="absolute inset-y-0 right-0 w-5 h-5 my-auto mr-3 text-slate-600 dark:text-slate-500"
          />
        </div>
      </div>

      <Popover className="mr-auto intro-x sm:mr-6">
        <Popover.Button className="relative text-slate-600 outline-none block">
          {unreadCount > 0 ? (
            <span className="absolute top-[-2px] right-0 w-[8px] h-[8px] rounded-full bg-danger" />
          ) : null}
          <Lucide icon="Bell" className="w-5 h-5 dark:text-slate-500" />
        </Popover.Button>
        <Popover.Panel className="w-[280px] sm:w-[350px] p-5 mt-2">
          <div className="flex items-center mb-4">
            <div className="font-medium mr-auto">Notifications</div>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  void markAllNotificationsRead().then(loadNotifications);
                }}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          {notifications.length === 0 ? (
            <div className="text-sm text-slate-500">No notifications yet.</div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left rounded-md border p-2 hover:bg-slate-50"
                  onClick={() => {
                    void openNotification(item);
                  }}
                >
                  <div className="flex items-center">
                    <div className="font-medium truncate mr-2">{item.title}</div>
                    <div className="ml-auto text-xs text-slate-400 whitespace-nowrap">
                      {formatDisplayDate(item.created_at)}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{item.message}</div>
                </button>
              ))}
            </div>
          )}
        </Popover.Panel>
      </Popover>

      <Menu>
        <Menu.Button className="flex items-center justify-center w-8 h-8 overflow-hidden rounded-full shadow-lg bg-primary/10 text-primary font-semibold zoom-in intro-x">
          {userName?.charAt(0)?.toUpperCase() || "U"}
        </Menu.Button>
        <Menu.Items className="w-56 mt-px text-white bg-primary">
          <Menu.Header className="font-normal">
            <div className="font-medium">{userName}</div>
            <div className="text-xs text-white/70 mt-0.5">{roleLabel}</div>
          </Menu.Header>
          <Menu.Divider className="bg-white/[0.08]" />
          <Menu.Item className="hover:bg-white/5" onClick={() => navigate("/appOld/profile")}>
            <Lucide icon="User" className="w-4 h-4 mr-2" /> Profile
          </Menu.Item>
          <Menu.Item className="hover:bg-white/5" onClick={() => navigate("/change-password")}>
            <Lucide icon="Lock" className="w-4 h-4 mr-2" /> Change Password
          </Menu.Item>
          <Menu.Divider className="bg-white/[0.08]" />
          <Menu.Item className="hover:bg-white/5" onClick={() => void logout()}>
            <Lucide icon="ToggleRight" className="w-4 h-4 mr-2" /> Logout
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </div>
  );
}

export default Main;
