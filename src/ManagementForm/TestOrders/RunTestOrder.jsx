import React, { useState } from "react";
import api from "../../API/Axios"; // giữ nguyên file Axios của bạn

const PARAM_CODES = ["WBC", "RBC", "HGB", "HCT", "PLT", "MCV", "MCH", "MCHC"];
const INSTRUMENT_OPTIONS = [1, 2, 3];

export default function RunTestOrder({
  defaultBarcode = "",
  defaultGender = "MALE",
}) {
  const [barcode, setBarcode] = useState(defaultBarcode);
  const [gender, setGender] = useState(defaultGender);
  const [instrumentId, setInstrumentId] = useState(1);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRunTestOrder = async () => {
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const requestBody = {
        barcode,
        gender,
        instrumentId,
        paramCodes: PARAM_CODES,
      };
      const res = await api.post("/simulation/run", requestBody);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi chạy test order");
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-200 w-full mx-auto my-6">
    <h3 className="text-3xl font-bold mb-6 text-white bg-blue-600 text-center py-4 rounded shadow-md">
      Run Test Order Simulation
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
        <input
          className="border border-gray-300 px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          disabled
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
        <select
          className="border border-gray-300 px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          disabled
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instrument</label>
        <select
          className="border border-gray-300 px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={instrumentId}
          onChange={(e) => setInstrumentId(Number(e.target.value))}
        >
          {INSTRUMENT_OPTIONS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
    </div>

    <button
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded shadow-md transition disabled:opacity-50 mb-6"
      onClick={handleRunTestOrder}
      disabled={loading || !barcode}
    >
      {loading ? "Running..." : "Run Test Order"}
    </button>

    {error && <div className="text-red-600 mb-4">{error}</div>}

    {results && (
      <div className="mt-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-lg w-full overflow-x-auto">
        <h4 className="font-semibold text-2xl text-gray-700 mb-4">Simulation Results</h4>

        <table className="w-full min-w-[800px] border border-gray-300 rounded-lg text-base">
          <thead>
            <tr className="bg-blue-100">
              <th className="border-b border-gray-300 px-4 py-3 text-left font-bold text-gray-700">Param</th>
              <th className="border-b border-gray-300 px-4 py-3 text-left font-bold text-gray-700">Value</th>
              <th className="border-b border-gray-300 px-4 py-3 text-left font-bold text-gray-700">Unit</th>
              <th className="border-b border-gray-300 px-4 py-3 text-left font-bold text-gray-700">Flag</th>
            </tr>
          </thead>
          <tbody>
            {results.results &&
              results.results.map((r, idx) => {
                let flagColor = "text-gray-700";
                if (r.flag === "H" || r.flag === "L") flagColor = "text-red-600 font-bold";
                else if (r.flag === "N") flagColor = "text-green-600 font-bold";

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="border-b border-gray-200 px-4 py-3">{r.paramCode}</td>
                    <td className="border-b border-gray-200 px-4 py-3">{r.value}</td>
                    <td className="border-b border-gray-200 px-4 py-3">{r.unit}</td>
                    <td className={`border-b border-gray-200 px-4 py-3 ${flagColor}`}>{r.flag}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {results.message && (
          <div className="mt-4 text-green-600 font-semibold text-lg">{results.message}</div>
        )}
      </div>
    )}
  </div>
);
}