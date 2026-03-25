import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const usePlannedVisits = () => {
  const [plannedVisits, setPlannedVisits] = useState([]);

  const fetchPlanned = useCallback(async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('planned_visits')
      .select('*')
      .eq('is_active', true)
      .gte('arrival_time', now)
      .order('arrival_time', { ascending: true });
    if (data) setPlannedVisits(data);
  }, []);

  useEffect(() => {
    fetchPlanned();

    const channel = supabase
      .channel('planned_visits_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planned_visits' }, fetchPlanned)
      .subscribe();

    // Re-fetch every 2 min to drop newly-expired entries
    const timer = setInterval(fetchPlanned, 120_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [fetchPlanned]);

  return { plannedVisits };
};
