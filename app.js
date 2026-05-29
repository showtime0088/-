const PRACTICE_LENGTH = 10;
const MOCK_SECTIONS = [
  { name: "Quant", questionCount: 10, timeLimitSeconds: 900 },
  { name: "Verbal", questionCount: 10, timeLimitSeconds: 900 },
  { name: "Data Insights", questionCount: 10, timeLimitSeconds: 900 }
];

const sectionCopy = {
  Quant: "代数、数论、几何、应用题",
  Verbal: "批判性推理、阅读理解、逻辑判断",
  "Data Insights": "表格、图表、多源推理、数据判断"
};

let questions = [];
let selectedMode = "practice";
let selectedSection = "Quant";
let session = null;
let tickHandle = null;

const startView = document.querySelector("#startView");
const practiceView = document.querySelector("#practiceView");
const breakView = document.querySelector("#breakView");
const resultView = document.querySelector("#resultView");
const practiceModeButton = document.querySelector("#practiceModeButton");
const mockModeButton = document.querySelector("#mockModeButton");
const sectionChooser = document.querySelector("#sectionChooser");
const mockPreview = document.querySelector("#mockPreview");
const sectionGrid = document.querySelector("#sectionGrid");
const startButton = document.querySelector("#startButton");
const submitButton = document.querySelector("#submitButton");
const quitButton = document.querySelector("#quitButton");
const restartButton = document.querySelector("#restartButton");
const nextSectionButton = document.querySelector("#nextSectionButton");
const progressLabel = document.querySelector("#progressLabel");
const timerLabel = document.querySelector("#timerLabel");
const questionMeta = document.querySelector("#questionMeta");
const questionStem = document.querySelector("#questionStem");
const difficultyMeter = document.querySelector("#difficultyMeter");
const choiceList = document.querySelector("#choiceList");
const breakTitle = document.querySelector("#breakTitle");
const breakSummary = document.querySelector("#breakSummary");
const breakFlow = document.querySelector("#breakFlow");
const resultTitle = document.querySelector("#resultTitle");
const metricGrid = document.querySelector("#metricGrid");
const topicReport = document.querySelector("#topicReport");
const reviewList = document.querySelector("#reviewList");

async function boot() {
  try {
    if (window.GMAT_QUESTIONS) {
      questions = window.GMAT_QUESTIONS;
    } else {
      const response = await fetch("data/questions.json");
      questions = await response.json();
    }
    renderSectionOptions();
    renderMode();
  } catch (error) {
    startView.innerHTML = "<p>题库加载失败。请通过本地服务器打开页面，或检查 data/questions.json。</p>";
  }
}

function renderMode() {
  practiceModeButton.classList.toggle("active", selectedMode === "practice");
  mockModeButton.classList.toggle("active", selectedMode === "mock");
  sectionChooser.classList.toggle("hidden", selectedMode !== "practice");
  mockPreview.classList.toggle("hidden", selectedMode !== "mock");
  startButton.textContent = selectedMode === "practice" ? "开始练习" : "开始 Prep 模考";
}

function renderSectionOptions() {
  const sections = [...new Set(questions.map((question) => question.section))];
  sectionGrid.innerHTML = sections
    .map(
      (section) => `
        <button class="section-option ${section === selectedSection ? "active" : ""}" type="button" data-section="${section}">
          <strong>${section}</strong>
          <span>${sectionCopy[section]}</span>
        </button>
      `
    )
    .join("");

  sectionGrid.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedSection = button.dataset.section;
      renderSectionOptions();
    });
  });
}

function startSession() {
  const sections =
    selectedMode === "mock"
      ? MOCK_SECTIONS
      : [{ name: selectedSection, questionCount: PRACTICE_LENGTH, timeLimitSeconds: null }];

  session = {
    mode: selectedMode,
    sections,
    sectionIndex: 0,
    targetDifficulty: 3,
    currentQuestion: null,
    selectedAnswer: null,
    answers: [],
    startedAt: Date.now(),
    sectionStartedAt: Date.now(),
    questionStartedAt: Date.now()
  };

  startView.classList.add("hidden");
  breakView.classList.add("hidden");
  resultView.classList.add("hidden");
  practiceView.classList.remove("hidden");
  startTimer();
  showNextQuestion();
}

