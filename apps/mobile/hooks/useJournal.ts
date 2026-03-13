import { useState, useCallback } from 'react';
import { journalService } from '../services/journal';
import { useCircleStore } from '../stores/circleStore';

export function useJournal() {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { activeCircleId } = useCircleStore();

  const fetchEntries = useCallback(
    async (params?: { from?: string; to?: string; page?: number }) => {
      if (!activeCircleId) return;
      setLoading(true);
      try {
        const data = await journalService.list(activeCircleId, params);
        setEntries(data.entries);
        setTotal(data.total);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [activeCircleId]
  );

  const createEntry = async (data: any) => {
    if (!activeCircleId) return;
    const result = await journalService.create(activeCircleId, data);
    await fetchEntries();
    return result.entry;
  };

  const deleteEntry = async (entryId: string) => {
    if (!activeCircleId) return;
    await journalService.delete(activeCircleId, entryId);
    await fetchEntries();
  };

  return { entries, total, loading, fetchEntries, createEntry, deleteEntry };
}
