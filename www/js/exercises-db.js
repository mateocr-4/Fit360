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
 */
const NUTRITION_REFERENCE_DB = [
  // --- CARNES & AVES ---
  { id: 'ref_1', name: 'Pechuga de Pollo (Limpia, cruda)', category: 'Carnes & Aves', icon: '🍗', kcal: 120, protein: 24.5, carbs: 0, fat: 2.1, fiber: 0, note: 'Proteína magra por excelencia, altísima biodisponibilidad' },
  { id: 'ref_2', name: 'Pechuga de Pavo', category: 'Carnes & Aves', icon: '🦃', kcal: 105, protein: 24.0, carbs: 0, fat: 1.0, fiber: 0, note: 'Muy baja en grasa, ideal para definición' },
  { id: 'ref_3', name: 'Ternera Magra / Solomillo', category: 'Carnes & Aves', icon: '🥩', kcal: 135, protein: 22.0, carbs: 0, fat: 4.8, fiber: 0, note: 'Rica en hierro hemo, creatina natural y zinc' },
  { id: 'ref_4', name: 'Carne Picada Vacuno 95/5', category: 'Carnes & Aves', icon: '🥩', kcal: 137, protein: 21.5, carbs: 0, fat: 5.0, fiber: 0, note: 'Excelente relación proteína/grasa' },
  { id: 'ref_5', name: 'Lomo de Cerdo Blanco', category: 'Carnes & Aves', icon: '🥓', kcal: 145, protein: 22.5, carbs: 0, fat: 5.8, fiber: 0, note: 'Carne blanca muy magra y rica en tiamina (B1)' },
  { id: 'ref_6', name: 'Muslo de Pollo (sin piel)', category: 'Carnes & Aves', icon: '🍗', kcal: 160, protein: 19.5, carbs: 0, fat: 8.5, fiber: 0, note: 'Más jugosa, con mayor contenido de micronutrientes' },

  // --- PESCADOS & MARISCOS ---
  { id: 'ref_7', name: 'Salmón Fresco Noruego', category: 'Pescados & Mariscos', icon: '🐟', kcal: 208, protein: 20.4, carbs: 0, fat: 13.5, fiber: 0, note: 'Fuente superior de ácidos grasos Omega-3 (EPA/DHA)' },
  { id: 'ref_8', name: 'Atún al Natural (Lata escurrida)', category: 'Pescados & Mariscos', icon: '🥫', kcal: 102, protein: 24.0, carbs: 0, fat: 0.8, fiber: 0, note: 'Proteína portátil inmediata, prácticamente cero grasa' },
  { id: 'ref_9', name: 'Merluza o Bacalao Fresco', category: 'Pescados & Mariscos', icon: '🐟', kcal: 82, protein: 17.5, carbs: 0, fat: 0.8, fiber: 0, note: 'Pescado blanco ultra magro, digestión ligera' },
  { id: 'ref_10', name: 'Gambas / Langostinos', category: 'Pescados & Mariscos', icon: '🦐', kcal: 92, protein: 21.0, carbs: 0.5, fat: 1.2, fiber: 0, note: 'Casi pura proteína con alta densidad de selenio' },
  { id: 'ref_11', name: 'Sardinas / Caballa', category: 'Pescados & Mariscos', icon: '🐟', kcal: 210, protein: 20.0, carbs: 0, fat: 14.0, fiber: 0, note: 'Altísimo en Omega-3, calcio y vitamina D' },

  // --- HUEVOS & LÁCTEOS ---
  { id: 'ref_12', name: 'Huevo Entero (Grande)', category: 'Huevos & Lácteos', icon: '🥚', kcal: 145, protein: 13.0, carbs: 1.0, fat: 10.5, fiber: 0, note: 'Valor biológico 100, colina para el cerebro' },
  { id: 'ref_13', name: 'Claras de Huevo Pasteurisadas', category: 'Huevos & Lácteos', icon: '🍳', kcal: 50, protein: 11.0, carbs: 0.7, fat: 0.2, fiber: 0, note: 'Proteína pura sin grasa ni colesterol' },
  { id: 'ref_14', name: 'Yogur Griego 0% Natural', category: 'Huevos & Lácteos', icon: '🥣', kcal: 58, protein: 10.2, carbs: 3.8, fat: 0.1, fiber: 0, note: 'Rico en caseína de absorción lenta y probióticos' },
  { id: 'ref_15', name: 'Queso Fresco Batido 0%', category: 'Huevos & Lácteos', icon: '🧀', kcal: 47, protein: 8.5, carbs: 3.5, fat: 0.1, fiber: 0, note: 'Muy versátil para mezclar con proteína o fruta' },
  { id: 'ref_16', name: 'Queso Cottage Desnatado', category: 'Huevos & Lácteos', icon: '🧀', kcal: 72, protein: 12.0, carbs: 3.0, fat: 1.0, fiber: 0, note: 'Rico en aminoácidos esenciales, ideal para la cena' },
  { id: 'ref_17', name: 'Leche Desnatada', category: 'Huevos & Lácteos', icon: '🥛', kcal: 35, protein: 3.4, carbs: 4.8, fat: 0.1, fiber: 0, note: 'Hidratación óptima post-entrenamiento' },

  // --- CEREALES & GRANOS ---
  { id: 'ref_18', name: 'Copos de Avena Integral', category: 'Cereales & Granos', icon: '🌾', kcal: 375, protein: 13.5, carbs: 62.0, fat: 7.0, fiber: 10.0, note: 'Beta-glucanos saciantes y energía sostenida' },
  { id: 'ref_19', name: 'Arroz Blanco (Cocido)', category: 'Cereales & Granos', icon: '🍚', kcal: 130, protein: 2.7, carbs: 28.5, fat: 0.3, fiber: 0.4, note: 'Digestión ultrarrápida perfecta para pre/post entreno' },
  { id: 'ref_20', name: 'Arroz Basmati / Jazmín (Crudo)', category: 'Cereales & Granos', icon: '🍚', kcal: 355, protein: 7.5, carbs: 78.0, fat: 0.8, fiber: 1.5, note: 'Menor índice glucémico y aroma característico' },
  { id: 'ref_21', name: 'Pasta Integral (Cocida)', category: 'Cereales & Granos', icon: '🍝', kcal: 140, protein: 5.5, carbs: 27.0, fat: 1.1, fiber: 4.0, note: 'Carbohidratos complejos de liberación lenta' },
  { id: 'ref_22', name: 'Pan 100% Integral de Centeno', category: 'Cereales & Granos', icon: '🍞', kcal: 240, protein: 8.5, carbs: 45.0, fat: 1.8, fiber: 7.0, note: 'Gran poder saciante y densidad de minerales' },
  { id: 'ref_23', name: 'Quinoa Real (Cocida)', category: 'Cereales & Granos', icon: '🌾', kcal: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, note: 'Pseudocereal con perfil completo de aminoácidos' },

  // --- TUBÉRCULOS & VERDURAS ---
  { id: 'ref_24', name: 'Patata Cocida / al Horno', category: 'Tubérculos & Verduras', icon: '🥔', kcal: 86, protein: 2.0, carbs: 20.0, fat: 0.1, fiber: 2.1, note: 'El alimento con mayor índice de saciedad comprobado' },
  { id: 'ref_25', name: 'Boniato / Batata Dulce', category: 'Tubérculos & Verduras', icon: '🍠', kcal: 88, protein: 1.8, carbs: 20.5, fat: 0.2, fiber: 3.0, note: 'Rico en beta-carotenos y carbohidratos de calidad' },
  { id: 'ref_26', name: 'Brócoli', category: 'Tubérculos & Verduras', icon: '🥦', kcal: 34, protein: 2.8, carbs: 4.0, fat: 0.4, fiber: 3.0, note: 'Contiene sulforafano, alta densidad de micronutrientes' },
  { id: 'ref_27', name: 'Espinacas Frescas', category: 'Tubérculos & Verduras', icon: '🥬', kcal: 23, protein: 2.9, carbs: 1.4, fat: 0.4, fiber: 2.2, note: 'Ricas en nitratos que favorecen la oxigenación muscular' },
  { id: 'ref_28', name: 'Espárragos Verdes', category: 'Tubérculos & Verduras', icon: '🌱', kcal: 20, protein: 2.2, carbs: 2.0, fat: 0.2, fiber: 1.8, note: 'Diurético natural, fósforo y ácido fólico' },

  // --- LEGUMBRES ---
  { id: 'ref_29', name: 'Lentejas Cocidas', category: 'Legumbres', icon: '🍲', kcal: 116, protein: 9.0, carbs: 20.0, fat: 0.4, fiber: 7.9, note: 'Excelente fuente de fibra soluble y hierro no hemo' },
  { id: 'ref_30', name: 'Garbanzos Cocidos', category: 'Legumbres', icon: '🧆', kcal: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, note: 'Carbohidratos limpios con buen aporte proteico' },
  { id: 'ref_31', name: 'Edamame (Soja tierna)', category: 'Legumbres', icon: '🫛', kcal: 122, protein: 11.9, carbs: 8.9, fat: 5.2, fiber: 5.2, note: 'Proteína vegetal completa con todos los aminoácidos' },

  // --- FRUTAS ---
  { id: 'ref_32', name: 'Plátano Maduro', category: 'Frutas', icon: '🍌', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, note: 'Potasio y glucógeno rápido para antes o después de entrenar' },
  { id: 'ref_33', name: 'Manzana con Piel', category: 'Frutas', icon: '🍎', kcal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, note: 'Pectina saciante, polifenoles y bajo aporte calórico' },
  { id: 'ref_34', name: 'Arándanos Frescos', category: 'Frutas', icon: '🫐', kcal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, note: 'Potente antioxidante que reduce el daño oxidativo muscular' },
  { id: 'ref_35', name: 'Fresas / Frutillas', category: 'Frutas', icon: '🍓', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0, note: 'Gran volumen y saciedad con mínimas calorías' },
  { id: 'ref_36', name: 'Naranja Fresca', category: 'Frutas', icon: '🍊', kcal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, note: 'Vitamina C que potencia la síntesis de colágeno' },

  // --- FRUTOS SECOS & GRASAS SALUDABLES ---
  { id: 'ref_37', name: 'Aceite de Oliva Virgen Extra (AOVE)', category: 'Grasas Saludables', icon: '🫒', kcal: 884, protein: 0, carbs: 0, fat: 100.0, fiber: 0, note: 'Grasa monoinsaturada cardiosaludable (ácido oleico)' },
  { id: 'ref_38', name: 'Aguacate Hass', category: 'Grasas Saludables', icon: '🥑', kcal: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7, note: 'Grasas monoinsaturadas y altísimo contenido de potasio' },
  { id: 'ref_39', name: 'Nueces de California', category: 'Grasas Saludables', icon: '🥜', kcal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, note: 'El fruto seco con mayor concentración de Omega-3 vegetal (ALA)' },
  { id: 'ref_40', name: 'Almendras Naturales', category: 'Grasas Saludables', icon: '🌰', kcal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, note: 'Ricas en vitamina E antioxidante y magnesio' },
  { id: 'ref_41', name: 'Crema de Cacahuete 100% (Sin azúcar)', category: 'Grasas Saludables', icon: '🥜', kcal: 588, protein: 25.0, carbs: 20.0, fat: 50.0, fiber: 8.0, note: 'Densidad energética limpia y grasas de calidad' },

  // --- SUPLEMENTOS FITNESS ---
  { id: 'ref_42', name: 'Proteína Whey Isolate (Aislada)', category: 'Suplementos', icon: '🥤', kcal: 375, protein: 86.0, carbs: 2.5, fat: 1.5, fiber: 0, note: 'Absorción ultrasónica, máxima pureza de aminoácidos (BCAAs)' },
  { id: 'ref_43', name: 'Proteína Caseína Micelar', category: 'Suplementos', icon: '🥛', kcal: 360, protein: 80.0, carbs: 4.0, fat: 1.8, fiber: 0, note: 'Liberación lenta durante el descanso nocturno (antikatabólica)' },
  { id: 'ref_44', name: 'Barrita Proteica (media típica)', category: 'Suplementos', icon: '🍫', kcal: 350, protein: 33.0, carbs: 30.0, fat: 11.0, fiber: 12.0, note: 'Snack cómodo para viajes o pre/post entrenamiento' }
];

window.EXERCISES_DATABASE = EXERCISES_DATABASE;
window.WORKOUT_ROUTINES_TEMPLATES = WORKOUT_ROUTINES_TEMPLATES;
window.NUTRITION_REFERENCE_DB = NUTRITION_REFERENCE_DB;
