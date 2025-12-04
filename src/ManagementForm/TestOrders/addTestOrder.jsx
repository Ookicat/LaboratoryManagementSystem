// AddTestOrder.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/Axios";
import { X, Plus } from "lucide-react";
import { showSuccess, showError } from "../../components/Toast.jsx";
import Message, { formatErrorMessage } from "../../components/Message";
import AddPatient from "../Patient/AddPatient";

export default function AddTestOrder({ onClose, onSave }) {
  const navigate = useNavigate();
  const [patientSearch, setPatientSearch] = useState("");
  const [patientList, setPatientList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  const debounceRef = useRef(null);
  const listRef = useRef(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const inputClass =
    "w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

  const mapPatient = (p) => {
    const rawId = p.patientId ?? p.id ?? p.patient_id;
    const numericId =
      rawId == null
        ? undefined
        : typeof rawId === "number"
        ? rawId
        : /^\d+$/.test(String(rawId))
        ? Number(rawId)
        : rawId;

    return {
      raw: p,
      id: numericId,
      fullName: p.fullName ?? p.name ?? p.full_name ?? "",
      phone: p.phone ?? p.mobile ?? p.phoneNumber ?? "",
      age: p.age ?? p.birthYear ?? "",
      gender: p.gender ?? p.sex ?? "",
      address: p.address ?? p.addr ?? "",
    };
  };

  const fetchPatients = async (keyword) => {
    setSearching(true);
    try {
      const res = await api.get("/patients", {
        params: { keyword, page: 0, size: 100 },
      });
      const rawList = Array.isArray(res?.data?.content)
        ? res.data.content
        : Array.isArray(res?.data)
        ? res.data
        : [];
      const mapped = rawList.map(mapPatient);
      setPatientList(mapped);
      setNoResults(mapped.length === 0);
    } catch (err) {
      console.error("fetchPatients error:", err);
      setPatientList([]);
      setNoResults(true);
    } finally {
      setSearching(false);
      setHighlightIndex(-1);
    }
  };

  const handlePatientChange = (e) => {
    const keyword = e.target.value;
    setPatientSearch(keyword);
    setSelectedPatient(null);
    setNoResults(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (keyword.length >= 1) {
      debounceRef.current = setTimeout(() => {
        fetchPatients(keyword);
      }, 300);
    } else {
      setPatientList([]);
      setNoResults(false);
      setSearching(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.fullName || "");
    setPatientList([]);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (patientList.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => {
        const next = Math.min(i + 1, patientList.length - 1);
        scrollToItem(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => {
        const prev = Math.max(i - 1, 0);
        scrollToItem(prev);
        return prev;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = highlightIndex >= 0 ? highlightIndex : 0;
      const p = patientList[idx];
      if (p) handleSelectPatient(p);
    } else if (e.key === "Escape") {
      setPatientList([]);
      setHighlightIndex(-1);
    }
  };

  const scrollToItem = (index) => {
    if (!listRef.current) return;
    const ul = listRef.current;
    const li = ul.children[index];
    if (li) {
      const liTop = li.offsetTop;
      const liBottom = liTop + li.offsetHeight;
      if (liTop < ul.scrollTop) ul.scrollTop = liTop;
      if (liBottom > ul.scrollTop + ul.clientHeight)
        ul.scrollTop = liBottom - ul.clientHeight;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient || selectedPatient.id == null) {
      showError("Vui lòng chọn một bệnh nhân hợp lệ từ danh sách gợi ý");
      return;
    }

    setLoading(true);
    try {
      const pid =
        typeof selectedPatient.id === "string" &&
        /^\d+$/.test(selectedPatient.id)
          ? Number(selectedPatient.id)
          : selectedPatient.id;

      const payload = { patientId: pid };
      const res = await api.post("/test-orders", payload, {
        headers: { "Content-Type": "application/json" },
        validateStatus: null,
      });

      if (res && res.status >= 200 && res.status < 300) {
        showSuccess("Tạo Test Order thành công");
        if (onSave) onSave(res.data);
        onClose();
      } else {
        showError(`Server trả về ${res?.status}`);
        const backendMsg =
          res?.data?.details?.join?.(", ") ||
          res?.data?.message ||
          JSON.stringify(res?.data);
        if (backendMsg && backendMsg !== "{}") showError(backendMsg);
      }
    } catch (err) {
      console.error("Add patient error:", err);
      const msg =
        err?.response?.data?.details?.join?.(", ") ||
        err?.response?.data?.message ||
        JSON.stringify(err?.response?.data) ||
        "Không thể thêm bệnh nhân, vui lòng kiểm tra lại.";
      try {
        const formatted = formatErrorMessage
          ? formatErrorMessage(err?.response?.data)
          : null;
        if (formatted) showError(formatted);
        else showError(msg);
      } catch {
        showError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onDocClick = (ev) => {
      if (!ev.target.closest) return;
      const insideInput = ev.target.closest("input");
      const insideList = ev.target.closest("[data-patient-list]");
      if (!insideInput && !insideList) {
        setPatientList([]);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[50vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Plus size={22} /> Tạo Test Order
          </h3>
          <button
            type="button"
            onClick={onClose} // <--- dùng hàm này để đóng modal
            className="hover:bg-blue-700 p-2 rounded-full"
            aria-label="Đóng"
          >
            <X className="w-7 h-7 text-white" />
          </button>
        </div>

        {/* Body */}
        <div
          className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50"
          style={{ maxHeight: "calc(50vh - 50px)" }}
        >
          {/* Patient input & suggestion */}
          <div className="relative">
            <label className="block text-sm font-semibold mb-1">
              Patient *
            </label>
            <input
              type="text"
              value={patientSearch}
              onChange={handlePatientChange}
              onKeyDown={handleKeyDown}
              required
              className={inputClass}
              placeholder="Nhập tên bệnh nhân, số điện thoại hoặc email để tìm kiếm..."
              aria-autocomplete="list"
              aria-controls="patient-listbox"
              aria-expanded={patientList.length > 0}
            />

            {searching && (
              <div className="absolute right-3 top-9 text-xs text-gray-500">
                Đang tìm...
              </div>
            )}

            {patientList.length > 0 && (
              <ul
                id="patient-listbox"
                data-patient-list
                ref={listRef}
                role="listbox"
                className="absolute z-10 bg-white border border-gray-300 w-full max-h-80 overflow-y-auto rounded shadow mt-1"
              >
                {patientList.map((p, idx) => (
                  <li
                    key={p.id ?? idx}
                    role="option"
                    aria-selected={highlightIndex === idx}
                    onClick={() => handleSelectPatient(p)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`px-4 py-2 cursor-pointer flex justify-between items-center ${
                      highlightIndex === idx ? "bg-blue-50" : "hover:bg-blue-50"
                    }`}
                  >
                    <div>
                      <div className="font-medium">{p.fullName || "—"}</div>
                      <div className="text-xs text-gray-500">
                        {p.phone || "-"} {p.age ? `• ${p.age}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{p.id}</div>
                  </li>
                ))}
              </ul>
            )}

            {!searching && noResults && patientSearch.length >= 2 && (
              <div className="absolute z-10 bg-white border border-gray-300 w-full rounded shadow mt-1 px-4 py-2 text-sm text-gray-600 flex flex-col gap-2">
                <span>Không tìm thấy bệnh nhân phù hợp</span>
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 px-4 h-10 font-semibold rounded transition-colors whitespace-nowrap"
                >
                  <Plus className="h-5 w-5" /> Thêm bệnh nhân
                </button>
              </div>
            )}
          </div>

          {/* Selected patient info */}
          {selectedPatient && (
            <div className="mt-4 p-4 border rounded bg-white shadow-sm space-y-2">
              <p>
                <strong>Full Name:</strong> {selectedPatient.fullName}
              </p>
              <p>
                <strong>Phone:</strong> {selectedPatient.phone || "-"}
              </p>
              <p>
                <strong>Age:</strong> {selectedPatient.age || "-"}
              </p>
              <p>
                <strong>Gender:</strong> {selectedPatient.gender || "-"}
              </p>
              <p>
                <strong>Address:</strong> {selectedPatient.address || "-"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border rounded hover:bg-gray-50 font-semibold"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Tạo Order"}
          </button>
        </div>
      </form>
      {showAddPatientModal && (
        <AddPatient
          onClose={() => setShowAddPatientModal(false)}
          onCreated={(newPatient) => {
            handleSelectPatient(newPatient); // chọn bệnh nhân vừa tạo
            setShowAddPatientModal(false);
          }}
        />
      )}
    </div>
  );
}
