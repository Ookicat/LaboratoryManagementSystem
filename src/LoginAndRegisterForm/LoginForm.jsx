import React, { useState } from "react";
import { Button, Form, Card, Row, Col, InputGroup } from "react-bootstrap";
import {
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../API/Axios";
import { useDispatch } from "react-redux";
import { Login } from "../redux/features/userSlice";
import { showSuccess, showError } from "../components/Toast";
import Message, { formatErrorMessage } from "../components/Message";

export default function LoginPage() {
  const [showPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setApiError] = useState(null);
  const [, setApiSuccess] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      console.log("login response:", res.data);

      const { accessToken, refreshToken, userId } = res.data;
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      const userRes = await api.get(`/users/${userId}`);
      const user = userRes.data;
      dispatch(Login({ user, accessToken }));
      try {
        localStorage.setItem(
          "user",
          JSON.stringify({ user, accessToken, refreshToken })
        );
      } catch (e) {
        console.error("Failed to store user in localStorage:", e);}
      const successMsg = res?.data?.message || "Đăng nhập thành công!";
      setApiSuccess(successMsg);
      showSuccess(successMsg);
      setTimeout(() => navigate("/comingsoon"), 1200);
    } catch (err) {
      console.error("Login or fetch user failed:", err);
      const srv = err?.response?.data ?? err?.response ?? err;
      const parsed = formatErrorMessage
        ? formatErrorMessage(srv)
        : srv?.message || err.message || "Đăng nhập thất bại";
      setApiError(srv ?? parsed);
      showError(parsed);
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
          {/* LEFT SIDE - LOGIN FORM */}
          <Col md={5} className="bg-white p-4">
            <div className="text-center mb-4">
              <h5 className="fw-bold text-primary py-3 bg-primary bg-opacity-10 rounded">
                Chào mừng bạn quay trở lại
              </h5>
            </div>

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3" controlId="formUsername">
                <Form.Label className="fw-semibold">Tên đăng nhập</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label className="fw-semibold">Mật khẩu</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </InputGroup>
              </Form.Group>
              <a
                href="/forgot-password"
                className="text-decoration-none text-primary text-right block"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forgot-password");
                }}
              >
                Quên mật khẩu?
              </a>
              <br />

              <Button
                variant="primary"
                type="submit"
                className="w-100 py-2 rounded-pill fw-semibold"
                disabled={loading}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              <div className="text-center mt-3">
                <Button
                  variant="outline-secondary"
                  className="rounded-pill px-4"
                  onClick={() => navigate("/")}
                >
                  ← Quay lại trang chủ
                </Button>
              </div>
            </Form>
          </Col>

          {/* RIGHT SIDE - INFO */}
          <Col
            md={7}
            className="p-5 d-flex flex-column justify-content-center bg-primary bg-opacity-10"
          >
            <h3 className="fw-bold mb-3">
              Chào mừng trở lại với <span className="text-primary">MedLab</span>
            </h3>
            <p className="text-muted mb-4">
              Đăng nhập để truy cập vào tài khoản của bạn và quản lý các dịch vụ
              xét nghiệm y tế một cách dễ dàng và tiện lợi.
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
