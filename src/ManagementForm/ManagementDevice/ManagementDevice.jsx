import React, { useState, useMemo } from "react";
import Sidebar from "../../components/SideBar"; // Giả sử component này đã có sẵn

// --- ICONS (Dùng SVG trực tiếp để không phụ thuộc thư viện ngoài) ---
const Icons = {
  Search: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  Filter: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  ),
  Plus: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  ),
  Wrench: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      />
    </svg>
  ),
  Edit: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  ),
  Trash: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
  Device: () => (
    <svg
      className="w-6 h-6 text-blue-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
      />
    </svg>
  ),
  CheckCircle: () => (
    <svg
      className="w-6 h-6 text-green-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Alert: () => (
    <svg
      className="w-6 h-6 text-red-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  Clock: () => (
    <svg
      className="w-6 h-6 text-yellow-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

// --- DATA & CONFIG ---
const DEVICE_STATUSES = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Hoạt động tốt", value: "active" },
  { label: "Cần bảo trì", value: "maintenance" },
  { label: "Đang sửa chữa", value: "fixing" },
  { label: "Có vấn đề", value: "broken" },
];

const DEVICE_TYPES = [
  { label: "Tất cả loại", value: "" },
  { label: "Máy ly tâm", value: "centrifuge" },
  { label: "Tủ bảo quản", value: "storage" },
  { label: "Máy xét nghiệm", value: "analyzer" },
];

function mockDevices() {
  return [
    {
      id: "D001",
      code: "TB-0001",
      name: "Máy ly tâm",
      type: "centrifuge",
      status: "maintenance",
      location: "Phòng 1",
      manufacturer: "Sysmex",
      model: "Model-462",
      serial: "SN87269",
      lastMaintenance: "21/3/2024",
      nextMaintenance: "11/5/2024",
      usageCount: 433,
      description: "Máy ly tâm tốc độ cao.",
      history: [
        {
          id: 1,
          title: "Bảo trì định kỳ tháng 1",
          date: "15/1/2024",
          status: "Hoàn thành",
          tech: "Nguyễn Văn A",
        },
        {
          id: 2,
          title: "Bảo trì định kỳ tháng 2",
          date: "15/2/2024",
          status: "Hoàn thành",
          tech: "Nguyễn Văn A",
        },
      ],
    },
    {
      id: "D002",
      code: "TB-0002",
      name: "Tủ bảo quản mẫu",
      type: "storage",
      status: "maintenance",
      location: "Phòng 3",
      manufacturer: "Roche",
      model: "Model-734",
      serial: "SN14014",
      lastMaintenance: "9/2/2024",
      nextMaintenance: "5/4/2024",
      usageCount: 583,
      description: "Tủ âm sâu -80 độ.",
      history: [],
    },
    {
      id: "D003",
      code: "TB-0003",
      name: "Máy xét nghiệm nước tiểu",
      type: "analyzer",
      status: "fixing",
      location: "Phòng 2",
      manufacturer: "Roche",
      model: "Model-366",
      serial: "SN58507",
      lastMaintenance: "4/3/2024",
      nextMaintenance: "26/6/2024",
      usageCount: 1064,
      description: "Đang chờ linh kiện thay thế.",
      history: [],
    },
    {
      id: "D004",
      code: "TB-0004",
      name: "Máy đông máu",
      type: "analyzer",
      status: "active",
      location: "Phòng 1",
      manufacturer: "Roche",
      model: "Model-416",
      serial: "SN99999",
      lastMaintenance: "10/3/2024",
      nextMaintenance: "10/6/2024",
      usageCount: 120,
      description: "Hoạt động ổn định.",
      history: [],
    },
    {
      id: "D005",
      code: "TB-0005",
      name: "Máy đông máu",
      type: "analyzer",
      status: "active",
      location: "Phòng 1",
      manufacturer: "Beckman Coulter",
      model: "Model-918",
      serial: "SN88888",
      lastMaintenance: "12/3/2024",
      nextMaintenance: "12/6/2024",
      usageCount: 90,
      description: "",
      history: [],
    },
  ];
}

