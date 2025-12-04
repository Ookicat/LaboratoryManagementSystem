import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  UserRound,
  Search,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import api from "../../API/Axios";
import Sidebar from "../../components/SideBar";
import { showError, showWarning, showSuccess } from "../../components/Toast";
import Message, { formatErrorMessage } from "../../components/Message";
import AddPatient from "./AddPatient";
import ViewPatient from "./ViewPatient";
import EditPatient from "./EditPatient";

const formatDate = (d) => {
  if (!d) return "";
  return d;
};

export default function ManagementPatient() {
  const tableRef = useRef(null);

  /* --- Data & state --- */
  const [patients, setPatients] = useState([]); // loaded blocks from server
  const [loading, setLoading] = useState(false);
  const [, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewPatient, setViewPatient] = useState(null);
  const [modalMode] = useState("create");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Paging: page (client page index, 0-based), server block loading
  const [page, setPage] = useState(0); // client page index (0-based)
  const SERVER_PAGE_SIZE = 100; // server block size
  const PER_PAGE = 20; // items per UI page
  const [serverPagesLoaded, setServerPagesLoaded] = useState(0); // how many server blocks loaded
  const [totalElements, setTotalElements] = useState(0); // from server
  const [apiError, setApiError] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const emptyForm = {
    fullName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    phoneNumber: "",
    email: "",
    address: "",
    userId: null,
    status: "ACTIVE",
  };

  /* --- Helpers --- */
  const handleResetFilters = () => {
    setGenderFilter("all");
    setStatusFilter("all");
    setShowFilterPopup(false);
    setPage(0);
  };

  /* --- Fetching from server in blocks --- */
  // serverPageIndex: 0-based block index (size = SERVER_PAGE_SIZE)
  // append: if true, append to existing patients; else replace
  const fetchPatients = async (serverPageIndex = 0, append = false) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await api.get("/patients", {
        params: {
          page: serverPageIndex,
          size: SERVER_PAGE_SIZE,
          sort: "createdAt,desc",
        },
      });

      const data = response.data || {};
      const content = Array.isArray(data.content) ? data.content : [];
      const total = Number(data.totalElements ?? 0);

      setTotalElements(total);

      if (append) {
        setPatients((prev) => {
          // avoid duplicate ids when appending
          const ids = new Set(prev.map((p) => p.id));
          const newOnes = content.filter((p) => !ids.has(p.id));
          return [...prev, ...newOnes];
        });
        setServerPagesLoaded((prev) => prev + 1);
      } else {
        setPatients(content);
        setServerPagesLoaded(1);
      }
    } catch (err) {
      const errorData = err?.response?.data || err;
      setApiError(errorData);
      showError(formatErrorMessage(errorData));
    } finally {
      setLoading(false);
    }
  };

  /* initial load: load first server block */
  useEffect(() => {
    fetchPatients(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* reload when filters or keyword change:
     we keep server cache but reset client page to 0 so UI shows from start.
     (Optionally you could re-fetch server blocks depending on backend filtering support.)
  */
  useEffect(() => {
    // If your backend supports filtering by keyword/gender/status, you should call server with these params
    // For now: we assume server returns all and we do client-side filtering.
    setPage(0);
  }, [keyword, genderFilter, statusFilter]);

  /* --- Client-side filtering & paging --- */
  const filteredPatients = useMemo(() => {
    const kw = (keyword || "").trim().toLowerCase();
    return patients.filter((p) => {
      if (genderFilter !== "all" && p.gender !== genderFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!kw) return true;
      const inName = (p.fullName || "").toLowerCase().includes(kw);
      const inPhone = (p.phoneNumber || "").toLowerCase().includes(kw);
      const inEmail = (p.email || "").toLowerCase().includes(kw);
      return inName || inPhone || inEmail;
    });
  }, [patients, keyword, genderFilter, statusFilter]);

  // total pages for client pagination (based on PER_PAGE)
  const totalPagesCalc = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(
          (Number(totalElements) || filteredPatients.length || 0) / PER_PAGE
        )
      ),
    [totalElements, filteredPatients.length]
  );

  // currentPage as 1-based clamped value (for display logic)
  const currentPage = Math.max(1, Math.min(page + 1, totalPagesCalc));

  const currentPatients = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    const end = currentPage * PER_PAGE;
    return filteredPatients.slice(start, end);
  }, [filteredPatients, currentPage, PER_PAGE]);

  const hasMore = useMemo(() => {
    // whether there are more items on server beyond currently loaded patients
    return patients.length < totalElements;
  }, [patients.length, totalElements]);

  /* --- Save / Delete / Create handlers (unchanged logic) --- */
  const handleSave = async () => {
    if (!emptyForm.fullName || !emptyForm.fullName.trim()) {
      showWarning("Vui lòng nhập tên bệnh nhân!");
      return;
    }
    if (!emptyForm.phoneNumber.trim()) {
      showWarning("Vui lòng nhập số điện thoại!");
      return;
    }
    if (!emptyForm.email.trim()) {
      showWarning("Vui lòng nhập email!");
      return;
    }

    try {
      setApiError(null);
      if (modalMode === "create") {
        await api.post("/patients", emptyForm);
        showSuccess("Thêm bệnh nhân thành công!");
      } else {
        await api.patch(`/patients/${selectedPatient.id}`, emptyForm);
        showSuccess("Cập nhật thông tin bệnh nhân thành công!");
      }
      setShowModal(false);
      // reload first block to reflect changes
      fetchPatients(0, false);
    } catch (err) {
      const errorData = err?.response?.data || err;
      setApiError(errorData);
      showError(formatErrorMessage(errorData));
    }
  };

  const handleDelete = async (p) => {
    setPatientToDelete(p);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;

    setIsDeleting(true);
    try {
      setApiError(null);
      await api.delete(`/patients/${patientToDelete.id}`);
      showSuccess(`Đã xóa thành công bệnh nhân "${patientToDelete.fullName}"!`);
      setShowDeleteModal(false);
      setPatientToDelete(null);
      // remove locally and reload appropriate data if needed
      setPatients((prev) => prev.filter((x) => x.id !== patientToDelete.id));
      setTotalElements((prev) => Math.max(0, prev - 1));
      // ensure page bounds
      const maxPage = Math.max(
        0,
        Math.ceil(Math.max(0, totalElements - 1) / PER_PAGE) - 1
      );
      setPage((cur) => Math.min(cur, maxPage));
    } catch (err) {
      const errorData = err?.response?.data || err;
      setApiError(errorData);
      showError(formatErrorMessage(errorData));
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPatientToDelete(null);
  };

  const stats = [
    {
      label: "Tổng bệnh nhân",
      totalElements: totalElements,
      icon: <UserRound className="w-6 h-6 text-blue-500" />,
      color: "from-blue-500 to-blue-400",
    },
  ];

  /* --- Pagination UI handlers --- */
  // When user requests a client page that requires more server data, we fetch the next server block (append)
  const ensureServerDataForPage = async (targetPageIndex) => {
    // targetPageIndex: 0-based client page index
    const neededItems = (targetPageIndex + 1) * PER_PAGE;
    const loadedItems = patients.length;

    // if needed > loaded and server has more blocks
    if (neededItems > loadedItems && hasMore && !loading) {
      // request next server block (serverPagesLoaded is how many blocks loaded already)
      await fetchPatients(serverPagesLoaded, true);
    }
  };

  /* --- Render --- */
  return (
    <div className="flex bg-gray-50 min-h-screen w-full h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-4 relative">
        {apiError && (
          <div className="mb-4">
            <Message error={apiError} className="w-full" />
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Quản lý bệnh nhân </h1>
            <p className="text-sm text-gray-600">Quản lý thông tin bệnh nhân</p>
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
                  {React.cloneElement(stat.icon, { className: "w-5 h-5" })}
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
                placeholder="Tìm kiếm theo tên, SĐT, email..."
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
                      Giới tính
                    </label>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded bg-white shadow-sm text-gray-700"
                    >
                      <option value="all">Tất cả giới tính</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
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
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DELETED">DELETED</option>
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
              <Plus className="h-5 w-5" /> Thêm bệnh nhân
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-md flex-1 flex flex-col">
          {/* TABLE SCROLL AREA */}
          <div
            className="overflow-y-auto max-h-[calc(100vh-280px)]"
            ref={tableRef}
          >
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="sticky top-0 z-10 bg-[#f7fafd] border-b border-gray-200 text-[#004b8d] text-sm font-semibold">
                  <th className="px-4 py-3 text-left">STT</th>
                  <th className="px-4 py-3 text-left">Họ và tên</th>
                  <th className="px-4 py-3 text-left">Ngày sinh</th>
                  <th className="px-4 py-3 text-left">Điện thoại</th>
                  <th className="px-4 py-3 text-left">Giới tính</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {currentPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {loading ? "Đang tải..." : "Không có bệnh nhân nào"}
                    </td>
                  </tr>
                ) : (
                  currentPatients.map((p, idx) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-200 hover:bg-blue-50/60 transition"
                    >
                      <td className="p-4 align-middle sticky left-0 bg-white z-10 font-medium">
                        {idx + 1 + (currentPage - 1) * PER_PAGE}
                      </td>

                      <td className="p-4 align-middle sticky left-[60px] bg-white z-10">
                        <div className="font-semibold">{p.fullName}</div>
                        <div className="text-xs text-gray-500">{p.email}</div>
                      </td>

                      <td className="p-4 align-middle">
                        {formatDate(p.dateOfBirth)}
                      </td>
                      <td className="p-4 align-middle">{p.phoneNumber}</td>
                      <td className="p-4 align-middle">{p.gender}</td>

                      <td className="p-4 align-middle">
                        <span
                          className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                            p.status === "ACTIVE"
                              ? "bg-green-600"
                              : "bg-red-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setViewPatient(p);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                            title="Xem"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatient(p);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-full"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER LUÔN Ở CUỐI */}
          <div className="flex items-center justify-end px-6 py-3 bg-[#f7fafd] border-t border-gray-100">
            <div className="text-right text-gray-700 font-medium">
              Tổng số bệnh nhân:{" "}
              <span className="font-bold">{totalElements}</span>
            </div>
          </div>
        </div>

        {/* Pagination (separated outside table) */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {/* <div className="text-sm text-gray-600 whitespace-nowrap">
              Tổng số bệnh nhân: <span className="font-semibold">{totalElements}</span>
            </div> */}

            {/* Sliding window pagination + auto-load server blocks when needed */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const prev = Math.max(1, currentPage - 1);
                  if (prev === currentPage) return;
                  const targetPageIndex = prev - 1;
                  await ensureServerDataForPage(targetPageIndex);
                  setPage(targetPageIndex);
                  window.scrollTo({ top: 0, behavior: "smooth" });
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

                  // render buttons and inject ellipsis as needed
                  const elems = [];
                  let lastRendered = 0;
                  for (let i = 0; i < pages.length; i++) {
                    const p = pages[i];
                    // add leading ellipsis if needed
                    if (i === 0 && p > 1) {
                      elems.push(
                        <button
                          key={"page-1"}
                          onClick={async () => {
                            await ensureServerDataForPage(0);
                            setPage(0);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`px-3 py-1 rounded border ${
                            1 === cur
                              ? "bg-[#004b8d] text-white border-[#004b8d]"
                              : "bg-white text-[#004b8d] border-[#004b8d]"
                          }`}
                        >
                          1
                        </button>
                      );
                      if (p > 2) {
                        elems.push(
                          <span
                            key="dots-left"
                            className="px-2 text-sm text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }
                    }

                    elems.push(
                      <button
                        key={p}
                        onClick={async () => {
                          const targetPageIndex = p - 1;
                          await ensureServerDataForPage(targetPageIndex);
                          setPage(targetPageIndex);
                          if (tableRef.current) tableRef.current.scrollTop = 0;
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`px-3 py-1 rounded border ${
                          p === cur
                            ? "bg-[#004b8d] text-white border-[#004b8d]"
                            : "bg-white text-[#004b8d] border-[#004b8d]"
                        }`}
                      >
                        {p}
                      </button>
                    );

                    lastRendered = p;
                    // trailing ellipsis handled after loop
                  }

                  // trailing part: if lastRendered < total, show ellipsis + last page
                  if (lastRendered < total) {
                    if (lastRendered < total - 1) {
                      elems.push(
                        <span
                          key="dots-right"
                          className="px-2 text-sm text-gray-500"
                        >
                          ...
                        </span>
                      );
                    }
                    elems.push(
                      <button
                        key={`last-${total}`}
                        onClick={async () => {
                          const targetPageIndex = total - 1;
                          // ensure server blocks up to last page (may require repeated loads)
                          // estimate required server blocks:
                          const requiredItems =
                            (targetPageIndex + 1) * PER_PAGE;
                          while (
                            patients.length < requiredItems &&
                            hasMore &&
                            !loading
                          ) {
                            // eslint-disable-next-line no-await-in-loop
                            await fetchPatients(serverPagesLoaded, true);
                          }
                          setPage(targetPageIndex);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`px-3 py-1 rounded border ${
                          total === cur
                            ? "bg-[#004b8d] text-white border-[#004b8d]"
                            : "bg-white text-[#004b8d] border-[#004b8d]"
                        }`}
                      >
                        {total}
                      </button>
                    );
                  }

                  return elems;
                })()}
              </div>

              <button
                onClick={async () => {
                  const total = totalPagesCalc;
                  const next = Math.min(total, currentPage + 1);
                  if (next === currentPage) return;
                  const targetPageIndex = next - 1;
                  await ensureServerDataForPage(targetPageIndex);
                  setPage(targetPageIndex);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage >= totalPagesCalc}
                className="px-3 py-2 rounded border disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* AddPatient Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div
              className="absolute inset-0"
              onClick={() => setShowAddModal(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-y-auto max-h-[90vh] animate-fadeIn">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-3 right-3 text-gray-600 hover:text-red-500 transition z-10"
                aria-label="Đóng"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
              <AddPatient
                onClose={() => {
                  setShowAddModal(false);
                  fetchPatients(0, false);
                }}
              />
            </div>
          </div>
        )}

        {showViewModal && (
          <ViewPatient
            patient={viewPatient}
            onClose={() => setShowViewModal(false)}
          />
        )}

        {showEditModal && (
          <EditPatient
            patient={selectedPatient}
            onClose={() => {
              setShowEditModal(false);
              fetchPatients(0, false);
            }}
            onUpdated={() => fetchPatients(0, false)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && patientToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="absolute inset-0" onClick={cancelDelete} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Xác nhận xóa bệnh nhân
                </h2>
                <p className="text-gray-600 text-center mb-1">
                  Bạn có chắc chắn muốn xóa bệnh nhân:
                </p>
                <p className="text-lg font-semibold text-gray-900 text-center mb-4">
                  {patientToDelete.fullName}
                </p>

                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Mã:</span>
                    <span className="font-medium text-gray-900">
                      {patientToDelete.id}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">
                      {patientToDelete.email || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Điện thoại:</span>
                    <span className="font-medium text-gray-900">
                      {patientToDelete.phoneNumber || "-"}
                    </span>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-red-800">
                    ⚠️ <strong>Lưu ý:</strong> Thao tác này không thể hoàn tác
                    và sẽ xóa vĩnh viễn tất cả dữ liệu liên quan.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang xóa...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> Xóa bệnh nhân
                      </>
                    )}
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
