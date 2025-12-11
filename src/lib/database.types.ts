export interface Database {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string;
          supplier_code: string;
          supplier_name: string;
          supplier_type: string;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
      };
      inventory_items: {
        Row: {
          id: string;
          item_id: string;
          supplier_id: string;
          supplier_item_number: string;
          model_family: string;
          screen_size: string;
          chip: string;
          ram_gb: number;
          storage_gb: number;
          year: number;
          serial_number: string | null;
          color: string | null;
          keyboard_layout: string | null;
          os_installed: string | null;
          condition_grade: string;
          condition_summary: string;
          battery_cycle_count: number | null;
          battery_health_percent: number | null;
          charger_included: boolean;
          box_included: boolean;
          purchase_cost: number;
          purchase_date: string;
          status: string;
          sold_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['inventory_items']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          customer_type: string;
          source: string;
          ig_handle: string | null;
          preferred_contact: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          item_id: string;
          customer_id: string | null;
          sale_price: number;
          sale_date: string;
          payment_method: string;
          channel: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
    };
  };
}
