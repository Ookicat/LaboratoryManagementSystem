import React, { useEffect, useState } from "react";
import api from "../../API/Axios";
import { X } from "lucide-react";

export default function ListResultTestOrder({ testOrderId, onClose }) {
  const [results, setResults] = useState([]);
  const [snapshotRules, setSnapshotRules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!testOrderId) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        // 1. Lấy kết quả Test Order
        const resResponse = await api.post("/test-orders/result", { testOrderId });
        setResults(resResponse.data);

        // 2. Nếu có kết quả, lấy snapshot rules từ testResultSummaryId đầu tiên
        if (resResponse.data.length > 0) {
          const firstSummaryId = resResponse.data[0].testResultSummaryId;
          const snapshotResponse = await api.post("/test-orders/snapshot", { testResultSummaryId: firstSummaryId });
          setSnapshotRules(snapshotResponse.data);
        }
      } catch (err) {
        console.error("Lấy danh sách kết quả thất bại:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [testOrderId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-full max-w-3xl p-6 relative max-h-[80vh] flex flex-col">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4">Kết quả Test Order #{testOrderId}</h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Chưa có kết quả nào</div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-6">
            {results.map((res) => (
              <div key={res.testResultSummaryId} className="border rounded p-3">
                <div className="font-semibold mb-2">
                  Thực hiện bởi: {res.executedBy} | Thời gian:{" "}
                  {new Date(res.executedAt).toLocaleString()}
                </div>

                {/* Bảng kết quả */}
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border">Mã tham số</th>
                        <th className="px-4 py-2 border">Giá trị</th>
                        <th className="px-4 py-2 border">Đơn vị</th>
                        <th className="px-4 py-2 border">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {res.results.map((r, idx) => (
                        <tr key={idx} className="text-center border-b last:border-b-0">
                          <td className="px-4 py-2 border">{r.paramCode}</td>
                          <td className="px-4 py-2 border">{r.value}</td>
                          <td className="px-4 py-2 border">{r.unit}</td>
                          <td className="px-4 py-2 border">{r.flag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bảng Snapshot Rules để so sánh */}
                {snapshotRules.length > 0 && (
                  <div className="overflow-x-auto">
                    <h4 className="font-semibold mb-2">Tiêu chuẩn nồng độ máu</h4>
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 border">Param</th>
                          <th className="px-4 py-2 border">Giá trị</th>
                          <th className="px-4 py-2 border">Min</th>
                          <th className="px-4 py-2 border">Max</th>
                          <th className="px-4 py-2 border">Đơn vị</th>
                          <th className="px-4 py-2 border">Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshotRules.map((s, idx) => (
                          <tr key={idx} className="text-center border-b last:border-b-0">
                            <td className="px-4 py-2 border">{s.paramCode}</td>
                            <td className="px-4 py-2 border">{s.resultValue}</td>
                            <td className="px-4 py-2 border">{s.minVal}</td>
                            <td className="px-4 py-2 border">{s.maxVal}</td>
                            <td className="px-4 py-2 border">{s.unit}</td>
                            <td className="px-4 py-2 border">{s.flag}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
