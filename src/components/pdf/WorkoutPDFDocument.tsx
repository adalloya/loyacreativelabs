// src/components/pdf/WorkoutPDFDocument.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#070709',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
    padding: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F24',
    paddingBottom: 16,
    marginBottom: 20,
  },
  brand: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#A1A1AA',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badgeRed: {
    backgroundColor: '#1A0808',
    borderWidth: 1,
    borderColor: '#FF2A2A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF2A2A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#FF2A2A',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  grid3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  grid4: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#1F1F24',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  cardLast: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#1F1F24',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 0,
  },
  cardHighlight: {
    backgroundColor: '#161114',
    borderWidth: 1,
    borderColor: '#FF2A2A',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  cardLabel: {
    fontSize: 8,
    color: '#71717A',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardSubtext: {
    fontSize: 8,
    color: '#A1A1AA',
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#17171C',
    paddingVertical: 7,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseLeft: {
    flex: 2,
    marginRight: 10,
  },
  exerciseName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseSub: {
    fontSize: 8.5,
    color: '#A1A1AA',
    marginTop: 1.5,
  },
  exerciseCue: {
    fontSize: 8,
    color: '#71717A',
    marginTop: 1.5,
    fontStyle: 'italic',
  },
  prescription: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  bannerBox: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: '#1F1F24',
    padding: 12,
    borderRadius: 6,
    marginBottom: 14,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerText: {
    fontSize: 9,
    color: '#A1A1AA',
    lineHeight: 1.3,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1E',
    paddingTop: 10,
    fontSize: 8,
    color: '#52525B',
  },
});

export function WorkoutPDFDocument({ 
  profile, 
  routine = [], 
  diet 
}: { 
  profile: any; 
  routine: any[]; 
  diet: any 
}) {
  const goalLabel = profile?.fitnessGoal === "surplus"
    ? `SUPERÁVIT CALÓRICO (+${profile?.caloricAdjustmentPct || 15}%)`
    : profile?.fitnessGoal === "maintenance"
    ? "MANTENIMIENTO CALÓRICO (0%)"
    : `DÉFICIT CALÓRICO (${profile?.caloricAdjustmentPct ? `${profile.caloricAdjustmentPct}%` : `-${profile?.caloricDeficitPct || 15}%`})`;

  const athleteFullName = `${profile?.firstName || 'Atleta'} ${profile?.lastName || ''}`.trim();

  return (
    <Document>
      {/* =========================================================================
          PÁGINA 1: IDENTIFICACIÓN DEL ATLETA & ARQUITECTURA METABÓLICA
         ========================================================================= */}
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>APEX // AUTOPILOT DE HIPERTROFIA CIENTÍFICA</Text>
            <Text style={styles.title}>Blueprint Clínico del Atleta</Text>
          </View>
          <Text style={styles.badgeRed}>{goalLabel}</Text>
        </View>

        {/* Sección 01: Identificación y Biometría */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>01. Perfil Biométrico y Calibración</Text>
          <Text style={{ fontSize: 9, color: '#71717A' }}>ATLETA: {athleteFullName.toUpperCase()}</Text>
        </View>

        <View style={styles.grid3}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Atleta</Text>
            <Text style={styles.cardValue}>{athleteFullName}</Text>
            <Text style={styles.cardSubtext}>{profile?.gender === 'female' ? 'Femenino' : 'Masculino'}, {profile?.age || 38} años</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Composición Corporal</Text>
            <Text style={styles.cardValue}>{profile?.weightKg || 80} kg</Text>
            <Text style={styles.cardSubtext}>{profile?.heightCm || 178} cm • {profile?.bodyFatPct || 14.5}% Grasa Est.</Text>
          </View>
          <View style={styles.cardLast}>
            <Text style={styles.cardLabel}>Volumen Semanal</Text>
            <Text style={styles.cardValue}>{profile?.trainingDaysPerWeek || 6} días / sem</Text>
            <Text style={styles.cardSubtext}>{profile?.sessionDurationMins || 60} min por sesión</Text>
          </View>
        </View>

        {/* Sección 02: Decisiones Estratégicas y Entorno */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>02. Parámetros de Entrenamiento y Entorno</Text>
        </View>

        <View style={styles.grid3}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Objetivo Metabólico</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>
              {profile?.fitnessGoal === 'deficit' ? 'Pérdida de Grasa' : profile?.fitnessGoal === 'surplus' ? 'Hipertrofia Muscular' : 'Recomposición'}
            </Text>
            <Text style={styles.cardSubtext}>Ajuste Calórico: {profile?.caloricAdjustmentPct ? `${profile.caloricAdjustmentPct}%` : '-15%'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Entorno Configurado</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>
              {(profile?.environmentMode || 'Gimnasio Completo').replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.cardSubtext}>Selección óptima de equipamiento</Text>
          </View>
          <View style={styles.cardLast}>
            <Text style={styles.cardLabel}>Disposición Biométrica</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>
              {profile?.readiness === 'optimal' ? 'Óptimo (RIR 1)' : profile?.readiness === 'fatigued' ? 'Fatigado (-5%)' : 'Normal (RIR 1-2)'}
            </Text>
            <Text style={styles.cardSubtext}>Autorregulación del sistema nervioso</Text>
          </View>
        </View>

        {/* Sección 03: Balance Energético y Macros */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>03. Arquitectura Energética y Macros Clínicos</Text>
        </View>

        <View style={styles.grid4}>
          <View style={styles.cardHighlight}>
            <Text style={styles.cardLabel}>Calorías Objetivo</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FF2A2A' }}>{profile?.targetCalories || 2200} kcal</Text>
            <Text style={styles.cardSubtext}>Energía neta diaria</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Proteína Diaria</Text>
            <Text style={styles.cardValue}>{profile?.targetProteinG || 180}g</Text>
            <Text style={styles.cardSubtext}>2.2g / kg masa magra</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Carbohidratos</Text>
            <Text style={styles.cardValue}>{profile?.targetCarbsG || 240}g</Text>
            <Text style={styles.cardSubtext}>Glucógeno y energía</Text>
          </View>
          <View style={styles.cardLast}>
            <Text style={styles.cardLabel}>Grasas Saludables</Text>
            <Text style={styles.cardValue}>{profile?.targetFatsG || 55}g</Text>
            <Text style={styles.cardSubtext}>Función hormonal</Text>
          </View>
        </View>

        {/* Métricas Basales */}
        <View style={styles.bannerBox}>
          <Text style={styles.bannerTitle}>Telemetría Metabólica Katch-McArdle</Text>
          <Text style={styles.bannerText}>
            Gasto Metabólico Basal (BMR): {profile?.calculatedBmr || 1750} kcal • Gasto Diario Total (TDEE): {profile?.calculatedTdee || 2600} kcal • Consumo hídrico mínimo recomendado: {profile?.waterLiters || 3.5} litros de agua al día.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>DOCUMENTO CLÍNICO CONFIDENCIAL • APEX HYPERTROPHY OS</Text>
          <Text>PÁGINA 1 DE 3</Text>
        </View>
      </Page>

      {/* =========================================================================
          PÁGINA 2: PROGRAMACIÓN DE HIPERTROFIA & CARDIO ZONA 2
         ========================================================================= */}
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>APEX // PRESCRIPCIÓN BIOMECÁNICA</Text>
            <Text style={styles.title}>Rutina Activa & Series Efectivas</Text>
          </View>
          <Text style={styles.badge}>{profile?.dayTitle || 'SESIÓN ACTIVA'}</Text>
        </View>

        {/* Banner de Enfoque */}
        <View style={styles.bannerBox}>
          <Text style={styles.bannerTitle}>{profile?.dayTitle || 'Sesión de Sobrecarga Progresiva'}</Text>
          <Text style={styles.bannerText}>
            Enfoque neuromuscular: {profile?.dayFocus || 'Tensión mecánica en longitud muscular máxima con RIR 1-2 y tempo controlado (3-1-1).'}
          </Text>
        </View>

        {/* Tabla de Ejercicios */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>04. Secuencia Biomecánica Tier S / A</Text>
          <Text style={{ fontSize: 9, color: '#71717A' }}>TEMPO ESTÁNDAR: 3-1-1</Text>
        </View>

        {routine && routine.slice(0, 7).map((ex: any, index: number) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <View style={styles.exerciseLeft}>
              <Text style={styles.exerciseName}>{index + 1}. {ex.name}</Text>
              <Text style={styles.exerciseSub}>
                {ex.anatomicalSubdivision || ex.anatomical_subdivision || 'Músculo Principal'} • {(ex.equipment || 'Equipamiento').toUpperCase()} • TIER {ex.hypertrophy_tier || 'S'}
              </Text>
              {ex.biomechanical_cue && (
                <Text style={styles.exerciseCue}>Consigna: {ex.biomechanical_cue}</Text>
              )}
            </View>
            <Text style={styles.prescription}>
              {ex.targetSets || ex.default_sets || 3} Series × {ex.targetRepsMin || ex.rep_range_min || 8}-{ex.targetRepsMax || ex.rep_range_max || 12} Reps
              {'\n'}<Text style={{ fontSize: 8, color: '#A1A1AA' }}>RIR {ex.target_rir !== undefined ? ex.target_rir : (ex.targetRir || 1)} • {ex.rest_seconds || 90}s descanso</Text>
            </Text>
          </View>
        ))}

        {/* Cardio Finisher Zona 2 */}
        <View style={{ marginTop: 14 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>05. Cardio Zona 2 (Final de Sesión)</Text>
            <Text style={{ fontSize: 9, color: '#10B981' }}>ZONA AERÓBICA PURA (120-140 BPM)</Text>
          </View>

          <View style={styles.card}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 }}>
              {profile?.cardioType && profile.cardioType !== 'none'
                ? `${profile.cardioType.replace('_', ' ').toUpperCase()} • ${profile.cardioMinutes || 20} MIN • INCLINACIÓN: ${profile.cardioIncline ?? 12}% • VELOCIDAD: ${profile.cardioSpeed ?? 4.8} km/h`
                : 'SIN CARDIO HOY (RECUPERACIÓN METABÓLICA)'}
            </Text>
            {profile?.cardioCalories ? (
              <Text style={{ fontSize: 8.5, color: '#10B981', marginBottom: 3 }}>
                Gasto calórico: ~{profile.cardioCalories} kcal • Distancia: ~{profile.cardioDistance || 0} km • Zona 2
              </Text>
            ) : null}
            <Text style={styles.bannerText}>
              {profile?.cardioProtocol || 'Oxidación lipídica suave sin interferencia con la vía de señalización mTOR de hipertrofia muscular.'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>DOCUMENTO CLÍNICO CONFIDENCIAL • APEX HYPERTROPHY OS</Text>
          <Text>PÁGINA 2 DE 3</Text>
        </View>
      </Page>

      {/* =========================================================================
          PÁGINA 3: FARMACOLOGÍA DEPORTIVA, SUPLEMENTACIÓN & COMPRAS
         ========================================================================= */}
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>APEX // SUPLEMENTACIÓN & NUTRICIÓN</Text>
            <Text style={styles.title}>Stack Clínico & Insumos</Text>
          </View>
          <Text style={styles.badge}>EVIDENCIA GRADO A</Text>
        </View>

        {/* Suplementación Grado A */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>06. Protocolo de Suplementación Dirigida</Text>
        </View>

        {diet?.dailySupplements && diet.dailySupplements.slice(0, 5).map((sup: any, i: number) => (
          <View key={i} style={styles.tableRow} wrap={false}>
            <View style={styles.exerciseLeft}>
              <Text style={styles.exerciseName}>{sup.name} ({sup.dosage})</Text>
              <Text style={styles.exerciseSub}>{sup.clinicalReason}</Text>
            </View>
            <Text style={styles.prescription}>{sup.timing}</Text>
          </View>
        ))}

        {/* Canasta de Compras e Insumos */}
        <View style={{ marginTop: 14 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>07. Canasta de Compras & Fuentes Limpias</Text>
          </View>

          <View style={styles.grid3}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Proteínas Magras</Text>
              <Text style={styles.bannerText}>
                Pechuga de pollo, lomo de res/cerdo magro, huevos enteros, claras líquidas, atún y pescado blanco.
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Carbohidratos Complejos</Text>
              <Text style={styles.bannerText}>
                Avena integral, arroz jazmín, papas al horno, camote y frutas frescas de temporada.
              </Text>
            </View>
            <View style={styles.cardLast}>
              <Text style={styles.cardLabel}>Lípidos Saludables</Text>
              <Text style={styles.bannerText}>
                Aceite de oliva extra virgen, aguacate fresco, almendras y semillas de chía.
              </Text>
            </View>
          </View>
        </View>

        {/* Directrices de Recuperación */}
        <View style={styles.bannerBox}>
          <Text style={styles.bannerTitle}>Protocolo de Sueño y Regeneración Biomecánica</Text>
          <Text style={styles.bannerText}>
            • Mantén 7.5 - 8.5 horas de descanso ininterrumpido en habitación oscura y fresca (18-20°C).{'\n'}
            • Respeta 90 a 120 segundos de recuperación activa entre series efectivas para asegurar el reclutamiento de unidades motoras de alto umbral.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>DOCUMENTO CLÍNICO CONFIDENCIAL • APEX HYPERTROPHY OS • GENERADO PARA {athleteFullName.toUpperCase()}</Text>
          <Text>PÁGINA 3 DE 3</Text>
        </View>
      </Page>
    </Document>
  );
}
