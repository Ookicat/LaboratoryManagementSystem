import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../API/Axios";
import Sidebar from "../components/SideBar";
import { Eye, RotateCcw, Filter, Download } from "lucide-react";
import XLSX from "xlsx-js-style";
import Message, { formatErrorMessage } from "../components/Message";
import { showError, showSuccess, showWarning } from "../components/Toast";

// ==========================================================
// HÀM HỖ TRỢ (GIỮ NGUYÊN)
// ==========================================================

function tryParseJSON(str) {
  if (!str || typeof str !== "string") return str;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// format timestamp from backend-local-format to display local string
const parseBackendLocalDateTime = (s) => {
  if (!s || typeof s !== "string") return null;
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/
  );
  if (!m) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [, y, M, D, hh, mm, ssRaw] = m;
  const ss = ssRaw ? Math.floor(parseFloat(ssRaw)) : 0;
  return new Date(
    Number(y),
    Number(M) - 1,
    Number(D),
    Number(hh),
    Number(mm),
    Number(ss),
    0
  );
};

const formatForDisplay = (backendTs) => {
  const d = parseBackendLocalDateTime(backendTs);
  if (!d) return String(backendTs);
  return d.toLocaleString();
};

const renderMaybeObject = (value, options = {}) => {
  if (value == null) return "-";
  if (typeof value === "string" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    const keys = options.preferredKeys || [
      "username",
      "name",
      "title",
      "displayName",
    ];
    for (const k of keys) if (value[k]) return value[k];
    if (value.id) return `id:${value.id}`;
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
};

// ==========================================================
// COMPONENT MONITORING
// ==========================================================

export default function Monitoring() {
  const [logs, setLogs] = useState([]);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [actor, setActor] = useState("");
  const [eventType, setEventType] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [targetDisplayName, setTargetDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [timestampStart, setTimestampStart] = useState("");
  const [timestampEnd, setTimestampEnd] = useState("");
  const [sort] = useState("timestamp,desc");

  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  // THÊM LOGIC FETCH VÀ MAPPING ROLES/PERMISSIONS
  const [allRoles, setAllRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);

  const roleMap = useMemo(
    () =>
      allRoles.reduce((map, role) => {
        map[String(role.id)] = role.name;
        return map;
      }, {}),
    [allRoles]
  );

  const permissionMap = useMemo(
    () =>
      allPermissions.reduce((map, perm) => {
        map[String(perm.id)] = perm.name;
        return map;
      }, {}),
    [allPermissions]
  );

  const getLookupMaps = useCallback(
    () => ({ roleMap, permissionMap }),
    [roleMap, permissionMap]
  );

  useEffect(() => {
    const fetchAllSecurityData = async () => {
      try {
        // 1. Fetch Roles
        const roleRes = await api.get("/roles/");
        const rolesData = roleRes?.data?.content || roleRes?.data || [];
        setAllRoles(Array.isArray(rolesData) ? rolesData : []);

        // 2. Fetch Permissions (Privileges)
        const permRes = await api.get("/roles/privileges");
        const permData = permRes?.data?.content || permRes?.data || [];
        setAllPermissions(Array.isArray(permData) ? permData : []);
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu bảo mật:", error);
        showError("Không tải được dữ liệu Roles/Privileges. Kiểm tra kết nối.");
      }
    };
    fetchAllSecurityData();
  }, []);

  const getNowForInput = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset(); // minutes
    const local = new Date(now.getTime() - tzOffset * 60000);
    return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  };

  const localToLocalDateTimeString = (datetimeLocal) => {
    if (!datetimeLocal) return null;
    return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      // validate and fetch automatically when filters change
      setError(null);
      const startDate = timestampStart ? new Date(timestampStart) : null;
      const endDate = timestampEnd ? new Date(timestampEnd) : null;
      const now = new Date();

      if (startDate && Number.isNaN(startDate.getTime())) {
        const msg = "Thời gian bắt đầu không hợp lệ.";
        setError(msg);
        showWarning(msg);
        return;
      }

      if (endDate && Number.isNaN(endDate.getTime())) {
        const msg = "Thời gian kết thúc không hợp lệ.";
        setError(msg);
        showWarning(msg);
        return;
      }
      if (startDate && endDate && startDate > endDate) {
        const msg = "Thời gian bắt đầu phải nhỏ hơn hoặc bằng thời gian kết thúc.";
        setError(msg);
        showWarning(msg);
        return;
      }
      if (startDate && startDate > now) {
        const msg = "Thời gian bắt đầu không thể lớn hơn thời gian hiện tại.";
        setError(msg);
        showWarning(msg);
        return;
      }
      if (endDate && endDate > now) {
        const msg = "Thời gian kết thúc không thể lớn hơn thời gian hiện tại.";
        setError(msg);
        showWarning(msg);
        return;
      }

      setPage(0);
      fetchLogs();
    }, 350);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    actor,
    eventType,
    serviceName,
    targetDisplayName,
    status,
    timestampStart,
    timestampEnd,
    sort,
    size,
  ]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, size, sort };
      if (actor) params.actor = actor;
      if (eventType) params.eventType = eventType;
      if (serviceName) params.serviceName = serviceName;
      if (targetDisplayName) params.targetDisplayName = targetDisplayName;
      if (status) params.status = status;
      if (timestampStart) {
        const v = localToLocalDateTimeString(timestampStart);
        if (v) params.timestampStart = v;
      }
      if (timestampEnd) {
        const v = localToLocalDateTimeString(timestampEnd);
        if (v) params.timestampEnd = v;
      }

      const resp = await api.get("/logs", { params });
      const data = resp.data;
      if (data?.content !== undefined) {
        setLogs(data.content);
        setTotalPages(data.totalPages || 0);
      } else if (Array.isArray(data)) {
        setLogs(data);
        setTotalPages(1);
      } else {
        setLogs([]);
        setTotalPages(0);
      }
    } catch (e) {
      console.error("AxiosError", e);
      const friendly =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Failed to load logs";
      setError(friendly);
      showError(friendly);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sort]);

  const onSearch = () => {
    setError(null);

    const startDate = timestampStart ? new Date(timestampStart) : null;
    const endDate = timestampEnd ? new Date(timestampEnd) : null;
    const now = new Date();

    if (startDate && Number.isNaN(startDate.getTime())) {
      setError("Thời gian bắt đầu không hợp lệ.");
      return;
    }
    if (endDate && Number.isNaN(endDate.getTime())) {
      setError("Thời gian kết thúc không hợp lệ.");
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setError("Thời gian bắt đầu phải nhỏ hơn hoặc bằng thời gian kết thúc.");
      return;
    }
    if (startDate && startDate > now) {
      setError("Thời gian bắt đầu không thể lớn hơn thời gian hiện tại.");
      return;
    }
    if (endDate && endDate > now) {
      setError("Thời gian kết thúc không thể lớn hơn thời gian hiện tại.");
      return;
    }

    setPage(0);
    fetchLogs();
  };

  const clearFilters = () => {
    setActor("");
    setEventType("");
    setServiceName("");
    setTargetDisplayName("");
    setStatus("");
    setTimestampStart("");
    setTimestampEnd("");
    setPage(0);
    setError(null);
    fetchLogs();
  };

  const renderValueWithMap = (field, value, maps) => {
    if (value === null || value === undefined || value === "") return "-";

    const valArray = Array.isArray(value) ? value : [value];
    if (valArray.length === 0) return "-";

    const lowerField = String(field).toLowerCase();

    const isRoleField = lowerField.includes("role");
    const isPermissionField =
      lowerField.includes("privilege") || lowerField.includes("authority");

    // Normalize items to string keys for lookup map
    const normalized = valArray.map((v) => {
      if (v && typeof v === "object" && (v.id || v.name)) {
        if (v.name) return String(v.name);
        return String(v.id);
      }
      if (typeof v === "number") return String(v);
      if (typeof v === "string" && v.trim() !== "") return v;
      return String(v);
    });

    if (maps.roleMap && isRoleField) {
      return normalized.map((id) => maps.roleMap[String(id)] || id).join(", ");
    }

    if (maps.permissionMap && isPermissionField) {
      return normalized
        .map((id) => maps.permissionMap[String(id)] || id)
        .join(", ");
    }

    return Array.isArray(value) ? value.join(", ") : String(value);
  };

  // render details in modal
  const renderDetails = (log) => {
    if (!log) return <span className="text-gray-500">-</span>;

    // Lấy map tra cứu
    const maps = getLookupMaps();

    const details = log.details ?? log.message;
    if (!details) return <span className="text-gray-500">-</span>;

    const actorLabel = (() => {
      const a = log.actor;
      if (!a) return "Người dùng";
      if (a.username) return `Người dùng ${a.username}`;
      if (a.displayName) return `Người dùng ${a.displayName}`;
      if (a.id) return `Người ${a.id}`;
      return "Người dùng";
    })();

    const parsed =
      typeof details === "string" ? tryParseJSON(details) : details;

    // ----- NEW: Special handling for COMMENT events -----
    const et = String(log.eventType || "").toUpperCase();
    if (/COMMENT/.test(et)) {
      // possible fields: content, newContent, oldContent, originalContent, message
      const content =
        parsed?.content ??
        parsed?.newContent ??
        parsed?.new_content ??
        parsed?.body ??
        null;
      const oldContent =
        parsed?.oldContent ?? parsed?.old_content ?? parsed?.previous ?? null;
      const originalContent =
        parsed?.originalContent ?? parsed?.original_content ?? null;
      const message =
        parsed?.message ??
        parsed?.msg ??
        (et === "COMMENT_CREATE" ? "User added a comment" : null) ??
        null;

      return (
        <div className="text-base">
          <div className="mb-2 text-gray-700 text-lg font-medium">
            {actorLabel}
            {et === "COMMENT_CREATE" && " đã thêm ghi chú."}
            {et === "COMMENT_UPDATE" && " đã cập nhật ghi chú."}
            {et === "DELETE_COMMENT" && " đã xóa ghi chú."}
          </div>

          {message && (
            <div className="text-sm text-gray-500 mb-2">Ghi chú: {String(message)}</div>
          )}

          <div className="space-y-2">
            {content && (
              <div>
                <div className="text-sm text-gray-500">Nội dung</div>
                <div className="font-medium whitespace-pre-wrap">{String(content)}</div>
              </div>
            )}

            {oldContent && (
              <div>
                <div className="text-sm text-gray-500">Nội dung cũ</div>
                <div className="font-medium whitespace-pre-wrap">{String(oldContent)}</div>
              </div>
            )}

            {originalContent && (
              <div>
                <div className="text-sm text-gray-500">Nội dung ban đầu (original)</div>
                <div className="font-medium whitespace-pre-wrap">{String(originalContent)}</div>
              </div>
            )}

            {/* If nothing obvious, pretty print parsed */}
            {!content && !oldContent && !originalContent && !message && (
              <div className="text-sm text-gray-500">
                <pre className="whitespace-pre-wrap">{JSON.stringify(parsed, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }
    // ----- end COMMENT special handling -----

    // CASE: changes (OLD / NEW) — giữ logic hiện có
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.changes &&
      typeof parsed.changes === "object"
    ) {
      const entries = Object.entries(parsed.changes);
      const oldMap = {};
      const newMap = {};
      entries.forEach(([field, change]) => {
        oldMap[field] =
          change.old_names ??
          change.old ??
          change.from ??
          change.previous ??
          change.old_ids ??
          change.oldIds ??
          "";
        newMap[field] =
          change.new_names ??
          change.new ??
          change.to ??
          change.current ??
          change.new_ids ??
          change.newIds ??
          "";
      });

      return (
        <div className="text-base">
          <div className="mb-2 text-gray-700 text-lg font-medium">
            {actorLabel} đã thực hiện các thay đổi:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4 bg-red-50">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold text-red-700">OLD</div>
                <div className="text-xs text-red-600">Giá trị cũ</div>
              </div>
              <div className="space-y-3">
                {Object.entries(oldMap).map(([field, val]) => (
                  <div key={field} className="flex flex-col">
                    <div className="text-sm text-gray-600">{field}</div>
                    <div className="font-semibold text-red-800 whitespace-pre-wrap">
                      {val && typeof val === "string" && val.includes(",")
                        ? val
                        : renderValueWithMap(field, val, maps)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded p-4 bg-green-50">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold text-green-700">NEW</div>
                <div className="text-xs text-green-600">Giá trị mới</div>
              </div>
              <div className="space-y-3">
                {Object.entries(newMap).map(([field, val]) => (
                  <div key={field} className="flex flex-col">
                    <div className="text-sm text-gray-600">{field}</div>
                    <div className="font-semibold text-green-800 whitespace-pre-wrap">
                      {val && typeof val === "string" && val.includes(",")
                        ? val
                        : renderValueWithMap(field, val, maps)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // CASE: errorMessage in parsed
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed.errorMessage || parsed.error)
    ) {
      const msg = parsed.errorMessage ?? parsed.error;
      // only show failure banner when log.status indicates failure
      if (String(log.status).toUpperCase() === "FAILURE") {
        return (
          <div className="text-base text-red-600 font-medium">
            Lỗi: {String(msg)}
          </div>
        );
      }
      // if status is success but BE still provided errorMessage (rare), show as note
      return (
        <div className="text-base text-gray-700 font-medium">
          Ghi chú: {String(msg)}
        </div>
      );
    }

    // CASE: simple message field
    if (parsed && typeof parsed === "object" && parsed.message) {
      if (log.eventType && /login/i.test(log.eventType)) {
        return (
          <div className="text-base">{actorLabel} đã đăng nhập thành công.</div>
        );
      }
      return <div className="text-base">{String(parsed.message)}</div>;
    }

    // --- NEW: xử lý ROLE_CREATE (thành công) & ROLE_CREATE/ROLE_UPDATE requestBody ---
    const extractPrivFieldFromParsed = (p) => {
      if (!p) return null;
      if (p.privilegeIds) return p.privilegeIds;
      if (p.privileges) return p.privileges;
      if (p.requestBody && p.requestBody.privilegeIds)
        return p.requestBody.privilegeIds;
      if (p.requestBody && p.requestBody.privileges)
        return p.requestBody.privileges;
      return null;
    };

    const privilegeField = extractPrivFieldFromParsed(parsed);

    // ROLE_CREATE success -> friendly message
    if (
      String(log.eventType).toUpperCase() === "ROLE_CREATE" &&
      String(log.status).toUpperCase() === "SUCCESS"
    ) {
      const names = privilegeField
        ? renderValueWithMap("privilegeIds", privilegeField, maps)
            .split(", ")
            .map((n) => `- ${n}`)
            .join("\n")
        : "-";

      return (
        <div className="text-base">
          <div className="mb-2 text-gray-700 text-lg font-medium">
            {actorLabel} đã tạo role mới.
          </div>
          <div className="text-sm text-gray-500">Quyền được gán:</div>
          <div className="mt-2 font-medium whitespace-pre-wrap">{names}</div>
        </div>
      );
    }

    // If requestBody exists and status is FAILURE -> show the "Yêu cầu thất bại" block (like before)
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.requestBody &&
      String(log.status).toUpperCase() === "FAILURE"
    ) {
      const reason =
        parsed.errorMessage ?? parsed.error ?? "Yêu cầu không hợp lệ";

      const decodedBody = {};
      Object.entries(parsed.requestBody).forEach(([k, v]) => {
        decodedBody[k] = renderValueWithMap(k, v, maps);
      });

      return (
        <div className="text-base">
          <div className="mb-1 font-medium">Yêu cầu thất bại</div>
          <div>
            Nguyên nhân: <span className="text-red-600">{String(reason)}</span>
          </div>
          <div className="mt-2 text-sm text-gray-700">
            Dữ liệu gửi lên:
            <pre className="p-2 mt-1 bg-gray-50 border rounded text-xs overflow-auto">
              {JSON.stringify(decodedBody, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    // generic object -> pretty print
    if (parsed && typeof parsed === "object") {
      if (
        privilegeField &&
        String(log.eventType).toUpperCase() === "ROLE_CREATE" &&
        String(log.status).toUpperCase() === "FAILURE"
      ) {
        const names = renderValueWithMap("privilegeIds", privilegeField, maps);
        const reason = parsed.errorMessage ?? parsed.error ?? "Yêu cầu không hợp lệ";
        return (
          <div className="text-base">
            <div className="mb-1 font-medium">Yêu cầu thất bại</div>
            <div>
              Nguyên nhân: <span className="text-red-600">{String(reason)}</span>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              Quyền yêu cầu: <div className="font-medium mt-1">{names}</div>
            </div>
          </div>
        );
      }

      return (
        <div className="text-base space-y-2">
          {Object.entries(parsed).map(([k, v]) => (
            <div key={k}>
              <div className="text-sm text-gray-500">{k}</div>
              <div className="font-medium whitespace-pre-wrap">
                {typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <div className="text-base">{String(parsed)}</div>;
  };

  // Format details for export (text)
  function formatDetailsForExport(log) {
    const details = log.details ?? log.message;
    if (!details) return "-";
    const parsed =
      typeof details === "string" ? tryParseJSON(details) : details;

    const maps = getLookupMaps();

    // ROLE_CREATE thành công -> hiển thị quyền được gán
    if (
      String(log.eventType).toUpperCase() === "ROLE_CREATE" &&
      String(log.status).toUpperCase() === "SUCCESS" &&
      parsed
    ) {
      const privilegeIds =
        parsed?.privilegeIds ??
        parsed?.privileges ??
        parsed?.requestBody?.privilegeIds ??
        parsed?.requestBody?.privileges ??
        [];
      const names = renderValueWithMap("privilegeIds", privilegeIds, maps)
        .split(",")
        .map((s) => s.trim())
        .join("\n");
      const actorLabel =
        log.actor?.username ?? log.actor?.displayName ?? log.actor?.id ?? "Người dùng";
      return `Người dùng ${actorLabel} đã tạo role mới.\nQuyền được gán:\n${names}`;
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.changes &&
      typeof parsed.changes === "object"
    ) {
      const parts = [];
      Object.entries(parsed.changes).forEach(([field, change]) => {
        const oldVal =
          change.old_names ??
          change.old ??
          change.from ??
          change.previous ??
          change.old_ids ??
          change.oldIds ??
          "";
        const newVal =
          change.new_names ??
          change.new ??
          change.to ??
          change.current ??
          change.new_ids ??
          change.newIds ??
          "";

        const oldStr = renderValueWithMap(field, oldVal, maps)
          .split(", ")
          .map((s) => s.trim());

        const newStr = renderValueWithMap(field, newVal, maps)
          .split(", ")
          .map((s) => s.trim());

        parts.push(`${field}: "${oldStr}" → "${newStr}"`);
      });

      return parts.join(" ; ");
    }

    // error
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed.errorMessage || parsed.error)
    ) {
      const msg = parsed.errorMessage ?? parsed.error;
      return `Lỗi: ${String(msg)}`;
    }

    // message
    if (parsed && typeof parsed === "object" && parsed.message) {
      if (log.eventType && /login/i.test(log.eventType)) {
        const actorLabel =
          log.actor?.username ?? log.actor?.displayName ?? log.actor?.id ?? "Người dùng";
        return `${actorLabel} đã đăng nhập thành công.`;
      }
      return String(parsed.message);
    }

    // requestBody + errorMessage
    if (parsed && typeof parsed === "object" && parsed.requestBody) {
      const reason =
        parsed.errorMessage ?? parsed.error ?? "Yêu cầu không hợp lệ";

      const reqBodyParts = Object.entries(parsed.requestBody)
        .map(([k, v]) => `${k}: ${renderValueWithMap(k, v, maps)}`)
        .join(", ");

      return `Yêu cầu thất bại. Nguyên nhân: ${String(
        reason
      )}. Dữ liệu gửi: {${reqBodyParts}}`;
    }

    // generic object -> compact string
    if (parsed && typeof parsed === "object") {
      try {
        return Object.entries(parsed)
          .map(
            ([k, v]) =>
              `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`
          )
          .join(" ; ");
      } catch {
        return JSON.stringify(parsed);
      }
    }

    return String(parsed);
  }

  const exportExcel = () => {
    try {
      const rows = logs.map((l) => ({
        Timestamp: l.timestamp ? formatForDisplay(l.timestamp) : "-",
        Actor: renderMaybeObject(l.actor),
        EventType: renderMaybeObject(l.eventType),
        Service: renderMaybeObject(l.serviceName),
        Status: l.status ?? "-",
        TargetResource: l.targetResource
          ? `${l.targetResource.type} : ${
              l.targetResource.displayName ?? l.targetResource.id
            }`
          : "-",
        Details: formatDetailsForExport(l),
      }));

      const wb = XLSX.utils.book_new();

      // 1. Title row
      const wsData = [["MONITORING LOGS REPORT"]];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
      ws["A1"].s = {
        font: { bold: true, sz: 20, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1F4E78" } },
        alignment: { horizontal: "center", vertical: "center" },
      };

      // 2. Subtitle
      XLSX.utils.sheet_add_aoa(
        ws,
        [["Generated by Laboratory Management System"]],
        { origin: "A2" }
      );
      ws["A2"].s = {
        font: { italic: true, sz: 12, color: { rgb: "000000" } },
        alignment: { horizontal: "left" },
      };

      // 3. Header row
      XLSX.utils.sheet_add_json(ws, rows, { origin: "A4", skipHeader: false });
      const headerRow = 4;
      const headers = ["A", "B", "C", "D", "E", "F", "G"];
      headers.forEach((c) => {
        const cell = ws[`${c}${headerRow}`];
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

      // 4. Banded rows + wrap text + border + status color
      for (let i = 5; i < rows.length + 5; i++) {
        const isEven = i % 2 === 0;
        headers.forEach((c, idx) => {
          const cell = ws[`${c}${i}`];
          if (cell) {
            const statusColor =
              idx === 4 // column E = Status
                ? rows[i - 5].Status === "SUCCESS"
                  ? "00B050"
                  : rows[i - 5].Status === "FAILURE"
                  ? "FF0000"
                  : "000000"
                : undefined;

            cell.s = {
              fill: { fgColor: { rgb: isEven ? "F2F2F2" : "FFFFFF" } },
              alignment: {
                horizontal: idx === 0 || idx === 4 ? "center" : "left",
                vertical: "top",
                wrapText: true,
              },
              font: statusColor ? { color: { rgb: statusColor } } : {},
              border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } },
              },
            };
          }
        });
      }

      // 5. Column widths
      ws["!cols"] = [
        { wch: 25 }, // Timestamp
        { wch: 25 }, // Actor
        { wch: 25 }, // EventType
        { wch: 25 }, // Service
        { wch: 12 }, // Status
        { wch: 30 }, // TargetResource
        { wch: 80 }, // Details
      ];

      // 6. Footer
      const footerRow = rows.length + 6;
      const footerText = `Report generated at ${new Date().toLocaleString()}`;

      XLSX.utils.sheet_add_aoa(ws, [[footerText]], { origin: `A${footerRow}` });

      ws[`A${footerRow}`].s = {
        font: { italic: true, sz: 11, color: { rgb: "666666" } },
        alignment: { horizontal: "left" },
      };

      // Merge footer across full width
      ws["!merges"].push({
        s: { r: footerRow - 1, c: 0 },
        e: { r: footerRow - 1, c: 6 },
      });

      // Add sheet to workbook and export
      XLSX.utils.book_append_sheet(wb, ws, "Logs Report");
      XLSX.writeFile(
        wb,
        `Monitoring_Logs_Report_${new Date().toLocaleString()}.xlsx`
      );
      showSuccess("Xuất file Excel thành công.");
    } catch (err) {
      console.error("Export Excel error", err);
      const msg = err?.message || "Lỗi khi xuất file Excel. Vui lòng thử lại.";
      showError(msg);
    }
  };

  // Close modal on Esc
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") setSelectedLog(null);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex bg-gray-50 min-h-screen w-full h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto p-4 pt-3 relative">
        <h1 className="text-2xl font-semibold mb-4">Monitoring - Event Logs</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
          className="flex flex-col gap-4 mb-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Actor"
              className="border rounded p-2 bg-white text-black"
            />
            <input
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="Event type"
              className="border rounded p-2 bg-white text-black "
            />
            <input
              value={targetDisplayName}
              onChange={(e) => setTargetDisplayName(e.target.value)}
              placeholder="Target resource"
              className="border rounded p-2 bg-white text-black "
            />
          </div>

          <div className="relative">
            {showFilterPopup && (
              <div className="absolute left-0 mt-2 w-80 bg-white shadow-lg border rounded p-4 z-50 space-y-4">
                <button
                  type="button"
                  onClick={() => setShowFilterPopup(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
                <div>
                  <label className="block text-gray-600 mb-1">Service</label>
                  <select
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full border rounded p-2"
                  >
                    <option value="">Services</option>
                    <option value="IAM-SERVICE">IAM-SERVICE</option>
                    <option value="PATIENT-SERVICE">PATIENT-SERVICE</option>
                    <option value="TEST-ORDER-SERVICE">TEST-ORDER-SERVICE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border rounded p-2"
                  >
                    <option value="">Status</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILURE">FAILURE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">From</label>
                  <input
                    type="datetime-local"
                    value={timestampStart}
                    onChange={(e) => setTimestampStart(e.target.value)}
                    className="w-full border rounded p-2"
                    max={getNowForInput()}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">To</label>
                  <input
                    type="datetime-local"
                    value={timestampEnd}
                    onChange={(e) => setTimestampEnd(e.target.value)}
                    className="w-full border rounded p-2"
                    max={getNowForInput()}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilterPopup(!showFilterPopup)}
                className="flex items-center gap-2 px-4 py-2 border rounded bg-white hover:bg-gray-300"
              >
                <Filter className="w-5 h-5 text-gray-600" />
                Bộ lọc
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                <RotateCcw className="inline-block mr-1" /> Reset
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={exportExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                <Download className="inline-block mr-1 text-white gap-4 " />
                Export Excel
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mb-4 text-sm text-red-700 font-medium">{error}</div>
        )}

        <div
          className="overflow-x-auto bg-white rounded border border-gray-200"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Service</th>
                <th className="p-3">Status</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : error && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 align-top">
                      {l.timestamp ? formatForDisplay(l.timestamp) : "-"}
                    </td>
                    <td className="p-3 align-top">{renderMaybeObject(l.actor)}</td>
                    <td className="p-3 align-top">{renderMaybeObject(l.eventType)}</td>
                    <td className="p-3 align-top">{renderMaybeObject(l.serviceName)}</td>
                    <td
                      className={`p-3 align-top font-medium ${
                        l.status === "SUCCESS"
                          ? "text-green-700"
                          : l.status === "FAILURE"
                          ? "text-red-700"
                          : "text-gray-600"
                      }`}
                    >
                      {l.status ?? "-"}
                    </td>
                    <td className="p-3 align-top">
                      {l.targetResource
                        ? `${l.targetResource.type} : ${
                            l.targetResource.displayName ?? l.targetResource.id ?? l.targetResource.testOrderId
                          }`
                        : "-"}
                    </td>
                    <td className="p-3 align-top text-center">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 gap-1 px-2.5 py-1.5 rounded transition duration-200 shadow-sm text-white mx-auto"
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline text-xs font-medium">Xem</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="border px-3 py-1 rounded mr-4"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <button
              onClick={() => {
                setPage((p) => Math.max(0, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="border px-3 py-1 rounded mr-2"
              disabled={page === 0}
            >
              Prev
            </button>
            <button
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="border px-3 py-1 rounded"
              disabled={page + 1 >= totalPages}
            >
              Next
            </button>
          </div>

          <div className="text-sm text-gray-600">Page {page + 1} of {totalPages}</div>
        </div>

        {/* Detail modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b bg-blue-600 text-white">
                <h3 className="text-lg font-semibold">Log Details</h3>
              </div>

              <div className="overflow-auto p-4 flex-1 space-y-4">
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Timestamp</div>
                      <div className="font-medium">
                        {selectedLog.timestamp ? formatForDisplay(selectedLog.timestamp) : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Actor</div>
                      <div className="font-medium">{renderMaybeObject(selectedLog.actor)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Event Type</div>
                      <div className="font-medium">{renderMaybeObject(selectedLog.eventType)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Service</div>
                      <div className="font-medium">{renderMaybeObject(selectedLog.serviceName)}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-medium">{selectedLog.status ?? "-"}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-500">Target Resource</div>
                      <div className="font-medium">
                        {selectedLog.targetResource
                          ? `${selectedLog.targetResource.type} : ${selectedLog.targetResource.displayName ?? selectedLog.targetResource.id}`
                          : "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-500">Message / Details</div>
                      <div className="mt-2">{renderDetails(selectedLog)}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
