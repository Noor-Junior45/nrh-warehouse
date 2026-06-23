import fs from "fs";
import path from "path";
import crypto from "crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Ensure data folder exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, "wms_database.json");

// Initialize Firebase client on server-side using local config
let firestoreDb: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const app = initializeApp(firebaseConfig, "server-app");
    firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase Firestore successfully initialized on backend server");
  }
} catch (err) {
  console.error("Failed to initialize Firebase Firestore on backend:", err);
}

// --- TS INTERFACES ---

export interface AuthUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
  photo_url?: string;
}

export interface Organization {
  id: string;
  name: string;
  business_type: "retail" | "manufacturing" | "ecommerce" | "pharmacy" | "cold_storage";
  owner_id: string;
  subscription_plan: string; // 'free', 'starter', 'premium', etc.
  subscription_status: string; // 'active', 'halted', 'cancelled'
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
  total_capacity: number; // in unit
  capacity_unit: string; // e.g. 'sqft'
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
  gst_rate: number; // e.g., 18
  image_url: string;
  is_active: boolean;
  created_at: string;
  expiry_date?: string | null;
  custom_attributes?: Record<string, any> | null;
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
  expiry_date: string | null; // DATE (YYYY-MM-DD or null)
  location_code: string; // e.g. 'A-01-03'
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
  performed_by: string; // auth.users ID
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  warehouse_id: string;
  supplier_id: string;
  po_number: string; // PO-YYYYMM-XXXX
  status: "draft" | "sent" | "partial" | "received" | "cancelled";
  expected_delivery_date: string; // DATE YYYY-MM-DD
  total_amount: number;
  notes: string;
  created_by: string;
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

export interface DispatchOrder {
  id: string;
  organization_id: string;
  warehouse_id: string;
  order_reference: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  status: "pending" | "picking" | "packed" | "dispatched" | "delivered" | "cancelled";
  dispatch_date: string; // DATE YYYY-MM-DD
  total_amount: number;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface DispatchOrderItem {
  id: string;
  dispatch_order_id: string;
  product_id: string;
  quantity_requested: number;
  quantity_dispatched: number;
  unit_price: number;
}

export interface ApiKey {
  id: string;
  organization_id: string;
  key_hash: string;
  label: string;
  scopes: string[]; // ['billing:read', 'inventory:read', 'inventory:write']
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

// Database schema container
export interface DatabaseSchema {
  users: AuthUser[];
  organizations: Organization[];
  warehouses: Warehouse[];
  zones: Zone[];
  products: Product[];
  suppliers: Supplier[];
  inventory: Inventory[];
  stock_movements: StockMovement[];
  purchase_orders: PurchaseOrder[];
  purchase_order_items: PurchaseOrderItem[];
  dispatch_orders: DispatchOrder[];
  dispatch_order_items: DispatchOrderItem[];
  api_keys: ApiKey[];
}

const emptyDatabase: DatabaseSchema = {
  users: [],
  organizations: [],
  warehouses: [],
  zones: [],
  products: [],
  suppliers: [],
  inventory: [],
  stock_movements: [],
  purchase_orders: [],
  purchase_order_items: [],
  dispatch_orders: [],
  dispatch_order_items: [],
  api_keys: [],
};

// --- DATA ACCESS LAYER (DAL) ---

class WMSDatabase {
  private cache: DatabaseSchema = emptyDatabase;
  private caches: Record<string, DatabaseSchema> = {};

  constructor() {
    this.load();
    this.syncWithFirestore();
  }

  // Retrieve or initialize a tenant-specific isolated database cache
  public getTenantCache(orgId: string): DatabaseSchema {
    if (!orgId) {
      return this.cache; // Fallback to global cache
    }
    
    if (!this.caches[orgId]) {
      const tenantFile = path.join(DATA_DIR, `wms_database_${orgId}.json`);
      if (fs.existsSync(tenantFile)) {
        try {
          this.caches[orgId] = JSON.parse(fs.readFileSync(tenantFile, "utf-8"));
          console.log(`Loaded tenant WMS partition JSON for Org: ${orgId}`);
        } catch (e) {
          console.error(`Failed to parse tenant database partition ${orgId}, creating clean:`, e);
          this.caches[orgId] = this.createNewTenantSchema(orgId);
        }
      } else {
        this.caches[orgId] = this.createNewTenantSchema(orgId);
        // Start background Firestore sync for this user storage
        this.syncTenantFromFirestore(orgId);
      }
    }
    return this.caches[orgId];
  }

  private createNewTenantSchema(orgId: string): DatabaseSchema {
    return {
      users: [...this.cache.users],
      organizations: this.cache.organizations.filter(o => o.id === orgId),
      warehouses: [],
      zones: [],
      products: [],
      suppliers: [],
      inventory: [],
      stock_movements: [],
      purchase_orders: [],
      purchase_order_items: [],
      dispatch_orders: [],
      dispatch_order_items: [],
      api_keys: []
    };
  }

  // Load database from file with seeding
  private load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.cache = JSON.parse(fileContent);
      } catch (e) {
        console.error("Failed to parse database file, starting clean", e);
        this.cache = { ...emptyDatabase };
        this.save();
      }
    } else {
      this.cache = { ...emptyDatabase };
      this.seedInitialData();
      this.save();
    }
  }

