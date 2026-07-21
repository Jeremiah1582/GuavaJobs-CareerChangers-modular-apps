import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

const curatedBoardSchema = z.object({
  atsType: z.enum(['greenhouse', 'lever', 'ashby']),
  board: z.string().min(1),
  company: z.string().min(1),
  countries: z.array(z.string().min(2).max(2)).min(1),
});

export const curatedBoardsFileSchema = z.array(curatedBoardSchema).min(1);

export type CuratedBoard = z.infer<typeof curatedBoardSchema>;

let cached: CuratedBoard[] | null = null;

function readBoardsFile(): unknown {
  const filePath = join(__dirname, 'curated-boards.json');
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function loadCuratedBoards(): CuratedBoard[] {
  if (cached) {
    return cached;
  }
  cached = curatedBoardsFileSchema.parse(readBoardsFile());
  return cached;
}

export function findCuratedBoard(
  atsType: string,
  board: string,
): CuratedBoard | undefined {
  const needle = board.toLowerCase();
  return loadCuratedBoards().find(
    (entry) => entry.atsType === atsType && entry.board.toLowerCase() === needle,
  );
}

/** Exported for tests that need to assert schema shape without relying on file I/O. */
export function parseCuratedBoards(raw: unknown): CuratedBoard[] {
  return curatedBoardsFileSchema.parse(raw);
}

export function resetCuratedBoardsCacheForTests(): void {
  cached = null;
}
