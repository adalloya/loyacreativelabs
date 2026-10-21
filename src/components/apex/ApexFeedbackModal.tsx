// src/components/apex/ApexFeedbackModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Star,
  Send,
  MessageSquareHeart,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  Heart,
  Loader2
} from 'lucide-react';
import { submitFeedback, FeedbackSubmission } from '@/services/feedbackService';

interface ApexFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'sugerencia', label: '💡 Sugerencia de nueva función', icon: Lightbulb },
  { id: 'falta_algo', label: '⚡️ Algo que me hace falta', icon: Sparkles },
  { id: 'ajuste_tecnico', label: '🛠 Reporte o ajuste técnico', icon: AlertTriangle },
  { id: 'opinion_general', label: '❤️ Opinión general', icon: Heart },
] as const;

const RATING_LABELS: Record<number, string> = {
  1: 'Necesita mejorar bastante 🛠',
  2: 'Regular, hay detalles por afinar 😐',
  3: 'Buena experiencia 🙂',
  4: 'Muy buena y útil 👍',
  5: '¡Excelente plataforma! 🌟'
};

export const ApexFeedbackModal: React.FC<ApexFeedbackModalProps> = ({
  isOpen,
  onClose
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<FeedbackSubmission['category']>('sugerencia');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Por favor escribe tu comentario o sugerencia antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitFeedback({
        rating,
        category,
        message: message.trim(),
        name: name.trim() || undefined,
        email: email.trim() || undefined
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || 'Ocurrió un error al enviar tu comentario. Intenta nuevamente.');
      }
    } catch {
      setErrorMessage('Ocurrió un error de conexión al enviar. Por favor reintenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setMessage('');
    setName('');
    setEmail('');
    setRating(5);
    setCategory('sugerencia');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-[#121214] border border-white/[0.14] rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF2A2A]/15 border border-[#FF2A2A]/30 flex items-center justify-center text-[#FF2A2A] shadow-md shrink-0">
              <MessageSquareHeart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#FF2A2A] uppercase font-bold tracking-wider">
                  COMUNIDAD & MEJORA CONTINUA
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Danos tu Opinión o Qué te Falta
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-9 h-9 rounded-2xl bg-white/[0.06] hover:bg-white/[0.15] text-zinc-400 hover:text-white border border-white/[0.08] flex items-center justify-center transition-all active:scale-95"
            title="Cerrar formulario"
            aria-label="Cerrar formulario"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido / Formulario */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {isSuccess ? (
            /* Pantalla de Agradecimiento Cálida y Formal */
            <div className="py-8 px-4 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shadow-xl shadow-[#10B981]/20">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  ¡Muchísimas gracias por tu valiosa opinión!
                </h4>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-md mx-auto">
                  Hemos recibido tus comentarios con éxito. Nuestro equipo revisa cada mensaje para seguir perfeccionando APEX y adaptarlo a lo que tú necesitas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] max-w-md mx-auto text-left space-y-1.5 text-xs text-zinc-400">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Tu apoyo hace crecer la plataforma</span>
                </div>
                <p className="leading-relaxed">
                  Gracias a comentarios como el tuyo, agregamos nuevas herramientas, mejoramos la sencillez y cuidamos la salud de todos los atletas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-bold text-sm rounded-2xl hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
              >
                Volver a la Aplicación
              </button>
            </div>
          ) : (
            /* Formulario Completo */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Mensaje Introductorio Formal */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-white/[0.05] to-transparent border border-white/[0.08] space-y-1">
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  Tu experiencia es nuestra máxima prioridad. Cuéntanos qué funciones te gustaría ver, qué te hace falta en tus entrenamientos o qué podemos simplificar para ti.
                </p>
              </div>

              {/* Selector de Calificación con Estrellas */}
              <div className="space-y-2 text-center sm:text-left">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
                  1. ¿CÓMO CALIFICAS TU EXPERIENCIA HASTA AHORA?
                </label>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating !== null ? hoverRating : rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                        aria-label={`${star} estrellas`}
                      >
                        <Star
                          size={28}
                          className={`transition-colors ${
                            active
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                              : 'text-zinc-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-mono text-amber-300 font-medium">
                  {RATING_LABELS[hoverRating !== null ? hoverRating : rating]}
                </div>
              </div>

              {/* Selector de Tipo de Mensaje */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
                  2. ¿QUÉ TIPO DE COMENTARIO DESEAS COMPARTIR?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left text-xs font-medium transition-all flex items-center gap-2.5 active:scale-98 ${
                          isSelected
                            ? 'bg-white text-black border-white shadow-md font-bold'
                            : 'bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:bg-white/[0.08]'
                        }`}
                      >
                        <Icon size={16} className={isSelected ? 'text-black' : 'text-zinc-400'} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Área de Texto para la Opinión */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block font-semibold flex items-center justify-between">
                  <span>3. TU MENSAJE O SUGERENCIA</span>
                  <span className="text-[#FF2A2A] text-[10px]">* OBLIGATORIO</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe aquí con total libertad: qué herramientas te gustaría tener, qué cosas te parecen difíciles de usar, sugerencias de ejercicios, o cualquier detalle que desees..."
                  className="w-full bg-black/50 border border-white/[0.12] focus:border-[#FF2A2A] focus:ring-1 focus:ring-[#FF2A2A] rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 transition-all resize-none outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Campos Opcionales: Nombre y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/[0.06]">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                    Tu Nombre o Alias (Opcional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Roberto o María"
                    className="w-full bg-black/40 border border-white/[0.1] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                    Tu Correo (Opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Para responderte si lo deseas"
                    className="w-full bg-black/40 border border-white/[0.1] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                  />
                </div>
              </div>

              {/* Mensaje de Error si aplica */}
              {errorMessage && (
                <div className="p-3 bg-[#FF2A2A]/15 border border-[#FF2A2A]/30 rounded-xl text-xs text-[#FF2A2A] font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#FF2A2A] hover:bg-[#ff4444] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#FF2A2A]/25 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando tu opinión...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Enviar mi Opinión al Equipo</span>
                  </>
                )}
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default ApexFeedbackModal;
