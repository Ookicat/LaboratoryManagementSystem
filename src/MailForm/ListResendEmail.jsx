import React, { useEffect, useState, useRef } from "react";
import api from "../API/Axios";
import Message, { formatErrorMessage } from "../components/Message";
import { showSuccess, showError, showWarning } from "../components/Toast";
import Sidebar from "../components/SideBar";

export default function ListResendEmail() {
  const SERVER_PAGE_SIZE = 200;
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [batchSummary, setBatchSummary] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchPendingUsers();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch only users with status = PENDING_VERIFICATION
  const fetchPendingUsers = async () => {
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const params = {
        page: 0,
        size: SERVER_PAGE_SIZE,
        sort: "fullName,asc",
        status: "PENDING_VERIFICATION",
      };
      const res = await api.get("/users/", { params });

      const root = res.data;
      const maybe = root && root.data ? root.data : root;
      let content = [];

      if (maybe && Array.isArray(maybe.content)) {
        content = maybe.content;
      } else if (Array.isArray(maybe)) {
        content = maybe;
      } else if (root && Array.isArray(root.content)) {
        content = root.content;
      }

      if (mountedRef.current) {
        setUsers(Array.isArray(content) ? content : []);
        setFiltered(Array.isArray(content) ? content : []);
        setSelectedIds(new Set());
        setSelectAllChecked(false);
      }
    } catch (err) {
      console.error("Lỗi khi lấy users PENDING_VERIFICATION:", err);
      const resp = err?.response?.data ?? err?.response ?? null;
      const message =
        formatErrorMessage(resp) || "Lỗi khi lấy danh sách người dùng";
      setApiError(message);
      showError(message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) {
      setFiltered(users);
      setSelectAllChecked(false);
      setSelectedIds(new Set());
      return;
    }
    const f = users.filter((u) => {
      const name = (u.fullName || u.username || "").toString().toLowerCase();
      const email = u.email.toString().toLowerCase();
      const cccd = u.identifyNumber;
      return name.includes(q) || email.includes(q) || cccd.includes(q);
    });
    setFiltered(f);
    // Uncheck select all if filtered subset changes
    setSelectAllChecked(false);
    setSelectedIds(new Set());
  }, [search, users]);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(String(id))) s.delete(String(id));
      else s.add(String(id));
      setSelectAllChecked(false);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selectAllChecked) {
      // uncheck
      setSelectedIds(new Set());
      setSelectAllChecked(false);
    } else {
      // select all visible (filtered)
      const all = new Set(filtered.map((u) => String(u.id)));
      setSelectedIds(all);
      setSelectAllChecked(true);
    }
  };

  const openConfirm = () => {
    if (!selectedIds || selectedIds.size === 0) {
      showWarning("Vui lòng chọn tối thiểu 1 người dùng để gửi lại email.");
      return;
    }
    const sample = Array.from(selectedIds).slice(0, 6);
    setBatchSummary({ count: selectedIds.size, sample });
    setShowConfirmModal(true);
  };

  const confirmSend = async () => {
    const ids = Array.from(selectedIds)
      .map((s) => Number(s))
      .filter(Boolean);
    if (!ids.length) {
      showWarning("Danh sách ID không hợp lệ.");
      setShowConfirmModal(false);
      return;
    }

    setSending(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      // backend expects: { userIds: [...] }
      const res = await api.post("/users/resend-verification-batch", {
        userIds: ids,
      });
      const data = res?.data;
      // server may return BatchProcessSummary or { message }
      const successMsg =
        data?.message || `Đã gửi lại email tới ${ids.length} người dùng.`;
      setApiSuccess(successMsg);
      showSuccess(successMsg);

      // optional: show details from batch summary if returned
      if (
        data &&
        typeof data === "object" &&
        (data.totalProcessed || data.successCount || data.failures)
      ) {
        // keep server summary in state for display if desired
        setBatchSummary((prev) => ({ ...prev, serverSummary: data }));
      }

      // refresh pending users list (they might now be active)
      await fetchPendingUsers();
    } catch (err) {
      console.error("Lỗi khi gửi theo lô:", err);
      const resp = err?.response?.data ?? err?.response ?? err;
      const message =
        formatErrorMessage(resp) || "Lỗi khi gửi lại email theo lô";
      setApiError(message);
      showError(message);
    } finally {
      setSending(false);
      setShowConfirmModal(false);
    }
  };

  return (
    // FIX LAYOUT: Dùng Flexbox + h-screen + overflow-hidden
    <div className="flex bg-gray-50 w-full h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content: overflow-hidden để chỉ scroll phần bảng */}
      <main className="flex-1 flex flex-col h-full overflow-hidden px-6 py-6 relative">
        <div className="flex flex-col gap-2 mb-6 flex-shrink-0">
          <div className="flex items-start">
            <div className="ml-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Gửi lại email xác thực
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Quản lý danh sách người dùng đang chờ xác thực email
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar (flex-shrink-0 để không bị co) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 flex-shrink-0">
          {/* Search */}
          <div className="flex items-center gap-4 w-md md:w-1/3 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400"></i>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email hoặc CCCD..."
              className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Filter + Buttons */}
          <div className="flex items-center gap-3">
            {/* Nút làm mới */}
            <button
              onClick={() => fetchPendingUsers()}
              disabled={loading}
              className={`px-4 py-2.5 rounded text-sm font-medium flex items-center gap-2 transition-all ${
                loading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <i
                className={`fa-solid fa-arrows-rotate ${
                  loading ? "fa-spin" : ""
                }`}
              ></i>
              Làm mới
            </button>

            {/* Gửi lại */}
            <button
              onClick={openConfirm}
              disabled={sending || selectedIds.size === 0}
              className={`px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2 transition-all ${
                sending || selectedIds.size === 0
                  ? "bg-blue-300 text-white cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <i className="fa-solid fa-paper-plane"></i>
              {sending ? "Đang gửi..." : `Gửi lại (${selectedIds.size})`}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="mb-2 flex-shrink-0">
          {apiSuccess && <Message error={null}>{apiSuccess}</Message>}
          {apiError && <Message error={apiError} />}
        </div>

        {/* Table Container - FIX: flex-1 để chiếm hết chiều cao còn lại */}
        <div className="flex-1 overflow-y-auto bg-white rounded-t border border-gray-200 border-b-0 min-h-0 shadow-sm relative">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                </th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">CCCD</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    {loading
                      ? "Đang tải..."
                      : "Không có người dùng chờ xác minh."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const idStr = String(u.id);
                  const checked = selectedIds.has(idStr);
                  const roleName =
                    (u.role && (u.role.name || u.role)) || u.role || "";
                  return (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 align-top">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRow(u.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="p-3 align-top">{u.fullName || "-"}</td>
                      <td className="p-3 align-top">{u.email || "-"}</td>
                      <td className="p-3 align-top">
                        {u.identifyNumber || "-"}
                      </td>
                      <td className="p-3 align-top">{roleName}</td>
                      <td
                        className={`p-3 align-top font-medium ${
                          u.status === "ACTIVE"
                            ? "text-green-700"
                            : u.status === "DELETED"
                            ? "text-red-700"
                            : "text-gray-600"
                        }`}
                      >
                        {u.status}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer (flex-shrink-0) - Đặt cố định ở dưới bảng */}
        <div className="p-4 border border-t bg-gray-50 text-sm text-gray-700 flex justify-between w-full rounded-b-xl shadow-sm flex-shrink-0">
          <div>{selectedIds.size} đã chọn</div>
          <div className="text-right">Tổng số: {users.length}</div>
        </div>

        {/* Confirm modal */}
        {showConfirmModal && batchSummary && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Xác nhận gửi lại email</h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700 mb-3">
                  Bạn sắp gửi lại email xác thực cho{" "}
                  <strong>{batchSummary.count}</strong> người dùng.
                </p>

                <div className="text-xs text-gray-600 mb-4">
                  Ví dụ ID: {batchSummary.sample.join(", ")}
                  {batchSummary.count > batchSummary.sample.length
                    ? `, ...`
                    : ""}
                </div>

                {batchSummary.serverSummary && (
                  <pre className="bg-gray-50 p-3 rounded text-xs text-gray-700 mb-4">
                    {JSON.stringify(batchSummary.serverSummary, null, 2)}
                  </pre>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmSend}
                    disabled={sending}
                    className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:bg-amber-300"
                  >
                    {sending ? "Đang gửi..." : "Xác nhận gửi"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
