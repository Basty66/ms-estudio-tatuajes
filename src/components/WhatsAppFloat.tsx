import { motion } from "framer-motion"
import { WhatsappLogo } from "@phosphor-icons/react"

export default function WhatsAppFloat() {
  return (
    <motion.a
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      href="https://wa.me/56964470668"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex items-center gap-3 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
      style={{ boxShadow: "0 4px 20px rgba(37, 211, 102, 0.4)" }}
    >
      <div className="flex items-center gap-2 px-4 py-3 md:px-5 md:py-3.5">
        <WhatsappLogo size={20} className="md:size-[22px]" weight="fill" />
        <span className="hidden md:inline text-sm font-semibold tracking-wider">
          ESCRIBENOS
        </span>
      </div>
    </motion.a>
  )
}
