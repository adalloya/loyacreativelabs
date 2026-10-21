// src/components/apex/ApexOnboardingModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Camera,
  Utensils,
  Music,
  Sliders,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Eye,
  FileText
} from 'lucide-react';

interface ApexOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialStep {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  points: { title: string; desc: string; icon?: React.ElementType }[];
  visualPreview: {
    tag: string;
    headline: string;
    description: string;
    highlights: string[];
  };
  tip: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    badge: 'PASO 1 DE 7 • LO BÁSICO',
    title: 'Bienvenido a APEX: Tu Asistente Personal',
    subtitle: 'Diseñado para que cualquier persona, sin importar su edad o experiencia tecnológica, entrene con seguridad y confianza.',
    icon: Sparkles,
    accentColor: '#10B981',
    points: [
      {
        title: 'Hecho a tu medida sin complicaciones',
        desc: 'No necesitas memorizar nada. La app te guía ejercicio por ejercicio, calcula tus descansos y te sugiere qué hacer cada día.',
        icon: ShieldCheck
      },
      {
        title: 'Navegación con 4 botones sencillos abajo',
        desc: '1) Gimnasio (tus ejercicios de hoy), 2) Calendario (días que entrenaste), 3) Nutrición (tu menú de comida) y 4) Ajustes (tus datos).',
        icon: Eye
      },
      {
        title: 'Letras grandes y botones táctiles',
        desc: 'Todo tiene textos claros, números visibles y botones amplios para que puedas leer y tocar cómodamente mientras entrenas.',
        icon: CheckCircle2
      }
    ],
    visualPreview: {
      tag: 'VISTA RÁPIDA DE LA APP',
      headline: '4 Pestañas Principales en la Parte Inferior',
      description: 'Solo toca el icono del Gimnasio para ver tu rutina de hoy, o el tenedor para ver qué comer.',
      highlights: ['🏋️ Gimnasio: Ejercicios de hoy', '📅 Calendario: Días cumplidos', '🥗 Nutrición: Menús saludables', '⚙️ Ajustes: Tus datos personales']
    },
    tip: 'Consejo: Puedes cerrar este tutorial en cualquier momento con la cruz (X) arriba a la derecha y volver a abrirlo cuando gustes desde el menú de tres rayitas.'
  },
  {
    id: 2,
    badge: 'PASO 2 DE 7 • EN EL GIMNASIO',
    title: 'Anotar tus Pesas y Repeticiones',
    subtitle: 'Olvídate de libretas de papel. Registrar tu entrenamiento es tan fácil como llenar dos casillas.',
    icon: Dumbbell,
    accentColor: '#FF2A2A',
    points: [
      {
        title: 'Casillas de Peso y Repeticiones',
        desc: 'En cada ejercicio verás casillas para anotar cuánto peso usaste (libras o kilos) y cuántas repeticiones lograste hacer.',
        icon: Dumbbell
      },
      {
        title: 'La Palomita Verde (✓)',
        desc: 'Al terminar cada serie, presiona el botón con la palomita verde. La serie quedará guardada y se iluminará en color verde de éxito.',
        icon: CheckCircle2
      },
      {
        title: 'Reloj de Descanso Automático',
        desc: 'Al presionar la palomita, empieza a correr un temporizador con sonido para avisarte cuándo tus músculos están listos para la siguiente serie.',
        icon: Clock
      },
      {
        title: 'Calculadora de Discos para Barra',
        desc: 'Toca el botón con forma de disco en cualquier ejercicio con barra: te dice exactamente qué discos poner de cada lado sin hacer cuentas mentales.',
        icon: Sliders
      }
    ],
    visualPreview: {
      tag: 'EJEMPLO VISUAL DE UNA SERIE',
      headline: 'Serie 1: [ 50 lbs ] × [ 10 reps ]  →  [ ✓ Guardar ]',
      description: 'Solo anotas el peso, las repeticiones y presionas la palomita verde. ¡Listo!',
      highlights: ['Casillas editables al toque', 'Temporizador automático al terminar', 'Calculadora de discos incluida']
    },
    tip: 'Si te equivocas de número, no te preocupes: puedes volver a tocar la casilla y corregir el peso o las repeticiones las veces que quieras.'
  },
  {
    id: 3,
    badge: 'PASO 3 DE 7 • CÁMARA INTELIGENTE',
    title: 'Escaneo con Cámara: La Inteligencia Artificial te Explica Todo',
    subtitle: '¿Ves una máquina rara o un platillo y no sabes qué es? Tu cámara te lo dice en segundos.',
    icon: Camera,
    accentColor: '#3B82F6',
    points: [
      {
        title: 'Escáner de Máquinas del Gimnasio',
        desc: 'Apunta la cámara a cualquier aparato o máquina. La app te dirá su nombre en español, qué músculo trabaja y cómo acomodar el asiento con seguridad.',
        icon: Camera
      },
      {
        title: 'Instrucciones Claras de Postura',
        desc: 'Te muestra paso a paso cómo agarrar los manubrios y cómo moverte para evitar dolores de espalda o tirones articulares.',
        icon: ShieldCheck
      },
      {
        title: 'Escáner de Comida en tu Plato',
        desc: 'Tómale una foto a tu desayuno o comida: la app estima los ingredientes, porciones y proteínas para que no te compliques pesando alimentos.',
        icon: Utensils
      }
    ],
    visualPreview: {
      tag: 'CÓMO USAR LA CÁMARA',
      headline: 'Toca el botón de Cámara → Toma la foto → Lee la explicación',
      description: 'Ideal para perder el miedo a máquinas nuevas en el gimnasio y saber exactamente cómo usarlas.',
      highlights: ['Identifica poleas, mancuernas y prensas', 'Explica postura correcta paso a paso', 'Reconoce comidas y porciones']
    },
    tip: 'Asegúrate de conceder permiso a la cámara en tu teléfono cuando el navegador te lo solicite para que pueda enfocar bien la imagen.'
  },
  {
    id: 4,
    badge: 'PASO 4 DE 7 • ALIMENTACIÓN',
    title: 'Tu Menú de Comidas y Lista de Supermercado',
    subtitle: 'Nutrición deliciosa, práctica y balanceada para que tengas energía sin pasar hambre ni hacer dietas extremas.',
    icon: Utensils,
    accentColor: '#F59E0B',
    points: [
      {
        title: 'Planes a 7, 14 o 30 días',
        desc: 'En la pestaña "Nutrición", elige cuántos días deseas planear tu alimentación para organizarte toda la semana.',
        icon: Clock
      },
      {
        title: 'Tus gustos y restricciones',
        desc: 'Puedes elegir estilo tradicional, vegetariano, keto o escribir notas: si no te gusta el pescado o eres alérgico al cacahuate, la app lo adaptará.',
        icon: Sliders
      },
      {
        title: 'Lista de Compras Lista para el Súper',
        desc: 'Además de tu desayuno, comida, cena y colaciones, genera una lista de compras organizada por pasillos (frutas, verduras, carnes, granos).',
        icon: FileText
      }
    ],
    visualPreview: {
      tag: 'TU DÍA NUTRICIONAL TÍPICO',
      headline: 'Desayuno • Comida • Cena • Lista de Compras',
      description: 'Cada receta incluye ingredientes cotidianos que compras en cualquier tienda o mercado.',
      highlights: ['Huevos a la mexicana con aguacate', 'Pechuga a la plancha con arroz y verduras', 'Lista de compras semanal lista para imprimir']
    },
    tip: 'Toca el botón "Copiar Lista de Compras" para pegarla directamente en tus notas o mandártela por WhatsApp a tu familia.'
  },
  {
    id: 5,
    badge: 'PASO 5 DE 7 • MÚSICA & EFECTOS',
    title: 'Música de Spotify y Visualizadores 3D',
    subtitle: 'Entrena con tu música favorita y disfruta de fondos visuales que bailan al ritmo de tus canciones.',
    icon: Music,
    accentColor: '#1DB954',
    points: [
      {
        title: 'Conexión Directa con Spotify',
        desc: 'Toca "Conectar Spotify" en la barra inferior. Podrás pausar, saltar canciones y ver la carátula del disco sin salirte de APEX.',
        icon: Music
      },
      {
        title: 'Botón FX: 6 Visualizadores 3D en Vivo',
        desc: 'El botón "FX" en la barra inferior cambia el fondo de tu pantalla entre: Aurora Boreal, Ondas Tesla, Núcleo 3D, Túnel Warp, Vórtice y Ecualizador.',
        icon: Sparkles
      },
      {
        title: 'Reactivación Sencilla en iPhone (iOS)',
        desc: 'Si usas iPhone, abre tu app de Spotify, dale Play a cualquier canción y regresa a la app: se conectará automáticamente.',
        icon: ShieldCheck
      }
    ],
    visualPreview: {
      tag: 'BARRA INFERIOR DE MÚSICA',
      headline: '[ ⏮ ]   ( ⏸ PAUSAR )   [ ⏭ ]   •   [ FX: AURA ]',
      description: 'Cambia de canción, pon pausa o toca FX para alternar las animaciones 3D que reaccionan a los compases musicales.',
      highlights: ['Sincroniza los colores con la portada del álbum', 'Cambia el ritmo visual según la velocidad de la canción', 'Si prefieres pantalla limpia, FX: OFF apaga todo']
    },
    tip: 'Si quieres ahorrar batería en tu teléfono, pon el botón FX en "OFF" y el visualizador se apagará al 100% gastando 0% de batería.'
  },
  {
    id: 6,
    badge: 'PASO 6 DE 7 • AJUSTES & CUIDADO',
    title: 'Ajustes, Kilos/Libras y Protección de Articulaciones',
    subtitle: 'La aplicación se adapta a tu cuerpo y a tu equipo disponible, cuidando tu salud en todo momento.',
    icon: Sliders,
    accentColor: '#8B5CF6',
    points: [
      {
        title: 'Cambio entre Libras (LBS) o Kilos (KG)',
        desc: 'En el menú de tres rayitas puedes elegir si pesas tus barras en Libras (LBS) o en Kilos (KG) con un solo toque.',
        icon: Sliders
      },
      {
        title: 'Adaptación para Dolores o Molestias',
        desc: 'Si un día te molesta un hombro o rodilla, puedes indicarlo y la app te ofrecerá ejercicios alternativos sin impacto lesivo.',
        icon: ShieldCheck
      },
      {
        title: 'Exportar tu Plan en PDF Imprimible',
        desc: 'En el menú de tres rayitas hay un botón para descargar tu rutina completa en un archivo PDF para imprimirlo o mostrárselo a tu médico.',
        icon: FileText
      }
    ],
    visualPreview: {
      tag: 'MENÚ DE TRES RAYITAS (ARRIBA A LA DERECHA)',
      headline: 'Configuraciones Rápidas al Alcance',
      description: 'Aquí cambias entre modo claro/oscuro, unidades de peso y descargas tu PDF.',
      highlights: ['Unidad de pesas: LBS o KG', 'Modo Oscuro / Claro para tus ojos', 'Descargar PDF de rutina y dieta']
    },
    tip: 'Si alguna vez cambias de gimnasio o viajas a un hotel, en el menú puedes elegir "Hotel (Mancuernas)" o "Casa" y la rutina cambiará al instante.'
  },
  {
    id: 7,
    badge: 'PASO 7 DE 7 • ¡ESTÁS LISTO!',
    title: '¡Felicidades! Ya Conoces Todos los Secretos',
    subtitle: 'Recuerda: la constancia vale mucho más que la rapidez. Un entrenamiento bien hecho a tu ritmo cambiará tu vida.',
    icon: Trophy,
    accentColor: '#EAB308',
    points: [
      {
        title: '1. Ve a tu propio paso',
        desc: 'Empieza con pesos que sientas cómodos y seguros. Lo más valioso es aprender el movimiento con buena postura.',
        icon: CheckCircle2
      },
      {
        title: '2. No temas tocar los botones',
        desc: 'La app no se descompone ni borra tus datos. Todo se guarda automáticamente en tu teléfono.',
        icon: ShieldCheck
      },
      {
        title: '3. El tutorial siempre está disponible',
        desc: 'Si algún día olvidas cómo hacer algo, solo toca el menú de tres rayitas y presiona "Guía y Tutorial para Todos".',
        icon: BookOpen
      }
    ],
    visualPreview: {
      tag: 'COMPROMISO DE SALUD Y VITALIDAD',
      headline: '¡Hoy Comienza tu Mejor Versión!',
      description: 'Tienes en tus manos la herramienta más avanzada y sencilla para mantenerte fuerte, ágil y saludable por muchos años.',
      highlights: ['Fuerza muscular a cualquier edad', 'Articulaciones protegidas', 'Nutrición clara y deliciosa']
    },
    tip: '¡Listo! Presiona el botón verde abajo para comenzar tu primera sesión con APEX.'
  }
];

