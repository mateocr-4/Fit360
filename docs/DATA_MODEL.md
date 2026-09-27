# Fit360 — Data Model Reference

Referencia completa de todas las estructuras de datos utilizadas por Fit360.

---

## 1. Claves de localStorage

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `fit360_settings` | `Settings` | Perfil de usuario + objetivos + config dashboard |
| `fit360_daily_data` | `{ [date: string]: DayData }` | Todos los registros diarios indexados por fecha |
| `fit360_favorites` | `FoodItem[]` | Alimentos marcados como favoritos |
| `fit360_muscle_groups` | `MuscleGroup[]` | Grupos musculares (6 por defecto + custom) |
| `fit360_custom_exercises` | `ExerciseDef[]` | Ejercicios personalizados creados por el usuario |
| `fit360_weight_logs` | `WeightLog[]` | Historial de pesajes |
| `fit360_custom_routines` | `Routine[]` | Rutinas de gimnasio personalizadas |
| `fit360_friends` | `Friend[]` | Lista de amigos (social P2P) |
| `fit360_custom_recipes` | `Recipe[]` | Recetas creadas por el usuario |
| `fit360_my_fit_id` | `string` | Identificador social único |

---

## 2. Esquemas de Datos

### Settings

```typescript
interface Settings {
  profile: {
    name: string;          // "Mateo"
    weight: number;        // 76 (kg)
    height: number;        // 178 (cm)
  };
  goals: {
    kcal: number;          // 2350
    protein: number;       // 165 (g)
    carbs: number;         // 265 (g)
    fat: number;           // 65 (g)
    appleMoveKcal: number; // 650
    appleExerciseMin: number; // 30
    appleStandHours: number;  // 12
    water: number;         // 2500 (ml)
  };
  dashboardWidgets: {
    order: string[];       // ['calories', 'appleFitness', 'weight', 'workouts', 'weeklyChart']
    hidden: string[];      // IDs de widgets ocultos
  };
}
```

### DayData

```typescript
interface DayData {
  date: string;            // "YYYY-MM-DD"
  nutrition: {
    desayuno: FoodItem[];
    almuerzo: FoodItem[];
    merienda: FoodItem[];
    cena: FoodItem[];
    snacks: FoodItem[];
  };
  appleFitness: {
    activeKcal: number;
    steps: number;
    exerciseTime: number;  // minutos
    standHours?: number;
    lastSync: string | null; // ISO timestamp
  };
  gym: GymExercise[];
  cardio: CardioSession[];
}
```

### FoodItem

```typescript
interface FoodItem {
  id: string;              // "food_" + timestamp
  name: string;            // "Pechuga de pollo"
  grams: number;           // 200
  kcal: number;            // 240
  protein: number;         // 48 (g)
  carbs: number;           // 0 (g)
  fat: number;             // 4 (g)
  source?: string;         // "manual" | "barcode" | "recipe"
  barcode?: string;        // EAN si viene de escáner
}
```

### GymExercise

```typescript
interface GymExercise {
  id: string;              // "ex_" + timestamp
  exerciseId: string;      // Referencia a EXERCISES_DATABASE o custom
  name: string;            // "Press de Banca Plano con Barra"
  category: string;        // "Pecho"
  sets: GymSet[];
  routineId?: string;      // Si viene de una rutina
}

interface GymSet {
  weight: number;          // kg
  reps: number;
  completed: boolean;
}
```

### CardioSession

```typescript
interface CardioSession {
  id: string;              // "cardio_" + timestamp
  type: string;            // "elliptical" | "treadmill" | "bike"
  duration: number;        // minutos
  kcal: number;
  distance?: number;       // km (solo treadmill/bike)
  speed?: number;          // km/h
  incline?: number;        // % (solo treadmill)
  resistance?: number;     // 1-25 (solo elliptical)
  timestamp: string;       // ISO
}
```

### WeightLog

```typescript
interface WeightLog {
  id: string;              // "w_" + timestamp
  date: string;            // "YYYY-MM-DD"
  time: string;            // "HH:MM"
  weight: number;          // kg (ej: 76.3)
  fatPct: number | null;   // % grasa corporal
  musclePct: number | null;// % masa muscular
  timing: string;          // "fasting" | "post_workout" | "night" | "normal"
  source: string;          // "manual" | "renpho_health" | "renpho_csv"
  notes: string;
  timestamp: string;       // ISO
}
```

