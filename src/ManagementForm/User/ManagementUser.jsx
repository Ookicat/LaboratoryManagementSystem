import React, { useEffect, useState, useRef } from "react";
import {
  User as UserIcon,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Mail,
  RotateCcw,
} from "lucide-react";
import api from "../../API/Axios";
import Sidebar from "../../components/SideBar";
import { showError, showSuccess } from "../../components/Toast";
import Message, { formatErrorMessage } from "../../components/Message";
import UploadUsers from "./UploadUsers";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const parse_ddMMyyyy_HHmmss = (str) => {
  if (!str || typeof str !== "string") return null;
  const [datePart, timePart = "00:00:00"] = str.split(" ");
  const [day, month, year] = datePart.split("-").map(Number);
  if (![day, month, year].every(Boolean)) return null;
  const [hour = 0, minute = 0, second = 0] = (timePart || "00:00:00")
    .split(":")
    .map(Number);
  const d = new Date(
    year,
    (month || 1) - 1,
    day,
    hour || 0,
    minute || 0,
    second || 0
  );
  if (isNaN(d.getTime())) return null;
  return d;
};

const getUserIdFromStored = (stored) => {
  if (!stored) return null;
  const u = stored.user || stored;
  return u?.id || u?.userId || u?.sub || null;
};

const formatDateSafe = (value) => {
  if (!value) return "-";
  let d;
  if (value instanceof Date) d = value;
  else if (typeof value === "string") {
    d = new Date(value);
    if (isNaN(d.getTime())) {
      d = parse_ddMMyyyy_HHmmss(value);
    }
  } else {
    return "-";
  }
  if (!d || isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const normalizeDate = (d) => {
  if (!d) return d;
  if (/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(d)) return d;
  const isoMatch = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, day] = isoMatch;
    return `${m}/${day}/${y}`;
  }
  return d;
};

const calculateAgeFromDate = (dateStr) => {
  if (!dateStr) return "";
  // try Date constructor for ISO yyyy-mm-dd (input[type=date] returns this)
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // try parsing dd-MM-yyyy HH:mm:ss fallback
    d = parse_ddMMyyyy_HHmmss(dateStr);
    if (!d) return "";
  }
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m <= 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 ? String(age) : "";
};

