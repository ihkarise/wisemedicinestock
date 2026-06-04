import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { Medicine } from '../types';
import { initAuth, googleSignIn, getAccessToken } from '../auth';

// Google Sheet ID
const SPREADSHEET_ID = '14Wkx7ovPDIZoiKdMvtIQtcOWGanJ-VGa';

// Sheet column mapping (based on actual sheet headers):
// B = Medicine names
// C = Product Group Code (size: 100 ML, 30 ML, etc.)
// D = Potency
// E = Item Category Code (MT, DIL, etc.)
// F = Quantity
// G = Amout (cost/price)
// I = COMPANY 1

export function useGoogleSheetsSync() {
    const { syncComplete } = useStore();
    const [syncing, setSyncing] = useState(false);
    const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
        const unsubscribe = initAuth(
                () => setNeedsAuth(false),
                () => setNeedsAuth(true)
              );
        return unsubscribe;
  }, []);

  const handleLogin = async () => {
        try {
                const result = await googleSignIn();
                if (result) {
                          setNeedsAuth(false);
                          await syncData();
                }
        } catch (err) {
                console.error('Login failed:', err);
        }
  };

  const fetchWithSheetsApi = async (token: string) => {
        // Fetch sheet metadata to get the first sheet name
        const metaRes = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
          { headers: { Authorization: `Bearer ${token}` } }
              );
        if (!metaRes.ok) throw new Error('Failed to fetch spreadsheet metadata');
        const meta = await metaRes.json();
        const firstSheetName: string = meta.sheets[0].properties.title;

        // Fetch values from LIST sheet (where the actual medicine data is)
        const sheetName = meta.sheets.find((s: any) =>
                s.properties.title === 'LIST'
                                               )?.properties.title || firstSheetName;

        const valuesRes = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
              );
        if (!valuesRes.ok) throw new Error('Failed to fetch spreadsheet values');
        const valuesData = await valuesRes.json();
        const rows: string[][] = valuesData.values;
        if (!rows || rows.length < 2) return [];

        // Row 0 is headers. Map by index based on actual column positions.
        // The sheet has columns: A(row#), B(Medicine names), C(Product Group Code/size),
        // D(Potency), E(Item Category Code), F(Quantity), G(Amout/cost), H(order), I(COMPANY 1)
        const headerRow = rows[0].map((h: string) => (h || '').toLowerCase().trim());

        // Find column indices by header name (case-insensitive, flexible matching)
        const findCol = (patterns: string[]): number => {
                for (const pattern of patterns) {
                          const idx = headerRow.findIndex(h => h.includes(pattern));
                          if (idx >= 0) return idx;
                }
                return -1;
        };

        const nameCol = findCol(['medicine name', 'medicine names', 'name', 'item']);
        const sizeCol = findCol(['product group', 'size', 'group code']);
        const potencyCol = findCol(['potency']);
        const categoryCol = findCol(['item category', 'category code', 'category']);
        const qtyCol = findCol(['quantity', 'qty', 'stock']);
        const costCol = findCol(['amout', 'amount', 'cost', 'price', 'er head']);
        const companyCol = findCol(['company 1', 'company']);

        const records: Medicine[] = [];
        rows.slice(1).forEach((row: string[], index: number) => {
                const name = (nameCol >= 0 ? row[nameCol] : '') || '';
                if (!name || name.trim() === '') return; // skip empty rows

                                    const qtyStr = qtyCol >= 0 ? (row[qtyCol] || '0') : '0';
                const qty = parseInt(qtyStr, 10) || 0;
                const rawCategory = (categoryCol >= 0 ? row[categoryCol] : 'MT') || 'MT';
                const category = rawCategory.toUpperCase().includes('DIL') ? 'DIL' : 'MT';
                const potency = (potencyCol >= 0 ? row[potencyCol] : '') || 'Q';
                const size = (sizeCol >= 0 ? row[sizeCol] : '') || '100 ML';
                const company = (companyCol >= 0 ? row[companyCol] : '') || 'UNKNOWN';
                const cost = (costCol >= 0 ? row[costCol] : '') || '0';

                                    records.push({
                                              id: `SHEET-${index}-${name.substring(0, 8).replace(/\s/g, '').toUpperCase()}`,
                                              name: name.trim(),
                                              size: size.trim(),
                                              potency: potency.trim(),
                                              category,
                                              company: company.trim().toUpperCase(),
                                              cost: cost.trim(),
                                              qty,
                                    });
        });

        return records;
  };

  const syncData = useCallback(async () => {
        setSyncing(true);
        try {
                let token = await getAccessToken();
                if (!token) {
                          setNeedsAuth(true);
                          setSyncing(false);
                          return;
                }
                const freshMedicines = await fetchWithSheetsApi(token);
                const validMedicines = freshMedicines.filter(
                          (m: Medicine) => m.name !== ''
                        );
                syncComplete(validMedicines);
                console.log('Sync complete from Google Sheets', validMedicines.length, 'items');
        } catch (err) {
                console.error('Failed to sync from Google Sheets', err);
                setNeedsAuth(true);
        } finally {
                setSyncing(false);
        }
  }, [syncComplete]);

  return { syncing, syncData, needsAuth, handleLogin };
}
