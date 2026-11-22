import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import toast from 'react-hot-toast';
import { setChefFavicon, updateThemeColor } from '../lib/favicon';
import { loadGoogleFonts, ensurePreconnect } from '../lib/fonts';
import { getCurrentOwnerId } from '../lib/businessFetch';

type RestaurantSettings = Database['public']['Tables']['restaurant_settings']['Row'];

interface OperatingHours {
  weekdaysLabel: string;
  weekendsLabel: string;
  weekdays: string;
  weekends: string;
}

interface ThemeStore {
  settings: RestaurantSettings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<RestaurantSettings>) => Promise<void>;
  applyTheme: (settings: RestaurantSettings) => void;
  formatCurrency: (value: number) => string;
}

const DEFAULT_OPERATING_HOURS: OperatingHours = {
  weekdaysLabel: 'Segunda à Sexta',
  weekendsLabel: 'Sábado e Domingo',
  weekdays: '11h às 23h',
  weekends: '11h às 00h'
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      settings: null,
      applyTheme: (settings) => {
        try {
          ensurePreconnect();

          const fonts = [settings.title_font, settings.body_font, settings.button_font];
          loadGoogleFonts(fonts);

          document.documentElement.style.setProperty('--color-accent', settings.accent_color);
          document.documentElement.style.setProperty('--font-title', settings.title_font);
          document.documentElement.style.setProperty('--font-body', settings.body_font);
          document.documentElement.style.setProperty('--font-button', settings.button_font);

          void setChefFavicon(settings.accent_color);
          updateThemeColor(settings.accent_color);
        } catch (error) {
          console.error('Error applying theme:', error);
        }
      },
      formatCurrency: (value: number) => {
        const currency = 'BRL';
        const locale = 'pt-BR';
        const formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        
        return formatter.format(value);
      },
      loadSettings: async () => {
        try {
          // Check if Supabase is properly initialized
          if (!supabase) {
            throw new Error('Supabase client not initialized');
          }

          // RLS validates access to the private table; the session only selects which view to request.
          const { data: { session } } = await supabase.auth.getSession();
          const settingsSource = session?.user.id === getCurrentOwnerId()
            ? 'restaurant_settings'
            : 'business_public_settings';

          // Add retry logic for fetching settings
          let retries = 3;
          let error;

          while (retries > 0) {
            try {
              const { data, error: fetchError } = await supabase
                .from(settingsSource as 'restaurant_settings')
                .select('*')
                .single();

              if (fetchError) throw fetchError;

              if (data) {
                let storyImages = data.story_images || [];

                if (storyImages.length === 0 && data.story_image_url) {
                  storyImages = [{
                    id: crypto.randomUUID(),
                    url: data.story_image_url,
                    order: 0
                  }];
                }

                const settings = {
                  ...data,
                  social_links: data.social_links || {},
                  custom_tag_name: data.custom_tag_name || 'Personalizado',
                  logo_url: data.logo_url || null,
                  favicon_url: data.favicon_url || null,
                  about_us_image_url: data.about_us_image_url || null,
                  operating_hours: data.operating_hours || DEFAULT_OPERATING_HOURS,
                  story_image_url: data.story_image_url || null,
                  story_images: storyImages,
                  story_image_format: data.story_image_format || 'vertical',
                  story_enabled: data.story_enabled ?? false,
                  story_auto_open: data.story_auto_open ?? false,
                  product_card_description_lines: data.product_card_description_lines ?? 4,
                  whatsapp_auto_send: data.whatsapp_auto_send ?? false,
                  mbway_phone: data.mbway_phone ?? null,
                  mbway_reference_prefix: data.mbway_reference_prefix ?? null,
                  mbway_enabled: data.mbway_enabled ?? false,
                  delivery_fee_enabled: data.delivery_fee_enabled ?? false,
                  delivery_base_price: data.delivery_base_price ?? 0,
                  delivery_price_per_km: data.delivery_price_per_km ?? 0,
                  delivery_minimum_order_value: data.delivery_minimum_order_value ?? 0,
                  restaurant_lat: data.restaurant_lat ?? null,
                  restaurant_lng: data.restaurant_lng ?? null,
                  loyalty_enabled: data.loyalty_enabled ?? false,
                  loyalty_points_per_euro: data.loyalty_points_per_euro ?? 1,
                  loyalty_points_per_euro_discount: data.loyalty_points_per_euro_discount ?? 100,
                  operating_schedule: data.operating_schedule ?? null,
                  reservations_enabled: data.reservations_enabled ?? false,
                  reservation_duration_min: data.reservation_duration_min ?? 90,
                  reservation_min_advance_min: data.reservation_min_advance_min ?? 120,
                  reservation_max_advance_days: data.reservation_max_advance_days ?? 30,
                  country: 'BR' as const,
                  pix_enabled: data.pix_enabled ?? false,
                  pix_key: data.pix_key ?? null,
                  pix_key_type: data.pix_key_type ?? null,
                  pix_beneficiary_name: data.pix_beneficiary_name ?? null,
                };

                set({ settings });
                get().applyTheme(settings);
                return;
              }

              throw new Error('Configurações do negócio não encontradas');
            } catch (e) {
              error = e;
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }

          if (retries === 0 && error) {
            throw error;
          }
        } catch (error) {
          console.error('Error loading settings:', error);
          toast.error('Erro ao carregar configurações');
          
          throw error;
        }
      },
      updateSettings: async (newSettings) => {
        try {
          const { data: existingSettings } = await supabase
            .from('restaurant_settings')
            .select('*')
            .single();

          const updateData = {
            name: newSettings.name || existingSettings?.name || '',
            accent_color: newSettings.accent_color || existingSettings?.accent_color || '#212529',
            title_font: newSettings.title_font || existingSettings?.title_font || 'Gowun Dodum',
            body_font: newSettings.body_font || existingSettings?.body_font || 'Gowun Dodum',
            button_font: newSettings.button_font || existingSettings?.button_font || 'Gowun Dodum',
            restaurant_icon: newSettings.restaurant_icon || existingSettings?.restaurant_icon || 'utensils',
            currency: 'BRL',
            has_delivery: newSettings.has_delivery ?? existingSettings?.has_delivery ?? true,
            has_table_service: newSettings.has_table_service ?? existingSettings?.has_table_service ?? true,
            has_takeaway: newSettings.has_takeaway ?? existingSettings?.has_takeaway ?? true,
            custom_button_text: newSettings.custom_button_text ?? existingSettings?.custom_button_text ?? '',
            custom_button_url: newSettings.custom_button_url ?? existingSettings?.custom_button_url ?? '',
            order_confirmation_message: newSettings.order_confirmation_message ?? existingSettings?.order_confirmation_message ?? '',
            custom_tag_name: newSettings.custom_tag_name || existingSettings?.custom_tag_name || 'Personalizado',
            logo_url: 'logo_url' in newSettings ? newSettings.logo_url : (existingSettings?.logo_url ?? null),
            favicon_url: 'favicon_url' in newSettings ? newSettings.favicon_url : (existingSettings?.favicon_url ?? null),
            about_us_image_url: 'about_us_image_url' in newSettings ? newSettings.about_us_image_url : (existingSettings?.about_us_image_url ?? null),
            operating_hours: newSettings.operating_hours ?? existingSettings?.operating_hours ?? DEFAULT_OPERATING_HOURS,
            social_links: {
              ...(existingSettings?.social_links || {}),
              ...(newSettings.social_links || {})
            },
            about_us: newSettings.about_us ?? existingSettings?.about_us ?? '',
            location: newSettings.location ?? existingSettings?.location ?? '',
            story_image_url: 'story_image_url' in newSettings ? newSettings.story_image_url : (existingSettings?.story_image_url ?? null),
            story_images: 'story_images' in newSettings ? newSettings.story_images : (existingSettings?.story_images ?? []),
            story_image_format: newSettings.story_image_format || existingSettings?.story_image_format || 'vertical',
            story_enabled: newSettings.story_enabled ?? existingSettings?.story_enabled ?? false,
            story_auto_open: newSettings.story_auto_open ?? existingSettings?.story_auto_open ?? false,
            product_card_description_lines: newSettings.product_card_description_lines ?? existingSettings?.product_card_description_lines ?? 4,
            whatsapp_auto_send: newSettings.whatsapp_auto_send ?? existingSettings?.whatsapp_auto_send ?? false,
            mbway_phone: 'mbway_phone' in newSettings ? (newSettings.mbway_phone ?? null) : (existingSettings?.mbway_phone ?? null),
            mbway_reference_prefix: 'mbway_reference_prefix' in newSettings ? (newSettings.mbway_reference_prefix ?? null) : (existingSettings?.mbway_reference_prefix ?? null),
            mbway_enabled: newSettings.mbway_enabled ?? existingSettings?.mbway_enabled ?? false,
            delivery_fee_enabled: newSettings.delivery_fee_enabled ?? existingSettings?.delivery_fee_enabled ?? false,
            delivery_base_price: newSettings.delivery_base_price ?? existingSettings?.delivery_base_price ?? 0,
            delivery_price_per_km: newSettings.delivery_price_per_km ?? existingSettings?.delivery_price_per_km ?? 0,
            delivery_minimum_order_value: newSettings.delivery_minimum_order_value ?? existingSettings?.delivery_minimum_order_value ?? 0,
            restaurant_lat: 'restaurant_lat' in newSettings ? (newSettings.restaurant_lat ?? null) : (existingSettings?.restaurant_lat ?? null),
            restaurant_lng: 'restaurant_lng' in newSettings ? (newSettings.restaurant_lng ?? null) : (existingSettings?.restaurant_lng ?? null),
            loyalty_enabled: newSettings.loyalty_enabled ?? existingSettings?.loyalty_enabled ?? false,
            loyalty_points_per_euro: newSettings.loyalty_points_per_euro ?? existingSettings?.loyalty_points_per_euro ?? 1,
            loyalty_points_per_euro_discount: newSettings.loyalty_points_per_euro_discount ?? existingSettings?.loyalty_points_per_euro_discount ?? 100,
            operating_schedule: 'operating_schedule' in newSettings ? (newSettings.operating_schedule ?? null) : (existingSettings?.operating_schedule ?? null),
            reservations_enabled: newSettings.reservations_enabled ?? existingSettings?.reservations_enabled ?? false,
            reservation_duration_min: newSettings.reservation_duration_min ?? existingSettings?.reservation_duration_min ?? 90,
            reservation_min_advance_min: newSettings.reservation_min_advance_min ?? existingSettings?.reservation_min_advance_min ?? 120,
            reservation_max_advance_days: newSettings.reservation_max_advance_days ?? existingSettings?.reservation_max_advance_days ?? 30,
            country: 'BR' as const,
            pix_enabled: newSettings.pix_enabled ?? existingSettings?.pix_enabled ?? false,
            pix_key: 'pix_key' in newSettings ? newSettings.pix_key : (existingSettings?.pix_key ?? null),
            pix_key_type: 'pix_key_type' in newSettings ? newSettings.pix_key_type : (existingSettings?.pix_key_type ?? null),
            pix_beneficiary_name: 'pix_beneficiary_name' in newSettings ? newSettings.pix_beneficiary_name : (existingSettings?.pix_beneficiary_name ?? null),
          };

          let result;
          
          if (existingSettings) {
            // Update existing settings
            const { data, error } = await supabase
              .from('restaurant_settings')
              .update(updateData)
              .eq('id', existingSettings.id)
              .select()
              .single();
            
            if (error) throw error;
            result = data;
          } else {
            // Create new settings
            const { data, error } = await supabase
              .from('restaurant_settings')
              .insert([updateData])
              .select()
              .single();
            
            if (error) throw error;
            result = data;
          }

          if (result) {
            const settings = {
              ...result,
              social_links: result.social_links || {},
              custom_tag_name: result.custom_tag_name || 'Personalizado',
              logo_url: result.logo_url || null,
              favicon_url: result.favicon_url || null,
              about_us_image_url: result.about_us_image_url || null,
              operating_hours: result.operating_hours || DEFAULT_OPERATING_HOURS,
              story_image_url: result.story_image_url || null,
              story_images: result.story_images || [],
              story_image_format: result.story_image_format || 'vertical',
              story_enabled: result.story_enabled ?? false,
              story_auto_open: result.story_auto_open ?? false,
              product_card_description_lines: result.product_card_description_lines ?? 4,
              whatsapp_auto_send: result.whatsapp_auto_send ?? false,
              mbway_phone: result.mbway_phone ?? null,
              mbway_reference_prefix: result.mbway_reference_prefix ?? null,
              mbway_enabled: result.mbway_enabled ?? false,
              delivery_fee_enabled: result.delivery_fee_enabled ?? false,
              delivery_base_price: result.delivery_base_price ?? 0,
              delivery_price_per_km: result.delivery_price_per_km ?? 0,
              delivery_minimum_order_value: result.delivery_minimum_order_value ?? 0,
              restaurant_lat: result.restaurant_lat ?? null,
              restaurant_lng: result.restaurant_lng ?? null,
              loyalty_enabled: result.loyalty_enabled ?? false,
              loyalty_points_per_euro: result.loyalty_points_per_euro ?? 1,
              loyalty_points_per_euro_discount: result.loyalty_points_per_euro_discount ?? 100,
              operating_schedule: result.operating_schedule ?? null,
              reservations_enabled: result.reservations_enabled ?? false,
              reservation_duration_min: result.reservation_duration_min ?? 90,
              reservation_min_advance_min: result.reservation_min_advance_min ?? 120,
              reservation_max_advance_days: result.reservation_max_advance_days ?? 30,
              country: 'BR' as const,
              pix_enabled: result.pix_enabled ?? false,
              pix_key: result.pix_key ?? null,
              pix_key_type: result.pix_key_type ?? null,
              pix_beneficiary_name: result.pix_beneficiary_name ?? null,
            };

            set({ settings });
            get().applyTheme(settings);
            toast.success('Configurações atualizadas com sucesso!');
          }
        } catch (error) {
          console.error('Error updating settings:', error);
          toast.error('Erro ao atualizar configurações');
          throw error;
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
