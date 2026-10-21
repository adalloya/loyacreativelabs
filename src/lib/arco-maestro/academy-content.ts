export interface ElectrodeSpec {
  awsCode: string;
  commonName: string;
  tensileStrengthPSI: string;
  coatingType: string;
  polarity: string;
  penetration: 'Baja-Media' | 'Alta (Profunda)' | 'Media-Alta';
  amperage3_32: string;
  amperage1_8: string;
  idealUseInMerida: string;
  workshopTip: string;
}

export interface SteelMaterialGuide {
  category: string;
  commercialNames: string;
  commonGauges: string;
  surfaceFinish: string;
  weldability: string;
  bestApplications: string[];
  meridaCorrosionWarning: string;
}

export interface AcademyClass {
  classNumber: number;
  moduleNumber: 1 | 2 | 3 | 4;
  moduleTitle: string;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  objective: string;
  keyTakeaways: string[];
  workshopPractice: {
    materialNeeded: string;
    electrodeAndPolarity: string;
    amperageRange: string;
    stepByStep: string[];
    qualityCheck: string;
  };
  proTips: string[];
  videoSearchQueries: Array<{ title: string; channelRef: string; query: string }>;
}

// 1. TABLA MAESTRA DE ELECTRODOS REVESTIDOS (SMAW / MMA)
export const ELECTRODE_MASTER_TABLE: ElectrodeSpec[] = [
  {
    awsCode: 'E6013',
    commonName: 'Rutílico Estándar (Herrería Ligera y Perfiles)',
    tensileStrengthPSI: '60,000 PSI (4,218 kg/cm²)',
    coatingType: 'Rutilo con potasio (arco suave y estable)',
    polarity: 'CDPI (Electrodo al +) para penetración | CDPD (Electrodo al -) para lámina delgada (Cal. 18-20)',
    penetration: 'Baja-Media',
    amperage3_32: '55A – 85A',
    amperage1_8: '85A – 125A',
    idealUseInMerida: 'Armado de portones en tubular Zintro Cal. 18, protectores de ventana, muebles industriales y punteo rápido.',
    workshopTip: 'En calibre 18 o 20, conecta el portaelectrodo al NEGATIVO (CDPD): el calor se concentra menos en la lámina y reduces un 40% el riesgo de agujerear el perfil.',
  },
  {
    awsCode: 'E6011',
    commonName: 'Celulósico de Alta Penetración ("Quema-Todo")',
    tensileStrengthPSI: '60,000 PSI (4,218 kg/cm²)',
    coatingType: 'Celulósico con potasio (poca escoria, arco agresivo)',
    polarity: 'CDPI (Electrodo al +) o Corriente Alterna (CA)',
    penetration: 'Alta (Profunda)',
    amperage3_32: '60A – 90A',
    amperage1_8: '85A – 120A',
    idealUseInMerida: 'Reparaciones en obra sobre metal oxidado/pintado, cordón de raíz en PTR grueso (Cal. 11 o 12) y anclajes a placas en muro.',
    workshopTip: 'Se mueve con técnica de "chicoteo" (adelante y atrás). Nunca lo uses en calibre 18 porque perfora instantáneamente.',
  },
  {
    awsCode: 'E7018',
    commonName: 'Bajo Hidrógeno (Estructural Pesado)',
    tensileStrengthPSI: '70,000 PSI (4,921 kg/cm²)',
    coatingType: 'Bajo hidrógeno con polvo de hierro (cordón liso y dúctil, resistente a grietas)',
    polarity: 'CDPI (Electrodo al + estricto)',
    penetration: 'Media-Alta',
    amperage3_32: '70A – 105A',
    amperage1_8: '110A – 150A',
    idealUseInMerida: 'Vigas IPR, pérgolas de gran claro (más de 5 metros), escaleras voladas, placas base de columnas y bisagras de portones muy pesados.',
    workshopTip: 'En el clima húmedo de Mérida el revestimiento absorbe agua del aire en horas. Guárdalo en tubo hermético con sílica o termo; si se humedece, se pega y deja poros. Jamás "chicotees" el 7018: arrástralo manteniendo arco cortito.',
  },
];

