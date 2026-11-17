import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  Laptop,
  PlusSquare,
  Share,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import AmbientBackground from '../components/AmbientBackground'
import GlassCard from '../components/GlassCard'

function detectOS() {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  if (/android/i.test(ua)) return 'android'
  const isAppleTouch =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isAppleTouch) return 'ios'
  return 'desktop'
}

const OS_META = {
  android: { label: 'Android detectado', icon: Smartphone },
  ios: { label: 'iOS detectado', icon: Smartphone },
  desktop: { label: 'PC de Escritorio', icon: Laptop },
}

const PWA_STEPS = {
  ios: [
    {
      title: 'Abrí en Safari',
      desc: 'Asegurate de estar viendo AulaPulse desde el navegador Safari.',
      icon: Smartphone,
    },
    {
      title: 'Tocá Compartir',
      desc: 'Presioná el botón de compartir (cuadrado con flecha hacia arriba) en la barra inferior.',
      icon: Share,
    },
    {
      title: 'Añadir a la pantalla de inicio',
      desc: 'Deslizá las opciones, elegí "Añadir a la pantalla de inicio" y confirmá con "Añadir".',
      icon: PlusSquare,
    },
  ],
  desktop: [
    {
      title: 'Buscá el ícono de instalación',
      desc: 'En Chrome o Edge, mirá el extremo derecho de la barra de direcciones.',
      icon: Laptop,
    },
    {
      title: 'Elegí "Instalar AulaPulse"',
      desc: 'También podés abrir el menú (⋮) y seleccionar "Guardar y compartir" → "Instalar aplicación".',
      icon: PlusSquare,
    },
    {
      title: 'Acceso directo listo',
      desc: 'La app se abrirá en su propia ventana independiente, como una aplicación nativa.',
      icon: ShieldCheck,
    },
  ],
}

export default function Instalacion() {
  const os = useMemo(detectOS, [])
  const meta = OS_META[os]
  const OsIcon = meta.icon
  const steps = PWA_STEPS[os === 'ios' ? 'ios' : 'desktop']

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-indigo-950 text-white">
      <AmbientBackground />

      <main className="relative mx-auto w-full max-w-md space-y-5 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {/* Cabecera */}
        <header className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2 text-xs font-bold text-indigo-100 hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/35 px-3 py-1 text-xs font-bold text-cyan-300">
            <OsIcon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        </header>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
            App Móvil y PWA
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
            Instalar AulaPulse
          </h1>
          <p className="mt-1 text-sm text-indigo-200/80">
            Llevá la gestión escolar en tu pantalla de inicio sin depender del navegador.
          </p>
        </div>

        {os === 'android' ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <GlassCard className="p-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/15 border border-cyan-300/40 text-cyan-300 shadow-neon-cyan">
                <Smartphone className="h-8 w-8" />
              </div>

              <div>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/35 px-3 py-0.5 text-[11px] font-bold text-emerald-300">
                  Versión Nativa Android
                </span>
                <h2 className="mt-2.5 text-xl font-black text-white">
                  Descargá el APK oficial
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-indigo-200/80">
                  Instalación directa optimizada para pasar lista rápido en el aula.
                </p>
              </div>

              <motion.a
                href="/aulapulse.apk"
                download="AulaPulse.apk"
                whileTap={{ scale: 0.97 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-base font-black text-indigo-950 shadow-neon-cyan border border-cyan-200/70 transition"
              >
                <Download className="h-5 w-5 stroke-[2.5]" />
                Descargar AulaPulse (.apk)
              </motion.a>
            </GlassCard>

            <GlassCard className="p-4 flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-indigo-200/80">
                Si Android solicita permiso al abrir el archivo, activá{' '}
                <span className="font-bold text-white">
                  &quot;Instalar aplicaciones de fuentes desconocidas&quot;
                </span>{' '}
                para tu navegador y continuá la instalación.
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <GlassCard className="p-5 space-y-4">
              <div>
                <span className="rounded-full bg-pink-500/20 border border-pink-400/35 px-3 py-0.5 text-[11px] font-bold text-pink-200">
                  Guía PWA · {os === 'ios' ? 'iPhone / iPad' : 'Escritorio'}
                </span>
                <h2 className="mt-2 text-lg font-black text-white">
                  Añadir a la pantalla de inicio
                </h2>
              </div>

              <ol className="space-y-3">
                {steps.map((step, index) => {
                  const StepIcon = step.icon
                  return (
                    <li
                      key={step.title}
                      className="flex items-start gap-3 rounded-2xl bg-indigo-950/60 border border-white/10 p-3.5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 border border-cyan-400/35 text-sm font-black text-cyan-300">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-extrabold text-white">
                          <StepIcon className="h-4 w-4 shrink-0 text-pink-300" />
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-indigo-200/80">
                          {step.desc}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </GlassCard>

            {os === 'desktop' && (
              <GlassCard className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white">
                    ¿Querés el APK para Android?
                  </p>
                  <p className="text-[11px] text-indigo-300/75">
                    Descargalo en tu PC para pasarlo al celular.
                  </p>
                </div>
                <a
                  href="/aulapulse.apk"
                  download="AulaPulse.apk"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-cyan-400/15 border border-cyan-400/40 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/25 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  APK
                </a>
              </GlassCard>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
