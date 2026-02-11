require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir os arquivos estáticos (frontend)
const publicDir = path.join(__dirname);
app.use(express.static(publicDir));

// --- "IA local" baseada em uma base simples de músicas ---
// Usada como fallback quando a IA externa (OpenAI) não estiver disponível
// ou retornar erro/limite de uso.

const songsDb = [
  // Pop/rock BR
  {
    title: 'Tô Nem Aí',
    artist: 'Luka',
    hints: [
      'to nem ai',
      'tô nem aí',
      'pode ficar com o seu novo amor',
      'pode ficar com quem você quiser',
      'eu não tô nem aí',
    ],
  },
  {
    title: 'Evidências',
    artist: 'Chitãozinho & Xororó',
    hints: [
      'quando eu digo que deixei de te amar',
      'eu me entrego',
      'evidências',
      'tenho que aceitar que não dá mais',
      'grito que te quero',
    ],
  },
  {
    title: 'Tempo Perdido',
    artist: 'Legião Urbana',
    hints: [
      'somos tão jovens',
      'todos os dias quando acordo',
      'é preciso amar as pessoas',
      'tempo perdido',
    ],
  },
  {
    title: 'Pais e Filhos',
    artist: 'Legião Urbana',
    hints: [
      'é preciso amar as pessoas',
      'como se não houvesse amanhã',
      'meu filho fica quieto',
      'pais e filhos',
    ],
  },
  {
    title: 'Pra Você Guardei o Amor',
    artist: 'Nando Reis & Ana Cañas',
    hints: [
      'pra você guardei o amor',
      'que aprendi vendo meus pais',
      'coisa que eu nunca soube',
    ],
  },
  {
    title: 'Azul',
    artist: 'Jota Quest',
    hints: ['fácil demais', 'tudo é tão azul', 'tão grande é o céu'],
  },
  {
    title: 'Dias Melhores',
    artist: 'Jota Quest',
    hints: [
      'dias melhores virão',
      'dias de paz',
      'pra sempre',
      'dias melhores pra sempre',
    ],
  },
  {
    title: 'Lanterna dos Afogados',
    artist: 'Paralamas do Sucesso',
    hints: [
      'quando tá escuro',
      'e ninguém te ouve',
      'quando chega a noite',
      'lanterna dos afogados',
    ],
  },

  // Sertanejo / universitário
  {
    title: 'Ai Se Eu Te Pego',
    artist: 'Michel Teló',
    hints: ['nossa nossa', 'assim você me mata', 'ai se eu te pego'],
  },
  {
    title: 'Camaro Amarelo',
    artist: 'Munhoz & Mariano',
    hints: [
      'agora eu fiquei doce',
      'doce doce doce',
      'camaro amarelo',
      'garota se prepara',
    ],
  },
  {
    title: 'Balada (Tchê Tcherere Tchê Tchê)',
    artist: 'Gusttavo Lima',
    hints: ['tchê tcherere tchê tchê', 'balada boa', 'celular tocando'],
  },
  {
    title: 'Dormi na Praça',
    artist: 'Bruno & Marrone',
    hints: [
      'eu bebi demais',
      'dormi na praça',
      'te trago flores',
      'te faço cafuné',
    ],
  },
  {
    title: 'Te Amo Cada Vez Mais',
    artist: 'Bruno & Marrone',
    hints: ['eu te amo', 'cada vez mais', 'toda vez que eu vejo você'],
  },

  // Pagode / samba
  {
    title: 'Depois do Prazer',
    artist: 'Só Pra Contrariar',
    hints: [
      'foi depois do prazer',
      'depois que eu te amei',
      'eu tentei fugir',
      'mas não deu',
    ],
  },
  {
    title: 'Que Se Chama Amor',
    artist: 'Só Pra Contrariar',
    hints: ['é o que se chama amor', 'eu me apaixonei por você'],
  },
  {
    title: 'Ainda Bem',
    artist: 'Thiaguinho',
    hints: ['ainda bem que te encontrei', 'agora sou mais feliz'],
  },
  {
    title: 'Deixa Acontecer',
    artist: 'Grupo Revelação',
    hints: ['deixa acontecer naturalmente', 'eu não quero ver você chorar'],
  },

  // Funk / pop recente
  {
    title: 'Show das Poderosas',
    artist: 'Anitta',
    hints: [
      'prepara que agora é hora',
      'show das poderosas',
      'que descem e rebolam',
    ],
  },
  {
    title: 'Bang',
    artist: 'Anitta',
    hints: ['bang bang', 'quando você for partir'],
  },
  {
    title: 'Morena',
    artist: 'Luan Santana',
    hints: [
      'morena',
      'me beija na boca',
      'me deixa louco',
      'na madrugada',
    ],
  },
  {
    title: 'Cheia de Manias',
    artist: 'Raça Negra',
    hints: [
      'você é do tipo de mulher',
      'cheia de manias',
      'toda dengosa',
      'menina bonita',
    ],
  },
  {
    title: 'Talismã',
    artist: 'Leandro & Leonardo',
    hints: [
      'você é luz',
      'é raio estrela e luar',
      'manhã de sol',
      'meu iáiá meu ioiô',
    ],
  },

  // MPB / clássicos
  {
    title: 'Gostava Tanto de Você',
    artist: 'Tim Maia',
    hints: [
      'não sei porque você se foi',
      'quantas saudades eu senti',
      'gostava tanto de você',
    ],
  },
  {
    title: 'Lanterna dos Afogados',
    artist: 'Paralamas do Sucesso',
    hints: [
      'quando tá escuro',
      'ninguém te ouve',
      'lanterna dos afogados',
    ],
  },
  {
    title: 'Você',
    artist: 'Tim Maia',
    hints: ['é você que ama o passado', 'não vê que o novo sempre vem'],
  },
  {
    title: 'Velha Infância',
    artist: 'Tribalistas',
    hints: [
      'você é assim',
      'um sonho pra mim',
      'você é mais do que sei',
      'velha infância',
    ],
  },
  {
    title: 'Sozinho',
    artist: 'Caetano Veloso',
    hints: [
      'amiga da minha mãe',
      'às vezes no silêncio da noite',
      'eu fico imaginando nós dois',
    ],
  },

  // Pop romântico 2000+
  {
    title: 'Amor Perfeito',
    artist: 'Sandy & Junior',
    hints: [
      'eu joguei tudo pro alto',
      'por você',
      'amor perfeito',
      'toda vez que eu te vejo',
    ],
  },
  {
    title: 'Borrow',
    artist: 'NX Zero',
    hints: ['razões e emoções', 'entre razões e emoções'],
  },
  {
    title: 'Razões e Emoções',
    artist: 'NX Zero',
    hints: ['entre razões e emoções', 'a saída você pode encontrar'],
  },
];

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findSongsHeuristic(query) {
  const normQuery = normalize(query);
  if (!normQuery) return [];

  const words = normQuery.split(' ').filter((w) => w.length > 2);

  const scored = songsDb
    .map((song) => {
      const fullText = normalize(
        [song.title, song.artist, ...(song.hints || [])].join(' ')
      );

      let score = 0;

      if (fullText.includes(normQuery)) {
        score += 5;
      }

      for (const w of words) {
        if (fullText.includes(w)) {
          score += 2;
        }
      }

      return { song, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map((entry) => ({
    title: entry.song.title,
    artist: entry.song.artist,
  }));
}

// --- Enriquecimento com capas reais via iTunes Search API ---
// API pública, sem chave. Usamos apenas para tentar obter artwork da música.

async function addCoversToSongs(songs) {
  if (!songs || !songs.length) return [];

  const enriched = await Promise.all(
    songs.map(async (song) => {
      const base = {
        title: song.title,
        artist: song.artist,
      };

      try {
        const term = encodeURIComponent(
          `${song.title || ''} ${song.artist || ''}`.trim() ||
            song.title ||
            ''
        );
        if (!term) return base;

        const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`;
        const response = await axios.get(url);
        const result = response.data?.results?.[0];
        if (!result || !result.artworkUrl100) return base;

        // Usar uma versão maior da capa, se disponível
        const coverUrl = result.artworkUrl100.replace('100x100', '200x200');

        return {
          ...base,
          coverUrl,
        };
      } catch (error) {
        // Em caso de erro na capa, apenas segue sem coverUrl
        return base;
      }
    })
  );

  return enriched;
}

// --- IA externa local (Ollama) para sugerir músicas a partir do trecho ---
// Opcional: se o Ollama não estiver rodando, usamos apenas o heurístico acima.
// Requer:
//  - Ollama instalado e em execução em http://localhost:11434
//  - Um modelo de linguagem baixado, por exemplo: `ollama pull llama3.2:3b`
//  - (Opcional) configurar OLLAMA_MODEL no .env, ex.: OLLAMA_MODEL=llama3.2:3b

async function findSongsWithAI(query) {
  const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';

  try {
    const response = await axios.post(`${baseUrl}/api/chat`, {
      model,
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'Você recebe trechos confusos de músicas (em qualquer idioma), muitas vezes com erros ou pedaços faltando. ' +
            'Seu trabalho é sugerir quais músicas a pessoa provavelmente está tentando lembrar. ' +
            'Responda EXCLUSIVAMENTE em JSON, no formato:\n' +
            '{ "songs": [ { "title": "nome da música", "artist": "artista" }, ... ] }\n' +
            'Inclua de 1 a 5 opções mais prováveis. Não adicione nenhum texto fora do JSON.',
        },
        {
          role: 'user',
          content: `Trecho informado pelo usuário: "${query}"`,
        },
      ],
    });

    const content = response.data?.message?.content;
    if (!content) {
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (jsonError) {
      console.error('Falha ao fazer parse do JSON da IA (Ollama):', jsonError.message);
      return [];
    }

    if (!parsed || !Array.isArray(parsed.songs)) {
      return [];
    }

    return parsed.songs
      .filter((s) => s && (s.title || s.artist))
      .map((s) => ({
        title: s.title || 'Música desconhecida',
        artist: s.artist || '',
      }));
  } catch (error) {
    console.error(
      'Erro ao chamar IA (Ollama) para sugerir músicas:',
      error.message
    );
    // Em qualquer erro (Ollama desligado, modelo ausente etc.), caímos para o heurístico.
    return [];
  }
}

// --- Endpoint principal usado pelo frontend ---

app.post('/api/buscar-musica', async (req, res) => {
  const { query } = req.body || {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({
      error: 'Envie um campo "query" com o trecho ou descrição da música.',
    });
  }

  try {
    const trimmed = query.trim();

    // 1) Tentar descobrir as músicas com IA (Ollama), se disponível
    let songs = await findSongsWithAI(trimmed);

    // 2) Se a IA não estiver disponível ou não sugerir nada, usar heurística local
    if (!songs || songs.length === 0) {
      songs = findSongsHeuristic(trimmed);
    }

    // 3) Tentar enriquecer com capas reais
    const songsWithCovers = await addCoversToSongs(songs);

    return res.json({
      queryOriginal: trimmed,
      songs: songsWithCovers,
    });
  } catch (error) {
    console.error('Erro no /api/buscar-musica:', error);
    return res.status(500).json({
      error:
        'Ocorreu um erro ao tentar encontrar a música. Tente novamente em alguns instantes.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