// 2. COMPARATIVA DE ACEROS COMERCIALES EN MOSTRADOR (MÉXICO / YUCATÁN)
export const STEEL_MATERIALS_GUIDE: SteelMaterialGuide[] = [
  {
    category: 'Perfil Tubular Comercial (Zintro / Pintado / Verdeco / Rojo)',
    commercialNames: 'Perfiles C-100, R-150, R-200, R-300, R-400, M-225, Duela/Louvers',
    commonGauges: 'Calibre 18 (1.21 mm) y Calibre 20 (0.91 mm). En marcos grandes Calibre 16 (1.52 mm).',
    surfaceFinish: 'Zintro (Recubrimiento galvanizado gris mate) o Pintado de fábrica (primario verde o rojo).',
    weldability: 'Delicada por bajo espesor. Requiere electrodo E6013 de 3/32" a bajo amperaje (45A-65A) con técnica de puntos sucesivos ("escama"), o soldadora MIG.',
    bestApplications: ['Portones residenciales abatibles y corredizos', 'Puertas principales y de pasillo', 'Celosías y louvers arquitectónicos', 'Barandales ligeros'],
    meridaCorrosionWarning: 'En Mérida pide SIEMPRE Zintro (galvanizado) en lugar de perfil rojo/verde económico. Al soldar Zintro se quema el zinc en la junta: es obligatorio limpiar con cepillo de alambre y aplicar primario rico en zinc o epóxico sobre cada soldadura.',
  },
  {
    category: 'PTR (Perfil Tubular Rectangular / Cuadrado Estructural)',
    commercialNames: 'PTR Negro o PTR Galvanizado (1x1", 1.5x1.5", 2x2", 3x1.5", 4x2", 4x4")',
    commonGauges: 'Calibre 14 (1.90 mm - estándar residencial), Calibre 11 (3.04 mm - pesado) y Calibre 10 (3.42 mm).',
    surfaceFinish: 'Acero al carbón laminado en caliente/frío con capa de aceite (Negro) o inmersión en zinc (Galvanizado).',
    weldability: 'Excelente. En Calibre 14 aguanta cordones corridos con E6013 de 3/32" (70A-85A) o 1/8" (90A) sin perforarse.',
    bestApplications: ['Estructuras de pérgolas y techumbres', 'Marcos perimetrales de portones pesados', 'Mesas de trabajo y bancos de taller', 'Postes de soporte y estructuras de escaleras'],
    meridaCorrosionWarning: 'El PTR Negro viene cubierto de aceite protector de fábrica. Si pintas encima sin desengrasar con thinner/xileno, la pintura se cae en 3 meses. Sella todas las cabezas abiertas con tapas metálicas soldadas para que no entre agua de lluvia.',
  },
  {
    category: 'Aceros Macizos y Laminados (Solera, Ángulo, Cuadrado, Redondo)',
    commercialNames: 'Solera (1/8", 3/16", 1/4"), Ángulo de lados iguales, Cuadrado macizo (3/8", 1/2"), Redondo liso/corrugado',
    commonGauges: 'Se piden por espesor en fracciones de pulgada (1/8" = 3.17mm, 3/16" = 4.76mm, 1/4" = 6.35mm).',
    surfaceFinish: 'Acero negro laminado en caliente con cascarilla de laminación gris oscura.',
    weldability: 'Muy alta. Permite cordones continuos de penetración completa con E6013, E6011 o E7018.',
    bestApplications: ['Placas de anclaje a muros de block/concreto', 'Protectores de ventanas y rejas de seguridad', 'Marcos de contramarco (Ángulo)', 'Orejas para candados y soportes de bisagras'],
    meridaCorrosionWarning: 'En uniones donde una solera se traslapa con otra, el agua entra por capilaridad. Aplica cordón de sellador de poliuretano en todas las uniones antes del esmalte final.',
  },
];

