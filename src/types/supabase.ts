export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface StoryImage {
  id: string
  url: string
  order: number
  media_type?: 'image' | 'video'
  duration?: number
}

export interface OrderItemExtra {
  id: string
  name: string
  price: number
  quantity: number
}

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  extras: OrderItemExtra[]
  isFreeProduct?: boolean
}

import type { Database as GeneratedDatabase } from './supabase.generated';

type ManualDatabase = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          owner_user_id: string
          slug: string
          name: string
          status: 'active' | 'suspended'
          created_at: string
        }
        Insert: {
          id?: string
          owner_user_id: string
          slug: string
          name: string
          status?: 'active' | 'suspended'
          created_at?: string
        }
        Update: {
          slug?: string
          name?: string
          status?: 'active' | 'suspended'
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string | null
          birth_date: string | null
          name: string
          phone: string
          email: string
          addresses: string[]
          notes: string | null
          alternate_names: string[]
          needs_review: boolean
          address_coordinates: ({ lat: number; lng: number } | null)[]
          created_at: string
          updated_at: string
          loyalty_points: number
          loyalty_points_total: number
        }
        Insert: {
          id?: string
          user_id?: string | null
          birth_date?: string | null
          loyalty_points?: number
          loyalty_points_total?: number
          name: string
          phone: string
          email: string
          addresses?: string[]
          address_coordinates?: ({ lat: number; lng: number } | null)[]
          notes?: string | null
          alternate_names?: string[]
          needs_review?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          birth_date?: string | null
          loyalty_points?: number
          loyalty_points_total?: number
          name?: string
          phone?: string
          email?: string
          addresses?: string[]
          address_coordinates?: ({ lat: number; lng: number } | null)[]
          notes?: string | null
          alternate_names?: string[]
          needs_review?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      discount_coupons: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'fixed' | 'free_product'
          discount_value: number
          active: boolean
          created_at: string
          product_id: string | null
          ambassador_name: string | null
          usage_limit: number | null
          usage_count: number
          free_product_description: string | null
          minimum_order_value: number | null
        }
        Insert: {
          id?: string
          code: string
          discount_type: 'percentage' | 'fixed' | 'free_product'
          discount_value: number
          active?: boolean
          created_at?: string
          product_id?: string | null
          ambassador_name?: string | null
          usage_limit?: number | null
          usage_count?: number
          free_product_description?: string | null
          minimum_order_value?: number | null
        }
        Update: {
          id?: string
          code?: string
          discount_type?: 'percentage' | 'fixed' | 'free_product'
          discount_value?: number
          active?: boolean
          created_at?: string
          product_id?: string | null
          ambassador_name?: string | null
          usage_limit?: number | null
          usage_count?: number
          free_product_description?: string | null
          minimum_order_value?: number | null
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_email: string
          customer_phone: string
          address: string
          notes: string | null
          order_type: 'delivery' | 'table' | 'takeaway'
          items: OrderItem[]
          subtotal: number
          discount_amount: number
          total: number
          coupon_code: string | null
          status: 'pending' | 'accepted' | 'delivered'
          accepted_at: string | null
          delivered_at: string | null
          created_at: string
          customer_id: string | null
          order_sequence: number | null
          payment_method: 'cash' | 'mbway' | 'pix'
          payment_status: 'pending' | 'paid'
          delivery_fee: number
          public_slug: string | null
          viewed: boolean
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email: string
          customer_phone: string
          address: string
          notes?: string | null
          order_type: 'delivery' | 'table' | 'takeaway'
          items: OrderItem[]
          subtotal: number
          discount_amount?: number
          total: number
          coupon_code?: string | null
          status?: 'pending' | 'accepted' | 'delivered'
          accepted_at?: string | null
          delivered_at?: string | null
          created_at?: string
          customer_id?: string | null
          order_sequence?: number | null
          payment_method?: 'cash' | 'mbway' | 'pix'
          payment_status?: 'pending' | 'paid'
          delivery_fee?: number
          public_slug?: string | null
          viewed?: boolean
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          address?: string
          notes?: string | null
          order_type?: 'delivery' | 'table' | 'takeaway'
          items?: OrderItem[]
          subtotal?: number
          discount_amount?: number
          total?: number
          coupon_code?: string | null
          status?: 'pending' | 'accepted' | 'delivered'
          accepted_at?: string | null
          delivered_at?: string | null
          created_at?: string
          customer_id?: string | null
          order_sequence?: number | null
          payment_method?: 'cash' | 'mbway' | 'pix'
          payment_status?: 'pending' | 'paid'
          delivery_fee?: number
          public_slug?: string | null
          viewed?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
          order: number
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          order?: number
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          order?: number
        }
      }
      extras: {
        Row: {
          id: string
          name: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          created_at?: string
        }
      }
      product_extras: {
        Row: {
          product_id: string
          extra_id: string
        }
        Insert: {
          product_id: string
          extra_id: string
        }
        Update: {
          product_id?: string
          extra_id?: string
        }
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image_url: string
          image_blur: string | null
          image_path: string | null
          category_id: string
          created_at: string
          active: boolean
          order: number
          slug: string
          has_custom_tag: boolean
          custom_tag_text: string | null
          is_vegan: boolean
          is_vegetarian: boolean
          is_gluten_free: boolean
          is_spicy: boolean
          spicy_level: 1 | 2 | 3
          require_extra: boolean
          extras_label: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          image_url: string
          image_blur?: string | null
          image_path?: string | null
          category_id: string
          created_at?: string
          active?: boolean
          order?: number
          slug: string
          has_custom_tag?: boolean
          custom_tag_text?: string | null
          is_vegan?: boolean
          is_vegetarian?: boolean
          is_gluten_free?: boolean
          is_spicy?: boolean
          spicy_level?: 1 | 2 | 3
          require_extra?: boolean
          extras_label?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          image_blur?: string | null
          image_path?: string | null
          category_id?: string
          created_at?: string
          active?: boolean
          order?: number
          slug?: string
          has_custom_tag?: boolean
          custom_tag_text?: string | null
          is_vegan?: boolean
          is_vegetarian?: boolean
          is_gluten_free?: boolean
          is_spicy?: boolean
          spicy_level?: 1 | 2 | 3
          require_extra?: boolean
          extras_label?: string | null
        }
      }
      restaurant_settings: {
        Row: {
          id: string
          name: string
          accent_color: string
          title_font: string
          body_font: string
          button_font: string
          created_at: string
          restaurant_icon: string
          about_us: string
          about_us_image_url: string | null
          location: string
          currency: string
          has_delivery: boolean
          has_table_service: boolean
          has_takeaway: boolean
          custom_button_text: string
          custom_button_url: string
          custom_tag_name: string
          logo_url: string | null
          favicon_url: string | null
          order_confirmation_message: string
          operating_hours: {
            weekdaysLabel: string
            weekendsLabel: string
            weekdays: string
            weekends: string
          } | null
          social_links: {
            phone?: string
            email?: string
            social?: string
            whatsapp?: string
            maps_url?: string
            facebook?: string
            instagram?: string
            twitter?: string
            youtube?: string
            pinterest?: string
            other?: string
          }
          story_image_url: string | null
          story_images: StoryImage[]
          story_image_format: 'vertical' | 'portrait' | 'square'
          story_enabled: boolean
          story_auto_open: boolean
          product_card_description_lines: number
          whatsapp_auto_send: boolean
          mbway_phone: string | null
          mbway_reference_prefix: string | null
          mbway_enabled: boolean
          delivery_fee_enabled: boolean
          delivery_base_price: number
          delivery_price_per_km: number
          delivery_minimum_order_value: number
          restaurant_lat: number | null
          restaurant_lng: number | null
          loyalty_enabled: boolean
          loyalty_points_per_euro: number
          loyalty_points_per_euro_discount: number
          operating_schedule: Record<string, { open: boolean; from: string; to: string }> | null
          reservations_enabled: boolean
          reservation_duration_min: number
          reservation_min_advance_min: number
          reservation_max_advance_days: number
          country: 'PT' | 'BR'
          pix_enabled: boolean
          pix_key: string | null
          pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null
          pix_beneficiary_name: string | null
        }
        Insert: {
          id?: string
          name: string
          accent_color?: string
          title_font?: string
          body_font?: string
          button_font?: string
          created_at?: string
          restaurant_icon?: string
          about_us?: string
          about_us_image_url?: string | null
          location?: string
          currency?: string
          has_delivery?: boolean
          has_table_service?: boolean
          has_takeaway?: boolean
          custom_button_text?: string
          custom_button_url?: string
          custom_tag_name?: string
          logo_url?: string | null
          favicon_url?: string | null
          order_confirmation_message?: string
          operating_hours?: {
            weekdaysLabel: string
            weekendsLabel: string
            weekdays: string
            weekends: string
          } | null
          social_links?: {
            phone?: string
            email?: string
            social?: string
            whatsapp?: string
            maps_url?: string
            facebook?: string
            instagram?: string
            twitter?: string
            youtube?: string
            pinterest?: string
            other?: string
          }
          story_image_url?: string | null
          story_images?: StoryImage[]
          story_image_format?: 'vertical' | 'portrait' | 'square'
          story_enabled?: boolean
          story_auto_open?: boolean
          product_card_description_lines?: number
          whatsapp_auto_send?: boolean
          mbway_phone?: string | null
          mbway_reference_prefix?: string | null
          mbway_enabled?: boolean
          delivery_fee_enabled?: boolean
          delivery_base_price?: number
          delivery_price_per_km?: number
          delivery_minimum_order_value?: number
          restaurant_lat?: number | null
          restaurant_lng?: number | null
          loyalty_enabled?: boolean
          loyalty_points_per_euro?: number
          loyalty_points_per_euro_discount?: number
          operating_schedule?: Record<string, { open: boolean; from: string; to: string }> | null
          reservations_enabled?: boolean
          reservation_duration_min?: number
          reservation_min_advance_min?: number
          reservation_max_advance_days?: number
          country?: 'PT' | 'BR'
          pix_enabled?: boolean
          pix_key?: string | null
          pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null
          pix_beneficiary_name?: string | null
        }
        Update: {
          id?: string
          name?: string
          accent_color?: string
          title_font?: string
          body_font?: string
          button_font?: string
          created_at?: string
          restaurant_icon?: string
          about_us?: string
          about_us_image_url?: string | null
          location?: string
          currency?: string
          has_delivery?: boolean
          has_table_service?: boolean
          has_takeaway?: boolean
          favicon_url?: string | null
          custom_button_text?: string
          custom_button_url?: string
          custom_tag_name?: string
          logo_url?: string | null
          order_confirmation_message?: string
          operating_hours?: {
            weekdaysLabel: string
            weekendsLabel: string
            weekdays: string
            weekends: string
          } | null
          social_links?: {
            phone?: string
            email?: string
            social?: string
            whatsapp?: string
            maps_url?: string
            facebook?: string
            instagram?: string
            twitter?: string
            youtube?: string
            pinterest?: string
            other?: string
          }
          story_image_url?: string | null
          story_images?: StoryImage[]
          story_image_format?: 'vertical' | 'portrait' | 'square'
          story_enabled?: boolean
          story_auto_open?: boolean
          product_card_description_lines?: number
          whatsapp_auto_send?: boolean
          mbway_phone?: string | null
          mbway_reference_prefix?: string | null
          mbway_enabled?: boolean
          delivery_fee_enabled?: boolean
          delivery_base_price?: number
          delivery_price_per_km?: number
          delivery_minimum_order_value?: number
          restaurant_lat?: number | null
          restaurant_lng?: number | null
          loyalty_enabled?: boolean
          loyalty_points_per_euro?: number
          loyalty_points_per_euro_discount?: number
          operating_schedule?: Record<string, { open: boolean; from: string; to: string }> | null
          reservations_enabled?: boolean
          reservation_duration_min?: number
          reservation_min_advance_min?: number
          reservation_max_advance_days?: number
          country?: 'PT' | 'BR'
          pix_enabled?: boolean
          pix_key?: string | null
          pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | null
          pix_beneficiary_name?: string | null
        }
      }

      restaurant_awards: {
        Row: {
          id: string
          name: string
          image_url: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          image_url: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          created_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          name: string
          role: string
          phone: string
          email: string
          photo_url: string
          hire_date: string
          hourly_rate: number
          active: boolean
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          phone: string
          email?: string
          photo_url?: string
          hire_date?: string
          hourly_rate?: number
          active?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          phone?: string
          email?: string
          photo_url?: string
          hire_date?: string
          hourly_rate?: number
          active?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      staff_schedules: {
        Row: {
          id: string
          staff_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_day_off: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          day_of_week: number
          start_time?: string
          end_time?: string
          is_day_off?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_day_off?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      story_views: {
        Row: {
          id: string
          session_id: string
          story_image_url: string
          viewed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          story_image_url: string
          viewed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          story_image_url?: string
          viewed_at?: string
          created_at?: string
        }
      }
      product_modal_views: {
        Row: {
          id: string
          product_id: string
          product_name: string
          session_id: string | null
          viewed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          product_name: string
          session_id?: string | null
          viewed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          product_name?: string
          session_id?: string | null
          viewed_at?: string
          created_at?: string
        }
      }
    }
  }
}

type GeneratedTables = GeneratedDatabase['public']['Tables'];
type ManualTables = ManualDatabase['public']['Tables'];

export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Tables'> & {
    Tables: {
      [K in keyof GeneratedTables]: K extends keyof ManualTables
        ? ManualTables[K] & Pick<GeneratedTables[K], 'Relationships'>
        : GeneratedTables[K]
    }
  }
}
