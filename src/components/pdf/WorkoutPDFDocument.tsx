// src/components/pdf/WorkoutPDFDocument.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontFamily: 'Helvetica',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 18,
    paddingRight: 18,
    fontSize: 7,
    lineHeight: 1.25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#DC2626',
    paddingBottom: 6,
    marginBottom: 7,
  },
  brand: {
    fontSize: 6.5,
    letterSpacing: 1.5,
    color: '#DC2626',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'right',
  },
  badgeEmerald: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#34D399',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 2,
  },
  sectionTitle: {
    fontSize: 7.5,
    letterSpacing: 1,
    color: '#DC2626',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  sectionSub: {
    fontSize: 6,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  profileCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4.5,
    borderRadius: 4,
    flex: 1,
    marginRight: 4,
  },
  profileCardLast: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4.5,
    borderRadius: 4,
    flex: 1,
    marginRight: 0,
  },
  profileCardHighlight: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: 4.5,
    borderRadius: 4,
    flex: 1,
    marginRight: 4,
  },
  cardLabel: {
    fontSize: 5.5,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 1.5,
    letterSpacing: 0.4,
  },
  cardValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardValueHighlight: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  cardSubtext: {
    fontSize: 6,
    color: '#475569',
    marginTop: 1,
  },
  // Routine Week Grid
  routineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dayCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 4,
    marginBottom: 4,
  },
  dayCardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 2.5,
    marginBottom: 3,
  },
  dayBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  dayName: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCardioPill: {
    fontSize: 5,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    fontWeight: 'bold',
  },
  dayTitle: {
    fontSize: 6.8,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  exerciseRow: {
    flexDirection: 'column',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 2,
  },
  exerciseRowLast: {
    flexDirection: 'column',
    paddingTop: 2,
  },
  exerciseName: {
    fontSize: 6.2,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  exerciseMeta: {
    fontSize: 5.4,
    color: '#475569',
    marginTop: 0.5,
  },
  // Diet & Grocery 3-Column Grid
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  nutritionCol1: {
    flex: 2.2,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 5,
    marginRight: 4,
  },
  nutritionCol2: {
    flex: 1.5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 5,
    marginRight: 4,
  },
  nutritionCol3: {
    flex: 1.8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 5,
  },
  subHeaderTitle: {
    fontSize: 6.8,
    fontWeight: 'bold',
    color: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 2,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mealItem: {
    marginBottom: 3,
    paddingBottom: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0.5,
  },
  mealName: {
    fontSize: 6.2,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  mealMacros: {
    fontSize: 5.4,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  mealDesc: {
    fontSize: 5.4,
    color: '#475569',
  },
  suppItem: {
    marginBottom: 2.5,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  suppName: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  suppTiming: {
    fontSize: 5.2,
    color: '#059669',
    fontWeight: 'bold',
  },
  groceryCatTitle: {
    fontSize: 5.8,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 1,
    marginBottom: 0.5,
    textTransform: 'uppercase',
  },
  groceryItemText: {
    fontSize: 5.4,
    color: '#334155',
    marginBottom: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 8,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#CBD5E1',
    paddingTop: 3,
    fontSize: 5.5,
    color: '#64748B',
  },
});

interface WorkoutPDFDocumentProps {
  profile: any;
  routine?: any[];
  weeklyProgram?: any[];
  diet: any;
}

export function WorkoutPDFDocument({ 
  profile, 
  routine = [], 
  weeklyProgram = [],
  diet 
}: WorkoutPDFDocumentProps) {
  const athleteFullName = `${profile?.firstName || 'Atleta'} ${profile?.lastName || ''}`.trim();

  // Determinación de días de la rutina semanal completa
  const days: any[] = (weeklyProgram && weeklyProgram.length > 0)
    ? weeklyProgram
    : (routine && routine.length > 0
        ? [{
            dayNumber: 1,
            dayName: 'Lunes',
            title: profile?.dayTitle || 'Sesión Activa de Hipertrofia',
            exercises: routine,
            cardio: {
              durationMinutes: profile?.cardioMinutes || 0,
              type: profile?.cardioType || 'none'
            }
          }]
        : []);

  // Formateo del badge de objetivo
  const isSurplus = profile?.fitnessGoal === 'surplus';
  const isDeficit = profile?.fitnessGoal === 'deficit';
  const goalBadgeLabel = isSurplus
    ? `SUPERÁVIT (+${profile?.caloricAdjustmentPct || 15}%)`
    : isDeficit
    ? `DÉFICIT (${profile?.caloricAdjustmentPct ? `${profile.caloricAdjustmentPct}%` : `-${profile?.caloricDeficitPct || 15}%`})`
    : 'MANTENIMIENTO (0%)';

  // Ancho dinámico de columnas de días para ajuste perfecto en 1 sola hoja
  // Si son 3 o menos días: ancho 32% (1 fila)
  // Si son 4 días: ancho 24% (1 fila de 4)
  // Si son 5 o 6 días: ancho 32% (2 filas de 3 columnas)
  const dayColWidth = days.length === 4 ? '24%' : '32.3%';

  // Comidas de la dieta (personalizadas por Gemini si existen, o calibradas a sus macros)
  const userMeals = diet?.dietPlan?.thirtyDayPlan?.[0]?.meals 
    || diet?.dietPlan?.weeklyTemplates?.[0]?.meals 
    || null;

  const targetCal = profile?.targetCalories || 2200;
  const targetProt = profile?.targetProteinG || 180;
  const targetCarb = profile?.targetCarbsG || 240;
  const targetFat = profile?.targetFatsG || 55;

  const defaultMeals = [
    {
      name: 'Comida 1 (Desayuno Anabólico)',
      cal: Math.round(targetCal * 0.25),
      prot: Math.round(targetProt * 0.25),
      desc: '4 claras + 2 huevos enteros, 80g avena integral con canela, 60g frutos rojos.'
    },
    {
      name: 'Comida 2 (Almuerzo de Rendimiento)',
      cal: Math.round(targetCal * 0.35),
      prot: Math.round(targetProt * 0.35),
      desc: '200g pechuga de pollo o res magra, 180g arroz jazmín, 120g brócoli/espárragos, 10ml aceite de oliva.'
    },
    {
      name: 'Comida 3 (Pre/Post-Entreno)',
      cal: Math.round(targetCal * 0.18),
      prot: Math.round(targetProt * 0.18),
      desc: '1 scoop proteína whey (30g), 1 plátano maduro mediano, 25g almendras o nueces.'
    },
    {
      name: 'Comida 4 (Cena de Recuperación)',
      cal: Math.round(targetCal * 0.22),
      prot: Math.round(targetProt * 0.22),
      desc: '200g pescado blanco o lomo magro, 220g papa/camote al horno, ensalada verde con 1/2 aguacate.'
    }
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* =========================================================================
            HEADER & BRANDING PRINCIPAL
           ========================================================================= */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>APEX HYPERTROPHY OS • BLUEPRINT MAESTRO CLÍNICO</Text>
            <Text style={styles.title}>Hoja Maestra de Entrenamiento & Nutrición</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={isSurplus ? styles.badgeEmerald : styles.badgeRed}>
              {goalBadgeLabel} • {targetCal} KCAL
            </Text>
            <Text style={{ fontSize: 5.5, color: '#64748B', marginTop: 1.5, textTransform: 'uppercase' }}>
              CALIBRACIÓN OFICIAL 100% PERSONALIZADA
            </Text>
          </View>
        </View>

        {/* =========================================================================
            SECCIÓN 01: DATOS PERSONALES DEL PERFIL DE ATLETA (HASTA ARRIBA)
           ========================================================================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>01. Perfil Biométrico y Calibración del Atleta</Text>
          <Text style={styles.sectionSub}>ATLETA REGISTRADO: {athleteFullName.toUpperCase()}</Text>
        </View>

        <View style={styles.profileGrid}>
          {/* Card 1: Identificación */}
          <View style={styles.profileCard}>
            <Text style={styles.cardLabel}>Atleta / Biotipo</Text>
            <Text style={styles.cardValue}>{athleteFullName}</Text>
            <Text style={styles.cardSubtext}>
              {profile?.gender === 'female' ? 'Mujer' : 'Hombre'}, {profile?.age || 30} años
            </Text>
          </View>

          {/* Card 2: Composición */}
          <View style={styles.profileCard}>
            <Text style={styles.cardLabel}>Composición Corporal</Text>
            <Text style={styles.cardValue}>{profile?.weightKg || 75} kg ({Math.round((profile?.weightKg || 75) * 2.20462)} lbs)</Text>
            <Text style={styles.cardSubtext}>
              {profile?.heightCm || 175} cm • {profile?.bodyFatPct || 14}% Grasa Est.
            </Text>
          </View>

          {/* Card 3: Programa */}
          <View style={styles.profileCard}>
            <Text style={styles.cardLabel}>Programa & Volumen</Text>
            <Text style={styles.cardValue}>{profile?.trainingDaysPerWeek || days.length || 6} Días / Sem</Text>
            <Text style={styles.cardSubtext}>
              {profile?.sessionDurationMins || 60} min/sesión • {(profile?.environmentMode || 'Gimnasio').replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          {/* Card 4: Balance Energético */}
          <View style={styles.profileCardHighlight}>
            <Text style={styles.cardLabel}>Energía Diaria Meta</Text>
            <Text style={styles.cardValueHighlight}>{targetCal} kcal</Text>
            <Text style={styles.cardSubtext}>
              TMB: {profile?.calculatedBmr || 1700} • TDEE: {profile?.calculatedTdee || 2400} kcal
            </Text>
          </View>

          {/* Card 5: Macros Clínicos */}
          <View style={styles.profileCardLast}>
            <Text style={styles.cardLabel}>Macronutrientes & Agua</Text>
            <Text style={styles.cardValue}>P:{targetProt}g • C:{targetCarb}g • G:{targetFat}g</Text>
            <Text style={styles.cardSubtext}>
              Agua: {profile?.waterLiters || 3.5}L/día • RIR {profile?.readiness === 'optimal' ? '1' : '1-2'}
            </Text>
          </View>
        </View>

        {/* =========================================================================
            SECCIÓN 02: TODA LA RUTINA DE LA SEMANA ACOMODADA POR DÍA
           ========================================================================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>02. Rutina Semanal Completa (Acomodada por Día)</Text>
          <Text style={styles.sectionSub}>SOBRECARGA PROGRESIVA • TEMPO 3-1-1 • RIR 1-2</Text>
        </View>

        <View style={styles.routineGrid}>
          {days.slice(0, 6).map((day: any, dIdx: number) => {
            const dayExs = (day.exercises || []).slice(0, 5);
            const cardioMin = day.cardio?.durationMinutes || 0;
            const cardioLabel = cardioMin > 0 ? `+ Cardio: ${cardioMin}m` : null;

            return (
              <View 
                key={dIdx} 
                style={[styles.dayCard, { width: dayColWidth }]}
                wrap={false}
              >
                {/* Cabecera del Día */}
                <View style={styles.dayCardHeader}>
                  <View style={styles.dayBadgeRow}>
                    <Text style={styles.dayName}>
                      DÍA {day.dayNumber || dIdx + 1} • {(day.dayName || `Día ${dIdx + 1}`).toUpperCase()}
                    </Text>
                    {cardioLabel && (
                      <Text style={styles.dayCardioPill}>{cardioLabel}</Text>
                    )}
                  </View>
                  <Text style={styles.dayTitle}>
                    {day.title || `Sesión ${dIdx + 1}`}
                  </Text>
                </View>

                {/* Lista de Ejercicios del Día */}
                {dayExs.map((ex: any, exIdx: number) => {
                  const sets = ex.targetSets || ex.default_sets || 3;
                  const repsMin = ex.targetRepsMin || ex.rep_range_min || 8;
                  const repsMax = ex.targetRepsMax || ex.rep_range_max || 12;
                  const rir = ex.target_rir !== undefined ? ex.target_rir : (ex.targetRir || 1);
                  const rest = ex.rest_seconds || 90;
                  const isLast = exIdx === dayExs.length - 1;

                  return (
                    <View key={exIdx} style={isLast ? styles.exerciseRowLast : styles.exerciseRow}>
                      <Text style={styles.exerciseName}>
                        {exIdx + 1}. {ex.name}
                      </Text>
                      <Text style={styles.exerciseMeta}>
                        {sets}s × {repsMin}-{repsMax} reps • RIR {rir} • {rest}s
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* =========================================================================
            SECCIÓN 03: DIETA COMPLETA & LISTA DE COMPRAS DE SUPERMERCADO
           ========================================================================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>03. Plan Nutricional Clínico & Lista de Compras</Text>
          <Text style={styles.sectionSub}>FUENTES LIMPIAS • PROTEÍNA ANABÓLICA 2.2G/KG</Text>
        </View>

        <View style={styles.nutritionGrid}>
          {/* Columna 1: Distribución de Comidas del Día (Dieta) */}
          <View style={styles.nutritionCol1}>
            <Text style={styles.subHeaderTitle}>Estructura Diaria de Comidas (Dieta)</Text>
            
            {userMeals && userMeals.length > 0 ? (
              userMeals.slice(0, 4).map((m: any, mIdx: number) => {
                const mealName = m.mealName || m.name || `Comida ${mIdx + 1}`;
                const calories = m.calories || Math.round(((m.macros?.proteinG || 0) * 4) + ((m.macros?.carbsG || 0) * 4) + ((m.macros?.fatsG || 0) * 9)) || 0;
                const protein = m.proteinG || m.macros?.proteinG || 0;
                const items = m.items || (m.ingredients?.map((i: any) => `${i.grams}g ${i.item}`).join(", ")) || "";

                return (
                  <View key={mIdx} style={styles.mealItem}>
                    <View style={styles.mealHeader}>
                      <Text style={styles.mealName}>{mIdx + 1}. {mealName}</Text>
                      <Text style={styles.mealMacros}>{calories} kcal ({protein}g P)</Text>
                    </View>
                    <Text style={styles.mealDesc}>{items}</Text>
                  </View>
                );
              })
            ) : (
              defaultMeals.map((m, mIdx) => (
                <View key={mIdx} style={styles.mealItem}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealName}>{m.name}</Text>
                    <Text style={styles.mealMacros}>~{m.cal} kcal ({m.prot}g P)</Text>
                  </View>
                  <Text style={styles.mealDesc}>{m.desc}</Text>
                </View>
              ))
            )}
          </View>

          {/* Columna 2: Suplementación Grado A */}
          <View style={styles.nutritionCol2}>
            <Text style={styles.subHeaderTitle}>Suplementación Grado A</Text>
            <View style={styles.suppItem}>
              <Text style={styles.suppName}>• Creatina Creapure (5g)</Text>
              <Text style={styles.suppTiming}>Diario continuo post-entreno</Text>
            </View>
            <View style={styles.suppItem}>
              <Text style={styles.suppName}>• Proteína Whey Isolate (30g)</Text>
              <Text style={styles.suppTiming}>Post-sesión o entre comidas</Text>
            </View>
            <View style={styles.suppItem}>
              <Text style={styles.suppName}>• Omega-3 Ultra Puro (2,500mg)</Text>
              <Text style={styles.suppTiming}>Con el desayuno o comida copiosa</Text>
            </View>
            <View style={styles.suppItem}>
              <Text style={styles.suppName}>• Magnesio Bisglicinato (400mg)</Text>
              <Text style={styles.suppTiming}>60 min antes de dormir</Text>
            </View>
            <View style={{ marginTop: 2 }}>
              <Text style={{ fontSize: 5.5, color: '#64748B', fontWeight: 'bold' }}>
                HIDRATACIÓN: {profile?.waterLiters || 3.5} Litros de agua/día
              </Text>
            </View>
          </View>

          {/* Columna 3: Lista de Compras de Supermercado Consolidada */}
          <View style={styles.nutritionCol3}>
            <Text style={styles.subHeaderTitle}>Lista de Compras (Semanal)</Text>
            
            <Text style={styles.groceryCatTitle}>Proteínas Magras</Text>
            <Text style={styles.groceryItemText}>• Pechuga de pollo / res magra / pescado ({((profile?.weightKg || 75) * 2.2 * 7 * 0.6 / 250).toFixed(1)} kg)</Text>
            <Text style={styles.groceryItemText}>• Huevos enteros pasteurizados ({Math.round(14 + ((profile?.weightKg || 75) > 80 ? 7 : 0))} piezas)</Text>

            <Text style={styles.groceryCatTitle}>Carbohidratos Complejos</Text>
            <Text style={styles.groceryItemText}>• Arroz blanco jazmín / Avena en hojuelas (1.8 kg)</Text>
            <Text style={styles.groceryItemText}>• Papas o camote / batata (2.0 kg)</Text>

            <Text style={styles.groceryCatTitle}>Grasas, Frutas & Vegetales</Text>
            <Text style={styles.groceryItemText}>• Aguacate Hass (7 piezas) + Aceite de oliva EV (1 bot.)</Text>
            <Text style={styles.groceryItemText}>• Espinacas, brócoli y frutos rojos (1.5 kg surtido)</Text>
          </View>
        </View>

        {/* =========================================================================
            FOOTER INSTITUCIONAL
           ========================================================================= */}
        <View style={styles.footer}>
          <Text>DOCUMENTO OFICIAL CONFIDENCIAL • APEX HYPERTROPHY OS • AUTOPILOT METABÓLICO & BIOMECÁNICO</Text>
          <Text>GENERADO PARA {athleteFullName.toUpperCase()} • HOJA MAESTRA INTEGRAL (1 DE 1)</Text>
        </View>
      </Page>
    </Document>
  );
}

export default WorkoutPDFDocument;