// 3. CURRÍCULO COMPLETO DE LAS 14 CLASES
export const ACADEMY_CURRICULUM: AcademyClass[] = [
  {
    classNumber: 1,
    moduleNumber: 1,
    moduleTitle: 'Módulo 1: Fundamentos, Seguridad y Control de Arco (Clases 1–4)',
    title: 'Seguridad Industrial, EPP y Física del Arco Eléctrico',
    status: 'completed',
    objective: 'Configurar la estación de soldadura, careta electrónica (DIN 9-13) y comprender el circuito cerrado (Pinza de tierra vs. Portaelectrodo).',
    keyTakeaways: [
      'Regla de oro del amperaje: el espesor del material manda, pero la capacidad del electrodo limita.',
      'Careta en Sombra DIN 10 u 11 para amperajes de 60A a 110A; DIN 9 para punteo a bajo amperaje.',
      'Extracción de humos y filtro P100 al soldar perfiles galvanizados (Zintro) para evitar fiebre por óxido de zinc.',
    ],
    workshopPractice: {
      materialNeeded: 'Solera de 2" x 3/16" (retacería limpia)',
      electrodeAndPolarity: 'E6013 de 3/32" en CDPI (Electrodo al +)',
      amperageRange: '75A – 85A',
      stepByStep: ['Conectar masa directo a la pieza limpia.', 'Practicar encendido por raspado (cerillo) y golpeteo (tapping).'],
      qualityCheck: 'Lograr 10 encendidos seguidos manteniendo el arco vivo 5 segundos sin que se adhiera.',
    },
    proTips: ['Si el electrodo se pega, no des tirones bruscos: gira la muñeca en seco para destrabarlo o suelta la pinza de inmediato.'],
    videoSearchQueries: [
      { title: 'Cómo regular careta electrónica y amperaje inicial', channelRef: 'El Arte de Soldar', query: 'como regular careta electronica y amperaje soldadura arco' },
    ],
  },
  {
    classNumber: 2,
    moduleNumber: 1,
    moduleTitle: 'Módulo 1: Fundamentos, Seguridad y Control de Arco (Clases 1–4)',
    title: 'Polaridad (CDPI vs CDPD) y Lectura del Charco de Fusión',
    status: 'completed',
    objective: 'Distinguir visualmente el metal líquido brillante de la escoria más oscura durante el avance.',
    keyTakeaways: [
      'CDPI (Electrodo al +): El 70% del calor va a la penetración. Ideal para calibres 14 o mayores.',
      'CDPD (Electrodo al -): Menor penetración en la pieza base. Ideal para lámina delgada (Cal. 18 y 20).',
      'El acero fundido brilla como mercurio al frente; la escoria se ve rojiza/anaranjada y flota detrás.',
    ],
    workshopPractice: {
      materialNeeded: 'Placa o solera de 1/8" o 3/16"',
      electrodeAndPolarity: 'E6013 3/32" en + y luego en -',
      amperageRange: '75A',
      stepByStep: ['Hacer un cordón de 10 cm con electrodo al positivo.', 'Invertir cables y hacer un cordón paralelo al negativo comparando sonido y penetración.'],
      qualityCheck: 'Escuchar un sonido constante de "tocino friéndose" (arco corto) en lugar de un soplido fuerte.',
    },
    proTips: ['La longitud del arco debe ser igual al diámetro del alma metálica del electrodo (aprox. 2 mm a 2.5 mm).'],
    videoSearchQueries: [
      { title: 'Diferencia entre metal líquido y escoria en cámara macro', channelRef: 'Weld.com', query: 'como diferenciar escoria de soldadura charco de fusion' },
    ],
  },
  {
    classNumber: 3,
    moduleNumber: 1,
    moduleTitle: 'Módulo 1: Fundamentos, Seguridad y Control de Arco (Clases 1–4)',
    title: 'Variables CLAMS: Corriente, Longitud, Ángulo, Manipulación y Velocidad',
    status: 'completed',
    objective: 'Dominar los ángulos de trabajo (90°) y de avance (15°–20° en arrastre) para lograr cordones uniformes.',
    keyTakeaways: [
      'Con electrodo revestido, SIEMPRE se suelda arrastrando para que el soplo del arco empuje la escoria hacia atrás.',
      'Si empujas en plano, la escoria se adelanta al charco y queda atrapada dentro del metal.',
    ],
    workshopPractice: {
      materialNeeded: 'Solera de 2" x 1/8" marcada con jaboncillo en líneas rectas',
      electrodeAndPolarity: 'E6013 3/32" (CDPI)',
      amperageRange: '70A – 80A',
      stepByStep: ['Trazar 4 líneas con jaboncillo.', 'Tirar cordones rectos manteniendo ancho uniforme (2x diámetro electrodo).'],
      qualityCheck: 'Al golpear con la piqueta, la escoria debe levantarse sola en fragmentos largos.',
    },
    proTips: ['Apoya siempre el codo o la mano sobre la mesa (con guante) para eliminar temblor de pulso.'],
    videoSearchQueries: [
      { title: 'Técnica para hacer cordones rectos sin perder la línea', channelRef: 'Herrería Castañeda', query: 'como hacer cordones rectos soldadura electrodo' },
    ],
  },
  {
    classNumber: 4,
    moduleNumber: 1,
    moduleTitle: 'Módulo 1: Fundamentos, Seguridad y Control de Arco (Clases 1–4)',
    title: 'Patrones de Oscilación (Medias Lunas, Zig-Zag, Ocho y Escama)',
    status: 'completed',
    objective: 'Aplicar movimientos de tejido para rellenar juntas con separación y controlar la anchura del cordón.',
    keyTakeaways: [
      'Pausa de 1 segundo en los bordes laterales del movimiento para evitar mordeduras y pasar rápido por el centro.',
      'Movimiento circular o medias lunas cerradas: el más versátil para unir dos perfiles residenciales.',
    ],
    workshopPractice: {
      materialNeeded: '2 tramos de solera de 1/8" borde con borde',
      electrodeAndPolarity: 'E6013 3/32" (CDPI)',
      amperageRange: '75A',
      stepByStep: ['Puntear ambos extremos.', 'Unir con medias lunas avanzando con ritmo constante.'],
      qualityCheck: 'Cordón con escamas cerradas a la misma distancia y bordes bien fundidos.',
    },
    proTips: ['Nunca hagas una oscilación mayor a 3 veces el diámetro del electrodo.'],
    videoSearchQueries: [
      { title: 'Movimientos de oscilación en soldadura con electrodo', channelRef: 'Soldadores en Línea', query: 'movimientos de oscilacion soldadura electrodo 6013' },
    ],
  },
  {
    classNumber: 5,
    moduleNumber: 2,
    moduleTitle: 'Módulo 2: Materiales, Calibres y Electrodos (Clases 5–7 — Etapa Actual)',
    title: 'Clase 5 (Actual): Nomenclatura AWS de Electrodos y Catálogo de Aceros Comerciales',
    status: 'current',
    objective: 'Identificar calibres (10 al 20), distinguir PTR vs. Tubular Zintro y elegir electrodo según carga.',
    keyTakeaways: [
      'Lectura AWS: E-60-1-3 ("E"=Electrodo; "60"=60,000 PSI; "1"=Todas las posiciones; "3"=Rutilo potásico CA/CD).',
      'Regla de Calibres: A MAYOR número de calibre, MÁS DELGADA la pared (Cal. 14 = 1.90mm; Cal. 18 = 1.21mm).',
      'Diferencia en mostrador: PTR tiene esquinas redondeadas y pared de 1.90mm; Tubular Zintro tiene esquinas más vivas y capa de zinc.',
    ],
    workshopPractice: {
      materialNeeded: 'Retazos de PTR Cal. 14, Tubular Zintro Cal. 18 y Solera de 3/16"',
      electrodeAndPolarity: 'E6013, E6011 y E7018 de 3/32"',
      amperageRange: '60A a 90A',
      stepByStep: [
        'Medir con vernier el espesor de pared de cada perfil.',
        'Probar un cordón de E6013, uno de E6011 y uno de E7018 sobre solera para comparar arco y escoria.',
        'Observar la fractura vítrea del 7018 frente a la cáscara suave del 6013.',
      ],
      qualityCheck: 'Identificar los 3 electrodos a ciegas por color de revestimiento y comportamiento de arco.',
    },
    proTips: ['Compra un calibrador de lámina en acero inoxidable y vernier para verificar calibres al recibir material en mostrador.'],
    videoSearchQueries: [
      { title: 'Diferencias reales entre E6011, E6013 y E7018', channelRef: 'El Arte de Soldar', query: 'diferencia entre electrodo 6011 6013 y 7018 practica' },
      { title: 'Guía de perfiles de herrería: PTR vs Tubular', channelRef: 'Herrería Castañeda', query: 'tipos de perfiles para herreria calibres ptr y tubular' },
    ],
  },
  {
    classNumber: 6,
    moduleNumber: 2,
    moduleTitle: 'Módulo 2: Materiales, Calibres y Electrodos (Clases 5–7 — Etapa Actual)',
    title: 'Clase 6: Técnica de Soldadura en Perfiles Delgados (Calibre 18 y 20) sin Perforar',
    status: 'upcoming',
    objective: 'Dominar la técnica de punto sobre punto (escama) y polaridad directa en tubular Zintro.',
    keyTakeaways: [
      'En Calibre 18 (1.21 mm) no se puede tirar cordón continuo sin abrir huecos.',
      'Configuración anti-perforación: Portaelectrodo al NEGATIVO (CDPD), E6013 3/32" a 50A–60A.',
      'Técnica de escama: Punto de 1.5s, levantar medio segundo para enfriar a naranja opaco y dar el siguiente pisando el 50% anterior.',
    ],
    workshopPractice: {
      materialNeeded: 'Tramos de Tubular R-200 Calibre 18 Zintro',
      electrodeAndPolarity: 'E6013 3/32" en CDPD (Electrodo al -)',
      amperageRange: '52A – 60A',
      stepByStep: [
        'Desbastar 5mm del recubrimiento de zinc en el borde a soldar.',
        'Unir a tope con cadencia rítmica: Punto -> Enfriar -> Punto solapado.',
        'Practicar relleno de perforación accidental cerrando en espiral hacia el centro.',
      ],
      qualityCheck: 'Cordón de puntos solapados que resista desbaste con disco Flap sin agujerearse.',
    },
    proTips: ['Usa un retazo de solera de cobre detrás de juntas abiertas: disipa el calor y el acero no se pega al cobre.'],
    videoSearchQueries: [
      { title: 'Cómo soldar perfil calibre 18 y 20 sin perforar', channelRef: 'El Arte de Soldar', query: 'como soldar perfil delgado calibre 18 y 20 con electrodo 6013 sin perforar' },
    ],
  },
  {
    classNumber: 7,
    moduleNumber: 2,
    moduleTitle: 'Módulo 2: Materiales, Calibres y Electrodos (Clases 5–7 — Etapa Actual)',
    title: 'Clase 7: Corte de Precisión (Tronzadora y Esmeril 4½") y Cortes a 45° (Inglete)',
    status: 'upcoming',
    objective: 'Lograr cortes a 90° y 45° sin luz para armado rápido con escuadra perfecta.',
    keyTakeaways: [
      'Si en un corte a 45° hay más de 1mm de luz, se perforará al soldar y el marco se cerrará.',
      'En esmeril con disco de 1mm, traza las 4 caras con escuadra combinada y haz rieles guía antes de cortar.',
      'En tronzadora no empujes con fuerza excesiva para evitar que el disco se flexione.',
    ],
    workshopPractice: {
      materialNeeded: 'Tubular R-200 para armar un cuadro de 40 cm x 40 cm',
      electrodeAndPolarity: 'E6013 3/32"',
      amperageRange: '60A – 70A',
      stepByStep: ['Calcular medidas interior/exterior.', 'Cortar 8 ingletes a 45°.', 'Presentar en seco en la mesa.'],
      qualityCheck: 'Diferencia menor a 1mm entre las dos diagonales en seco.',
    },
    proTips: ['Retira toda rebaba con disco Flap antes de presentar: una rebaba descuadra el marco 2 milímetros.'],
    videoSearchQueries: [
      { title: 'Cortes a 45 grados perfectos con miniesmeril', channelRef: 'Herrería Castañeda', query: 'como hacer cortes a 45 grados perfectos con miniesmeril herreria' },
    ],
  },
  {
    classNumber: 8,
    moduleNumber: 3,
    moduleTitle: 'Módulo 3: Uniones, Posiciones y Control de Deformación (Clases 8–10)',
    title: 'Clase 8: Los 5 Tipos de Juntas y Secuencia de Punteo Anti-Deformación',
    status: 'upcoming',
    objective: 'Controlar la contracción térmica del acero para que marcos de portones no se tuerzan.',
    keyTakeaways: [
      'El acero se contrae con gran fuerza al enfriar: suelda siempre en cruz alternando esquinas.',
      'Secuencia de marco: 1) Puntear esquinas exteriores/interiores en caras planas. 2) Medir diagonales (Pitágoras). 3) Soldar caras planas y al final los cantos.',
    ],
    workshopPractice: {
      materialNeeded: 'Cuadro a 45° cortado en clase anterior',
      electrodeAndPolarity: 'E6013 3/32"',
      amperageRange: '65A',
      stepByStep: ['Puntear en cruz.', 'Verificar diagonales con flexómetro.', 'Soldar caras alternadas.'],
      qualityCheck: 'Al terminar de soldar, las 4 esquinas deben tocar la mesa sin alabeo.',
    },
    proTips: ['Nunca sueldes el canto interior a 45° antes de soldar las caras planas: actúa como bisagra y cierra el ángulo.'],
    videoSearchQueries: [
      { title: 'Orden para puntear y soldar marcos sin que se tuerzan', channelRef: 'Herrería Castañeda', query: 'como soldar un marco de herreria sin que se descuadre ni tuerza' },
    ],
  },
  {
    classNumber: 9,
    moduleNumber: 3,
    moduleTitle: 'Módulo 3: Uniones, Posiciones y Control de Deformación (Clases 8–10)',
    title: 'Clase 9: Soldadura Fuera de Plano (Horizontal 2F y Vertical 3F)',
    status: 'upcoming',
    objective: 'Soldar uniones en T y verticales para armar estructuras grandes e instalar bisagras en obra.',
    keyTakeaways: [
      'Vertical Descendente: Permitida en calibres 18 y 16 con E6013; estética y rápida pero menor penetración.',
      'Vertical Ascendente: Obligatoria en perfiles estructurales (PTR Cal. 14, 11). Bajar 10%-15% amperaje.',
    ],
    workshopPractice: {
      materialNeeded: 'PTR Cal. 14 fijado verticalmente',
      electrodeAndPolarity: 'E6013 3/32"',
      amperageRange: '60A – 70A',
      stepByStep: ['Practicar cordón vertical descendente rápido.', 'Practicar vertical ascendente con patrón triangular.'],
      qualityCheck: 'Cordón vertical sin escurrimientos ni escoria atrapada en el centro.',
    },
    proTips: ['En vertical descendente inclina el electrodo 30° hacia arriba para que el arco empuje la escoria.'],
    videoSearchQueries: [
      { title: 'Soldadura vertical ascendente vs descendente', channelRef: 'El Arte de Soldar', query: 'soldadura vertical ascendente y descendente 6013 herreria' },
    ],
  },
  {
    classNumber: 10,
    moduleNumber: 3,
    moduleTitle: 'Módulo 3: Uniones, Posiciones y Control de Deformación (Clases 8–10)',
    title: 'Clase 10: Herrajes Residenciales: Bisagras Tubulares, Chapas y Rieles',
    status: 'upcoming',
    objective: 'Instalar bisagras alineadas al mismo eje, embutir chapas y calcular holguras de portón.',
    keyTakeaways: [
      'Holguras: 5mm para bisagras, 4-5mm para chapa y 15-20mm de luz al piso terminado.',
      'Bisagras tubulares: El perno macho SIEMPRE apunta hacia arriba para retener grasa.',
      'Para alinear bisagras en el mismo eje, sujétalas dentro de un tramo de ángulo recto.',
    ],
    workshopPractice: {
      materialNeeded: 'Marco de práctica + 2 bisagras tubulares con grasera',
      electrodeAndPolarity: 'E6013 o E7018 3/32"',
      amperageRange: '75A – 85A',
      stepByStep: ['Colocar lainas separadoras de 1/8".', 'Alinear con ángulo y puntear.', 'Verificar apertura suave antes del cordón definitivo.'],
      qualityCheck: 'Apertura suave sin juego ni rechinidos.',
    },
    proTips: ['Nunca coloques la pinza de tierra en el marco fijo mientras sueldas la hoja móvil a través de la bisagra.'],
    videoSearchQueries: [
      { title: 'Cómo soldar bisagras tubulares alineadas', channelRef: 'Herrería Castañeda', query: 'como soldar bisagras tubulares correctamente en una puerta' },
    ],
  },
  {
    classNumber: 11,
    moduleNumber: 4,
    moduleTitle: 'Módulo 4: Acabados Premium, Microalambre e Instalación en Mérida (Clases 11–14)',
    title: 'Clase 11: Desbaste Invisible (Disco Flap), Pasta Automotriz y Sellado de Juntas',
    status: 'upcoming',
    objective: 'Lograr uniones con acabado arquitectónico liso sin debilitar la estructura.',
    keyTakeaways: [
      'No uses disco de desbaste de piedra en Calibre 18; usa directo disco Flap Grano 80 casi plano.',
      'Solo se desbastan caras visibles; las interiores conservan el cordón completo.',
      'Pasta automotriz solo para cosmética de poros (máximo 1mm de espesor).',
    ],
    workshopPractice: {
      materialNeeded: 'Marco soldado + Disco Flap Grano 80 + Pasta automotriz',
      electrodeAndPolarity: 'N/A (Acabado mecánico)',
      amperageRange: 'N/A',
      stepByStep: ['Desbastar con Flap sin calentar de más el metal.', 'Aplicar pasta automotriz catalizada y lijar a los 15 minutos.'],
      qualityCheck: 'Al pasar la yema de los dedos sobre la esquina a 45° se siente una pieza continua.',
    },
    proTips: ['Nunca uses pasta para tapar un hueco no soldado: con el portazo se botará en días.'],
    videoSearchQueries: [
      { title: 'Acabado invisible con disco flap y pasta automotriz', channelRef: 'Herrería Castañeda', query: 'como pulir soldadura con disco flap y aplicar pasta automotriz herreria' },
    ],
  },
  {
    classNumber: 12,
    moduleNumber: 4,
    moduleTitle: 'Módulo 4: Acabados Premium, Microalambre e Instalación en Mérida (Clases 11–14)',
    title: 'Clase 12: Pintura Anticorrosiva para el Clima de Yucatán (HVLP, Epóxicos y Esmaltes)',
    status: 'upcoming',
    objective: 'Preparación química y aplicación con pistola HVLP para resistir salitre y humedad.',
    keyTakeaways: [
      'El Zintro requiere acondicionador o primario epóxico de 2 componentes / cromato de zinc para adherir.',
      'Pistola HVLP boquilla 1.4mm a 28–32 PSI con abanico al 100% y distancia de 15cm.',
      'Usa trampa de agua en compresor: la humedad de Mérida condensa gotas que arruinan la pintura.',
    ],
    workshopPractice: {
      materialNeeded: 'Marco + Thinner acrílico + Primario anticorrosivo + Pistola HVLP',
      electrodeAndPolarity: 'N/A',
      amperageRange: 'N/A',
      stepByStep: ['Desengrasar todo con trapo y thinner hasta quedar limpio.', 'Aplicar mano briseada y a los 10 minutos mano húmeda cruzada.'],
      qualityCheck: 'Acabado mate uniforme sin cáscara de naranja ni escurrimientos.',
    },
    proTips: ['Coloca un mini-filtro de aire directamente debajo del mango de la pistola de pintura.'],
    videoSearchQueries: [
      { title: 'Cómo pintar herrería con pistola HVLP sin que se bote', channelRef: 'Herrería Castañeda', query: 'como pintar herreria con pistola de gravedad y compresor sin que se bote' },
    ],
  },
  {
    classNumber: 13,
    moduleNumber: 4,
    moduleTitle: 'Módulo 4: Acabados Premium, Microalambre e Instalación en Mérida (Clases 11–14)',
    title: 'Clase 13: Introducción al Proceso MIG / Microalambre (Con Gas y Flux Core)',
    status: 'upcoming',
    objective: 'Acelerar 3x la producción en taller soldando calibres delgados sin escoria.',
    keyTakeaways: [
      'MIG con Gas (Argón/CO2 + ER70S-6): Antorcha al (+). Suelda Calibre 20 y 18 sin perforar.',
      'Flux Core Sin Gas (E71T-GS): Antorcha al (-). Ideal para instalar en obra con viento.',
    ],
    workshopPractice: {
      materialNeeded: 'Retazos Zintro Cal. 18 y PTR Cal. 14',
      electrodeAndPolarity: 'Microalambre ER70S-6 o Flux Core 0.030"',
      amperageRange: '16.5V – 18.5V',
      stepByStep: ['Ajustar tensión de carrete y rodillos.', 'Tirar cordón continuo de 3 segundos a 45° en Calibre 18.'],
      qualityCheck: 'Cordón liso que requiera menos de 15 segundos de Flap para quedar liso.',
    },
    proTips: ['En máquinas multiproceso revisa la polaridad interna de cables al cambiar de electrodo a Flux Core.'],
    videoSearchQueries: [
      { title: 'Cómo regular soldadora microalambre para calibres delgados', channelRef: 'El Arte de Soldar', query: 'como regular soldadora microalambre flux core y con gas calibres delgados' },
    ],
  },
  {
    classNumber: 14,
    moduleNumber: 4,
    moduleTitle: 'Módulo 4: Acabados Premium, Microalambre e Instalación en Mérida (Clases 11–14)',
    title: 'Clase 14: Levantamiento de Medidas en Obra e Instalación en Muros de Mérida',
    status: 'upcoming',
    objective: 'Tomar medidas en vanos descuadrados y anclar portones y pérgolas con seguridad estructural.',
    keyTakeaways: [
      'Regla de las 6 medidas: Ancho arriba/centro/abajo + Alto izquierdo/centro/derecho + Diagonales y plomada.',
      'Se fabrica con la medida MÁS PEQUEÑA menos holgura de 1 cm.',
      'Anclaje en Mérida: En concreto taquete de cuña 3/8" o químico; en block hueco varilla a 45° ("pata de gallo").',
    ],
    workshopPractice: {
      materialNeeded: 'Flexómetro, nivel láser, rotomartillo SDS-Plus, taquetes de cuña',
      electrodeAndPolarity: 'E6011 o E6013 1/8" para anclajes en sitio',
      amperageRange: '95A – 110A con cable calibre 10 AWG',
      stepByStep: ['Levantamiento de vano real.', 'Perforación y fijación de placas de solera de 1/4" en sitio.'],
      qualityCheck: 'Placa sin holgura y puntos de soldadura protegidos con primario el mismo día.',
    },
    proTips: ['Arma tu propia extensión eléctrica de 15m con cable Calibre 10 AWG para no perder voltaje con la inversora en obra.'],
    videoSearchQueries: [
      { title: 'Cómo tomar medidas para un portón en muros descuadrados', channelRef: 'Herrería Castañeda', query: 'como tomar medidas para hacer una puerta o porton de herreria' },
    ],
  },
];

