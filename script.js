// ---- Configuração básica de frontend ----
// Aqui vamos:
// - pegar o texto digitado ou falado
// - enviar para um endpoint de backend (IA)
// - exibir, no próprio site, as músicas sugeridas (nome + artista)

const queryInput = document.getElementById('query');
const micButton = document.getElementById('mic-button');
const micLabel = document.getElementById('mic-label');
const statusEl = document.getElementById('status');
const submitButton = document.getElementById('submit-button');
const resultsList = document.getElementById('results-list');
const micDot = micButton?.querySelector('.mic-dot');
const progressEl = document.getElementById('progress');
const progressBarEl = document.getElementById('progress-bar');
const progressPercentEl = document.getElementById('progress-percent');
let progressTimer = null;

// URL do backend.
// A API:
//  1) Usa IA (ChatGPT) para entender o texto/áudio e sugerir possíveis músicas
//  2) Devolve um JSON no formato:
//     { songs: [{ title, artist }, ...] }
const BACKEND_URL = '/api/buscar-musica';

function setStatus(message, { isError = false } = {}) {
  statusEl.textContent = message || '';
  statusEl.classList.toggle('status--error', Boolean(isError));
}

function startProgress() {
  if (!progressEl || !progressBarEl || !progressPercentEl) return;
  if (progressTimer) {
    clearInterval(progressTimer);
  }

  let value = 0;
  progressEl.style.opacity = '1';
  progressEl.style.transform = 'scale(1)';
  progressBarEl.style.width = '0%';
  progressPercentEl.textContent = '0%';

  progressTimer = setInterval(() => {
    // Crescimento rápido no início, mais lento perto do fim
    if (value < 70) {
      value += Math.random() * 15;
    } else if (value < 90) {
      value += Math.random() * 7;
    } else {
      value += Math.random() * 2;
    }

    if (value > 97) value = 97;

    const displayValue = Math.floor(value);
    progressBarEl.style.width = `${displayValue}%`;
    progressPercentEl.textContent = `${displayValue}%`;
  }, 150);
}

function finishProgress() {
  if (!progressEl || !progressBarEl || !progressPercentEl) return;
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }

  progressBarEl.style.width = '100%';
  progressPercentEl.textContent = '100%';

  setTimeout(() => {
    progressEl.style.opacity = '0';
    progressEl.style.transform = 'scale(0.98)';
  }, 400);
}

function renderResults(songs) {
  resultsList.innerHTML = '';

  if (!songs || !songs.length) {
    const li = document.createElement('li');
    li.className = 'result-item';
    li.textContent =
      'Nenhuma sugestão ainda. Tente um trecho um pouco maior ou mais específico.';
    resultsList.appendChild(li);
    return;
  }

  songs.forEach((song) => {
    const li = document.createElement('li');
    li.className = 'result-item';

    const row = document.createElement('div');
    row.className = 'result-row';

    const img = document.createElement('img');
    img.className = 'result-cover';

    const titleText = song.title || 'Música desconhecida';
    const artistText = song.artist || 'Artista não identificado';

    // Se no futuro o backend mandar uma URL de capa, usamos.
    if (song.coverUrl) {
      img.src = song.coverUrl;
    } else {
      const query = encodeURIComponent(`${titleText} ${artistText} song`);
      img.src = `https://source.unsplash.com/80x80/?${query}`;
    }
    img.alt = `Capa ilustrativa para ${titleText}`;

    const textBox = document.createElement('div');
    textBox.className = 'result-texts';

    const title = document.createElement('p');
    title.className = 'result-title';
    title.textContent = titleText;

    const artist = document.createElement('p');
    artist.className = 'result-artist';
    artist.textContent = artistText;

    textBox.appendChild(title);
    textBox.appendChild(artist);

    row.appendChild(img);
    row.appendChild(textBox);

    li.appendChild(row);
    resultsList.appendChild(li);
  });
}

async function handleSearch() {
  const text = queryInput.value.trim();

  if (!text) {
    setStatus('Escreva ou fale um trecho antes de buscar.', { isError: true });
    queryInput.focus();
    return;
  }

  setStatus('');
  startProgress();
  submitButton.disabled = true;

  try {
    // Exemplo de chamada – você implementará este endpoint no backend.
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: text }),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    renderResults(data.songs || []);
    setStatus('Resultados sugeridos com base no trecho informado.');
  } catch (error) {
    console.error(error);
    setStatus(
      'Não foi possível buscar agora. Verifique o backend da API ou tente novamente em alguns segundos.',
      { isError: true }
    );
  } finally {
    finishProgress();
    submitButton.disabled = false;
  }
}

submitButton.addEventListener('click', handleSearch);

queryInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    handleSearch();
  }
});

// ---- Reconhecimento de voz (Web Speech API) ----

let recognition = null;
let isListening = false;

function initSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setStatus(
      'Reconhecimento de voz não é suportado neste navegador. Tente o Chrome ou Edge.',
      { isError: true }
    );
    micButton.disabled = true;
    return null;
  }

  const rec = new SpeechRecognition();
  rec.lang = 'pt-BR';
  rec.interimResults = true;
  rec.continuous = false;

  rec.onstart = () => {
    isListening = true;
    micLabel.textContent = 'Ouvindo... clique para parar';
    micDot.classList.add('mic-dot--active');
    setStatus('Ouvindo, pode cantar ou descrever a música.');
  };

  rec.onend = () => {
    isListening = false;
    micLabel.textContent = 'Falar trecho';
    micDot.classList.remove('mic-dot--active');
    if (!queryInput.value.trim()) {
      setStatus('Não capturamos nada. Tente falar um pouco mais próximo do microfone.');
    } else {
      setStatus('Trecho capturado. Agora é só clicar em "Descobrir música".');
    }
  };

  rec.onerror = (event) => {
    console.error(event);
    setStatus(
      'Ocorreu um erro ao usar o microfone. Confira as permissões do navegador.',
      { isError: true }
    );
  };

  rec.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    const existing = queryInput.value.trim();
    queryInput.value = existing ? `${existing} ${transcript}`.trim() : transcript;
  };

  return rec;
}

micButton.addEventListener('click', () => {
  if (!recognition) {
    recognition = initSpeechRecognition();
    if (!recognition) {
      return;
    }
  }

  if (isListening) {
    recognition.stop();
  } else {
    setStatus('');
    recognition.start();
  }
});

