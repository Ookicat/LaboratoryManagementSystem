import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/SideBar";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
  Loader2,
  Filter,
  RotateCcw,
  AlertCircle,
  Search,
} from "lucide-react";
import api from "../../API/Axios";
import { showError, showWarning, showSuccess } from "../../components/Toast";
// import AddDevice from "./AddDevice";
// import ViewDevice from "./ViewDevice";
// import EditDevice from "./EditDevice";

export default function ManagementDevice() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewDevice, setViewDevice] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const DEVICE_TYPES = ["computer", "printer", "measuring", "other"];
  const DEVICE_STATUS = ["ACTIVE", "MAINTENANCE", "BROKEN", "INACTIVE"];

  const handleResetFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setShowFilterPopup(false);
  };

  const fetchDevices = async (page = 0) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await api.get("/devices", {
        params: {
          page,
          size: pageSize,
          keyword: keyword || undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          sort: "createdAt,desc",
        },
      });
      const data = response.data;
      setDevices(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      const errorData = err?.response?.data || err;
      setApiError(errorData);
      showError(errorData.message || "Lỗi khi lấy dữ liệu thiết bị");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDevices(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, typeFilter, statusFilter]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) fetchDevices(newPage);
  };

  const handleDelete = (device) => {
    setDeviceToDelete(device);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deviceToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/devices/${deviceToDelete.id}`);
      showSuccess(`Đã xóa thành công thiết bị "${deviceToDelete.name}"`);
      setShowDeleteModal(false);
      setDeviceToDelete(null);
      fetchDevices(currentPage);
    } catch (err) {
      const errorData = err?.response?.data || err;
      setApiError(errorData);
      showError(errorData.message || "Lỗi khi xóa thiết bị");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeviceToDelete(null);
  };

  const stats = [
    {
      label: "Tổng thiết bị",
      totalElements,
      icon: <Plus className="w-6 h-6 text-blue-500" />,
      color: "from-blue-500 to-blue-400",
    },
  ];

  const filtered = useMemo(() => devices, [devices]);

  return (
    <div className="bg-gray-50 p-4 rounded-xl shadow-md border border-white-200 min-h-screen">
      <aside className="w-64 fixed top-0 left-0 h-screen bg-white shadow-lg overflow-y-auto">
        <Sidebar />
      </aside>
      <div className="ml-64 flex-1 bg-white p-4 pt-3 border rounded border-white-200 min-h-screen">
        {apiError && (
          <div className="mb-4">
            <p className="text-red-600">{apiError.message}</p>
          </div>
        )}

        {/* Header + Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Quản lý thiết bị</h1>
            <p className="text-sm text-gray-600">Quản lý thông tin thiết bị</p>
          </div>
          <div className="flex items-center gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded border border-gray-100 shadow-sm p-4 min-w-[250px] flex items-center justify-between transition-all hover:shadow-md"
              >
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-extrabold text-gray-800 mt-0.5">
                    {stat.totalElements}
                  </span>
                </div>
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="pl-10 pr-3 py-2 w-full border rounded bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Tìm kiếm theo tên hoặc mã thiết bị..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
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
                  <div className="flex w-full justify-end mb-2">
                    <button
                      onClick={handleResetFilters}
                      className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">
                      Loại thiết bị
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded bg-white shadow-sm text-gray-700"
                    >
                      <option value="all">Tất cả loại</option>
                      {DEVICE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded bg-white shadow-sm text-gray-700"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      {DEVICE_STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 md:mt-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 px-4 h-10 font-semibold rounded transition-colors whitespace-nowrap"
            >
              <Plus className="h-5 w-5" /> Thêm thiết bị
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left font-semibold">STT</th>
                  <th className="p-4 text-left font-semibold">Tên thiết bị</th>
                  <th className="p-4 text-left font-semibold">Mã thiết bị</th>
                  <th className="p-4 text-left font-semibold">Loại</th>
                  <th className="p-4 text-left font-semibold">Trạng thái</th>
                  <th className="p-4 text-left font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Loader2 className="animate-spin w-6 h-6 text-gray-500 mx-auto" />
                      <span className="text-gray-600">Đang tải dữ liệu...</span>
                    </td>
                  </tr>
                ) : devices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Không có thiết bị nào
                    </td>
                  </tr>
                ) : (
                  devices.map((d, idx) => (
                    <tr
                      key={d.id}
                      className="border-t hover:bg-blue-50/40 transition"
                    >
                      <td className="p-4">
                        {idx + 1 + currentPage * pageSize}
                      </td>
                      <td className="p-4">{d.name}</td>
                      <td className="p-4">{d.code}</td>
                      <td className="p-4">{d.type}</td>
                      <td className="p-4">{d.status}</td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => {
                            setViewDevice(d);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDevice(d);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-full"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {devices.length > 0 && (
            <div className="flex justify-between items-center border-t border-gray-200 bg-white px-4 py-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Trước
              </button>
              <span>
                {currentPage * pageSize + 1} -{" "}
                {Math.min((currentPage + 1) * pageSize, totalElements)} /{" "}
                {totalElements}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddDevice
          onClose={() => {
            setShowAddModal(false);
            fetchDevices(0);
          }}
        />
      )}
      {showViewModal && (
        <ViewDevice
          device={viewDevice}
          onClose={() => setShowViewModal(false)}
        />
      )}
      {showEditModal && (
        <EditDevice
          device={selectedDevice}
          onClose={() => {
            setShowEditModal(false);
            fetchDevices(currentPage);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && deviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="absolute inset-0" onClick={cancelDelete} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center">
                Xác nhận xóa thiết bị
              </h2>
              <p className="text-gray-600 text-center">
                Bạn có chắc chắn muốn xóa thiết bị:{" "}
                <strong>{deviceToDelete.name}</strong>?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border rounded disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
