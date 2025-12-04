import React, { useEffect, useState, useMemo, useCallback } from "react";
// Import các component biểu đồ từ Recharts
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { FaUser, FaUsers } from "react-icons/fa";
import { ClipboardList, Download, RotateCcw, Shield } from "lucide-react";

import Sidebar from "../../components/SideBar";
import api from "../../API/Axios";
import * as XLSX from "xlsx-js-style";

const COLORS = [
  "#77adeeff",
  "#67eaa2ff",
  "#f36767ff",
  "#f4c671ff",
  "#e471f8ff",
  "#68e4f4ff",
  "#f69577ff",
  "#73fb78ff",
  "#9473f8ff",
  "#eccd68ff",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = data.value;
    const name = data.name;
    const total = payload.reduce(
      (sum, entry) => sum + (entry.payload?.value || 0),
      0
    );
    const percentage = total ? ((value / total) * 100).toFixed(1) : 0;

    return (
      <div className="bg-white p-2 border border-gray-300 shadow-lg text-sm rounded">
        <p className="font-bold text-gray-700">{name}</p>
        <p className="text-gray-600">
          Số lượng: <span className="font-semibold">{value}</span>
        </p>
        <p className="text-gray-600">
          Phần trăm: <span className="font-semibold">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLineAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    let labelPrefix = "";
    if (payload[0].dataKey === "users") labelPrefix = "Tài khoản mới: ";
    else if (payload[0].dataKey === "patients") labelPrefix = "Bệnh nhân mới: ";
    else if (payload[0].dataKey === "testOrders") labelPrefix = "Test Orders: ";

    return (
      <div className="bg-white p-2 border border-gray-300 shadow-lg text-sm rounded">
        <p className="font-bold text-gray-700">{label}</p>
        <p className="text-gray-600">
          {labelPrefix}
          <span className="font-semibold">{value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [roles, setRoles] = useState([]);
  const [testOrders, setTestOrders] = useState([]);
  const [load, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [visibleRoles, setVisibleRoles] = useState({});
  const [visibleStatus, setVisibleStatus] = useState({});

  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportCharts, setExportCharts] = useState({
    role: true,
    status: true,
    month: true,
    patient: true,
    testOrders: true,
  });

  async function fetchAllUsers() {
    let allUsers = [];
    let page = 0;
    let totalPages = 1;
    const size = 10000;

    while (page < totalPages) {
      try {
        const res = await api.get(`/users/?page=${page}&size=${size}`);
        const pageContent =
          res?.data && Array.isArray(res.data.content)
            ? res.data.content
            : Array.isArray(res.data)
            ? res.data
            : [];
        allUsers = allUsers.concat(pageContent || []);
        totalPages =
          res?.data && typeof res.data.totalPages === "number"
            ? res.data.totalPages
            : 1;
        page++;
      } catch (err) {
        console.error("Error fetching users page:", err);
        break;
      }
    }

    return allUsers;
  }

  async function fetchAllPatients() {
    let allPatients = [];
    let page = 0;
    let totalPages = 1;
    const size = 10000;

    while (page < totalPages) {
      try {
        const res = await api.get(`/patients?page=${page}&size=${size}`);
        const pageContent =
          res?.data && Array.isArray(res.data.content)
            ? res.data.content
            : Array.isArray(res.data)
            ? res.data
            : [];
        allPatients = allPatients.concat(pageContent || []);
        totalPages =
          res?.data && typeof res.data.totalPages === "number"
            ? res.data.totalPages
            : 1;
        page++;
      } catch (err) {
        console.error("Error fetching patients page:", err);
        break;
      }
    }

    return allPatients;
  }

  async function fetchAllTestOrder() {
    let allTestOrders = [];
    let page = 0;
    let totalPages = 1;
    const size = 10000;

    while (page < totalPages) {
      try {
        const res = await api.get(`/test-orders?page=${page}&size=${size}`);
        const pageContent =
          res?.data && Array.isArray(res.data.content)
            ? res.data.content
            : Array.isArray(res.data)
            ? res.data
            : [];
        allTestOrders = allTestOrders.concat(pageContent || []);
        totalPages =
          res?.data && typeof res.data.totalPages === "number"
            ? res.data.totalPages
            : 1;
        page++;
      } catch (err) {
        console.error("Error fetching test orders page:", err);
        break;
      }
    }

    return allTestOrders;
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const usersData = await fetchAllUsers();
        const patientsData = await fetchAllPatients();
        const testOrdersData = await fetchAllTestOrder();
        const resRoles = await api.get("/roles/");

        setUsers(usersData);
        setPatients(patientsData);
        setRoles(
          Array.isArray(resRoles?.data?.content)
            ? resRoles.data.content
            : Array.isArray(resRoles?.data)
            ? resRoles.data
            : []
        );
        setTestOrders(testOrdersData);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setUsers([]);
        setPatients([]);
        setRoles([]);
        setTestOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const roleMapById = useMemo(() => {
    const map = {};
    roles.forEach((r) => {
      if (!r) return;
      if (r.id !== undefined && r.id !== null) map[String(r.id)] = r;
    });
    return map;
  }, [roles]);

  const roleMapByCode = useMemo(() => {
    const map = {};
    roles.forEach((r) => {
      if (!r) return;
      const code = r.code || r.name || r.role || r.type;
      if (code) map[String(code).toUpperCase()] = r;
    });
    return map;
  }, [roles]);

  const countUsersByMonth = useCallback((usersArray) => {
    const counts = {};
    usersArray.forEach((user) => {
      if (!user.createdAt) return;
      let dateStr = user.createdAt;
      if (dateStr.includes(" ")) dateStr = dateStr.split(" ")[0];
      let dateObj;
      if (dateStr.includes("T")) {
        dateObj = new Date(dateStr);
      } else {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          const [a, b, c] = parts.map((v) => parseInt(v, 10));
          if (a > 31) dateObj = new Date(a, b - 1, c);
          else dateObj = new Date(c, b - 1, a);
        } else return;
      }
      if (!dateObj || Number.isNaN(dateObj.getTime())) return;
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, []);

  const countPatientsByMonth = useCallback((patientsArray) => {
    const counts = {};
    patientsArray.forEach((patient) => {
      if (!patient.createdAt) return;
      let dateStr = patient.createdAt;
      if (dateStr.includes(" ")) dateStr = dateStr.split(" ")[0];
      let dateObj;
      if (dateStr.includes("T")) dateObj = new Date(dateStr);
      else {
        const parts = dateStr.split("-");
        if (parts.length !== 3) return;
        const [a, b, c] = parts.map((v) => parseInt(v, 10));
        if (a > 31) dateObj = new Date(a, b - 1, c);
        else dateObj = new Date(c, b - 1, a);
      }
      if (!dateObj || Number.isNaN(dateObj.getTime())) return;
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, []);

  const dataUsers = filteredUsers.length > 0 ? filteredUsers : users;
  const dataPatients = useMemo(() => {
    if (!startDate && !endDate) return patients;
    return patients.filter((p) => {
      if (!p.createdAt) return false;
      let patientDate;
      if (p.createdAt.includes("T")) patientDate = new Date(p.createdAt);
      else {
        const parts = p.createdAt.split(" ")[0].split("-");
        if (parts.length !== 3) return false;
        const [a, b, c] = parts.map((v) => parseInt(v, 10));
        if (a > 31) patientDate = new Date(a, b - 1, c);
        else patientDate = new Date(c, b - 1, a);
      }
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start && end) return patientDate >= start && patientDate <= end;
      if (start) return patientDate >= start;
      if (end) return patientDate <= end;
      return true;
    });
  }, [patients, startDate, endDate]);

  const {
    usersByRole,
    usersByMonth,
    statusCount,
    patientsByMonth,
    testOrdersByMonth,
  } = useMemo(() => {
    const _usersByRole = {};
    const _usersByMonth = countUsersByMonth(dataUsers);
    const _statusCount = {};
    const _patientsByMonth = countPatientsByMonth(dataPatients);
    const _testOrdersByMonth = countUsersByMonth(testOrders);

    dataUsers.forEach((u) => {
      if (!u) return;
      const st = u.status || "UNKNOWN";
      _statusCount[st] = (_statusCount[st] || 0) + 1;

      let roleValue = null;
      if (typeof u.role === "object" && u.role) {
        roleValue = u.role.id ? roleMapById[String(u.role.id)] : null;
        if (!roleValue) {
          const innerCode =
            u.role.code || u.role.name || u.role.role || u.role.type;
          if (innerCode)
            roleValue = roleMapByCode[String(innerCode).toUpperCase()] || {
              name: innerCode,
            };
        }
      } else if (typeof u.role === "string") {
        roleValue = roleMapByCode[String(u.role).toUpperCase()] || {
          name: u.role,
        };
      }
      const roleName = roleValue?.name || roleValue?.code || null;
      if (roleName) {
        _usersByRole[roleName] ??= [];
        _usersByRole[roleName].push(u);
      }
    });

    return {
      usersByRole: _usersByRole,
      usersByMonth: _usersByMonth,
      statusCount: _statusCount,
      patientsByMonth: _patientsByMonth,
      testOrdersByMonth: _testOrdersByMonth,
    };
  }, [
    dataUsers,
    dataPatients,
    testOrders,
    roleMapById,
    roleMapByCode,
    countUsersByMonth,
    countPatientsByMonth,
  ]);

  const totalUsers = dataUsers.length;
  const totalRoles = roles.length;
  const totalPatients = patients.length;
  const totalTestOrders = testOrders.length;

  const getCurrentAndLastMonthValues = (obj) => {
    const keys = Object.keys(obj).sort();
    if (!keys.length) return { current: 0, last: 0 };
    return {
      current: obj[keys[keys.length - 1]] || 0,
      last: keys.length > 1 ? obj[keys[keys.length - 2]] || 0 : 0,
    };
  };

  // Sửa biến lastMonthUsers và các biến tương tự
  const { current: currentUserMonth, last: lastMonthUsers } =
    getCurrentAndLastMonthValues(usersByMonth);
  const { current: currentTestOrderMonth, last: lastMonthTestOrders } =
    getCurrentAndLastMonthValues(testOrdersByMonth);
  const { current: currentPatientMonth, last: lastMonthPatients } =
    getCurrentAndLastMonthValues(patientsByMonth);

  // Tính lastMonthRoles từ users tháng trước
  let lastMonthRoles = totalRoles;
  if (lastMonthUsers > 0) {
    const usersLastMonth = dataUsers.filter((u) => {
      if (!u.createdAt) return false;
      const dateObj = new Date(u.createdAt.split(" ")[0]);
      if (Number.isNaN(dateObj.getTime())) return false;
      const key = `${dateObj.getFullYear()}-${String(
        dateObj.getMonth() + 1
      ).padStart(2, "0")}`;
      return key === Object.keys(usersByMonth).sort().slice(-2)[0];
    });

    const rolesSet = new Set();
    usersLastMonth.forEach((u) => {
      const roleName =
        typeof u.role === "object" && u.role
          ? u.role.name || u.role.code || u.role.role || u.role.type
          : typeof u.role === "string"
          ? u.role
          : null;
      if (roleName) rolesSet.add(roleName);
    });

    lastMonthRoles = rolesSet.size;
  }

  const compareWithLastMonth = (current, last) => {
    if (last === 0) {
      if (current === 0) return 0;
      return 100;
    }
    return (((current - last) / last) * 100).toFixed(1);
  };

  const roleChartData = Object.keys(usersByRole).map((key) => ({
    name: key,
    value: usersByRole[key].length,
  }));

  const statusChartData = Object.keys(statusCount).map((key) => ({
    name: key,
    value: statusCount[key],
  }));

  const monthKeys = Object.keys(usersByMonth).sort();
  const lineMonthChartData = monthKeys.map((k) => {
    const [year, month] = k.split("-");
    return {
      name: `Th ${parseInt(month, 10)}/${year}`,
      users: usersByMonth[k],
    };
  });

  // Test Orders chart data (một BarChart riêng)
  const testOrderMonthKeys = Object.keys(testOrdersByMonth).sort();
  const testOrderChartData = testOrderMonthKeys.map((k) => {
    const [year, month] = k.split("-");
    return {
      name: `Th ${parseInt(month, 10)}/${year}`,
      testOrders: testOrdersByMonth[k],
    };
  });

  const testOrderMonthLabels = testOrderMonthKeys.map((k) => {
    const [year, month] = k.split("-");
    return `Tháng ${parseInt(month, 10)}-${year}`;
  });
  const testOrderMonthData = testOrderMonthKeys.map(
    (k) => testOrdersByMonth[k]
  );

  const patientMonthKeys = Object.keys(patientsByMonth).sort();
  const areaPatientMonthChartData = patientMonthKeys.map((k) => {
    const [year, month] = k.split("-");
    return {
      name: `Th ${parseInt(month, 10)}/${year}`,
      patients: patientsByMonth[k],
    };
  });

  const filteredRoleLabels = Object.keys(usersByRole);
  const filteredRoleData = Object.values(usersByRole).map((arr) => arr.length);

  const filteredStatusLabels = Object.keys(statusCount);
  const filteredStatusData = Object.values(statusCount);

  const monthLabels = monthKeys.map((k) => {
    const [year, month] = k.split("-");
    return `Tháng ${parseInt(month, 10)}-${year}`;
  });
  const monthData = monthKeys.map((k) => usersByMonth[k]);
  const patientMonthLabels = patientMonthKeys.map((k) => {
    const [year, month] = k.split("-");
    return `Tháng ${parseInt(month, 10)}-${year}`;
  });
  const patientMonthData = patientMonthKeys.map((k) => patientsByMonth[k]);

  const applyDateFilter = () => {
    if (!startDate && !endDate) {
      setFilteredUsers([]);
      return;
    }

    const filtered = users.filter((u) => {
      if (!u.createdAt) return false;
      let userDate;

      if (u.createdAt.includes("T")) {
        userDate = new Date(u.createdAt);
      } else {
        const dateStr = u.createdAt.split(" ")[0];
        const parts = dateStr.split("-");
        if (parts.length !== 3) return false;
        const [a, b, c] = parts.map((v) => parseInt(v, 10));
        if (a > 31) userDate = new Date(a, b - 1, c);
        else userDate = new Date(c, b - 1, a);
      }

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) return userDate >= start && userDate <= end;
      if (start) return userDate >= start;
      if (end) return userDate <= end;
      return true;
    });
    setFilteredUsers(filtered);
  };

  const resetFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilteredUsers([]);
  };

  const maxDate = new Date().toISOString().slice(0, 10);

  const handleStartDateChange = (value) => {
    const newStart = value ? (value > maxDate ? maxDate : value) : "";
    setStartDate(newStart);
    setEndDate((prevEnd) => {
      if (!newStart) return prevEnd;
      if (!prevEnd) return newStart;
      return prevEnd < newStart ? newStart : prevEnd;
    });
  };

  const handleEndDateChange = (value) => {
    const newEnd = value ? (value > maxDate ? maxDate : value) : "";
    setEndDate(newEnd);
    setStartDate((prevStart) => {
      if (!newEnd) return prevStart;
      if (!prevStart) return newEnd;
      return prevStart > newEnd ? newEnd : prevStart;
    });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      applyDateFilter();
    }, 120);
    return () => clearTimeout(t);
  }, [startDate, endDate]);

  const handleExportChartChange = (e) => {
    const { name, checked } = e.target;
    setExportCharts((prev) => ({ ...prev, [name]: checked }));
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const addStyledSheet = (labels, data, sheetName, keyTitle) => {
      if (!labels || !labels.length) return;

      const rows = labels.map((label, idx) => ({
        [keyTitle]: label,
        "Số lượng": data[idx] ?? 0,
      }));

      const ws = XLSX.utils.json_to_sheet(rows, {
        origin: "A4",
        skipHeader: false,
      });

      XLSX.utils.sheet_add_aoa(
        ws,
        [[`BÁO CÁO DASHBOARD - ${sheetName.toUpperCase()}`]],
        { origin: "A1" }
      );
      ws["!merges"] = ws["!merges"] || [];
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });

      const titleCell = ws["A1"];
      if (titleCell) {
        titleCell.s = {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1F4E78" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      XLSX.utils.sheet_add_aoa(ws, [[`Generated by Management System`]], {
        origin: "A2",
      });
      const subtitleCell = ws["A2"];
      if (subtitleCell) {
        subtitleCell.s = {
          font: { italic: true, sz: 11, color: { rgb: "000000" } },
          alignment: { horizontal: "left", vertical: "center" },
        };
      }

      const headerRow = 4;
      const headerCols = ["A", "B"];
      headerCols.forEach((col) => {
        const cell = ws[`${col}${headerRow}`];
        if (cell) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F81BD" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          };
        }
      });

      const startDataRow = headerRow + 1;
      const endDataRow = startDataRow + rows.length - 1;

      for (let r = startDataRow; r <= endDataRow; r++) {
        const isEven = (r - startDataRow) % 2 === 0;
        for (let c = 0; c < headerCols.length; c++) {
          const col = headerCols[c];
          const cellAddr = `${col}${r}`;
          const cell = ws[cellAddr];
          if (!cell) continue;

          let fontColor = undefined;
          if (sheetName === "Status" && c === 0) {
            const statusText = rows[r - startDataRow][keyTitle];
            if (String(statusText).toUpperCase() === "SUCCESS")
              fontColor = "00B050";
            else if (String(statusText).toUpperCase() === "FAILURE")
              fontColor = "FF0000";
            else fontColor = "000000";
          }

          cell.s = {
            fill: { fgColor: { rgb: isEven ? "F7FAFF" : "FFFFFF" } },
            alignment: {
              horizontal: c === 1 ? "center" : "left",
              vertical: "center",
              wrapText: true,
            },
            font: fontColor
              ? { color: { rgb: fontColor } }
              : { color: { rgb: "000000" } },
            border: {
              top: { style: "thin", color: { rgb: "DDDDDD" } },
              bottom: { style: "thin", color: { rgb: "DDDDDD" } },
              left: { style: "thin", color: { rgb: "DDDDDD" } },
              right: { style: "thin", color: { rgb: "DDDDDD" } },
            },
          };
        }
      }

      ws["!cols"] = [{ wch: 40 }, { wch: 14 }];

      const footerRow = endDataRow + 2;
      XLSX.utils.sheet_add_aoa(
        ws,
        [[`Tổng số bản ghi: ${data.reduce((a, b) => a + b, 0)}`]],
        { origin: `A${footerRow}` }
      );
      const footerCellAddr = `A${footerRow}`;
      const footerCell = ws[footerCellAddr];
      if (footerCell) {
        footerCell.s = {
          font: { bold: true, color: { rgb: "3C8DF0" } },
          alignment: { horizontal: "right", vertical: "center" },
        };
      }

      const genRow = footerRow + 1;
      XLSX.utils.sheet_add_aoa(
        ws,
        [[`Report generated at ${new Date().toLocaleString()}`]],
        { origin: `A${genRow}` }
      );
      if (ws[`A${genRow}`]) {
        ws[`A${genRow}`].s = {
          font: { italic: true, color: { rgb: "666666" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    if (
      !exportCharts.role &&
      !exportCharts.status &&
      !exportCharts.month &&
      !exportCharts.patient &&
      !exportCharts.testOrders
    ) {
      setExportCharts({
        role: true,
        status: true,
        month: true,
        patient: true,
        testOrders: true,
      });
    }

    if (exportCharts.role)
      addStyledSheet(filteredRoleLabels, filteredRoleData, "Role", "Role");
    if (exportCharts.status)
      addStyledSheet(
        filteredStatusLabels,
        filteredStatusData,
        "Status",
        "Trạng thái"
      );
    if (exportCharts.month)
      addStyledSheet(monthLabels, monthData, "Month", "Tháng");
    if (exportCharts.patient)
      addStyledSheet(patientMonthLabels, patientMonthData, "Patient", "Tháng");
    if (exportCharts.testOrders)
      addStyledSheet(
        testOrderMonthLabels,
        testOrderMonthData,
        "TestOrders",
        "Tháng"
      );

    XLSX.writeFile(wb, `Dashboard_${new Date().toLocaleString()}.xlsx`);
  };

  return (
    <div className="flex bg-gray-50 min-h-screen w-full h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-6 relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Dashboard Quản lý</h1>
            <p className="text-sm text-gray-600">Thống kê tổng quan hệ thống</p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                max={maxDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="border px-3 py-2 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                max={maxDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="border px-3 py-2 rounded bg-white"
              />
            </div>

            <button
              type="button"
              onClick={resetFilter}
              className="bg-gray-200 hover:bg-gray-300 px-4 rounded flex justify-center items-center py-2 text-gray-700 h-10"
            >
              <RotateCcw className="inline-block mr-1" size={18} /> Reset
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowExportOptions((prev) => !prev)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Download className="inline-block mr-1 text-white" size={18} />
                Export Excel
              </button>

              {showExportOptions && (
                <div className="absolute right-0 bg-white border rounded shadow p-3 mt-1 flex flex-col gap-2 z-50">
                  {['role', 'status', 'month', 'patient', 'testOrders'].map(
                    (c) => (
                      <label key={c} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={c}
                          checked={exportCharts[c]}
                          onChange={handleExportChartChange}
                        />
                        <span className="text-sm">
                          {c === "role"
                            ? "Role"
                            : c === "status"
                            ? "Status"
                            : c === "month"
                            ? "Tài khoản/Tháng"
                            : c === "patient"
                            ? "Bệnh nhân/Tháng"
                            : "Test Orders"}
                        </span>
                      </label>
                    )
                  )}

                  <button
                    onClick={exportToExcel}
                    className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 mt-2 text-sm"
                  >
                    Xuất file
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parent grid - dùng 12 cột, gap x và y */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-6 w-full">
          {/* LEFT: chiếm 1/3 (4/12) - cards xếp 2x2 */}
          <div className="col-span-12 md:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1 */}
              <div className="rounded-lg p-4 border bg-white shadow-sm flex items-center justify-between gap-3 h-[160px]">
                <div className="text-left space-y-0.5">
                  <p className="text-sm text-gray-600">Tổng người dùng</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalUsers}</p>
                  <p
                    className={`text-xs font-medium ${
                      compareWithLastMonth(totalUsers, lastMonthUsers) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {compareWithLastMonth(totalUsers, lastMonthUsers) >= 0
                      ? "+"
                      : ""}
                    {compareWithLastMonth(totalUsers, lastMonthUsers)}% so với
                    tháng trước
                  </p>
                </div>
                <div className="h-12 w-12 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FaUser className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-lg p-4 border bg-white shadow-sm flex items-center justify-between gap-3 h-[160px]">
                <div className="text-left space-y-0.5">
                  <p className="text-sm text-gray-600">Tổng test order</p>
                  <p className="text-2xl font-semibold text-gray-900">{testOrders.length}</p>
                  <p
                    className={`text-xs font-medium ${
                      compareWithLastMonth(
                        totalTestOrders,
                        lastMonthTestOrders
                      ) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {compareWithLastMonth(
                      totalTestOrders,
                      lastMonthTestOrders
                    ) >= 0
                      ? "+"
                      : ""}
                    {compareWithLastMonth(totalTestOrders, lastMonthTestOrders)}
                    % so với tháng trước
                  </p>
                </div>
                <div className="h-12 w-12 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-lg p-4 border bg-white shadow-sm flex items-center justify-between gap-3 h-[160px]">
                <div className="text-left space-y-0.5">
                  <p className="text-sm text-gray-600">Tổng vai trò</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalRoles}</p>
                  <p
                    className={`text-xs font-medium ${
                      compareWithLastMonth(totalRoles, lastMonthRoles) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {compareWithLastMonth(totalRoles, lastMonthRoles) >= 0
                      ? "+"
                      : ""}
                    {compareWithLastMonth(totalRoles, lastMonthRoles)}% so với
                    tháng trước
                  </p>
                </div>
                <div className="h-12 w-12 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
              </div>

              {/* Card 4 */}
              <div className="rounded-lg p-4 border bg-white shadow-sm flex items-center justify-between gap-3 h-[160px]">
                <div className="text-left space-y-0.5">
                  <p className="text-sm text-gray-600">Tổng bệnh nhân</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalPatients}</p>
                  <p
                    className={`text-xs font-medium ${
                      compareWithLastMonth(totalPatients, lastMonthPatients) >=
                      0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {compareWithLastMonth(totalPatients, lastMonthPatients) >= 0
                      ? "+"
                      : ""}
                    {compareWithLastMonth(totalPatients, lastMonthPatients)}% so
                    với tháng trước
                  </p>
                </div>
                <div className="h-12 w-12 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FaUser className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT TOP: users/month chiếm 2/3 (8/12) */}
          <div className="col-span-12 md:col-span-8 bg-white shadow-md rounded-xl p-6 h-84">
            <h3 className="font-bold text-lg mb-4">Số tài khoản mới theo tháng</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="70%">
                <BarChart
                  data={lineMonthChartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  barSize={30}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomLineAreaTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="users"
                    name="Số tài khoản mới"
                    fill={COLORS[0]}
                    isAnimationActive
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Test Orders chart - đặt bên cạnh hoặc dưới users chart */}
          
<>
    {/* Biểu đồ 1: Số lượng user theo Role (1/3) */}
    <div className="col-span-12 md:col-span-4 bg-white shadow-md rounded-xl p-6 h-84"> 
        <h3 className="font-bold text-lg mb-4">Số lượng user theo Role</h3>
        <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={roleChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={69}
                        paddingAngle={3}
                        isAnimationActive={true}
                        label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                    >
                        {roleChartData.map((entry, index) => (
                            <Cell
                                key={`cell-role-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>

    {/* Biểu đồ 2: Số Test Orders theo tháng (2/3) */}
    <div className="col-span-12 md:col-span-8 bg-white shadow-md rounded-xl p-6 h-84">
        <h3 className="font-bold text-lg mb-4">Số Test Orders theo tháng</h3>
        <div className="h-80">
            <ResponsiveContainer width="100%" height="70%">
                <BarChart
                    data={testOrderChartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    barSize={30}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<CustomLineAreaTooltip />} />
                    <Legend />
                    <Bar
                        dataKey="testOrders"
                        name="Số Test Orders"
                        fill={COLORS[2]}
                        isAnimationActive
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
</><div className="col-span-10 lg:col-span-4 flex flex-col gap-6">
            <div className="col-span-12 md:col-span-9 bg-white shadow-md rounded-xl p-6 h-84">
              <h3 className="font-bold text-lg mb-4">Tài khoản theo trạng thái</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="40%"
                      cy="50%"
                      innerRadius={50} // tăng inner radius nếu muốn
                      outerRadius={69} // tăng outer radius để có không gian cho label
                      paddingAngle={2}
                      isAnimationActive={true}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell
                          key={`cell-status-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

           
          </div>
          {/* SECOND ROW LEFT: patients/month chiếm 3/5 of full width - here use col-span-9 (of 12) */}
          <div className="col-span-10 md:col-span-8 bg-white shadow-md rounded-xl p-6 h-84">
            <h3 className="font-bold text-lg mb-4">Số bệnh nhân mới theo tháng</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="70%">
                <BarChart
                  data={areaPatientMonthChartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  barSize={30} // giống barSize của chart users
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomLineAreaTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="patients"
                    name="Số bệnh nhân mới"
                    fill={COLORS[1]} // nếu muốn gradient thì vẫn có thể dùng url(#colorPatient)
                    isAnimationActive
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SECOND ROW RIGHT: status + role - take remaining (col-span-12 lg:col-span-3) */}
          
        </div>
      </main>
    </div>
  );
}
