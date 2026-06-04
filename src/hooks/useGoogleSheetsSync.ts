import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { useStore } from '../store';
import { Medicine } from '../types';
import { initAuth, googleSignIn, getAccessToken } from '../auth';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/14Wkx7ovPDIZoiKdMvtIQtcOWGanJ-VGa/export?format=csv';
const SPREADSHEET_ID = '14Wkx7ovPDIZoiKdMvtIQtcOWGanJ-VGa';

export function useGoogleSheetsSync() {
  const { syncComplete } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      () => setNeedsAuth(false),
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
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
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      if (!metaRes.ok) throw new Error('Failed to fetch spreadsheet metadata');
      const meta = await metaRes.json();
      const firstSheetName = meta.sheets[0].properties.title;

      // Fetch values
      const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(firstSheetName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!valuesRes.ok) throw new Error('Failed to fetch spreadsheet values');
      const valuesData = await valuesRes.json();
      
      const rows = valuesData.values || [];
      if (rows.length < 2) return [];

      const headers = rows[0].map((h: string) => h.toLowerCase().trim());
      const records = rows.slice(1).map((row: any[]) => {
          const obj: any = {};
          headers.forEach((h: string, i: number) => {
              obj[h] = row[i] || '';
          });
          return obj;
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

      // We use the REST API values endpoint because export URL might require Drive scopes
      const data = await fetchWithSheetsApi(token);
      
      const freshMedicines: Medicine[] = data.map((row: any, index: number) => {
        // Find properties based on possible column names
        const name = row['name'] || row['medicine'] || row['item'] || `Unknown item ${index}`;
        const qtyStr = row['qty'] || row['quantity'] || row['stock'] || '0';
        const qty = parseInt(qtyStr, 10) || 0;
        const category = (row['category'] || 'MT').toUpperCase();
        const potency = row['potency'] || 'Q';
        const size = row['size'] || '100 ML';
        const company = row['company'] || 'UNKNOWN';
        const cost = row['cost'] || row['price'] || '';
        
        return {
            id: `SHEET-${index}-${name.trim().replace(/\s+/g, '-')}`,
            name: name.toUpperCase(),
            category: category.includes('DIL') ? 'DIL' : 'MT',
            potency,
            size,
            company: company.toUpperCase(),
            cost,
            qty,
            originalQty: qty,
            currentQty: qty,
            dispenseCount: 0,
            dispenseHistory: [],
            restockHistory: [],
            lastDispensed: null,
            addedToOrderAt: null
        } as Medicine;
      }).filter((m: Medicine) => m.name !== '');

      syncComplete(freshMedicines);
      console.log('Sync complete from Google Sheets');
    } catch (err) {
      console.error('Failed to sync from Google Sheets', err);
      // fallback to login in case token is expired 
      setNeedsAuth(true);
    } finally {
      setSyncing(false);
    }
  }, [syncComplete]);

  return { syncing, syncData, needsAuth, handleLogin };
}