// 4. GUÍA RÁPIDA DE DIAGNÓSTICO DE DEFECTOS EN TALLER
export const WELD_TROUBLESHOOTING = [
  {
    symptom: 'El electrodo se queda pegado constantemente al intentar iniciar',
    cause: 'Amperaje bajo, ángulo muy vertical o humedad en el revestimiento.',
    fix: 'Sube 10 a 15 amperios, raspa como cerillo en ángulo de 20° y limpia la pinza de tierra.',
  },
  {
    symptom: 'Se abre un agujero instantáneo en el perfil tubular (Calibre 18)',
    cause: 'Exceso de calor concentrado, arco continuo o separación de junta.',
    fix: 'Cambia portaelectrodo al NEGATIVO (-), baja a 50A–58A con 3/32" y suelda por puntos con pausa de 1s.',
  },
  {
    symptom: 'El cordón queda lleno de poros al retirar la escoria',
    cause: 'Arco largo, grasa/zinc (Zintro) sin limpiar o electrodo con humedad.',
    fix: 'Mantén arco cortito (2 mm), limpia con disco Flap antes de soldar y guarda electrodos secos.',
  },
  {
    symptom: 'El cordón se abre por el centro o queda una zanja de escoria',
    cause: 'Avance muy rápido o empujar el electrodo en lugar de arrastrar.',
    fix: 'Inclina el electrodo 15°–20° arrastrando hacia ti y reduce velocidad de avance.',
  },
];
