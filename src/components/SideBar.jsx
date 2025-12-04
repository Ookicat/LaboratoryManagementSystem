import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Users,
  Shield,
  BriefcaseMedical,
  ClipboardList,
  Beaker,
  FileText,
  Mail,
  Settings,
  UserCircle,
  LogOut,
} from "lucide-react";
import api from "../API/Axios";

export default function Sidebar({ className = "" }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem("sidebarCollapsed");
      return stored !== null ? JSON.parse(stored) : false;
    } catch (e) {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
      return newState;
    });
  };

  const [privileges, setPrivileges] = useState([]);
  const [, setLoadingPrivileges] = useState(false);

  // --- LOGIC GIỮ NGUYÊN ---
  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  };

  const setStoredUser = (user) => {
    try {
      if (!user) localStorage.removeItem("user");
      else localStorage.setItem("user", JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) return;

    const roleObj = stored.user?.role || stored.role || null;
    if (
      roleObj &&
      typeof roleObj === "object" &&
      Array.isArray(roleObj.privileges)
    ) {
      setPrivileges(roleObj.privileges.map((p) => String(p)));
      return;
    }
    if (Array.isArray(stored.privileges) && stored.privileges.length > 0) {
      setPrivileges(stored.privileges.map((p) => String(p)));
      return;
    }
    const roleName =
      (roleObj && roleObj.name) ||
      (typeof stored.user?.role === "string" && stored.user.role) ||
      stored.role;

    if (roleName && typeof roleName === "string") {
      (async () => {
        try {
          setLoadingPrivileges(true);
          const res = await api.get("/roles/");
          const payload = res?.data ?? {};
          const rolesList = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.content)
            ? payload.content
            : [];
          const found = rolesList.find(
            (r) => String(r.name).toUpperCase() === roleName.toUpperCase()
          );
          if (found) {
            let p = [];
            if (Array.isArray(found.privileges)) {
              p = found.privileges.map((x) =>
                typeof x === "object" ? x.name : x
              );
            } else if (
              found.privileges &&
              typeof found.privileges === "object"
            ) {
              p = Object.values(found.privileges).map((x) =>
                typeof x === "object" ? x.name : x
              );
            }
            p = p.filter(Boolean).map((s) => String(s));
            setPrivileges(p);
            const updated = { ...(stored || {}) };
            updated.user = updated.user || {};
            updated.user.role = { ...(found || {}) };
            updated.privileges = p;
            setStoredUser(updated);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingPrivileges(false);
        }
      })();
    }
  }, []);

  const hasPrivilege = useMemo(
    () =>
      (required = []) => {
        if (!required || required.length === 0) return true;
        return required.some((r) => privileges.includes(r));
      },
    [privileges]
  );

  const isActive = (href) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      const user = getStoredUser();
      const refreshToken = user?.refreshToken;
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const navItems = [
    {
      title: "Thống kê",
      icon: BarChart3,
      href: "/dashboard",
      privileges: ["VIEW_EVENT_LOGS"],
    },
    {
      title: "Tài khoản",
      icon: Users,
      href: "/management/user",
      privileges: ["VIEW_USER"],
    },
    {
      title: "Vai trò",
      icon: Shield,
      href: "/management/role",
      privileges: ["VIEW_ROLE"],
    },
    {
      title: "Bệnh nhân",
      icon: BriefcaseMedical,
      href: "/management/patient",
      privileges: ["VIEW_PERSONAL_TEST_RESULT"],
    },
    {
      title: "Test Orders",
      icon: ClipboardList,
      href: "/management/sample-management",
      privileges: ["READ_ONLY"],
    },
    {
      title: "Thiết bị",
      icon: Beaker,
      href: "/management/device",
      privileges: ["VIEW_INSTRUMENT"],
    },
    {
      title: "Lịch sử hoạt động",
      icon: FileText,
      href: "/management/monitoring",
      privileges: ["VIEW_EVENT_LOGS"],
    },
    {
      title: "Gửi xác thực email",
      icon: Mail,
      href: "/resend-email",
      privileges: ["VIEW_USER"],
    },
    {
      title: "Cài đặt",
      icon: Settings,
      href: "/comingsoon",
      privileges: ["VIEW_CONFIGURATION"],
    },
  ];

  const scrollRef = useRef(null);

  // Save scroll position whenever the user scrolls
  useEffect(() => {
    const currentRef = scrollRef.current;
    if (!currentRef) return;

    const handleScroll = () => {
      sessionStorage.setItem("sidebarScroll", currentRef.scrollTop);
    };

    currentRef.addEventListener("scroll", handleScroll);

    return () => {
      currentRef.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <aside
      // Đã XÓA các class border ở đây để tạo cảm giác liền mạch
      className={`${className} bg-white flex flex-col h-screen shadow-xl transition-all duration-300 ease-in-out z-50`}
      style={{
        width: collapsed ? "70px" : "240px",
      }}
    >
      {/* 1. HEADER: Đã xóa border-b, thêm padding bottom (pb-2) để tạo khoảng cách tự nhiên */}
      <div
        className={`flex items-center h-16 px-3 flex-shrink-0 mb-2 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={toggleCollapsed}
            className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg shadow-md hover:bg-blue-700 transition-colors flex-shrink-0"
            title="Toggle Sidebar"
          >
            LM
          </button>

          <div
            className={`flex flex-col transition-all duration-300 ${
              collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
            }`}
          >
            <span className="font-bold text-gray-800 text-base whitespace-nowrap">
              Lab Manager
            </span>
          </div>
        </div>
      </div>

      {/* 2. MENU: flex-1 để lấp đầy khoảng trống */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
      >
        <nav>
          <ul className="px-3 space-y-1">
            {navItems
              .filter((item) => hasPrivilege(item.privileges))
              .map((item, idx) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={idx}>
                    <Link
                      to={item.href}
                      title={collapsed ? item.title : ""}
                      className={`flex items-center rounded-lg py-3 transition-all duration-200 group ${
                        collapsed ? "justify-center px-0" : "px-4 gap-3"
                      } ${
                        active
                          ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      style={{ textDecoration: "none" }}
                    >
                      <Icon
                        className={`transition-colors flex-shrink-0 ${
                          active
                            ? "text-blue-600"
                            : "text-gray-500 group-hover:text-gray-700"
                        }`}
                        size={22}
                      />
                      {!collapsed && (
                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>

      {/* 3. FOOTER: Đã xóa border-t, thêm padding top (pt-2) */}
      <div className="p-3 flex flex-col gap-1 flex-shrink-0 bg-white mt-2">
        <Link
          to="/management/profile"
          title={collapsed ? "Hồ sơ cá nhân" : ""}
          className={`flex items-center rounded-lg py-3 transition-colors no-underline group ${
            collapsed ? "justify-center px-0" : "px-4 gap-3"
          } ${
            location.pathname === "/profile"
              ? "bg-blue-50 text-blue-600 font-semibold"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <UserCircle
            size={22}
            className={`flex-shrink-0 ${
              location.pathname === "/profile"
                ? "text-blue-600"
                : "text-gray-500 group-hover:text-gray-700"
            }`}
          />
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap">Hồ sơ</span>
          )}
        </Link>

        <button
          onClick={handleLogout}
          title={collapsed ? "Đăng xuất" : ""}
          className={`flex items-center rounded-lg py-3 transition-colors group ${
            collapsed ? "justify-center px-0" : "px-4 gap-3"
          } text-red-600 hover:bg-red-50`}
        >
          <LogOut size={22} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap">
              Đăng xuất
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
