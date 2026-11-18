const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function transpileAndLoad(filePath) {
  const fullPath = path.resolve(root, filePath);
  const code = ts.transpileModule(fs.readFileSync(fullPath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: fullPath })(
    require,
    module,
    module.exports,
  );
  return module.exports;
}

test('interpretWeatherCode correctly classifies weather conditions', () => {
  const { interpretWeatherCode } = transpileAndLoad('src/services/weather/weatherService.ts');
  assert.equal(interpretWeatherCode(0).text, 'Quang đãng');
  assert.equal(interpretWeatherCode(0).isRain, false);
  assert.equal(interpretWeatherCode(1).text, 'Nắng nhẹ');
  assert.equal(interpretWeatherCode(61).text, 'Mưa rào');
  assert.equal(interpretWeatherCode(61).isRain, true);
  assert.equal(interpretWeatherCode(95).isRain, true);
});

test('geminiService provides fallback response when offline or unbilled', async () => {
  const { askGeminiHeritageGuide } = transpileAndLoad('src/services/ai/geminiService.ts');
  const res = await askGeminiHeritageGuide('Bảo tàng Điêu khắc Chăm', 'cham');
  assert.ok(res.text.includes('Bảo tàng Điêu khắc Chăm'));
  assert.ok(res.source === 'gemini-3.8-flash' || res.source === 'local-fallback');
});