function showNextQuestion() {
  const currentSection = getCurrentSection();
  const sectionAnswers = getSectionAnswers(currentSection.name);

  if (sectionAnswers.length >= currentSection.questionCount) {
    completeSection();
    return;
  }

  const answeredIds = new Set(session.answers.map((answer) => answer.question.id));
  const available = questions.filter(
    (question) => question.section === currentSection.name && !answeredIds.has(question.id)
  );

  if (!available.length) {
    finishSession();
    return;
  }

  available.sort((a, b) => {
    const distanceA = Math.abs(a.difficulty - session.targetDifficulty);
    const distanceB = Math.abs(b.difficulty - session.targetDifficulty);
    if (distanceA !== distanceB) return distanceA - distanceB;
    return a.id.localeCompare(b.id);
  });

  session.currentQuestion = available[0];
  session.selectedAnswer = null;
  session.questionStartedAt = Date.now();
  renderQuestion();
}

function renderQuestion() {
  const question = session.currentQuestion;
  const currentSection = getCurrentSection();
  const sectionAnswers = getSectionAnswers(currentSection.name);
  const modeLabel = session.mode === "mock" ? `模考 ${session.sectionIndex + 1}/${session.sections.length}` : "练习";
  progressLabel.textContent = `${sectionAnswers.length + 1}/${currentSection.questionCount}`;
  questionMeta.textContent = `${modeLabel} · ${question.section} · ${question.type} · ${question.topic}`;
  questionStem.textContent = question.stem;
  submitButton.disabled = true;
  renderDifficulty(question.difficulty);
  renderChoices(question.choices);
}

function renderDifficulty(level) {
  difficultyMeter.innerHTML = Array.from({ length: 5 }, (_, index) => {
    const active = index < level ? "active" : "";
    return `<span class="${active}"></span>`;
  }).join("");
}

