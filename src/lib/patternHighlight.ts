import { BINGO_CONFIG } from '../constants/bingo';

export const getPatternCells = (patternId: string): Set<string> => {
  const cells = new Set<string>();
  
  const addRow = (r: number) => {
    for (let c = 0; c < 5; c++) cells.add(`${r}-${c}`);
  };
  
  const addCol = (c: number) => {
    for (let r = 0; r < 5; r++) cells.add(`${r}-${c}`);
  };

  switch (patternId) {
    case 'full':
      for (let r = 0; r < 5; r++) addRow(r);
      break;

    case 'horizontal':
      // Any row works, but for highlighting let's indicate all rows loosely?
      // Or just highlight row 1, 3, 5? 
      // User said "se sombreara ligeramente la forma", for horizontal maybe just all?
      for (let r = 0; r < 5; r++) addRow(r);
      break;

    case 'vertical':
      for (let c = 0; c < 5; c++) addCol(c);
      break;

    case 'diagonal':
      for (let i = 0; i < 5; i++) {
        cells.add(`${i}-${i}`);
        cells.add(`${i}-${4 - i}`);
      }
      break;

    case 'plus':
      addRow(2);
      addCol(2);
      break;

    case 'equal':
      addRow(1);
      addRow(3);
      break;

    case 'pyramid':
      addRow(4);
      cells.add('3-1'); cells.add('3-2'); cells.add('3-3');
      cells.add('2-2');
      break;

    case 'letter_a':
      addRow(0);
      addRow(2);
      addCol(0);
      addCol(4);
      break;

    case 'letter_b':
      addCol(0); addCol(4);
      addRow(0); addRow(2); addRow(4);
      break;

    case 'letter_c':
      addRow(0); addRow(4); addCol(0);
      break;

    case 'letter_d':
      addCol(0); addCol(4); addRow(0); addRow(4);
      break;

    case 'letter_e':
      addRow(0); addRow(2); addRow(4); addCol(0);
      break;

    case 'letter_f':
      addRow(0); addRow(2); addCol(0);
      break;

    case 'letter_g':
      addRow(0); addRow(4); addCol(0);
      cells.add('2-2'); cells.add('2-3'); cells.add('2-4'); cells.add('3-4');
      break;

    case 'letter_h':
      addCol(0); addCol(4); addRow(2);
      break;

    case 'letter_i':
      addRow(0); addRow(4); addCol(2);
      break;

    case 'letter_j':
      addRow(0); addCol(2); cells.add('4-0'); cells.add('4-1');
      break;

    case 'letter_k':
      addCol(0);
      cells.add('2-1'); cells.add('1-2'); cells.add('0-3'); cells.add('3-2'); cells.add('4-3');
      break;

    case 'letter_l':
      addCol(0); addRow(4);
      break;

    case 'letter_m':
      addCol(0); addCol(4); cells.add('1-1'); cells.add('2-2'); cells.add('1-3');
      break;

    case 'letter_n':
      addCol(0); addCol(4); cells.add('1-1'); cells.add('2-2'); cells.add('3-3');
      break;

    case 'letter_o':
      addRow(0); addRow(4); addCol(0); addCol(4);
      break;

    case 'letter_p':
      addCol(0); addRow(0); addRow(2); cells.add('1-4');
      break;

    case 'letter_q':
      addRow(0); addRow(3); 
      for(let r=0; r<=3; r++) { cells.add(`${r}-0`); cells.add(`${r}-4`); }
      cells.add('4-4');
      break;

    case 'letter_r':
      addCol(0); addRow(0); addRow(2); cells.add('1-4'); cells.add('3-2'); cells.add('4-3');
      break;

    case 'letter_s':
      addRow(0); addRow(2); addRow(4); cells.add('1-0'); cells.add('3-4');
      break;

    case 'letter_t':
      addRow(0); addCol(2);
      break;

    case 'letter_u':
      addCol(0); addCol(4); addRow(4);
      break;

    case 'letter_v':
      for(let r=0; r<=2; r++) { cells.add(`${r}-0`); cells.add(`${r}-4`); }
      cells.add('3-1'); cells.add('3-3'); cells.add('4-2');
      break;

    case 'letter_w':
      addCol(0); addCol(4); cells.add('3-1'); cells.add('3-3'); cells.add('2-2');
      break;

    case 'letter_x':
      for (let i = 0; i < 5; i++) {
        cells.add(`${i}-${i}`);
        cells.add(`${i}-${4 - i}`);
      }
      break;

    case 'letter_y':
      cells.add('0-0'); cells.add('0-4'); cells.add('1-1'); cells.add('1-3');
      cells.add('2-2'); cells.add('3-2'); cells.add('4-2');
      break;

    case 'letter_z':
      addRow(0); addRow(4);
      for (let i = 0; i < 5; i++) cells.add(`${4 - i}-${i}`);
      break;
  }

  return cells;
};