const getStatusConfig = (status) => {
  switch (status) {
    case "active":
      return {
        label: "Hoạt động tốt",
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
      };
    case "maintenance":
      return {
        label: "Cần bảo trì",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-200",
      };
    case "fixing":
      return {
        label: "Đang sửa chữa",
        bg: "bg-orange-100",
        text: "text-orange-700",
        border: "border-orange-200",
      };
    case "broken":
      return {
        label: "Có vấn đề",
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
      };
    default:
      return {
        label: "Không xác định",
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-200",
      };
  }
};

// --- COMPONENTS ---

// 1. Stats Card Component
const StatCard = ({ icon: Icon, title, count, type }) => {
  let colors = "";
  if (type === "blue") colors = "bg-blue-50 text-blue-600";
  if (type === "green") colors = "bg-green-50 text-green-600";
  if (type === "yellow") colors = "bg-yellow-50 text-yellow-600";
  if (type === "red") colors = "bg-red-50 text-red-600";

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
      </div>
      <div className={`p-3 rounded-full ${colors}`}>
        <Icon />
      </div>
    </div>
  );
};

// 2. Main Page
export default function ManagementDevice() {
  const [devices, setDevices] = useState(mockDevices());
  const [filter, setFilter] = useState({ search: "", status: "", type: "" });
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editDevice, setEditDevice] = useState(null);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: devices.length,
      active: devices.filter((d) => d.status === "active").length,
      maintenance: devices.filter(
        (d) => d.status === "maintenance" || d.status === "fixing"
      ).length,
      broken: devices.filter((d) => d.status === "broken").length,
    };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchesName =
        d.name.toLowerCase().includes(filter.search.trim().toLowerCase()) ||
        d.code.toLowerCase().includes(filter.search.trim().toLowerCase()) ||
        d.serial.toLowerCase().includes(filter.search.trim().toLowerCase());
      const matchesStatus = !filter.status || d.status === filter.status;
      const matchesType = !filter.type || d.type === filter.type;
      return matchesName && matchesStatus && matchesType;
    });
  }, [devices, filter]);

  // Handlers
  const handleOpenDetail = (device) => {
    setSelectedDevice(device);
    setShowDetail(true);
  };
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedDevice(null);
  };
  const handleOpenForm = (device = null) => {
    setEditDevice(device);
    setShowForm(true);
  };
  const handleCloseForm = () => {
    setShowForm(false);
    setEditDevice(null);
  };
  const handleFormSubmit = (data) => {
    // Logic save data (mock)
    if (editDevice) {
      setDevices((prev) =>
        prev.map((d) => (d.id === editDevice.id ? { ...d, ...data } : d))
      );
    } else {
      setDevices((prev) => [
        ...prev,
        { ...data, id: `D${prev.length + 1}`, history: [] },
      ]);
    }
    handleCloseForm();
  };
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) {
      setDevices((prev) => prev.filter((d) => d.id !== id));
    }
  };

  return (
    // FIX LAYOUT: Dùng Flexbox + h-screen + overflow-hidden để khóa toàn trang
    <div className="flex bg-gray-50 min-h-screen w-full h-screen overflow-hidden font-sans">
      {/* Sidebar: Để nó tự nhiên, không fix cứng width */}
      <Sidebar />

      {/* MAIN CONTENT: flex-1 để tự động chiếm hết chỗ trống + overflow-y-auto để cuộn */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-8 relative">
        {/* Container chính */}
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Quản lý thiết bị
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Theo dõi và bảo trì thiết bị trong phòng lab
            </p>
          </div>
          <button
            onClick={() => handleOpenForm(null)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Icons.Plus /> Thêm thiết bị
          </button>
        </div>
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            title="Tổng thiết bị"
            count={stats.total}
            icon={Icons.Device}
            type="blue"
          />
          <StatCard
            title="Hoạt động tốt"
            count={stats.active}
            icon={Icons.CheckCircle}
            type="green"
          />
          <StatCard
            title="Cần bảo trì"
            count={stats.maintenance}
            icon={Icons.Clock}
            type="yellow"
          />
          <StatCard
            title="Có vấn đề"
            count={stats.broken}
            icon={Icons.Alert}
            type="red"
          />
        </div>
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center w-full mb-4">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Search />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, tên, số serial..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <select
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            {DEVICE_STATUSES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {/* Device Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4 flex-1 content-start">
          {filteredDevices.map((device) => {
            const status = getStatusConfig(device.status);
            let deviceImg = null;
            if (device.name === "Máy ly tâm") {
              deviceImg =
                "https://th.bing.com/th/id/R.cd1aa2ceb848b6c4083577e47c071c87?rik=MUIKlnDEwOfqdg&riu=http%3a%2f%2fwww.asinteg.com.ar%2fw%2fimages%2fproductos%2fsysmex-xn2000.png&ehk=JVyE36w%2fxCF0VNO5nQCzbUtFeo6O411KfKu40mdXXyk%3d&risl=&pid=ImgRaw";
            } else if (device.name === "Máy đông máu") {
              deviceImg =
                "https://media.beckmancoulter.com/-/media/diagnostics/products/hematology/dxh-900/images/dxh-900.jpg?h=480&w=563&la=en&hash=256123A5ECEFE2FAF29F0ACDD5D9288E3AB5D71D";
            } else if (device.name === "Máy xét nghiệm nước tiểu") {
              deviceImg =
                "https://mqst.ru/t/MbKaTQK-eHL_lyue2d37FtJKg80=/0x1040/uploads/2021/08/ruby-2f.png";
            } else if (device.name === "Tủ bảo quản mẫu") {
              deviceImg =
                "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Ultra-Low_Temperature_Freezer.jpg/320px-Ultra-Low_Temperature_Freezer.jpg";
            }
            return (
              <div
                key={device.id}
                className="bg-white rounded-xl p-4 shadow-md border flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center bg-blue-50 rounded-lg">
                      <img
                        src={deviceImg}
                        alt={device.name}
                        className="w-20 h-20 object-contain rounded-lg"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-base">
                        {device.name}
                      </h3>
                      <p className="text-gray-500 text-xs font-medium">
                        {device.code}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <InfoRow label="Hãng" value={device.manufacturer} />
                  <InfoRow label="Model" value={device.model} />
                  <InfoRow label="Serial" value={device.serial} />
                  <InfoRow label="Vị trí" value={device.location} />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Trạng thái:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
                <hr className="border-gray-100 my-3" />
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Bảo trì gần nhất:</span>
                    <span className="text-gray-700 font-medium">
                      {device.lastMaintenance}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Bảo trì tiếp theo:</span>
                    <span className="text-orange-600 font-bold">
                      {device.nextMaintenance}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Số lần sử dụng:</span>
                    <span className="text-gray-700 font-medium">
                      {device.usageCount}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleOpenDetail(device)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded text-sm font-medium flex items-center justify-center gap-1 transition"
                  >
                    <Icons.Wrench /> Bảo trì
                  </button>
                  <button
                    onClick={() => handleOpenForm(device)}
                    className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-600 transition"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-600 transition"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredDevices.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              Không tìm thấy thiết bị nào.
            </div>
          )}
        </div>
        {/* MODAL: Maintenance / Details */}
        {showDetail && selectedDevice && (
          <Modal onClose={handleCloseDetail} title="Lịch sử bảo trì">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: Info */}
              <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-2">
                    {selectedDevice.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {selectedDevice.code}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bảo trì gần nhất</span>
                      <span className="font-medium text-gray-800">
                        {selectedDevice.lastMaintenance}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bảo trì tiếp theo</span>
                      <span className="font-medium text-orange-600">
                        {selectedDevice.nextMaintenance}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: History & Form */}
              <div className="w-full md:w-2/3">
                <h4 className="font-bold text-gray-800 mb-3">
                  Lịch sử bảo trì
                </h4>
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                  {selectedDevice.history &&
                  selectedDevice.history.length > 0 ? (
                    selectedDevice.history.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-100 rounded-lg p-3 flex justify-between items-center shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {item.title}
                          </p>
                          <div className="flex gap-2 text-xs text-gray-500 mt-1">
                            <span>Ngày: {item.date}</span>
                            <span>•</span>
                            <span>Kỹ thuật viên: {item.tech}</span>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                          {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm italic">
                      Chưa có lịch sử bảo trì.
                    </div>
                  )}
                  {/* Mock items for UI demo based on image */}
                  <div className="border border-gray-100 rounded-lg p-3 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        Bảo trì định kỳ tháng 1
                      </p>
                      <div className="flex gap-2 text-xs text-gray-500 mt-1">
                        <span>Ngày: 15/1/2024</span>
                        <span>•</span>
                        <span>Kỹ thuật viên: Nguyễn Văn A</span>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                      Hoàn thành
                    </span>
                  </div>
                </div>
                <h4 className="font-bold text-gray-800 mb-3">
                  Lên lịch bảo trì mới
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ngày bảo trì
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Kỹ thuật viên
                    </label>
                    <select className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Nguyễn Văn A</option>
                      <option>Trần Văn B</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nội dung bảo trì
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Mô tả nội dung bảo trì..."
                  ></textarea>
                </div>
                <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700">
                  Xác nhận lên lịch
                </button>
              </div>
            </div>
          </Modal>
        )}
        {/* MODAL: Add/Edit Device */}
        {showForm && (
          <Modal
            onClose={handleCloseForm}
            title={editDevice ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}
          >
            <DeviceForm
              initial={editDevice}
              onCancel={handleCloseForm}
              onSubmit={handleFormSubmit}
            />
          </Modal>
        )}
      </main>
    </div>
  );
}

// --- SUB COMPONENTS (Giữ nguyên) ---

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}:</span>
    <span className="text-gray-800 font-medium text-right truncate max-w-[60%]">
      {value}
    </span>
  </div>
);

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl max-w-3xl md:max-w-4xl w-full max-h-[90vh] overflow-auto flex flex-col">
        {title && (
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-600">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-800 text-xl leading-none"
            >
              &times;
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function DeviceForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    code: initial?.code || "",
    name: initial?.name || "",
    type: initial?.type || "",
    status: initial?.status || "active",
    location: initial?.location || "",
    manufacturer: initial?.manufacturer || "",
    model: initial?.model || "",
    serial: initial?.serial || "",
    nextMaintenance: initial?.nextMaintenance || "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Mã thiết bị"
          name="code"
          value={form.code}
          onChange={handleChange}
          required
        />
        <FormInput
          label="Tên thiết bị"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Loại thiết bị
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Chọn loại</option>
            {DEVICE_TYPES.slice(1).map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Trạng thái
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {DEVICE_STATUSES.slice(1).map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          label="Vị trí"
          name="location"
          value={form.location}
          onChange={handleChange}
        />
        <FormInput
          label="Nhà sản xuất"
          name="manufacturer"
          value={form.manufacturer}
          onChange={handleChange}
        />
        <FormInput
          label="Model"
          name="model"
          value={form.model}
          onChange={handleChange}
        />
        <FormInput
          label="Serial"
          name="serial"
          value={form.serial}
          onChange={handleChange}
        />
        <FormInput
          label="Bảo trì tiếp theo"
          name="nextMaintenance"
          value={form.nextMaintenance}
          onChange={handleChange}
          placeholder="dd/mm/yyyy"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-medium"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded font-medium"
        >
          Lưu thiết bị
        </button>
      </div>
    </form>
  );
}

const FormInput = ({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
    />
  </div>
);
