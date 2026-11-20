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

const { buildQuizSubmissionPayload, findQuizForChallenge, gameService, convertBackendQuiz } =
  transpileAndLoad('src/services/api/gameService.ts');

test('findQuizForChallenge correctly selects quiz by title and handles multiple/empty quizzes', () => {
  const quizzes = [
    { id: 1, title: 'Di sản Hội An', questions: [] },
    { id: 2, title: 'Hiện vật Chăm Pa', questions: [] },
    { id: 3, title: 'Bán đảo Sơn Trà', questions: [] },
  ];

  // Matches 'Hiện vật Chăm Pa' strictly, avoiding quizzes[0]
  const matched = findQuizForChallenge(quizzes, 'Hiện vật Chăm Pa');
  assert.ok(matched);
  assert.equal(matched.id, 2);
  assert.equal(matched.title, 'Hiện vật Chăm Pa');

  // Case-insensitive trimming
  const matchedLower = findQuizForChallenge(quizzes, ' hiện vật chăm pa ');
  assert.ok(matchedLower);
  assert.equal(matchedLower.id, 2);

  // When no match and multiple quizzes exist, returns null (never guesses quizzes[0])
  const noMatch = findQuizForChallenge(quizzes, 'Unknown Quiz Title');
  assert.equal(noMatch, null);

  // Single quiz fallback
  const single = findQuizForChallenge([{ id: 99, title: 'Single Quiz', questions: [] }], 'Any');
  assert.equal(single.id, 99);

  // Empty or invalid list
  assert.equal(findQuizForChallenge([], 'Test'), null);
  assert.equal(findQuizForChallenge(null, 'Test'), null);
});

test('buildQuizSubmissionPayload maps answers by Question ID accurately regardless of order', () => {
  const mockBackendQuiz = {
    id: 99,
    destination_id: 12,
    title: 'Hiện vật Chăm Pa',
    description: 'Thử thách lịch sử',
    pass_score: 3,
    reward_points: 50,
    questions: [
      {
        id: 108,
        question_text: 'Tượng Bồ Tát Tara bằng đồng được tìm thấy ở đâu?',
        position: 0,
        explanation: 'Đồng Dương (Quảng Nam)',
        options: [
          { id: 501, option_text: 'Mỹ Sơn', position: 0 },
          { id: 502, option_text: 'Đồng Dương', position: 1 },
          { id: 503, option_text: 'Trà Kiệu', position: 2 },
          { id: 504, option_text: 'Tháp Mẫm', position: 3 },
        ],
      },
      {
        id: 245,
        question_text: 'Bảo tàng Chăm Đà Nẵng được xây dựng vào thế kỷ nào?',
        position: 1,
        explanation: 'Đầu thế kỷ 20',
        options: [
          { id: 601, option_text: 'Thế kỷ 18', position: 0 },
          { id: 602, option_text: 'Thế kỷ 19', position: 1 },
          { id: 603, option_text: 'Đầu thế kỷ 20 (1915-1919)', position: 2 },
          { id: 604, option_text: 'Cuối thế kỷ 20', position: 3 },
        ],
      },
    ],
  };

  // Answers tracked by actual question_id -> selected_option_id
  const answersByQId = {
    108: 502,
    245: 603,
  };
  const payload = buildQuizSubmissionPayload(mockBackendQuiz, answersByQId);

  assert.equal(payload.length, 2);
  assert.equal(payload[0].question_id, 108);
  assert.equal(payload[0].selected_option_id, 502);
  assert.equal(payload[1].question_id, 245);
  assert.equal(payload[1].selected_option_id, 603);
});

