/**
 * Fit360 — FoodParser Unit Tests
 */

const assert = require('assert');
const FoodParser = require('./food-parser.js');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

console.log('\n--- Running FoodParser Unit Tests ---\n');

test('Entrada vacía o nula retorna lista vacía sin error', () => {
  const r1 = FoodParser.parse('');
  assert.strictEqual(r1.items.length, 0);
  assert.strictEqual(r1.totalKcal, 0);

  const r2 = FoodParser.parse(null);
  assert.strictEqual(r2.items.length, 0);
});

test('2 huevos y tostada -> 2 items con gramos y macros', () => {
  const result = FoodParser.parse('2 huevos y tostada');
  assert.strictEqual(result.items.length, 2, 'Debe parsear 2 items');

  const huevos = result.items[0];
  assert.strictEqual(huevos.baseName, 'Huevos enteros (unidad ~55g)');
  assert.strictEqual(huevos.grams, 110, '2 huevos deben ser 110g (55g c/u)');
  assert.ok(huevos.kcal > 140, 'Kcal debe estar calculada');
  assert.ok(huevos.protein > 12, 'Proteína debe estar calculada');

  const tostada = result.items[1];
  assert.strictEqual(tostada.baseName, 'Pan 100% integral');
  assert.strictEqual(tostada.grams, 35, '1 tostada debe ser 35g');
  assert.ok(tostada.carbs > 10, 'Carbohidratos deben estar calculados');
});

test('200g de pollo -> 1 item a 200g con macros escaladas', () => {
  const result = FoodParser.parse('200g de pollo');
  assert.strictEqual(result.items.length, 1);

  const pollo = result.items[0];
  assert.strictEqual(pollo.baseName, 'Pechuga de pollo limpia');
  assert.strictEqual(pollo.grams, 200);
  assert.strictEqual(pollo.kcal, 240, '120 kcal * 2 = 240 kcal');
  assert.strictEqual(pollo.protein, 48, '24g proteína * 2 = 48g');
});

test('yogur griego con avena -> 2 items fuzzy-matched', () => {
  const result = FoodParser.parse('yogur griego con avena');
  assert.strictEqual(result.items.length, 2);

  const yogur = result.items[0];
  assert.strictEqual(yogur.baseName, 'Yogur griego 0% natural');
  assert.ok(yogur.confidence >= 0.8);

  const avena = result.items[1];
  assert.strictEqual(avena.baseName, 'Copos de avena integral');
  assert.ok(avena.confidence >= 0.8);
});

test('2 huevos y tostada con aguacate -> 3 items', () => {
  const result = FoodParser.parse('2 huevos y tostada con aguacate');
  assert.strictEqual(result.items.length, 3);
  assert.strictEqual(result.items[0].baseName, 'Huevos enteros (unidad ~55g)');
  assert.strictEqual(result.items[1].baseName, 'Pan 100% integral');
  assert.strictEqual(result.items[2].baseName, 'Aguacate');
});

test('Cantidades decimales y plurales: 1.5 platanos', () => {
  const result = FoodParser.parse('1.5 platanos');
  assert.strictEqual(result.items.length, 1);
  const platano = result.items[0];
  assert.strictEqual(platano.baseName, 'Plátano maduro');
  assert.strictEqual(platano.grams, 180, '1.5 * 120g = 180g');
});

test('Cantidades explícitas en gramos: 30g de nueces', () => {
  const result = FoodParser.parse('30g de nueces');
  assert.strictEqual(result.items.length, 1);
  const nueces = result.items[0];
  assert.strictEqual(nueces.baseName, 'Nueces naturales');
  assert.strictEqual(nueces.grams, 30);
  assert.strictEqual(nueces.kcal, 196, '654 * 0.3 = ~196 kcal');
});

test('Números en palabras: dos rebanadas de pan', () => {
  const result = FoodParser.parse('dos rebanadas de pan');
  assert.strictEqual(result.items.length, 1);
  const pan = result.items[0];
  assert.strictEqual(pan.baseName, 'Pan 100% integral');
  assert.strictEqual(pan.grams, 70, '2 * 35g = 70g');
});

test('Medio aguacate -> 40g', () => {
  const result = FoodParser.parse('medio aguacate');
  assert.strictEqual(result.items.length, 1);
  const aguacate = result.items[0];
  assert.strictEqual(aguacate.baseName, 'Aguacate');
  assert.strictEqual(aguacate.grams, 40, 'Medio aguacate = 40g');
});

test('Texto desconocido o sin match -> marca como unmatched sin error', () => {
  const result = FoodParser.parse('xyz999alimentoimposible');
  assert.strictEqual(result.items.length, 1);
  assert.strictEqual(result.items[0].unmatched, true);
  assert.strictEqual(result.items[0].confidence, 0);
  assert.strictEqual(result.items[0].kcal, 0);
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
