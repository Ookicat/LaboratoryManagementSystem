import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Card, Row, Col } from "react-bootstrap"; // ✅ Dùng component của react-bootstrap
import {
  FaCheckCircle,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa"; 
import api from "../API/Axios";
import { showError, showSuccess, showWarning } from "../components/Toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (e) => /^\S+@\S+\.\S+$/.test(e);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return showWarning("Vui lòng nhập email");
    if (!validateEmail(email)) return showWarning("Email không đúng định dạng");

    try {
      setLoading(true);
      const res = await api.post("/auth/request-reset-password", null, {
        params: { email },
      });
      const msg =
        res?.data?.message ||
        "Nếu email tồn tại, hướng dẫn đặt lại sẽ được gửi.";
      showSuccess(msg);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể gửi yêu cầu.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <Card
        className="shadow-lg border-0 rounded-4 overflow-hidden"
        style={{ maxWidth: "950px", width: "100%" }}
      >
        <Row className="g-0">
          <Col md={5} className="bg-white p-4">
            <div className="text-center mb-4">
              <h5 className="fw-bold text-primary py-3 bg-primary bg-opacity-10 rounded">
                Khôi phục mật khẩu
              </h5>
            </div>

            <p className="text-muted text-center mb-4">
              Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
            </p>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Label className="fw-semibold">Địa chỉ email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 py-2 rounded-pill fw-semibold"
                disabled={loading}
              >
                {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
              </Button>

              <div className="text-center mt-3">
                <Button
                  variant="outline-secondary"
                  className="rounded-pill px-4"
                  onClick={() => navigate("/login")} 
                >
                  ← Quay lại đăng nhập
                </Button>
              </div>
            </Form>
          </Col>

          <Col
            md={7}
            className="p-5 d-flex flex-column justify-content-center bg-primary bg-opacity-10"
          >
            <h3 className="fw-bold mb-3">
              Đừng lo lắng, <span className="text-primary">MedLab</span> ở đây
            </h3>
            <p className="text-muted mb-4">
              Chúng tôi sẽ giúp bạn truy cập lại vào tài khoản của mình một cách
              an toàn và nhanh chóng.
            </p>

            <div className="d-flex flex-column gap-3 mb-4">
              <Card className="shadow-sm border-0">
                <Card.Body className="d-flex align-items-center gap-3 ">
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

          <Card className="border-0 bg-primary text-white text-center py-3 shadow-sm rounded-3">
            <Card.Body>
              <h6 className="fw-semibold mb-1">📞 Hỗ trợ khách hàng 24/7</h6>
              <small>Hotline: 1900 9098 | Email: support@medlab.vn</small>
            </Card.Body>
          </Card>
        </Row>
      </Card>
    </div>
  );
}