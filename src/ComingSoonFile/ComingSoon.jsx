import React from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/SideBar";
import dragonGif from "../images/Untitled-video-Made-with-Clipc-unscreen.gif";

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-white-100">
      <aside className="w-64 fixed top-0 left-0 h-screen bg-white shadow-lg overflow-y-auto z-40">
        <Sidebar className="w-64" />
      </aside>

      <main className="min-h-screen ml-64 flex items-center justify-center text-gray-800 relative overflow-hidden p-8">
        <motion.img
          src={dragonGif}
          alt="Flying Dragon"
          className="absolute w-80 h-80 top-24 left-130 z-30 pointer-events-none select-none"
          animate={{
            x: ["-100%", "100%", "-100%"], // bay cực rộng
            y: [0, -40, 0, 40, 0], // lượn nhẹ lên xuống
            rotate: [0, 8, -8, 0],
            scaleX: [-1, -1, -1, 1, 1, 1, -1], // lật ngang khi đổi hướng
          }}
          transition={{
            repeat: Infinity,
            duration: 20, // bay chậm hơn cho mượt
            ease: "easeInOut",
          }}
        />

        {/* Popup trung tâm */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="z-40 text-center p-10 max-w-xl w-full bg-gradient-to-br from-[#004b8d] to-[#0070cc] rounded-2xl shadow-2xl border border-blue-200 text-white"
        >
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold mb-4 drop-shadow-lg"
          >
            Coming Soon
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-lg text-blue-100 max-w-lg mx-auto mb-6"
          >
            Tính năng này đang được phát triển. Vui lòng quay lại sau nhé!
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}
