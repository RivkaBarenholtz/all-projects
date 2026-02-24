import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Detail({title, body, onClose}) {
    return (
        <AnimatePresence>
     
                <div className="trd-overlay-container">
                    {/* Dark overlay */}
                    <motion.div
                        className="trd-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Side Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        className="trd-drawer"
                    >
                        {/* Header */}
                        <div className="trd-header">
                            <h2>{title}</h2>
                            <div style={{ display: "flex", alignItems: "center" }}>
                               
                                <div >
                                    <button onClick={onClose} type='button' className="trd-btn close">
                                        <X />
                                    </button>
                                </div>
                            </div>

                        </div>
                       
                        {/* Body */}
                        <div className="trd-body">
                            {body}

                        </div>
                    </motion.div>
                </div>
       
        </AnimatePresence>
    )
}