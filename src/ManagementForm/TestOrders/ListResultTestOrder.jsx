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
        const resResponse = await api.post("/test-orders/result", { testOrderId });
        setResults(resResponse.data);

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

  const getFlagColor = (flag) => {
    if (flag === "H" || flag === "L") return "text-red-600 font-bold";
    if (flag === "N") return "text-green-600 font-bold";
    return "text-gray-700";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl p-8 relative max-h-[90vh] flex flex-col">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Kết quả Test Order #{testOrderId}</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Đang tải...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Chưa có kết quả nào</div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-8">
            {results.map((res) => (
              <div key={res.testResultSummaryId} className="border rounded-xl p-4 shadow-sm bg-gray-50">
                <div className="font-semibold mb-3 text-gray-700">
                  Thực hiện bởi: <span className="font-medium">{res.executedBy}</span> | Thời gian:{" "}
                  <span className="font-medium">{new Date(res.executedAt).toLocaleString()}</span>
                </div>

                {/* Bảng kết quả */}
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border border-gray-200 rounded-lg text-base">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-5 py-3 border-b font-semibold text-left text-gray-700">Mã tham số</th>
                        <th className="px-5 py-3 border-b font-semibold text-left text-gray-700">Giá trị</th>
                        <th className="px-5 py-3 border-b font-semibold text-left text-gray-700">Đơn vị</th>
                        <th className="px-5 py-3 border-b font-semibold text-left text-gray-700">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {res.results.map((r, idx) => (
                        <tr key={idx} className="hover:bg-gray-100 transition-colors text-center">
                          <td className="px-5 py-3 border">{r.paramCode}</td>
                          <td className="px-5 py-3 border">{r.value}</td>
                          <td className="px-5 py-3 border">{r.unit}</td>
                          <td className={`px-5 py-3 border ${getFlagColor(r.flag)}`}>{r.flag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bảng Snapshot Rules */}
                {snapshotRules.length > 0 && (
                  <div className="overflow-x-auto">
                    <h4 className="font-semibold mb-2 text-gray-700">Tiêu chuẩn nồng độ máu</h4>
                    <table className="min-w-full border border-gray-200 rounded-lg text-base">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-4 py-2 border font-semibold text-gray-700">Param</th>
                          <th className="px-4 py-2 border font-semibold text-gray-700">Giá trị</th>
                          <th className="px-4 py-2 border font-semibold text-gray-700">Min</th>
                          <th className="px-4 py-2 border font-semibold text-gray-700">Max</th>
                          <th className="px-4 py-2 border font-semibold text-gray-700">Đơn vị</th>
                          <th className="px-4 py-2 border font-semibold text-gray-700">Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshotRules.map((s, idx) => (
                          <tr key={idx} className="hover:bg-gray-100 transition-colors text-center">
                            <td className="px-4 py-2 border">{s.paramCode}</td>
                            <td className="px-4 py-2 border">{s.resultValue}</td>
                            <td className="px-4 py-2 border">{s.minVal}</td>
                            <td className="px-4 py-2 border">{s.maxVal}</td>
                            <td className="px-4 py-2 border">{s.unit}</td>
                            <td className={`px-4 py-2 border ${getFlagColor(s.flag)}`}>{s.flag}</td>
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
