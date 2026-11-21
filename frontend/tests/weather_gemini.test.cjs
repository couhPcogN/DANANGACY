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
  const customRequire = (id) => {
    if (id.startsWith('.')) {
      const base = path.resolve(path.dirname(fullPath), id);
      const resolved = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(
        fs.existsSync,
      );
      if (resolved) {
        return transpileAndLoad(path.relative(root, resolved));
      }
    }
    return require(id);
  };
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: fullPath })(
    customRequire,
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

test('geminiService routes askGeminiHeritageGuide to backend /api/ai/heritage-guide with success response', async () => {
  const originalFetch = global.fetch;
  let interceptedUrl = '';
  let interceptedBody = null;

  global.fetch = async (url, options) => {
    interceptedUrl = String(url);
    interceptedBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        text: 'Bảo tàng Điêu khắc Chăm là nơi lưu giữ văn hóa Champa độc đáo.',
        source: 'gemini-3.8-flash',
      }),
    };
  };

  try {
    const { askGeminiHeritageGuide } = transpileAndLoad('src/services/ai/geminiService.ts');
    const res = await askGeminiHeritageGuide('Bảo tàng Điêu khắc Chăm', 'cham');
    assert.ok(interceptedUrl.includes('/api/ai/heritage-guide'));
    assert.equal(interceptedBody.destination_name, 'Bảo tàng Điêu khắc Chăm');
    assert.equal(interceptedBody.slug, 'cham');
    assert.equal(res.success, true);
    assert.equal(res.source, 'gemini-3.8-flash');
    assert.ok(res.text.includes('Bảo tàng Điêu khắc Chăm'));
  } finally {
    global.fetch = originalFetch;
  }
});

test('geminiService routes askGeminiWeatherAdvice to backend /api/ai/generate with success response', async () => {
  const originalFetch = global.fetch;
  let interceptedUrl = '';
  let interceptedBody = null;

  global.fetch = async (url, options) => {
    interceptedUrl = String(url);
    interceptedBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        text: 'Nên mang theo áo khoác nhẹ và ô cầm tay.',
        source: 'gemini-3.8-flash',
      }),
    };
  };

  try {
    const { askGeminiWeatherAdvice } = transpileAndLoad('src/services/ai/geminiService.ts');
    const res = await askGeminiWeatherAdvice('Mưa rào', 24, true);
    assert.ok(interceptedUrl.includes('/api/ai/generate'));
    assert.ok(interceptedBody.prompt.includes('24°C'));
    assert.ok(interceptedBody.prompt.includes('Mưa rào'));
    assert.ok(interceptedBody.system_instruction.includes('DANANGACY'));
    assert.equal(res.success, true);
    assert.equal(res.source, 'gemini-3.8-flash');
    assert.equal(res.text, 'Nên mang theo áo khoác nhẹ và ô cầm tay.');
  } finally {
    global.fetch = originalFetch;
  }
});

test('geminiService provides fallback response when backend returns HTTP error', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ detail: 'Internal Server Error' }),
  });

  try {
    const { askGeminiHeritageGuide } = transpileAndLoad('src/services/ai/geminiService.ts');
    const res = await askGeminiHeritageGuide('Bảo tàng Điêu khắc Chăm', 'cham');
    assert.equal(res.success, false);
    assert.equal(res.source, 'local-fallback');
    assert.ok(res.text.includes('Bảo tàng Điêu khắc Chăm'));
    assert.equal(res.errorDetails, 'Internal Server Error');
  } finally {
    global.fetch = originalFetch;
  }
});

test('geminiService provides fallback response when network fetch throws', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('Network unreachable');
  };

  try {
    const { askGeminiHeritageGuide } = transpileAndLoad('src/services/ai/geminiService.ts');
    const res = await askGeminiHeritageGuide('Bán đảo Sơn Trà', 'son-tra');
    assert.equal(res.success, false);
    assert.equal(res.source, 'local-fallback');
    assert.ok(res.text.includes('Sơn Trà'));
    assert.equal(res.errorDetails, 'Network unreachable');
  } finally {
    global.fetch = originalFetch;
  }
});

test('geminiService fallback handles unknown destinations with generic guidance', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('Backend offline');
  };

  try {
    const { askGeminiHeritageGuide } = transpileAndLoad('src/services/ai/geminiService.ts');
    const res = await askGeminiHeritageGuide('Điểm tham quan mới', 'unknown-dest');
    assert.equal(res.success, false);
    assert.equal(res.source, 'local-fallback');
    assert.ok(res.text.includes('Đà Nẵng là thành phố di sản'));
  } finally {
    global.fetch = originalFetch;
  }
});
