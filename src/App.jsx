import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Toast from "./components/Toast";
import SideBar from "./components/SideBar";

import HomePage from "./HomePageForm/HomePage";
import ComingSoon from "./ComingSoonFile/ComingSoon";

import ManagementRole from "./ManagementForm/Role/ManagementRole";
import ManagementUser from "./ManagementForm/User/ManagementUser";
import ManagementProfile from "./ManagementForm/ManagementProfile";
import UploadUsers from "./ManagementForm/User/UploadUsers";
import ManagementPatient from "./ManagementForm/Patient/ManagementPatient";
import AddPatient from "./ManagementForm/Patient/AddPatient";
import EditPatient from "./ManagementForm/Patient/EditPatient";
import ViewPatient from "./ManagementForm/Patient/ViewPatient";
import AddTestOrder from "./ManagementForm/TestOrders/addTestOrder";
import VerifyEmailAuto from "./MailForm/VerifyEmailAuto";
("./MailForm/VerifyEmailAuto");
import ListResendEmail from "./MailForm/ListResendEmail";
import LoginPage from "./LoginAndRegisterForm/LoginForm";
import ChangePassWord from "./LoginAndRegisterForm/ChangePassWord";
import ForgotPassword from "./LoginAndRegisterForm/ForgetPassword";
import Monitoring from "./ManagementForm/Monitoring";
import Dashboard from "./ManagementForm/DashBoard/Dashboard";
import SampleManagement from "./ManagementForm/TestOrders/SampleManagement";
import ViewTestOrder from "./ManagementForm/TestOrders/ViewTestOrder";
import PrintTestOrder from "./ManagementForm/TestOrders/PrintTestOrder";
import RunTestOrder from "./ManagementForm/TestOrders/RunTestOrder";
import ManagementDevice from "./ManagementForm/Device/ManagementDevice";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePassWord />} />
        <Route path="/management/role" element={<ManagementRole />} />
        <Route path="/management/user" element={<ManagementUser />} />
        <Route path="/management/profile" element={<ManagementProfile />} />
        <Route path="/comingsoon" element={<ComingSoon />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/management/upload-users" element={<UploadUsers />} />
        <Route path="/verify-email" element={<VerifyEmailAuto />} />
        <Route path="/resend-email" element={<ListResendEmail />} />
        <Route path="/management/device" element={<ManagementDevice />} />
        <Route path="/management/patient" element={<ManagementPatient />} />
        <Route path="/management/patient/add" element={<AddPatient />} />
        <Route path="/management/monitoring" element={<Monitoring />} />
        <Route path="/management/patient/edit/:id" element={<EditPatient />} />
        <Route path="/management/patient/view/:id" element={<ViewPatient />} />
        <Route
          path="/management/test-order/view/:id"
          element={<ViewTestOrder />}
        />
        <Route
          path="/management/sample-management"
          element={<SampleManagement />}
        />
        <Route path="/management/test-order/add" element={<AddTestOrder />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/management/test-order/print/:id"
          element={<PrintTestOrder />}
        />
        <Route
          path="/management/test-order/run"
          element={<RunTestOrder />}
        />
      </Routes>
      <Toast />
    </Router>
  );
}

export default App;
