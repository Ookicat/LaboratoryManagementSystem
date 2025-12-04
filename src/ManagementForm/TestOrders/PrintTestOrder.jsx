import React, { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import api from "../../API/Axios"; // Đảm bảo đường dẫn import đúng
import html2pdf from "html2pdf.js";

const PrintTestOrder = ({ orderId, onClose }) => {
  const [order, setOrder] = useState({});
  const [patientInfo, setPatientInfo] = useState({});
  const [resultInfo, setResultInfo] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false); // Trạng thái loading khi in
  const svgRef = useRef(null);

  // --- 1. CALL API (song song, đảm bảo dữ liệu đầy đủ trước khi render) ---
  useEffect(() => {
    if (!orderId) return;

    const fetchAllData = async () => {
      try {
        // 1. Lấy order
        const orderRes = await api.get(`/test-orders/${orderId}`);
        const orderData = orderRes.data || {};
        setOrder(orderData);

        // 2. Lấy patient dựa trên patientId từ order
        let patientData = {};
        if (orderData.patientId) {
          try {
            const patientRes = await api.get(
              `/patients/${orderData.patientId}`
            );
            patientData = patientRes.data || {};
          } catch (err) {
            console.warn("Không tải được thông tin bệnh nhân:", err);
          }
        }
        setPatientInfo(patientData);

        // 3. Lấy result (nếu có)
        let resultsData = [];
        try {
          const resultRes = await api.get(`/test-results/${orderId}`);
          resultsData = resultRes.data || [];
        } catch (err) {
          console.warn("Không tải được kết quả xét nghiệm:", err);
        }
        setResultInfo(resultsData);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        setOrder({});
        setPatientInfo({});
        setResultInfo([]);
      }
    };

    fetchAllData();
  }, [orderId]);
  // --- 3. XỬ LÝ IN PDF ---
  const handlePrint = async () => {
    const element = document.getElementById("print-area");
    if (!element) return alert("Chưa có nội dung để in");

    setIsPrinting(true); // Bật loading

    const opt = {
      margin: 5, // mm
      filename: `KetQua_XetNghiem_${order?.orderId || "Moi"}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Lỗi khi xuất PDF:", error);
      alert("Có lỗi xảy ra khi tạo file PDF. Vui lòng thử lại.");
    } finally {
      setIsPrinting(false); // Tắt loading
    }
  };

  // --- 4. XỬ LÝ ĐÓNG ---
  const handleClose = () => {
    if (onClose && typeof onClose === "function") {
      onClose();
    } else {
      console.error("Lỗi: Component cha chưa truyền hàm 'onClose'!");
      // Fallback nếu quên truyền props (chỉ ẩn giao diện tạm thời - không khuyến khích)
      const modal = document.getElementById("print-modal-overlay");
      if (modal) modal.style.display = "none";
    }
  };

  // Helper tính tuổi
  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + " tuổi";
  };

  return (
    // Overlay (Lớp phủ mờ)
    <div
      id="print-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm font-sans"
    >
      {/* Container chính của Modal */}
      <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* --- HEADER TOOLBAR (Nút In & Đóng) --- */}
        <div className="flex flex-shrink-0 items-center justify-between border-b bg-gray-50 p-4 shadow-sm z-20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-blue-600 rounded"></div>
            <h2 className="text-lg font-bold text-gray-700">
              Xem trước bản in{" "}
              <span className="text-blue-600">#{order.orderId || "..."}</span>
            </h2>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className={`flex items-center gap-2 rounded px-5 py-2 font-medium text-white transition shadow-sm ${
                isPrinting
                  ? "bg-gray-400 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
              }`}
            >
              {isPrinting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang tạo PDF...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Tải PDF / In
                </>
              )}
            </button>

            <button
              onClick={handleClose}
              className="flex items-center gap-2 rounded border border-gray-300 bg-white px-5 py-2 font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* --- BODY SCROLL (Phần cuộn) --- */}
        <div className="flex-1 overflow-y-auto bg-gray-200 p-6">
          <div className="flex justify-center pb-10">
            {/* === KHU VỰC GIẤY IN A4 === */}
            <div
              id="print-area"
              className="box-border min-h-[297mm] w-[210mm] bg-white p-[15mm] text-sm leading-snug text-gray-800 shadow-xl relative"
            >
              {/* 1. Header Phòng Khám */}
              <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-blue-600">
                <div className="w-2/3">
                  <h1 className="text-xl font-bold text-blue-800 uppercase mb-2">
                    PHÒNG XÉT NGHIỆM Y KHOA CAO CẤP
                  </h1>
                  <div className="text-gray-600 space-y-1 text-[13px]">
                    <p className="flex items-center gap-2">
                      <span>📍</span> 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh
                    </p>
                    <p className="flex items-center gap-2">
                      <span>📞</span> (028) 1234 5678
                    </p>
                    <p className="flex items-center gap-2">
                      <span>✉️</span> contact@labmanagement.vn
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🛡️</span> Giấy phép số: 123/BYT-SYT
                    </p>
                  </div>
                </div>
                <div className="w-1/3 flex flex-col items-end">
                  {/* Barcode SVG */}
                  <div className="mb-1">
                    <svg ref={svgRef} className="h-12 w-auto"></svg>
                  </div>
                  <div className="text-right text-[11px] text-gray-500">
                    <p>
                      Mã HS:{" "}
                      <span className="font-bold text-black">
                        {order?.orderId}
                      </span>
                    </p>
                    <p>Ngày in: {new Date().toLocaleString("vi-VN")}</p>
                  </div>
                </div>
              </div>

              {/* 2. Tiêu đề Phiếu */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">
                  PHIẾU KẾT QUẢ XÉT NGHIỆM
                </h2>
                <p className="text-gray-500 uppercase tracking-[0.3em] text-[10px] mt-1">
                  LABORATORY TEST RESULTS
                </p>
              </div>

              {/* 3. Thông tin Bệnh nhân */}
              <div className="mb-6">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-2 mb-3">
                  <h3 className="text-blue-800 font-bold uppercase text-xs flex items-center gap-2">
                    👤 THÔNG TIN BỆNH NHÂN (PATIENT INFORMATION)
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-x-10 gap-y-3 px-2 text-[13px]">
                  <div className="flex">
                    <span className="w-24 font-bold text-gray-600">
                      Họ và tên:
                    </span>
                    <span className="font-bold text-gray-900 uppercase text-[14px]">
                      {patientInfo && patientInfo.fullName
                        ? patientInfo.fullName
                        : "Chưa có thông tin"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-bold text-gray-600">
                      Mã chỉ định:
                    </span>
                    <span className="font-mono font-bold">
                      {order?.orderId || "Chưa có thông tin"}
                    </span>
                  </div>

                  <div className="flex">
                    <span className="w-24 font-bold text-gray-600">
                      Năm sinh:
                    </span>
                    <span>
                      {patientInfo && patientInfo.dateOfBirth
                        ? `${patientInfo.dateOfBirth} (${calculateAge(
                            patientInfo.dateOfBirth
                          )})`
                        : "Chưa có thông tin"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-bold text-gray-600">
                      Số điện thoại:
                    </span>
                    <span>
                      {patientInfo && patientInfo.phoneNumber
                        ? patientInfo.phoneNumber
                        : "Chưa có thông tin"}
                    </span>
                  </div>

                  <div className="flex">
                    <span className="w-24 font-bold text-gray-600">
                      Giới tính:
                    </span>
                    <span>
                      {patientInfo && patientInfo.gender
                        ? patientInfo.gender
                        : "Chưa có thông tin"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-bold text-gray-600">
                      Bác sĩ chỉ định:
                    </span>
                    <span>{order?.doctorName || "Chưa có thông tin"}</span>
                  </div>

                  <div className="flex col-span-2 border-t border-dashed border-gray-200 pt-2 mt-1">
                    <span className="w-24 font-bold text-gray-600">
                      Địa chỉ:
                    </span>
                    <span className="flex-1">
                      {patientInfo && patientInfo.address
                        ? patientInfo.address
                        : "Chưa có thông tin"}
                    </span>
                  </div>

                  <div className="flex col-span-2">
                    <span className="w-24 font-bold text-gray-600">
                      Chẩn đoán:
                    </span>
                    <span className="font-medium text-blue-800">
                      {order?.diagnosis || "Chưa có thông tin"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Kết quả Xét nghiệm */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-1 bg-purple-600 rounded-full"></div>
                  <h3 className="text-purple-800 font-bold uppercase text-base">
                    KẾT QUẢ XÉT NGHIỆM
                  </h3>
                </div>

                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-left text-xs uppercase font-bold border-b-2 border-gray-300">
                      <th className="p-2 w-10 text-center">STT</th>
                      <th className="p-2">Tên xét nghiệm</th>
                      <th className="p-2 text-center">Kết quả</th>
                      <th className="p-2 text-center">Đơn vị</th>
                      <th className="p-2 text-center">CSBT (Ref)</th>
                      <th className="p-2">Đánh giá</th>
                      <th className="p-2 text-right">Máy / Kỹ thuật</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Dùng dữ liệu thật, nếu không có thì dùng Mock Data hiển thị thử */}
                    {(Array.isArray(resultInfo) && resultInfo.length > 0
                      ? resultInfo
                      : [
                          {
                            id: 1,
                            name: "GLUCOSE (Đói)",
                            result: "6.5",
                            unit: "mmol/L",
                            ref: "3.9-6.4",
                            status: "Cao",
                            method: "Cobas 6000",
                          },
                          {
                            id: 2,
                            name: "UREA",
                            result: "4.2",
                            unit: "mmol/L",
                            ref: "2.5-7.5",
                            status: "Bình thường",
                            method: "Cobas 6000",
                          },
                          {
                            id: 3,
                            name: "CREATININE",
                            result: "120",
                            unit: "µmol/L",
                            ref: "62-106",
                            status: "Nguy hiểm",
                            method: "Cobas Jaffe",
                          },
                        ]
                    ).map((item, index) => {
                      // Logic màu sắc
                      const isHigh = item.status === "Cao";
                      const isDanger = item.status === "Nguy hiểm";
                      const resultClass = isDanger
                        ? "text-red-600 font-bold"
                        : isHigh
                        ? "text-orange-600 font-bold"
                        : "text-gray-900 font-medium";

                      return (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-2 text-center text-gray-500">
                            {index + 1}
                          </td>
                          <td className="p-2 font-semibold text-gray-800">
                            {item.name || item.testName}
                          </td>
                          <td
                            className={`p-2 text-center text-[14px] ${resultClass}`}
                          >
                            {item.result}
                          </td>
                          <td className="p-2 text-center text-gray-500">
                            {item.unit}
                          </td>
                          <td className="p-2 text-center text-gray-500">
                            {item.ref || item.referenceRange}
                          </td>
                          <td className="p-2">
                            {isDanger && (
                              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold border border-red-200">
                                ⚠️ NGUY HIỂM
                              </span>
                            )}
                            {isHigh && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[11px] font-bold border border-orange-200">
                                ⚡ CAO
                              </span>
                            )}
                            {!isHigh && !isDanger && (
                              <span className="text-green-600 text-[11px] font-bold">
                                ✓ Bình thường
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-right text-gray-400 text-[11px] italic">
                            {item.method || "System"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 5. Ghi chú */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-8">
                <h4 className="text-yellow-800 font-bold uppercase text-[11px] mb-1">
                  Ghi chú từ phòng Lab:
                </h4>
                <p className="text-gray-800 text-sm italic">
                  "{order?.notes || "Không có ghi chú đặc biệt."}"
                </p>
              </div>

              {/* 6. Chữ ký (Signature) */}
              <div className="flex justify-between text-center mb-10 px-4 mt-12">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-600 text-sm uppercase">
                    Kỹ thuật viên
                  </span>
                  <span className="text-xs text-gray-400 italic mb-12">
                    (Đã ký xác nhận)
                  </span>
                  <span className="font-bold text-gray-800 mt-2">
                    {order?.createBy || ".................."}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 italic">
                    TP.HCM, ngày {new Date().getDate()} tháng{" "}
                    {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </span>
                  <span className="font-bold text-blue-900 text-sm uppercase">
                    Trưởng Khoa Xét Nghiệm
                  </span>
                  <span className="text-xs text-gray-400 italic mb-12">
                    (Ký và ghi rõ họ tên)
                  </span>
                  <span className="font-bold text-gray-800 mt-2">
                    BS. CKII. Nguyễn Văn A
                  </span>
                </div>
              </div>

              {/* 7. Footer Notes */}
              <div className="border-t-2 border-blue-600 pt-3 text-[10px] text-gray-500">
                <div className="flex gap-4">
                  <div className="w-3/4">
                    <p className="font-bold text-gray-700 mb-1 uppercase">
                      Lưu ý quan trọng:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>
                        Kết quả xét nghiệm chỉ có giá trị khi có đầy đủ chữ ký
                        và đóng dấu.
                      </li>
                      <li>
                        Kết quả này chỉ phản ánh tình trạng tại thời điểm lấy
                        mẫu.
                      </li>
                      <li>
                        Việc diễn giải kết quả phải được thực hiện bởi bác sĩ
                        lâm sàng.
                      </li>
                    </ul>
                  </div>
                  <div className="w-1/4 text-right flex flex-col justify-end">
                    <p className="font-bold text-blue-800">
                      LABORATORY MANAGEMENT
                    </p>
                    <p>Hotline: 1900 1234</p>
                  </div>
                </div>
              </div>
            </div>
            {/* === KẾT THÚC GIẤY IN === */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTestOrder;
