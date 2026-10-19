// src/components/pdf/WorkoutPDFDocument.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Estilos ultra limpios inspirados en diseño editorial deportivo (Nike / Apple Fitness)
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#050505',
    color: '#FFFFFF',
    fontFamily: 'Helvetica',
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingBottom: 20,
    marginBottom: 30,
  },
  brand: {
    fontSize: 12,
    letterSpacing: 3,
    color: '#888888',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontSize: 10,
    color: '#EAEAEA',
  },
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 2,
    color: '#FF2A2A',
    marginBottom: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    padding: 15,
    borderRadius: 8,
    flex: 1,
  },
  cardLabel: {
    fontSize: 9,
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseSub: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  prescription: {
    fontSize: 11,
    color: '#EAEAEA',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#222222',
    paddingTop: 15,
    fontSize: 9,
    color: '#666666',
  },
});

export function WorkoutPDFDocument({ profile, routine = [], diet }: { profile: any; routine: any[]; diet: any }) {
  return (
    <Document>
      {/* PÁGINA 1: RESUMEN BIOMÉTRICO Y RUTINA MAESTRA */}
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>APEX // HYPERTROPHY OS</Text>
            <Text style={styles.title}>Blueprint de Entrenamiento</Text>
          </View>
          <Text style={styles.badge}>DEFICIT -{profile?.caloricDeficitPct || 15}%</Text>
        </View>

        {/* Bloque Biométrico */}
        <Text style={styles.sectionTitle}>01. Telemetría del Atleta</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Peso Actual</Text>
            <Text style={styles.cardValue}>{profile?.weightKg || 80} KG</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TDEE Estimado</Text>
            <Text style={styles.cardValue}>{profile?.calculatedTdee || 2600} KCAL</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Calorías Objetivo</Text>
            <Text style={styles.cardValue}>{profile?.targetCalories || 2200} KCAL</Text>
          </View>
        </View>

        {/* Bloque de Rutina */}
        <Text style={styles.sectionTitle}>02. Prescripción Full-Body (Día Activo)</Text>
        {routine && routine.map((ex: any, index: number) => (
          <View key={index} style={styles.tableRow}>
            <View>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseSub}>
                {ex.anatomicalSubdivision || ex.anatomical_subdivision || 'MÚSCULO PRINCIPAL'} • {(ex.equipment || 'EQUIPO').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.prescription}>
              {ex.targetSets || ex.default_sets || 3} Series × {ex.targetRepsMin || ex.rep_range_min || 8}-{ex.targetRepsMax || ex.rep_range_max || 12} Reps (RIR {ex.targetRir || 1})
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>DOCUMENTO CONFIDENCIAL • GENERADO POR APEX OS</Text>
          <Text>PÁGINA 1 DE 2</Text>
        </View>
      </Page>

      {/* PÁGINA 2: NUTRICIÓN Y SUPLEMENTACIÓN */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>APEX // NUTRICIÓN CLÍNICA</Text>
            <Text style={styles.title}>Stack y Macros Diarios</Text>
          </View>
          <Text style={styles.badge}>PROTEÍNA: {profile?.targetProteinG || 180}G</Text>
        </View>

        <Text style={styles.sectionTitle}>03. Protocolo de Suplementación (Grado A)</Text>
        {diet?.dailySupplements && diet.dailySupplements.map((sup: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <View>
              <Text style={styles.exerciseName}>{sup.name} ({sup.dosage})</Text>
              <Text style={styles.exerciseSub}>{sup.clinicalReason}</Text>
            </View>
            <Text style={styles.prescription}>{sup.timing}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text>DOCUMENTO CONFIDENCIAL • GENERADO POR APEX OS</Text>
          <Text>PÁGINA 2 DE 2</Text>
        </View>
      </Page>
    </Document>
  );
}
