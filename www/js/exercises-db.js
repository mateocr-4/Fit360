/**
 * Base de datos de ejercicios de gimnasio categorizados
 */
const EXERCISES_DATABASE = [
  // Pecho
  { id: 'bench_press', name: 'Press de Banca Plano con Barra', category: 'Pecho', defaultWeight: 70, defaultReps: 10 },
  { id: 'incline_db_press', name: 'Press Inclinado con Mancuernas', category: 'Pecho', defaultWeight: 26, defaultReps: 10 },
  { id: 'decline_press', name: 'Press Declinado', category: 'Pecho', defaultWeight: 60, defaultReps: 12 },
  { id: 'cable_flyes', name: 'Cruces en Polea (Aperturas)', category: 'Pecho', defaultWeight: 15, defaultReps: 15 },
  { id: 'dips_chest', name: 'Fondos en Paralelas (Pecho)', category: 'Pecho', defaultWeight: 0, defaultReps: 12 },
  { id: 'chest_press_machine', name: 'Press de Pecho en Máquina', category: 'Pecho', defaultWeight: 55, defaultReps: 12 },

  // Espalda
  { id: 'deadlift', name: 'Peso Muerto Convencional', category: 'Espalda', defaultWeight: 110, defaultReps: 6 },
  { id: 'lat_pulldown', name: 'Jalón al Pecho en Polea', category: 'Espalda', defaultWeight: 60, defaultReps: 10 },
  { id: 'barbell_row', name: 'Remo con Barra 90° / 45°', category: 'Espalda', defaultWeight: 65, defaultReps: 8 },
  { id: 'seated_cable_row', name: 'Remo Gironda en Polea Baja', category: 'Espalda', defaultWeight: 50, defaultReps: 12 },
  { id: 'pull_ups', name: 'Dominadas Pronas / Neutras', category: 'Espalda', defaultWeight: 0, defaultReps: 8 },
  { id: 'face_pull', name: 'Face Pull en Polea Alta', category: 'Espalda', defaultWeight: 20, defaultReps: 15 },

  // Piernas
  { id: 'barbell_squat', name: 'Sentadilla Trasera con Barra', category: 'Piernas', defaultWeight: 90, defaultReps: 8 },
  { id: 'leg_press', name: 'Prensa Inclinada 45°', category: 'Piernas', defaultWeight: 160, defaultReps: 12 },
  { id: 'romanian_deadlift', name: 'Peso Muerto Rumano (Isquios)', category: 'Piernas', defaultWeight: 75, defaultReps: 10 },
  { id: 'leg_extension', name: 'Extensiones de Cuádriceps', category: 'Piernas', defaultWeight: 45, defaultReps: 12 },
  { id: 'leg_curl', name: 'Curl Femoral Tumbado / Sentado', category: 'Piernas', defaultWeight: 40, defaultReps: 12 },
  { id: 'calf_raise', name: 'Elevación de Talones (Gemelos)', category: 'Piernas', defaultWeight: 50, defaultReps: 15 },
  { id: 'bulgarian_split', name: 'Sentadilla Búlgara con Mancuernas', category: 'Piernas', defaultWeight: 18, defaultReps: 10 },
  { id: 'hip_thrust', name: 'Hip Thrust con Barra', category: 'Piernas', defaultWeight: 100, defaultReps: 10 },

  // Hombros
  { id: 'overhead_press', name: 'Press Militar con Barra', category: 'Hombros', defaultWeight: 45, defaultReps: 8 },
  { id: 'db_shoulder_press', name: 'Press de Hombros con Mancuernas', category: 'Hombros', defaultWeight: 22, defaultReps: 10 },
  { id: 'lateral_raises', name: 'Elevaciones Laterales', category: 'Hombros', defaultWeight: 10, defaultReps: 15 },
  { id: 'front_raises', name: 'Elevaciones Frontales', category: 'Hombros', defaultWeight: 10, defaultReps: 12 },
  { id: 'rear_delt_fly', name: 'Pájaros para Deltoides Posterior', category: 'Hombros', defaultWeight: 8, defaultReps: 15 },

  // Brazos
  { id: 'barbell_curl', name: 'Curl de Bíceps con Barra Z', category: 'Brazos', defaultWeight: 30, defaultReps: 10 },
  { id: 'hammer_curl', name: 'Curl Martillo con Mancuernas', category: 'Brazos', defaultWeight: 14, defaultReps: 12 },
  { id: 'incline_db_curl', name: 'Curl en Banco Inclinado', category: 'Brazos', defaultWeight: 12, defaultReps: 10 },
  { id: 'tricep_pushdown', name: 'Extensiones de Tríceps en Polea', category: 'Brazos', defaultWeight: 30, defaultReps: 12 },
  { id: 'skull_crushers', name: 'Press Francés / Rompecráneos', category: 'Brazos', defaultWeight: 28, defaultReps: 10 },
  { id: 'overhead_tricep_ext', name: 'Extensión de Tríceps Sobre Cabeza', category: 'Brazos', defaultWeight: 24, defaultReps: 12 },

  // Core / Abdomen
  { id: 'plank', name: 'Plancha Abdominal Isometrica', category: 'Core', defaultWeight: 0, defaultReps: 60 },
  { id: 'hanging_leg_raise', name: 'Elevación de Piernas Colgado', category: 'Core', defaultWeight: 0, defaultReps: 15 },
  { id: 'cable_woodchopper', name: 'Woodchopper en Polea', category: 'Core', defaultWeight: 15, defaultReps: 15 },
  { id: 'ab_wheel', name: 'Rueda Abdominal', category: 'Core', defaultWeight: 0, defaultReps: 12 }
];

