import React, { useState, useMemo } from "react";
import { X, Upload, FileDown, AlertTriangle } from "lucide-react";
import api from "../../API/Axios.jsx";
import { showSuccess, showError, showWarning } from "../../components/Toast";

const UploadUsers = ({ isOpen, onClose }) => {
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const flattenedErrors = useMemo(() => {
    if (!uploadResult?.errors?.length) {
      return [];
    }

    return uploadResult.errors.flatMap((errorEntry) =>
      Array.isArray(errorEntry.messages)
        ? errorEntry.messages.map((msg) => ({
            rowNumber: errorEntry.rowNumber,
            errorDetail: msg,
          }))
        : [
            {
              rowNumber: errorEntry.rowNumber,
              errorDetail: "Lỗi không xác định",
            },
          ]
    );
  }, [uploadResult]);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/users/download-template", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "user-upload-template.xlsx";
      link.click();
      link.remove();
      showSuccess("Tải form Excel mẫu thành công!");
    } catch (error) {
      showError("Không thể tải form mẫu!");
    }
  };

  const handleUploadClick = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx, .xls";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      setLoading(true);
      setUploadResult(null);

      try {
        const response = await api.post("/users/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setUploadResult(response.data);
        if (response.data.failureCount > 0) {
          showWarning(
            `Đã tải ${response.data.totalRows} dòng — ${response.data.failureCount} lỗi.`
          );
        } else {
          showSuccess("Upload thành công toàn bộ!");
        }
      } catch (error) {
        showError("Upload thất bại! Kiểm tra lại file.");
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl relative animate-fadeIn p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Upload danh sách người dùng
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={handleUploadClick}
            disabled={loading}
            className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl py-8 
              transition-all duration-300 ease-in-out ${
                loading
                  ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                  : "border-blue-400 hover:bg-blue-50 hover:border-blue-600 hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
              }`}
          >
            <Upload className="w-10 h-10 text-blue-600" />
            <div className="text-lg font-medium text-blue-700">
              {loading ? "Đang tải lên..." : "Upload Excel"}
            </div>
            <p className="text-sm text-gray-500">
              Chọn file Excel (.xlsx, .xls)
            </p>
          </button>

          <button
            onClick={handleDownloadTemplate}
            disabled={loading}
            className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl py-8 
              transition-all duration-300 ease-in-out ${
                loading
                  ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                  : "border-green-400 hover:bg-green-50 hover:border-green-600 hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
              }`}
          >
            <FileDown className="w-10 h-10 text-green-600" />
            <div className="text-lg font-medium text-green-700">
              Tải form Excel mẫu
            </div>
            <p className="text-sm text-gray-500">
              Tải file mẫu để điền thông tin người dùng
            </p>
          </button>
        </div>

        {uploadResult && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" /> Kết quả xử lý file
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Tổng dòng: <b>{uploadResult.totalRows}</b> | Thành công:{" "}
              <b className="text-green-600">{uploadResult.successCount}</b> |
              Lỗi: <b className="text-red-600">{uploadResult.failureCount}</b>
            </p>

            {uploadResult.errors?.length > 0 ? (
              <div className="max-h-60 overflow-y-auto rounded-md border bg-gray-50 p-4 space-y-4">
                {uploadResult.errors.map((errorEntry, index) => {
                  if (
                    !Array.isArray(errorEntry.errorDetails) &&
                    typeof errorEntry.errorDetails !== "string"
                  ) {
                    return (
                      <div
                        key={index}
                        className="p-2 bg-white border border-red-200 rounded-md shadow-sm"
                      >
                        <h4 className="font-small text-gray-800 text-[5px] flex items-center gap-1">
                          Lỗi tại
                          <span className="text-red-200 font-semibold bg-red-50 px-1 py-0.5 rounded">
                            Dòng {errorEntry.rowNumber}
                          </span>
                          :
                        </h4>
                        <p className="text-[11px] text-red-700 mt-0.5 italic">
                          Cấu trúc lỗi không hợp lệ.
                        </p>
                      </div>
                    );
                  }

                  const errorList = Array.isArray(errorEntry.errorDetails)
                    ? errorEntry.errorDetails
                    : [errorEntry.errorDetails];

                  return (
                    <div
                      key={index}
                      className="p-3.5 bg-white border border-red-200 rounded-lg shadow-sm"
                    >
                      <h4 className="text-gray-700 mb-1 text-xs flex items-center gap-1 font-normal text-[11px]">
                        <span className="text-gray-600 text-[13px]">
                          Lỗi tại
                        </span>
                        <span className="text-red-600 font-semibold bg-red-100 px-1.5 py-0.5 rounded text-[13px]">
                          Dòng {errorEntry.rowNumber}
                        </span>
                        <span className="text-gray-600">:</span>
                      </h4>

                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100 border-b">
                            <tr>
                              <th className="text-left px-3 py-1.5 font-medium text-gray-700 w-1/3">
                                Trường
                              </th>
                              <th className="text-left px-3 py-1.5 font-medium text-gray-700">
                                Chi tiết lỗi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {errorList.map((messageString, msgIndex) => {
                              let field = "Lỗi không xác định";
                              let message = "";

                              if (typeof messageString === "string") {
                                // ✅ Tách chuỗi lỗi dạng "field: message"
                                if (messageString.includes(":")) {
                                  const parts = messageString.split(":");
                                  field = parts[0]?.trim() || "Không xác định";
                                  message =
                                    parts.slice(1).join(":")?.trim() ||
                                    "Không có chi tiết";
                                } else {
                                  // ✅ Nếu backend chỉ trả về thông báo, cố gắng phát hiện tên trường
                                  const knownFields = [
                                    "email",
                                    "dateofbirth",
                                    "fullname",
                                    "phonenumber",
                                    "identify",
                                    "password",
                                    "gender",
                                    "age",
                                    "address",
                                    "role",
                                  ];
                                  const matchedField = knownFields.find((f) =>
                                    messageString.toLowerCase().includes(f)
                                  );
                                  field = matchedField
                                    ? matchedField
                                    : "Không xác định";
                                  message = messageString.trim();
                                }
                              } else if (typeof messageString === "object") {
                                field =
                                  messageString.field || "Không rõ trường";
                                message =
                                  messageString.error ||
                                  JSON.stringify(messageString);
                              } else {
                                message = JSON.stringify(messageString);
                              }

                              return (
                                <tr
                                  key={msgIndex}
                                  className="hover:bg-red-50 transition-colors"
                                >
                                  <td className="px-3 py-2 font-medium text-gray-800 capitalize">
                                    {field}
                                  </td>
                                  <td className="px-3 py-2 text-red-700">
                                    {message}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                ✅ Tất cả người dùng đã được thêm thành công!
              </div>
            )}
          </div>
        )}

        {/* 🔘 Nút đóng */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadUsers;
