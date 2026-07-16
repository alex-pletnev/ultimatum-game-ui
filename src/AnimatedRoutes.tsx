import { Route, Routes, useLocation } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { App } from './App';
import { CreateSession } from './routes/CreateSession';
import { Lobby } from './routes/Lobby';
import { Npc } from './routes/Npc';
import { Register } from './routes/Register';
import { Session } from './routes/Session';
import { Stats } from './routes/Stats';
import { StyleGuide } from './routes/StyleGuide';
import { easeSolemn } from './lib/motion';

/**
 * AnimatePresence с ключом по pathname даёт cross-fade при смене route'а.
 * Fade-in новый (250ms ease-solemn) + fade-out старый (150ms linear).
 * Reduced-motion → мгновенный переход без transition.
 */
export function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        {...(reduce
          ? {}
          : {
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { duration: 0.25, ease: easeSolemn } },
              exit: { opacity: 0, transition: { duration: 0.15, ease: 'linear' as const } },
            })}
      >
        <Routes location={location}>
          <Route path="/" element={<App />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/lobby/new" element={<CreateSession />} />
          <Route path="/npc" element={<Npc />} />
          <Route path="/session/:id" element={<Session />} />
          <Route path="/session/:id/stats" element={<Stats />} />
          <Route path="/_style-guide" element={<StyleGuide />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
