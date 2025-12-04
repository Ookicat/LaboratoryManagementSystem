import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Row, Col, Button } from "react-bootstrap";
import "animate.css";
import { FaCheckCircle, FaStar, FaShieldAlt } from "react-icons/fa"; // Đã cập nhật đường dẫn import

/**
 * Custom hook để lấy query params từ URL
 */
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

/**
 * ✅ VerifyEmailAuto
 * - Giao diện được đồng bộ với trang LoginPage
 * - Đọc ?token=... từ URL
 * - Gọi API BE xác minh: GET /api/auth/verify?token=...
 * - Hiển thị UI thành công
 * - Tự động chuyển hướng về /login sau 5s
 */
export default function VerifyEmailAuto() {
  const query = useQuery();
  const navigate = useNavigate();
  const token = query.get("token") || "";
  const [called, setCalled] = useState(false); // <--- Logic được thêm lại
  const [countdown, setCountdown] = useState(5); // đếm ngược 5s

  useEffect(() => {
    // Chỉ chạy logic khi có token
    if (!token) {
      console.warn("Không tìm thấy token xác minh.");
      // Có thể chuyển hướng về login nếu không có token
      // navigate("/login");
      return;
    }

    // URL của API, sử dụng phiên bản hardcoded theo yêu cầu
    const verifyUrl = `http://localhost:8081/api/auth/verify?token=${encodeURIComponent(
      token
    )}`;
    setCalled(true); // <--- Logic được thêm lại

    // ✅ Gọi BE xác minh tự động (fire-and-forget)
    (async () => {
      try {
        // Sử dụng fetch hoặc axios nếu bạn đã cấu hình
        await fetch(verifyUrl, {
          method: "GET",
          credentials: "include", // <--- Logic được thêm lại
          headers: { Accept: "application/json" },
        });
        // Không cần xử lý kết quả, chỉ cần gọi
      } catch (err) {
        console.error("❌ Gọi API xác minh thất bại (bỏ qua lỗi):", err);
      }
    })();

    // ⏳ Đếm ngược và redirect sau 5s
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeout = setTimeout(() => navigate("/login"), 5000);

    // Cleanup khi component unmount
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [token, navigate]); // Phụ thuộc vào token và navigate

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <Card
        className="shadow-lg border-0 rounded-4 overflow-hidden"
        style={{ maxWidth: "950px", width: "100%" }}
      >
        <Row className="g-0">
          {/* LEFT SIDE - VERIFY MESSAGE */}
          <Col
            md={5}
            className="bg-white p-4 p-md-5 d-flex flex-column justify-content-center text-center"
          >
            <div
              className="mx-auto mb-3 animate__animated animate__bounceIn d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: "100px",
                height: "100px",
                backgroundColor: "#22c55e",
              }}
            >
              <FaCheckCircle size={60} className="text-white" />
            </div>

            <h3 className="fw-bold text-dark mb-3">
              Xác minh email thành công!
            </h3>

            <p className="text-muted mb-4">
              Tài khoản của bạn đã được kích hoạt. Bạn sẽ được chuyển hướng đến
              trang đăng nhập trong <b className="text-primary">{countdown}</b>{" "}
              giây...
            </p>

            <Button
              variant="primary"
              onClick={() => navigate("/login")}
              className="w-100 py-2 rounded-pill fw-semibold"
            >
              Chuyển ngay đến đăng nhập
            </Button>

            <p className="text-muted mt-4" style={{ fontSize: "0.8rem" }}>
              Cảm ơn bạn đã xác minh tài khoản.
            </p>
          </Col>

          {/* RIGHT SIDE - INFO (Giống hệt LoginPage) */}
          <Col
            md={7}
            className="p-5 d-none d-md-flex flex-column justify-content-center bg-primary bg-opacity-10"
          >
            <h3 className="fw-bold mb-3">
              Chào mừng bạn đến với <span className="text-primary">MedLab</span>
            </h3>
            <p className="text-muted mb-4">
              Hệ thống xét nghiệm y tế hàng đầu, cung cấp dịch vụ nhanh chóng,
              chính xác và bảo mật tuyệt đối.
            </p>

            <div className="d-flex flex-column gap-3 mb-4">
              <Card className="shadow-sm border-0">
                <Card.Body className="d-flex align-items-center gap-3">
                  <FaStar size={28} className="text-primary" />
                  <div>
                    <h6 className="fw-semibold mb-0">Dịch vụ chất lượng cao</h6>
                    <small className="text-muted">
                      Trang thiết bị hiện đại, quy trình chuẩn quốc tế
                    </small>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Body className="d-flex align-items-center gap-3">
                  <FaCheckCircle size={28} className="text-primary" />
                  <div>
                    <h6 className="fw-semibold mb-0">Kết quả nhanh chóng</h6>
                    <small className="text-muted">
                      Nhận kết quả trong vòng 24 giờ, cấp cứu 2 giờ
                    </small>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Body className="d-flex align-items-center gap-3">
                  <FaShieldAlt size={28} className="text-primary" />
                  <div>
                    <h6 className="fw-semibold mb-0">Bảo mật tuyệt đối</h6>
                    <small className="text-muted">
                      Thông tin khách hàng được bảo mật 100%
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>

          {/* FOOTER (Giống hệt LoginPage) */}
          <Card className="border-0 bg-primary text-white text-center py-3 shadow-sm rounded-0">
            <Card.Body className="py-2">
              <h6 className="fw-semibold mb-1">📞 Hỗ trợ khách hàng 24/7</h6>
              <small>Hotline: 1900 9098 | Email: support@medlab.vn</small>
            </Card.Body>
          </Card>
        </Row>
      </Card>
    </div>
  );
}
