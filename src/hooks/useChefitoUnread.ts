import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useChefitoUnread(enabled: boolean, location: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) { setCount(0); return; }
    let active = true;
    const refresh = async () => {
      const [ads, views] = await Promise.all([
        supabase.from('platform_ads').select('id'),
        supabase.from('platform_ad_views').select('ad_id'),
      ]);
      if (!active || ads.error || views.error) return;
      const seen = new Set(views.data.map(view => view.ad_id));
      setCount(ads.data.filter(ad => !seen.has(ad.id)).length);
    };
    void refresh();
    window.addEventListener('chefito-ads-viewed', refresh);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('chefito-ads-viewed', refresh); window.removeEventListener('focus', refresh); };
  }, [enabled, location]);
  return count;
}