test('buildQuizSubmissionPayload NEVER invents q.options[0] for unanswered questions', () => {
  const mockBackendQuiz = {
    id: 10,
    destination_id: 1,
    title: 'Test Quiz',
    description: null,
    pass_score: 1,
    reward_points: 10,
    questions: [
      {
        id: 77,
        question_text: 'Question with no answer',
        position: 0,
        explanation: null,
        options: [
          { id: 801, option_text: 'Opt 1', position: 0 },
          { id: 802, option_text: 'Opt 2', position: 1 },
        ],
      },
      {
        id: 88,
        question_text: 'Question answered',
        position: 1,
        explanation: null,
        options: [
          { id: 901, option_text: 'Opt A', position: 0 },
          { id: 902, option_text: 'Opt B', position: 1 },
        ],
      },
    ],
  };

  // Test with array containing null for Q1
  const payloadFromArray = buildQuizSubmissionPayload(mockBackendQuiz, [null, 1]);
  // Question 77 was null, so it must NOT be assigned option 801! Only Q88 is returned.
  assert.equal(payloadFromArray.length, 1);
  assert.equal(payloadFromArray[0].question_id, 88);
  assert.equal(payloadFromArray[0].selected_option_id, 902);

  // Test with Record containing only Q88
  const payloadFromRecord = buildQuizSubmissionPayload(mockBackendQuiz, { 88: 902 });
  assert.equal(payloadFromRecord.length, 1);
  assert.equal(payloadFromRecord[0].question_id, 88);
  assert.equal(payloadFromRecord[0].selected_option_id, 902);

  // If all answers are missing, payload is empty (never auto-completes)
  const emptyPayload = buildQuizSubmissionPayload(mockBackendQuiz, {});
  assert.equal(emptyPayload.length, 0);
});

test('gameService.fetchQuizzes returns parsed quizzes on success and empty array on failure', async () => {
  const originalFetch = global.fetch;

  // Test success
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => [{ id: 1, title: 'Quiz 1', questions: [] }],
  });

  const quizzes = await gameService.fetchQuizzes();
  assert.equal(quizzes.length, 1);
  assert.equal(quizzes[0].id, 1);

  // Test HTTP error
  global.fetch = async () => ({
    ok: false,
    status: 500,
  });
  const failedQuizzes = await gameService.fetchQuizzes();
  assert.deepEqual(failedQuizzes, []);

  // Test network failure
  global.fetch = async () => {
    throw new Error('Network failure');
  };
  const networkErrorQuizzes = await gameService.fetchQuizzes();
  assert.deepEqual(networkErrorQuizzes, []);

  global.fetch = originalFetch;
});

test('gameService.submitQuiz sends authoritative payload and includes Bearer token', async () => {
  const originalFetch = global.fetch;
  let interceptedUrl = '';
  let interceptedHeaders = {};
  let interceptedBody = null;

  global.fetch = async (url, options) => {
    interceptedUrl = String(url);
    interceptedHeaders = options.headers;
    interceptedBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        attempt_id: 55,
        quiz_id: 1,
        correct_count: 5,
        total_questions: 5,
        passed: true,
        points_awarded: 50,
        balance_points: 170,
        message: 'Hoàn thành xuất sắc',
      }),
    };
  };

  const answers = [
    { question_id: 10, selected_option_id: 101 },
    { question_id: 20, selected_option_id: 202 },
  ];
  const result = await gameService.submitQuiz(1, answers, 'mock-jwt-token');

  assert.ok(interceptedUrl.endsWith('/api/quizzes/1/submit'));
  assert.equal(interceptedHeaders['Authorization'], 'Bearer mock-jwt-token');
  assert.deepEqual(interceptedBody, { answers });
  assert.ok(result);
  assert.equal(result.attempt_id, 55);
  assert.equal(result.correct_count, 5);
  assert.equal(result.passed, true);
  assert.equal(result.points_awarded, 50);
  assert.equal(result.balance_points, 170);

  // Test anti-cheat rejection (HTTP 400 returns null gracefully)
  global.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ detail: 'Invalid option for question' }),
  });
  const rejectedResult = await gameService.submitQuiz(1, answers, 'mock-jwt-token');
  assert.equal(rejectedResult, null);

  // Test network exception returns null gracefully
  global.fetch = async () => {
    throw new Error('Timeout');
  };
  const networkResult = await gameService.submitQuiz(1, answers, 'mock-jwt-token');
  assert.equal(networkResult, null);

  global.fetch = originalFetch;
});

