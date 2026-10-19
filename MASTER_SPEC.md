# MASTER BLUEPRINT: SISTEMA AVANZADO DE HIPERTROFIA, BIOMECÁNICA 3D Y NUTRICIÓN CLÍNICA (APEX OS)

## 1. VISIÓN Y REGLAS ESTRICTAS DE DISEÑO (TESLA UI / APPLE FITNESS)
Aplicación Progresiva (PWA) Full-Stack en **Next.js (App Router, TypeScript, Tailwind CSS)** conectada a **Supabase** y **Google Gemini API (`@google/generative-ai`)**.
- **Estética Industrial Monocromática:**
  - Fondo primario: `#050505` (Obsidian Black).
  - Superficies / Tarjetas: `#111111` con bordes técnicos de `1px solid #222222`.
  - Tipografía primaria: `Inter` o `SF Pro Display` en `#FFFFFF` (títulos limpios, tracking ajustado).
  - Tipografía de telemetría: `JetBrains Mono` en `#888888` y `#EAEAEA` para todos los pesos (kg), repeticiones, RIR, cronómetros, BPM, porcentajes y macronutrientes.
  - Acentos semánticos únicos: `#EAEAEA` (botones primarios), `#FF2A2A` (zonas musculares activas / RIR 0 / Fallo muscular), `#FFB800` (alerta de asimetría o fatiga).
- **Cero Ruido Visual (No AI-Slop):**
  - Cero emojis o gradientes multicolores innecesarios. Todo elemento en pantalla es telemetría funcional.
- **Operación con Una Sola Mano:**
  - Selectores, calculadoras de discos y buscadores de ejercicios en paneles inferiores táctiles (*Drawers*).

---

## 2. REPOSITORIOS Y LIBRERÍAS DE REFERENCIA
1. **Catálogo de Ejercicios:** `yuhonas/free-exercise-db` + `wrkout/exercises.json` (sincronizados con vectores musculares, cabezas anatómicas y perfiles de resistencia).
2. **Motor Biomecánico & Anatómico:** Visor interactivo multi-zona (Frontal y Posterior) con selección táctil directa por grupo muscular y cabezas anatómicas.
3. **Hardware en Gimnasio:** Screen Wake Lock API (`navigator.wakeLock`) para pantalla activa continua en el gimnasio, pulsos acústicos `AudioContext` y vibración háptica (`navigator.vibrate`) para el cronómetro de descanso sin pausar la música en AirPods.
4. **Nutrición & Fisiología:** Fórmulas metabólicas Katch-McArdle y Mifflin-St Jeor, con cálculo automático de TMB, TDEE, déficit calórico (15-20%) y macros ($2.2\text{ g/kg}$ proteína). Generador de dieta de 30 días con Google Gemini.
5. **Telemetría Musical (Tesla-Style):** Curación por cadencia y fase de entrenamiento (Calentamiento 110-120 BPM, Series Pesadas 130-150 BPM, Cardio 120-128 BPM).

---

## 3. ESQUEMA DE BASE DE DATOS (SUPABASE SQL)
Archivos ubicados en `/supabase/schema.sql` y `/supabase/seed.sql` con perfiles biométricos, rutinas semanales, historial de series (sobrecarga progresiva), planes de nutrición y telemetría diaria.
