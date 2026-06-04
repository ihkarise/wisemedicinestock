import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { useStore } from '../store';
import { Medicine } from '../types';

const SHEET_ID = '14Wkx7ovPDIZoiKdMvtIQtcOWGanJ-VGa';
const SHEET_NAME = 'LIST';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
const PROXY_URL = `https://corsproxy.io/?${encodeURIComponent(CSV_URL)}`;

const findCol = (headers: string[], patterns: string[]): number => {
  for (const pattern of patterns) {
    const idx = headers.findIndex(h =>
      h.toLowerCase().includes(pattern.toLowerCase())
    );
    if (idx !== -1) return idx;
  }
  return -1;
};

export function useGoogleSheetsSync() {
  const { syncComplete } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncData, setSyncData] = useState<Medicine[] | null>(null);

  const syncSheet = useCallback(async () => {
    setSyncing(true);
    setError(null);

    try {
      console.log('[Sync] Fetching via corsproxy.io...');
      const response = await fetch(PROXY_URL, { signal: AbortSignal.timeout(20000) });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      console.log('[Sync] CSV received, length:', csvText.length);

      const parsed = Papa.parse<string[]>(csvText, {
        skipEmptyLines: true,
      });

      if (!parsed.data || parsed.data.length < 2) {
        throw new Error('No data rows found in sheet');
      }

      const headers = (parsed.data[0] as string[]).map(h => h.trim());
      console.log('[Sync] Headers:', headers);

      const nameCol   = findCol(headers, ['medicine names', 'medicine', 'name']);
      const sizeCol   = findCol(headers, ['product group', 'size', 'group']);
      const potCol    = findCol(headers, ['potency', 'pot']);
      const catCol    = findCol(headers, ['item category', 'category', 'cat']);
      const qtyCol    = findCol(headers, ['quantity', 'qty', 'stock']);
      const priceCol  = findCol(headers, ['amout', 'amount', 'price', 'cost']);
      const compCol   = findCol(headers, ['company', 'comp']);

      const medicines: Medicine[] = [];
      let skipped = 0;

      for (let i = 1; i < parsed.data.length; i++) {
        const row = parsed.data[i] as string[];
        const name = nameCol >= 0 ? (row[nameCol] || '').trim() : '';
        if (!name || name.toLowerCase() === 'medicine names') {
          skipped++;
          continue;
        }

        const qty = qtyCol >= 0 ? parseInt(row[qtyCol] || '0', 10) : 0;

        medicines.push({
          id: `sheet-${i}`,
          name,
          size:     sizeCol  >= 0 ? (row[sizeCol]  || '').trim() : '',
          potency:  potCol   >= 0 ? (row[potCol]   || '').trim() : '',
          category: catCol   >= 0 ? (row[catCol]   || '').trim() : '',
          quantity: isNaN(qty) ? 0 : qty,
          price:    priceCol >= 0 ? parseFloat(row[priceCol] || '0') || 0 : 0,
          company:  compCol  >= 0 ? (row[compCol]  || '').trim() : '',
        });
      }

      console.log(`[Sync] Parsed ${medicines.length} medicines, skipped ${skipped} rows`);

      syncComplete(medicines);
      setSyncData(medicines);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Sync] Failed:', msg);
      setError(msg);
    } finally {
      setSyncing(false);
    }
  }, [syncComplete]);

  return { syncing, syncData, error, syncSheet };
}
