export const BINGO_CONFIG = {
  RANGES: {
    B: [1, 15],
    I: [16, 30],
    N: [31, 45],
    G: [46, 60],
    O: [61, 75],
  },
  RANGES_100: {
    B: [1, 20],
    I: [21, 40],
    N: [41, 60],
    G: [61, 80],
    O: [81, 100],
  },
  COLUMNS: ['B', 'I', 'N', 'G', 'O'] as const,
  GRID_SIZE: 5,
  CENTER_INDEX: 2,
  DRAW_INTERVAL_MS: 30000,
  getLetter: (num: number, limit: 75 | 100 = 75): string => {
    const ranges = limit === 100 ? BINGO_CONFIG.RANGES_100 : BINGO_CONFIG.RANGES;
    for (const [letter, [min, max]] of Object.entries(ranges)) {
      if (num >= min && num <= max) return letter;
    }
    return '';
  }
};

export const WINNING_PATTERNS = [
  { id: 'full', name: 'Tabla Llena', description: 'Marca todos los números de tu cartón para ganar.' },
  { id: 'horizontal', name: 'Línea Horizontal', description: 'Completa cualquier fila horizontal de 5 números.' },
  { id: 'vertical', name: 'Línea Vertical', description: 'Completa cualquier columna vertical de 5 números.' },
  { id: 'diagonal', name: 'Diagonal 45°', description: 'Completa cualquiera de las dos grandes diagonales (X).' },
  { id: 'pyramid', name: 'Pirámide', description: 'Forma una base en la última fila y sube hasta el centro.' },
  { id: 'plus', name: 'Signo Más (+)', description: 'Completa la fila y la columna central formando una cruz.' },
  { id: 'equal', name: 'Signo Igual (=)', description: 'Completa la segunda y cuarta fila horizontal.' },
  // Alphabet
  { id: 'letter_a', name: 'Letra A', description: 'Forma la letra A en el cartón.' },
  { id: 'letter_b', name: 'Letra B', description: 'Forma la letra B en el cartón.' },
  { id: 'letter_c', name: 'Letra C', description: 'Forma la letra C en el cartón.' },
  { id: 'letter_d', name: 'Letra D', description: 'Forma la letra D en el cartón.' },
  { id: 'letter_e', name: 'Letra E', description: 'Forma la letra E en el cartón.' },
  { id: 'letter_f', name: 'Letra F', description: 'Forma la letra F en el cartón.' },
  { id: 'letter_g', name: 'Letra G', description: 'Forma la letra G en el cartón.' },
  { id: 'letter_h', name: 'Letra H', description: 'Forma la letra H en el cartón.' },
  { id: 'letter_i', name: 'Letra I', description: 'Forma la letra I en el cartón.' },
  { id: 'letter_j', name: 'Letra J', description: 'Forma la letra J en el cartón.' },
  { id: 'letter_k', name: 'Letra K', description: 'Forma la letra K en el cartón.' },
  { id: 'letter_l', name: 'Letra L', description: 'Forma la letra L en el cartón.' },
  { id: 'letter_m', name: 'Letra M', description: 'Forma la letra M en el cartón.' },
  { id: 'letter_n', name: 'Letra N', description: 'Forma la letra N en el cartón.' },
  { id: 'letter_o', name: 'Letra O', description: 'Forma la letra O en el cartón.' },
  { id: 'letter_p', name: 'Letra P', description: 'Forma la letra P en el cartón.' },
  { id: 'letter_q', name: 'Letra Q', description: 'Forma la letra Q en el cartón.' },
  { id: 'letter_r', name: 'Letra R', description: 'Forma la letra R en el cartón.' },
  { id: 'letter_s', name: 'Letra S', description: 'Forma la letra S en el cartón.' },
  { id: 'letter_t', name: 'Letra T', description: 'Forma la letra T en el cartón.' },
  { id: 'letter_u', name: 'Letra U', description: 'Forma la letra U en el cartón.' },
  { id: 'letter_v', name: 'Letra V', description: 'Forma la letra V en el cartón.' },
  { id: 'letter_w', name: 'Letra W', description: 'Forma la letra W en el cartón.' },
  { id: 'letter_x', name: 'Letra X', description: 'Forma la letra X en el cartón.' },
  { id: 'letter_y', name: 'Letra Y', description: 'Forma la letra Y en el cartón.' },
  { id: 'letter_z', name: 'Letra Z', description: 'Forma la letra Z en el cartón.' },
];

export type GameStatus = 'waiting' | 'playing' | 'finished';
