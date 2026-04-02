import { useState, useCallback } from 'react';
import { medicationService } from '../services/medications';
import { useCircleStore } from '../stores/circleStore';
import { isDemoMode, DEMO_MEDICATIONS } from '../utils/demoData';

export function useMedications() {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeCircleId } = useCircleStore();

  const fetchMedications = useCallback(async () => {
    if (!activeCircleId) return;
    if (isDemoMode()) {
      setMedications(DEMO_MEDICATIONS);
      return;
    }
    setLoading(true);
    try {
      const data = await medicationService.list(activeCircleId, true);
      setMedications(data.medications);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [activeCircleId]);

  const createMedication = async (data: any) => {
    if (!activeCircleId) return;
    const result = await medicationService.create(activeCircleId, data);
    await fetchMedications();
    return result.medication;
  };

  const logDose = async (medId: string, data: { scheduledFor: string; status: 'TAKEN' | 'SKIPPED'; skippedReason?: string }) => {
    if (!activeCircleId) return;
    await medicationService.logDose(activeCircleId, medId, data);
    await fetchMedications();
  };

  return { medications, loading, fetchMedications, createMedication, logDose };
}
