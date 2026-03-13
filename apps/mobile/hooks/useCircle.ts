import { useState, useEffect, useCallback } from 'react';
import { useCircleStore } from '../stores/circleStore';
import { circleService } from '../services/circles';

export function useCircle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { circles, setCircles, activeCircleId } = useCircleStore();

  const fetchCircles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await circleService.list();
      setCircles(data.circles);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load circles');
    } finally {
      setLoading(false);
    }
  }, [setCircles]);

  const createCircle = async (data: { name: string; careRecipient: string; recipientDob?: string }) => {
    const result = await circleService.create(data);
    await fetchCircles();
    return result.circle;
  };

  const inviteMember = async (circleId: string, email: string, role?: string) => {
    return circleService.invite(circleId, { email, role });
  };

  return {
    circles,
    activeCircleId,
    loading,
    error,
    fetchCircles,
    createCircle,
    inviteMember,
  };
}
