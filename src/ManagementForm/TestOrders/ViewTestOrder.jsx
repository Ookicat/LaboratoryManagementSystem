import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import JsBarcode from "jsbarcode";
import api from "../../API/Axios";
import Message, { formatErrorMessage } from "../../components/Message";
import { showError, showSuccess } from "../../components/Toast";
import ListResultTestOrder from "./ListResultTestOrder";

export default function ViewTestOrder({ order, onClose }) {
  const svgRef = useRef(null);
  const commentsEndRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);

  // edit state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);

  // delete modal state
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // message (detailed) state for UI banner
  const [message, setMessage] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("profile");

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (!order) return null;

  useEffect(() => {
    const onDocClick = (e) => setOpenMenuId(null);
    const onEsc = (e) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    if (order?.patientId) {
      api
        .get(`/patients/${order.patientId}`)
        .then((res) => setPatientInfo(res.data))
        .catch((err) => {
          console.error("Error fetching patient:", err);
          const fm = formatErrorMessage(
            err?.response?.data ||
              err?.message ||
              "Không thể tải thông tin bệnh nhân"
          );
          setMessage(fm);
          showError(fm);
        });
    }
  }, [order?.patientId]);

  useEffect(() => {
    if (order?.barcode && svgRef.current) {
      try {
        JsBarcode(svgRef.current, String(order.barcode), {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          height: 60,
          margin: 4,
        });
      } catch (err) {
        console.error("Barcode render error:", err);
        setMessage("Lỗi tạo barcode");
      }
    }
  }, [order?.barcode]);

  const fetchComments = async () => {
    if (!order?.orderId) return;
    try {
      const res = await api.get("/test-orders/comments", {
        params: { orderId: order.orderId },
      });
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      const fm = formatErrorMessage(
        err?.response?.data || err?.message || "Không thể tải ghi chú"
      );
      setMessage(fm);
      showError(fm);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [order?.orderId]);

  useEffect(() => {
    if (commentsEndRef.current)
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showError("Ghi chú không được để trống");
      return;
    }
    setLoadingComment(true);
    try {
      await api.post("/test-orders/comments", {
        orderId: order.orderId,
        content: newComment,
      });
      showSuccess("Thêm ghi chú thành công");
      setNewComment("");
      await fetchComments();
    } catch (err) {
      console.error("Error adding comment:", err);
      showError(
        formatErrorMessage(
          err?.response?.data || err?.message || "Thêm ghi chú thất bại"
        )
      );
    } finally {
      setLoadingComment(false);
    }
  };

  const startEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content || "");
  };
  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editContent.trim()) {
      showError("Nội dung không được để trống");
      return;
    }
    setLoadingEdit(true);
    try {
      await api.put(`/test-orders/comments/${editingCommentId}`, {
        content: editContent,
      });
      showSuccess("Cập nhật ghi chú thành công");
      setEditingCommentId(null);
      setEditContent("");
      await fetchComments();
    } catch (err) {
      console.error("Update comment error:", err);
      showError(
        formatErrorMessage(
          err?.response?.data || err?.message || "Không thể cập nhật ghi chú"
        )
      );
    } finally {
      setLoadingEdit(false);
    }
  };

  const confirmDelete = (comment) => setCommentToDelete(comment);

  const handleDeleteConfirmed = async () => {
    if (!commentToDelete?.id) {
      setCommentToDelete(null);
      return;
    }
    const id = commentToDelete.id;
    setDeletingCommentId(id);
    try {
      await api.delete(`/test-orders/comments/${id}`);
      showSuccess("Xóa ghi chú thành công");
      setCommentToDelete(null);
      await fetchComments();
    } catch (err) {
      console.error("Delete comment error:", err);
      showError(
        formatErrorMessage(
          err?.response?.data || err?.message || "Không thể xóa ghi chú"
        )
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleCancelDelete = () => setCommentToDelete(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">Chi tiết Test Order</h3>
          <button
            onClick={onClose}
            className="hover:bg-blue-700 p-2 rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-gray-50">
          {message && (
            <div className="mb-2">
              <Message onClose={() => setMessage(null)}>{message}</Message>
            </div>
          )}

          <div className="grid grid-cols-5 gap-6">
            {/* Left Tabs */}
            <div className="md:col-span-3 flex flex-col gap-6">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  className={`flex-1 py-2 text-center font-medium ${
                    activeTab === "profile"
                      ? "border-b-2 border-blue-600 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("profile")}
                >
                  Thông tin bệnh nhân
                </button>
                <button
                  className={`flex-1 py-2 text-center font-medium ${
                    activeTab === "history"
                      ? "border-b-2 border-blue-600 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("history")}
                >
                  Lịch sử khám bệnh
                </button>
              </div>

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="flex flex-col gap-6 mt-4">
                  {/* Patient Info */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-blue-700">
                        Thông tin Bệnh nhân
                      </h4>
                    </div>
                    {!patientInfo ? (
                      <p className="text-gray-500 text-sm">
                        Đang tải thông tin...
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-400 text-xs">Họ và tên</div>
                          <div className="font-medium">
                            {patientInfo.fullName}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Ngày sinh</div>
                          <div className="font-medium">
                            {patientInfo.dateOfBirth}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Giới tính</div>
                          <div className="font-medium">
                            {patientInfo.gender}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">SĐT</div>
                          <div className="font-medium">
                            {patientInfo.phoneNumber}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Email</div>
                          <div className="font-medium">{patientInfo.email}</div>
                        </div>
                        <div></div>
                        <div className="col-span-2">
                          <div className="text-gray-400 text-xs">Địa chỉ</div>
                          <div className="font-medium">
                            {patientInfo.address}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-blue-700">
                        Thông tin test order
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400 text-xs">Order ID</div>
                        <div className="font-medium">
                          {order?.orderId ?? "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Patient ID</div>
                        <div className="font-medium">
                          {order?.patientId ?? "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Created by</div>
                        <div className="font-medium">
                          {order?.createdBy ?? "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Status</div>
                        <div className="font-medium">
                          {order?.status ?? "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Created At</div>
                        <div className="font-medium">
                          {order?.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Target</div>
                        <div className="font-medium">
                          {order?.targetResource
                            ? `${order.targetResource.type} : ${
                                order.targetResource.displayName ??
                                order.targetResource.id
                              }`
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barcode */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-center">
                    <svg ref={svgRef} className="w-full max-w-md h-20"></svg>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="mt-4">
                  <ListResultTestOrder
                    testOrderId={order.orderId}
                    onClose={() => setActiveTab("profile")}
                  />
                </div>
              )}
            </div>

            {/* Right: Comments */}
            <div className="md:col-span-2 flex flex-col gap-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              {" "}
              <div className="flex items-center justify-between mb-3 bg-blue-600 p-3 rounded-lg">
                <h4 className="font-semibold text-white  text-lg">Ghi chú</h4>
                <span className="text-xs text-white">Mới nhất ở trên</span>
              </div>
              <div className="mb-3 h-96 overflow-y-auto pr-2 space-y-2">
                {comments.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-gray-400">Chưa có ghi chú.</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex gap-3 items-start p-4 bg-white border border-gray-200 rounded-xl shadow-sm relative"
                    >
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg,#3b82f6 0%, #06b6d4 100%)",
                        }}
                      >
                        {getInitials(c.createdBy)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-blue-700">
                              {c.createdBy || "Không rõ"}
                            </span>
                            {editingCommentId === c.id ? (
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="mt-1 w-full p-2 border border-gray-200 rounded-md text-sm min-h-[80px]"
                                rows={3}
                              />
                            ) : (
                              <span className="text-sm font-medium text-slate-800 break-words">
                                {c.content}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleString()
                                : "-"}
                            </span>
                            {editingCommentId === c.id ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  disabled={loadingEdit}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  {loadingEdit ? "Đang lưu..." : "Lưu"}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  Hủy
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === c.id ? null : c.id
                                  )
                                }
                                className="p-1 rounded text-sm hover:bg-gray-100"
                                title="Tùy chọn"
                              >
                                ⋯
                              </button>
                            )}
                            {openMenuId === c.id &&
                              editingCommentId !== c.id && (
                                <div className="absolute right-0 top-10 w-36 bg-white border rounded shadow-lg z-50">
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      startEdit(c);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      confirmDelete(c);
                                    }}
                                    disabled={deletingCommentId === c.id}
                                    className={`w-full text-left px-3 py-2 text-sm ${
                                      deletingCommentId === c.id
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-red-600 hover:bg-red-50"
                                    }`}
                                  >
                                    {deletingCommentId === c.id
                                      ? "Đang xóa..."
                                      : "Xóa"}
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
              {/* Add Comment */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    placeholder="Viết ghi chú..."
                    className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-sm"
                    disabled={loadingComment}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={loadingComment}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white ${
                      loadingComment
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                    }`}
                  >
                    {loadingComment ? "Đang thêm..." : "Thêm"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
