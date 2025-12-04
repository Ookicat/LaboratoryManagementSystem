import React, { useEffect, useState } from "react";
import { User, Lock, Camera, RefreshCw } from "lucide-react";
import Sidebar from "../components/SideBar";
import api from "../API/Axios";
import { useNavigate } from "react-router-dom";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const ManagementProfile = () => {
  const navigate = useNavigate();
  const stored = readStoredUser() || {};
  const currentUser = stored.user || stored;
  const userId = currentUser?.id || currentUser?.userId || null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    age: "",
    address: "",
    identifyNumber: "",
    dateOfBirth: "",
    role: "",
    avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  });

  useEffect(() => {
    async function load() {
      if (!userId) return;
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/users/${userId}`);
        const d = res?.data || {};
        setForm((f) => ({
          ...f,
          fullName: d.fullName || d.name || d.username || "",
          email: d.email || "",
          phoneNumber: d.phoneNumber || "",
          gender: d.gender || "",
          age: d.age || "",
          identifyNumber: d.identifyNumber || "",
          address: d.address || "",
          dateOfBirth: d.dateOfBirth || "",
          role: d.role || "",
          avatar: d.avatar || f.avatar,
        }));
        const serverUpdated = d.updatedAt || d.modifiedAt || d.lastModified;
        if (serverUpdated) {
          try {
            const dt = new Date(serverUpdated);
            if (!isNaN(dt.getTime())) setLastUpdated(dt);
          } catch (e) {
            // ignore parse errors
          }
        }
      } catch (err) {
        console.error("Load profile error:", err);
        setError("Không thể tải thông tin người dùng.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSave = async () => {
    setError("");
    setMessage("");
    if (!form.fullName || !form.fullName.trim()) {
      setError("Họ và tên không được để trống.");
      return;
    }
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Email không đúng định dạng.");
      return;
    }
    if (form.phoneNumber && !/^[0-9]{10,15}$/.test(form.phoneNumber)) {
      setError("Số điện thoại không đúng định dạng (10-15 chữ số).");
      return;
    }

    if (!userId) {
      setError("Không xác định được người dùng.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        gender: form.gender,
        age: form.age,
        address: form.address,
        dateOfBirth: form.dateOfBirth,
      };
      const res = await api.patch(`/users/${userId}`, payload);
      setMessage("Cập nhật thông tin thành công.");
      const updated = res?.data || {};
      setForm((f) => ({ ...f, ...updated }));

      const serverUpdated =
        updated.updatedAt || updated.modifiedAt || updated.lastModified;
      if (serverUpdated) {
        try {
          const dt = new Date(serverUpdated);
          if (!isNaN(dt.getTime())) setLastUpdated(dt);
          else setLastUpdated(new Date());
        } catch (e) {
          setLastUpdated(new Date());
        }
      } else {
        setLastUpdated(new Date());
      }

      setTimeout(() => {
        navigate("/management/profile");
      }, 700);
    } catch (err) {
      console.error("Save profile error:", err);
      const srv = err?.response?.data;
      if (srv) setError(srv.message || JSON.stringify(srv));
      else setError("Lỗi khi lưu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestReset = () => {
    navigate("/forgot-password");
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "";

    const birthDate = new Date(dobString);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    const dayDifference = today.getDate() - birthDate.getDate();
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age--;
    }

    return age;
  };

  return (
    // FIX 1: Layout Wrapper
    <div className="flex h-screen overflow-hidden bg-gray-50 w-full">
      {/* FIX 2: Sidebar flex item */}
      <Sidebar className="flex-shrink-0 transition-all duration-300" />

      {/* FIX 3: Main content container with overflow handling */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 relative">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hồ sơ cá nhân
              </h1>
              <div className="text-sm text-gray-500 mt-1">
                Bạn đang đăng nhập với tên:{" "}
                <span className="font-semibold text-gray-700">
                  {currentUser?.fullName || currentUser?.username || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center shadow-sm">
              <span className="font-medium mr-2">Lỗi:</span> {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center shadow-sm">
              <span className="font-medium mr-2">Thành công:</span> {message}
            </div>
          )}

          {/* Profile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Card: Avatar & Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center h-fit">
              <div className="relative group">
                <img
                  src={form.avatar}
                  alt="avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-50 shadow-sm"
                />
                <button
                  className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-transform transform hover:scale-105"
                  title="Thay avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900 text-center">
                {form.fullName || "Chưa có tên"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{form.email}</p>

              <div className="w-full mt-6 border-t pt-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-500">Vai trò</span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                    {form.role || "N/A"}
                  </span>
                </div>
                {lastUpdated && (
                  <p className="text-xs text-gray-400 text-center mt-4">
                    Cập nhật: {lastUpdated.toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                {form.fullName || "-"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{form.email}</p>
              {lastUpdated && (
                <p className="text-xs text-gray-400 mt-2">
                  Cập nhật lần cuối: {lastUpdated.toLocaleString("vi-VN")}
                </p>
              )}
            </div>

            {/* Right Card: Details Form */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Thông tin chi tiết
              </h4>

              {loading && (
                <div className="text-center py-4 text-gray-500">
                  Đang tải thông tin...
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    placeholder="Nhập họ tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    placeholder="example@mail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CCCD / CMND
                  </label>
                  <input
                    name="identifyNumber"
                    value={form.identifyNumber || ""}
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    value={form.gender || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sinh
                    </label>
                    <input
                      name="dateOfBirth"
                      value={form.dateOfBirth || ""}
                      type="date"
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tuổi
                    </label>
                    <input
                      name="age"
                      value={calculateAge(form.dateOfBirth)}
                      disabled
                      className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed text-center"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    name="address"
                    value={form.address || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    placeholder="Nhập địa chỉ chi tiết"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white font-medium py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  onClick={handleRequestReset}
                  disabled={resetting}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagementProfile;
