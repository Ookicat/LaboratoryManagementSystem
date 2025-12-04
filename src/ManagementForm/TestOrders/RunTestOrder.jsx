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
      const res = await api.post("/test-orders/simulation/run", requestBody);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi chạy test order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-xl border border-gray-200 w-full max-w-xl mx-auto">
      <h3 className="text-2xl font-bold mb-6 text-white bg-blue-600 text-center py-3 rounded shadow-md">
        Run Test Order Simulation
      </h3>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Barcode
        </label>
        <input
          className="border border-gray-300 px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gender
        </label>
        <select
          className="border border-gray-300 px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instrument
        </label>
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

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded shadow-md transition disabled:opacity-50"
        onClick={handleRunTestOrder}
        disabled={loading || !barcode}
      >
        {loading ? "Running..." : "Run Test Order"}
      </button>

      {error && <div className="text-red-600 mt-2">{error}</div>}

      {results && (
        <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-lg text-gray-700 mb-2">
            Simulation Results
          </h4>

          <table className="mt-4 w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-sm text-left">
                  Param
                </th>
                <th className="border border-gray-200 px-3 py-2 text-sm text-left">
                  Value
                </th>
                <th className="border border-gray-200 px-3 py-2 text-sm text-left">
                  Unit
                </th>
                <th className="border border-gray-200 px-3 py-2 text-sm text-left">
                  Flag
                </th>
              </tr>
            </thead>
            <tbody>
              {results.results &&
                results.results.map((r, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {r.paramCode}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {r.value}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {r.unit}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {r.flag}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {results.message && (
            <div className="mt-2 text-green-600 font-medium">
              {results.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
