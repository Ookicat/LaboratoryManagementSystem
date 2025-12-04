import React from "react";

import {
  Plus, // Icon cho "Đăng ký mẫu mới"
  FileText, // Icon cho "Tạo báo cáo"
  Download, // Icon cho "Xuất dữ liệu"
  Upload, // Icon cho "Nhập dữ liệu"
  CheckCircle2, // Icon cho "Hoàn thành"
  AlertCircle, // Icon cho "Cần chú ý" (ví dụ)
  BarChart2, // Icon cho "Tổng số" (ví dụ)
  Clock, // Icon cho "Đang chờ" (ví dụ)
} from "lucide-react";
import Sidebar from "../components/SideBar";

/* ======================================================================
  Component Card Thống kê (Nội bộ)
  Đây là component cho 4 ô: Tổng số mẫu, Đang chờ xử lý, v.v.
  ======================================================================
*/
const StatsCard = ({ title, value, change, changeType, icon }) => {
  const isPositive = changeType === "positive";
  const changeColor = isPositive
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700";

  // Icon mặc định nếu không truyền vào
  const Icon = icon || BarChart2;

  return (
    <div className="bg-white p-5 rounded-xl shadow-md transition-all hover:shadow-lg">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${changeColor}`}
        >
          {change}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Icon
          className={`w-6 h-6 ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        />
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

/* ======================================================================
  Component Nút Thao tác nhanh (Nội bộ)
  Đây là component cho 4 nút màu xanh: Đăng ký, Tạo báo cáo, v.v.
  ======================================================================
*/
const ActionCard = ({ title, description, icon }) => {
  const Icon = icon;
  return (
    <button className="bg-blue-600 text-white p-5 rounded-xl shadow-md text-left transition-all hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg">
      <Icon className="w-8 h-8 mb-3" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-blue-100">{description}</p>
    </button>
  );
};

/* ======================================================================
  Component Item Hoạt động (Nội bộ)
  Đây là component cho các mục trong "Hoạt động gần đây"
  ======================================================================
*/
const ActivityItem = ({ title, description, user, time, status }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{`${description} • BS. ${user} • ${time}`}</p>
        </div>
      </div>
      <span className="text-sm font-medium text-green-600">{status}</span>
    </div>
  );
};

/* ======================================================================
  Component Trang chủ Dashboard
  Đây là component chính bạn sẽ import vào router
  ======================================================================
*/
const DashboardHomePage = () => {
  const userName = "Dr. Nguyễn Văn A"; // Bạn sẽ lấy từ context hoặc state

  return (
    // ✨ Đây là phần nội dung chính (màu nền xám)
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* --- Vùng Chào mừng --- */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Xin chào, {userName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Chào mừng bạn đến với Hệ thống Quản lý Phòng Lab. Hôm nay là
          29/10/2025
        </p>
      </div>

      {/* --- Vùng Thống kê (Stats) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng số mẫu hôm nay"
          value="147"
          change="+12%"
          changeType="positive"
          icon={BarChart2}
        />
        <StatsCard
          title="Đang chờ xử lý"
          value="23"
          change="-5%"
          changeType="negative"
          icon={Clock}
        />
        <StatsCard
          title="Hoàn thành"
          value="124"
          change="+8%"
          changeType="positive"
          icon={CheckCircle2}
        />
        <StatsCard
          title="Cần chú ý"
          value="7"
          change="+2"
          changeType="negative"
          icon={AlertCircle}
        />
      </div>

      {/* --- Vùng Thao tác nhanh --- */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard
            title="Đăng ký mẫu mới"
            description="Thêm mẫu xét nghiệm mới"
            icon={Plus}
          />
          <ActionCard
            title="Tạo báo cáo"
            description="Tạo báo cáo kết quả"
            icon={FileText}
          />
          <ActionCard
            title="Xuất dữ liệu"
            description="Xuất dữ liệu thống kê"
            icon={Download}
          />
          <ActionCard
            title="Nhập dữ liệu"
            description="Nhập dữ liệu từ file"
            icon={Upload}
          />
        </div>
      </div>

      {/* --- Vùng Hoạt động gần đây --- */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Hoạt động gần đây
        </h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Bạn sẽ dùng .map() để lặp qua dữ liệu hoạt động thật
           */}
          <ActivityItem
            title="Hoàn thành xét nghiệm Mẫu #LB-2024-001"
            description="Xét nghiệm máu tổng quát"
            user="Nguyễn Thị B"
            time="5 phút trước"
            status="Hoàn thành"
          />
          <ActivityItem
            title="Hoàn thành xét nghiệm Mẫu #LB-2024-000"
            description="Xét nghiệm nước tiểu"
            user="Trần Văn C"
            time="10 phút trước"
            status="Hoàn thành"
          />
          <ActivityItem
            title="Mẫu mới #LB-2024-002"
            description="Xét nghiệm COVID-19"
            user="Lê Văn D"
            time="1 giờ trước"
            status="Đã nhận mẫu"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardHomePage;