test('convertBackendQuiz never infers answers from demo data and sets correct to -1', () => {
  const backendQuiz = {
    id: 1,
    title: 'Hiện vật Chăm Pa',
    questions: [
      {
        id: 101,
        question_text: 'Bảo tàng Điêu khắc Chăm Đà Nẵng được thành lập vào năm nào?',
        position: 0,
        explanation: 'Thành lập năm 1915',
        options: [
          { id: 1, option_text: '1905', position: 0 },
          { id: 2, option_text: '1915', position: 1 },
          { id: 3, option_text: '1925', position: 2 },
          { id: 4, option_text: '1935', position: 3 },
        ],
      },
      {
        id: 102,
        question_text: 'Một câu hỏi hoàn toàn mới không có trong demo?',
        position: 1,
        explanation: 'Giải thích chi tiết từ máy chủ',
        options: [
          { id: 5, option_text: 'Đáp án A', position: 0 },
          { id: 6, option_text: 'Đáp án B', position: 1 },
        ],
      },
    ],
  };

  const converted = convertBackendQuiz(backendQuiz);
  assert.equal(converted.length, 2);

  // Even for question 101 which matches demo text, correct MUST be -1 (server-evaluated)
  assert.equal(converted[0].correct, -1);
  assert.equal(converted[0].id, 101);
  assert.equal(converted[0].options.length, 4);
  assert.equal(converted[0].options[1].id, 2);

  // For question 102, correct MUST also be -1
  assert.equal(converted[1].correct, -1);
  assert.equal(converted[1].id, 102);
  assert.equal(converted[1].explanation, 'Giải thích chi tiết từ máy chủ');
});

test('quiz navigation button label transitions to "Xem kết quả" exactly on the last question of any quiz length', () => {
  const getButtonTitle = (quizLength, quizIndex, quizConfirmed) => {
    if (!quizConfirmed) return 'Xác nhận đáp án';
    return quizIndex >= quizLength - 1 ? 'Xem kết quả' : 'Câu tiếp theo';
  };

  // For a 2-question quiz:
  assert.equal(getButtonTitle(2, 0, false), 'Xác nhận đáp án');
  assert.equal(getButtonTitle(2, 0, true), 'Câu tiếp theo');
  assert.equal(getButtonTitle(2, 1, true), 'Xem kết quả');

  // For a 3-question quiz:
  assert.equal(getButtonTitle(3, 0, true), 'Câu tiếp theo');
  assert.equal(getButtonTitle(3, 1, true), 'Câu tiếp theo');
  assert.equal(getButtonTitle(3, 2, true), 'Xem kết quả');

  // For a 7-question quiz:
  // Note: Question 5 (index 4) MUST NOT say 'Xem kết quả' prematurely!
  assert.equal(getButtonTitle(7, 4, true), 'Câu tiếp theo');
  assert.equal(getButtonTitle(7, 5, true), 'Câu tiếp theo');
  assert.equal(getButtonTitle(7, 6, true), 'Xem kết quả');
});

test('QuizAnswer color logic distinguishes between correct, wrong and server-evaluated un-graded state', () => {
  const { colors } = transpileAndLoad('src/theme/index.ts');

  // Pure logic replicating QuizAnswer state decisions:
  const getColors = (selected, confirmed, correct) => {
    let borderColor = colors.border;
    let backgroundColor = colors.white;

    if (selected) {
      borderColor = colors.primary;
      backgroundColor = colors.warm;
      if (confirmed) {
        if (correct === true) {
          borderColor = colors.success;
          backgroundColor = colors.successBg;
        } else if (correct === false) {
          borderColor = colors.error;
          backgroundColor = colors.errorBg;
        } else {
          // Ungraded / Server-evaluated: preserve active highlight without false error
          borderColor = colors.primaryDark;
          backgroundColor = colors.warm;
        }
      }
    }
    return { borderColor, backgroundColor };
  };

  // When selected and confirmed with correct = true
  const correctResult = getColors(true, true, true);
  assert.equal(correctResult.borderColor, colors.success);
  assert.equal(correctResult.backgroundColor, colors.successBg);

  // When selected and confirmed with correct = false
  const wrongResult = getColors(true, true, false);
  assert.equal(wrongResult.borderColor, colors.error);
  assert.equal(wrongResult.backgroundColor, colors.errorBg);

  // When selected and confirmed with correct = null (server-evaluated / un-graded)
  const ungradedResult = getColors(true, true, null);
  assert.notEqual(
    ungradedResult.borderColor,
    colors.error,
    'Ungraded question must not turn red border',
  );
  assert.notEqual(
    ungradedResult.backgroundColor,
    colors.errorBg,
    'Ungraded question must not turn red background',
  );
  assert.equal(ungradedResult.borderColor, colors.primaryDark);
  assert.equal(ungradedResult.backgroundColor, colors.warm);
});