### Routine

```typescript
interface Routine {
  id: string;              // "routine_" + timestamp
  name: string;            // "Push Day A"
  icon: string;            // Emoji "🔥"
  category: string;        // "Fuerza" | "Hipertrofia" | "Full Body" | etc.
  exercises: RoutineExercise[];
  createdAt: string;       // ISO
}

interface RoutineExercise {
  exerciseId: string;
  name: string;
  category: string;        // Grupo muscular
  targetSets: number;
  targetReps: number;
  targetWeight: number;    // kg
}
```

### Recipe

```typescript
interface Recipe {
  id: string;              // "recipe_" + timestamp
  name: string;            // "Overnight Oats Proteicos"
  icon: string;            // Emoji
  mealType: string;        // "desayuno" | "almuerzo" | etc.
  ingredients: RecipeIngredient[];
  totals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: string;
}

interface RecipeIngredient {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}
```

### Friend

```typescript
interface Friend {
  id: string;              // FitID del amigo
  name: string;
  addedAt: string;         // ISO
  routines?: Routine[];    // Rutinas compartidas
  recipes?: Recipe[];      // Recetas compartidas
}
```

### ExerciseDef (Base de Datos)

```typescript
interface ExerciseDef {
  id: string;              // "bench_press" o "custom_ex_" + timestamp
  name: string;            // "Press de Banca Plano con Barra"
  category: string;        // "Pecho"
  defaultWeight: number;   // kg sugerido
  defaultReps: number;     // reps sugeridas
}
```

### MuscleGroup

```typescript
interface MuscleGroup {
  id: string;              // "pecho" o "mg_" + timestamp
  name: string;            // "Pecho"
  icon: string;            // Emoji "🏋️‍♂️"
}
```

### Preset Food (Estático)

```typescript
interface PresetFood {
  name: string;            // "Pechuga de pollo limpia"
  category: string;        // "Carnes"
  per100g: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  defaultGrams: number;    // Porción típica sugerida
}
```

---

## 3. APIs Externas

### Open Food Facts (Barcode Lookup)

```
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json

Response relevante:
{
  "status": 1,
  "product": {
    "product_name": "Galletas María",
    "product_name_es": "Galletas María",
    "brands": "Fontaneda",
    "image_front_url": "https://...",
    "nutriments": {
      "energy-kcal_100g": 456,
      "proteins_100g": 7.2,
      "carbohydrates_100g": 74,
      "fat_100g": 14.5
    }
  }
}
```

- **Límite:** Sin límite (API pública y gratuita)
- **Timeout:** 8 segundos
- **Formatos soportados:** EAN-13, EAN-8, UPC-A, UPC-E, Code128, Code39

---

## 4. Esquema Relacional en la Nube (Supabase / PostgreSQL)

Fit360 opera bajo un modelo **offline-first con reconciliación en la nube**. Cada usuario autenticado dispone de un `auth.users(id)` (UUID).

| Tabla en Supabase | Clave en LocalStorage | Tipo de Sincronización |
|---|---|---|
| `public.user_profiles` | `fit360_settings` | Upsert por `id = auth.uid()` |
| `public.daily_logs` | `fit360_daily_data[date]` | Upsert por `(user_id, log_date)` |
| `public.weight_logs` | `fit360_weight_logs` | Append / Delete por `id` |
| `public.workout_sessions` | `fit360_daily_data[date].gym / cardio` | Upsert / Append por `id` |
| `public.custom_exercises` | `fit360_custom_exercises` | Upsert / Delete por `id` |
| `public.custom_routines` | `fit360_custom_routines` | Upsert / Delete por `id` |
| `public.custom_recipes` | `fit360_custom_recipes` | Upsert / Delete por `id` |
| `public.favorite_foods` | `fit360_favorites` | Upsert / Delete por `id` |

El script de creación y políticas RLS reside en [`supabase/schema.sql`](file:///c:/Users/Mateo/Proyectos/Fit360/supabase/schema.sql).

