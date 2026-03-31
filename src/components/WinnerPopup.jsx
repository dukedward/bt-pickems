import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WinnerPopup({ show, winner, onClose }) {
  return (
    <AnimatePresence>
      {show && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            className="bg-card rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-border relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4"
            >
              <Trophy className="w-10 h-10 text-accent" />
            </motion.div>

            <h2 className="font-oswald text-2xl font-bold text-foreground uppercase tracking-wide">
              Weekly Winner!
            </h2>

            <div className="mt-4 mb-2">
              {winner.avatar_url ? (
                <img
                  src={winner.avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-full mx-auto object-cover border-4 border-accent/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {winner.username?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>

            <p className="font-oswald text-xl font-bold text-primary mt-2">
              {winner.username}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {winner.correct} / {winner.total} correct picks
            </p>
            <p className="text-2xl font-oswald font-bold text-accent mt-1">
              {winner.total > 0
                ? Math.round((winner.correct / winner.total) * 100)
                : 0}
              %
            </p>

            <Button onClick={onClose} className="mt-6 w-full">
              Nice!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