const WORKOUT_ROUTINES_TEMPLATES = [
  {
    id: 'push_day',
    name: 'Empuje (Pecho, Hombro, Tríceps)',
    icon: '🔥',
    exercises: [
      { name: 'Press de Banca Plano con Barra', category: 'Pecho', sets: [{ weight: 75, reps: 10, completed: false }, { weight: 80, reps: 8, completed: false }, { weight: 80, reps: 8, completed: false }, { weight: 85, reps: 6, completed: false }] },
      { name: 'Press Inclinado con Mancuernas', category: 'Pecho', sets: [{ weight: 26, reps: 10, completed: false }, { weight: 28, reps: 8, completed: false }, { weight: 28, reps: 8, completed: false }] },
      { name: 'Elevaciones Laterales', category: 'Hombros', sets: [{ weight: 12, reps: 15, completed: false }, { weight: 12, reps: 12, completed: false }, { weight: 12, reps: 12, completed: false }, { weight: 10, reps: 15, completed: false }] },
      { name: 'Extensiones de Tríceps en Polea', category: 'Brazos', sets: [{ weight: 30, reps: 12, completed: false }, { weight: 35, reps: 10, completed: false }, { weight: 35, reps: 10, completed: false }] }
    ]
  },
  {
    id: 'pull_day',
    name: 'Tirón (Espalda, Deltoides Post, Bíceps)',
    icon: '⚡',
    exercises: [
      { name: 'Peso Muerto Convencional', category: 'Espalda', sets: [{ weight: 100, reps: 6, completed: false }, { weight: 110, reps: 6, completed: false }, { weight: 120, reps: 5, completed: false }] },
      { name: 'Jalón al Pecho en Polea', category: 'Espalda', sets: [{ weight: 60, reps: 10, completed: false }, { weight: 65, reps: 8, completed: false }, { weight: 65, reps: 8, completed: false }] },
      { name: 'Remo Gironda en Polea Baja', category: 'Espalda', sets: [{ weight: 50, reps: 12, completed: false }, { weight: 55, reps: 10, completed: false }, { weight: 55, reps: 10, completed: false }] },
      { name: 'Face Pull en Polea Alta', category: 'Espalda', sets: [{ weight: 20, reps: 15, completed: false }, { weight: 22.5, reps: 15, completed: false }] },
      { name: 'Curl de Bíceps con Barra Z', category: 'Brazos', sets: [{ weight: 28, reps: 10, completed: false }, { weight: 32, reps: 8, completed: false }, { weight: 32, reps: 8, completed: false }] }
    ]
  },
  {
    id: 'legs_day',
    name: 'Pierna Completa (Glúteo, Isquio, Gemelo)',
    icon: '🦵',
    exercises: [
      { name: 'Sentadilla Trasera con Barra', category: 'Piernas', sets: [{ weight: 80, reps: 10, completed: false }, { weight: 90, reps: 8, completed: false }, { weight: 95, reps: 8, completed: false }, { weight: 100, reps: 6, completed: false }] },
      { name: 'Prensa Inclinada 45°', category: 'Piernas', sets: [{ weight: 160, reps: 12, completed: false }, { weight: 180, reps: 10, completed: false }, { weight: 200, reps: 8, completed: false }] },
      { name: 'Peso Muerto Rumano (Isquios)', category: 'Piernas', sets: [{ weight: 70, reps: 10, completed: false }, { weight: 75, reps: 10, completed: false }, { weight: 80, reps: 8, completed: false }] },
      { name: 'Extensiones de Cuádriceps', category: 'Piernas', sets: [{ weight: 45, reps: 12, completed: false }, { weight: 50, reps: 12, completed: false }] },
      { name: 'Elevación de Talones (Gemelos)', category: 'Piernas', sets: [{ weight: 50, reps: 15, completed: false }, { weight: 55, reps: 15, completed: false }] }
    ]
  },
  {
    id: 'full_body',
    name: 'Full Body Express (Todo el cuerpo)',
    icon: '💥',
    exercises: [
      { name: 'Press de Banca Plano con Barra', category: 'Pecho', sets: [{ weight: 70, reps: 10, completed: false }, { weight: 75, reps: 8, completed: false }, { weight: 75, reps: 8, completed: false }] },
      { name: 'Sentadilla Trasera con Barra', category: 'Piernas', sets: [{ weight: 85, reps: 8, completed: false }, { weight: 90, reps: 8, completed: false }, { weight: 95, reps: 6, completed: false }] },
      { name: 'Dominadas Pronas / Neutras', category: 'Espalda', sets: [{ weight: 0, reps: 8, completed: false }, { weight: 0, reps: 8, completed: false }, { weight: 0, reps: 6, completed: false }] },
      { name: 'Press Militar con Barra', category: 'Hombros', sets: [{ weight: 40, reps: 10, completed: false }, { weight: 45, reps: 8, completed: false }] }
    ]
  }
];

/**
 * BIBLIOTECA DE REFERENCIA NUTRICIONAL COMPLETA (Valores por 100g)
 * Fuentes: BEDCA (Base Española de Datos de Composición de Alimentos), USDA FoodData Central
 */