const ManagementUser = () => {
  const initialStored = readStoredUser();

  const [, setCurrentUserIdFromToken] = useState(() =>
    getUserIdFromStored(initialStored)
  );
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (e) {
    stored = {};
  }
  const currentUser = stored.user || stored;
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const currentUserId = currentUser?.id || currentUser?.userId || null;

  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  const [roles, setRoles] = useState([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [userToUnblock, setUserToUnblock] = useState(null);

  const [showResendModalConfirm, setShowResendModalConfirm] = useState(false);
  const [userToResend, setUserToResend] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);

  const [page, setPage] = useState(0);
  const SERVER_PAGE_SIZE = 100;
  const PER_PAGE = 20;
  const [serverPagesLoaded, setServerPagesLoaded] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    identifyNumber: "",
    gender: "MALE",
    age: "",
    address: "",
    dateOfBirth: "",
    role: "",
    status: "ACTIVE",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const currentSearchRef = useRef(search);
  const currentRoleRef = useRef(filterRole);
  const currentStatusRef = useRef(filterStatus);
  const currentGenderRef = useRef(filterGender);
  const tableRef = useRef(null);
  useEffect(() => {
    const onStorage = () => {
      const s = readStoredUser();
      setCurrentUserIdFromToken(getUserIdFromStored(s));
    };
    window.addEventListener("storage", onStorage);
    onStorage();
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles/");
      const payload = res?.data ?? {};
      const rolesData = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.content)
        ? payload.content
        : [];
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      console.error("Lỗi khi lấy roles", err);
      const resp = err?.response?.data ?? err?.response ?? null;
      const message = formatErrorMessage(resp) || "Lỗi khi lấy roles";
      setApiError(message);
      showError(message);
    }
  };
  const fetchStatus = [
    "PENDING_VERIFICATION", // user mới tạo, chưa xác minh email
    "ACTIVE", // đã xác minh, có thể login
    "INACTIVE", // bị vô hiệu hóa bởi admin
    "BLOCKED", // bị chặn (do vi phạm)
    "DELETED", // đã xóa
  ];
  const fetchGender = ["MALE", "FEMALE"];

  const fetchUsers = async (serverPageIndex = 0, append = false) => {
    setLoading(true);
    setError(null);
    setApiError(null);
    setApiSuccess(null);
    try {
      const params = {
        page: serverPageIndex,
        size: SERVER_PAGE_SIZE,
      };

      const keyword = (currentSearchRef.current || "").trim();
      const role = (currentRoleRef.current || "").trim();
      const status = (currentStatusRef.current || "").trim();
      const gender = (currentGenderRef.current || "").trim();
      if (keyword) params.keyword = keyword;
      if (role && role.toLowerCase() !== "all") params.role = role;
      if (status && status.toLowerCase() !== "all") params.status = status;
      if (gender && gender.toLowerCase() !== "all") params.gender = gender;
      const res = await api.get("/users/", { params });

      const root = res.data;
      const maybe = root && root.data ? root.data : root;
      let content = [];
      let total = 0;

      if (maybe && Array.isArray(maybe.content)) {
        content = maybe.content;
        total = maybe.totalElements ?? total;
      } else if (Array.isArray(maybe)) {
        content = maybe;
        total = maybe.length;
      } else if (root && Array.isArray(root.content)) {
        content = root.content;
        total = root.totalElements ?? total;
      }

      if (append) {
        setUsers((prev) => {
          const ids = new Set(prev.map((p) => String(p.id)));
          const toAdd = content.filter((c) => !ids.has(String(c.id)));
          return [...prev, ...toAdd];
        });
        setFilteredUsers((prev) => {
          const ids = new Set(prev.map((p) => String(p.id)));
          const toAdd = content.filter((c) => !ids.has(String(c.id)));
          return [...prev, ...toAdd];
        });
        setServerPagesLoaded((prev) => prev + 1);
      } else {
        setUsers(content);
        setFilteredUsers(content);
        setServerPagesLoaded(content.length > 0 ? 1 : 0);
      }

      setTotalElements(total);
      setHasMore(content.length >= SERVER_PAGE_SIZE);
    } catch (err) {
      console.error("Lỗi khi lấy users:", err);
      const resp = err?.response?.data ?? err?.response ?? null;
      let message = formatErrorMessage(resp);
      setError(message);
      setApiError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = async () => {
    setSearch("");
    setFilterRole("all");
    setFilterStatus("all");
    setFilterGender("all");

    currentSearchRef.current = "";
    currentRoleRef.current = "all";
    currentStatusRef.current = "all";
    currentGenderRef.current = "all";

    setUsers([]);
    setFilteredUsers([]);
    setServerPagesLoaded(0);
    setPage(0);
    setHasMore(true);
    setShowFilterPopup(false);

    await fetchUsers(0, false);
  };

  useEffect(() => {
    currentSearchRef.current = search;
    currentRoleRef.current = filterRole;
    currentGenderRef.current = filterGender;
    currentStatusRef.current = filterStatus;
    fetchUsers(0, false);
    fetchRoles();
  }, []);

  useEffect(() => {
    currentSearchRef.current = search;
    currentRoleRef.current = filterRole;
    currentGenderRef.current = filterGender;
    currentStatusRef.current = filterStatus;
    setUsers([]);
    setFilteredUsers([]);
    setServerPagesLoaded(0);
    setPage(0);
    setHasMore(true);
    fetchUsers(0, false);
  }, [search, filterRole, filterStatus, filterGender]);

  useEffect(() => {
    let result = users;

    if (filterRole && filterRole !== "all") {
      result = result.filter((u) => {
        const roleName =
          typeof u.role === "string"
            ? u.role
            : (u.role && (u.role.name || u.role)) || "";
        return (
          String(roleName).toLowerCase() === String(filterRole).toLowerCase()
        );
      });
    }
    if (filterGender && filterGender !== "all") {
      result = result.filter((u) => {
        const gender =
          typeof u.gender === "string"
            ? u.gender
            : (u.gender && (u.gender.name || u.gender)) || "";
        return (
          String(gender).toLowerCase() === String(filterGender).toLowerCase()
        );
      });
    }
    if (filterStatus && filterStatus !== "all") {
      result = result.filter((u) => {
        const status =
          typeof u.status === "string"
            ? u.status
            : (u.status && (u.status.name || u.status)) || "";
        return (
          String(status).toLowerCase() === String(filterStatus).toLowerCase()
        );
      });
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.fullName && u.fullName.toLowerCase().includes(s)) ||
          (u.email && u.email.toLowerCase().includes(s)) ||
          (u.username && u.username.toLowerCase().includes(s)) ||
          (u.phoneNumber && u.phoneNumber.includes(s)) ||
          (u.identifyNumber && u.identifyNumber.includes(s))
      );
    }
    setFilteredUsers(result);
  }, [users, search, filterRole, filterGender, filterStatus]);

  const getRoleLabel = (role) => {
    if (!role) return "VIEWER";
    if (typeof role === "string") return role;
    return role.name || "VIEWER";
  };

  const getRoleColor = (roleName) => {
    const r = (roleName || "").toLowerCase();
    if (r.includes("admin")) return "bg-red-100 text-red-800";
    if (r.includes("viewer")) return "bg-blue-100 text-blue-800";
    if (r.includes("patient")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  useEffect(() => {
    try {
      const email = (formData.email || "").trim().toLowerCase();
      if (showAddModal && email.endsWith("@gmail.com")) {
        const usernameFromEmail = email.split("@")[0];
        if (usernameFromEmail && usernameFromEmail !== formData.username) {
          setFormData((prev) => ({ ...prev, username: usernameFromEmail }));
        }
      } else {
        if (showAddModal && formData.username) {
          setFormData((prev) => ({ ...prev, username: "" }));
        }
      }
    } catch (e) {
      console.error("Error syncing username from email:", e);
    }
  }, [formData.email, showAddModal]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName || !formData.fullName.trim())
      newErrors.fullName = "Họ và tên không được để trống";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email))
      newErrors.email = "Email không hợp lệ";
    if (!formData.phoneNumber || !/^0\d{9,15}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "SĐT phải 10-15 số và bắt đầu bằng 0";
    if (formData.identifyNumber && !/^\d{12}$/.test(formData.identifyNumber))
      newErrors.identifyNumber = "CCCD phải 12 chữ số";
    if (!formData.address || !formData.address.trim())
      newErrors.address = "Địa chỉ không được để trống";
    if (
      formData.role &&
      String(formData.role).toUpperCase() !== "PATIENT" &&
      formData.password
    ) {
      const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!pwRegex.test(formData.password))
        newErrors.password =
          "Mật khẩu phải >=8 ký tự, có chữ hoa, chữ thường, và số.";
    }
    if (
      formData.dateOfBirth &&
      !/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(
        normalizeDate(formData.dateOfBirth)
      )
    ) {
      newErrors.dateOfBirth = "Ngày sinh phải ở định dạng MM/DD/YYYY";
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const msg = Object.values(newErrors).join("\n");
      setApiError(msg);
      showError(msg);
      const firstKey = Object.keys(newErrors)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el && typeof el.focus === "function") el.focus();
      return false;
    }
    return true;
  };

  const buildUserPayload = (form) => {
    const p = {
      ...(form.username ? { username: form.username } : {}),
      fullName: form.fullName,
      email: form.email,
      phoneNumber: String(form.phoneNumber || ""),
      identifyNumber: form.identifyNumber,
      gender: form.gender,
      age: Number(form.age) || 0,
      address: form.address,
      dateOfBirth: normalizeDate(form.dateOfBirth),
      role: form.role,
      status: form.status,
    };
    return p;
  };

  const openView = async (user) => {
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await api.get(`/users/${user.id}`);
      const payload = res.data && res.data.data ? res.data.data : res.data;
      const userData =
        payload && payload.content ? payload.content : payload || user;
      setSelectedUser(userData);
      setShowViewModal(true);
    } catch (err) {
      console.error("Lỗi khi lấy user để xem", err);
      const resp = err?.response?.data ?? err?.response ?? null;
      let message = formatErrorMessage(resp) || "Lỗi khi lấy dữ liệu";
      setApiError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = async (user) => {
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await api.get(`/users/${user.id}`);
      const payload = res.data && res.data.data ? res.data.data : res.data;
      const u = payload && payload.content ? payload.content : payload || user;
      setSelectedUser(u);
      setFormData({
        username: u.username || "",
        fullName: u.fullName || "",
        email: u.email || "",
        phoneNumber: u.phoneNumber || "",
        identifyNumber: u.identifyNumber || "",
        gender: u.gender || "MALE",
        age: u.age || "",
        address: u.address || "",
        dateOfBirth: u.dateOfBirth || "",
        role:
          (typeof u.role === "string"
            ? u.role
            : (u.role && u.role.name) || "") || "",
        status: u.status || "ACTIVE",
        password: "",
      });
      setShowEditModal(true);
    } catch (err) {
      console.error("Lỗi khi lấy user để edit", err);
      const resp = err?.response?.data ?? err?.response ?? null;
      let message = formatErrorMessage(resp) || "Lỗi khi lấy dữ liệu";
      setApiError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const promptInactiveUser = (u) => {
    setUserToBlock(u);
    setShowBlockModal(true);
  };

  const confirmBlock = async () => {
    if (!userToBlock) return;

    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      await api.post(`/users/${userToBlock.id}/disable`);
      const successMsg = "Người dùng đã bị chặn (BLOCKED)";
      setApiSuccess(successMsg);
      showSuccess(successMsg);
      setShowBlockModal(false);
      setUserToBlock(null);
      setUsers([]);
      setServerPagesLoaded(0);
      await fetchUsers(0, false);
    } catch (err) {
      console.error("Lỗi khi block user:", err);
      const resp = err?.response?.data ?? err?.response ?? null;
      let message = formatErrorMessage(resp) || "Lỗi khi block người dùng";
      setApiError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const promptUnblockUser = (u) => {
    setUserToUnblock(u);
    setShowUnblockModal(true);
  };

  const confirmActive = async () => {
    if (!userToUnblock) return;

    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      await api.post(`/users/${userToUnblock.id}/enable`);
      const successMsg = "Người dùng đã được kích hoạt (ACTIVE)";
      setApiSuccess(successMsg);
      showSuccess(successMsg);
      setShowUnblockModal(false);
      setUserToUnblock(null);
      setUsers([]);
      setServerPagesLoaded(0);
      await fetchUsers(0, false);
    } catch (err) {
      console.error("Lỗi khi kích hoạt user:", err);
      const resp = err?.response?.data ?? err?.response ?? null;
      let message = formatErrorMessage(resp) || "Lỗi khi kích hoạt người dùng";
      setApiError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };
  const promptResendUser = (u) => {
    setUserToResend(u);
    setShowResendModalConfirm(true);
  };

  const confirmResend = async () => {
    if (!userToResend) return;

    setResendLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await api.post(
        `/users/${userToResend.id}/resend-verification`
      );
      const srv = res?.data ?? res;
      const successMsg =
        typeof srv === "string"
          ? srv
          : srv?.message || "Đã gửi lại email xác thực thành công.";
      setApiSuccess(successMsg);
      showSuccess(successMsg);
      setShowResendModalConfirm(false);
      setUserToResend(null);
      setUsers([]);
      setServerPagesLoaded(0);
      await fetchUsers(0, false);
    } catch (err) {
      console.error("Lỗi khi gửi lại email xác thực:", err);
      const resp = err?.response?.data ?? err?.response ?? err;
      const message =
        formatErrorMessage(resp) || "Lỗi khi gửi lại email xác thực";
      setApiError(message);
      showError(message);
    } finally {
      setResendLoading(false);
    }
  };
  const initialFormData = {
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    identifyNumber: "",
    gender: "MALE",
    age: "",
    address: "",
    dateOfBirth: "",
    role: "",
    status: "ACTIVE",
    password: "",
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setApiError(null);
    setApiSuccess(null);

    try {
      const payload = buildUserPayload(formData);
      if (String(formData.role).toUpperCase() !== "PATIENT") {
        const pw = formData.password ? String(formData.password).trim() : "";
        if (pw.length > 0) {
          payload.password = pw;
        } else {
          delete payload.password;
        }
      } else {
        delete payload.password;
      }

      const res = await api.post("/users/", payload);
      setUsers([]);
      setServerPagesLoaded(0);
      await fetchUsers(0, false);

      setShowAddModal(false);
      setFormData({ ...initialFormData });
      setErrors({});

      const srv = res?.data ?? res;
      const successMsg = formatErrorMessage(srv) || "Tạo người dùng thành công";
      setApiSuccess(successMsg);
      showSuccess(successMsg);
    } catch (err) {
      console.error("Lỗi khi thêm user:", err);
      const srv = err?.response?.data ?? err;
      const msg = formatErrorMessage(srv) || "Lỗi khi thêm user";
      setError(msg);
      setApiError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setApiError(null);
    setApiSuccess(null);
    try {
      const payload = buildUserPayload(formData);
      if (
        String(formData.role).toUpperCase() !== "PATIENT" &&
        formData.password
      ) {
        payload.password = formData.password;
      }
      await api.patch(`/users/${selectedUser.id}`, payload);
      setUsers([]);
      setServerPagesLoaded(0);
      await fetchUsers(0, false);
      setShowEditModal(false);
      setSelectedUser(null);
      setErrors({});
      const successMsg = "Cập nhật người dùng thành công";
      setApiSuccess(successMsg);
      showSuccess(successMsg);
    } catch (err) {
      console.error("Lỗi khi cập nhật user:", err);
      const resp = err?.response?.data ?? err?.response ?? null;
      let message = formatErrorMessage(resp) || "Lỗi khi lưu dữ liệu";
      setError(message);
      setApiError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);
    setApiError(null);
    setApiSuccess(null);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setUsers([]);
      setServerPagesLoaded(0);
      await fetchUsers(0, false);
      setShowDeleteModal(false);
      setSelectedUser(null);
      const successMsg = "Xóa người dùng thành công";
      setApiSuccess(successMsg);
      showSuccess(successMsg);
    } catch (err) {
      console.error("Lỗi khi xóa user:", err);
      const resp = err?.response?.data ?? err?.response ?? null;
      let message = formatErrorMessage(resp) || "Lỗi khi xóa người dùng";
      setError(message);
      setApiError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const totalPagesCalc = Math.max(
    1,
    Math.ceil((Number(totalElements) || filteredUsers.length || 0) / PER_PAGE)
  );
  const currentPage = Math.max(1, Math.min(page + 1, totalPagesCalc));
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const isSelf = (u) => {
    if (!u) return false;
    return String(u.id) === String(currentUserId);
  };

  return (
    // FIX LAYOUT: Dùng Flexbox + h-screen + overflow-hidden để khóa body
    <div className="flex bg-gray-50 w-full h-screen overflow-hidden">
      {/* Sidebar: Để nó tự nhiên, không bao bọc trong div fixed */}
      <Sidebar />

      {/* Main Content: flex-1 để tự động chiếm hết chỗ trống + overflow-y-auto để cuộn */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-0 relative">
        {/* Inline API messages (consistent with ManagementRole) */}
        <div className="mb-4 space-y-2 max-w-4xl mx-auto">
          {apiSuccess && (
            <Message className="w-full" type="success">
              {apiSuccess}
            </Message>
          )}
          {apiError && (
            <Message className="w-full" type="error">
              {formatErrorMessage(apiError) || String(apiError)}
            </Message>
          )}
        </div>

        {error && (
          <div className="mb-4 text-red-600 break-words">{String(error)}</div>
        )}
        {loading && <div className="mb-4 text-gray-600"></div>}

        {/* Filters and Table in a shared container */}
        {/* Header with right-aligned stats */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Quản lý tài khoản </h1>
            <p className="text-sm text-gray-600">
              Quản lý tài khoản người dùng
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* SỬA ĐỔI KHỐI THỐNG KÊ */}
            <div className="rounded p-2 border bg-white shadow-sm flex items-center justify-between gap-3 min-w-[200px] h-25">
              {/* Khối chữ */}
              <div className="text-left space-y-0.5">
                <p className="text-sm text-gray-600">Tổng người dùng</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalElements}
                </p>
              </div>

              {/* Icon */}
              <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 ml-2">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 w-full md:w-2/3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm "
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 h-[42px] border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilterPopup(!showFilterPopup)}
                className={`flex items-center gap-2 px-4 h-[42px] border rounded transition
                  ${
                    showFilterPopup
                      ? "bg-blue-100 border-blue-400 text-blue-700"
                      : "bg-white hover:bg-blue-50"
                  }`}
              >
                <Filter className="w-5 h-5 text-gray-600" />
                Bộ lọc
              </button>

              {showFilterPopup && (
                <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg border rounded p-4 z-50 space-y-3">
                  <div>
                    <div className="flex w-full justify-end mb-2">
                      <button
                        onClick={handleResetFilters}
                        className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset
                      </button>
                    </div>

                    <label className="block text-gray-600 mb-1">Chức vụ</label>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="all">Tất cả chức vụ</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      {fetchStatus.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">
                      Giới tính
                    </label>
                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="all">Tất cả giới tính</option>
                      {fetchGender.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end mt-2"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-2/3 justify-end">
            {/* Add buttons */}
            <button
              onClick={() => {
                setFormData({
                  username: "",
                  fullName: "",
                  email: "",
                  phoneNumber: "",
                  identifyNumber: "",
                  gender: "MALE",
                  age: "",
                  address: "",
                  dateOfBirth: "",
                  role: "",
                  status: "ACTIVE",
                  password: "",
                });
                setShowAddModal(true);
              }}
              className={`flex items-center justify-center gap-2 px-4 h-[42px] font-semibold rounded transition-colors whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700`}
            >
              <Plus className="w-4 h-4" /> Thêm user
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className={`flex items-center justify-center gap-2 px-4 w-55 h-10 font-semibold rounded transition-colors whitespace-nowrap bg-green-600 text-white hover:bg-green-700`}
            >
              <Plus className="w-4 h-4" /> Thêm nhiều user
            </button>
          </div>
        </div>

        {/* TABLE MOVED INSIDE SAME CONTAINER */}
        {/* TABLE STYLE: Monitoring - Event Logs style */}
        {/* User table: scroll area + footer (footer luôn hiển thị dưới table) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md flex-1 flex flex-col w-full relative">
          {/* Scrollable table area */}
          <div
            className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]"
            ref={tableRef}
          >
            <table className="min-w-full table-auto">
              <thead>
                <tr className="sticky top-0 z-10 bg-[#f7fafd] border-b border-gray-200 text-[#004b8d] text-sm font-semibold">
                  <th className="px-4 py-3 text-left">STT</th>
                  <th className="px-4 py-3 text-left">Họ và tên</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">SĐT</th>
                  <th className="px-4 py-3 text-left">CCCD</th>
                  <th className="px-4 py-3 text-left">Chức vụ</th>
                  <th className="px-4 py-3 text-left">Giới tính</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      {loading ? "Đang tải..." : "Không tìm thấy user nào"}
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((u, idx) => {
                    const roleLabel = getRoleLabel(u.role);
                    const roleColor = getRoleColor(String(roleLabel));
                    return (
                      <tr
                        key={String(u.id)}
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition"
                      >
                        <td className="px-4 py-3 align-middle text-gray-900">
                          {page * PER_PAGE + idx + 1}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold">
                                {(u.fullName || "U").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {u.fullName}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {u.dateOfBirth || ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle text-gray-600">
                          {u.email}
                        </td>

                        <td className="px-4 py-3 align-middle text-gray-600">
                          {u.phoneNumber || "-"}
                        </td>

                        <td className="px-4 py-3 align-middle text-gray-600">
                          {u.identifyNumber || "-"}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColor}`}
                          >
                            {roleLabel}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-middle text-gray-600">
                          {u.gender || "-"}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                              String(u.status)?.toUpperCase() === "ACTIVE"
                                ? "bg-green-600"
                                : String(u.status)?.toUpperCase() ===
                                  "PENDING_VERIFICATION"
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }`}
                          >
                            {u.status || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openView(u)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => openEdit(u)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-full"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                              title={
                                isSelf(u)
                                  ? "Bạn không thể xóa chính mình"
                                  : "Xóa"
                              }
                              disabled={isSelf(u)}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>

                            {String(u.status).toUpperCase() ===
                            "PENDING_VERIFICATION" ? (
                              <button
                                onClick={() => promptResendUser(u)}
                                className="flex items-center gap-2 px-3 py-1 rounded text-xs font-medium border text-amber-800 border-amber-200 hover:bg-amber-50"
                                title="Gửi lại email xác thực"
                              >
                                <Mail className="w-4 h-4" />
                                Gửi lại
                              </button>
                            ) : String(u.status).toUpperCase() ===
                              "INACTIVE" ? (
                              <button
                                onClick={() => promptUnblockUser(u)}
                                className="px-3 py-1 rounded text-xs font-medium border text-green-700 border-green-200 hover:bg-green-50"
                                title={
                                  isSelf(u)
                                    ? "Bạn không thể kích hoạt chính mình"
                                    : "Bỏ chặn / Active"
                                }
                                disabled={isSelf(u)}
                              >
                                Active
                              </button>
                            ) : (
                              <button
                                onClick={() => promptInactiveUser(u)}
                                className="px-3 py-1 rounded text-xs font-medium border text-gray-700 border-gray-200 hover:bg-gray-50"
                                title={
                                  isSelf(u)
                                    ? "Bạn không thể thay đổi chính mình"
                                    : "Đặt về INACTIVE"
                                }
                                disabled={isSelf(u)}
                              >
                                Inactive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer always visible under table */}
          <div className="flex items-center justify-end px-6 py-3 bg-[#f7fafd] border-t border-gray-100">
            <div className="text-right text-gray-700 font-medium">
              Tổng số người dùng:{" "}
              <span className="font-bold">{totalElements}</span>
            </div>
          </div>
        </div>

        <br />
        {/* Pagination UI (sliding window 3 pages, auto-load next 100 when needed) */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (currentPage > 1) {
                  setPage(currentPage - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentPage <= 1}
              className="px-3 py-2 rounded border disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1">
              {(() => {
                const pages = [];
                const total = totalPagesCalc;
                const cur = currentPage;

                if (total <= 3) {
                  for (let i = 1; i <= total; i++) pages.push(i);
                } else {
                  let start = Math.max(1, cur - 1);
                  let end = Math.min(total, start + 2);

                  if (end - start < 2) {
                    start = Math.max(1, end - 2);
                  }

                  for (let i = start; i <= end; i++) pages.push(i);
                }

                // Refactored page change handler
                const handlePageChange = async (p) => {
                  const newIndex = p - 1;
                  const neededItems = (newIndex + 1) * PER_PAGE;
                  const loadedItems = users.length;

                  if (neededItems > loadedItems && hasMore && !loading) {
                    await fetchUsers(serverPagesLoaded, true);
                  }

                  setPage(newIndex);
                  if (tableRef.current) {
                    tableRef.current.scrollTop = 0;
                  }
                  window.scrollTo({ top: 0, behavior: "smooth" });
                };

                return pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`px-3 py-1 rounded border ${
                      p === cur
                        ? "bg-[#004b8d] text-white border-[#004b8d]"
                        : "bg-white text-[#004b8d] border-[#004b8d]"
                    }`}
                  >
                    {p}
                  </button>
                ));
              })()}
            </div>

            <button
              onClick={async () => {
                const totalPages = totalPagesCalc;
                const next = currentPage + 1;
                if (next > totalPages) return;

                const neededItems = next * PER_PAGE;
                const loadedItems = users.length;

                if (neededItems > loadedItems && hasMore && !loading) {
                  await fetchUsers(serverPagesLoaded, true);
                }

                setPage(next);
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              disabled={currentPage >= totalPagesCalc}
              className="px-3 py-2 rounded border disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modals for add/edit/view/delete/block/unblock (unchanged) */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[140vh] overflow-y-auto">
              <div className="sticky top-0 bg-blue-600 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-white">
                  {showAddModal ? "Thêm người dùng" : "Chỉnh sửa người dùng"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setErrors({});
                  }}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showAddModal && (
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        readOnly
                        disabled
                        onChange={() => {}}
                        className={`w-full px-4 py-2 border rounded border-gray-300 bg-gray-100 cursor-not-allowed`}
                        placeholder="Tự động lấy phần trước @gmail.com."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Nếu email là <code>someone@gmail.com</code>, hệ thống sẽ
                        tự điền <code>someone</code>.
                      </p>
                      {errors.username && (
                        <p className="text-red-500 mt-1">{errors.username}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded ${
                        errors.fullName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Nhập địa chỉ email"
                    />
                    {errors.email && (
                      <p className="text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 border rounded ${
                        errors.phoneNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      maxLength={15}
                      placeholder="Nhập số điện thoại (10-15 chữ số)"
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-500 mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Số CCCD</label>
                    <input
                      type="text"
                      name="identifyNumber"
                      value={formData.identifyNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          identifyNumber: e.target.value,
                        })
                      }
                      disabled={showEditModal}
                      className={`w-full px-4 py-2 border rounded ${
                        showEditModal
                          ? "bg-gray-100 cursor-not-allowed border-gray-300"
                          : "border-gray-300"
                      }`}
                      maxLength={12}
                      placeholder="Nhập 12 số CCCD"
                    />
                    {errors.identifyNumber && (
                      <p className="text-red-500 mt-1">
                        {errors.identifyNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Giới tính
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded border-gray-300"
                    >
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Tuổi</label>
                    <input
                      type="text"
                      value={
                        calculateAgeFromDate(formData.dateOfBirth) ||
                        formData.age ||
                        ""
                      }
                      readOnly
                      className="w-full px-4 py-2 border rounded border-gray-300 bg-gray-50"
                      placeholder="Tuổi sẽ được tính khi chọn ngày sinh"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Ngày sinh
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => {
                          const dob = e.target.value;
                          const age = calculateAgeFromDate(dob);
                          setFormData({
                            ...formData,
                            dateOfBirth: dob,
                            age: age, // keep stored age in state for submit
                          });
                        }}
                        className="w-full px-4 py-2 pr-10 border rounded border-gray-300"
                        placeholder="MM/DD/YYYY hoặc YYYY-MM-DD"
                      />
                      {errors.dateOfBirth && (
                        <p className="text-red-500 mt-1">
                          {errors.dateOfBirth}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Địa chỉ</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Nhập địa chỉ cư trú"
                    />
                    {errors.address && (
                      <p className="text-red-500 mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Chức vụ</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded border-gray-300"
                    >
                      <option value="">-- Chọn --</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                      {!roles.some(
                        (rr) => String(rr.name).toUpperCase() === "PATIENT"
                      ) && <option value="PATIENT">Bệnh nhân</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <p
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded border-gray-300"
                    >
                      {formData.status}
                    </p>
                  </div>

                  {String(formData.role).toUpperCase() !== "PATIENT" ? (
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 mb-2">
                        Mật khẩu{" "}
                        {showAddModal ? "" : "(không thể đổi khi chỉnh sửa)"}
                      </label>

                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => {
                          if (showAddModal) {
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            });
                          }
                        }}
                        disabled={!showAddModal}
                        className={`w-full px-4 py-2 border rounded ${
                          !showAddModal
                            ? "bg-gray-100 cursor-not-allowed border-gray-300"
                            : errors.password
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder={
                          showAddModal
                            ? "Nhập mật khẩu >=8 kí tự (số, chữ hoa, chữ thường)"
                            : "Không thể thay đổi mật khẩu ở chế độ chỉnh sửa"
                        }
                      />

                      {showAddModal && errors.password && (
                        <p className="text-red-500 mt-1">{errors.password}</p>
                      )}
                    </div>
                  ) : (
                    <div className="md:col-span-2 text-sm text-gray-500">
                      Đối với role <strong>PATIENT</strong>, mật khẩu có thể
                      được sinh tự động bởi hệ thống.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setErrors({});
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={showAddModal ? handleAdd : handleEdit}
                    className={`px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded`}
                  >
                    Lưu nhân viên
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-blue-600 border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-semibold text-white">
                  Chi tiết người dùng
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedUser(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {/* Avatar + Name + Role */}
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center shadow text-5xl mb-2">
                    <span className="text-blue-600">
                      {(selectedUser.fullName || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedUser.fullName}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                          String(getRoleLabel(selectedUser.role))
                        )}`}
                      >
                        {getRoleLabel(selectedUser.role)}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedUser.status &&
                          String(selectedUser.status).toUpperCase() === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedUser.status || "-"}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="rounded-lg border border-gray-200 bg-gray-20 p-4 flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">
                      Số điện thoại
                    </span>
                    <span className="text-gray-900 font-medium">
                      {selectedUser.phoneNumber || "-"}
                    </span>
                  </div>
                  {/* CCCD */}
                  <div className="rounded-lg border border-gray-200 bg-gray-20 p-4 flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">Số CCCD</span>
                    <span className="text-gray-900 font-medium">
                      {selectedUser.identifyNumber || "-"}
                    </span>
                  </div>
                  {/* Gender */}
                  <div className="rounded-lg border border-gray-200 bg-gray-20 p-4 flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">
                      Giới tính
                    </span>
                    <span className="text-gray-900 font-medium">
                      {selectedUser.gender || "-"}
                    </span>
                  </div>
                  {/* Ngày sinh */}
                  <div className="rounded-lg border border-gray-200 bg-gray-20 p-4 flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">
                      Ngày sinh
                    </span>
                    <span className="text-gray-900 font-medium">
                      {selectedUser.dateOfBirth || "-"}
                    </span>
                  </div>
                  {/* Tuổi */}
                  <div className="rounded-lg border border-gray-200 bg-gray-20 p-4 flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">Tuổi</span>
                    <span className="text-gray-900 font-medium">
                      {selectedUser.age || "-"} tuổi
                    </span>
                  </div>
                  {/* Ngày tạo */}
                  <div className="rounded-lg border border-gray-200 bg-gray-20 p-4 flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">Ngày tạo</span>
                    <span className="text-gray-900 font-medium">
                      {formatDateSafe(selectedUser.createdAt)}
                    </span>
                  </div>
                  {/* Địa chỉ (full col) */}
                  <div className="md:col-span-2 rounded-lg border border-gray-200 bg-gray-20 p-4 flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">Địa chỉ</span>
                    <span className="text-gray-900 font-medium">
                      {selectedUser.address || "-"}
                    </span>
                  </div>
                </div>

                {/* Button Chỉnh sửa */}
                <div className="flex flex-col items-center mt-8">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      if (selectedUser) openEdit(selectedUser);
                    }}
                    className="w-full max-w-xs px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-semibold shadow"
                  >
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded shadow-xl max-w-md w-full">
              <div className="px-6 py-4 bg-red-600 rounded">
                <h2 className="text-white">Xác nhận xóa</h2>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn xóa{" "}
                  <span className="text-gray-900">{selectedUser.fullName}</span>
                  ?
                </p>
                <p className="text-red-600 mb-4">
                  Hành động này không thể hoàn tác!
                </p>
              </div>

              <div className="px-6 py-4 bg-white flex justify-end gap-3 rounded">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded disabled:bg-red-300"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {showBlockModal && userToBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded w-full max-w-md">
              <div className="px-5 py-3 bg-red-600 rounded">
                <h2 className="text-white">Xác nhận chặn người dùng</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn chặn người dùng{" "}
                  <strong className="text-gray-900">
                    {userToBlock.fullName || userToBlock.username}
                  </strong>
                  ? Người dùng sẽ bị chuyển sang trạng thái{" "}
                  <strong>BLOCKED</strong>.
                </p>
                <p className="text-sm text-gray-500">
                  Hành động này có thể được hoàn tác bởi quản trị viên thông qua
                  tính năng enable.
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setUserToBlock(null);
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmBlock}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Chặn
                </button>
              </div>
            </div>
          </div>
        )}
        {showResendModalConfirm && userToResend && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded w-full max-w-md">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg">Xác nhận gửi lại email xác thực</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-2">
                  Bạn sắp gửi lại email xác thực cho người dùng{" "}
                  <strong className="text-gray-900">
                    {userToResend.fullName ||
                      userToResend.username ||
                      userToResend.email}
                  </strong>
                  .
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Email sẽ chỉ được gửi nếu người dùng đang ở trạng thái{" "}
                  <strong>PENDING_VERIFICATION</strong>.
                </p>

                {/* Hiển thị API message inline nếu có */}
                {apiSuccess && (
                  <div className="mt-3 p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">
                    {apiSuccess}
                  </div>
                )}
                {apiError && (
                  <div className="mt-3 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                    {formatErrorMessage(apiError)}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded">
                <button
                  onClick={() => {
                    setShowResendModalConfirm(false);
                    setUserToResend(null);
                  }}
                  className="px-4 py-2 border rounded"
                  disabled={resendLoading}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmResend}
                  className="px-4 py-2 bg-amber-500 text-white rounded"
                >
                  {resendLoading ? "Đang gửi..." : "Gửi lại email"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showUnblockModal && userToUnblock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded w-full max-w-md">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg">Xác nhận bỏ chặn người dùng</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-2">
                  Bạn có chắc chắn muốn bỏ chặn người dùng{" "}
                  <strong className="text-gray-900">
                    {userToUnblock.fullName || userToUnblock.username}
                  </strong>
                  ? Người dùng sẽ được chuyển sang trạng thái{" "}
                  <strong>ACTIVE</strong>.
                </p>
                <p className="text-sm text-gray-500">
                  Hành động này có thể được hoàn tác bởi quản trị viên thông qua
                  tính năng disable.
                </p>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
                  Bạn không có quyền thực hiện hành động này.
                </div>
                x
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded">
                <button
                  onClick={() => {
                    setShowUnblockModal(false);
                    setUserToUnblock(null);
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmActive}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Bỏ chặn
                </button>
              </div>
            </div>
          </div>
        )}
        {showUploadModal && (
          <UploadUsers
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
          />
        )}
      </main>
    </div>
  );
};

export default ManagementUser;
