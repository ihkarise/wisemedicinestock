import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { useStore } from '../store';
import { Medicine } from '../types';

// Public CSV export URL — works without any OAuth token as long as
// the Google Sheet is shared as "Anyone with the link can view".
const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/14Wkx7ovPDIZoiKdMvtIQtcOWGanJ-VGa/export?format=csv&gid=1828864267';

// Column header patterns to match (case-insensitive, partial match)
const findCol = (headers: string[], patterns: string[]): number => {
  for (const pattern of patterns) {
    const idx = headers.findIndex((h) => h.toLowerCase().includes(pattern));
    if (idx >= 0) return idx;
  }
  return -1;
};

export function useGoogleSheetsSync() {
  const { syncComplete } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncData = useCallback(async () => {
    setSyncing(true);
    setError(null);

    try {
      // Fetch CSV via a CORS proxy (allorigins) because the Google Sheets
      // export endpoint does not send CORS headers for direct browser access.
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(SHEET_CSV_URL)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const csvText = await response.text();

      const parsed = Papa.parse<string[]>(csvText, {
        skipEmptyLines: true,
      });

      const rows: string[][] = parsed.data as string[][];
      if (!rows || rows.length < 2) {
        throw new Error('Sheet returned no data.');
      }

      // Row 0 = headers
      const headers = rows[0].map((h) => (h || '').trim());

      const nameCol    = findCol(headers, ['medicine names', 'medicine name', 'name', 'item']);
      const sizeCol    = findCol(headers, ['product group', 'size', 'group code']);
      const potencyCol = findCol(headers, ['potency']);
      const categoryCol= findCol(headers, ['item category', 'category code', 'category']);
      const qtyCol     = findCol(headers, ['quantity', 'qty', 'stock']);
      const costCol    = findCol(headers, ['amout', 'amount', 'cost', 'price', 'er head']);
      const companyCol = findCol(headers, ['company 1', 'company']);

      const freshMedicines: Medicine[] = [];

      rows.slice(1).forEach((row, idx) => {
        const name = (nameCol >= 0 ? row[nameCol] : '').trim();
        if (!name) return;

        const qty  = parseInt((qtyCol >= 0 ? row[qtyCol] : '0') || '0', 10) || 0;
        const rawCat = ((categoryCol >= 0 ? row[categoryCol] : '') || 'MT').toUpperCase();
        const category = rawCat.includes('DIL') ? 'DIL' : 'MT';
        const potency  = ((potencyCol >= 0 ? row[potencyCol] : '') || 'Q').trim();
        const size     = ((sizeCol >= 0 ? row[sizeCol] : '') || '100 ML').trim();
        const company  = ((companyCol >= 0 ? row[companyCol] : '') || 'UNKNOWN').trim().toUpperCase();
        const cost     = ((costCol >= 0 ? row[costCol] : '') || '0').trim();

        freshMedicines.push({
          id: `SHEET-${idx}-${name.substring(0, 8).replace(/\s/g, '').toUpperCase()}`,
          name,
          size,
          potency,
          category,
          company,
          cost,
          qty,
        });
      });

      syncComplete(freshMedicines);
      console.log(`[Sync] ${freshMedicines.length} medicines loaded from Google Sheets.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Sync] Failed:', msg);
      setError(msg);
    } finally {
      setSyncing(false);
    }
  }, [syncComplete]);

  return { syncing, syncData, error };
}
