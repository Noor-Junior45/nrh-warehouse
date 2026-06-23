export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  business_type: "retail" | "manufacturing" | "ecommerce" | "pharmacy" | "cold_storage";
  owner_id: string;
  subscription_plan: string;
  subscription_status: string;
  billing_email: string;
  razorpay_customer_id: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  total_capacity: number;
  capacity_unit: string;
  manager_name: string;
  manager_phone: string;
  is_active: boolean;
  created_at: string;
}

export interface Zone {
  id: string;
  warehouse_id: string;
  name: string;
  zone_type: "receiving" | "storage" | "dispatch" | "cold" | "hazmat";
  capacity: number;
  created_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit_of_measure: string;
  unit_price: number;
  reorder_level: number;
  hsn_code: string;
  gst_rate: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  payment_terms: string;
  created_at: string;
}

export interface Inventory {
  id: string;
  warehouse_id: string;
  zone_id: string;
  product_id: string;
  quantity_available: number;
  quantity_reserved: number;
  batch_number: string;
  expiry_date: string | null;
  location_code: string;
  last_updated: string;
}

export interface StockMovement {
  id: string;
  organization_id: string;
  warehouse_id: string;
  product_id: string;
  movement_type: "inbound" | "outbound" | "transfer" | "adjustment" | "return";
  quantity: number;
  reference_id: string | null;
  reference_type: "purchase_order" | "dispatch_order" | null;
  notes: string;
  performed_by: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  warehouse_id: string;
  supplier_id: string;
  po_number: string;
  status: "draft" | "sent" | "partial" | "received" | "cancelled";
  expected_delivery_date: string;
  total_amount: number;
  notes: string;
  created_by: string;
  created_at: string;
  items_count?: number;
  items?: PurchaseOrderItem[];
}

export interface DispatchOrderItem {
  id: string;
  dispatch_order_id: string;
  product_id: string;
  quantity_requested: number;
  quantity_dispatched: number;
  unit_price: number;
}

export interface DispatchOrder {
  id: string;
  organization_id: string;
  warehouse_id: string;
  order_reference: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  status: "pending" | "picking" | "packed" | "dispatched" | "delivered" | "cancelled";
  dispatch_date: string;
  total_amount: number;
  notes: string;
  created_by: string;
  created_at: string;
  items_count?: number;
  items?: DispatchOrderItem[];
}

export interface ApiKey {
  id: string;
  label: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface BillingSummary {
  organization_id: string;
  plan: string;
  subscription_status: string;
  razorpay_customer_id: string | null;
  billing_cycle: {
    start: string;
    end: string;
  };
  usage: {
    warehouses: { used: number; limit: number };
    products: { used: number; limit: number };
    stock_movements_this_month: number;
  };
}