export const ApexOnboardingModal: React.FC<ApexOnboardingModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex(prev => Math.min(TUTORIAL_STEPS.length - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-[#121214] border border-white/[0.14] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Cabecera con Progreso Visual y Botón de Cierre */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md border"
              style={{ 
                backgroundColor: `${currentStep.accentColor}25`,
                borderColor: `${currentStep.accentColor}40`,
                color: currentStep.accentColor
              }}
            >
              <StepIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: currentStep.accentColor }}>
                  {currentStep.badge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1">
                Guía Paso a Paso para Todos
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white border border-white/[0.08] flex items-center justify-center transition-all active:scale-95"
            title="Cerrar tutorial"
            aria-label="Cerrar tutorial"
          >
            <X size={18} />
          </button>
        </div>

        {/* Indicadores de Pasos tipo Barra Superior */}
        <div className="grid grid-cols-7 gap-1 px-4 sm:px-6 pt-3 bg-black/20">
          {TUTORIAL_STEPS.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className="group py-1 cursor-pointer focus:outline-none"
              title={`Ir a: ${step.title}`}
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'bg-white shadow-sm ring-1 ring-white/50'
                    : idx < currentStepIndex
                    ? 'bg-[#10B981]'
                    : 'bg-white/[0.15] group-hover:bg-white/30'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Cuerpo del Tutorial con Scroll Suave */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Título y Subtítulo en Lenguaje Claro y Letra Grande */}
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              {currentStep.title}
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 mt-1.5 leading-relaxed font-normal">
              {currentStep.subtitle}
            </p>
          </div>

          {/* Tarjeta Visual de Previsualización Didáctica */}
          <div 
            className="p-4 sm:p-5 rounded-2xl border space-y-3 shadow-lg"
            style={{ 
              backgroundColor: `${currentStep.accentColor}10`,
              borderColor: `${currentStep.accentColor}30`
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/40 text-white border border-white/10">
                {currentStep.visualPreview.tag}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Paso {currentStepIndex + 1} de 7
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white">
              {currentStep.visualPreview.headline}
            </h4>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {currentStep.visualPreview.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {currentStep.visualPreview.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-white">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: currentStep.accentColor }} />
                  <span className="truncate">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Puntos Explicativos en Viñetas Grandes */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
              DETALLES CLAVE QUE DEBES CONOCER:
            </h4>
            
            <div className="space-y-2.5">
              {currentStep.points.map((pt, i) => {
                const PtIcon = pt.icon || CheckCircle2;
                return (
                  <div 
                    key={i} 
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-3"
                  >
                    <div 
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border"
                      style={{ 
                        backgroundColor: `${currentStep.accentColor}15`,
                        borderColor: `${currentStep.accentColor}30`,
                        color: currentStep.accentColor
                      }}
                    >
                      <PtIcon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-sm font-bold text-white leading-tight">
                        {pt.title}
                      </h5>
                      <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                        {pt.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consejo Amigable para Mayores */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200 leading-relaxed">
            <HelpCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Nota de confianza: </span>
              <span>{currentStep.tip}</span>
            </div>
          </div>

        </div>

        {/* Barra Inferior de Navegación con Botones Grandes y Claros */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-black/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className={`py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 border ${
              isFirst
                ? 'opacity-30 cursor-not-allowed border-transparent text-zinc-500'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/10'
            }`}
          >
            <ChevronLeft size={18} />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
            <span>{currentStepIndex + 1}</span>
            <span>/</span>
            <span>{TUTORIAL_STEPS.length}</span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xl text-black"
            style={{
              backgroundColor: currentStep.accentColor,
              boxShadow: `0 4px 20px -4px ${currentStep.accentColor}50`
            }}
          >
            <span>{isLast ? '¡Comenzar a Entrenar!' : 'Siguiente Paso'}</span>
            <ChevronRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default ApexOnboardingModal;
