export type ProductCategory =
  | "save_the_dates"
  | "invitations"
  | "on_the_day"
  | "thank_yous";

export type OrderStatus =
  | "pending"
  | "paid"
  | "in_production"
  | "shipped"
  | "delivered";

export type FieldType =
  | "text"
  | "date"
  | "time"
  | "textarea"
  | "select";

export interface Database {
  public: {
    Tables: {
      design_collections: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          hero_image_url: string | null;
          preview_images: string[];
          sort_order: number;
          is_published: boolean;
          style_tags: string[];
          colour_tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["design_collections"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["design_collections"]["Insert"]
        >;
      };
      product_types: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: ProductCategory;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["product_types"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_types"]["Insert"]
        >;
      };
      products: {
        Row: {
          id: string;
          design_collection_id: string;
          product_type_id: string;
          name: string;
          slug: string;
          description: string | null;
          base_price: number;
          mockup_images: string[];
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["products"]["Insert"]
        >;
      };
      personalisation_fields: {
        Row: {
          id: string;
          product_id: string;
          field_type: FieldType;
          label: string;
          placeholder: string | null;
          is_required: boolean;
          sort_order: number;
          options: Record<string, string>[] | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["personalisation_fields"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["personalisation_fields"]["Insert"]
        >;
      };
      customers: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          wedding_date: string | null;
          partner_name: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["customers"]["Row"],
          "created_at"
        > & {
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["customers"]["Insert"]
        >;
      };
      orders: {
        Row: {
          id: string;
          customer_id: string | null;
          customer_email: string;
          stripe_session_id: string | null;
          status: OrderStatus;
          total: number;
          shipping_address: Record<string, string> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["orders"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["orders"]["Insert"]
        >;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          personalisation_data: Record<string, string>;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["order_items"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["order_items"]["Insert"]
        >;
      };
    };
  };
}

// Convenience types
export type DesignCollection =
  Database["public"]["Tables"]["design_collections"]["Row"];
export type ProductType =
  Database["public"]["Tables"]["product_types"]["Row"];
export type Product =
  Database["public"]["Tables"]["products"]["Row"];
export type PersonalisationField =
  Database["public"]["Tables"]["personalisation_fields"]["Row"];
export type Customer =
  Database["public"]["Tables"]["customers"]["Row"];
export type Order =
  Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem =
  Database["public"]["Tables"]["order_items"]["Row"];

// Joined types for queries
export type ProductWithRelations = Product & {
  design_collection: DesignCollection;
  product_type: ProductType;
  personalisation_fields: PersonalisationField[];
};

export type OrderWithItems = Order & {
  order_items: (OrderItem & {
    product: Product;
  })[];
};
