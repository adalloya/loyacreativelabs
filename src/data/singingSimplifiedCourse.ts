// Extracción completa y fiel del método "Singing Simplified - The Exercises" por Steve Glazer

export interface LessonItem {
  id: string;
  lessonNumber: string; // ej. "1.1"
  title: string;
  sectionId: number;
  sectionTitle: string;
  description: string;
  instructions: string[];
  tips: string[];
  scalePattern?: number[]; // Semitonos para reproducir con el sintetizador Web Audio
  bpm?: number;
  timerSeconds?: number;
  vowelPrompt?: string;
}

export interface SectionGroup {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  lessons: LessonItem[];
}

export const SINGING_SIMPLIFIED_COURSE: SectionGroup[] = [
  {
    id: 1,
    title: "Sección 1: The Foundation (Fundamentos)",
    subtitle: "Desarrollo del diafragma, soporte subglótico y control de aire",
    badge: "Respiración & Soporte",
    color: "#0A84FF",
    lessons: [
      {
        id: "l1-1",
        lessonNumber: "1.1",
        title: "It's All About the Breath (Todo sobre la respiración)",
        sectionId: 1,
        sectionTitle: "The Foundation",
        description:
          "Ejercicios diseñados para fortalecer el diafragma y añadir potencia a tu voz. Es el cimiento de todo el método. 15 minutos al día generan mejoras inmediatas en proyección, control y resistencia vocal.",
        instructions: [
          "1. Inhala llevando el aire hacia tu estómago con los abdominales completamente sueltos y relajados.",
          "2. Inmediatamente después de inhalar, tensa ligeramente los abdominales inferiores y pausa durante 5 segundos (no tenses con fuerza exagerada).",
          "3. Exhala relajando los abdominales por completo.",
          "4. Repite el ciclo."
        ],
        tips: [
          "Respira hacia abajo (imagina respirar hacia las rodillas, 'baja el elevador').",
          "Debes sentir CERO movimiento en el pecho al inhalar.",
          "No aguantes la respiración cerrando la garganta (piensa en una 'H' suave).",
          "Utiliza un espejo para comprobar que tus hombros y pecho no suban."
        ],
        timerSeconds: 300,
      },
      {
        id: "l1-2",
        lessonNumber: "1.2",
        title: "Breath Control - Part 1 (Control de aire con libro)",
        sectionId: 1,
        sectionTitle: "The Foundation",
        description:
          "Ejercicio físico en el suelo para aislar el movimiento diafragmático y entrenar el empuje abdominal correcto sin tensiones parásitas en cuello o mandíbula.",
        instructions: [
          "1. Acuéstate boca arriba con las rodillas dobladas y los brazos a los lados, con un libro pesado de pasta dura sobre tu abdomen.",
          "2. Respira 'hacia el estómago' de forma rápida y relajada, elevando el libro con el abdomen.",
          "3. Pausa 5 segundos tensando los abdominales inferiores, sosteniendo el libro arriba.",
          "4. Exhala con rapidez relajando el cuerpo: deja caer el abdomen y el libro.",
          "5. Repite."
        ],
        tips: [
          "No bloquees la respiración cerrando la glotis (piensa 'H').",
          "Asegúrate de no hacer ruidos vocales al inhalar (cero jadeos o sonidos de succión).",
          "No 'chupes el popote'. Mantén la mandíbula caída y relajada.",
          "Imagina que lanzas el libro al aire con el impulso del abdomen.",
          "¡Respira con intención! (Como si estuvieras a punto de decir algo crucial)."
        ],
        timerSeconds: 300,
      },
      {
        id: "l1-3",
        lessonNumber: "1.3",
        title: "Breath Control - Part 2 (El sonido de la serpiente 'sssss')",
        sectionId: 1,
        sectionTitle: "The Foundation",
        description:
          "Aprender a dosificar la columna de aire a presión constante utilizando el apoyo de la pared abdominal inferior.",
        instructions: [
          "1. Inhala hacia el abdomen de manera profunda y relajada.",
          "2. Activa y tensa los abdominales inferiores.",
          "3. Emite un sonido 'sssss' continuo (como serpiente) el mayor tiempo posible.",
          "4. Mantén la tensión de apoyo abdominal constante durante todo el sonido y el flujo de aire parejo.",
          "5. La meta óptima es sostener el sonido entre 25 y 30 segundos sin desinflarte.",
          "6. Repite durante 5 a 10 minutos."
        ],
        tips: [
          "¡No fuerces la salida del aire! El objetivo es controlar el caudal (concepto del globo).",
          "Esto es exactamente lo que harás cada vez que cantes una frase musical.",
          "Cuidado con la tensión: el único lugar donde debes sentir esfuerzo es en la zona abdominal baja."
        ],
        timerSeconds: 30,
      },
      {
        id: "l1-4",
        lessonNumber: "1.4",
        title: "Breath Control - Part 3 (Ritmo de inhalación/exhalación)",
        sectionId: 1,
        sectionTitle: "The Foundation",
        description:
          "Enseña a vaciar el aire antes de tomar la siguiente bocanada mientras cantas. Permite entrar en el ritmo natural de respiración para que sea un acto reflejo.",
        instructions: [
          "1. Inhala, activa apoyo, emite 'ssss' durante 5 segundos, exhala el resto... ¡repite!",
          "2. Igual que arriba pero contando un número diferente en cada exhalación (emulando frases de canciones de distintas longitudes).",
          "3. Escucha tus canciones favoritas prestando atención a dónde respira el cantante (busca en YouTube '[Artista] Vocals Only')."
        ],
        tips: [
          "Aprende a identificar las pequeñas respiraciones inadvertidas de los cantantes de élite.",
          "Entrena el reflejo de soltar los abdominales inmediatamente para que el aire entre solo al cuerpo."
        ],
        timerSeconds: 300,
      },
      {
        id: "l1-5",
        lessonNumber: "1.5",
        title: "Warming Up Your Voice (Lip Rolls & Tongue Trills)",
        sectionId: 1,
        sectionTitle: "The Foundation",
        description:
          "Calentamiento semi-ocluido de tracto vocal (SOVTE). Indispensable antes de cantar; funciona como el estiramiento muscular de los deportistas.",
        instructions: [
          "1. Lip Rolls / Trino de labios (Brrr) durante 5 minutos en voz de pecho y falsete.",
          "2. Tongue Trills / Trino de lengua (Rrrr) durante 5 minutos en pecho y falsete.",
          "3. Sirenas vocales subiendo y bajando de tono con trinos durante 5 minutos."
        ],
        tips: [
          "No 'empujes' el aire con fuerza.",
          "Busca un sonido lo más zumbante ('buzzy') y resonante posible.",
          "Si te da cosquilleo o comezón en la nariz, es señal de que la resonancia en máscara es correcta.",
          "Asegúrate de que no haya tensión en los músculos del cuello."
        ],
        timerSeconds: 300,
        vowelPrompt: "Lip Trill (Brrr) / Tongue Trill (Rrr)",
      },
      {
        id: "l1-6",
        lessonNumber: "1.6",
        title: "Humming Along (El truco del zumbido a la vocal)",
        sectionId: 1,
        sectionTitle: "The Foundation",
        description:
          "Truco instantáneo para añadir resonancia natural, brillo y potencia a la voz sin forzar las cuerdas vocales.",
        instructions: [
          "1. Haz un zumbido mecánico/buzzy ('Mmmm') bien frontal en los dientes y labios.",
          "2. Deja caer la mandíbula hacia una vocal abierta 'Ahhh' conservando la misma resonancia vibratoria (¡NO EMPUJES AIRE!).",
          "3. Practica en un tono que sea cómodo para ti (sin ir demasiado grave ni demasiado agudo)."
        ],
        tips: [
          "La resonancia crea el volumen real, no la fuerza del aire.",
          "Mantén el sonido colocado en la 'máscara facial' (pómulos y puente nasal).",
          "No 'tragues' la voz: siente un sutil espacio de 'bostezo' en la parte posterior de la garganta."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        vowelPrompt: "Mmm → Ahhh",
      },
    ],
  },
  {
    id: 2,
    title: "Sección 2: Make the Sound (Conexión Vocal Natural)",
    subtitle: "Uso de sonidos cotidianos, colocación de lengua y actitud facial",
    badge: "Voz Hablada & Resonancia",
    color: "#30D158",
    lessons: [
      {
        id: "l2-1",
        lessonNumber: "2.1",
        title: "'Hey There!' (Conecta con tu voz natural)",
        sectionId: 2,
        sectionTitle: "Make the Sound",
        description:
          "Tu voz hablada y tu voz cantada son la misma entidad conectada. No tienes que 'impostar una voz rara' para cantar.",
        instructions: [
          "1. Di 'Hey' de manera natural con tu cara de actitud ('attitude face').",
          "2. Grábate hablando en una conversación y compara el timbre con el sonido 'Hey'. Debes notar total similitud."
        ],
        tips: [
          "Pon tu 'cara de actitud' (pómulos arriba, ojos despiertos); aporta chispa y resonancia frontal.",
          "La punta de la lengua debe estar adelantada, tocando la parte posterior de los dientes inferiores.",
          "Controla el aire: no ahogues la 'H' inicial.",
          "Si no te sientes un poco ridículo al hacer la cara de actitud, ¡probablemente no lo estás haciendo bien!"
        ],
        vowelPrompt: "Hey!",
      },
      {
        id: "l2-2",
        lessonNumber: "2.2",
        title: "'Hey, Ahh' (Distancia = Tono)",
        sectionId: 2,
        sectionTitle: "Make the Sound",
        description:
          "Cantar es una palabra prohibida: simplemente emite el sonido hacia la distancia.",
        instructions: [
          "1. Di 'Hey-aah' de forma natural y proyectada con la cara de actitud.",
          "2. Mantén la forma externa de la cara fija: deja que la lengua haga la transición hacia la 'Ahh'."
        ],
        tips: [
          "Distancia = Tono (Pitch). Cuanto más lejos proyectes mentalmente el sonido, más agudo resonará.",
          "Piensa en la sensación abierta de 'Ahh' para cantar cualquier otra vocal.",
          "Fija la apertura de la cara y olvídate de moverla en exceso."
        ],
        vowelPrompt: "Hey - Ahh",
      },
      {
        id: "l2-3",
        lessonNumber: "2.3",
        title: "'Ha Ha' (Diferencia de vocales abiertas)",
        sectionId: 2,
        sectionTitle: "Make the Sound",
        description:
          "Expansión del sonido con la consonante de escape 'H' para liberar constricción en la laringe.",
        instructions: [
          "1. Di 'Haaah' naturalmente con cara de actitud. No apagues la 'H'.",
          "2. Sostén la nota por al menos 5 segundos manteniendo el brillo."
        ],
        tips: [
          "'Ahh' (italiana/abierta) y 'Aww' (oscura) son vocales distintas: usa siempre 'Ahh'.",
          "No tengas miedo de actuar con convicción y picardía.",
          "Proyecta hacia un punto lejano en la habitación."
        ],
        timerSeconds: 5,
        vowelPrompt: "Haaah",
      },
      {
        id: "l2-4",
        lessonNumber: "2.4",
        title: "'Ma Ma' (Labios de papa caliente)",
        sectionId: 2,
        sectionTitle: "Make the Sound",
        description:
          "Entrenamiento de la consonante bilabial 'M' sin tensionar labios ni apretar la mandíbula.",
        instructions: [
          "1. Emite 'Maaah' naturalmente con cara de actitud.",
          "2. Toca los labios entre sí ligeramente por solo una fracción de segundo (concepto 'papa caliente')."
        ],
        tips: [
          "Nunca aprietes los labios en la 'M'.",
          "Verifica que no exista ninguna rigidez muscular en las mejillas o mandíbula."
        ],
        vowelPrompt: "Maaah",
      },
      {
        id: "l2-5",
        lessonNumber: "2.5",
        title: "'La La La' (Independencia lingual y mandibular)",
        sectionId: 2,
        sectionTitle: "Make the Sound",
        description:
          "La tensión de la lengua arruina la afinación. Este ejercicio enseña a articular la 'L' únicamente con la punta de la lengua sin mover la mandíbula.",
        instructions: [
          "1. Di 'Laaa' sin mover la mandíbula (un movimiento mínimo está bien, pero no la bloquees).",
          "2. Apenas hagas la 'L', regresa la lengua abajo plana tocando la base de los dientes inferiores."
        ],
        tips: [
          "No dejes la lengua pegada al paladar tras hacer la 'L'.",
          "Imagina que tu voz vive en un 'campo de fuerza' flotando frente a tu rostro.",
          "Usa un espejo frente a ti para vigilar la quietud de la mandíbula."
        ],
        vowelPrompt: "Laaa",
      },
      {
        id: "l2-6",
        lessonNumber: "2.6",
        title: "'Hey Ah Ma La' (Integración completa)",
        sectionId: 2,
        sectionTitle: "Make the Sound",
        description:
          "Unión de los 4 pilares de ataque vocal en una sola secuencia de resonancia frontal.",
        instructions: [
          "1. Emite la frase 'Hey-ah, ma, la' de corrido.",
          "2. Mantén la 'H' viva, los labios sueltos en 'M', la 'L' solo con la lengua y la vibración al frente."
        ],
        tips: [
          "No intentes sonar 'bonito', quédate pegado al zumbido resonante (BUZZZZ).",
          "Mantén el soporte abdominal activo en toda la frase."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        vowelPrompt: "Hey-ah, ma, la",
      },
    ],
  },
  {
    id: 3,
    title: "Sección 3: Putting the 'Moan in the Tone' (Gemido en el Tono)",
    subtitle: "Ampliación de registro agudo mediante sirenas y emoción natural",
    badge: "Agudos sin Esfuerzo",
    color: "#BF5AF2",
    lessons: [
      {
        id: "l3-1",
        lessonNumber: "3.1",
        title: "'Emotive' Sounds ('Ahhh-man!')",
        sectionId: 3,
        sectionTitle: "Putting the 'Moan in the Tone'",
        description:
          "El secreto para alcanzar notas agudas con facilidad: usar los mecanismos emocionales del habla cotidiana que ya tienes programados en tu sistema nervioso.",
        instructions: [
          "1. Gime literalmente la frase de queja '¡Ahhh-man!' (como lamentándote). NO digas 'Awww-man'.",
          "2. No tengas miedo de sonar 'odioso' o exagerado: más emoción = nota más aguda sin tensión."
        ],
        tips: [
          "Al hablar tocamos notas agudísimas todo el tiempo sin darnos cuenta; el objetivo es usar eso como trampolín.",
          "Siente la presencia de la 'H' interna aunque no la pronuncies con aire ruidoso."
        ],
        vowelPrompt: "¡Ahhh-man!",
      },
      {
        id: "l3-2",
        lessonNumber: "3.2",
        title: "Siren the 'Hey' (Sirena vocal limpia)",
        sectionId: 3,
        sectionTitle: "Putting the 'Moan in the Tone'",
        description:
          "Deslizamiento continuo de frecuencias para coordinar el estiramiento cordal sin quiebres abruptos.",
        instructions: [
          "1. Calienta 2 minutos con respiración y trino de labios.",
          "2. Haz una sirena ascendente y descendente con 'Hey'. Llega solo hasta donde estés cómodo.",
          "3. Concéntrate en un tono limpio y parejo (sin carraspera ni tono aireado)."
        ],
        tips: [
          "No mastiques la 'Y'.",
          "El viaje continuo entre las notas es tan importante como la nota cumbre.",
          "Debes sentir un sutil 'gemido' o compresión elástica en las notas altas, ¡nunca empuje de aire!"
        ],
        vowelPrompt: "Hey (Sirena)",
      },
      {
        id: "l3-3",
        lessonNumber: "3.3",
        title: "Siren 'Hey Ahh' (Apertura en el pico)",
        sectionId: 3,
        sectionTitle: "Putting the 'Moan in the Tone'",
        description:
          "Transición hacia la vocal abierta 'Ahh' en la cúspide de la sirena para expandir la faringe.",
        instructions: [
          "1. Desliza con 'Hey---Ahhh', cambiando a 'Ahh' cerca del pico más alto de la sirena.",
          "2. Mantén la garganta ancha e impide que se cierre o se vuelva airosa."
        ],
        tips: [
          "No permitas que la laringe suba bruscamente al cambiar a 'Ahh'.",
          "Imagina espacio de bostezo invertido."
        ],
        vowelPrompt: "Hey ↗ Ahhh ↘",
      },
      {
        id: "l3-4",
        lessonNumber: "3.4",
        title: "Siren 'Ma' (Sirena bilabial suave)",
        sectionId: 3,
        sectionTitle: "Putting the 'Moan in the Tone'",
        description:
          "Sirena con ataque suave 'Maah' manteniendo contacto ligero en labios.",
        instructions: [
          "1. Realiza la sirena con la sílaba 'Maah'.",
          "2. Cuida la estabilidad del timbre sin permitir raspe ni escape de aire."
        ],
        tips: [
          "Si sientes tensión en el cuello, detente, relaja y vuelve a intentarlo.",
          "Relaja hombros y mandíbula."
        ],
        vowelPrompt: "Maah (Sirena)",
      },
      {
        id: "l3-5",
        lessonNumber: "3.5",
        title: "Siren 'La' (Sirena de lengua libre)",
        sectionId: 3,
        sectionTitle: "Putting the 'Moan in the Tone'",
        description: "Sirena con 'Laah' aislando por completo la lengua.",
        instructions: [
          "1. Sirena con 'Laah' sin empujar aire de más.",
          "2. Mantén consistencia acústica en todo el recorrido."
        ],
        tips: [
          "La lengua regresa al fondo dental inferior tras el arranque.",
          "Mantén el apoyo en el ombligo."
        ],
        vowelPrompt: "Laah (Sirena)",
      },
      {
        id: "l3-6",
        lessonNumber: "3.6",
        title: "Siren 'Yo' (Sin diptongo final)",
        sectionId: 3,
        sectionTitle: "Putting the 'Moan in the Tone'",
        description:
          "Sirena con 'Yo' evitando el cierre hacia 'W' ('Yoww') para mantener el tubo resonador despejado.",
        instructions: [
          "1. Sirena con 'Yo'.",
          "2. Evita cerrar los labios y crear el sonido 'W' al final de la vocal.",
          "3. Conserva el sonido abierto y resonante."
        ],
        tips: [
          "La vocal debe permanecer pura hasta el corte del sonido.",
          "Sonido firme sin ahogo."
        ],
        vowelPrompt: "Yoh (Sirena)",
      },
    ],
  },
  {
    id: 4,
    title: "Sección 4: Hitting Those Notes (Escala 1-2-3-2-1 a 50 BPM)",
    subtitle: "Afinación exacta de notas específicas con ritmo de inhalación / exhalación",
    badge: "Escalas 12321 a 50 BPM",
    color: "#FF9F0A",
    lessons: [
      {
        id: "l4-1",
        lessonNumber: "4.1",
        title: "Do Re Mi – Hey (Escala 1-2-3-2-1)",
        sectionId: 4,
        sectionTitle: "Hitting Those Notes",
        description:
          "Práctica de la escala base de 5 peldaños (Do-Re-Mi-Re-Do) con tempo lento de 50 BPM. Permite consolidar la memoria muscular del apoyo abdominal.",
        instructions: [
          "1. Canta el patrón 1-2-3-2-1 con 'Hey'.",
          "2. Mantén los abdominales inferiores en soporte firme al cantar y suéltalos al inhalar/exhalar.",
          "3. Empieza en la nota más baja cómoda de tu registro (varones ~C3, mujeres ~G3 o A3) y sube semitono a semitono."
        ],
        tips: [
          "Las notas NO están arriba: son revoluciones más rápidas ('higher revs') o proyectadas a mayor distancia.",
          "Eres un 'Gi vacío' (suelto, ingrávido y sin tensión corporal).",
          "Piensa como si cantaras sin aire: el aire entra, la energía sale.",
          "¡No hagas estos ejercicios con audífonos que te aíslen el sonido ambiente!"
        ],
        scalePattern: [0, 2, 4, 2, 0],
        bpm: 50,
        vowelPrompt: "Hey (1-2-3-2-1)",
      },
      {
        id: "l4-2",
        lessonNumber: "4.2",
        title: "Do Re Mi – Ha",
        sectionId: 4,
        sectionTitle: "Hitting Those Notes",
        description: "Escala 1-2-3-2-1 con 'Haah', asegurando el inicio limpio con 'H'.",
        instructions: [
          "1. Canta la escala 12321 con 'Haah' entrando en ritmo con tu respiración.",
          "2. Ajusta el apoyo en cada cambio de acorde."
        ],
        tips: [
          "No mates la 'H'.",
          "Canta solo hasta donde estés cómodo sin empujar."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        bpm: 50,
        vowelPrompt: "Haah (1-2-3-2-1)",
      },
      {
        id: "l4-3",
        lessonNumber: "4.3",
        title: "Do Re Mi – Ma",
        sectionId: 4,
        sectionTitle: "Hitting Those Notes",
        description: "Escala 1-2-3-2-1 con 'Mah', liberando presión labial.",
        instructions: [
          "1. Canta la escala con 'Mah' a 50 BPM.",
          "2. Suelta el abdomen entre cada ciclo de escala."
        ],
        tips: [
          "Contacto labial suave.",
          "Mandíbula sin apretar."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        bpm: 50,
        vowelPrompt: "Mah (1-2-3-2-1)",
      },
      {
        id: "l4-4",
        lessonNumber: "4.4",
        title: "Do Re Mi – La",
        sectionId: 4,
        sectionTitle: "Hitting Those Notes",
        description: "Escala 1-2-3-2-1 con 'Laah' aislando la lengua.",
        instructions: [
          "1. Canta la escala con 'Laah' sin oscilación mandibular.",
          "2. Vuelve la lengua a la base dental en cada grado."
        ],
        tips: [
          "Comprueba con espejo la inmovilidad de la mandíbula.",
          "Sonido brillante."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        bpm: 50,
        vowelPrompt: "Laah (1-2-3-2-1)",
      },
      {
        id: "l4-5",
        lessonNumber: "4.5",
        title: "Do Re Mi – Hey/Ahh",
        sectionId: 4,
        sectionTitle: "Hitting Those Notes",
        description: "Apertura dinámica en el 3er grado de la escala con 'Hey-ah'.",
        instructions: [
          "1. Canta la escala con 'Hey-ah' abriendo al llegar a la nota superior.",
          "2. Desciende con resonancia abierta."
        ],
        tips: [
          "Asegura el soporte diafragmático.",
          "Mantén el espacio vertical de la boca."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        bpm: 50,
        vowelPrompt: "Hey-ah (1-2-3-2-1)",
      },
      {
        id: "l4-6",
        lessonNumber: "4.6",
        title: "Do Re Mi – Yo",
        sectionId: 4,
        sectionTitle: "Hitting Those Notes",
        description: "Escala 1-2-3-2-1 con 'Yoh' sin redondeo excesivo hacia 'W'.",
        instructions: [
          "1. Canta la escala con 'Yoh' a 50 BPM.",
          "2. Respira con el abdomen entre transposiciones."
        ],
        tips: [
          "Vocal limpia hasta el final.",
          "Cero tensión laríngea."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        bpm: 50,
        vowelPrompt: "Yoh (1-2-3-2-1)",
      },
    ],
  },
  {
    id: 5,
    title: "Sección 5: Movin' On Up! (Saltos e Intervalos 'Scooped')",
    subtitle: "Velo del paladar blando y saltos de 3ra, 4ta, 5ta y Octava",
    badge: "Intervalos & Paladar Blando",
    color: "#30D158",
    lessons: [
      {
        id: "l5-1",
        lessonNumber: "5.1",
        title: "'Ng Ahh' (Activación del Velo del Paladar Blando)",
        sectionId: 5,
        sectionTitle: "Movin' On Up!",
        description:
          "El ejercicio definitivo para elevar el velo del paladar (soft palate) y crear el espacio acústico donde resuenan los agudos.",
        instructions: [
          "1. Di 'NG' (como al final de 'sing') y salta de golpe a un sonido abierto 'Ahh'.",
          "2. Mantén la punta de la lengua tocando la base de los dientes inferiores en todo momento.",
          "3. Siente cómo la garganta se abre y la lengua se aplana al despegar del sonido 'NG' hacia 'Ahh'."
        ],
        tips: [
          "El 'rebote' elástico del velo del paladar genera espacio instantáneo sin bajar la laringe a la fuerza.",
          "Puedes hacer sirenas con 'Aaa' tras el despegue para maximizar la apertura."
        ],
        vowelPrompt: "NG ➔ Ahh",
      },
      {
        id: "l5-2",
        lessonNumber: "5.2",
        title: "Scooped 3rds (Salto de Tercera Deslizada)",
        sectionId: 5,
        sectionTitle: "Movin' On Up!",
        description: "Salto interválico de 3ra mayor deslizada con diana en notas concretas.",
        instructions: [
          "1. Practica el salto 1 ➔ 3 deslizado con 'Hey', 'Hah', 'Mah', 'Lah' y 'Yo'.",
          "2. Trátalo como una pequeña sirena que aterriza con precisión en el 3er grado."
        ],
        tips: [
          "No saltes a golpes: mantén la línea vocal conectada.",
          "Activa apoyo abdominal antes de iniciar la nota alta."
        ],
        scalePattern: [0, 4, 0],
        vowelPrompt: "1 ➔ 3 (Hey, Ha, Ma, La, Yo)",
      },
      {
        id: "l5-3",
        lessonNumber: "5.3",
        title: "Scooped 4ths (Salto de Cuarta)",
        sectionId: 5,
        sectionTitle: "Movin' On Up!",
        description: "Ampliación del intervalo hacia la 4ta justa.",
        instructions: [
          "1. Practica el salto 1 ➔ 4 deslizado con 'Hey', 'Hah', 'Mah', 'Lah' y 'Yo'.",
          "2. Sostén el 4to grado con sonido zumbante."
        ],
        tips: [
          "Conserva la misma apertura bucal en ambas notas.",
          "Respira relajado entre cada ciclo."
        ],
        scalePattern: [0, 5, 0],
        vowelPrompt: "1 ➔ 4 (Hey, Ha, Ma, La, Yo)",
      },
      {
        id: "l5-4",
        lessonNumber: "5.4",
        title: "Scooped 5ths (Salto de Quinta)",
        sectionId: 5,
        sectionTitle: "Movin' On Up!",
        description: "Salto de 5ta justa (base de los arpegios mayores).",
        instructions: [
          "1. Salta del 1 al 5 con 'Hey', 'Hah', 'Mah', 'Lah' y 'Yo'.",
          "2. Proyecta la 5ta con mayor intención energética hacia el frente."
        ],
        tips: [
          "No levantes la barbilla al subir al 5to grado.",
          "Mayor apoyo en el abdomen inferior."
        ],
        scalePattern: [0, 7, 0],
        vowelPrompt: "1 ➔ 5 (Hey, Ha, Ma, La, Yo)",
      },
      {
        id: "l5-5",
        lessonNumber: "5.5",
        title: "Scooped Octaves (Salto de Octava Completa)",
        sectionId: 5,
        sectionTitle: "Movin' On Up!",
        description: "Salto de 8va completa conectando pecho y paso hacia resonancia alta.",
        instructions: [
          "1. Salto 1 ➔ 8 deslizado con 'Hey', 'Hah', 'Mah', 'Lah' y 'Yo'.",
          "2. Siente la elásticidad cordal al duplicar la frecuencia."
        ],
        tips: [
          "Nunca grites al llegar a la octava superior: piensa la nota 'hacia abajo' con apoyo diafragmático.",
          "Permite que resuene en la máscara facial."
        ],
        scalePattern: [0, 12, 0],
        vowelPrompt: "1 ➔ 8 (Hey, Ha, Ma, La, Yo)",
      },
      {
        id: "l5-6",
        lessonNumber: "5.6",
        title: "Warm Up and 'Hey Ah' en Scoops",
        sectionId: 5,
        sectionTitle: "Movin' On Up!",
        description: "Integración de todas las distancias con apertura 'Hey-Ahh'.",
        instructions: [
          "1. Recuerda mantenerte hidratado y calentar primero.",
          "2. Practica todos los ejercicios 'Scooped' (3ras, 4tas, 5tas y Octavas) usando la transición 'Hey-Ahh'."
        ],
        tips: [
          "La transición a 'Ahh' en la nota alta previene constricción laríngea.",
          "Conserva la colocación frontal."
        ],
        scalePattern: [0, 4, 7, 12, 0],
        vowelPrompt: "Hey-Ahh en saltos",
      },
    ],
  },
  {
    id: 6,
    title: "Sección 6: Vocal Control (Arpegios Maestros)",
    subtitle: "Precisión interválica, arpegios mayores y el principio 'Fun vs Fear'",
    badge: "Arpegios & Agilidad",
    color: "#0A84FF",
    lessons: [
      {
        id: "l6-1",
        lessonNumber: "6.1",
        title: "Introduction to Arpeggios (Fun vs Fear)",
        sectionId: 6,
        sectionTitle: "Vocal Control",
        description:
          "La psicología del cantante: sólo existen 2 'F' al cantar: o cantas con Miedo (Fear) y te tensionas, o cantas con Diversión (Fun) y tu cuerpo responde.",
        instructions: [
          "1. Revisa ejercicios anteriores soltándote emocionalmente y disfrutando cada emisión.",
          "2. Recuerda siempre: 'You can sing from Fear... or have Fun!'"
        ],
        tips: [
          "La mente tensa cierra las cuerdas y aprieta la mandíbula; la diversión abre el tracto vocal.",
          "Confía en el soporte abdominal."
        ],
      },
      {
        id: "l6-2",
        lessonNumber: "6.2",
        title: "Arpeggio #1 (1 - 3 - 5 - 3 - 1)",
        sectionId: 6,
        sectionTitle: "Vocal Control",
        description: "Tríada mayor clásica con descenso controlado.",
        instructions: [
          "1. Canta la tríada 1-3-5-3-1 con: 'Hey', 'Ha', 'Hey-ahh', 'Mah', 'Lah' y 'Yooh'.",
          "2. No olvides exhalar e inhalar profundamente entre cada escala."
        ],
        tips: [
          "Mantén el mismo espacio interno en las tres notas.",
          "Soporte estable en el ombligo."
        ],
        scalePattern: [0, 4, 7, 4, 0],
        vowelPrompt: "1-3-5-3-1",
      },
      {
        id: "l6-3",
        lessonNumber: "6.3",
        title: "Arpeggio #2 (1 - 3 - 5 - 8 - 5 - 3 - 1)",
        sectionId: 6,
        sectionTitle: "Vocal Control",
        description: "Arpegio extendido a la octava superior con retorno a la raíz.",
        instructions: [
          "1. Canta 1-3-5-8-5-3-1 con 'Hey', 'Ha', 'Hey-ahh', 'Mah', 'Lah' y 'Yooh'.",
          "2. Aplica la técnica 'scoop' al pasar del 5 al 8 para mantener la misma resonancia vibratoria (evita que la nota 8 se vuelva airosa)."
        ],
        tips: [
          "El 8 debe sonar con cuerpo y brillo, no falsete desconectado.",
          "Inhala profundo entre transposiciones."
        ],
        scalePattern: [0, 4, 7, 12, 7, 4, 0],
        vowelPrompt: "1-3-5-8-5-3-1",
      },
      {
        id: "l6-4",
        lessonNumber: "6.4",
        title: "Arpeggio #4 (8 - 5 - 3 - 1 Descenso Directo)",
        sectionId: 6,
        sectionTitle: "Vocal Control",
        description:
          "Comenzar directamente en la nota aguda (la 8va) y descender en cascada armónica.",
        instructions: [
          "1. Canta 8-5-3-1 con 'Hey', 'Ha', 'Hey-ahh', 'Mah', 'Lah' y 'Yooh'.",
          "2. Prepárate y cárgate emocionalmente ANTES de que el sonido salga: debes tener la nota 8 colocada en tu mente antes de emitir aire."
        ],
        tips: [
          "No 'busques' la nota alta desde abajo: atácala directamente en el centro afinado.",
          "Exhala/inhala entre repeticiones."
        ],
        scalePattern: [12, 7, 4, 0],
        vowelPrompt: "8-5-3-1 (Descendente)",
      },
      {
        id: "l6-5",
        lessonNumber: "6.5",
        title: "Arpeggio #5 (1-3-5-8-5-3-1 Sosteniendo la 8va)",
        sectionId: 6,
        sectionTitle: "Vocal Control",
        description: "Llegar al clímax de la octava y mantenerla sostenida con poder.",
        instructions: [
          "1. Canta 1-3-5-8-5-3-1 sosteniendo la nota 8 por varios segundos con 'Hey', 'Ha', 'Hey-ahh', 'Mah', 'Lah' y 'Yooh'.",
          "2. Abre la garganta y ¡deja volar esa nota 8!",
          "3. No te preocupes si aparece vibrato o no; déjalo fluir naturalmente."
        ],
        tips: [
          "Apoyo abdominal continuo durante el sostén.",
          "Voz amplia y libre de tensiones."
        ],
        scalePattern: [0, 4, 7, 12, 7, 4, 0],
        timerSeconds: 5,
        vowelPrompt: "1-3-5-8 (Hold)-5-3-1",
      },
      {
        id: "l6-6",
        lessonNumber: "6.6",
        title: "Review Day! (Día de repaso y comprobación)",
        sectionId: 6,
        sectionTitle: "Vocal Control",
        description: "Consolidación de las técnicas de control y chequeo de respiración.",
        instructions: [
          "1. Repasa los arpegios de esta semana con distintas velocidades.",
          "2. Regresa a la Semana 1 y haz 5 minutos del ejercicio de respiración con libro o 'sssss' para verificar que tu apoyo siga activo."
        ],
        tips: [
          "La técnica se construye con consistencia y chequeos regulares de los fundamentos.",
          "Celebra los avances en tu tesitura."
        ],
      },
    ],
  },
  {
    id: 7,
    title: "Sección 7: 'Putting Words in Your Mouth' (Dicción en el Canto)",
    subtitle: "Consonantes asesinas, diptongos traicioneros y vocales difíciles",
    badge: "Articulación & Texto",
    color: "#BF5AF2",
    lessons: [
      {
        id: "l7-1",
        lessonNumber: "7.1",
        title: "Killer Consonants - Part 1 (Ka-Ga, Pa-Ba, Fa-Va)",
        sectionId: 7,
        sectionTitle: "Putting Words in Your Mouth",
        description:
          "Las consonantes oclusivas y fricativas pueden cortar el aire o hacerte 'toser' las notas. Suavizarlas es el secreto de los profesionales.",
        instructions: [
          "1. Di Ka-Ga alternando. Pon un poco de 'G' en tu 'K' para evitar 'toser' la 'K'. Canta la escala 12321 alternando 'Ka' y 'Ga'.",
          "2. Di Pa-Ba alternando. Pon un poco de 'B' en tu 'P' para evitar el golpe de aire 'popping'. Canta 12321 con 'Pa' y 'Ba'.",
          "3. Di Fa-Va alternando. Pon un poco de 'V' en tu 'F' para no empujar aire excesivo. Canta 12321 con 'Fa' y 'Va'."
        ],
        tips: [
          "La consonante debe ser rápida y suave como un rayo; la vocal es la que lleva el sonido.",
          "Conserva la resonancia en máscara."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        vowelPrompt: "Ka-Ga / Pa-Ba / Fa-Va",
      },
      {
        id: "l7-2",
        lessonNumber: "7.2",
        title: "Killer Consonants - Part 2 (Ta-Da, Cha-Ja, Sa-Za)",
        sectionId: 7,
        sectionTitle: "Putting Words in Your Mouth",
        description: "Eliminación de la expulsión excesiva de aire en consonantes dentales y sibilantes.",
        instructions: [
          "1. Di Ta-Da. Pon un poco de 'D' en la 'T' para evitar escupir la 'T'. Canta 12321 con 'Ta' y 'Da'.",
          "2. Di Cha-Ja. Pon un poco de 'J' en tu 'Ch' para evitar empujarla. Canta 12321 con 'Cha' y 'Ja'.",
          "3. Di Sa-Za. Pon un poco de 'Z' en tu 'S' para suavizar el siseo. Canta 12321 con 'Sa' y 'Za'."
        ],
        tips: [
          "Articula con ligereza sin perder dicción.",
          "El apoyo abdominal absorbe la energía."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        vowelPrompt: "Ta-Da / Cha-Ja / Sa-Za",
      },
      {
        id: "l7-3",
        lessonNumber: "7.3",
        title: "Car, Far, Star (El peligro de la 'R' en canciones en inglés)",
        sectionId: 7,
        sectionTitle: "Putting Words in Your Mouth",
        description:
          "La letra 'R' retrofleja cierra la faringe al cantar palabras como 'Car', 'Far' o 'Star'. Debes sostener la vocal abierta y tocar la 'R' solo al milisegundo final.",
        instructions: [
          "1. Practica diciendo 'Car', 'Far' y 'Star'. Sostén la vocal pura 'Ah' y NO anticipes la 'R'.",
          "2. ¡Mantén la lengua adelantada y abajo! No la tires hacia atrás hasta el instante final.",
          "3. Canta 'Car', 'Far', 'Star' sobre las escalas 12321, 13531 y 1358531."
        ],
        tips: [
          "El 95% de la duración de la nota es la vocal 'Ah'; la 'R' es solo un toque final.",
          "Mismo principio aplica a palabras en español como 'Amar', 'Cantar', 'Estar'."
        ],
        scalePattern: [0, 4, 7, 4, 0],
        vowelPrompt: "Car, Far, Star (Vocal Ahhh)",
      },
      {
        id: "l7-4",
        lessonNumber: "7.4",
        title: "Fell, Tell (El peligro de anticipar la 'L')",
        sectionId: 7,
        sectionTitle: "Putting Words in Your Mouth",
        description: "Prevenir que la lengua se pegue al paladar antes de tiempo en palabras con 'L'.",
        instructions: [
          "1. Practica diciendo 'Fell' y 'Tell'. Sostén la vocal y evita anticipar la 'L'.",
          "2. Mantén la lengua adelante y abajo; no toques el paladar con la punta hasta que termine la frase.",
          "3. Canta con las escalas 12321, 13531 y 1358531."
        ],
        tips: [
          "La 'L' solo existe para cerrar la sílaba.",
          "Mandíbula quieta."
        ],
        scalePattern: [0, 4, 7, 4, 0],
        vowelPrompt: "Fell, Tell (Vocal abierta)",
      },
      {
        id: "l7-5",
        lessonNumber: "7.5",
        title: "'I' is Everywhere! (Diptongo Ah-ee)",
        sectionId: 7,
        sectionTitle: "Putting Words in Your Mouth",
        description:
          "La palabra 'I' en inglés o diptongos con 'I' deben cantarse como 'Ah-am-Ah' sin cerrar prematuramente hacia 'eee'.",
        instructions: [
          "1. Di 'I am I' (debe sonar acústicamente como 'Ah-am-Ah').",
          "2. Ten cuidado con el sonido 'eee' estridente al final del diptongo.",
          "3. Canta la frase 'I Am I' sobre 12321 y 13531."
        ],
        tips: [
          "Sostén la vocal ancha 'Ah' durante el canto; solo insinúa la 'i' al cerrar.",
          "Elimina el sonido nasal aplastado."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        vowelPrompt: "I Am I (Ah-am-Ah)",
      },
      {
        id: "l7-6",
        lessonNumber: "7.6",
        title: "Dealing With Tricky Vowels ('Me' -> 'May', 'You' -> 'Yo')",
        sectionId: 7,
        sectionTitle: "Putting Words in Your Mouth",
        description:
          "Vocales estrechas como la 'E' o la 'U' estrangulan los agudos. Modificarlas a 'May' y 'Yo' abre el tracto vocal al subir.",
        instructions: [
          "1. Canta la palabra 'Me' transformándola sutilmente en 'May' al subir en las escalas 12321 y 13531.",
          "2. Canta la palabra 'You' transformándola en 'Yo' hacia 'ooh' al entrar en el rango alto.",
          "3. Abre la vocal para permitir que el sonido se expanda."
        ],
        tips: [
          "La modificación de vocales ('vowel modification') es el secreto de los cantantes de Broadway y Rock para no ahogarse en agudos.",
          "Para el público suena natural; para tu garganta es libertad total."
        ],
        scalePattern: [0, 4, 7, 4, 0],
        vowelPrompt: "Me ➔ May / You ➔ Yo",
      },
    ],
  },
  {
    id: 8,
    title: "Sección 8: Advanced Singing Techniques (Técnicas Avanzadas)",
    subtitle: "Voz Mixta, Ataque Glótico, Falsete, Fuerza Diafragmática y Blues",
    badge: "Voz Mixta & Potencia",
    color: "#30D158",
    lessons: [
      {
        id: "l8-1",
        lessonNumber: "8.1",
        title: "Intro to Registers (Pecho, Mixta y Falsete)",
        sectionId: 8,
        sectionTitle: "Advanced Singing Techniques",
        description:
          "Identificación y juego lúdico con los 3 registros básicos de la voz humana.",
        instructions: [
          "1. Voz de Pecho (Chest Voice): Tu voz hablada, firme, resonando en el esternón.",
          "2. Voz Mixta (Mix Voice): Sonido de llanto / queja ('whine/cry'), brillante en los pómulos.",
          "3. Falsete (Falsetto): Tono ligero, airosito y suave en las notas altas por encima del quiebre."
        ],
        tips: [
          "Familiarízate con las sensaciones físicas de vibración de cada uno.",
          "Juega pasando de uno a otro sin juzgarte."
        ],
      },
      {
        id: "l8-2",
        lessonNumber: "8.2",
        title: "Glottal Stop / Attack (Ataque glótico controlado)",
        sectionId: 8,
        sectionTitle: "Advanced Singing Techniques",
        description:
          "Cierre cordal preciso para crear notas staccato limpias sin fuga de aire.",
        instructions: [
          "1. Di 'I. Am. An. Astronaut.' con paradas glóticas limpias. Luego dilo corrido 'iyamanastronaut'. Siente el contraste.",
          "2. Practica las vocales 'Ay', 'Ah' y 'Oh' con las escalas 12321 y 13531 usando paradas glóticas (sonará staccato).",
          "3. ¡Cuidado! No ataques demasiado fuerte tosiendo las notas."
        ],
        tips: [
          "El ataque glótico debe ser elástico y musical, no un golpe agresivo.",
          "Activa la pared abdominal en cada staccato."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        vowelPrompt: "Ay, Ah, Oh (Staccato)",
      },
      {
        id: "l8-3",
        lessonNumber: "8.3",
        title: "More Power (Fuerza Diafragmática & Sonido de Mono)",
        sectionId: 8,
        sectionTitle: "Advanced Singing Techniques",
        description:
          "Desarrollo de potencia real mediante el 'kick' abdominal instintivo de sonidos animales o risas.",
        instructions: [
          "1. Haz sonidos de mono ('Uh-uh-uh'), risa de Santa Claus ('Jo-jo-jo') o risa malvada ('Muahaha'). Nota el golpe diafragmático.",
          "2. Canta la vocal 'Ah' como el sonido de mono: haz de 5 a 10 pulsos EN LA MISMA NOTA (notando el kick abdominal) y sostén la última nota 2 segundos.",
          "3. Practica sobre la escala 12321 con pulsos staccato (aquí NO hay retención de aire entre pulsos)."
        ],
        tips: [
          "Este ejercicio entrena el motor de potencia de cantantes como Freddie Mercury o Steven Tyler.",
          "La garganta permanece abierta; el pulso proviene 100% de los abdominales."
        ],
        scalePattern: [0, 2, 4, 2, 0],
        vowelPrompt: "Uh-uh-uh (Sonido de Mono)",
      },
      {
        id: "l8-4",
        lessonNumber: "8.4",
        title: "Falsetto, Mix and Chest (Tránsito por el quiebre vocal)",
        sectionId: 8,
        sectionTitle: "Advanced Singing Techniques",
        description:
          "Aprender a romper voluntariamente hacia el falsete y regresar a pecho sin miedo.",
        instructions: [
          "1. Habla en voz de falsete (ligero y airosito, por encima de tu 'break').",
          "2. Practica 'Scooped 5ths' con 'Hey': canta la primera nota en voz de pecho y 'rompe' limpiamente al falsete en el 5to grado.",
          "3. Practica 'Scooped Octaves' con 'Hey': primera nota en pecho y quiebre al falsete en la octava."
        ],
        tips: [
          "Dominar el quiebre te da el control para luego conectar la voz mixta.",
          "No fuerces el pecho para llegar arriba."
        ],
        scalePattern: [0, 7, 0],
        vowelPrompt: "Pecho ➔ Falsete en 5ta y 8va",
      },
      {
        id: "l8-5",
        lessonNumber: "8.5",
        title: "Intro to Mix Voice (El sonido del niño quejumbroso)",
        sectionId: 8,
        sectionTitle: "Advanced Singing Techniques",
        description:
          "El Santo Grial del canto moderno: la voz mixta. Combina la potencia del pecho con la altura del falsete usando el sonido quejumbroso de un niño berrinchudo.",
        instructions: [
          "1. Haz sonidos llorosos/quejumbrosos ('whiny sound'). Sé cómico y conecta con el tono zumbante de 'niño caprichoso'.",
          "2. Di una frase como 'I don't wanna brush my teeth' ('No quiero lavarme los dientes') en diferentes tonos, llevándola a un registro agudo y emotivo.",
          "3. Aplícalo a las escalas 12321, 13531 y 1358531 subiendo más arriba de lo habitual con ese tono quejumbroso.",
          "4. NUNCA empujes ni te esfuerces. Solo sube hasta donde no sientas molestia."
        ],
        tips: [
          "El 'llanto' inclina el cartílago tiroides y adelgaza las cuerdas vocales, permitiendo agudos potentes sin gritar.",
          "Coloca el sonido en la 'máscara' facial (nariz y pómulos)."
        ],
        scalePattern: [0, 4, 7, 12, 7, 4, 0],
        vowelPrompt: "Whiny Mix: 'I don't wanna brush my teeth'",
      },
      {
        id: "l8-6",
        lessonNumber: "8.6",
        title: "Rockin' Blues & Escalas Menores Bonus",
        sectionId: 8,
        sectionTitle: "Advanced Singing Techniques",
        description:
          "Estilo, inflexión blues y uso de escalas menores para conferir emoción profunda a tu repertorio.",
        instructions: [
          "1. Canta 'Yeah' enfocando la vocal 'A' abierta como en 'Cat' o 'Hat' con cara de actitud sobre escalas Blues descendentes a 50 BPM.",
          "2. Canta sobre escalas Blues ascendentes a 50 BPM.",
          "3. Escalas Bonus Menores: Practica las mismas palabras sobre escalas y arpegios menores (tienen un tono melancólico u 'ominoso').",
          "4. ¡Felicidades por terminar el método de Steve Glazer! Sigue practicando y divirtiéndote."
        ],
        tips: [
          "Mezcla y combina diferentes escalas con las distintas vocales que aprendiste a lo largo del curso.",
          "Recuerda siempre cantar desde la Diversión (Fun) y mantener la humildad de los fundamentos diarios."
        ],
        scalePattern: [0, 3, 5, 6, 7, 10, 12],
        bpm: 50,
        vowelPrompt: "Yeah! (Blues Cat/Hat)",
      },
    ],
  },
];
