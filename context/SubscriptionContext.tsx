import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { SubscriptionPlan, UserSubscription, DailyUsage } from '@/lib/types';

interface SubscriptionContextType {
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  currentPlan: SubscriptionPlan | null;
  dailyUsage: DailyUsage | null;
  isPremium: boolean;
  isTrialActive: boolean;
  loading: boolean;
  canSearch: () => boolean;
  canExpressInterest: () => boolean;
  canPublishListing: () => Promise<boolean>;
  incrementSearch: () => Promise<void>;
  incrementInterest: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  getFeature: (key: string) => any;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cdf');
    if (data) setPlans(data as SubscriptionPlan[]);
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!user) { setCurrentSubscription(null); setCurrentPlan(null); return; }
    const { data } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setCurrentSubscription(data as UserSubscription);
      setCurrentPlan((data as any).plan as SubscriptionPlan);
    } else {
      setCurrentSubscription(null);
      setCurrentPlan(null);
    }
  }, [user]);

  const fetchDailyUsage = useCallback(async () => {
    if (!user) { setDailyUsage(null); return; }
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .maybeSingle();

    if (data) {
      setDailyUsage(data as DailyUsage);
    } else {
      setDailyUsage(null);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPlans(), fetchSubscription(), fetchDailyUsage()])
      .finally(() => setLoading(false));
  }, [fetchPlans, fetchSubscription, fetchDailyUsage]);

  const isPremium = !!(currentPlan && currentPlan.price_cdf > 0 &&
    currentSubscription && ['active', 'trial'].includes(currentSubscription.status));

  const isTrialActive = !!(currentSubscription?.status === 'trial' &&
    currentSubscription.trial_ends_at &&
    new Date(currentSubscription.trial_ends_at) > new Date());

  const getFeature = (key: string) => {
    if (!currentPlan) {
      const role = profile?.role || 'tenant';
      const freePlan = plans.find(p => p.target_role === role && p.price_cdf === 0);
      return freePlan?.features?.[key];
    }
    return currentPlan.features?.[key];
  };

  const canSearch = () => {
    if (isPremium) return true;
    const limit = getFeature('searches_per_day');
    if (limit === -1) return true;
    return (dailyUsage?.search_count || 0) < (limit || 5);
  };

  const canExpressInterest = () => {
    if (isPremium) return true;
    const limit = getFeature('interests_per_week');
    if (limit === -1) return true;
    return true;
  };

  const canPublishListing = async () => {
    if (!user) return false;
    if (isPremium) return true;
    const limit = getFeature('max_listings');
    if (limit === -1) return true;
    const { count } = await supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('owner_id', user.id);
    return (count || 0) < (limit || 1);
  };

  const ensureDailyUsage = async () => {
    if (!user) return null;
    const today = new Date().toISOString().split('T')[0];
    if (dailyUsage && dailyUsage.usage_date === today) return dailyUsage;

    const { data } = await supabase
      .from('daily_usage')
      .upsert({ user_id: user.id, usage_date: today, search_count: 0, interest_count: 0 }, { onConflict: 'user_id,usage_date' })
      .select()
      .maybeSingle();

    if (data) {
      setDailyUsage(data as DailyUsage);
      return data as DailyUsage;
    }
    return null;
  };

  const incrementSearch = async () => {
    const usage = await ensureDailyUsage();
    if (!usage || !user) return;
    const { data } = await supabase
      .from('daily_usage')
      .update({ search_count: (usage.search_count || 0) + 1 })
      .eq('user_id', user.id)
      .eq('usage_date', usage.usage_date)
      .select()
      .maybeSingle();
    if (data) setDailyUsage(data as DailyUsage);
  };

  const incrementInterest = async () => {
    const usage = await ensureDailyUsage();
    if (!usage || !user) return;
    const { data } = await supabase
      .from('daily_usage')
      .update({ interest_count: (usage.interest_count || 0) + 1 })
      .eq('user_id', user.id)
      .eq('usage_date', usage.usage_date)
      .select()
      .maybeSingle();
    if (data) setDailyUsage(data as DailyUsage);
  };

  const refreshSubscription = async () => {
    await Promise.all([fetchSubscription(), fetchDailyUsage()]);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plans, currentSubscription, currentPlan, dailyUsage,
        isPremium, isTrialActive, loading,
        canSearch, canExpressInterest, canPublishListing,
        incrementSearch, incrementInterest, refreshSubscription, getFeature,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
