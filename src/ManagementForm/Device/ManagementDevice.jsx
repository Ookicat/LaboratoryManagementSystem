import React, { useEffect, useState } from "react";
import api from "../../API/Axios";
import Sidebar from "../../components/SideBar";
import Message, { formatErrorMessage } from "../../components/Message";
import { showError, showSuccess, showWarning } from "../../components/Toast";

const deviceImages = {
  1: "https://th.bing.com/th/id/R.cd1aa2ceb848b6c4083577e47c071c87?rik=MUIKlnDEwOfqdg&riu=http%3a%2f%2fwww.asinteg.com.ar%2fw%2fimages%2fproductos%2fsysmex-xn2000.png&ehk=JVyE36w%2fxCF0VNO5nQCzbUtFeo6O411KfKu40mdXXyk%3d&risl=&pid=ImgRaw&",
  2: "https://media.beckmancoulter.com/-/media/diagnostics/products/hematology/dxh-900/images/dxh-900.jpg?h=480&w=563&la=en&hash=256123A5ECEFE2FAF29F0ACDD5D9288E3AB5D71D",
  3: "https://mqst.ru/t/MbKaTQK-eHL_lyue2d37FtJKg80=/0x1040/uploads/2021/08/ruby-2f.png",
};

export default function ManagementDevice() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [reagentInputs, setReagentInputs] = useState({});

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/instruments/");
      const data = response.data;
      const formatted = data.map((item) => ({
        id: item.instrumentInfo.instrumentId,
        name: item.instrumentInfo.name,
        status: item.instrumentInfo.status,
        modelName: item.modelSpecs.modelName,
        image: deviceImages[item.instrumentInfo.instrumentId] || "",
      }));
      setDevices(formatted);
    } catch (err) {
      console.error(err);
      setError("Lấy dữ liệu thất bại!");
      showError("Lấy dữ liệu thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceDetails = async (id) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await api.get(`/instruments/${id}`);
      setSelectedDevice(response.data);

      // Khởi tạo input refill = 0
      setReagentInputs({
        diluent: 0,
        lysing: 0,
        cleaner: 0,
        clotting: 0,
        staining: 0,
      });
    } catch (err) {
      console.error(err);
      setDetailError("Lấy chi tiết thất bại!");
      showError("Lấy chi tiết thất bại!");
    } finally {
      setDetailLoading(false);
    }
  };

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const handleInputChange = (e, key) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) value = 0;

    const maxAllowed = parseFloat(
      (selectedDevice.modelSpecs[`max${capitalize(key)}`] -
        selectedDevice.instrumentInfo[`current${capitalize(key)}`]).toFixed(6)
    );

    if (value < 0) value = 0;
    else if (value > maxAllowed) value = maxAllowed;

    setReagentInputs({ ...reagentInputs, [key]: value });
  };

  const handleRefill = async () => {
    try {
      for (const key of ["diluent","lysing","cleaner","clotting","staining"]) {
        const amount = reagentInputs[key];
        if (amount > 0) {
          await api.post("/reagents/refill", {
            instrumentId: selectedDevice.instrumentInfo.instrumentId,
            reagentType: key.toUpperCase(),
            amount,
          });
        }
      }
      showSuccess("Refill thành công!");
      fetchDeviceDetails(selectedDevice.instrumentInfo.instrumentId);
    } catch (err) {
      console.error(err);
      const message = formatErrorMessage(err);
      showError(`Refill thất bại: ${message}`);
    }
  };

  const closeModal = () => setSelectedDevice(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  if (loading) return <p className="p-6">Đang tải dữ liệu...</p>;
  if (error) return <p className="p-6">{error}</p>;

  return (
    <div className="flex bg-gray-100 min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-y-auto px-8 py-6 relative">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Quản lý thiết bị</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {devices.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-xl shadow-md p-5 flex flex-col items-center hover:shadow-xl transition transform hover:scale-105"
            >
              {d.image && (
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-44 h-44 object-contain mb-4 rounded-lg border"
                />
              )}
              <h3 className="font-bold text-xl text-gray-900 mb-1">{d.name}</h3>
              <p className="text-gray-500 mb-2">{d.modelName}</p>
              <p
                className={`px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                  d.status === "READY"
                    ? "bg-green-100 text-green-700"
                    : d.status === "MAINTENANCE"
                    ? "bg-yellow-100 text-yellow-700"
                    : d.status === "INACTIVE"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {d.status}
              </p>
              <button
                onClick={() => fetchDeviceDetails(d.id)}
                className="mt-auto bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Xem chi tiết
              </button>
            </div>
          ))}
        </div>

        {/* Modal */}
        {selectedDevice && (
          <div className="fixed inset-0 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto shadow-xl">
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold text-xl"
              >
                ✕
              </button>
              {detailLoading ? (
                <p>Đang tải chi tiết...</p>
              ) : detailError ? (
                <p>{detailError}</p>
              ) : (
                <>
                  <h3 className="font-bold text-2xl mb-4">{selectedDevice.instrumentInfo.name}</h3>
                  <p className="mb-1">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`font-semibold ${
                        selectedDevice.instrumentInfo.status === "READY"
                          ? "text-green-700"
                          : selectedDevice.instrumentInfo.status === "MAINTENANCE"
                          ? "text-yellow-700"
                          : selectedDevice.instrumentInfo.status === "INACTIVE"
                          ? "text-orange-700"
                          : "text-red-700"
                      }`}
                    >
                      {selectedDevice.instrumentInfo.status}
                    </span>
                  </p>
                  <p className="mb-3"><strong>Model:</strong> {selectedDevice.modelSpecs.modelName}</p>
                  <hr className="my-3" />

                  {["diluent","lysing","cleaner","clotting","staining"].map((key) => {
                    const current = selectedDevice.instrumentInfo[`current${capitalize(key)}`];
                    const max = selectedDevice.modelSpecs[`max${capitalize(key)}`];
                    const maxAllowed = parseFloat((max - current).toFixed(6));
                    const percentage = (current / max) * 100;

                    let barColor =
                      percentage >= 60 ? "bg-green-300" :
                      percentage >= 25 ? "bg-yellow-500" :
                      "bg-red-400";

                    return (
                      <div key={key} className="mb-4">
                        <p className="font-medium text-gray-700 mb-1">
                          {capitalize(key)}: {current.toFixed(2)} / {max.toFixed(2)}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                          <div
                            className={`${barColor} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <input
                          type="number"
                          step="0.000001"
                          min={0}
                          max={maxAllowed}
                          value={reagentInputs[key]}
                          onChange={(e) => handleInputChange(e, key)}
                          onBlur={() => {
                            const value = reagentInputs[key];
                            if (value < 0) setReagentInputs({ ...reagentInputs, [key]: 0 });
                            else if (value > maxAllowed)
                              setReagentInputs({ ...reagentInputs, [key]: maxAllowed });
                          }}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    );
                  })}

                  <button
                    onClick={handleRefill}
                    className="mt-4 bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 w-full transition"
                  >
                    Refill
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
