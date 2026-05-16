import { BINGO_CONFIG } from '../constants/bingo';
import { getPatternCells } from './patternHighlight';

export const checkPattern = (
  card: number[][],
  drawnNumbers: number[],
  patternId: string
): boolean => {
  const patternCells = getPatternCells(patternId);
  const drawnSet = new Set(drawnNumbers);

  for (const cellKey of patternCells) {
    const [row, col] = cellKey.split('-').map(Number);
    const val = card[row][col];
    
    // 0 is FREE space
    if (val !== 0 && !drawnSet.has(val)) {
      return false;
    }
  }

  return true;
};

export const validateClaimStatus = (
  card: number[][],
  localMarkedKeys: string[],
  drawnNumbers: number[],
  patternId: string
): { isValid: boolean; error?: string } => {
  const drawnSet = new Set(drawnNumbers);

  // 1. Check if user marked something that hasn't been drawn
  for (const key of localMarkedKeys) {
    const [row, col] = key.split('-').map(Number);
    const val = card[row][col];
    if (val !== 0 && !drawnSet.has(val)) {
      return { 
        isValid: false, 
        error: `Has marcado el número ${val}, pero aún no ha salido en el sorteo.` 
      };
    }
  }

  // 2. Check if the pattern is complete
  const patternCells = getPatternCells(patternId);
  const missingNumbers: number[] = [];

  for (const cellKey of patternCells) {
    const [row, col] = cellKey.split('-').map(Number);
    const val = card[row][col];
    
    if (val !== 0 && !drawnSet.has(val)) {
      missingNumbers.push(val);
    }
  }

  if (missingNumbers.length > 0) {
    return { 
      isValid: false, 
      error: `Te faltan números para completar la figura: ${missingNumbers.slice(0, 3).join(', ')}${missingNumbers.length > 3 ? '...' : ''}` 
    };
  }

  return { isValid: true };
};