function renderChoices(choices) {
  choiceList.innerHTML = choices
    .map(
      (choice, index) => `
        <button class="choice-button" type="button" data-choice="${escapeHtml(choice)}">
          <span class="letter">${String.fromCharCode(65 + index)}</span>
          <span>${choice}</span>
        </button>
      `
    )
    .join("");

  choiceList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      session.selectedAnswer = button.dataset.choice;
      submitButton.disabled = false;
      choiceList.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

function submitAnswer() {
  if (!session.selectedAnswer) return;

  const question = session.currentQuestion;
  const isCorrect = session.selectedAnswer === question.answer;
  const seconds = Math.round((Date.now() - session.questionStartedAt) / 1000);

  session.answers.push({
    question,
    selectedAnswer: session.selectedAnswer,
    isCorrect,
    seconds,
    section: question.section,
    targetBefore: session.targetDifficulty
  });

  session.targetDifficulty = clamp(session.targetDifficulty + (isCorrect ? 1 : -1), 1, 5);
  showNextQuestion();
}

function completeSection() {
  if (session.mode === "mock" && session.sectionIndex < session.sections.length - 1) {
    stopTimer();
    renderBreak();
    practiceView.classList.add("hidden");
    breakView.classList.remove("hidden");
    return;
  }

  finishSession();
}

function renderBreak() {
  const currentSection = getCurrentSection();
  const sectionAnswers = getSectionAnswers(currentSection.name);
  const correct = sectionAnswers.filter((answer) => answer.isCorrect).length;
  const elapsed = Math.round((Date.now() - session.sectionStartedAt) / 1000);
  const nextSection = session.sections[session.sectionIndex + 1];

  progressLabel.textContent = `${session.sectionIndex + 1}/${session.sections.length}`;
  timerLabel.textContent = formatTime(elapsed);
  breakTitle.textContent = `${currentSection.name} 已完成`;
  breakSummary.textContent = `本段答对 ${correct}/${sectionAnswers.length}，用时 ${formatTime(elapsed)}。下一段是 ${nextSection.name}。`;
  breakFlow.innerHTML = session.sections
    .map((section, index) => {
      const state = index < session.sectionIndex + 1 ? "done" : index === session.sectionIndex + 1 ? "active" : "";
      return `<span class="${state}">${section.name}</span>`;
    })
    .join("");
}

function startNextSection() {
  session.sectionIndex += 1;
  session.targetDifficulty = 3;
  session.currentQuestion = null;
  session.selectedAnswer = null;
  session.sectionStartedAt = Date.now();
  breakView.classList.add("hidden");
  practiceView.classList.remove("hidden");
  startTimer();
  showNextQuestion();
}

function finishSession() {
  stopTimer();
  practiceView.classList.add("hidden");
  breakView.classList.add("hidden");
  resultView.classList.remove("hidden");
  renderResults();
}

function renderResults() {
  const answers = session.answers;
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const totalSeconds = Math.round((Date.now() - session.startedAt) / 1000);
  const averageSeconds = answers.length
    ? Math.round(answers.reduce((sum, answer) => sum + answer.seconds, 0) / answers.length)
    : 0;
  const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const finalDifficulty = answers.length ? session.targetDifficulty : 3;
  const score = estimateScore(answers);

  progressLabel.textContent = "已完成";
  timerLabel.textContent = formatTime(totalSeconds);
  resultTitle.textContent = session.mode === "mock" ? "Prep 模考报告" : `${session.sections[0].name} 练习报告`;
  const metrics =
    session.mode === "mock"
      ? [
          ["估算总分", score.total],
          ["正确率", `${accuracy}%`],
          ["答对题数", `${correct}/${answers.length}`],
          ["总用时", formatTime(totalSeconds)]
        ]
      : [
          ["正确率", `${accuracy}%`],
          ["答对题数", `${correct}/${answers.length}`],
          ["平均用时", `${averageSeconds}s`],
          ["最终难度", `${finalDifficulty}/5`]
        ];
  metricGrid.innerHTML = metrics
    .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  renderTopicReport(answers, score);
  renderReview(answers);
}

function renderTopicReport(answers, score = null) {
  const topicMap = new Map();
  answers.forEach((answer) => {
    const topic = session.mode === "mock" ? answer.question.section : answer.question.topic;
    const current = topicMap.get(topic) || { correct: 0, total: 0 };
    current.total += 1;
    current.correct += answer.isCorrect ? 1 : 0;
    topicMap.set(topic, current);
  });

  topicReport.innerHTML = [...topicMap.entries()]
    .map(([topic, stat]) => {
      const rate = Math.round((stat.correct / stat.total) * 100);
      const sectionScore = score?.sections?.[topic] ? ` · ${score.sections[topic]}` : "";
      return `<div class="topic-row"><strong>${topic}</strong><span>${stat.correct}/${stat.total} · ${rate}%${sectionScore}</span></div>`;
    })
    .join("");
}

function renderReview(answers) {
  reviewList.innerHTML = answers
    .map((answer, index) => {
      const status = answer.isCorrect
        ? '<span class="status-ok">正确</span>'
        : '<span class="status-bad">错误</span>';
      return `
        <div class="review-item">
          <strong>${index + 1}. ${answer.question.topic} · 难度 ${answer.question.difficulty} · ${status}</strong>
          <p>${answer.question.stem}</p>
          <p>你的答案：${answer.selectedAnswer}；正确答案：${answer.question.answer}</p>
          <p>${answer.question.explanation}</p>
        </div>
      `;
    })
    .join("");
}

function startTimer() {
  stopTimer();
  tickHandle = window.setInterval(() => {
    if (!session) return;
    timerLabel.textContent = formatTime(Math.round((Date.now() - session.startedAt) / 1000));
  }, 1000);
}

function stopTimer() {
  if (tickHandle) {
    window.clearInterval(tickHandle);
    tickHandle = null;
  }
}

function resetToStart() {
  stopTimer();
  session = null;
  timerLabel.textContent = "00:00";
  progressLabel.textContent = "未开始";
  resultView.classList.add("hidden");
  practiceView.classList.add("hidden");
  breakView.classList.add("hidden");
  startView.classList.remove("hidden");
}

function getCurrentSection() {
  return session.sections[session.sectionIndex];
}

function getSectionAnswers(sectionName) {
  return session.answers.filter((answer) => answer.question.section === sectionName);
}

function estimateScore(answers) {
  const sections = {};
  let totalWeighted = 0;
  let totalWeight = 0;

  MOCK_SECTIONS.forEach((section) => {
    const sectionAnswers = answers.filter((answer) => answer.question.section === section.name);
    const raw = sectionAnswers.reduce((sum, answer) => {
      const weight = answer.question.difficulty;
      return sum + (answer.isCorrect ? weight : -weight * 0.35);
    }, 0);
    const max = sectionAnswers.reduce((sum, answer) => sum + answer.question.difficulty, 0) || 1;
    const normalized = clamp((raw / max + 0.2) / 1.2, 0, 1);
    const sectionScore = Math.round((60 + normalized * 30) / 1) * 1;
    sections[section.name] = sectionScore;
    totalWeighted += sectionScore;
    totalWeight += 1;
  });

  const averageSection = totalWeight ? totalWeighted / totalWeight : 60;
  const total = Math.round((205 + ((averageSection - 60) / 30) * 600) / 10) * 10 + 5;
  return {
    total: clamp(total, 205, 805),
    sections
  };
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

startButton.addEventListener("click", startSession);
submitButton.addEventListener("click", submitAnswer);
quitButton.addEventListener("click", finishSession);
restartButton.addEventListener("click", resetToStart);
nextSectionButton.addEventListener("click", startNextSection);
practiceModeButton.addEventListener("click", () => {
  selectedMode = "practice";
  renderMode();
});
mockModeButton.addEventListener("click", () => {
  selectedMode = "mock";
  renderMode();
});

boot();
