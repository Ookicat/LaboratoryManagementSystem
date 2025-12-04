const statusColorEnum = {
  PENDING: "px-3 py-1 rounded-full text-white text-sm bg-yellow-600",
  IN_PROGRESS: "px-3 py-1 rounded-full text-white text-sm bg-blue-600",
  COMPLETED: "px-3 py-1 rounded-full text-white text-sm bg-green-600",
  CANCELED: "px-3 py-1 rounded-full text-white text-sm bg-red-600",
};
import React, { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import Sidebar from "../../components/SideBar";
import api from "../../API/Axios"; // giữ nguyên file Axios của bạn
import AddTestOrder from "./addTestOrder"; // điều chỉnh path nếu khác
import ViewTestOrder from "./ViewTestOrder.jsx";
import PrintTestOrder from "./PrintTestOrder";
import RunTestOrder from "./RunTestOrder"; // điều chỉnh path nếu cần

import {
  Eye,
  Pencil,
  Printer,
  X,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Main component
export default function SampleManagement() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0); // client page index 0-based
  const SERVER_PAGE_SIZE = 100; // server block size
  const PER_PAGE = 20; // items per UI page
  const [, setServerPagesLoaded] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [runOrderId, setRunOrderId] = useState(null); // lưu orderId cần run
  const [runPatientId, setRunPatientId] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };
  const closeViewOrder = () => {
    setSelectedOrder(null);
  };

  const [printOrderId, setPrintOrderId] = useState(null);
  // Handler to trigger PDF generation and open PrintTestOrder modal
  const handlePrintPDF = (orderId) => {
    setPrintOrderId(orderId); // opens the PrintTestOrder modal if needed
    // Printing is handled inside PrintTestOrder component
  };

  const [patientMap, setPatientMap] = useState({});

  const tableRef = useRef(null);

  const fetchServerBlock = async (blockIndex) => {
    setLoading(true);
    try {
      const params = {
        page: blockIndex,
        size: SERVER_PAGE_SIZE,
        keyword: search || undefined,
      };
      const res = await api.get("/test-orders", { params });
      const list = res.data?.content || [];
      if (blockIndex === 0) {
        setData(list);
      } else {
        setData((prev) => [...prev, ...list]);
      }
      setTotalElements(res.data?.totalElements || list.length);
      setServerPagesLoaded(blockIndex + 1);

      list.forEach((order) => {
        if (order.patientId && !patientMap[order.patientId]) {
          api
            .get(`/patients/${order.patientId}`)
            .then((res) => {
              setPatientMap((prev) => ({
                ...prev,
                [order.patientId]: res.data,
              }));
            })
            .catch((err) => console.error("Error fetching patient:", err));
        }
      });
    } catch (err) {
      console.error("fetchServerBlock error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerBlock(0);
  }, [search]);

  const totalPagesCalc = Math.ceil(totalElements / PER_PAGE);

  const currentOrders = data.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const openCreate = () => setIsCreateModalOpen(true);
  const closeModals = () => {
    setIsCreateModalOpen(false);
  };

  const resetFilters = () => {
    setSearch("");
    setPage(0);
    fetchServerBlock(0);
  };

  return (
    <div className="flex bg-slate-50 min-h-screen w-full h-screen overflow-hidden font-sans text-slate-900">
      <Sidebar />

      {/* Modals */}
      {selectedOrder && (
        <ViewTestOrder order={selectedOrder} onClose={closeViewOrder} />
      )}
      {isCreateModalOpen && (
        <AddTestOrder
          onClose={closeModals}
          onSave={(created) => {
            if (!created) return;
            setData((prev) => [created, ...prev]);
            setTotalElements((t) => t + 1);
            setIsCreateModalOpen(false);
          }}
        />
      )}
      {printOrderId && (
        <PrintTestOrder
          orderId={printOrderId}
          onClose={() => setPrintOrderId(null)}
        />
      )}

      <main className="flex-1 flex flex-col h-full overflow-auto px-8 py-8 relative">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Quản lý Test Order </h1>
              <p className="text-sm text-gray-600">
                Quản lý tài khoản người dùng
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 px-4 h-10 font-semibold rounded transition-colors whitespace-nowrap"
          >
            <Plus size={22} /> Tạo Test Order
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded shadow-sm p-3 mb-3 flex flex-col md:flex-row md:items-center gap-4 border border-blue-100">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">
              <Search size={20} />
            </div>
            <input
              className="w-full pl-10 pr-4 py-2 h-[42px] border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tìm kiếm theo orderId hoặc patientId"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center justify-center gap-1"
            title="Xóa bộ lọc"
          >
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden flex-1">
          <div
            className="overflow-y-auto max-h-[calc(100vh-280px)]"
            ref={tableRef}
          >
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="sticky top-0 z-10 bg-[#f7fafd] border-b border-gray-200 text-[#004b8d] text-sm font-semibold">
                  <th className="px-4 py-3 text-left">STT</th>
                  <th className="px-4 py-3 text-left">Họ và tên</th>
                  <th className="px-4 py-3 text-left">Gender</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created At</th>
                  <th className="px-4 py-3 text-left">Created By</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      {loading ? "Đang tải..." : "Không có test order nào"}
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order, idx) => (
                    <tr
                      key={order.orderId}
                      className="border-b border-gray-200 hover:bg-blue-50/60 transition"
                    >
                      <td className="p-4 align-middle ">
                        {idx + 1 + page * PER_PAGE}
                      </td>
                      <td className="p-4 align-middle">
                        {patientMap[order.patientId]?.fullName ||
                          order.patientId}
                      </td>
                      <td className="p-4 align-middle">
                        {patientMap[order.patientId]?.gender || "-"}
                      </td>

                      <td className="p-4 align-middle">
                        <span
                          className={`${statusColorEnum[order.status] || ""}`}
                        >
                          {order.status || "-"}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-sm">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-4 align-middle">
                        {order.createBy || "-"}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                            title="Xem"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setRunOrderId(order.barcode);
                              setRunPatientId(order.patientId);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                            title="Run"
                          >
                            ▶️
                          </button>
                          <button
                            onClick={() => handlePrintPDF(order.orderId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                            title="In"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-3 bg-[#f7fafd] border-t border-gray-100">
            <div className="text-right text-gray-700 font-medium">
              Tổng số test order:{" "}
              <span className="font-bold">{totalElements}</span>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-start-0 justify-content-lg-start gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-2 rounded border disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPagesCalc }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`px-3 py-1 rounded border ${
                i === page
                  ? "bg-[#004b8d] text-white border-[#004b8d]"
                  : "bg-white text-[#004b8d] border-[#004b8d]"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPagesCalc - 1, page + 1))}
            disabled={page >= totalPagesCalc - 1}
            className="px-3 py-2 rounded border disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
      {runOrderId && (
        <div className="fixed inset-0  flex items-center justify-center z-50">
          <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-5xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setRunOrderId(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <RunTestOrder
              defaultBarcode={runOrderId}
              defaultGender={patientMap[runPatientId]?.gender || "MALE"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