const NUTRITION_REFERENCE_DB = [
  // ═══════════════════════════════════════════════
  // CARNES & AVES
  // ═══════════════════════════════════════════════
  { id: 'ref_1', name: 'Pechuga de Pollo (Limpia, cruda)', category: 'Carnes & Aves', icon: '🍗', kcal: 120, protein: 24.5, carbs: 0, fat: 2.1, fiber: 0, note: 'Proteína magra por excelencia, altísima biodisponibilidad' },
  { id: 'ref_2', name: 'Pechuga de Pavo', category: 'Carnes & Aves', icon: '🦃', kcal: 105, protein: 24.0, carbs: 0, fat: 1.0, fiber: 0, note: 'Muy baja en grasa, ideal para definición' },
  { id: 'ref_3', name: 'Ternera Magra / Solomillo', category: 'Carnes & Aves', icon: '🥩', kcal: 135, protein: 22.0, carbs: 0, fat: 4.8, fiber: 0, note: 'Rica en hierro hemo, creatina natural y zinc' },
  { id: 'ref_4', name: 'Carne Picada Vacuno 95/5', category: 'Carnes & Aves', icon: '🥩', kcal: 137, protein: 21.5, carbs: 0, fat: 5.0, fiber: 0, note: 'Excelente relación proteína/grasa' },
  { id: 'ref_5', name: 'Lomo de Cerdo Blanco', category: 'Carnes & Aves', icon: '🥓', kcal: 145, protein: 22.5, carbs: 0, fat: 5.8, fiber: 0, note: 'Carne blanca muy magra y rica en tiamina (B1)' },
  { id: 'ref_6', name: 'Muslo de Pollo (sin piel)', category: 'Carnes & Aves', icon: '🍗', kcal: 160, protein: 19.5, carbs: 0, fat: 8.5, fiber: 0, note: 'Más jugosa, con mayor contenido de micronutrientes' },
  { id: 'ref_45', name: 'Conejo (Carne limpia)', category: 'Carnes & Aves', icon: '🐇', kcal: 131, protein: 22.0, carbs: 0, fat: 4.5, fiber: 0, note: 'Carne magra rica en B12 y fósforo, muy digestiva' },
  { id: 'ref_46', name: 'Jamón Serrano (Curado)', category: 'Carnes & Aves', icon: '🍖', kcal: 241, protein: 31.0, carbs: 0, fat: 13.0, fiber: 0, note: 'Alto en proteína y sodio, ácido oleico si es ibérico' },
  { id: 'ref_47', name: 'Pavo Fileteado (Fiambre)', category: 'Carnes & Aves', icon: '🦃', kcal: 105, protein: 18.5, carbs: 1.5, fat: 2.8, fiber: 0, note: 'Proteína rápida para bocadillos y wraps' },
  { id: 'ref_48', name: 'Hamburguesa Ternera 90/10', category: 'Carnes & Aves', icon: '🍔', kcal: 176, protein: 20.0, carbs: 0, fat: 10.0, fiber: 0, note: '10% grasa, sabor intenso y buena proteína' },
  { id: 'ref_49', name: 'Costillas de Cerdo', category: 'Carnes & Aves', icon: '🍖', kcal: 277, protein: 19.0, carbs: 0, fat: 22.0, fiber: 0, note: 'Más calóricas pero ricas en sabor y zinc' },

  // ═══════════════════════════════════════════════
  // PESCADOS & MARISCOS
  // ═══════════════════════════════════════════════
  { id: 'ref_7', name: 'Salmón Fresco Noruego', category: 'Pescados & Mariscos', icon: '🐟', kcal: 208, protein: 20.4, carbs: 0, fat: 13.5, fiber: 0, note: 'Fuente superior de ácidos grasos Omega-3 (EPA/DHA)' },
  { id: 'ref_8', name: 'Atún al Natural (Lata escurrida)', category: 'Pescados & Mariscos', icon: '🥫', kcal: 102, protein: 24.0, carbs: 0, fat: 0.8, fiber: 0, note: 'Proteína portátil inmediata, prácticamente cero grasa' },
  { id: 'ref_9', name: 'Merluza o Bacalao Fresco', category: 'Pescados & Mariscos', icon: '🐟', kcal: 82, protein: 17.5, carbs: 0, fat: 0.8, fiber: 0, note: 'Pescado blanco ultra magro, digestión ligera' },
  { id: 'ref_10', name: 'Gambas / Langostinos', category: 'Pescados & Mariscos', icon: '🦐', kcal: 92, protein: 21.0, carbs: 0.5, fat: 1.2, fiber: 0, note: 'Casi pura proteína con alta densidad de selenio' },
  { id: 'ref_11', name: 'Sardinas / Caballa', category: 'Pescados & Mariscos', icon: '🐟', kcal: 210, protein: 20.0, carbs: 0, fat: 14.0, fiber: 0, note: 'Altísimo en Omega-3, calcio y vitamina D' },
  { id: 'ref_50', name: 'Dorada (Fresca)', category: 'Pescados & Mariscos', icon: '🐟', kcal: 96, protein: 20.0, carbs: 0, fat: 1.5, fiber: 0, note: 'Pescado blanco al horno, sabor suave y muy magro' },
  { id: 'ref_51', name: 'Lubina (Fresca)', category: 'Pescados & Mariscos', icon: '🐟', kcal: 97, protein: 18.0, carbs: 0, fat: 2.5, fiber: 0, note: 'Pescado semigraso rico en B6 y fósforo' },
  { id: 'ref_52', name: 'Pulpo Cocido', category: 'Pescados & Mariscos', icon: '🐙', kcal: 82, protein: 15.0, carbs: 2.2, fat: 1.0, fiber: 0, note: 'Muy bajo en grasa, alto en hierro y vitamina B12' },
  { id: 'ref_53', name: 'Mejillones al Vapor', category: 'Pescados & Mariscos', icon: '🦪', kcal: 86, protein: 12.0, carbs: 3.7, fat: 2.2, fiber: 0, note: 'Ricos en hierro, zinc y vitamina B12' },
  { id: 'ref_54', name: 'Trucha', category: 'Pescados & Mariscos', icon: '🐟', kcal: 119, protein: 20.5, carbs: 0, fat: 3.5, fiber: 0, note: 'Omega-3 de agua dulce, versátil y asequible' },
  { id: 'ref_55', name: 'Bacalao Desalado', category: 'Pescados & Mariscos', icon: '🐟', kcal: 78, protein: 18.0, carbs: 0, fat: 0.6, fiber: 0, note: 'Ideal para guisos y platos tradicionales' },

  // ═══════════════════════════════════════════════
  // HUEVOS & LÁCTEOS
  // ═══════════════════════════════════════════════
  { id: 'ref_12', name: 'Huevo Entero (Grande)', category: 'Huevos & Lácteos', icon: '🥚', kcal: 145, protein: 13.0, carbs: 1.0, fat: 10.5, fiber: 0, note: 'Valor biológico 100, colina para el cerebro' },
  { id: 'ref_13', name: 'Claras de Huevo Pasteurizadas', category: 'Huevos & Lácteos', icon: '🍳', kcal: 50, protein: 11.0, carbs: 0.7, fat: 0.2, fiber: 0, note: 'Proteína pura sin grasa ni colesterol' },
  { id: 'ref_14', name: 'Yogur Griego 0% Natural', category: 'Huevos & Lácteos', icon: '🥣', kcal: 58, protein: 10.2, carbs: 3.8, fat: 0.1, fiber: 0, note: 'Rico en caseína de absorción lenta y probióticos' },
  { id: 'ref_15', name: 'Queso Fresco Batido 0%', category: 'Huevos & Lácteos', icon: '🧀', kcal: 47, protein: 8.5, carbs: 3.5, fat: 0.1, fiber: 0, note: 'Muy versátil para mezclar con proteína o fruta' },
  { id: 'ref_16', name: 'Queso Cottage Desnatado', category: 'Huevos & Lácteos', icon: '🧀', kcal: 72, protein: 12.0, carbs: 3.0, fat: 1.0, fiber: 0, note: 'Rico en aminoácidos esenciales, ideal para la cena' },
  { id: 'ref_17', name: 'Leche Desnatada', category: 'Huevos & Lácteos', icon: '🥛', kcal: 35, protein: 3.4, carbs: 4.8, fat: 0.1, fiber: 0, note: 'Hidratación óptima post-entrenamiento' },
  { id: 'ref_56', name: 'Mozzarella Fresca', category: 'Huevos & Lácteos', icon: '🧀', kcal: 280, protein: 22.0, carbs: 2.2, fat: 20.0, fiber: 0, note: 'Perfecta para ensaladas caprese y pizzas caseras' },
  { id: 'ref_57', name: 'Queso Curado Manchego', category: 'Huevos & Lácteos', icon: '🧀', kcal: 390, protein: 26.0, carbs: 0.5, fat: 32.0, fiber: 0, note: 'Muy denso en calorías y calcio, usar con moderación' },
  { id: 'ref_58', name: 'Ricotta Desnatada', category: 'Huevos & Lácteos', icon: '🧀', kcal: 138, protein: 11.0, carbs: 3.0, fat: 8.0, fiber: 0, note: 'Ideal para postres fitness y rellenos' },
  { id: 'ref_59', name: 'Kéfir Natural', category: 'Huevos & Lácteos', icon: '🥛', kcal: 63, protein: 3.5, carbs: 4.7, fat: 3.5, fiber: 0, note: 'Probióticos vivos para salud intestinal' },
  { id: 'ref_60', name: 'Leche Entera', category: 'Huevos & Lácteos', icon: '🥛', kcal: 63, protein: 3.2, carbs: 4.7, fat: 3.5, fiber: 0, note: 'Más calórica pero mayor saciedad y absorción de vitaminas' },

  // ═══════════════════════════════════════════════
  // CEREALES & GRANOS
  // ═══════════════════════════════════════════════
  { id: 'ref_18', name: 'Copos de Avena Integral', category: 'Cereales & Granos', icon: '🌾', kcal: 375, protein: 13.5, carbs: 62.0, fat: 7.0, fiber: 10.0, note: 'Beta-glucanos saciantes y energía sostenida' },
  { id: 'ref_19', name: 'Arroz Blanco (Cocido)', category: 'Cereales & Granos', icon: '🍚', kcal: 130, protein: 2.7, carbs: 28.5, fat: 0.3, fiber: 0.4, note: 'Digestión ultrarrápida perfecta para pre/post entreno' },
  { id: 'ref_20', name: 'Arroz Basmati / Jazmín (Crudo)', category: 'Cereales & Granos', icon: '🍚', kcal: 355, protein: 7.5, carbs: 78.0, fat: 0.8, fiber: 1.5, note: 'Menor índice glucémico y aroma característico' },
  { id: 'ref_21', name: 'Pasta Integral (Cocida)', category: 'Cereales & Granos', icon: '🍝', kcal: 140, protein: 5.5, carbs: 27.0, fat: 1.1, fiber: 4.0, note: 'Carbohidratos complejos de liberación lenta' },
  { id: 'ref_22', name: 'Pan 100% Integral de Centeno', category: 'Cereales & Granos', icon: '🍞', kcal: 240, protein: 8.5, carbs: 45.0, fat: 1.8, fiber: 7.0, note: 'Gran poder saciante y densidad de minerales' },
  { id: 'ref_23', name: 'Quinoa Real (Cocida)', category: 'Cereales & Granos', icon: '🌾', kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, note: 'Pseudocereal con perfil completo de aminoácidos' },
  { id: 'ref_61', name: 'Arroz Integral (Cocido)', category: 'Cereales & Granos', icon: '🍚', kcal: 123, protein: 2.7, carbs: 25.6, fat: 1.0, fiber: 1.8, note: 'Más fibra y minerales que el arroz blanco' },
  { id: 'ref_62', name: 'Cuscús (Cocido)', category: 'Cereales & Granos', icon: '🌾', kcal: 112, protein: 3.8, carbs: 23.0, fat: 0.2, fiber: 1.4, note: 'Versátil y rápido de preparar, ideal con verduras' },
  { id: 'ref_63', name: 'Tortilla de Trigo (Wrap)', category: 'Cereales & Granos', icon: '🌯', kcal: 312, protein: 8.5, carbs: 52.0, fat: 8.0, fiber: 2.1, note: 'Base perfecta para wraps y burritos fitness' },
  { id: 'ref_64', name: 'Pan de Molde Integral', category: 'Cereales & Granos', icon: '🍞', kcal: 250, protein: 9.0, carbs: 43.0, fat: 3.5, fiber: 5.0, note: 'Cómodo para tostadas y sándwiches' },
  { id: 'ref_65', name: 'Pasta Espaguetis (Cruda)', category: 'Cereales & Granos', icon: '🍝', kcal: 352, protein: 12.5, carbs: 72.0, fat: 1.5, fiber: 3.0, note: 'Referencia en crudo; cocida pesa ~2.2× más' },
  { id: 'ref_66', name: 'Muesli Sin Azúcar', category: 'Cereales & Granos', icon: '🥣', kcal: 365, protein: 10.0, carbs: 62.0, fat: 8.0, fiber: 8.5, note: 'Mezcla de avena, frutos secos y semillas' },

  // ═══════════════════════════════════════════════
  // TUBÉRCULOS & VERDURAS
  // ═══════════════════════════════════════════════
  { id: 'ref_24', name: 'Patata Cocida / al Horno', category: 'Tubérculos & Verduras', icon: '🥔', kcal: 86, protein: 2.0, carbs: 20.0, fat: 0.1, fiber: 2.1, note: 'El alimento con mayor índice de saciedad comprobado' },
  { id: 'ref_25', name: 'Boniato / Batata Dulce', category: 'Tubérculos & Verduras', icon: '🍠', kcal: 88, protein: 1.8, carbs: 20.5, fat: 0.2, fiber: 3.0, note: 'Rico en beta-carotenos y carbohidratos de calidad' },
  { id: 'ref_26', name: 'Brócoli', category: 'Tubérculos & Verduras', icon: '🥦', kcal: 34, protein: 2.8, carbs: 4.0, fat: 0.4, fiber: 3.0, note: 'Contiene sulforafano, alta densidad de micronutrientes' },
  { id: 'ref_27', name: 'Espinacas Frescas', category: 'Tubérculos & Verduras', icon: '🥬', kcal: 23, protein: 2.9, carbs: 1.4, fat: 0.4, fiber: 2.2, note: 'Ricas en nitratos que favorecen la oxigenación muscular' },
  { id: 'ref_28', name: 'Espárragos Verdes', category: 'Tubérculos & Verduras', icon: '🌱', kcal: 20, protein: 2.2, carbs: 2.0, fat: 0.2, fiber: 1.8, note: 'Diurético natural, fósforo y ácido fólico' },
  { id: 'ref_67', name: 'Calabacín', category: 'Tubérculos & Verduras', icon: '🥒', kcal: 17, protein: 1.2, carbs: 2.0, fat: 0.3, fiber: 1.0, note: 'Ultra bajo en calorías, perfecto como base de platos' },
  { id: 'ref_68', name: 'Pimiento Rojo', category: 'Tubérculos & Verduras', icon: '🌶️', kcal: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1, note: 'Más vitamina C que la naranja, antioxidante potente' },
  { id: 'ref_69', name: 'Tomate Natural', category: 'Tubérculos & Verduras', icon: '🍅', kcal: 18, protein: 0.9, carbs: 3.5, fat: 0.2, fiber: 1.2, note: 'Licopeno antioxidante, base de salsas y ensaladas' },
  { id: 'ref_70', name: 'Cebolla', category: 'Tubérculos & Verduras', icon: '🧅', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, note: 'Quercetina antiinflamatoria, base de sofritos' },
  { id: 'ref_71', name: 'Zanahoria', category: 'Tubérculos & Verduras', icon: '🥕', kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, note: 'Beta-carotenos para la vista y la piel' },
  { id: 'ref_72', name: 'Judías Verdes', category: 'Tubérculos & Verduras', icon: '🫛', kcal: 31, protein: 1.8, carbs: 5.0, fat: 0.1, fiber: 2.7, note: 'Guarnición ligera rica en fibra y ácido fólico' },
  { id: 'ref_73', name: 'Champiñones / Setas', category: 'Tubérculos & Verduras', icon: '🍄', kcal: 22, protein: 3.1, carbs: 0.5, fat: 0.3, fiber: 1.0, note: 'Vitamina D y umami natural, casi cero calorías' },
  { id: 'ref_74', name: 'Lechuga Romana', category: 'Tubérculos & Verduras', icon: '🥬', kcal: 17, protein: 1.2, carbs: 2.0, fat: 0.3, fiber: 2.1, note: 'Base de ensaladas con volumen y mínimas calorías' },
  { id: 'ref_75', name: 'Pepino', category: 'Tubérculos & Verduras', icon: '🥒', kcal: 15, protein: 0.7, carbs: 2.2, fat: 0.1, fiber: 0.5, note: 'Hidratante natural (96% agua), ultra bajo en calorías' },
  { id: 'ref_76', name: 'Berenjena', category: 'Tubérculos & Verduras', icon: '🍆', kcal: 25, protein: 1.0, carbs: 3.5, fat: 0.2, fiber: 3.0, note: 'Fibra saciante, absorbe sabores de salsas y especias' },
  { id: 'ref_77', name: 'Coliflor', category: 'Tubérculos & Verduras', icon: '🥦', kcal: 25, protein: 1.9, carbs: 3.0, fat: 0.3, fiber: 2.0, note: 'Sustituto low-carb del arroz y la masa de pizza' },
  { id: 'ref_78', name: 'Acelgas', category: 'Tubérculos & Verduras', icon: '🥬', kcal: 19, protein: 1.8, carbs: 2.1, fat: 0.2, fiber: 1.6, note: 'Ricas en hierro, magnesio y vitamina K' },
  { id: 'ref_79', name: 'Ajo (Crudo)', category: 'Tubérculos & Verduras', icon: '🧄', kcal: 149, protein: 6.4, carbs: 33.0, fat: 0.5, fiber: 2.1, note: 'Alicina antimicrobiana, se usa en pequeñas cantidades' },

  // ═══════════════════════════════════════════════
  // LEGUMBRES
  // ═══════════════════════════════════════════════
  { id: 'ref_29', name: 'Lentejas Cocidas', category: 'Legumbres', icon: '🍲', kcal: 116, protein: 9.0, carbs: 20.0, fat: 0.4, fiber: 7.9, note: 'Excelente fuente de fibra soluble y hierro no hemo' },
  { id: 'ref_30', name: 'Garbanzos Cocidos', category: 'Legumbres', icon: '🧆', kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, note: 'Carbohidratos limpios con buen aporte proteico' },
  { id: 'ref_31', name: 'Edamame (Soja tierna)', category: 'Legumbres', icon: '🫛', kcal: 122, protein: 11.9, carbs: 8.9, fat: 5.2, fiber: 5.2, note: 'Proteína vegetal completa con todos los aminoácidos' },
  { id: 'ref_80', name: 'Alubias / Judías Blancas (Cocidas)', category: 'Legumbres', icon: '🫘', kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 6.3, note: 'Saciantes y ricas en potasio y magnesio' },
  { id: 'ref_81', name: 'Guisantes (Cocidos)', category: 'Legumbres', icon: '🫛', kcal: 81, protein: 5.4, carbs: 14.5, fat: 0.4, fiber: 5.1, note: 'Buen aporte de proteína vegetal y fibra' },
  { id: 'ref_82', name: 'Tofu Firme', category: 'Legumbres', icon: '🧈', kcal: 76, protein: 8.0, carbs: 1.9, fat: 4.2, fiber: 0.3, note: 'Proteína de soja completa, versátil en cocina' },
  { id: 'ref_83', name: 'Soja Texturizada (Seca)', category: 'Legumbres', icon: '🫘', kcal: 340, protein: 50.0, carbs: 30.0, fat: 1.5, fiber: 18.0, note: 'Sustituto de carne con perfil proteico altísimo' },
  { id: 'ref_84', name: 'Hummus Clásico', category: 'Legumbres', icon: '🧆', kcal: 166, protein: 7.9, carbs: 14.3, fat: 9.6, fiber: 6.0, note: 'Garbanzos + tahini, grasas saludables y fibra' },

  // ═══════════════════════════════════════════════
  // FRUTAS
  // ═══════════════════════════════════════════════
  { id: 'ref_32', name: 'Plátano Maduro', category: 'Frutas', icon: '🍌', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, note: 'Potasio y glucógeno rápido para antes o después de entrenar' },
  { id: 'ref_33', name: 'Manzana con Piel', category: 'Frutas', icon: '🍎', kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, note: 'Pectina saciante, polifenoles y bajo aporte calórico' },
  { id: 'ref_34', name: 'Arándanos Frescos', category: 'Frutas', icon: '🫐', kcal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, note: 'Potente antioxidante que reduce el daño oxidativo muscular' },
  { id: 'ref_35', name: 'Fresas / Frutillas', category: 'Frutas', icon: '🍓', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0, note: 'Gran volumen y saciedad con mínimas calorías' },
  { id: 'ref_36', name: 'Naranja Fresca', category: 'Frutas', icon: '🍊', kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, note: 'Vitamina C que potencia la síntesis de colágeno' },
  { id: 'ref_85', name: 'Kiwi', category: 'Frutas', icon: '🥝', kcal: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3.0, note: 'Más vitamina C que la naranja, enzima actinidina digestiva' },
  { id: 'ref_86', name: 'Uvas', category: 'Frutas', icon: '🍇', kcal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, note: 'Azúcares rápidos y resveratrol antioxidante' },
  { id: 'ref_87', name: 'Piña Tropical', category: 'Frutas', icon: '🍍', kcal: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4, note: 'Bromelina digestiva y refrescante post-entreno' },
  { id: 'ref_88', name: 'Sandía', category: 'Frutas', icon: '🍉', kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, note: 'Ultra hidratante (92% agua), citrulina para vasodilatación' },
  { id: 'ref_89', name: 'Mango', category: 'Frutas', icon: '🥭', kcal: 60, protein: 0.8, carbs: 15.0, fat: 0.4, fiber: 1.6, note: 'Vitamina A y C, perfecto para smoothies tropicales' },
  { id: 'ref_90', name: 'Pera', category: 'Frutas', icon: '🍐', kcal: 57, protein: 0.4, carbs: 15.2, fat: 0.1, fiber: 3.1, note: 'Alta en fibra soluble y sorbitol digestivo' },
  { id: 'ref_91', name: 'Melocotón', category: 'Frutas', icon: '🍑', kcal: 39, protein: 0.9, carbs: 9.5, fat: 0.3, fiber: 1.5, note: 'Bajo en calorías, rico en vitamina A y potasio' },
  { id: 'ref_92', name: 'Dátiles Medjool', category: 'Frutas', icon: '🌴', kcal: 277, protein: 1.8, carbs: 75.0, fat: 0.2, fiber: 6.7, note: 'Endulzante natural denso en energía, ideal pre-entreno' },

  // ═══════════════════════════════════════════════
  // GRASAS SALUDABLES & FRUTOS SECOS
  // ═══════════════════════════════════════════════
  { id: 'ref_37', name: 'Aceite de Oliva Virgen Extra (AOVE)', category: 'Grasas Saludables', icon: '🫒', kcal: 884, protein: 0, carbs: 0, fat: 100.0, fiber: 0, note: 'Grasa monoinsaturada cardiosaludable (ácido oleico)' },
  { id: 'ref_38', name: 'Aguacate Hass', category: 'Grasas Saludables', icon: '🥑', kcal: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7, note: 'Grasas monoinsaturadas y altísimo contenido de potasio' },
  { id: 'ref_39', name: 'Nueces de California', category: 'Grasas Saludables', icon: '🥜', kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, note: 'El fruto seco con mayor concentración de Omega-3 vegetal (ALA)' },
  { id: 'ref_40', name: 'Almendras Naturales', category: 'Grasas Saludables', icon: '🌰', kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, note: 'Ricas en vitamina E antioxidante y magnesio' },
  { id: 'ref_41', name: 'Crema de Cacahuete 100% (Sin azúcar)', category: 'Grasas Saludables', icon: '🥜', kcal: 588, protein: 25.0, carbs: 20.0, fat: 50.0, fiber: 8.0, note: 'Densidad energética limpia y grasas de calidad' },
  { id: 'ref_93', name: 'Anacardos', category: 'Grasas Saludables', icon: '🥜', kcal: 553, protein: 18.2, carbs: 30.2, fat: 43.9, fiber: 3.3, note: 'Más carbohidratos que otros frutos secos, magnesio y zinc' },
  { id: 'ref_94', name: 'Pistachos (Sin cáscara)', category: 'Grasas Saludables', icon: '🥜', kcal: 560, protein: 20.0, carbs: 27.0, fat: 45.0, fiber: 10.6, note: 'Ricos en luteína para la vista y fibra' },
  { id: 'ref_95', name: 'Avellanas', category: 'Grasas Saludables', icon: '🌰', kcal: 628, protein: 15.0, carbs: 17.0, fat: 61.0, fiber: 9.7, note: 'Ácido oleico similar al aceite de oliva' },
  { id: 'ref_96', name: 'Pipas de Girasol (Peladas)', category: 'Grasas Saludables', icon: '🌻', kcal: 584, protein: 20.8, carbs: 20.0, fat: 51.5, fiber: 8.6, note: 'Ricas en vitamina E, selenio y magnesio' },
  { id: 'ref_97', name: 'Semillas de Chía', category: 'Grasas Saludables', icon: '🫘', kcal: 486, protein: 16.5, carbs: 42.0, fat: 31.0, fiber: 34.4, note: 'Fibra extrema, Omega-3 vegetal y efecto gel hidratante' },
  { id: 'ref_98', name: 'Semillas de Lino (Molidas)', category: 'Grasas Saludables', icon: '🫘', kcal: 534, protein: 18.3, carbs: 29.0, fat: 42.2, fiber: 27.3, note: 'Lignanos y ALA Omega-3, moler para absorción' },
  { id: 'ref_99', name: 'Coco Rallado (Deshidratado)', category: 'Grasas Saludables', icon: '🥥', kcal: 660, protein: 6.9, carbs: 23.6, fat: 64.5, fiber: 16.3, note: 'Triglicéridos de cadena media (MCT), muy calórico' },

  // ═══════════════════════════════════════════════
  // CONDIMENTOS & SALSAS
  // ═══════════════════════════════════════════════
  { id: 'ref_100', name: 'Miel Natural', category: 'Condimentos & Salsas', icon: '🍯', kcal: 304, protein: 0.3, carbs: 82.0, fat: 0, fiber: 0.2, note: 'Azúcares simples naturales, ideal pre-entreno en pequeñas dosis' },
  { id: 'ref_101', name: 'Mermelada (Sin azúcar añadido)', category: 'Condimentos & Salsas', icon: '🍓', kcal: 130, protein: 0.4, carbs: 30.0, fat: 0.1, fiber: 1.0, note: 'Endulzada con edulcorantes, para tostadas fitness' },
  { id: 'ref_102', name: 'Salsa de Tomate (Casera/Natural)', category: 'Condimentos & Salsas', icon: '🍅', kcal: 32, protein: 1.2, carbs: 5.5, fat: 0.5, fiber: 1.0, note: 'Base de guisos y pastas, licopeno biodisponible al cocinar' },
  { id: 'ref_103', name: 'Ketchup', category: 'Condimentos & Salsas', icon: '🍅', kcal: 112, protein: 1.0, carbs: 27.0, fat: 0.1, fiber: 0.3, note: 'Contiene azúcar añadido, usar con moderación' },
  { id: 'ref_104', name: 'Mostaza Dijon', category: 'Condimentos & Salsas', icon: '🌭', kcal: 66, protein: 4.0, carbs: 5.5, fat: 3.3, fiber: 3.2, note: 'Prácticamente cero calorías por ración (5g)' },
  { id: 'ref_105', name: 'Salsa de Soja (Baja en sal)', category: 'Condimentos & Salsas', icon: '🥢', kcal: 53, protein: 8.1, carbs: 4.9, fat: 0.1, fiber: 0.8, note: 'Umami intenso, usar 10-15ml por plato' },
  { id: 'ref_106', name: 'Vinagre Balsámico', category: 'Condimentos & Salsas', icon: '🫗', kcal: 88, protein: 0.5, carbs: 17.0, fat: 0, fiber: 0, note: 'Ácido acético para aliños y marinados' },

  // ═══════════════════════════════════════════════
  // BEBIDAS VEGETALES
  // ═══════════════════════════════════════════════
  { id: 'ref_107', name: 'Leche de Avena (Sin azúcar)', category: 'Bebidas Vegetales', icon: '🥛', kcal: 44, protein: 1.0, carbs: 6.5, fat: 1.5, fiber: 0.8, note: 'Cremosa y versátil, beta-glucanos de la avena' },
  { id: 'ref_108', name: 'Leche de Almendras (Sin azúcar)', category: 'Bebidas Vegetales', icon: '🥛', kcal: 15, protein: 0.5, carbs: 0.3, fat: 1.1, fiber: 0.2, note: 'Ultra baja en calorías, ideal para batidos de definición' },
  { id: 'ref_109', name: 'Leche de Soja (Sin azúcar)', category: 'Bebidas Vegetales', icon: '🥛', kcal: 33, protein: 3.3, carbs: 0.5, fat: 1.8, fiber: 0.5, note: 'La más proteica de las vegetales, perfil completo' },
  { id: 'ref_110', name: 'Bebida de Arroz', category: 'Bebidas Vegetales', icon: '🥛', kcal: 47, protein: 0.3, carbs: 9.2, fat: 1.0, fiber: 0.1, note: 'Sabor neutro y dulce, alta en carbohidratos' },

  // ═══════════════════════════════════════════════
  // SNACKS FITNESS
  // ═══════════════════════════════════════════════
  { id: 'ref_111', name: 'Chocolate Negro 85%', category: 'Snacks Fitness', icon: '🍫', kcal: 580, protein: 10.0, carbs: 30.0, fat: 46.0, fiber: 12.0, note: 'Flavonoides y magnesio, 20g = snack perfecto post-cena' },
  { id: 'ref_112', name: 'Tortitas de Arroz', category: 'Snacks Fitness', icon: '🍘', kcal: 387, protein: 7.0, carbs: 83.0, fat: 2.8, fiber: 3.3, note: 'Snack crujiente bajo en grasa, combina con topping' },
  { id: 'ref_113', name: 'Palomitas de Maíz (Sin aceite)', category: 'Snacks Fitness', icon: '🍿', kcal: 375, protein: 11.0, carbs: 74.0, fat: 4.3, fiber: 14.5, note: 'Grano entero con volumen enorme por ración (30g = un bol)' },

  // ═══════════════════════════════════════════════
  // SUPLEMENTOS FITNESS
  // ═══════════════════════════════════════════════
  { id: 'ref_42', name: 'Proteína Whey Isolate (Aislada)', category: 'Suplementos', icon: '🥤', kcal: 375, protein: 86.0, carbs: 2.5, fat: 1.5, fiber: 0, note: 'Absorción ultrasónica, máxima pureza de aminoácidos (BCAAs)' },
  { id: 'ref_43', name: 'Proteína Caseína Micelar', category: 'Suplementos', icon: '🥛', kcal: 360, protein: 80.0, carbs: 4.0, fat: 1.8, fiber: 0, note: 'Liberación lenta durante el descanso nocturno (antikatabólica)' },
  { id: 'ref_44', name: 'Barrita Proteica (media típica)', category: 'Suplementos', icon: '🍫', kcal: 350, protein: 33.0, carbs: 30.0, fat: 11.0, fiber: 12.0, note: 'Snack cómodo para viajes o pre/post entrenamiento' },
  { id: 'ref_114', name: 'Creatina Monohidrato', category: 'Suplementos', icon: '💊', kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, note: '5g/día para fuerza y volumen muscular, sin calorías' },
  { id: 'ref_115', name: 'Harina de Avena Sabor', category: 'Suplementos', icon: '🌾', kcal: 360, protein: 12.0, carbs: 65.0, fat: 6.0, fiber: 8.0, note: 'Avena micronizada con sabor, ideal para batidos de volumen' }
];

window.EXERCISES_DATABASE = EXERCISES_DATABASE;
window.WORKOUT_ROUTINES_TEMPLATES = WORKOUT_ROUTINES_TEMPLATES;
window.NUTRITION_REFERENCE_DB = NUTRITION_REFERENCE_DB;
