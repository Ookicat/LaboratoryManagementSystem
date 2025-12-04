import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { showSuccess, showError } from "../../components/Toast";
import api from "../../API/Axios";
import Message, { formatErrorMessage } from "../../components/Message";

export default function EditPatient({ patient, onClose, onUpdated }) {
  if (!patient) return null;

  const convertToInputDate = (value) => {
    if (!value) return "";

    // Nếu đã ở dạng yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    // Nếu ở dạng MM/dd/yyyy -> chuyển về yyyy-MM-dd
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
      const [m, d, y] = value.split("/");
      const mm = String(m).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      return `${y}-${mm}-${dd}`;
    }

    // Fallback: thử parse Date và format
    const parsed = new Date(value);
    if (!isNaN(parsed)) {
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const dd = String(parsed.getDate()).padStart(2, "0");
      const y = parsed.getFullYear();
      return `${y}-${mm}-${dd}`;
    }

    return "";
  };

  const [apiError, setApiError] = useState(null);

  const [formData, setFormData] = useState({
    name: patient.fullName ?? "",
    gender: patient.gender ?? "",
    // convert incoming backend date -> input date (yyyy-MM-dd)
    dob: convertToInputDate(patient.dateOfBirth ?? ""),
    phone: patient.phoneNumber ?? "",
    address: patient.address ?? "",
    email: patient.email ?? "",
  });

  const formatDateToMMDDYYYY = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    if (isNaN(date)) return null;

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const handleSave = async () => {
    try {
      setApiError(null); // clear previous error

      const payload = {
        fullName: formData.name,
        gender: formData.gender,
        email: formData.email,
        address: formData.address,
        phoneNumber: formData.phone,
        dateOfBirth: formatDateToMMDDYYYY(formData.dob),
      };

      await api.patch(`/patients/${patient.id}`, payload);

      showSuccess("Cập nhật thông tin bệnh nhân thành công!");
      onUpdated?.();
      onClose();
    } catch (err) {
      // lấy message hiển thị nhanh + lưu chi tiết vào apiError để Message render
      const msg = formatErrorMessage(err.response?.data || err);
      showError(msg);
      setApiError(err.response?.data || err);
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-2xl w-full max-w-5xl relative overflow-y-auto max-h-[90vh]">
        <div className="bg-blue-600 p-6 text-white rounded flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-white/20 flex items-center justify-center text-xl font-semibold">
              ✏️
            </div>
            <div>
              <h2 className="text-xl font-semibold">Chỉnh sửa Bệnh nhân</h2>
              <p className="text-sm opacity-80"></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Họ và tên"
                value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
              />
              <Select
                label="Giới tính"
                value={formData.gender}
                onChange={(v) => setFormData({ ...formData, gender: v })}
                options={["MALE", "FEMALE"]}
              />
              <Input
                label="Email"
                value={formData.email}
                onChange={(v) => setFormData({ ...formData, email: v })}
              />

              <Input
                label="Địa chỉ"
                value={formData.address}
                onChange={(v) => setFormData({ ...formData, address: v })}
              />
            </div>

            <div className="space-y-4">
              <Input
                label="Ngày sinh"
                type="date"
                value={formData.dob}
                onChange={(v) => setFormData({ ...formData, dob: v })}
              />
              <Input
                label="Số điện thoại"
                value={formData.phone}
                onChange={(v) => setFormData({ ...formData, phone: v })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition"
            >
              <Save className="w-4 h-4" /> Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Input = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      className="w-full border rounded p-3"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm text-gray-700 mb-1">{label}</label>
    <select
      className="w-full border rounded p-3"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">-- Chọn --</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);
