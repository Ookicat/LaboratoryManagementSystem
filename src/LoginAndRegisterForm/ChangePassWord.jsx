import React, { useState, useEffect } from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import { FaLock, FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../API/Axios";
import { showError, showSuccess } from "../components/Toast";
import Message, { formatErrorMessage } from "../components/Message";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const query = useQuery();
  const tokenFromQuery = query.get("token") || "";

  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFieldErrors({});
    setSuccessMsg("");
    setApiError(null);

    if (!token.trim()) {
      const m =
        "Token không hợp lệ hoặc không tìm thấy. Vui lòng thực hiện lại yêu cầu đặt lại mật khẩu.";
      setFieldErrors({ token: m });
      showError(m);
      return;
    }
    if (!newPassword.trim()) {
      setFieldErrors({ newPassword: "Vui lòng nhập mật khẩu mới." });
      return;
    }
    if (newPassword.trim() !== confirm.trim()) {
      setFieldErrors({ confirm: "Mật khẩu xác nhận không khớp." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        token: token.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirm.trim(),
      };
      const res = await api.post("/auth/confirm-reset-password", payload);
      const msg = res?.data?.message || "Đặt lại mật khẩu thành công.";
      setSuccessMsg(msg);
      showSuccess(msg);
      setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      const resp = err?.response?.data ?? null;
      setApiError(resp || err);
      const msg = formatErrorMessage(resp || err);
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
          {/* LEFT SIDE - CHANGE PASSWORD FORM */}
          <Col md={5} className="bg-white p-4">
            <div className="text-center mb-4">
              <h5 className="fw-bold text-primary py-3 bg-primary bg-opacity-10 rounded">
                Đặt lại mật khẩu
              </h5>
            </div>

            {apiError && (
              <div className="mb-3">
                <Message error={apiError} />
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success py-2 small text-center mb-3">
                {successMsg}
              </div>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="newPassword">
                <Form.Label className="fw-semibold">Mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự, có chữ hoa và số"
                  disabled={loading}
                  isInvalid={!!fieldErrors.newPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.newPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4" controlId="confirmPassword">
                <Form.Label className="fw-semibold">
                  Xác nhận mật khẩu
                </Form.Label>
                <Form.Control
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={loading}
                  isInvalid={!!fieldErrors.confirm}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.confirm}
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 py-2 rounded-pill fw-semibold"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </Button>

              
            </Form>
          </Col>

          {/* RIGHT SIDE - INFO / INTRO */}
          <Col
            md={7}
            className="p-5 d-flex flex-column justify-content-center bg-primary bg-opacity-10"
          >
            <h3 className="fw-bold mb-3">
              Bảo mật tài khoản của bạn với{" "}
              <span className="text-primary">MedLab</span>
            </h3>
            <p className="text-muted mb-4">
              Hãy đặt lại mật khẩu để bảo vệ tài khoản và đảm bảo quyền truy cập
              an toàn vào các dịch vụ của chúng tôi.
            </p>

            <div className="d-flex flex-column gap-3 mb-4">
              <Card className="shadow-sm border-0">
                <Card.Body className="d-flex align-items-center gap-3">
                  <FaLock size={26} className="text-primary" />
                  <div>
                    <h6 className="fw-semibold mb-0">An toàn tuyệt đối</h6>
                    <small className="text-muted">
                      Mật khẩu mới của bạn được mã hóa và bảo mật hoàn toàn.
                    </small>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Body className="d-flex align-items-center gap-3">
                  <FaCheckCircle size={26} className="text-primary" />
                  <div>
                    <h6 className="fw-semibold mb-0">Cập nhật nhanh chóng</h6>
                    <small className="text-muted">
                      Hoàn tất trong vài giây, đăng nhập ngay với mật khẩu mới.
                    </small>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Body className="d-flex align-items-center gap-3">
                  <FaShieldAlt size={26} className="text-primary" />
                  <div>
                    <h6 className="fw-semibold mb-0">Bảo mật tài khoản</h6>
                    <small className="text-muted">
                      Đảm bảo thông tin cá nhân của bạn luôn được an toàn.
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        {/* FOOTER */}
        <Card className="border-0 bg-primary text-white text-center py-3 shadow-sm rounded-3">
          <Card.Body>
            <h6 className="fw-semibold mb-1">📞 Hỗ trợ khách hàng 24/7</h6>
            <small>Hotline: 1900 9098 | Email: support@medlab.vn</small>
          </Card.Body>
        </Card>
      </Card>
    </div>
  );
}
