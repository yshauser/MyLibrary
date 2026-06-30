
import React from "react";
import { motion } from "framer-motion";

const COLORS = {
  primary: "#1565c0",
  primaryLight: "#5e92f3",
  primaryDark: "#003c8f",
  secondary: "#ff8f00",
  secondaryLight: "#ffc046",
  secondaryDark: "#c56000",
  background: "#f5f5f5",
};

function Book({
  x = 0,
  y = 0,
  w = 28,
  h = 132,
  color = COLORS.primary,
  delay = 0,
  active = false,
  tilt = 0,
}) {
  return (
    <motion.div
      className="relative rounded-md shadow-md"
      style={{
        width: w,
        height: h,
        background: `linear-gradient(90deg, ${color} 0%, ${color} 68%, rgba(255,255,255,0.23) 100%)`,
        transformOrigin: "bottom center",
      }}
      initial={{ x, y, rotate: tilt }}
      animate={
        active
          ? {
              x: [x, x + 24, x + 10, x],
              y: [y, y - 4, y - 2, y],
              rotate: [tilt, tilt + 3, tilt + 1, tilt],
              scale: [1, 1.035, 1.015, 1],
            }
          : { x, y, rotate: tilt }
      }
      transition={
        active
          ? {
              duration: 2.1,
              delay,
              repeat: Infinity,
              repeatDelay: 0.25,
              ease: "easeInOut",
            }
          : undefined
      }
    >
      <div className="absolute left-1 top-3 h-[calc(100%-24px)] w-[3px] rounded-full bg-white/25" />
      <div className="absolute left-2 right-2 top-6 h-[2px] rounded-full bg-white/45" />
      <div className="absolute left-2 right-2 bottom-7 h-[2px] rounded-full bg-white/35" />
      <div className="absolute left-1/2 top-1/2 h-7 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35" />
    </motion.div>
  );
}

function Shelf({ children }) {
  return (
    <div className="relative flex h-40 items-end gap-2 px-5">
      {children}
      <div
        className="absolute bottom-0 left-2 right-2 h-4 rounded-full shadow-lg"
        style={{
          background: `linear-gradient(180deg, ${COLORS.secondaryLight}, ${COLORS.secondary})`,
        }}
      />
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="mt-3 flex justify-center gap-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: i === 1 ? COLORS.secondary : COLORS.primary }}
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -4, 0] }}
          transition={{ duration: 1, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function SplashScreenMockup() {
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center p-6"
      style={{ backgroundColor: COLORS.background }}
    >
      <section className="w-full max-w-sm text-center">
        <motion.div
          className="mx-auto rounded-[2.2rem] p-5 shadow-2xl"
          style={{
            background: `linear-gradient(145deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
            boxShadow: "0 24px 55px rgba(0, 60, 143, 0.24)",
          }}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div
            className="relative overflow-hidden rounded-[1.7rem] border-4"
            style={{
              borderColor: COLORS.secondaryLight,
              background: "linear-gradient(180deg, #ffffff 0%, #eef5ff 100%)",
            }}
          >
            <div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at 50% 10%, ${COLORS.primaryLight}, transparent 48%)` }} />

            <div className="relative pt-4 pb-6">
              <Shelf>
                <Book w={23} h={104} color={COLORS.primaryDark} />
                <Book w={26} h={116} color={COLORS.secondary} />
                <Book w={24} h={112} color={COLORS.primary} />
                <Book w={30} h={126} color={COLORS.primaryLight} active delay={0.15} />
                <Book w={25} h={108} color={COLORS.secondaryLight} />
                <Book w={29} h={122} color={COLORS.primaryDark} />
                <Book w={22} h={100} color={COLORS.secondaryDark} />
              </Shelf>

              <Shelf>
                <Book w={25} h={118} color={COLORS.secondaryLight} />
                <Book w={28} h={130} color={COLORS.primary} active delay={0.9} tilt={-2} />
                <Book w={22} h={104} color={COLORS.primaryDark} />
                <Book w={30} h={124} color={COLORS.secondary} />
                <Book w={24} h={114} color={COLORS.primaryLight} />
                <Book w={27} h={121} color={COLORS.primaryDark} />
                <Book w={24} h={110} color={COLORS.secondaryDark} />
              </Shelf>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          <h1
            className="text-5xl font-black tracking-tight"
            style={{ color: COLORS.primaryDark }}
          >
            הספרייה שלי
          </h1>

          <motion.div
            className="mx-auto mt-4 h-1 w-28 rounded-full"
            style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.primary})` }}
            animate={{ scaleX: [0.65, 1, 0.65], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.p
            className="mt-5 text-2xl font-semibold"
            style={{ color: COLORS.primary }}
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            טוען...
          </motion.p>

          <LoadingDots />
        </motion.div>
      </section>
    </main>
  );
}
