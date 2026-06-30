import { motion } from 'framer-motion';

const COLORS = {
  primary: '#1565c0',
  primaryLight: '#5e92f3',
  primaryDark: '#003c8f',
  secondary: '#ff8f00',
  secondaryLight: '#ffc046',
  secondaryDark: '#c56000',
  background: '#f5f5f5',
};

interface BookProps {
  w?: number;
  h?: number;
  color?: string;
  delay?: number;
  active?: boolean;
  tilt?: number;
}

function Book({ w = 28, h = 132, color = COLORS.primary, delay = 0, active = false, tilt = 0 }: BookProps) {
  return (
    <motion.div
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        background: `linear-gradient(90deg, ${color} 0%, ${color} 68%, rgba(255,255,255,0.23) 100%)`,
        transformOrigin: 'bottom center',
        flexShrink: 0,
      }}
      initial={{ rotate: tilt }}
      animate={
        active
          ? {
              x: [0, 24, 10, 0],
              y: [0, -4, -2, 0],
              rotate: [tilt, tilt + 3, tilt + 1, tilt],
              scale: [1, 1.035, 1.015, 1],
            }
          : { x: 0, y: 0, rotate: tilt }
      }
      transition={
        active
          ? { duration: 2.1, delay, repeat: Infinity, repeatDelay: 0.25, ease: 'easeInOut' }
          : undefined
      }
    >
      <div style={{ position: 'absolute', left: 4, top: 12, height: 'calc(100% - 24px)', width: 3, borderRadius: 99, background: 'rgba(255,255,255,0.25)' }} />
      <div style={{ position: 'absolute', left: 8, right: 8, top: 24, height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.45)' }} />
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 28, height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.35)' }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', height: 28, width: 12, transform: 'translate(-50%, -50%)', borderRadius: 99, border: '1px solid rgba(255,255,255,0.35)' }} />
    </motion.div>
  );
}

interface ShelfProps {
  children: React.ReactNode;
}

function Shelf({ children }: ShelfProps) {
  return (
    <div style={{ position: 'relative', display: 'flex', height: 160, alignItems: 'flex-end', gap: 8, paddingLeft: 20, paddingRight: 20 }}>
      {children}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 8,
          right: 8,
          height: 16,
          borderRadius: 99,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          background: `linear-gradient(180deg, ${COLORS.secondaryLight}, ${COLORS.secondary})`,
        }}
      />
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            display: 'inline-block',
            height: 12,
            width: 12,
            borderRadius: 99,
            backgroundColor: i === 1 ? COLORS.secondary : COLORS.primary,
          }}
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -4, 0] }}
          transition={{ duration: 1, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function SplashScreen() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: COLORS.background,
        zIndex: 9999,
      }}
      dir="rtl"
    >
      <section style={{ width: '100%', maxWidth: 384, textAlign: 'center' }}>
        <motion.div
          style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: '2.2rem',
            padding: 20,
            boxShadow: '0 24px 55px rgba(0, 60, 143, 0.24)',
            background: `linear-gradient(145deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
          }}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '1.7rem',
              border: `4px solid ${COLORS.secondaryLight}`,
              background: 'linear-gradient(180deg, #ffffff 0%, #eef5ff 100%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.25,
                background: `radial-gradient(circle at 50% 10%, ${COLORS.primaryLight}, transparent 48%)`,
              }}
            />

            <div style={{ position: 'relative', paddingTop: 16, paddingBottom: 24 }}>
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
          style={{ marginTop: 32 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '3rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              fontFamily: '"Heebo", "Arial", sans-serif',
              color: COLORS.primaryDark,
            }}
          >
            הספרייה שלי
          </h1>

          <motion.div
            style={{
              margin: '16px auto 0',
              height: 4,
              width: 112,
              borderRadius: 99,
              background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.primary})`,
            }}
            animate={{ scaleX: [0.65, 1, 0.65], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.p
            style={{
              marginTop: 20,
              fontSize: '1.5rem',
              fontWeight: 600,
              fontFamily: '"Heebo", "Arial", sans-serif',
              color: COLORS.primary,
            }}
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            טוען...
          </motion.p>

          <LoadingDots />
        </motion.div>
      </section>
    </motion.div>
  );
}
