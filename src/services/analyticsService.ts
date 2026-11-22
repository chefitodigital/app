import { supabase } from '../lib/supabase';
import { getSessionId } from '../lib/sessionManager';

export interface StoryViewStats {
  totalViews: number;
  uniqueSessions: number;
  viewsByDay: { date: string; views: number }[];
  last7Days: number;
  last30Days: number;
}

export interface ProductModalStats {
  totalViews: number;
  topProducts: {
    product_id: string;
    product_name: string;
    views: number;
  }[];
  viewsByDay: { date: string; views: number }[];
  last7Days: number;
  last30Days: number;
}

export async function trackStoryView(storyImageUrl: string): Promise<void> {
  try {
    const sessionId = getSessionId();

    await supabase
      .from('story_views')
      .insert({
        session_id: sessionId,
        story_image_url: storyImageUrl,
        viewed_at: new Date().toISOString(),
      });
  } catch (error) {
    console.warn('Erro ao rastrear visualização do story:', error);
  }
}

export async function trackProductModalView(
  productId: string,
  productName: string
): Promise<void> {
  try {
    const sessionId = getSessionId();

    await supabase
      .from('product_modal_views')
      .insert({
        product_id: productId,
        product_name: productName,
        session_id: sessionId,
        viewed_at: new Date().toISOString(),
      });
  } catch (error) {
    console.warn('Erro ao rastrear visualização do produto:', error);
  }
}

export async function getStoryViewStats(
  startDate?: Date,
  endDate?: Date
): Promise<StoryViewStats> {
  try {
    let query = supabase
      .from('story_views')
      .select('*');

    if (startDate) {
      query = query.gte('viewed_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('viewed_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    const totalViews = data?.length || 0;
    const uniqueSessions = new Set(data?.map(v => v.session_id)).size;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7Days = data?.filter(
      v => new Date(v.viewed_at) >= sevenDaysAgo
    ).length || 0;

    const last30Days = data?.filter(
      v => new Date(v.viewed_at) >= thirtyDaysAgo
    ).length || 0;

    const viewsByDay = data?.reduce((acc: Record<string, number>, view) => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const viewsByDayArray = Object.entries(viewsByDay || {})
      .map(([date, views]) => ({ date, views: views as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalViews,
      uniqueSessions,
      viewsByDay: viewsByDayArray,
      last7Days,
      last30Days,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do story:', error);
    return {
      totalViews: 0,
      uniqueSessions: 0,
      viewsByDay: [],
      last7Days: 0,
      last30Days: 0,
    };
  }
}

export async function getProductModalStats(
  startDate?: Date,
  endDate?: Date
): Promise<ProductModalStats> {
  try {
    let query = supabase
      .from('product_modal_views')
      .select('*');

    if (startDate) {
      query = query.gte('viewed_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('viewed_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    const totalViews = data?.length || 0;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7Days = data?.filter(
      v => new Date(v.viewed_at) >= sevenDaysAgo
    ).length || 0;

    const last30Days = data?.filter(
      v => new Date(v.viewed_at) >= thirtyDaysAgo
    ).length || 0;

    const productViews = data?.reduce((acc: Record<string, { name: string; count: number }>, view) => {
      if (!acc[view.product_id]) {
        acc[view.product_id] = { name: view.product_name, count: 0 };
      }
      acc[view.product_id].count++;
      return acc;
    }, {});

    const topProducts = Object.entries(productViews || {})
      .map(([product_id, { name, count }]) => ({
        product_id,
        product_name: name,
        views: count,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const viewsByDay = data?.reduce((acc: Record<string, number>, view) => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const viewsByDayArray = Object.entries(viewsByDay || {})
      .map(([date, views]) => ({ date, views: views as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalViews,
      topProducts,
      viewsByDay: viewsByDayArray,
      last7Days,
      last30Days,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de produtos:', error);
    return {
      totalViews: 0,
      topProducts: [],
      viewsByDay: [],
      last7Days: 0,
      last30Days: 0,
    };
  }
}