  // Dynamic user specific Firestore load & sync engine
  public async syncTenantFromFirestore(orgId: string) {
    if (!firestoreDb || !orgId) return;
    try {
      console.log(`Initiating Cloud Firestore state sync for tenant ID: ${orgId}...`);
      const docRef = doc(firestoreDb, "wms_tenants", orgId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as DatabaseSchema;
        if (remoteData) {
          this.caches[orgId] = {
            ...this.createNewTenantSchema(orgId),
            ...remoteData
          };
          this.saveTenant(orgId);
          console.log(`Successfully fetched and synced user tenant state '${orgId}' from Google Cloud Firestore.`);
        }
      } else {
        // Publish default baseline
        const tenantData = this.getTenantCache(orgId);
        await setDoc(docRef, tenantData);
        console.log(`Published new tenant baseline for Org ID: ${orgId} to Cloud Firestore.`);
      }
    } catch (e) {
      console.error(`Failed cloud-sync database replication for tenant ${orgId}:`, e);
    }
  }

  // Safe background Firestore load/synchronizer (Global Users table)
  public async syncWithFirestore() {
    if (!firestoreDb) return;
    try {
      console.log("Initiating Cloud Firestore main registry synchronization...");
      const docRef = doc(firestoreDb, "wms_data", "current_state");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as DatabaseSchema;
        if (remoteData && Array.isArray(remoteData.users) && Array.isArray(remoteData.organizations)) {
          this.cache = { ...emptyDatabase, ...remoteData };
          fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
          console.log("Successfully restored registry cache from central Cloud Firestore.");
        }
      } else {
        await setDoc(docRef, this.cache);
        console.log("Published master baseline to central Cloud Firestore.");
      }
    } catch (e) {
      console.error("Failed cloud-sync register with central Firestore:", e);
    }
  }

  // Save changes for a secure tenant-specific partition to disk & Cloud Firestore
  public saveTenant(orgId: string) {
    if (!orgId) {
      this.save();
      return;
    }
    try {
      const tenantFile = path.join(DATA_DIR, `wms_database_${orgId}.json`);
      const tenantData = this.getTenantCache(orgId);
      fs.writeFileSync(tenantFile, JSON.stringify(tenantData, null, 2), "utf-8");

      // Dynamic sync with global users list
      this.cache.users = Array.from(new Set([...this.cache.users, ...tenantData.users]));
      tenantData.organizations.forEach(o => {
        if (!this.cache.organizations.some(x => x.id === o.id)) {
          this.cache.organizations.push(o);
        }
      });
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
      
      // Asynchronously upload state replica to Cloud Firestore under unique tenant ID
      if (firestoreDb) {
        const docRef = doc(firestoreDb, "wms_tenants", orgId);
        setDoc(docRef, tenantData).catch(err => {
          console.error(`Error writing asynchronous snapshot to Cloud Firestore for tenant ${orgId}:`, err);
        });
      }
    } catch (e) {
      console.error(`Failed to write tenant database file for org ${orgId}:`, e);
    }
  }

  // Save changes to disk and replicate to Firebase Firestore (Global Registry fallback)
  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
      
      if (firestoreDb) {
        const docRef = doc(firestoreDb, "wms_data", "current_state");
        setDoc(docRef, this.cache).catch(err => {
          console.error("Error writing asynchronous snapshot to Cloud Firestore:", err);
        });
      }
    } catch (e) {
      console.error("Failed to write database file", e);
    }
  }

  // Helper validation for ISO 8601
  public isValidISO8601(dateStr: string): boolean {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
    return iso8601Regex.test(dateStr) && !isNaN(Date.parse(dateStr));
  }

  // Auto-generate PO Number in format PO-YYYYMM-XXXX
  public generatePONumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `PO-${year}${month}-`;
    
    // Find highest suffix for this month
    const currentPOs = this.cache.purchase_orders.filter(po => po.po_number.startsWith(prefix));
    let nextNum = 1;
    if (currentPOs.length > 0) {
      const nums = currentPOs.map(po => {
        const parts = po.po_number.split("-");
        const suffix = parseInt(parts[parts.length - 1], 10);
        return isNaN(suffix) ? 0 : suffix;
      });
      nextNum = Math.max(...nums) + 1;
    }
    
    return `${prefix}${String(nextNum).padStart(4, "0")}`;
  }

  private seedInitialData() {
    console.log("Seeding initial database content mock...");
    
    // 1. Seed standard demo user
    const adminUser: AuthUser = {
      id: "usr-demo-admin-id",
      email: "mdnoor4860@gmail.com",
      password_hash: crypto.createHash("sha256").update("password123").digest("hex"),
      name: "Demo Manager",
      created_at: "2026-06-01T00:00:00Z",
    };
    
    // 2. Seed organization
    const org: Organization = {
      id: "org-demo-id",
      name: "LogiStore Solutions",
      business_type: "ecommerce",
      owner_id: adminUser.id,
      subscription_plan: "starter",
      subscription_status: "active",
      billing_email: "mdnoor4860@gmail.com",
      razorpay_customer_id: "cust_demo_12345",
      created_at: "2026-06-01T00:00:00Z",
    };

    // 3. Seed warehouses
    const warehouse1: Warehouse = {
      id: "wh-1",
      organization_id: org.id,
      name: "Mumbai Fulfillment Core",
      address: "Bld 4, Warehousing Zone, JNPT Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400707",
      country: "India",
      total_capacity: 50000,
      capacity_unit: "sqft",
      manager_name: "Rahul Sharma",
      manager_phone: "+919876543210",
      is_active: true,
      created_at: "2026-06-01T01:00:00Z",
    };
    
    const warehouse2: Warehouse = {
      id: "wh-2",
      organization_id: org.id,
      name: "Bengaluru Cold Storage",
      address: "G-98, Industrial Area Phase II, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      country: "India",
      total_capacity: 15000,
      capacity_unit: "sqft",
      manager_name: "Anita Deshmukh",
      manager_phone: "+919876543211",
      is_active: true,
      created_at: "2026-06-02T01:00:00Z",
    };

    // 4. Seed zones
    const zones: Zone[] = [
      { id: "zone-1-rec", warehouse_id: "wh-1", name: "Receiving Bay A", zone_type: "receiving", capacity: 8000, created_at: "2026-06-01T02:00:00Z" },
      { id: "zone-1-stor", warehouse_id: "wh-1", name: "High-Rack Storage 1", zone_type: "storage", capacity: 35000, created_at: "2026-06-01T02:00:00Z" },
      { id: "zone-1-disp", warehouse_id: "wh-1", name: "Dispatch & Packing", zone_type: "dispatch", capacity: 7000, created_at: "2026-06-01T02:00:00Z" },
      { id: "zone-2-cold", warehouse_id: "wh-2", name: "Freezer Deep Room", zone_type: "cold", capacity: 10000, created_at: "2026-06-02T02:00:00Z" },
    ];

    // 5. Seed suppliers
    const suppliers: Supplier[] = [
      {
        id: "sup-1",
        organization_id: org.id,
        name: "Prime Agro & Foods Industry",
        contact_person: "Vikram Sen",
        email: "contact@primeagro.com",
        phone: "+919911882233",
        address: "71, Food Park, NH-1, Sonipat, Haryana",
        gst_number: "06AAAAA1111A1Z1",
        payment_terms: "NET_30",
        created_at: "2026-06-01T03:00:00Z",
      },
      {
        id: "sup-2",
        organization_id: org.id,
        name: "Apex Electronics Supplies",
        contact_person: "Rohit Goel",
        email: "sales@apexelectronics.in",
        phone: "+911145678901",
        address: "Lane 2, Nehru Place, New Delhi",
        gst_number: "07BBBBB2222B2Z2",
        payment_terms: "COD",
        created_at: "2026-06-02T03:00:00Z",
      }
    ];

    // 6. Seed products
    const products: Product[] = [
      {
        id: "prod-1",
        organization_id: org.id,
        sku: "PROD-EL-LAP01",
        name: "UltraBook Pro Core i7",
        description: "High-end developer series laptop with 32GB RAM, 1TB SSD",
        category: "Electronics",
        unit_of_measure: "piece",
        unit_price: 85000,
        reorder_level: 10,
        hsn_code: "84713010",
        gst_rate: 18,
        image_url: "https://images.unsplash.com/photo-1496181130204-755241544e35?w=200&auto=format&fit=crop&q=60",
        is_active: true,
        created_at: "2026-06-01T04:00:00Z",
      },
      {
        id: "prod-2",
        organization_id: org.id,
        sku: "PROD-FD-ORG01",
        name: "Organic Honey Wildflower",
        description: "Pure wildflower unprocessed honey 500g glass jar",
        category: "Food",
        unit_of_measure: "piece",
        unit_price: 350,
        reorder_level: 50,
        hsn_code: "04090000",
        gst_rate: 5,
        image_url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&auto=format&fit=crop&q=60",
        is_active: true,
        created_at: "2026-06-01T04:05:00Z",
      },
      {
        id: "prod-3",
        organization_id: org.id,
        sku: "PROD-FD-ICE02",
        name: "Premium Belgian Chocolate Tub (4L)",
        description: "Cold-chain ice cream for distribution (requires cold zoning)",
        category: "Cold-Storage Food",
        unit_of_measure: "piece",
        unit_price: 1800,
        reorder_level: 15,
        hsn_code: "21050000",
        gst_rate: 18,
        image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&auto=format&fit=crop&q=60",
        is_active: true,
        created_at: "2026-06-02T04:00:00Z",
      }
    ];

    // 7. Seed inventories
    const inventories: Inventory[] = [
      {
        id: "inv-1",
        warehouse_id: "wh-1",
        zone_id: "zone-1-stor",
        product_id: "prod-1",
        quantity_available: 45,
        quantity_reserved: 5,
        batch_number: "BATCH-202606-01",
        expiry_date: null,
        location_code: "A1-R2-S3",
        last_updated: "2026-06-03T10:00:00Z"
      },
      {
        id: "inv-2",
        warehouse_id: "wh-1",
        zone_id: "zone-1-stor",
        product_id: "prod-2",
        quantity_available: 120,
        quantity_reserved: 10,
        batch_number: "HONEY-RUN-038",
        expiry_date: "2028-06-01",
        location_code: "B3-R1-S2",
        last_updated: "2026-06-04T12:00:00Z"
      },
      {
        id: "inv-3",
        warehouse_id: "wh-2",
        zone_id: "zone-2-cold",
        product_id: "prod-3",
        quantity_available: 8, // Low Stock Alert Triggered! Reorder is 15.
        quantity_reserved: 0,
        batch_number: "ICE-BELG-99",
        expiry_date: "2026-11-23",
        location_code: "COLD-F1-S1",
        last_updated: "2026-06-05T09:30:00Z"
      }
    ];

    // 8. Seed Stock Movements
    const stockMovements: StockMovement[] = [
      {
        id: "move-1",
        organization_id: org.id,
        warehouse_id: "wh-1",
        product_id: "prod-1",
        movement_type: "inbound",
        quantity: 50,
        reference_id: "po-seed-id",
        reference_type: "purchase_order",
        notes: "Initial receiving from PO-202606-0001",
        performed_by: adminUser.id,
        created_at: "2026-06-03T10:00:00Z"
      },
      {
        id: "move-2",
        organization_id: org.id,
        warehouse_id: "wh-1",
        product_id: "prod-1",
        movement_type: "outbound",
        quantity: 5,
        reference_id: "do-seed-id",
        reference_type: "dispatch_order",
        notes: "Picked for shipment reference ORDER-9010",
        performed_by: adminUser.id,
        created_at: "2026-06-04T15:30:00Z"
      }
    ];

    // 9. Purchase Orders
    const purchaseOrders: PurchaseOrder[] = [
      {
        id: "po-seed-id",
        organization_id: org.id,
        warehouse_id: "wh-1",
        supplier_id: "sup-2",
        po_number: "PO-202606-0001",
        status: "received",
        expected_delivery_date: "2026-06-03",
        total_amount: 4250000, // 50 * 85000
        notes: "Launch stock purchase for core catalog",
        created_by: adminUser.id,
        created_at: "2026-06-01T10:00:00Z"
      }
    ];

    const purchaseOrderItems: PurchaseOrderItem[] = [
      {
        id: "poi-1",
        purchase_order_id: "po-seed-id",
        product_id: "prod-1",
        quantity_ordered: 50,
        quantity_received: 50,
        unit_price: 85000
      }
    ];

    // 10. Dispatch Orders
    const dispatchOrders: DispatchOrder[] = [
      {
        id: "do-seed-id",
        organization_id: org.id,
        warehouse_id: "wh-1",
        order_reference: "DO-202606-9010",
        customer_name: "Gaurav Malhotra (Nexus Retail)",
        customer_phone: "+919988776655",
        delivery_address: "Tech Hub Sector 5, Block B, Gurgaon, Haryana",
        status: "dispatched",
        dispatch_date: "2026-06-04",
        total_amount: 425000, // 5 * 85000
        notes: "Corporate supply checkout",
        created_by: adminUser.id,
        created_at: "2026-06-02T15:00:00Z"
      }
    ];

    const dispatchOrderItems: DispatchOrderItem[] = [
      {
        id: "doi-1",
        dispatch_order_id: "do-seed-id",
        product_id: "prod-1",
        quantity_requested: 5,
        quantity_dispatched: 5,
        unit_price: 85000
      }
    ];

    // 11. Seed Api Key
    // Hashed api key is SHA-256 profile of 'wms_key_test_123456789'
    const rawKey = "wms_key_test_123456789"; 
    const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const apiKey: ApiKey = {
      id: "key-1",
      organization_id: org.id,
      key_hash: hash,
      label: "Billing App Production Integration",
      scopes: ["billing:read", "inventory:read"],
      is_active: true,
      last_used_at: "2026-06-05T14:22:00Z",
      created_at: "2026-06-01T05:00:00Z"
    };

    this.cache = {
      users: [adminUser],
      organizations: [org],
      warehouses: [warehouse1, warehouse2],
      zones,
      products,
      suppliers,
      inventory: inventories,
      stock_movements: stockMovements,
      purchase_orders: purchaseOrders,
      purchase_order_items: purchaseOrderItems,
      dispatch_orders: dispatchOrders,
      dispatch_order_items: dispatchOrderItems,
      api_keys: [apiKey]
    };
  }

  // --- ENTITY SERVICE METHODS ---

  // Auth Users
  public getUsers() { return this.cache.users; }
  public addUser(u: AuthUser) { this.cache.users.push(u); this.save(); }

  // Organizations
  public getOrganizations() { return this.cache.organizations; }
  public getOrganizationById(id: string) { return this.cache.organizations.find(o => o.id === id); }
  public addOrganization(org: Organization) { this.cache.organizations.push(org); this.save(); }
  public updateOrganization(id: string, updates: Partial<Organization>) {
    const org = this.getOrganizationById(id);
    if (org) {
      Object.assign(org, updates);
      this.save();
    }
    return org;
  }

  // Warehouses
  public getWarehouses(orgId: string) { 
    return this.getTenantCache(orgId).warehouses; 
  }
  public getWarehouseById(id: string, orgId?: string) { 
    if (orgId) {
      return this.getTenantCache(orgId).warehouses.find(w => w.id === id);
    }
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].warehouses.find(w => w.id === id);
      if (found) return found;
    }
    return this.cache.warehouses.find(w => w.id === id); 
  }
  public addWarehouse(w: Warehouse) { 
    const tenant = this.getTenantCache(w.organization_id);
    tenant.warehouses.push(w); 
    this.saveTenant(w.organization_id); 
    return w;
  }
  public updateWarehouse(id: string, updates: Partial<Warehouse>) {
    const w = this.getWarehouseById(id);
    if (w) {
      Object.assign(w, updates);
      this.saveTenant(w.organization_id);
    }
    return w;
  }
  public deleteWarehouse(id: string) {
    const w = this.getWarehouseById(id);
    if (w) {
      const orgId = w.organization_id;
      const tenant = this.getTenantCache(orgId);
      tenant.warehouses = tenant.warehouses.filter(x => x.id !== id);
      tenant.zones = tenant.zones.filter(z => z.warehouse_id !== id);
      tenant.inventory = tenant.inventory.filter(i => i.warehouse_id !== id);
      this.saveTenant(orgId);
    }
    return true;
  }

  // Zones
  public getZonesByWarehouse(whId: string) {
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].zones.filter(z => z.warehouse_id === whId);
      if (found.length > 0) return found;
    }
    return this.cache.zones.filter(z => z.warehouse_id === whId);
  }
  public getZonesByOrg(orgId: string) {
    const tenant = this.getTenantCache(orgId);
    const whs = tenant.warehouses.map(w => w.id);
    return tenant.zones.filter(z => whs.includes(z.warehouse_id));
  }
  public getZoneById(id: string) {
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].zones.find(z => z.id === id);
      if (found) return found;
    }
    return this.cache.zones.find(z => z.id === id);
  }
  public addZone(z: Zone) {
    const wh = this.getWarehouseById(z.warehouse_id);
    if (wh) {
      const tenant = this.getTenantCache(wh.organization_id);
      tenant.zones.push(z);
      this.saveTenant(wh.organization_id);
    } else {
      this.cache.zones.push(z);
      this.save();
    }
    return z;
  }
  public updateZone(id: string, updates: Partial<Zone>) {
    const z = this.getZoneById(id);
    if (z) {
      Object.assign(z, updates);
      const wh = this.getWarehouseById(z.warehouse_id);
      if (wh) {
        this.saveTenant(wh.organization_id);
      } else {
        this.save();
      }
    }
    return z;
  }
  public deleteZone(id: string) {
    const z = this.getZoneById(id);
    if (z) {
      const wh = this.getWarehouseById(z.warehouse_id);
      const orgId = wh ? wh.organization_id : "";
      const tenant = this.getTenantCache(orgId);
      tenant.zones = tenant.zones.filter(x => x.id !== id);
      tenant.inventory.forEach(i => {
        if (i.zone_id === id) {
          i.zone_id = "";
        }
      });
      if (orgId) {
        this.saveTenant(orgId);
      } else {
        this.save();
      }
    }
    return true;
  }

  // Products
  public getProducts(orgId: string) {
    return this.getTenantCache(orgId).products;
  }
  public getProductById(id: string) {
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].products.find(p => p.id === id);
      if (found) return found;
    }
    return this.cache.products.find(p => p.id === id);
  }
  public getProductBySku(orgId: string, sku: string) {
    return this.getTenantCache(orgId).products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
  }
  public addProduct(p: Product) {
    const tenant = this.getTenantCache(p.organization_id);
    const exists = tenant.products.find(x => x.sku.toLowerCase() === p.sku.toLowerCase());
    if (exists) throw new Error(`Product SKU '${p.sku}' already exists in your organization`);
    tenant.products.push(p);
    this.saveTenant(p.organization_id);
    return p;
  }
  public updateProduct(id: string, updates: Partial<Product>) {
    const p = this.getProductById(id);
    if (p) {
      const tenant = this.getTenantCache(p.organization_id);
      if (updates.sku && updates.sku.toLowerCase() !== p.sku.toLowerCase()) {
        const exists = tenant.products.find(x => x.sku.toLowerCase() === updates.sku?.toLowerCase());
        if (exists) throw new Error(`Product SKU '${updates.sku}' already exists in your organization`);
      }
      Object.assign(p, updates);
      this.saveTenant(p.organization_id);
    }
    return p;
  }
  public deleteProduct(id: string) {
    const p = this.getProductById(id);
    if (p) {
      const orgId = p.organization_id;
      const tenant = this.getTenantCache(orgId);
      tenant.products = tenant.products.filter(x => x.id !== id);
      tenant.inventory = tenant.inventory.filter(i => i.product_id !== id);
      this.saveTenant(orgId);
    }
    return true;
  }

  // Suppliers
  public getSuppliers(orgId: string) {
    return this.getTenantCache(orgId).suppliers;
  }
  public getSupplierById(id: string) {
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].suppliers.find(s => s.id === id);
      if (found) return found;
    }
    return this.cache.suppliers.find(s => s.id === id);
  }
  public addSupplier(s: Supplier) {
    const tenant = this.getTenantCache(s.organization_id);
    tenant.suppliers.push(s);
    this.saveTenant(s.organization_id);
    return s;
  }
  public updateSupplier(id: string, updates: Partial<Supplier>) {
    const s = this.getSupplierById(id);
    if (s) {
      Object.assign(s, updates);
      this.saveTenant(s.organization_id);
    }
    return s;
  }
  public deleteSupplier(id: string) {
    const s = this.getSupplierById(id);
    if (s) {
      const orgId = s.organization_id;
      const tenant = this.getTenantCache(orgId);
      tenant.suppliers = tenant.suppliers.filter(x => x.id !== id);
      this.saveTenant(orgId);
    }
    return true;
  }

  // Inventory
  public getInventoryByWarehouse(whId: string) {
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].inventory.filter(i => i.warehouse_id === whId);
      if (found.length > 0) return found;
    }
    return this.cache.inventory.filter(i => i.warehouse_id === whId);
  }
  public getInventoryByOrg(orgId: string) {
    const tenant = this.getTenantCache(orgId);
    const whs = tenant.warehouses.map(w => w.id);
    return tenant.inventory.filter(i => whs.includes(i.warehouse_id));
  }
  public getInventoryById(id: string) {
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].inventory.find(i => i.id === id);
      if (found) return found;
    }
    return this.cache.inventory.find(i => i.id === id);
  }
  public addInventoryRecord(i: Inventory) {
    const wh = this.getWarehouseById(i.warehouse_id);
    const orgId = wh ? wh.organization_id : "";
    const tenant = this.getTenantCache(orgId);
    
    const duplicate = tenant.inventory.find(
      x => x.warehouse_id === i.warehouse_id &&
           x.product_id === i.product_id &&
           x.batch_number.toLowerCase() === i.batch_number.toLowerCase()
    );
    if (duplicate) {
      duplicate.quantity_available += i.quantity_available;
      duplicate.quantity_reserved += i.quantity_reserved;
      duplicate.last_updated = new Date().toISOString();
      if (orgId) this.saveTenant(orgId);
      else this.save();
      return duplicate;
    }
    tenant.inventory.push(i);
    if (orgId) this.saveTenant(orgId);
    else this.save();
    return i;
  }
  public updateInventoryRecord(id: string, updates: Partial<Inventory>) {
    const i = this.getInventoryById(id);
    if (i) {
      Object.assign(i, updates);
      i.last_updated = new Date().toISOString();
      const wh = this.getWarehouseById(i.warehouse_id);
      if (wh) {
        this.saveTenant(wh.organization_id);
      } else {
        this.save();
      }
    }
    return i;
  }

  // Adjust stock method (Atomic adjustment + audit logging)
  public adjustStock(params: {
    orgId: string;
    warehouseId: string;
    zoneId: string;
    productId: string;
    quantityChange: number; // e.g., +20 or -15
    batchNumber: string;
    expiryDate?: string;
    locationCode: string;
    notes: string;
    userId: string;
  }) {
    const { orgId, warehouseId, zoneId, productId, quantityChange, batchNumber, expiryDate, locationCode, notes, userId } = params;

    const tenant = this.getTenantCache(orgId);

    // Verify product and warehouse belong to organization
    const wh = this.getWarehouseById(warehouseId, orgId);
    if (!wh || wh.organization_id !== orgId) throw new Error("Invalid Warehouse selected");
    
    const prod = this.getProductById(productId);
    if (!prod || prod.organization_id !== orgId) throw new Error("Invalid Product selected");

    // Retrieve or create inventory record
    let records = tenant.inventory.find(
      i => i.warehouse_id === warehouseId &&
           i.product_id === productId &&
           i.batch_number === batchNumber
    );

    if (records) {
      const newQty = records.quantity_available + quantityChange;
      if (newQty < 0) {
        throw new Error(`Insufficient stock level. Available: ${records.quantity_available}, adjustment: ${quantityChange}`);
      }
      records.quantity_available = newQty;
      records.last_updated = new Date().toISOString();
      if (zoneId) records.zone_id = zoneId;
      if (locationCode) records.location_code = locationCode;
      if (expiryDate !== undefined) records.expiry_date = expiryDate || null;
    } else {
      if (quantityChange < 0) {
        throw new Error(`Insufficient stock level. No inventory record found to deduct.`);
      }
      records = {
        id: "inv-" + crypto.randomUUID(),
        warehouse_id: warehouseId,
        zone_id: zoneId || "",
        product_id: productId,
        quantity_available: quantityChange,
        quantity_reserved: 0,
        batch_number: batchNumber,
        expiry_date: expiryDate || null,
        location_code: locationCode,
        last_updated: new Date().toISOString()
      };
      tenant.inventory.push(records);
    }

    // Log Stock Movement immediately (Audit Trail)
    const movement: StockMovement = {
      id: "move-" + crypto.randomUUID(),
      organization_id: orgId,
      warehouse_id: warehouseId,
      product_id: productId,
      movement_type: "adjustment",
      quantity: Math.abs(quantityChange),
      reference_id: null,
      reference_type: null,
      notes: notes || "Manual inventory adjustment",
      performed_by: userId,
      created_at: new Date().toISOString()
    };
    tenant.stock_movements.push(movement);
    this.saveTenant(orgId);

    return { records, movement };
  }

  // Stock Movements Audit view
  public getStockMovements(orgId: string) {
    return this.getTenantCache(orgId).stock_movements;
  }
  public addStockMovement(m: StockMovement) {
    const tenant = this.getTenantCache(m.organization_id);
    tenant.stock_movements.push(m);
    this.saveTenant(m.organization_id);
    return m;
  }

  // Purchase Orders
  public getPurchaseOrders(orgId: string) {
    return this.getTenantCache(orgId).purchase_orders;
  }
  public getPurchaseOrderById(id: string, orgId?: string) {
    if (orgId) {
      return this.getTenantCache(orgId).purchase_orders.find(po => po.id === id);
    }
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].purchase_orders.find(po => po.id === id);
      if (found) return found;
    }
    return this.cache.purchase_orders.find(po => po.id === id);
  }
  public getPurchaseOrderItems(poId: string) {
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].purchase_order_items.filter(item => item.purchase_order_id === poId);
      if (found.length > 0) return found;
    }
    return this.cache.purchase_order_items.filter(item => item.purchase_order_id === poId);
  }
  public addPurchaseOrder(po: PurchaseOrder, items: Array<Omit<PurchaseOrderItem, "id" | "purchase_order_id">>) {
    const orgId = po.organization_id;
    const tenant = this.getTenantCache(orgId);

    // Auto-generate PO number
    if (!po.po_number) {
      po.po_number = this.generatePONumber();
    }
    
    tenant.purchase_orders.push(po);
    
    const formattedItems = items.map(it => {
      const formatted: PurchaseOrderItem = {
        id: "poi-" + crypto.randomUUID(),
        purchase_order_id: po.id,
        product_id: it.product_id,
        quantity_ordered: it.quantity_ordered,
        quantity_received: it.quantity_received || 0,
        unit_price: it.unit_price
      };
      tenant.purchase_order_items.push(formatted);
      return formatted;
    });

    this.saveTenant(orgId);
    return { purchaseOrder: po, items: formattedItems };
  }

  // Receive Purchase Order (Database Transaction Simulator)
  public receivePurchaseOrder(params: {
    orgId: string;
    poId: string;
    receivingWarehouseId: string;
    receivingZoneId: string;
    itemsReceived: Array<{
      product_id: string;
      quantity_received: number;
      batch_number: string;
      expiry_date?: string;
      location_code: string;
    }>;
    userId: string;
  }) {
    const { orgId, poId, receivingWarehouseId, receivingZoneId, itemsReceived, userId } = params;
    const tenant = this.getTenantCache(orgId);

    const po = this.getPurchaseOrderById(poId, orgId);
    if (!po || po.organization_id !== orgId) throw new Error("Purchase Order not found");
    if (po.status === "received" || po.status === "cancelled") {
      throw new Error(`This Purchase Order is already in status '${po.status}'`);
    }

    // Verify warehouse
    const wh = this.getWarehouseById(receivingWarehouseId, orgId);
    if (!wh || wh.organization_id !== orgId) throw new Error("Invalid receiving warehouse");

    // Fetch original items
    const poItems = this.getPurchaseOrderItems(poId);

    // Apply adjustments & log stock movements atomically
    const movementsCreated: StockMovement[] = [];

    for (const rx of itemsReceived) {
      if (rx.quantity_received <= 0) continue;

      const matchedPOItem = poItems.find(it => it.product_id === rx.product_id);
      if (!matchedPOItem) throw new Error(`Product '${rx.product_id}' is not part of this Purchase Order`);

      // Update received quantity inside the PO
      matchedPOItem.quantity_received = (matchedPOItem.quantity_received || 0) + rx.quantity_received;

      // Add actual inventory record
      let inv = tenant.inventory.find(
        i => i.warehouse_id === receivingWarehouseId &&
             i.product_id === rx.product_id &&
             i.batch_number === rx.batch_number
      );

      if (inv) {
        inv.quantity_available += rx.quantity_received;
        inv.last_updated = new Date().toISOString();
        if (receivingZoneId) inv.zone_id = receivingZoneId;
        if (rx.location_code) inv.location_code = rx.location_code;
        if (rx.expiry_date) inv.expiry_date = rx.expiry_date;
      } else {
        inv = {
          id: "inv-" + crypto.randomUUID(),
          warehouse_id: receivingWarehouseId,
          zone_id: receivingZoneId || "",
          product_id: rx.product_id,
          quantity_available: rx.quantity_received,
          quantity_reserved: 0,
          batch_number: rx.batch_number,
          expiry_date: rx.expiry_date || null,
          location_code: rx.location_code || "GEN-01",
          last_updated: new Date().toISOString()
        };
        tenant.inventory.push(inv);
      }

      // Record detailed Audit
      const movement: StockMovement = {
        id: "move-" + crypto.randomUUID(),
        organization_id: orgId,
        warehouse_id: receivingWarehouseId,
        product_id: rx.product_id,
        movement_type: "inbound",
        quantity: rx.quantity_received,
        reference_id: po.id,
        reference_type: "purchase_order",
        notes: `Received stock PO batch '${rx.batch_number}' via Purchase Order ${po.po_number}`,
        performed_by: userId,
        created_at: new Date().toISOString()
      };
      tenant.stock_movements.push(movement);
      movementsCreated.push(movement);
    }

    // Recalculate status of the PO
    let totalOrdered = 0;
    let totalReceived = 0;
    poItems.forEach(it => {
      totalOrdered += it.quantity_ordered;
      totalReceived += it.quantity_received;
    });

    if (totalReceived >= totalOrdered) {
      po.status = "received";
    } else if (totalReceived > 0) {
      po.status = "partial";
    } else {
      po.status = "sent";
    }

    this.saveTenant(orgId);
    return { purchaseOrder: po, poItems, movementsCreated };
  }

  // Dispatch Orders
  public getDispatchOrders(orgId: string) {
    return this.getTenantCache(orgId).dispatch_orders;
  }
  public getDispatchOrderById(id: string, orgId?: string) {
    if (orgId) {
      return this.getTenantCache(orgId).dispatch_orders.find(doOrder => doOrder.id === id);
    }
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].dispatch_orders.find(doOrder => doOrder.id === id);
      if (found) return found;
    }
    return this.cache.dispatch_orders.find(doOrder => doOrder.id === id);
  }
  public getDispatchOrderItems(doId: string) {
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].dispatch_order_items.filter(item => item.dispatch_order_id === doId);
      if (found.length > 0) return found;
    }
    return this.cache.dispatch_order_items.filter(item => item.dispatch_order_id === doId);
  }
  public addDispatchOrder(doOrder: DispatchOrder, items: Array<Omit<DispatchOrderItem, "id" | "dispatch_order_id">>) {
    const orgId = doOrder.organization_id;
    const tenant = this.getTenantCache(orgId);
    tenant.dispatch_orders.push(doOrder);
    
    const formattedItems = items.map(it => {
      const formatted: DispatchOrderItem = {
        id: "doi-" + crypto.randomUUID(),
        dispatch_order_id: doOrder.id,
        product_id: it.product_id,
        quantity_requested: it.quantity_requested,
        quantity_dispatched: it.quantity_dispatched || 0,
        unit_price: it.unit_price
      };
      tenant.dispatch_order_items.push(formatted);
      return formatted;
    });

    this.saveTenant(orgId);
    return { dispatchOrder: doOrder, items: formattedItems };
  }

  // Process / Dispatch Outbound Shipment (Atomic inventory reduction)
  public dispatchOrder(params: {
    orgId: string;
    doId: string;
    dispatchWarehouseId: string;
    itemsDispatched: Array<{
      product_id: string;
      quantity_dispatched: number;
      batch_number: string;
    }>;
    userId: string;
  }) {
    const { orgId, doId, dispatchWarehouseId, itemsDispatched, userId } = params;
    const tenant = this.getTenantCache(orgId);

    const dispatchOrderObj = this.getDispatchOrderById(doId, orgId);
    if (!dispatchOrderObj || dispatchOrderObj.organization_id !== orgId) {
      throw new Error("Dispatch Order not found");
    }
    if (dispatchOrderObj.status === "dispatched" || dispatchOrderObj.status === "delivered" || dispatchOrderObj.status === "cancelled") {
      throw new Error(`This Outbound Order is already in status '${dispatchOrderObj.status}'`);
    }

    // Verify warehouse
    const wh = this.getWarehouseById(dispatchWarehouseId, orgId);
    if (!wh || wh.organization_id !== orgId) throw new Error("Invalid source warehouse");

    const doItemsObj = this.getDispatchOrderItems(doId);
    const movementsCreated: StockMovement[] = [];

    // Let's verify batch availability and subtract inventory
    for (const dTx of itemsDispatched) {
      if (dTx.quantity_dispatched <= 0) continue;

      const matchedOrderItem = doItemsObj.find(it => it.product_id === dTx.product_id);
      if (!matchedOrderItem) throw new Error(`Product '${dTx.product_id}' is not requested in this Order`);

      // Find precise batch record
      const invRecord = tenant.inventory.find(
        i => i.warehouse_id === dispatchWarehouseId &&
             i.product_id === dTx.product_id &&
             i.batch_number === dTx.batch_number
      );

      if (!invRecord || invRecord.quantity_available < dTx.quantity_dispatched) {
        throw new Error(`Insufficient Batch Quantity for product '${dTx.product_id}' from batch '${dTx.batch_number}'. Requested: ${dTx.quantity_dispatched}, Available: ${invRecord ? invRecord.quantity_available : 0}`);
      }

      // Record deduction
      invRecord.quantity_available -= dTx.quantity_dispatched;
      invRecord.last_updated = new Date().toISOString();
      
      // Update dispatched tally in order
      matchedOrderItem.quantity_dispatched = (matchedOrderItem.quantity_dispatched || 0) + dTx.quantity_dispatched;

      // Log Outbound audit trail
      const movement: StockMovement = {
        id: "move-" + crypto.randomUUID(),
        organization_id: orgId,
        warehouse_id: dispatchWarehouseId,
        product_id: dTx.product_id,
        movement_type: "outbound",
        quantity: dTx.quantity_dispatched,
        reference_id: dispatchOrderObj.id,
        reference_type: "dispatch_order",
        notes: `Dispatched outbound shipment batch '${dTx.batch_number}' via Dispatch Order ${dispatchOrderObj.order_reference}`,
        performed_by: userId,
        created_at: new Date().toISOString()
      };
      
      tenant.stock_movements.push(movement);
      movementsCreated.push(movement);
    }

    // Decide final status
    let totalRequested = 0;
    let totalDispatched = 0;
    doItemsObj.forEach(it => {
      totalRequested += it.quantity_requested;
      totalDispatched += it.quantity_dispatched;
    });

    if (totalDispatched >= totalRequested) {
      dispatchOrderObj.status = "dispatched";
    } else if (totalDispatched > 0) {
      dispatchOrderObj.status = "packed";
    } else {
      dispatchOrderObj.status = "picking";
    }
    dispatchOrderObj.dispatch_date = new Date().toISOString().split("T")[0];

    this.saveTenant(orgId);
    return { dispatchOrder: dispatchOrderObj, doItems: doItemsObj, movementsCreated };
  }

  // API Keys
  public getApiKeys(orgId: string) {
    return this.getTenantCache(orgId).api_keys;
  }
  public addApiKey(k: ApiKey) {
    const tenant = this.getTenantCache(k.organization_id);
    tenant.api_keys.push(k);
    this.saveTenant(k.organization_id);
    return k;
  }
  public findApiKeyByHash(hash: string) {
    for (const key of Object.keys(this.caches)) {
      const found = this.caches[key].api_keys.find(k => k.key_hash === hash && k.is_active);
      if (found) {
        found.last_used_at = new Date().toISOString();
        this.saveTenant(found.organization_id);
        return found;
      }
    }
    const key = this.cache.api_keys.find(k => k.key_hash === hash && k.is_active);
    if (key) {
      key.last_used_at = new Date().toISOString();
      this.save();
    }
    return key;
  }
  public revokeApiKey(id: string, orgId: string) {
    const tenant = this.getTenantCache(orgId);
    const key = tenant.api_keys.find(k => k.id === id && k.organization_id === orgId);
    if (key) {
      key.is_active = false;
      this.saveTenant(orgId);
    }
    return key;
  }
}

export const dbInstance = new WMSDatabase();
export default dbInstance;
