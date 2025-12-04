import {
  TestTube,
  Microscope,
  Heart,
  Shield,
  CheckCircle,
  Star,
  Clock,
  Award,
  Users,
  Phone,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import doctor1 from "../images/doctor1.jpg";
import doctor2 from "../images/doctor2.jpg";
import doctor3 from "../images/doctor3.jpg";
import doctor4 from "../images/doctor4.jpg";
import { motion, AnimatePresence } from "framer-motion";
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function CustomButton({ children, className = "", variant, ...props }) {
  let base =
    "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 text-sm";
  if (variant === "outline") {
    base +=
      " border border-input bg-background hover:bg-accent hover:text-accent-foreground";
  }
  return (
    <button className={cn(base, className)} {...props}>
      {children}
    </button>
  );
}

function CustomCard({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white text-gray-900 shadow-sm flex flex-col h-full",
        className
      )}
    >
      {children}
    </div>
  );
}
function CustomCardHeader({ children, className = "" }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  );
}
function CustomCardTitle({ children, className = "" }) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  );
}
function CustomCardContent({ children, className = "" }) {
  return (
    <div className={cn("p-6 pt-0 flex flex-col flex-1", className)}>
      {children}
    </div>
  );
}

function CustomInput({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
function CustomTextarea({ className = "", ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
function CustomLabel({ children, className = "", ...props }) {
  return (
    <label
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export default function HomePage() {
  const servicesData = [
    {
      icon: TestTube,
      title: "Xét nghiệm máu",
      description: "Xét nghiệm máu tổng quát với công nghệ hiện đại",
    },
    {
      icon: Microscope,
      title: "Xét nghiệm vi sinh",
      description: "Phát hiện vi khuẩn và virus chính xác",
    },
    {
      icon: Heart,
      title: "Xét nghiệm sinh hóa",
      description: "Đánh giá các chỉ số sinh hóa cơ thể",
    },
    {
      icon: Shield,
      title: "Bảo mật thông tin",
      description: "Thông tin khách hàng được bảo mật tuyệt đối",
    },
  ];

  const pricingPlansData = [
    {
      name: "Gói Cơ Bản",
      price: "1.500.000đ",
      tagline: "Phù hợp kiểm tra định kỳ",
      features: [
        "Xét nghiệm máu tổng quát",
        "Kiểm tra các chỉ số cơ bản",
        "Kết quả trong 24h",
        "Tư vấn sức khỏe miễn phí",
      ],
      badge: "Tiết kiệm",
    },
    {
      name: "Gói Nâng Cao",
      price: "2.500.000đ",
      tagline: "Phân tích chuyên sâu, nhanh chóng",
      features: [
        "Xét nghiệm máu + sinh hóa",
        "Đánh giá chức năng gan, thận, mỡ máu",
        "Kết quả trong 12h",
        "Tư vấn bởi chuyên gia",
      ],
      badge: "Lựa chọn nhiều nhất",
    },
    {
      name: "Gói Toàn Diện",
      price: "4.500.000đ",
      tagline: "Dành cho kiểm tra sức khỏe toàn thân",
      features: [
        "Tất cả xét nghiệm chuyên sâu",
        "Đánh giá nguy cơ tiềm ẩn",
        "Kết quả trong 6h",
        "Bác sĩ theo dõi riêng",
        "Tư vấn & chăm sóc dài hạn",
      ],
      highlighted: true,
      badge: "Cao cấp",
    },
  ];

  const processesData = [
    {
      step: "1",
      title: "Đăng ký xét nghiệm",
      description: "Đăng ký qua điện thoại hoặc website dễ dàng",
    },
    {
      step: "2",
      title: "Lấy mẫu xét nghiệm",
      description: "Nhân viên chuyên nghiệp lấy mẫu tại lab hoặc tận nhà",
    },
    {
      step: "3",
      title: "Phân tích mẫu",
      description: "Máy móc hiện đại phân tích chính xác",
    },
    {
      step: "4",
      title: "Nhận kết quả",
      description: "Nhận kết quả qua email hoặc trực tiếp tại lab",
    },
  ];

  // Popup & progress state for Hero Section
  const [showPopup, setShowPopup] = useState(false);
  const [popupProgress, setPopupProgress] = useState(0);

  useEffect(() => {
    if (showPopup && popupProgress < 99.9) {
      const timer = setInterval(() => {
        setPopupProgress((prev) => (prev >= 99.9 ? 99.9 : prev + 1));
      }, 30);
      return () => clearInterval(timer);
    }
    // Reset progress when popup closes
    if (!showPopup && popupProgress !== 0) setPopupProgress(0);
  }, [showPopup, popupProgress]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* --- Phần Logo (Giữ nguyên) --- */}
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <TestTube className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl">MedLab</span>
            </div>

            {/* --- NAV (Giữ nguyên logic như bạn yêu cầu) --- */}
            <nav className="hidden md:flex items-center space-x-12">
              <a
                href="#services"
                className="text-md text-black no-underline transition-colors 
                           duration-200 py-2 px-4 rounded-lg hover:bg-gray-100"
                style={{ textDecoration: "none" }}
              >
                Dịch vụ
              </a>

              <a
                href="#pricing"
                className="text-md text-black no-underline transition-colors 
                           duration-200 py-2 px-4 rounded-lg hover:bg-gray-100"
                style={{ textDecoration: "none" }}
              >
                Bảng giá
              </a>

              <a
                href="#about"
                className="text-md text-black no-underline transition-colors 
                           duration-200 py-2 px-4 rounded-lg hover:bg-gray-100"
                style={{ textDecoration: "none" }}
              >
                Quy trình
              </a>

              <a
                href="#team"
                className="text-md text-black no-underline transition-colors 
                           duration-200 py-2 px-4 rounded-lg hover:bg-gray-100"
                style={{ textDecoration: "none" }}
              >
                Đội ngũ
              </a>
            </nav>

            {/* === NÚT ĐĂNG NHẬP NỔI BẬT (ĐÃ CẬP NHẬT) === */}
            <div className="flex items-center">
              {/* - Bỏ div bọc ngoài, áp dụng style trực tiếp cho Button
                - Thêm hiệu ứng: shadow, translate, transition
              */}
              <CustomButton
                className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold tracking-wide 
             shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 
             transform transition-all duration-300 focus:outline-none 
             focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
              >
                <a
                  href="/login"
                  className="flex items-center justify-center w-full h-full no-underline"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  Đăng nhập
                </a>
              </CustomButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl mb-6">
                Xét nghiệm máu{" "}
                <span className="text-blue-600">nhanh chóng</span> <br /> và{" "}
                <span className="text-blue-600">chính xác</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Hệ thống phòng lab hiện đại với công nghệ tiên tiến, đảm bảo kết
                quả xét nghiệm chính xác cao và thời gian xử lý nhanh nhất.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>10.000+ khách hàng</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>99.9% độ chính xác</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>24h hỗ trợ</span>
                </div>
              </div>
              <div className="flex gap-4">
                <CustomButton
                  className="px-8 py-3 rounded-full bg-blue-600 text-white font-medium 
                             shadow-md hover:bg-blue-700 hover:shadow-lg 
                             hover:-translate-y-0.5 transform transition-all duration-300
                             focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Đặt lịch ngay
                </CustomButton>
                <CustomButton
                  variant="outline"
                  className="px-8 py-3 rounded-full font-medium 
                             border-2 border-blue-600 text-blue-600 bg-transparent 
                             shadow-md hover:bg-blue-50 hover:shadow-lg hover:-translate-y-0.5 
                             transform transition-all duration-300
                             focus:outline-none focus:ring-2 focus:ring-blue-300"
                  onClick={() => setShowPopup(true)}
                >
                  Xem chi tiết
                </CustomButton>
              </div>
            </div>

            {/* Medical Lab - Popup Trigger */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative bg-blue-600 rounded-3xl p-8 text-white cursor-pointer shadow-lg hover:shadow-blue-300 transition-all duration-300"
              onClick={() => setShowPopup(true)}
            >
              <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                <TestTube className="w-6 h-6" /> Medical Lab
              </h3>
              <div className="pl-2">
                <p className="text-blue-100 mb-6">
                  Chăm sóc sức khỏe của bạn là ưu tiên hàng đầu của chúng tôi.
                </p>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-100">Độ tin cậy</span>
                    <span className="text-sm font-semibold">99.9%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-green-400 to-blue-500 rounded-full h-2"
                      initial={{ width: "0%" }}
                      animate={{ width: "99.9%" }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Popup hiển thị chi tiết */}
        <AnimatePresence>
          {showPopup && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-3xl p-8 w-[90%] max-w-2xl text-gray-800 shadow-2xl relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <button
                  onClick={() => setShowPopup(false)}
                  className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-xl"
                >
                  ✕
                </button>

                {/* Tiêu đề */}
                <div className="text-center mb-6">
                  <motion.div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg mb-3"
                    initial={{ rotate: -90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <TestTube className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-blue-700 mb-2">
                    Báo cáo hoạt động - Medical Lab
                  </h3>
                  <p className="text-gray-600">
                    Phòng xét nghiệm đạt tiêu chuẩn quốc tế với hiệu suất vượt
                    trội.
                  </p>
                </div>

                {/* Bảng chỉ số hoạt động */}
                <div className="bg-blue-50 rounded-2xl p-6 shadow-inner">
                  {[
                    {
                      label: "Độ tin cậy",
                      value: 99.9,
                      color: "from-green-400 to-green-600",
                    },
                    {
                      label: "Tốc độ xử lý",
                      value: 98.7,
                      color: "from-yellow-400 to-orange-500",
                    },
                    {
                      label: "Chính xác kết quả",
                      value: 99.9,
                      color: "from-blue-400 to-blue-600",
                    },
                    {
                      label: "Mức độ bảo mật",
                      value: 100,
                      color: "from-purple-400 to-purple-600",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="mb-5"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700 font-medium">
                          {item.label}
                        </span>
                        <span className="text-blue-700 font-semibold">
                          {item.value}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className={`h-3 rounded-full bg-gradient-to-r ${item.color}`}
                          initial={{ width: "0%" }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Thông tin thêm */}
                <div className="text-center mt-6">
                  <motion.p
                    className="text-gray-600 text-sm mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    Dữ liệu được cập nhật <b>hàng ngày</b> bởi hệ thống phân
                    tích tự động.
                  </motion.p>
                  <p className="text-xs text-gray-500 italic">
                    Được chứng nhận bởi <b>ISO 15189 & WHO Standards</b>.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 🌟 Services Section */}
      <section
        id="services"
        className="py-24 bg-gradient-to-b from-blue-50 via-white to-blue-50 relative overflow-hidden"
      >
        <div className="container mx-auto px-4 relative z-10">
          {/* Tiêu đề */}
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              Dịch vụ xét nghiệm
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto text-lg">
              Chúng tôi cung cấp đa dạng các dịch vụ xét nghiệm — hiện đại,
              chính xác và bảo mật tuyệt đối.
            </p>
          </div>

          {/* Danh sách dịch vụ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {servicesData.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 30px rgba(59,130,246,0.2)", // Shadow xanh blue
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 
                       hover:border-blue-500 cursor-pointer 
                       transform transition-all duration-300"
                >
                  {/* Icon */}
                  <motion.div
                    className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-6 shadow-inner"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Icon className="h-8 w-8 text-blue-600" />
                  </motion.div>

                  {/* Tiêu đề */}
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                    {service.title}
                  </h3>

                  {/* Mô tả */}
                  <p className="text-gray-600 text-sm text-center leading-relaxed">
                    {service.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Hiệu ứng nền ánh sáng mờ (màu xanh blue nhạt) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]"></div>
      </section>

      {/* 🌟 Pricing Section */}
      <section
        id="pricing"
        className="py-24 bg-gradient-to-b from-blue-50 via-white to-gray-50"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-400 bg-clip-text text-transparent">
              Gói Xét Nghiệm Nổi Bật
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Chọn gói xét nghiệm phù hợp — nhanh chóng, chính xác, chuyên
              nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto items-stretch">
            {pricingPlansData.map((plan, index) => {
              // === Logic 3 Giao Diện ===
              const isPremium = plan.highlighted; // Gói Vàng Gold (Toàn Diện)
              const isAdvanced = !isPremium && index === 1; // Gói Xanh Blue (Nâng Cao)
              const isBasic = !isPremium && index === 0; // Gói Trắng (Cơ Bản)
              // =========================

              return (
                <CustomCard
                  key={index}
                  className={cn(
                    "relative overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl",
                    isPremium
                      ? "border-amber-500 border-2 bg-gradient-to-b from-amber-50 to-white shadow-lg"
                      : isAdvanced
                      ? "border-blue-600 border-2 bg-gradient-to-b from-blue-100 to-white shadow-lg"
                      : "border-green-300 border-2 bg-gradient-to-b from-green-50 to-white shadow-lg"
                  )}
                >
                  {/* 🎖️ Badge kiểu ruy băng */}
                  {plan.badge && (
                    <div
                      className={cn(
                        "absolute top-0 right-0 text-xs font-semibold px-6 py-1.5 rounded-bl-2xl shadow-md tracking-wide",
                        isPremium
                          ? "bg-gradient-to-r from-amber-600 to-yellow-500 text-black"
                          : isAdvanced
                          ? "bg-gradient-to-r from-blue-700 to-blue-400 text-white"
                          : "bg-gradient-to-r from-green-700 to-green-400 text-white"
                      )}
                    >
                      {plan.badge}
                    </div>
                  )}
                  {/* 💎 Viền phát sáng động (Chỉ cho Premium) */}
                  {isPremium && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none animate-pulse-glow" />
                  )}
                  <CustomCardHeader className="relative text-center">
                    <CustomCardTitle className="text-2xl font-extrabold mb-2 text-gray-900">
                      {plan.name}
                    </CustomCardTitle>
                    <p className="text-sm text-gray-500 mb-3 italic">
                      {plan.tagline}
                    </p>
                    <div
                      className={cn(
                        "text-4xl font-bold mb-3",
                        isPremium ? "text-amber-600" : "text-blue-600"
                      )}
                    >
                      {plan.price}
                    </div>
                    <div
                      className={cn(
                        "h-1 w-16 mx-auto rounded-full",
                        isPremium ? "bg-amber-500" : "bg-blue-500"
                      )}
                    ></div>
                  </CustomCardHeader>
                  <CustomCardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-gray-700"
                        >
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <CustomButton
                      className={cn(
                        "w-full mt-auto h-11 rounded-full font-medium transition-all duration-300 shadow-md",
                        isPremium
                          ? "bg-gradient-to-r from-amber-600 to-yellow-500 text-black hover:shadow-amber-300 hover:scale-105"
                          : isAdvanced
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-blue-300 hover:scale-105"
                          : "bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-blue-300 hover:scale-105"
                      )}
                    >
                      Chọn gói này
                    </CustomButton>
                  </CustomCardContent>
                </CustomCard>
              );
            })}
          </div>
        </div>

        {/* 🔮 CSS cho hiệu ứng phát sáng Vàng (chỉ áp dụng cho gói Premium) */}
        <style>{`
    @keyframes pulse-glow {
      0% {
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.3), /* Mã màu Amber-500 */
                    0 0 30px rgba(245, 158, 11, 0.2);
      }
      50% {
        box-shadow: 0 0 25px rgba(245, 158, 11, 0.6),
                    0 0 45px rgba(245, 158, 11, 0.4);
      }
      100% {
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.3),
                    0 0 30px rgba(245, 158, 11, 0.2);
      }
    }
    .animate-pulse-glow {
      animation: pulse-glow 3s infinite alternate;
    }
  `}</style>
      </section>

      {/* Process Section */}
      <section
        id="about"
        className="py-20 bg-gradient-to-b from-white to-blue-50 relative overflow-hidden"
      >
        <div className="container mx-auto px-4 relative z-10">
          {/* Tiêu đề */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              Quy trình xét nghiệm
            </h2>
            <p className="text-gray-600 text-lg">
              Dễ dàng – Nhanh chóng – Chính xác chỉ với 4 bước
            </p>
          </div>

          {/* Quy trình 4 bước */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-10 relative">
            {processesData.map((process, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Vòng tròn số thứ tự */}
                <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-blue-600 text-white text-2xl font-bold shadow-lg transform transition-all duration-300 group-hover:scale-110">
                  {process.step}
                  {/* Hiệu ứng lan sáng */}
                  <span className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-40 animate-ping"></span>
                </div>

                {/* Tiêu đề & mô tả */}
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {process.title}
                  </h3>
                  <p className="text-sm text-gray-600 max-w-[220px] mx-auto">
                    {process.description}
                  </p>
                </div>

                {/* Mũi tên nối giữa các bước (ẩn ở bước cuối) */}
                {index < processesData.length - 1 && (
                  <div className="hidden lg:block absolute right-[-65px] top-[40px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 120 30"
                      className="w-16 h-6 text-blue-400 transition-transform duration-300 group-hover:translate-x-2"
                    >
                      <path
                        d="M0 15 H100 L90 5 M100 15 L90 25"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hiệu ứng nền mờ nhẹ màu xanh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)]"></div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-400 bg-clip-text text-transparent">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Hơn <b>10.000+</b> khách hàng đã tin tưởng và sử dụng dịch vụ của
              MedLab
            </p>
          </motion.div>

          {/* Danh sách lời chứng thực */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              {
                name: "Nguyễn Thị Lan",
                initials: "NL",
                feedback:
                  "Dịch vụ rất chuyên nghiệp, kết quả xét nghiệm nhanh và chính xác. Nhân viên thân thiện, tận tình. Tôi rất hài lòng và sẽ giới thiệu cho bạn bè.",
                role: "Khách hàng",
                rating: 5,
              },
              {
                name: "Trần Văn Minh",
                initials: "TM",
                feedback:
                  "Tôi rất ấn tượng với quy trình làm việc nhanh chóng và bảo mật. Kết quả được gửi qua email đúng giờ, rất tiện lợi và hiện đại.",
                role: "Doanh nhân",
                rating: 5,
              },
              {
                name: "Lê Hoàng Anh",
                initials: "HA",
                feedback:
                  "Phòng xét nghiệm sạch sẽ, thiết bị hiện đại. Nhân viên tư vấn tận tình, giúp tôi hiểu rõ hơn về các chỉ số sức khỏe của mình.",
                role: "Giảng viên",
                rating: 4,
              },
            ].map((customer, index) => (
              <div className="relative group">
                {/* Gradient border chạy động khi hover */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none z-10 transition-opacity duration-500 opacity-0 group-hover:opacity-100">
                  <div className="w-full h-full rounded-3xl animate-gradient-border bg-[conic-gradient(from_90deg_at_50%_50%,#60a5fa_0%,#a5b4fc_50%,#2563eb_100%)] opacity-70"></div>
                </div>
                {/* Gradient nền mờ phía sau */}
                <div className="absolute inset-2 rounded-3xl blur-2xl opacity-40 z-0 bg-gradient-to-br from-blue-200 via-blue-50 to-white"></div>
                <motion.div
                  key={index}
                  className="relative z-20 bg-white p-8 rounded-3xl shadow-lg border border-gray-100 transition-all duration-300 group hover:shadow-2xl"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{
                    scale: 1.05,
                    rotateY: 3,
                    boxShadow: "0 12px 30px rgba(59,130,246,0.3)",
                  }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  style={{
                    willChange: "transform, box-shadow",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* Rating */}
                  <div className="flex mb-4 justify-center">
                    {[...Array(customer.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Feedback */}
                  <p className="text-base text-gray-700 mb-6 italic text-center leading-relaxed">
                    “{customer.feedback}”
                  </p>

                  {/* Customer info */}
                  <div className="flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold mr-4 shadow-md">
                      {customer.initials}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-800">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500">{customer.role}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
        {/* Hiệu ứng động cho border gradient */}
        <style>{`
          @keyframes gradient-border-move {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 100% 50%;
            }
          }
          .animate-gradient-border {
            background-size: 200% 200%;
            animation: gradient-border-move 2s linear infinite;
            border-radius: 1rem;
          }
        `}</style>
      </section>

      {/* 🌟 Team Section */}
      <section
        id="team"
        className="py-24 bg-gradient-to-b from-white via-blue-50 to-blue-100 relative overflow-hidden"
      >
        <div className="container mx-auto px-4 relative z-10">
          {/* Tiêu đề */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-700 to-blue-400 bg-clip-text text-transparent">
              Đội ngũ y bác sĩ
            </h2>
            <p className="text-gray-600 text-lg">
              Những chuyên gia hàng đầu – Tận tâm – Nhiệt huyết – Giàu kinh
              nghiệm
            </p>
          </motion.div>

          {/* Danh sách thành viên đội ngũ */}
          {(() => {
            const teamMembers = [
              {
                name: "BS. Nguyễn Văn Minh",
                role: "Chuyên khoa Xét nghiệm",
                image: doctor1,
              },
              {
                name: "BS. Trần Văn Hùng",
                role: "Bác sĩ Huyết học",
                image: doctor2,
              },
              {
                name: "BS. Lê Thị Thu",
                role: "Chuyên gia Sinh hóa",
                image: doctor3,
              },
              {
                name: "BS. Phạm Anh Dũng",
                role: "Trưởng phòng Lab",
                image: doctor4,
              },
            ];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    /*
                THAY ĐỔI 1:
                - Thêm 'h-full' để các thẻ bằng chiều cao nhau.
                - Thêm 'flex flex-col' để điều khiển nội dung bên trong.
              */
                    className="h-full bg-gray-50 rounded-3xl p-6 text-center shadow-md hover:shadow-blue-200 transition-all duration-300 flex flex-col"
                  >
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-28 h-28 mx-auto mb-4 rounded-full object-cover border-4 border-blue-100"
                    />
                    {/*
                THAY ĐỔI 2:
                - Bọc phần text trong 1 div 'flex flex-col flex-grow'
                - 'flex-grow' sẽ làm div này lấp đầy không gian trống
              */}
                    <div className="flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {member.name}
                      </h3>
                      <p className="text-blue-600 text-sm mb-2">
                        {member.role}
                      </p>
                      {/*
                  THAY ĐỔI 3:
                  - Thêm 'mt-auto' để đẩy mô tả này xuống dưới cùng của thẻ.
                */}
                      <p className="text-gray-500 text-sm mt-auto">
                        Với nhiều năm kinh nghiệm trong lĩnh vực xét nghiệm và
                        chẩn đoán.
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })()}

          {/*
      THAY ĐỔI 4: Dòng đặc điểm nổi bật
      - Thay 'flex flex-wrap justify-center' bằng 'grid'
      - Chia cột rõ ràng: 1 (mobile), 2 (tablet), 4 (desktop)
    */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {[
              {
                name: "Trang thiết bị hiện đại",
                icon: Award,
              },
              {
                name: "Kết quả nhanh chóng",
                icon: Clock,
              },
              { name: "Hỗ trợ 24/7", icon: Phone },
              {
                name: "Chi phí hợp lý",
                icon: CheckCircle,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  /*
              Bỏ 'whileHover' ở đây vì 'group-hover' ở dưới đã xử lý
              (Bạn có thể giữ lại nếu muốn hiệu ứng rõ hơn)
            */
                  className="flex items-center bg-white rounded-2xl px-5 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 group"
                >
                  <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-gray-200 mr-3 transition-all duration-200 group-hover:border-blue-300">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </span>
                  <span className="text-gray-800 font-medium">{item.name}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Hiệu ứng nền sáng */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.07),transparent_70%)]"></div>
      </section>
      <motion.footer
        className="bg-gradient-to-br from-gray-700 to-gray-700 text-white py-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4">
          {/* FLEX 4-2-2-2 */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-12 mb-12">
            {/* CỘT 1: LOGO & SOCIAL - flex:4 */}
            <motion.div
              className="flex-1 md:basis-2/5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <TestTube className="h-7 w-7 text-white" />
                </motion.div>
                <span className="text-2xl font-bold">MedLab</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                MedLab là hệ thống phòng xét nghiệm máu hàng đầu tại Việt Nam.
                Chúng tôi cung cấp dịch vụ xét nghiệm chuyên sâu, nhanh chóng và
                chính xác, với đội ngũ bác sĩ nhiều năm kinh nghiệm và trang
                thiết bị hiện đại.
                <br />
                Tin cậy – Chính xác – Nhanh chóng.
              </p>
              <div className="flex gap-3">
                {["F", "T", "I", "Y"].map((social, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    className="h-10 w-10 rounded-xl bg-gray-800 flex items-center justify-center hover:bg-blue-600 font-bold"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    {social}
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* CỘT 2: DỊCH VỤ - flex:2 */}
            <motion.div
              className="flex-1 md:basis-1/5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-6">Dịch vụ</h3>
              <ul
                className="space-y-4"
                style={{
                  width: "206.332px",
                  transform: "translate(-16.5664px, 0px)",
                }}
              >
                {[
                  { name: "Xét nghiệm máu", id: "services" },
                  { name: "Xét nghiệm vi sinh", id: "services" },
                  { name: "Xét nghiệm sinh hóa", id: "services" },
                  { name: "Xét nghiệm di truyền", id: "services" },
                  { name: "Xét nghiệm ung thư", id: "services" },
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 8, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <button
                      onClick={() =>
                        document
                          .getElementById(item.id)
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                      {item.name}
                    </button>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* CỘT 3: VỀ CHÚNG TÔI - flex:2 */}
            <motion.div
              className="flex-1 md:basis-1/5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold mb-6">Về chúng tôi</h3>
              <ul className="space-y-3">
                {[
                  { name: "Giới thiệu", id: "about" },
                  { name: "Đội ngũ bác sĩ", id: "team" },
                  { name: "Dịch vụ", id: "services" },
                  { name: "Bảng giá", id: "pricing" },
                  { name: "Liên hệ", id: "contact" },
                ].map((item, index) =>
                  item.name === "Liên hệ" ? (
                    <motion.li
                      key={index}
                      whileHover={{ x: 8, scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="relative group"
                    >
                      <button
                        onClick={() =>
                          document
                            .getElementById(item.id)
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                        {item.name}
                      </button>
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        📞 Hotline: 0901 234 567
                      </div>
                    </motion.li>
                  ) : (
                    <motion.li
                      key={index}
                      whileHover={{ x: 8, scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <button
                        onClick={() =>
                          document
                            .getElementById(item.id)
                            ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                        {item.name}
                      </button>
                    </motion.li>
                  )
                )}
              </ul>
            </motion.div>

            {/* CỘT 4: NEWSLETTER - flex:2 */}
            <motion.div
              className="flex-1 md:basis-2/5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-bold mb-6">Bản đồ</h3>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-700">
                <iframe
                  title="MedLab Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.469805509594!2d106.69852357480535!3d10.776889759207118!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4120f55555%3A0xf9e4c69b94dc!2sHo%20Chi%20Minh%20City!5e0!3m2!1sen!2s!4v1719999999999"
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </motion.div>
          </div>

          {/* PHẦN DƯỚI CÙNG */}
          <motion.div
            className="border-t border-gray-800 pt-8 flex flex-col justify-center items-center text-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-gray-400 text-sm">
              © 2024 MedLab. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Điều khoản
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Chính sách
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}
