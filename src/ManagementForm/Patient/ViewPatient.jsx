import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  Pill,
  Shield,
  FlaskConical,
  Clock,
} from "lucide-react";

// Helper: Format datetime to readable format
const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (e) {
    return dateString;
  }
};

export default function ViewPatient({ patient, onClose }) {
  const [activeTab, setActiveTab] = useState("info");

  if (!patient) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans text-[15px]">
      <div className="bg-white rounded shadow-2xl overflow-hidden font-sans w-full max-w-5xl relative">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white rounded flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-white/20 flex items-center justify-center text-xl font-semibold">
              {patient.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{patient.fullName}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded shadow-md"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b flex gap-3">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === "info"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            Thông tin
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === "tests"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            Kết quả XN ({patient.testsCount ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === "history"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            Lịch sử (3)
          </button>
        </div>

        {/* Nội dung — chiều cao cố định, cuộn trong */}
        <div className="p-8 min-h-[60vh] max-h-[60vh] overflow-y-auto transition-all duration-300">
          {activeTab === "info" && <PatientInfo patient={patient} />}
          {activeTab === "tests" && (
            <PatientTests tests={patient.tests || []} />
          )}
          {activeTab === "history" && (
            <PatientHistory history={patient.history || []} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   TAB 1: THÔNG TIN CÁ NHÂN
======================================================== */
const PatientInfo = ({ patient }) => (
  <div className="space-y-8">
    <Section
      title={
        <>
          <User className="w-5 h-5 text-blue-600" /> Thông tin cá nhân
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard label="Họ và tên" value={patient.fullName} />

        <InfoCard label="Ngày sinh" value={patient.dateOfBirth} />
        <InfoCard label="Tuổi" value={patient.age} />

        <InfoCard label="Giới tính" value={patient.gender} />

        <InfoCard
          label="Trạng thái"
          value={patient.status}
          color={
            patient.status === "ACTIVE" ? "text-green-600" : "text-red-600"
          }
        />
      </div>
    </Section>

    <Section
      title={
        <>
          <Phone className="w-5 h-5 text-blue-600" /> Thông tin liên hệ
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard label="Điện thoại" value={patient.phoneNumber} />
        <InfoCard
          label={
            <>
              <span className="inline-block mr-1">📧</span>Email
            </>
          }
          value={patient.email}
        />
      </div>
      <br />

      <InfoCard
        label={
          <>
            <span className="inline-block mr-1">📍</span>Địa chỉ
          </>
        }
        value={patient.address}
      />
    </Section>

    {/* Section: 🛡️ Thông tin hệ thống */}
    <Section
      title={
        <>
          <Shield className="w-5 h-5 text-blue-600" /> Thông tin hệ thống
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-gray-500 text-sm font-medium">Ngày tạo</p>
          <p className="text-gray-900 font-semibold text-base">
            {formatDateTime(patient.createdAt)}
          </p>
        </div>
      </div>
    </Section>
  </div>
);

/* ========================================================
   TAB 2: KẾT QUẢ XÉT NGHIỆM
======================================================== */
const PatientTests = ({ tests }) => {
  const mockTests = tests.length
    ? tests
    : [
        {
          id: "XN001",
          name: "Glucose",
          date: "2025-11-03",
          doctor: "Nguyễn Văn B",
          status: "Hoàn thành",
          result: "126 mg/dL",
          reference: "70-100 mg/dL",
          evaluation: "Bất thường",
          machine: "Cobas 6000",
          batch: "RG-2025-001 / LOT-456789",
          note: "Bệnh nhân không nhịn ăn trước xét nghiệm",
        },
        {
          id: "XN002",
          name: "HbA1c",
          date: "2025-11-03",
          doctor: "Trần Thị C",
          status: "Hoàn thành",
          result: "7.2%",
          reference: "4.0-5.6%",
          evaluation: "Bất thường",
          machine: "DCA Vantage",
          batch: "RG-2025-002 / LOT-789012",
        },
      ];

  return (
    <Section
      title={
        <>
          <FlaskConical className="w-5 h-5 text-blue-600" /> Kết quả xét nghiệm
        </>
      }
    >
      <div className="space-y-5">
        {mockTests.map((test) => (
          <div
            key={test.id}
            className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
          >
            <div className="border-l-4 border-amber-500 p-5">
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold text-lg text-gray-800">
                    {test.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {test.date} – {test.doctor}
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded">
                  {test.status}
                </span>
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Kết quả</p>
                  <p className="font-semibold text-gray-800">{test.result}</p>
                </div>
                <div>
                  <p className="text-gray-500">Giá trị tham chiếu</p>
                  <p className="font-semibold text-gray-800">
                    {test.reference}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Đánh giá</p>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded font-medium">
                    {test.evaluation}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Máy xét nghiệm</p>
                  <p className="font-medium text-gray-700">{test.machine}</p>
                </div>
                <div>
                  <p className="text-gray-500">Batch/Lot</p>
                  <p className="font-medium text-gray-700">{test.batch}</p>
                </div>
              </div>

              {/* Ghi chú */}
              {test.note && (
                <div className="mt-4 bg-blue-50 p-3 rounded text-sm text-gray-700 border border-blue-100">
                  <strong className="text-blue-600">Ghi chú:</strong>{" "}
                  {test.note}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

/* ========================================================
   TAB 3: LỊCH SỬ XÉT NGHIỆM
======================================================== */
const PatientHistory = ({ history }) => {
  const mockHistory = history.length
    ? history
    : [
        {
          id: "H001",
          action: "Tạo hồ sơ",
          date: "2025-01-15 09:00:00",
          description: "Tạo hồ sơ bệnh nhân mới",
          email: "admin@lab.com",
          ip: "192.168.1.100",
        },
        {
          id: "H002",
          action: "Xem hồ sơ",
          date: "2025-11-03 14:30:00",
          description: "Xem chi tiết hồ sơ bệnh nhân",
          email: "doctor@lab.com",
          ip: "192.168.1.105",
        },
        {
          id: "H003",
          action: "Xem hồ sơ",
          date: "2025-11-08 12:58:20",
          description: "Xem chi tiết hồ sơ bệnh nhân",
          email: "admin@lab.com",
          ip: "192.168.1.100",
        },
      ];

  return (
    <Section
      title={
        <>
          <Clock className="w-5 h-5 text-blue-600" /> Lịch sử hoạt động
        </>
      }
    >
      <div className="space-y-4">
        {mockHistory.map((h) => (
          <div
            key={h.id}
            className="bg-gray-50 p-4 rounded border border-gray-200 flex items-start justify-between"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{h.action}</p>
                <p className="text-sm text-gray-500">{h.date}</p>
                <p className="text-sm text-gray-700 mt-1">{h.description}</p>
                <a
                  href={`mailto:${h.email}`}
                  className="text-blue-600 text-sm font-medium mt-1 inline-block"
                >
                  {h.email}
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{h.ip}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};

/* ========================================================
   COMPONENT CHUNG
======================================================== */
const InfoCard = ({ label, value, highlight, color }) => (
  <div className="p-4 bg-gray-50 rounded">
    <p className="text-gray-500 text-sm font-medium">{label}</p>
    {highlight ? (
      <span className="bg-red-100 text-red-600 px-3 py-1 rounded inline-block text-sm font-medium">
        {value || "—"}
      </span>
    ) : color ? (
      <span
        className={`px-3 py-1 rounded inline-block text-sm font-medium ${
          value === "ACTIVE"
            ? "bg-green-100 text-green-600"
            : value === "DELETED"
            ? "bg-red-100 text-red-600"
            : color
        }`}
      >
        {value || "—"}
      </span>
    ) : (
      <p className="text-gray-900 font-semibold text-base">{value || "—"}</p>
    )}
  </div>
);

const Section = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-base font-semibold text-blue-800 flex items-center gap-2 mb-2">
      {title}
    </h3>
    <div>{children}</div>
  </div>
);
