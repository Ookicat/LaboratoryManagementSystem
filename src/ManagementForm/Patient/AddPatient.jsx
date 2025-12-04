import React, { useState } from "react";
import api from "../../API/Axios.jsx";
import { showSuccess, showError } from "../../components/Toast.jsx";

const AddPatient = ({ onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchInfo, setSearchInfo] = useState("");
  const [userId, setUserId] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    phoneNumber: "",
    email: "",
    identifyNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toYYYYMMDD = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (!isNaN(d)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  };

  const toMMddyyyy = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (!isNaN(d)) {
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    return "";
  };

  const handleSearchByPhone = async () => {
    const phone = (searchPhone || formData.phoneNumber || "").trim();
    if (!phone) {
      setSearchInfo("Vui lòng nhập số điện thoại để tìm kiếm");
      return;
    }
    if (!/^0\d{9,14}$/.test(phone)) {
      setSearchInfo(
        "Số điện thoại không hợp lệ. Bắt đầu bằng 0, 10-15 chữ số."
      );
      return;
    }

    setSearchLoading(true);
    setSearchInfo("");
    setUserId(null);

    try {
      const res = await api.get("/patients/check-user", {
        params: { phoneNumber: phone },
      });

      if (res.status === 204 || !res.data) {
        setSearchInfo("Không tìm thấy user với số này.");
        return;
      }

      const p = res.data;
      setFormData((prev) => ({
        ...prev,
        fullName: p.fullName ?? p.name ?? prev.fullName,
        dateOfBirth: toYYYYMMDD(p.dateOfBirth) ?? prev.dateOfBirth,
        gender: p.gender ?? prev.gender,
        address: p.address ?? prev.address,
        phoneNumber: p.phoneNumber ?? phone ?? prev.phoneNumber,
        email: p.email ?? prev.email,
        identifyNumber:
          p.identifyNumber ?? p.identityNumber ?? prev.identifyNumber,
      }));

      if (p.userId) setUserId(p.userId);
      setSearchInfo("Tìm thấy user — đã điền thông tin.");
    } catch (err) {
      console.error("Check-user error:", err);
      if (err?.response?.status === 204) {
        setSearchInfo("Không tìm thấy user với số này.");
      } else {
        setSearchInfo("Lỗi khi tìm kiếm, vui lòng thử lại.");
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.fullName?.trim()) {
      showError("Vui lòng nhập họ và tên.");
      setLoading(false);
      return;
    }
    if (!formData.phoneNumber?.trim()) {
      showError("Vui lòng nhập số điện thoại.");
      setLoading(false);
      return;
    }
    if (!formData.dateOfBirth) {
      showError("Vui lòng chọn ngày sinh.");
      setLoading(false);
      return;
    }
    if (!formData.identifyNumber?.trim()) {
      showError("Vui lòng nhập số CCCD/CMND (identifyNumber).");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName,
        dateOfBirth: toMMddyyyy(formData.dateOfBirth),
        gender: formData.gender,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        identifyNumber: formData.identifyNumber,
      };

      if (userId) payload.userId = userId;

      const res = await api.post("/patients", payload);

      if (res.status >= 200 && res.status < 300) {
        showSuccess("Thêm bệnh nhân thành công!");
        setFormData({
          fullName: "",
          dateOfBirth: "",
          gender: "",
          address: "",
          phoneNumber: "",
          email: "",
          identifyNumber: "",
        });
        setUserId(null);
        setSearchPhone("");
        setSearchInfo("");
        if (onClose) onClose();
        if (onCreated) onCreated(res.data);
      } else {
        showError(`Server trả về ${res.status}`);
      }
    } catch (err) {
      console.error("Add patient error:", err);
      const msg =
        err?.response?.data?.details?.join?.(", ") ||
        err?.response?.data?.message ||
        JSON.stringify(err?.response?.data) ||
        "Không thể thêm bệnh nhân, vui lòng kiểm tra lại.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full md:w-[900px] mx-4 p-0 overflow-y-auto max-h-[90vh] relative">
        <div className="bg-blue-600 text-white px-6 py-5 rounded flex items-center gap-3 relative">
          <div className=" p-2 rounded">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.121 17.804A3 3 0 017 17h10a3 3 0 011.879.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Thêm Bệnh nhân Mới</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <div className="rounded border border-blue-100 bg-blue-50 p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-blue-700 mb-1">
                  Tìm user theo SĐT
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="tel"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="0901234567"
                    className="flex-1 px-4 py-3 rounded border border-blue-100 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSearchByPhone}
                    disabled={searchLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    {searchLoading ? "Đang..." : "Tìm"}
                  </button>
                </div>
                {searchInfo && (
                  <p className="text-sm text-gray-700 mt-2">{searchInfo}</p>
                )}
                {userId && (
                  <p className="text-sm text-green-700 mt-1">
                    Linked userId: {userId}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Họ và tên *</label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="border p-2 rounded"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Ngày sinh *</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="border p-2 rounded"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Giới tính</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="border p-2 rounded"
            >
              <option value="">Chọn</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Số điện thoại *</label>
            <input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="border p-2 rounded"
              placeholder="0901234567"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Số CCCD/CMND *</label>
            <input
              name="identifyNumber"
              value={formData.identifyNumber}
              onChange={handleChange}
              required
              className="border p-2 rounded"
              placeholder="123456789012"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              className="border p-2 rounded"
              placeholder="example@mail.com"
            />
          </div>

          <div className="col-span-2">
            <label className="font-semibold mb-1">Địa chỉ</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="border p-2 rounded w-full"
              placeholder="123 Đường ABC"
            />
          </div>

          <div className="col-span-2 flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Đang thêm..." : "Thêm Bệnh nhân"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
