export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      business_public_settings_data: {
        Row: {
          about_us: string | null
          about_us_image_url: string | null
          accent_color: string | null
          body_font: string | null
          business_id: string
          button_font: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          custom_button_text: string | null
          custom_button_url: string | null
          custom_tag_name: string | null
          delivery_base_price: number | null
          delivery_fee_enabled: boolean | null
          delivery_minimum_order_value: number | null
          delivery_price_per_km: number | null
          favicon_url: string | null
          has_delivery: boolean | null
          has_table_service: boolean | null
          has_takeaway: boolean | null
          id: string | null
          location: string | null
          logo_url: string | null
          loyalty_enabled: boolean | null
          loyalty_points_per_euro: number | null
          loyalty_points_per_euro_discount: number | null
          mbway_enabled: boolean | null
          mbway_phone: string | null
          name: string | null
          operating_hours: Json | null
          operating_schedule: Json | null
          order_confirmation_message: string | null
          pix_beneficiary_name: string | null
          pix_enabled: boolean | null
          pix_key: string | null
          pix_key_type: string | null
          product_card_description_lines: number | null
          reservation_duration_min: number | null
          reservation_max_advance_days: number | null
          reservation_min_advance_min: number | null
          reservations_enabled: boolean | null
          restaurant_icon: string | null
          restaurant_lat: number | null
          restaurant_lng: number | null
          social_links: Json | null
          story_auto_open: boolean | null
          story_enabled: boolean | null
          story_image_format: string | null
          story_image_url: string | null
          story_images: Json | null
          title_font: string | null
          whatsapp_auto_send: boolean | null
        }
        Insert: {
          about_us?: string | null
          about_us_image_url?: string | null
          accent_color?: string | null
          body_font?: string | null
          business_id: string
          button_font?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_button_text?: string | null
          custom_button_url?: string | null
          custom_tag_name?: string | null
          delivery_base_price?: number | null
          delivery_fee_enabled?: boolean | null
          delivery_minimum_order_value?: number | null
          delivery_price_per_km?: number | null
          favicon_url?: string | null
          has_delivery?: boolean | null
          has_table_service?: boolean | null
          has_takeaway?: boolean | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          loyalty_enabled?: boolean | null
          loyalty_points_per_euro?: number | null
          loyalty_points_per_euro_discount?: number | null
          mbway_enabled?: boolean | null
          mbway_phone?: string | null
          name?: string | null
          operating_hours?: Json | null
          operating_schedule?: Json | null
          order_confirmation_message?: string | null
          pix_beneficiary_name?: string | null
          pix_enabled?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          product_card_description_lines?: number | null
          reservation_duration_min?: number | null
          reservation_max_advance_days?: number | null
          reservation_min_advance_min?: number | null
          reservations_enabled?: boolean | null
          restaurant_icon?: string | null
          restaurant_lat?: number | null
          restaurant_lng?: number | null
          social_links?: Json | null
          story_auto_open?: boolean | null
          story_enabled?: boolean | null
          story_image_format?: string | null
          story_image_url?: string | null
          story_images?: Json | null
          title_font?: string | null
          whatsapp_auto_send?: boolean | null
        }
        Update: {
          about_us?: string | null
          about_us_image_url?: string | null
          accent_color?: string | null
          body_font?: string | null
          business_id?: string
          button_font?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_button_text?: string | null
          custom_button_url?: string | null
          custom_tag_name?: string | null
          delivery_base_price?: number | null
          delivery_fee_enabled?: boolean | null
          delivery_minimum_order_value?: number | null
          delivery_price_per_km?: number | null
          favicon_url?: string | null
          has_delivery?: boolean | null
          has_table_service?: boolean | null
          has_takeaway?: boolean | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          loyalty_enabled?: boolean | null
          loyalty_points_per_euro?: number | null
          loyalty_points_per_euro_discount?: number | null
          mbway_enabled?: boolean | null
          mbway_phone?: string | null
          name?: string | null
          operating_hours?: Json | null
          operating_schedule?: Json | null
          order_confirmation_message?: string | null
          pix_beneficiary_name?: string | null
          pix_enabled?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          product_card_description_lines?: number | null
          reservation_duration_min?: number | null
          reservation_max_advance_days?: number | null
          reservation_min_advance_min?: number | null
          reservations_enabled?: boolean | null
          restaurant_icon?: string | null
          restaurant_lat?: number | null
          restaurant_lng?: number | null
          social_links?: Json | null
          story_auto_open?: boolean | null
          story_enabled?: boolean | null
          story_image_format?: string | null
          story_image_url?: string | null
          story_images?: Json | null
          title_font?: string | null
          whatsapp_auto_send?: boolean | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          slug: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          slug: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          slug?: string
          status?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          name: string
          order: number
        }
        Insert: {
          business_id?: string
          created_at?: string | null
          id?: string
          name: string
          order?: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          name?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_coordinates: Json
          addresses: Json
          alternate_names: string[] | null
          birth_date: string | null
          business_id: string
          created_at: string | null
          email: string
          id: string
          loyalty_points: number
          loyalty_points_total: number
          name: string
          needs_review: boolean | null
          notes: string | null
          phone: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_coordinates?: Json
          addresses?: Json
          alternate_names?: string[] | null
          birth_date?: string | null
          business_id?: string
          created_at?: string | null
          email: string
          id?: string
          loyalty_points?: number
          loyalty_points_total?: number
          name: string
          needs_review?: boolean | null
          notes?: string | null
          phone: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_coordinates?: Json
          addresses?: Json
          alternate_names?: string[] | null
          birth_date?: string | null
          business_id?: string
          created_at?: string | null
          email?: string
          id?: string
          loyalty_points?: number
          loyalty_points_total?: number
          name?: string
          needs_review?: boolean | null
          notes?: string | null
          phone?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          active: boolean | null
          ambassador_name: string | null
          business_id: string
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          free_product_description: string | null
          id: string
          minimum_order_value: number | null
          product_id: string | null
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          active?: boolean | null
          ambassador_name?: string | null
          business_id?: string
          code: string
          created_at?: string | null
          discount_type: string
          discount_value?: number
          free_product_description?: string | null
          id?: string
          minimum_order_value?: number | null
          product_id?: string | null
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          active?: boolean | null
          ambassador_name?: string | null
          business_id?: string
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          free_product_description?: string | null
          id?: string
          minimum_order_value?: number | null
          product_id?: string | null
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_coupons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_coupons_product_id_business_fkey"
            columns: ["business_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      extras: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          name: string
          price: number
        }
        Insert: {
          business_id?: string
          created_at?: string | null
          id?: string
          name: string
          price?: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "extras_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_ingredient_usage: {
        Row: {
          business_id: string
          name: string
          order_id: string
          quantity: number
          unit: string
        }
        Insert: {
          business_id: string
          name: string
          order_id: string
          quantity: number
          unit: string
        }
        Update: {
          business_id?: string
          name?: string
          order_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_ingredient_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ingredient_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          address: string
          business_id: string
          coupon_code: string | null
          created_at: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_fee: number
          discount_amount: number
          id: string
          items: Json
          notes: string | null
          order_sequence: number | null
          order_type: string
          payment_method: string
          payment_status: string
          public_slug: string | null
          status: string
          subtotal: number
          total: number
          viewed: boolean | null
        }
        Insert: {
          accepted_at?: string | null
          address: string
          business_id?: string
          coupon_code?: string | null
          created_at?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivery_fee?: number
          discount_amount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_sequence?: number | null
          order_type: string
          payment_method?: string
          payment_status?: string
          public_slug?: string | null
          status?: string
          subtotal?: number
          total?: number
          viewed?: boolean | null
        }
        Update: {
          accepted_at?: string | null
          address?: string
          business_id?: string
          coupon_code?: string | null
          created_at?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_fee?: number
          discount_amount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_sequence?: number | null
          order_type?: string
          payment_method?: string
          payment_status?: string
          public_slug?: string | null
          status?: string
          subtotal?: number
          total?: number
          viewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_business_fkey"
            columns: ["business_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      platform_ad_views: {
        Row: {
          ad_id: string
          business_id: string
          first_viewed_at: string
          last_viewed_at: string
          view_count: number
        }
        Insert: {
          ad_id: string
          business_id: string
          first_viewed_at?: string
          last_viewed_at?: string
          view_count?: number
        }
        Update: {
          ad_id?: string
          business_id?: string
          first_viewed_at?: string
          last_viewed_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_ad_views_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "platform_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_ad_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ads: {
        Row: {
          button_label: string | null
          button_url: string | null
          created_at: string
          ends_at: string | null
          id: string
          message: string
          starts_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          button_label?: string | null
          button_url?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          message: string
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          button_label?: string | null
          button_url?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          message?: string
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_extras: {
        Row: {
          business_id: string
          extra_id: string
          product_id: string
        }
        Insert: {
          business_id?: string
          extra_id: string
          product_id: string
        }
        Update: {
          business_id?: string
          extra_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_extras_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_extras_extra_id_business_fkey"
            columns: ["business_id", "extra_id"]
            isOneToOne: false
            referencedRelation: "extras"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "product_extras_product_id_business_fkey"
            columns: ["business_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          business_id: string
          id: string
          name: string
          product_id: string
          quantity: number
          unit: string
        }
        Insert: {
          business_id: string
          id?: string
          name: string
          product_id: string
          quantity: number
          unit: string
        }
        Update: {
          business_id?: string
          id?: string
          name?: string
          product_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modal_views: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          product_id: string
          product_name: string
          session_id: string | null
          viewed_at: string | null
        }
        Insert: {
          business_id?: string
          created_at?: string | null
          id?: string
          product_id: string
          product_name: string
          session_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          product_name?: string
          session_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_modal_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modal_views_product_id_business_fkey"
            columns: ["business_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      product_tags: {
        Row: {
          business_id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          business_id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          business_id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_product_id_business_fkey"
            columns: ["business_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_business_fkey"
            columns: ["business_id", "tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          business_id: string
          category_id: string
          created_at: string | null
          custom_tag_text: string | null
          description: string
          extras_label: string | null
          has_custom_tag: boolean | null
          id: string
          image_blur: string | null
          image_path: string | null
          image_url: string
          is_gluten_free: boolean
          is_spicy: boolean
          is_vegan: boolean
          is_vegetarian: boolean
          name: string
          order: number
          price: number
          require_extra: boolean
          slug: string
          spicy_level: number
        }
        Insert: {
          active?: boolean | null
          business_id?: string
          category_id: string
          created_at?: string | null
          custom_tag_text?: string | null
          description?: string
          extras_label?: string | null
          has_custom_tag?: boolean | null
          id?: string
          image_blur?: string | null
          image_path?: string | null
          image_url?: string
          is_gluten_free?: boolean
          is_spicy?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          name: string
          order?: number
          price?: number
          require_extra?: boolean
          slug: string
          spicy_level?: number
        }
        Update: {
          active?: boolean | null
          business_id?: string
          category_id?: string
          created_at?: string | null
          custom_tag_text?: string | null
          description?: string
          extras_label?: string | null
          has_custom_tag?: boolean | null
          id?: string
          image_blur?: string | null
          image_path?: string | null
          image_url?: string
          is_gluten_free?: boolean
          is_spicy?: boolean
          is_vegan?: boolean
          is_vegetarian?: boolean
          name?: string
          order?: number
          price?: number
          require_extra?: boolean
          slug?: string
          spicy_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_business_fkey"
            columns: ["business_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      reservation_tables: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          kind: string
          location: string
          name: string
          schedule: Json | null
          seats: number
        }
        Insert: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kind?: string
          location?: string
          name: string
          schedule?: Json | null
          seats: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kind?: string
          location?: string
          name?: string
          schedule?: Json | null
          seats?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_tables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          business_id: string
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          ends_at: string
          id: string
          notes: string | null
          party_size: number
          starts_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string | null
          updated_at: string | null
          user_id: string | null
          viewed: boolean | null
        }
        Insert: {
          business_id?: string
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          party_size: number
          starts_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          viewed?: boolean | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          party_size?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          viewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_business_fkey"
            columns: ["business_id", "table_id"]
            isOneToOne: false
            referencedRelation: "reservation_tables"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      restaurant_awards: {
        Row: {
          business_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          name: string
          updated_at: string
        }
        Insert: {
          business_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          name?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_awards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_settings: {
        Row: {
          about_us: string
          about_us_image_url: string | null
          accent_color: string
          body_font: string
          business_id: string
          button_font: string
          country: string
          created_at: string | null
          currency: string
          custom_button_text: string
          custom_button_url: string
          custom_tag_name: string
          delivery_base_price: number
          delivery_fee_enabled: boolean
          delivery_minimum_order_value: number
          delivery_price_per_km: number
          favicon_url: string | null
          has_delivery: boolean | null
          has_table_service: boolean | null
          has_takeaway: boolean | null
          id: string
          location: string
          logo_url: string | null
          loyalty_enabled: boolean
          loyalty_points_per_euro: number
          loyalty_points_per_euro_discount: number
          mbway_enabled: boolean
          mbway_phone: string | null
          mbway_reference_prefix: string | null
          name: string
          operating_hours: Json | null
          operating_schedule: Json | null
          order_confirmation_message: string | null
          pix_beneficiary_name: string | null
          pix_enabled: boolean
          pix_key: string | null
          pix_key_type: string | null
          product_card_description_lines: number
          reservation_duration_min: number | null
          reservation_max_advance_days: number | null
          reservation_min_advance_min: number | null
          reservations_enabled: boolean | null
          restaurant_icon: string
          restaurant_lat: number | null
          restaurant_lng: number | null
          social_links: Json | null
          story_auto_open: boolean | null
          story_enabled: boolean | null
          story_image_format: string | null
          story_image_url: string | null
          story_images: Json | null
          title_font: string
          whatsapp_auto_send: boolean | null
        }
        Insert: {
          about_us?: string
          about_us_image_url?: string | null
          accent_color?: string
          body_font?: string
          business_id?: string
          button_font?: string
          country?: string
          created_at?: string | null
          currency?: string
          custom_button_text?: string
          custom_button_url?: string
          custom_tag_name?: string
          delivery_base_price?: number
          delivery_fee_enabled?: boolean
          delivery_minimum_order_value?: number
          delivery_price_per_km?: number
          favicon_url?: string | null
          has_delivery?: boolean | null
          has_table_service?: boolean | null
          has_takeaway?: boolean | null
          id?: string
          location?: string
          logo_url?: string | null
          loyalty_enabled?: boolean
          loyalty_points_per_euro?: number
          loyalty_points_per_euro_discount?: number
          mbway_enabled?: boolean
          mbway_phone?: string | null
          mbway_reference_prefix?: string | null
          name?: string
          operating_hours?: Json | null
          operating_schedule?: Json | null
          order_confirmation_message?: string | null
          pix_beneficiary_name?: string | null
          pix_enabled?: boolean
          pix_key?: string | null
          pix_key_type?: string | null
          product_card_description_lines?: number
          reservation_duration_min?: number | null
          reservation_max_advance_days?: number | null
          reservation_min_advance_min?: number | null
          reservations_enabled?: boolean | null
          restaurant_icon?: string
          restaurant_lat?: number | null
          restaurant_lng?: number | null
          social_links?: Json | null
          story_auto_open?: boolean | null
          story_enabled?: boolean | null
          story_image_format?: string | null
          story_image_url?: string | null
          story_images?: Json | null
          title_font?: string
          whatsapp_auto_send?: boolean | null
        }
        Update: {
          about_us?: string
          about_us_image_url?: string | null
          accent_color?: string
          body_font?: string
          business_id?: string
          button_font?: string
          country?: string
          created_at?: string | null
          currency?: string
          custom_button_text?: string
          custom_button_url?: string
          custom_tag_name?: string
          delivery_base_price?: number
          delivery_fee_enabled?: boolean
          delivery_minimum_order_value?: number
          delivery_price_per_km?: number
          favicon_url?: string | null
          has_delivery?: boolean | null
          has_table_service?: boolean | null
          has_takeaway?: boolean | null
          id?: string
          location?: string
          logo_url?: string | null
          loyalty_enabled?: boolean
          loyalty_points_per_euro?: number
          loyalty_points_per_euro_discount?: number
          mbway_enabled?: boolean
          mbway_phone?: string | null
          mbway_reference_prefix?: string | null
          name?: string
          operating_hours?: Json | null
          operating_schedule?: Json | null
          order_confirmation_message?: string | null
          pix_beneficiary_name?: string | null
          pix_enabled?: boolean
          pix_key?: string | null
          pix_key_type?: string | null
          product_card_description_lines?: number
          reservation_duration_min?: number | null
          reservation_max_advance_days?: number | null
          reservation_min_advance_min?: number | null
          reservations_enabled?: boolean | null
          restaurant_icon?: string
          restaurant_lat?: number | null
          restaurant_lng?: number | null
          social_links?: Json | null
          story_auto_open?: boolean | null
          story_enabled?: boolean | null
          story_image_format?: string | null
          story_image_url?: string | null
          story_images?: Json | null
          title_font?: string
          whatsapp_auto_send?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean | null
          business_id: string
          created_at: string | null
          email: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          name: string
          notes: string | null
          phone: string
          photo_url: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          business_id?: string
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          photo_url?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          photo_url?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          business_id: string
          created_at: string | null
          day_of_week: number
          end_time: string | null
          id: string
          is_day_off: boolean | null
          staff_id: string
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string
          created_at?: string | null
          day_of_week: number
          end_time?: string | null
          id?: string
          is_day_off?: boolean | null
          staff_id: string
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string | null
          id?: string
          is_day_off?: boolean | null
          staff_id?: string
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedules_staff_id_business_fkey"
            columns: ["business_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      story_views: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          session_id: string
          story_image_url: string
          viewed_at: string | null
        }
        Insert: {
          business_id?: string
          created_at?: string | null
          id?: string
          session_id: string
          story_image_url: string
          viewed_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          session_id?: string
          story_image_url?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          business_id: string
          created_at: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          business_id?: string
          created_at?: string | null
          icon?: string
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          birth_date: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      business_public_settings: {
        Row: {
          about_us: string | null
          about_us_image_url: string | null
          accent_color: string | null
          body_font: string | null
          business_id: string | null
          button_font: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          custom_button_text: string | null
          custom_button_url: string | null
          custom_tag_name: string | null
          delivery_base_price: number | null
          delivery_fee_enabled: boolean | null
          delivery_minimum_order_value: number | null
          delivery_price_per_km: number | null
          favicon_url: string | null
          has_delivery: boolean | null
          has_table_service: boolean | null
          has_takeaway: boolean | null
          id: string | null
          location: string | null
          logo_url: string | null
          loyalty_enabled: boolean | null
          loyalty_points_per_euro: number | null
          loyalty_points_per_euro_discount: number | null
          mbway_enabled: boolean | null
          mbway_phone: string | null
          name: string | null
          operating_hours: Json | null
          operating_schedule: Json | null
          order_confirmation_message: string | null
          pix_beneficiary_name: string | null
          pix_enabled: boolean | null
          pix_key: string | null
          pix_key_type: string | null
          product_card_description_lines: number | null
          reservation_duration_min: number | null
          reservation_max_advance_days: number | null
          reservation_min_advance_min: number | null
          reservations_enabled: boolean | null
          restaurant_icon: string | null
          restaurant_lat: number | null
          restaurant_lng: number | null
          social_links: Json | null
          story_auto_open: boolean | null
          story_enabled: boolean | null
          story_image_format: string | null
          story_image_url: string | null
          story_images: Json | null
          title_font: string | null
          whatsapp_auto_send: boolean | null
        }
        Insert: {
          about_us?: string | null
          about_us_image_url?: string | null
          accent_color?: string | null
          body_font?: string | null
          business_id?: string | null
          button_font?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_button_text?: string | null
          custom_button_url?: string | null
          custom_tag_name?: string | null
          delivery_base_price?: number | null
          delivery_fee_enabled?: boolean | null
          delivery_minimum_order_value?: number | null
          delivery_price_per_km?: number | null
          favicon_url?: string | null
          has_delivery?: boolean | null
          has_table_service?: boolean | null
          has_takeaway?: boolean | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          loyalty_enabled?: boolean | null
          loyalty_points_per_euro?: number | null
          loyalty_points_per_euro_discount?: number | null
          mbway_enabled?: boolean | null
          mbway_phone?: string | null
          name?: string | null
          operating_hours?: Json | null
          operating_schedule?: Json | null
          order_confirmation_message?: string | null
          pix_beneficiary_name?: string | null
          pix_enabled?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          product_card_description_lines?: number | null
          reservation_duration_min?: number | null
          reservation_max_advance_days?: number | null
          reservation_min_advance_min?: number | null
          reservations_enabled?: boolean | null
          restaurant_icon?: string | null
          restaurant_lat?: number | null
          restaurant_lng?: number | null
          social_links?: Json | null
          story_auto_open?: boolean | null
          story_enabled?: boolean | null
          story_image_format?: string | null
          story_image_url?: string | null
          story_images?: Json | null
          title_font?: string | null
          whatsapp_auto_send?: boolean | null
        }
        Update: {
          about_us?: string | null
          about_us_image_url?: string | null
          accent_color?: string | null
          body_font?: string | null
          business_id?: string | null
          button_font?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_button_text?: string | null
          custom_button_url?: string | null
          custom_tag_name?: string | null
          delivery_base_price?: number | null
          delivery_fee_enabled?: boolean | null
          delivery_minimum_order_value?: number | null
          delivery_price_per_km?: number | null
          favicon_url?: string | null
          has_delivery?: boolean | null
          has_table_service?: boolean | null
          has_takeaway?: boolean | null
          id?: string | null
          location?: string | null
          logo_url?: string | null
          loyalty_enabled?: boolean | null
          loyalty_points_per_euro?: number | null
          loyalty_points_per_euro_discount?: number | null
          mbway_enabled?: boolean | null
          mbway_phone?: string | null
          name?: string | null
          operating_hours?: Json | null
          operating_schedule?: Json | null
          order_confirmation_message?: string | null
          pix_beneficiary_name?: string | null
          pix_enabled?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          product_card_description_lines?: number | null
          reservation_duration_min?: number | null
          reservation_max_advance_days?: number | null
          reservation_min_advance_min?: number | null
          reservations_enabled?: boolean | null
          restaurant_icon?: string | null
          restaurant_lat?: number | null
          restaurant_lng?: number | null
          social_links?: Json | null
          story_auto_open?: boolean | null
          story_enabled?: boolean | null
          story_image_format?: string | null
          story_image_url?: string | null
          story_images?: Json | null
          title_font?: string | null
          whatsapp_auto_send?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      canonical_ingredient_unit: { Args: { value: string }; Returns: string }
      create_order_with_coupon: {
        Args: { p_coupon_id?: string; p_order: Json }
        Returns: string
      }
      get_next_order_sequence: { Args: never; Returns: number }
      get_product_ingredients: { Args: { p_product: string }; Returns: Json }
      get_public_order: {
        Args: { p_business_id: string; p_public_slug: string }
        Returns: Json
      }
      get_reserved_table_slots: {
        Args: { p_day_end: string; p_day_start: string; p_table_ids: string[] }
        Returns: {
          ends_at: string
          starts_at: string
          table_id: string
        }[]
      }
      ingredient_consumption: {
        Args: { p_business: string; p_from: string; p_to: string }
        Returns: Json
      }
      is_supabase_storage_url: { Args: { _value: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      list_ingredient_names: { Args: { p_business: string }; Returns: string[] }
      platform_admin_business_details: {
        Args: { p_business: string; p_from?: string; p_to?: string }
        Returns: Json
      }
      platform_admin_daily_orders: {
        Args: { p_days?: number }
        Returns: {
          day: string
          orders: number
        }[]
      }
      platform_admin_overview: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      record_platform_ad_views: {
        Args: { p_ad_ids: string[] }
        Returns: undefined
      }
      save_product_ingredients: {
        Args: { p_items: Json; p_product: string }
        Returns: undefined
      }
    }
    Enums: {
      reservation_status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      reservation_status: [
        "pending",
        "confirmed",
        "rejected",
        "completed",
        "cancelled",
      ],
    },
  },
} as const

