import React, { useState } from 'react';
import { FlipbookViewer } from './components/FlipbookViewer';
import { BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const KANDAMS = [
  {
    id: 1,
    title: "பால காண்டம்",
    subtitle: "Bala Kandam",
    url: "https://cdn.jsdelivr.net/gh/Ramayana-Mama/Ramayanam@main/1_%E0%AE%AA%E0%AE%BE%E0%AE%B2_%E0%AE%95%E0%AE%BE%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AE%AE%E0%AF%8D%20_1-77.pdf"
  },
  {
    id: 2,
    title: "அயோத்யா காண்டம்",
    subtitle: "Ayodhya Kandam",
    url: "https://cdn.jsdelivr.net/gh/Ramayana-Mama/Ramayanam@main/2_%E0%AE%85%E0%AE%AF%E0%AF%87%E0%AE%BE%E0%AE%A4%E0%AF%8D%E0%AE%AF%E0%AE%BE_%E0%AE%95%E0%AE%BE%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AE%AE%E0%AF%8D_1-119.pdf"
  },
  {
    id: 3,
    title: "ஆரண்ய காண்டம்",
    subtitle: "Aranya Kandam",
    url: "https://cdn.jsdelivr.net/gh/Ramayana-Mama/Ramayanam@main/3_%E0%AE%86%E0%AE%B0%E0%AE%A3%E0%AF%8D%E0%AE%AF_%E0%AE%95%E0%AE%BE%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AE%AE%E0%AF%8D_1-75.pdf"
  },
  {
    id: 4,
    title: "கிஷ்கிந்தா காண்டம்",
    subtitle: "Kishkindha Kandam",
    url: "https://cdn.jsdelivr.net/gh/Ramayana-Mama/Ramayanam@main/4_%E0%AE%95%E0%AE%BF%E0%AE%B7%E0%AF%8D%E0%AE%95%E0%AE%BF%E0%AE%A8%E0%AF%8D%E0%AE%A4%E0%AE%BE_%E0%AE%95%E0%AE%BE%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AE%AE%E0%AF%8D_WIP.pdf"
  },
  {
    id: 5,
    title: "சுந்தர காண்டம்",
    subtitle: "Sundara Kandam",
    url: "https://cdn.jsdelivr.net/gh/Ramayana-Mama/Ramayanam@main/5_%E0%AE%9A%E0%AF%81%E0%AE%A8%E0%AF%8D%E0%AE%A4%E0%AE%B0_%E0%AE%95%E0%AE%BE%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AE%AE%E0%AF%8D_1-68.pdf"
  },
  {
    id: 6,
    title: "யுத்த காண்டம்",
    subtitle: "Yuddha Kandam",
    url: "https://cdn.jsdelivr.net/gh/Ramayana-Mama/Ramayanam@main/6_%E0%AE%AF%E0%AF%81%E0%AE%A4%E0%AF%8D%E0%AE%A4_%E0%AE%95%E0%AE%BE%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AE%AE%E0%AF%8D_1-131.pdf"
  }
];

export default function App() {
  const [activeDoc, setActiveDoc] = useState<{title: string, url: string} | null>(null);

  const handleClose = () => setActiveDoc(null);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!activeDoc ? (
          <motion.div
            key="library-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex flex-col p-6 relative"
          >
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.05)_100%)] pointer-events-none"></div>

            <div className="z-10 flex flex-col items-center max-w-5xl mx-auto w-full pt-16">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-6 mb-16"
              >
                <motion.div 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.15)] overflow-hidden bg-white"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <img 
                    src="./Ramayana-Mama.webp" 
                    alt="Ramayana Mama"
                    referrerPolicy="strict-origin"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <div className="text-center space-y-3 mt-2">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-neutral-900 tracking-tight drop-shadow-sm">
                    இராமாயணம்
                  </h1>
                  <p className="text-neutral-500 font-serif tracking-widest uppercase text-sm md:text-base">
                    Ramayana Mama&apos;s Tamil Edition
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-20">
                {KANDAMS.map((kandam, index) => (
                  <motion.button
                    key={kandam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    onClick={() => setActiveDoc(kandam)}
                    className="group flex flex-col items-start gap-2 p-5 bg-white border border-neutral-200 hover:border-indigo-500/50 rounded-lg text-left transition-all hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md hover:shadow-xl"
                  >
                    <div className="text-3xl font-serif font-black text-neutral-200 group-hover:text-indigo-600/20 transition-colors">
                      0{kandam.id}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="text-xl font-serif font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors leading-tight">
                        {kandam.title}
                      </h3>
                      <p className="text-neutral-500 text-sm font-serif">
                        {kandam.subtitle}
                      </p>
                    </div>
                    <div className="mt-2 inline-flex items-center space-x-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sm font-bold text-indigo-600">
                      <span>Read Kandam</span>
                      <span className="text-lg leading-none">&rarr;</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewer-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 bg-neutral-100"
          >
            <FlipbookViewer document={activeDoc} onClose={handleClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
