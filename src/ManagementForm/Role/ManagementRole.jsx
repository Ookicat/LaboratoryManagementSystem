import React, { useEffect, useState, useRef  } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Info,
  Settings,
  AlertTriangle,
  Eye,
} from "lucide-react";
import api from "../../API/Axios";
import Sidebar from "../../components/SideBar";
import { showError, showWarning, showSuccess } from "../../components/Toast";
import Message, { formatErrorMessage } from "../../components/Message";

// --- UTILS & MINI COMPONENTS ---

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Button({
  children,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  type = "button",
  onClick,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded !mr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "hover:bg-blue-600",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    destructive: "bg-red-500 text-white hover:bg-red-600",
  };
  const sizes = {
    default: "h-9 !px-4 !py-3 text-sm",
    sm: "h-8 px-3 text-sm",
    icon: "h-9 w-9",
  };

  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function Label({ children, className = "", htmlFor, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    >
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "!relative !inline-flex !h-6 !w-12 !items-center !rounded-full !transition-colors !focus-visible:outline-none !focus-visible:ring-2 !focus-visible:ring-blue-400 !focus-visible:ring-offset-2 !disabled:cursor-not-allowed !disabled:opacity-50",
        checked ? "bg-blue-600" : "bg-gray-300"
      )}
    >
      <span
        className={cn(
          "relative z-10 inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-blue-100 text-blue-700",
    secondary: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// --- HELPER FUNCTIONS ---

function categorizePrivilegeName(name = "") {
  if (!name) return "Khác";
  const n = name.toUpperCase();
  if (n.includes("_USER") || n.endsWith("USER") || n.includes("USER"))
    return "Người dùng";
  if (n.includes("_ROLE") || n.endsWith("ROLE") || n.includes("ROLE"))
    return "Vai trò";
  if (
    n.includes("_CONFIG") ||
    n.includes("CONFIGURATION") ||
    n.includes("CONFIG")
  )
    return "Cấu hình";
  if (n.includes("REAGENT")) return "Reagents";
  if (n.includes("INSTRUMENT")) return "Thiết bị";
  if (n.includes("TEST_ORDER") || n.includes("TESTORDER"))
    return "Yêu cầu xét nghiệm";
  if (n.includes("COMMENT")) return "Bình luận";
  if (n.includes("EVENT_LOG")) return "Nhật ký";
  if (n.includes("BLOOD") || n.includes("EXECUTE_BLOOD")) return "Xét nghiệm";
  if (n.includes("PERSONAL_TEST_RESULT") || n.includes("PERSONAL"))
    return "Bệnh nhân";
  if (n.includes("VIEW") && n.includes("INSTRUMENT")) return "Thiết bị";
  return "Khác";
}

function groupedPermissionsHelper(allPermissions = [], roles = []) {
  const groups = (allPermissions || []).reduce((acc, permission) => {
    const category =
      permission.category || categorizePrivilegeName(permission.name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {});

  // sort permissions inside each group by name
  Object.keys(groups).forEach((cat) => {
    groups[cat].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  });

  // order categories by number of permissions (desc)
  const ordered = {};
  Object.entries(groups)
    .sort(([, aPerms], [, bPerms]) => bPerms.length - aPerms.length)
    .forEach(([cat, perms]) => {
      ordered[cat] = perms;
    });

  return ordered;
}

// --- MAIN COMPONENT ---

export default function ManagementRole() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const tableRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRole, setSelectedRole] = useState(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const [formData, setFormData] = useState({ name: "", permissions: [] });
  const [errors, setErrors] = useState({ name: "" });
  const [openCategories, setOpenCategories] = useState(new Set());

  function clearMessages() {
    setApiError(null);
    setApiSuccess(null);
    setError(null);
  }

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    clearMessages();
    try {
      try {
        const permRes = await api.get("/roles/privileges");
        const permData = Array.isArray(permRes?.data)
          ? permRes.data
          : Array.isArray(permRes?.data?.data)
          ? permRes.data.data
          : [];
        setAllPermissions(Array.isArray(permData) ? permData : []);
      } catch (permErr) {
        const srv = permErr?.response?.data ?? permErr?.response ?? permErr;
        const msg =
          formatErrorMessage(srv) || permErr.message || String(permErr);
        setApiError(srv ?? msg);
        setError(msg);
        setAllPermissions([]);
        showError(msg);
      }

      try {
        const rolesRes = await api.get("/roles/");
        const payload = rolesRes?.data ?? {};
        const rolesData = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.content)
          ? payload.content
          : [];
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (rolesErr) {
        const srv = rolesErr?.response?.data ?? rolesErr?.response ?? rolesErr;
        const msg =
          formatErrorMessage(srv) || rolesErr.message || String(rolesErr);
        setApiError(srv ?? msg);
        setError(msg);
        setRoles([]);
        showError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateRole = () => {
    clearMessages();
    setModalMode("create");
    setFormData({ name: "", permissions: [] });
    setErrors({ name: "" });
    setSelectedRole(null);
    setOpenCategories(new Set());
    setShowModal(true);
  };

  const handleEditRole = (role) => {
    clearMessages();
    if (role.isSystem) {
      showWarning("Không thể chỉnh sửa vai trò hệ thống!");
      return;
    }
    setModalMode("edit");
    setSelectedRole(role);

    const namesSet = new Set(
      Array.isArray(role.privileges)
        ? role.privileges.map((p) => String(p))
        : []
    );
    const matchedIds = (allPermissions || [])
      .filter((perm) => namesSet.has(perm.name))
      .map((perm) => perm.id);

    setFormData({
      name: role.name || "",
      permissions: matchedIds,
    });
    setErrors({ name: "" });

    const initialOpen = new Set();
    Object.entries(groupedPermissionsHelper(allPermissions, roles)).forEach(
      ([cat, perms]) => {
        if (perms.some((p) => matchedIds.includes(p.id))) initialOpen.add(cat);
      }
    );
    setOpenCategories(initialOpen);
    setShowModal(true);
  };

  const toggleCategory = (category) => {
    setOpenCategories((prev) => {
      const s = new Set(prev);
      if (s.has(category)) s.delete(category);
      else s.add(category);
      return s;
    });
  };

  const handleDeleteRole = (role) => {
    clearMessages();
    if (role.isSystem) {
      showWarning("Không thể xóa vai trò hệ thống!");
      return;
    }
    const customRolesCount = (roles || []).filter((r) => !r.isSystem).length;
    if (customRolesCount <= 1) {
      showWarning(
        "Không thể xóa vai trò cuối cùng. Vui lòng tạo thêm một vai trò khác trước khi xóa."
      );
      return;
    }
    setRoleToDelete(role);
    setShowDeleteDialog(true);
  };

  const validateForm = () => {
    const newErrors = { name: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Tên vai trò không được để trống";
      isValid = false;
    } else if (formData.name.length < 3) {
      newErrors.name = "Tên vai trò phải có ít nhất 3 ký tự";
      isValid = false;
    }

    const dup = roles.some(
      (r) =>
        r.name?.toLowerCase() === formData.name.toLowerCase() &&
        r.id !== selectedRole?.id
    );
    if (dup) {
      newErrors.name = "Tên vai trò đã tồn tại";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSaveRole = async () => {
    if (!validateForm()) return;
    setLoading(true);
    clearMessages();

    try {
      let privilegeIds = (formData.permissions || [])
        .map((id) =>
          id === null || id === undefined || id === "" ? null : Number(id)
        )
        .filter((id) => id !== null && !Number.isNaN(id));

      const getDefaultReadOnlyPrivilegeId = () => {
        if (Array.isArray(allPermissions) && allPermissions.length > 0) {
          const found = allPermissions.find(
            (p) => p && p.name && p.name.toUpperCase().includes("READ")
          );
          if (found && found.id != null) return Number(found.id);
        }
        return 1;
      };

      if (privilegeIds.length === 0) {
        const defaultId = getDefaultReadOnlyPrivilegeId();
        privilegeIds = [defaultId];
      }

      const payload = {
        name: formData.name,
        privilegeIds: privilegeIds,
      };

      if (modalMode === "create") {
        const res = await api.post("/roles/", payload);
        const srv = res?.data ?? res;
        const successMsg =
          typeof srv === "string"
            ? srv
            : srv?.message || "Tạo vai trò thành công";
        setApiSuccess(successMsg);
        showSuccess(successMsg);
        await fetchAll();
      } else if (modalMode === "edit" && selectedRole) {
        try {
          const res = await api.patch(`/roles/${selectedRole.id}`, payload);
          const srv = res?.data ?? res;
          const successMsg =
            typeof srv === "string"
              ? srv
              : srv?.message || "Cập nhật vai trò thành công";
          setApiSuccess(successMsg);
          showSuccess(successMsg);
        } catch (putErr) {
          const srv = putErr?.response?.data ?? putErr?.response ?? putErr;
          const msg =
            formatErrorMessage(srv) ||
            putErr.message ||
            "Lỗi khi cập nhật vai trò";
          setApiError(srv ?? msg);
          setError(msg);
          showError(msg);
          return;
        }
        await fetchAll();
      }

      setShowModal(false);
      setSelectedRole(null);
    } catch (err) {
      const srv = err?.response?.data ?? err?.response ?? err;
      const message =
        formatErrorMessage(srv) || err.message || "Lỗi khi lưu vai trò";
      setApiError(srv ?? message);
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    clearMessages();

    try {
      if (!roleToDelete) return;
      await api.delete(`/roles/${roleToDelete.id}`);
      const successMsg = "Xóa vai trò thành công";
      setApiSuccess(successMsg);
      showSuccess(successMsg);
      await fetchAll();
      setShowDeleteDialog(false);
      setRoleToDelete(null);
    } catch (err) {
      const srv = err?.response?.data ?? err?.response ?? err;
      const msg =
        formatErrorMessage(srv) || err.message || "Lỗi khi xóa vai trò";
      setApiError(srv ?? msg);
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleSelectAllInCategory = (category, select) => {
    const gp = groupedPermissionsHelper(allPermissions, roles);
    const categoryPermissions = (gp[category] || []).map((p) => p.id);
    setFormData((prev) => ({
      ...prev,
      permissions: select
        ? Array.from(new Set([...prev.permissions, ...categoryPermissions]))
        : prev.permissions.filter((p) => !categoryPermissions.includes(p)),
    }));
  };

  const isCategoryFullySelected = (category) => {
    const gp = groupedPermissionsHelper(allPermissions, roles);
    const categoryPermissions = (gp[category] || []).map((p) => p.id);
    return categoryPermissions.every((p) => formData.permissions.includes(p));
  };

  // groupedPermissions sorted by category size (many -> few)
  const groupedPermissions = groupedPermissionsHelper(allPermissions, roles);

  // roles sorted by number of privileges (many -> few) for display
  const sortedRoles = [...(roles || [])].sort((a, b) => {
    const countA = Array.isArray(a.privileges)
      ? a.privileges.length
      : a.privileges
      ? 1
      : 0;
    const countB = Array.isArray(b.privileges)
      ? b.privileges.length
      : b.privileges
      ? 1
      : 0;
    return countB - countA;
  });

  return (
    // FIX 1: Dùng h-screen và overflow-hidden ở wrapper ngoài cùng để khóa chiều cao màn hình
    <div className="flex bg-gray-50 w-full h-screen overflow-hidden">
      {/* Sidebar: Giữ nguyên, thêm flex-shrink-0 để không bị co lại */}
      <Sidebar className="flex-shrink-0 transition-all duration-300" />

      {/* FIX 2: 
          - min-w-0: QUAN TRỌNG NHẤT, giúp flex item co lại đúng cách khi nội dung bên trong quá rộng.
          - overflow-y-auto: Chỉ cuộn nội dung bên trong main.
          - h-full: Chiếm hết chiều cao còn lại.
      */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 relative">
        {/* --- KHỐI BAO CHUNG --- */}
        <div className="bg-white shadow rounded-lg w-full flex flex-col">
          {/* Header Section */}
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Quản lý vai trò
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Quản lý vai trò và cấp quyền người dùng
              </p>
            </div>

            {/* FIX 3: Thêm flex-wrap để các thẻ thống kê tự xuống dòng nếu màn hình bé */}
            <div className="flex flex-wrap items-center gap-3 lg:ml-auto w-full lg:w-auto">
              {/* Thẻ 1: Tổng số vai trò */}
              <div className="rounded-xl p-3 border bg-white shadow-sm flex items-center justify-between gap-3 flex-1 min-w-[200px]">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm text-gray-600">Tổng số vai trò</p>
                  <p className="text-2xl font-bold">{roles.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              {/* Thẻ 2: Tổng quyền */}
              <div className="rounded-xl p-3 border bg-white shadow-sm flex items-center justify-between gap-3 flex-1 min-w-[200px]">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm text-gray-600">Tổng quyền</p>
                  <p className="text-2xl font-bold">{allPermissions.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">

            <div className="mb-4 space-y-2 max-w-4xl">
              {apiSuccess && (
                <Message className="w-full" type="success">
                  {apiSuccess}
                </Message>
              )}
              {apiError && (
                <Message className="w-full" type="error">
                  {formatErrorMessage(apiError)}
                </Message>
              )}
            </div>

            <div className="flex items-center justify-end gap-1 mb-4">
              <Button
                className="rounded-lg shadow-sm !px-4 !py-2 bg-blue-600 hover:bg-blue-700 text-white transition-all"
                onClick={handleCreateRole}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm vai trò
              </Button>
            </div>

            {/* Bảng dữ liệu - Table giống user table, header sticky, body scrollable */}
           {/* Roles table: scroll area + footer (footer luôn hiển thị dưới table) */}
<div className="bg-white rounded-xl border border-gray-200 shadow-md flex flex-col w-full relative">
  {/* Scrollable table area */}
  <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]" ref={tableRef}>
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-[#f7fafd] sticky top-0 z-10">
        <tr className="text-[#004b8d] text-sm font-semibold border-b border-gray-200">
          <th className="px-6 py-4 text-left">Vai trò</th>
          <th className="px-6 py-4 text-center">Số quyền</th>
          <th className="px-6 py-4 text-center">Thao tác</th>
        </tr>
      </thead>

      <tbody className="bg-white divide-y divide-gray-200">
        {sortedRoles.length === 0 && !loading ? (
          <tr>
            <td
              colSpan={3}
              className="px-6 py-12 text-center text-sm text-gray-500 flex flex-col items-center justify-center"
            >
              <div className="mb-2 bg-gray-100 p-3 rounded-full">
                <Info className="h-6 w-6 text-gray-400" />
              </div>
              Không có vai trò nào
            </td>
          </tr>
        ) : (
          sortedRoles.map((role) => (
            <tr
              key={role.id}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{role.name}</span>
                  {[
                    "ADMIN",
                    "MANAGER",
                    "SERVICE",
                    "LAB_USER",
                    "PATIENT",
                    "VIEWER",
                  ].includes(role.name) && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Default
                    </Badge>
                  )}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-center">
                <Badge
                  variant="default"
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  {Array.isArray(role.privileges)
                    ? role.privileges.length
                    : role.privileges
                    ? 1
                    : 0}{" "}
                  quyền
                </Badge>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div className="flex items-center justify-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditRole(role)}
                    className="h-8 w-8 text-blue-600 hover:text-white hover:bg-blue-600 rounded-full transition"
                    title="Chỉnh sửa"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRole(role)}
                    disabled={
                      role.isSystem ||
                      [
                        "ADMIN",
                        "MANAGER",
                        "SERVICE",
                        "LAB_USER",
                        "PATIENT",
                        "VIEWER",
                      ].includes(role.name)
                    }
                    className="h-8 w-8 text-red-600 hover:text-white hover:bg-red-600 rounded-full transition"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  {/* Footer luôn nằm dưới table, không scroll */}
  <div className="flex items-center justify-end px-6 py-3 bg-[#f7fafd] border-t border-gray-100">
    <div className="text-right text-gray-700 font-medium">
      Tổng số vai trò: <span className="font-bold">{roles.length}</span>
    </div>
  </div>
</div>

          </div>
        </div>
      </main>

      {/* --- MODAL CREATE/EDIT --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-blue-600 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {modalMode === "create"
                  ? "Thêm vai trò mới"
                  : "Chỉnh sửa vai trò"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-blue-800 transition rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nội dung */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {/* Input tên vai trò */}
                <div>
                  <Label
                    htmlFor="roleName"
                    className="mb-1 block text-gray-700"
                  >
                    Tên vai trò <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="roleName"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nhập tên vai trò"
                    className="mt-1"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Phân quyền */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-gray-700">Phân quyền</Label>
                    <span className="text-xs text-gray-500">
                      Đã chọn:{" "}
                      <span className="font-semibold text-blue-700">
                        {formData.permissions.length}
                      </span>
                      /{allPermissions.length}
                    </span>
                  </div>

                  {/* Ghi chú */}
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-3 mb-4 flex items-start gap-2.5 text-sm">
                    <Info className="h-5 w-5 mt-0.5 text-blue-500 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Ghi chú:</span>
                      <span className="block text-xs text-blue-900 mt-0.5">
                        Nếu không chọn quyền nào, vai trò sẽ được gán mặc định{" "}
                        <b>READ_ONLY</b>. Bạn có thể chọn quyền sau khi tạo.
                      </span>
                    </div>
                  </div>

                  {/* Danh sách quyền nhóm dạng collapsible card */}
                  <div className="space-y-3">
                    {Object.entries(groupedPermissions).length === 0 ? (
                      <div className="text-sm text-gray-500">
                        Không có permission từ server
                      </div>
                    ) : (
                      Object.entries(groupedPermissions).map(
                        ([category, permissions]) => (
                          <div
                            key={category}
                            className="rounded-xl border border-gray-100 bg-gray-50/70 shadow-sm transition hover:shadow-md"
                          >
                            {/* Card header */}
                            <div
                              className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none group"
                              onClick={() => toggleCategory(category)}
                              style={{ userSelect: "none" }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-800">
                                  {category}
                                </span>
                                <span className="bg-gray-200 text-gray-700 font-semibold text-xs rounded px-2 py-0.5 ml-1">
                                  {
                                    permissions.filter((p) =>
                                      formData.permissions.includes(p.id)
                                    ).length
                                  }
                                  /{permissions.length}
                                </span>
                                {!openCategories.has(category) &&
                                  (() => {
                                    const sel = permissions.filter((p) =>
                                      formData.permissions.includes(p.id)
                                    );
                                    if (sel.length === 0) return null;
                                    const preview = sel
                                      .slice(0, 2)
                                      .map((p) => p.name)
                                      .join(", ");
                                    return (
                                      <span className="text-xs text-gray-500 ml-2">
                                        {preview}
                                        {sel.length > 2
                                          ? ` +${sel.length - 2}`
                                          : ""}
                                      </span>
                                    );
                                  })()}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="!px-2 !py-1 text-blue-600 hover:bg-gray-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectAllInCategory(
                                      category,
                                      !isCategoryFullySelected(category)
                                    );
                                  }}
                                >
                                  {isCategoryFullySelected(category)
                                    ? "Bỏ chọn tất cả"
                                    : "Chọn tất cả"}
                                </Button>
                                <span className="ml-1">
                                  {openCategories.has(category) ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition" />
                                  )}
                                </span>
                              </div>
                            </div>
                            {/* Card content */}
                            {openCategories.has(category) && (
                              <div className="bg-white border-t border-gray-100">
                                {permissions.map((permission, idx) => (
                                  <div
                                    key={permission.id}
                                    className={cn(
                                      "flex items-center justify-between px-5 py-3 transition group",
                                      idx !== permissions.length - 1 &&
                                        "border-b border-gray-100",
                                      "hover:bg-blue-50"
                                    )}
                                  >
                                    <div className="flex-1">
                                      <span className="font-medium text-sm text-gray-800">
                                        {permission.name}
                                      </span>
                                      {permission.description && (
                                        <span className="block text-xs text-gray-500 mt-0.5">
                                          {permission.description}
                                        </span>
                                      )}
                                    </div>
                                    <Toggle
                                      checked={formData.permissions.includes(
                                        permission.id
                                      )}
                                      onChange={() =>
                                        handleTogglePermission(permission.id)
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                className="!px-5 !py-2 text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-700"
                onClick={() => setShowModal(false)}
              >
                Hủy
              </Button>
              <Button
                className="!px-5 !py-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveRole}
              >
                <Save className="h-4 w-4 mr-2" />
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {showDeleteDialog && roleToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg">Xác nhận xóa vai trò</h2>
                  <p className="text-sm text-gray-600">
                    Bạn có chắc chắn muốn xóa vai trò này?
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Vai trò:</strong> {roleToDelete.name}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-800">
                  <strong>Lưu ý:</strong> Sau khi xóa, các người dùng có vai trò
                  này sẽ không còn quyền truy cập tương ứng. Hãy đảm bảo gán lại
                  vai trò phù hợp cho họ.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Hủy
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa vai trò
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
