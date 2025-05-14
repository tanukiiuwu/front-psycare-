// Obtener tipo de test de la URL
const urlParams = new URLSearchParams(window.location.search);
const testType = urlParams.get('type');

// Configuración de tests
const tests = {
  ansiedad: {
    title: "Test de Ansiedad",
    description: "Evalúa tus niveles de ansiedad",
    questions: [
      {
        id: 1,
        text: "¿Con qué frecuencia te has sentido nervioso/a o ansioso/a?",
        options: [
          { value: 0, text: "Nunca" },
          { value: 1, text: "Algunas veces" },
          { value: 2, text: "Frecuentemente" },
          { value: 3, text: "Casi siempre" }
        ]
      },
      {
        id: 2,
        text: "¿Has tenido dificultad para relajarte?",
        options: [
          { value: 0, text: "Nunca" },
          { value: 1, text: "Algunas veces" },
          { value: 2, text: "Frecuentemente" },
          { value: 3, text: "Casi siempre" }
        ]
      },
      {
        id: 3,
        text: "¿Has experimentado palpitaciones o taquicardia?",
        options: [
          { value: 0, text: "Nunca" },
          { value: 1, text: "Algunas veces" },
          { value: 2, text: "Frecuentemente" },
          { value: 3, text: "Casi siempre" }
        ]
      }
    ]
  },
  depresion: {
    title: "Test de Depresión",
    description: "Evalúa posibles síntomas depresivos",
    questions: [
      {
        id: 1,
        text: "¿Con qué frecuencia te has sentido triste o desesperanzado/a?",
        options: [
          { value: 0, text: "Nunca" },
          { value: 1, text: "Algunas veces" },
          { value: 2, text: "Frecuentemente" },
          { value: 3, text: "Casi siempre" }
        ]
      },
      {
        id: 2,
        text: "¿Has perdido interés en actividades que antes disfrutabas?",
        options: [
          { value: 0, text: "Nunca" },
          { value: 1, text: "Algunas veces" },
          { value: 2, text: "Frecuentemente" },
          { value: 3, text: "Casi siempre" }
        ]
      }
    ]
  },
  estres: {
    title: "Test de Estrés",
    description: "Mide tus niveles de estrés actual",
    questions: [
      {
        id: 1,
        text: "¿Con qué frecuencia te has sentido abrumado/a?",
        options: [
          { value: 0, text: "Nunca" },
          { value: 1, text: "Algunas veces" },
          { value: 2, text: "Frecuentemente" },
          { value: 3, text: "Casi siempre" }
        ]
      },
      {
        id: 2,
        text: "¿Has tenido dificultad para concentrarte?",
        options: [
          { value: 0, text: "Nunca" },
          { value: 1, text: "Algunas veces" },
          { value: 2, text: "Frecuentemente" },
          { value: 3, text: "Casi siempre" }
        ]
      }
    ]
  }
};

// Variables globales
let currentTest = tests[testType];
let currentQuestion = 0;
let answers = {};

// Elementos del DOM
const testTitle = document.getElementById('test-title');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const questionContainer = document.getElementById('question-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');

// Inicializar test
function initTest() {
  if (!currentTest) {
    showError("Test no encontrado");
    return;
  }
  
  testTitle.textContent = currentTest.title;
  document.title = currentTest.title + " - PsyCare";
  
  // Inicializar respuestas
  currentTest.questions.forEach((q, index) => {
    answers[index] = null;
  });
  
  showQuestion(0);
}

// Mostrar pregunta
function showQuestion(index) {
  currentQuestion = index;
  const question = currentTest.questions[index];
  
  // Actualizar progreso
  updateProgress();
  
  // Construir HTML de la pregunta
  questionContainer.innerHTML = `
    <h3>${question.text}</h3>
    <div class="options-container">
      ${question.options.map((opt, i) => `
        <label class="option">
          <input type="radio" name="answer" value="${opt.value}" 
                 ${answers[index] === opt.value ? 'checked' : ''}
                 onchange="selectAnswer(${index}, ${opt.value})">
          <span class="option-text">${opt.text}</span>
        </label>
      `).join('')}
    </div>
  `;
  
  // Actualizar botones de navegación
  prevBtn.disabled = index === 0;
  nextBtn.disabled = answers[index] === null;
  
  // Mostrar botón de enviar si es la última pregunta
  if (index === currentTest.questions.length - 1) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'inline-flex';
  } else {
    nextBtn.style.display = 'inline-flex';
    submitBtn.style.display = 'none';
  }
}

// Seleccionar respuesta
function selectAnswer(questionIndex, value) {
  answers[questionIndex] = value;
  nextBtn.disabled = false;
}

// Actualizar progreso
function updateProgress() {
  const progress = ((currentQuestion + 1) / currentTest.questions.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${currentQuestion + 1}/${currentTest.questions.length}`;
}

// Navegación
prevBtn.addEventListener('click', () => {
  showQuestion(currentQuestion - 1);
});

nextBtn.addEventListener('click', () => {
  showQuestion(currentQuestion + 1);
});

// Enviar test
submitBtn.addEventListener('click', submitTest);

function submitTest() {
  // Calcular puntuación total
  const totalScore = Object.values(answers).reduce((sum, score) => sum + (score || 0), 0);
  
  // Mostrar resultado (esto luego se enviará al backend)
  alert(`Test completado!\nPuntuación total: ${totalScore}`);
  
  // Redirigir al dashboard después de 2 segundos
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 2000);
}

// Cancelar test
function cancelTest() {
  if (confirm('¿Estás seguro de que quieres cancelar el test?\nNo se guardarán tus respuestas.')) {
    window.location.href = 'dashboard.html';
  }
}

// Mostrar error
function showError(message) {
  questionContainer.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>${message}</p>
      <button class="btn-primario" onclick="window.location.href='dashboard.html'">
        Volver al Dashboard
      </button>
    </div>
  `;
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initTest);
// Añadir esta función al final de test.js
function updateTestsCompleted() {
    // Obtener contador actual o inicializar
    let testsCompleted = localStorage.getItem('testsCompleted') || 0;
    // Incrementar
    testsCompleted++;
    // Guardar
    localStorage.setItem('testsCompleted', testsCompleted);
  }
  
  // Llamar a esta función justo antes de mostrar el resultado en submitTest()
  function submitTest() {
    // Calcular puntuación total
    const totalScore = Object.values(answers).reduce((sum, score) => sum + (score || 0), 0);
    
    // Actualizar contador
    updateTestsCompleted();
    
    // Mostrar resultado
    alert(`Test completado!\nPuntuación total: ${totalScore}`);
    
    // Redirigir al dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
  }
  