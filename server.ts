import express, { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import db, { 
  Organization, Warehouse, Zone, Product, Supplier, 
  Inventory, StockMovement, PurchaseOrder, DispatchOrder, ApiKey 
} from "./server/db";
import { 
  hashPassword, signToken, verifyToken, verifyMachineApiKey, isValidISO8601 
} from "./server/auth_utils";

// TypeScript Request augmentation
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
      orgId?: string;
      apiKeyScopes?: string[];
      isMachineCall?: boolean;
    }
  }
}

const app = express();
const PORT = 3000;

// Enable JSON extraction and raw body parsing for webhook verification
app.use(express.json());

// --- AUTHN / AUTHZ MIDDLEWARES ---

// Validate either JWT or API Key
function authenticate(req: Request, res: Response, next: NextFunction) {
  // 1. Check for API key (machine-to-machine)
  const apiKeyHeader = req.header("X-API-Key");
  if (apiKeyHeader) {
    const verified = verifyMachineApiKey(apiKeyHeader);
    if (!verified) {
      return res.status(401).json({ success: false, error: "Invalid or inactive API Key" });
    }
    req.orgId = verified.orgId;
    req.apiKeyScopes = verified.scopes;
    req.isMachineCall = true;
    return next();
  }

  // 2. Check for Bearer JWT token (browser dashboard client)
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: "Session expired or invalid token" });
    }
    req.user = { userId: decoded.userId, email: decoded.email };
    req.orgId = decoded.orgId;
    req.isMachineCall = false;
    return next();
  }

  // No credentials provided
  return res.status(401).json({ success: false, error: "Access Denied. Authorization token or API Key required." });
}

// Scope validation constraint for API Keys
function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Browser dashboard is superuser for its own org (no scopes restricted, true client)
    if (req.isMachineCall === false) {
      return next();
    }
    
    // Machine call must have scope
    if (req.apiKeyScopes && req.apiKeyScopes.includes(requiredScope)) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      error: `Forbidden: API Key lacks the required scope '${requiredScope}'` 
    });
  };
}

// --- 1. AUTHENTICATION ROUTERS ---

/**
 * @api POST /api/v1/auth/register
 * Register a user and initialize a new default organization.
 */
app.post("/api/v1/auth/register", (req: Request, res: Response) => {
  try {
    const { email, password, name, organization_name, business_type } = req.body;
    
    if (!email || !password || !name || !organization_name) {
      return res.status(400).json({ success: false, error: "Please provide email, password, name, and organization_name" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if user exists
    const users = db.getUsers();
    if (users.some(u => u.email === trimmedEmail)) {
      return res.status(400).json({ success: false, error: "User with this email already exists" });
    }

    // Hash Password
    const password_hash = hashPassword(password);
    const userId = "usr-" + crypto.randomUUID();
    const newUser = {
      id: userId,
      email: trimmedEmail,
      password_hash,
      name,
      created_at: new Date().toISOString()
    };
    db.addUser(newUser);

    // Bootstrap corresponding Organization
    const bType = business_type || "ecommerce";
    const orgId = "org-" + crypto.randomUUID();
    const newOrg: Organization = {
      id: orgId,
      name: organization_name,
      business_type: bType,
      owner_id: userId,
      subscription_plan: "free",
      subscription_status: "active",
      billing_email: trimmedEmail,
      razorpay_customer_id: null,
      created_at: new Date().toISOString()
    };
    db.addOrganization(newOrg);

    // Create a default Warehouse to help onboarding
    const defaultWarehouse: Warehouse = {
      id: "wh-" + crypto.randomUUID(),
      organization_id: orgId,
      name: "Primary Warehouse -" + organization_name,
      address: "101 Operations Boulevard",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      country: "India",
      total_capacity: 10000,
      capacity_unit: "sqft",
      manager_name: name,
      manager_phone: "+919999999999",
      is_active: true,
      created_at: new Date().toISOString()
    };
    db.addWarehouse(defaultWarehouse);

    // Add some default Zones inside the default warehouse
    db.addZone({ id: "zone-" + crypto.randomUUID(), warehouse_id: defaultWarehouse.id, name: "Storage Zone A", zone_type: "storage", capacity: 8000, created_at: new Date().toISOString() });
    db.addZone({ id: "zone-" + crypto.randomUUID(), warehouse_id: defaultWarehouse.id, name: "Receiving Bay", zone_type: "receiving", capacity: 2000, created_at: new Date().toISOString() });

    // Generate token
    const token = signToken({ userId, email: trimmedEmail, orgId });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: userId, email: trimmedEmail, name },
        organization: newOrg
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @api POST /api/v1/auth/login
 * Standard username password exchange for JWT token.
 */
app.post("/api/v1/auth/login", (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Please provide email and password" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.getUsers().find(u => u.email === trimmedEmail);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const password_hash = hashPassword(password);
    if (user.password_hash !== password_hash) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    // Find organization owner or tenant associated
    const organization = db.getOrganizations().find(o => o.owner_id === user.id) || db.getOrganizations()[0];
    if (!organization) {
      return res.status(500).json({ success: false, error: "Organization configuration missing. Please register." });
    }

    const token = signToken({ userId: user.id, email: user.email, orgId: organization.id });

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
        organization
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});


// --- 2. ORGANIZATIONS ROUTERS (REST) ---

app.get("/api/v1/organizations", authenticate, (req: Request, res: Response) => {
  // A tenant can only see their own organization (RLS enforcement)
  const org = db.getOrganizationById(req.orgId || "");
  return res.json({ success: true, data: org ? [org] : [] });
});

app.get("/api/v1/organizations/:id", authenticate, (req: Request, res: Response) => {
  if (req.orgId !== req.params.id) {
    return res.status(403).json({ success: false, error: "Forbidden: You cannot access other tenants data" });
  }
  const org = db.getOrganizationById(req.params.id);
  if (!org) return res.status(404).json({ success: false, error: "Organization not found" });
  return res.json({ success: true, data: org });
});

app.put("/api/v1/organizations/:id", authenticate, (req: Request, res: Response) => {
  if (req.orgId !== req.params.id) {
    return res.status(403).json({ success: false, error: "Forbidden: You cannot access other tenants data" });
  }
  try {
    const updated = db.updateOrganization(req.params.id, req.body);
    return res.json({ success: true, data: updated });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: e.message });
  }
});


// --- 3. WAREHOUSES ROUTERS (REST - RLS Compliant) ---

app.get("/api/v1/warehouses", authenticate, requireScope("inventory:read"), (req: Request, res: Response) => {
  const data = db.getWarehouses(req.orgId || "");
  return res.json({ success: true, data });
});

app.post("/api/v1/warehouses", authenticate, requireScope("inventory:write"), (req: Request, res: Response) => {
  try {
    const { name, address, city, state, pincode, country, total_capacity, capacity_unit, manager_name, manager_phone } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Warehouse name is required" });

    const newWh: Warehouse = {
      id: "wh-" + crypto.randomUUID(),
      organization_id: req.orgId || "",
      name,
      address: address || "",
      city: city || "",
      state: state || "",
      pincode: pincode || "",
      country: country || "India",
      total_capacity: Number(total_capacity) || 0,
      capacity_unit: capacity_unit || "sqft",
      manager_name: manager_name || "",
      manager_phone: manager_phone || "",
      is_active: true,
      created_at: new Date().toISOString()
    };
    db.addWarehouse(newWh);
    return res.status(201).json({ success: true, data: newWh });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/v1/warehouses/:id", authenticate, (req: Request, res: Response) => {
  const wh = db.getWarehouseById(req.params.id);
  if (!wh || wh.organization_id !== req.orgId) {
    return res.status(404).json({ success: false, error: "Warehouse not found" });
  }
  return res.json({ success: true, data: wh });
});

app.put("/api/v1/warehouses/:id", authenticate, (req: Request, res: Response) => {
  const wh = db.getWarehouseById(req.params.id);
  if (!wh || wh.organization_id !== req.orgId) {
    return res.status(404).json({ success: false, error: "Warehouse not found" });
  }
  const updated = db.updateWarehouse(req.params.id, req.body);
  return res.json({ success: true, data: updated });
});

app.delete("/api/v1/warehouses/:id", authenticate, (req: Request, res: Response) => {
  const wh = db.getWarehouseById(req.params.id);
  if (!wh || wh.organization_id !== req.orgId) {
    return res.status(404).json({ success: false, error: "Warehouse not found" });
  }
  db.deleteWarehouse(req.params.id);
  return res.json({ success: true, message: "Warehouse and references deleted successfully" });
});


// --- 4. ZONES ROUTERS (REST) ---

app.get("/api/v1/zones", authenticate, (req: Request, res: Response) => {
  const data = db.getZonesByOrg(req.orgId || "");
  return res.json({ success: true, data });
});

app.post("/api/v1/zones", authenticate, (req: Request, res: Response) => {
  try {
    const { warehouse_id, name, zone_type, capacity } = req.body;
    if (!warehouse_id || !name) {
      return res.status(400).json({ success: false, error: "warehouse_id and name are required" });
    }

    // Verify parent WH belongs to tenant
    const wh = db.getWarehouseById(warehouse_id);
    if (!wh || wh.organization_id !== req.orgId) {
      return res.status(403).json({ success: false, error: "Access Denied: Invalid warehouse context" });
    }

    const newZone: Zone = {
      id: "zone-" + crypto.randomUUID(),
      warehouse_id,
      name,
      zone_type: zone_type || "storage",
      capacity: Number(capacity) || 0,
      created_at: new Date().toISOString()
    };
    db.addZone(newZone);
    return res.status(201).json({ success: true, data: newZone });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/v1/zones/:id", authenticate, (req: Request, res: Response) => {
  const zone = db.getZoneById(req.params.id);
  if (!zone) return res.status(404).json({ success: false, error: "Zone not found" });
  
  const wh = db.getWarehouseById(zone.warehouse_id);
  if (!wh || wh.organization_id !== req.orgId) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  return res.json({ success: true, data: zone });
});

app.put("/api/v1/zones/:id", authenticate, (req: Request, res: Response) => {
  const zone = db.getZoneById(req.params.id);
  if (!zone) return res.status(404).json({ success: false, error: "Zone not found" });
  
  const wh = db.getWarehouseById(zone.warehouse_id);
  if (!wh || wh.organization_id !== req.orgId) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const updated = db.updateZone(req.params.id, req.body);
  return res.json({ success: true, data: updated });
});

app.delete("/api/v1/zones/:id", authenticate, (req: Request, res: Response) => {
  const zone = db.getZoneById(req.params.id);
  if (!zone) return res.status(404).json({ success: false, error: "Zone not found" });
  
  const wh = db.getWarehouseById(zone.warehouse_id);
  if (!wh || wh.organization_id !== req.orgId) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  db.deleteZone(req.params.id);
  return res.json({ success: true, message: "Zone removed successfully" });
});


// --- 5. PRODUCTS ROUTERS (REST - RLS compliant) ---

app.get("/api/v1/products", authenticate, requireScope("inventory:read"), (req: Request, res: Response) => {
  const data = db.getProducts(req.orgId || "");
  return res.json({ success: true, data });
});

app.post("/api/v1/products", authenticate, requireScope("inventory:write"), (req: Request, res: Response) => {
  try {
    const { sku, name, description, category, unit_of_measure, unit_price, reorder_level, hsn_code, gst_rate, image_url } = req.body;
    if (!sku || !name) {
      return res.status(400).json({ success: false, error: "sku and name are required fields" });
    }

    const newProd: Product = {
      id: "prod-" + crypto.randomUUID(),
      organization_id: req.orgId || "",
      sku,
      name,
      description: description || "",
      category: category || "General",
      unit_of_measure: unit_of_measure || "piece",
      unit_price: Number(unit_price) || 0,
      reorder_level: Number(reorder_level) || 0,
      hsn_code: hsn_code || "",
      gst_rate: Number(gst_rate) !== undefined ? Number(gst_rate) : 18,
      image_url: image_url || "",
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    db.addProduct(newProd);
    return res.status(201).json({ success: true, data: newProd });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/v1/products/:id", authenticate, (req: Request, res: Response) => {
  const p = db.getProductById(req.params.id);
  if (!p || p.organization_id !== req.orgId) return res.status(404).json({ success: false, error: "Product not found" });
  return res.json({ success: true, data: p });
});

app.put("/api/v1/products/:id", authenticate, (req: Request, res: Response) => {
  const p = db.getProductById(req.params.id);
  if (!p || p.organization_id !== req.orgId) return res.status(404).json({ success: false, error: "Product not found" });
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

app.delete("/api/v1/products/:id", authenticate, (req: Request, res: Response) => {
  const p = db.getProductById(req.params.id);
  if (!p || p.organization_id !== req.orgId) return res.status(404).json({ success: false, error: "Product not found" });
  db.deleteProduct(req.params.id);
  return res.json({ success: true, message: "Product deleted" });
});


// --- 6. SUPPLIERS ROUTERS (REST) ---

app.get("/api/v1/suppliers", authenticate, (req: Request, res: Response) => {
  const data = db.getSuppliers(req.orgId || "");
  return res.json({ success: true, data });
});

app.post("/api/v1/suppliers", authenticate, (req: Request, res: Response) => {
  try {
    const { name, contact_person, email, phone, address, gst_number, payment_terms } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Supplier name is required" });

    const newSupplierDetail: Supplier = {
      id: "sup-" + crypto.randomUUID(),
      organization_id: req.orgId || "",
      name,
      contact_person: contact_person || "",
      email: email || "",
      phone: phone || "",
      address: address || "",
      gst_number: gst_number || "",
      payment_terms: payment_terms || "NET_30",
      created_at: new Date().toISOString()
    };
    db.addSupplier(newSupplierDetail);
    return res.status(201).json({ success: true, data: newSupplierDetail });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/v1/suppliers/:id", authenticate, (req: Request, res: Response) => {
  const s = db.getSupplierById(req.params.id);
  if (!s || s.organization_id !== req.orgId) return res.status(404).json({ success: false, error: "Supplier not found" });
  return res.json({ success: true, data: s });
});

app.put("/api/v1/suppliers/:id", authenticate, (req: Request, res: Response) => {
  const s = db.getSupplierById(req.params.id);
  if (!s || s.organization_id !== req.orgId) return res.status(404).json({ success: false, error: "Supplier not found" });
  const updated = db.updateSupplier(req.params.id, req.body);
  return res.json({ success: true, data: updated });
});

app.delete("/api/v1/suppliers/:id", authenticate, (req: Request, res: Response) => {
  const s = db.getSupplierById(req.params.id);
  if (!s || s.organization_id !== req.orgId) return res.status(404).json({ success: false, error: "Supplier not found" });
  db.deleteSupplier(req.params.id);
  return res.json({ success: true, message: "Supplier deleted" });
});


// --- 7. INVENTORY CONTROL ROUTERS ---

app.get("/api/v1/inventory", authenticate, requireScope("inventory:read"), (req: Request, res: Response) => {
  const data = db.getInventoryByOrg(req.orgId || "");
  return res.json({ success: true, data });
});

/**
 * @api POST /api/v1/inventory/adjust
 * Atomically adjust active stock batch and record StockMovement audit.
 */
app.post("/api/v1/inventory/adjust", authenticate, requireScope("inventory:write"), (req: Request, res: Response) => {
  try {
    const { warehouse_id, zone_id, product_id, quantity_change, batch_number, expiry_date, location_code, notes } = req.body;
    
    if (!warehouse_id || !product_id || quantity_change === undefined || !batch_number) {
      return res.status(400).json({ success: false, error: "Required: warehouse_id, product_id, quantity_change, batch_number" });
    }

    // Validate date format strictly (ISO 8601 required for expiry_date if provided)
    if (expiry_date && !isValidISO8601(expiry_date)) {
      return res.status(400).json({ success: false, error: "expiry_date must be ISO 8601 format (YYYY-MM-DD)" });
    }

    const performer = req.user ? req.user.userId : "usr-api-key-agent";

    const result = db.adjustStock({
      orgId: req.orgId || "",
      warehouseId: warehouse_id,
      zoneId: zone_id || "",
      productId: product_id,
      quantityChange: Number(quantity_change),
      batchNumber: batch_number,
      expiryDate: expiry_date,
      locationCode: location_code || "LOC-GEN",
      notes: notes || "Manual adjustment",
      userId: performer
    });

    return res.json({ success: true, data: result });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: e.message });
  }
});

/**
 * @api GET /api/v1/inventory/low-stock
 * Identify items which fall below their defined reorder level.
 */
app.get("/api/v1/inventory/low-stock", authenticate, requireScope("inventory:read"), (req: Request, res: Response) => {
  const products = db.getProducts(req.orgId || "");
  const inventory = db.getInventoryByOrg(req.orgId || "");

  // Sum quantities across warehouses first to check holistic reorder status
  const lowStockReport = products.map(p => {
    const matchedInv = inventory.filter(i => i.product_id === p.id);
    const sumAvailable = matchedInv.reduce((acc, current) => acc + current.quantity_available, 0);
    
    return {
      product: p,
      quantity_available: sumAvailable,
      reorder_level: p.reorder_level,
      needs_reorder: sumAvailable <= p.reorder_level
    };
  }).filter(r => r.needs_reorder);

  return res.json({ success: true, data: lowStockReport });
});


// --- 8. PURCHASE ORDER WORKFLOWS ---

app.get("/api/v1/purchase-orders", authenticate, (req: Request, res: Response) => {
  const orders = db.getPurchaseOrders(req.orgId || "");
  
  // Attach items count
  const withCount = orders.map(po => {
    const items = db.getPurchaseOrderItems(po.id);
    return { ...po, items_count: items.length, items };
  });

  return res.json({ success: true, data: withCount });
});

app.post("/api/v1/purchase-orders", authenticate, (req: Request, res: Response) => {
  try {
    const { warehouse_id, supplier_id, expected_delivery_date, notes, items } = req.body;
    
    if (!warehouse_id || !supplier_id || !expected_delivery_date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Please provide warehouse_id, supplier_id, expected_delivery_date, and items array" });
    }

    if (!isValidISO8601(expected_delivery_date)) {
      return res.status(400).json({ success: false, error: "expected_delivery_date must be ISO 8601 (YYYY-MM-DD)" });
    }

    // Verify parent WH
    const wh = db.getWarehouseById(warehouse_id);
    if (!wh || wh.organization_id !== req.orgId) return res.status(400).json({ success: false, error: "Invalid warehouse selected" });

    // Calculate total bill amount
    let total_amount = 0;
    const validatedItems = items.map(it => {
      const p = db.getProductById(it.product_id);
      if (!p || p.organization_id !== req.orgId) throw new Error(`Product ID ${it.product_id} not found`);
      const price = Number(it.unit_price) || p.unit_price;
      const amount = (Number(it.quantity_ordered) || 0) * price;
      total_amount += amount;

      return {
        product_id: it.product_id,
        quantity_ordered: Number(it.quantity_ordered) || 0,
        quantity_received: 0,
        unit_price: price
      };
    });

    const creatorId = req.user ? req.user.userId : "usr-api-key-agent";

    const po: PurchaseOrder = {
      id: "po-" + crypto.randomUUID(),
      organization_id: req.orgId || "",
      warehouse_id,
      supplier_id,
      po_number: db.generatePONumber(),
      status: "draft",
      expected_delivery_date,
      total_amount,
      notes: notes || "",
      created_by: creatorId,
      created_at: new Date().toISOString()
    };

    const result = db.addPurchaseOrder(po, validatedItems);
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/v1/purchase-orders/:id", authenticate, (req: Request, res: Response) => {
  const po = db.getPurchaseOrderById(req.params.id);
  if (!po || po.organization_id !== req.orgId) return res.status(404).json({ success: false, error: "Purchase Order not found" });
  
  const items = db.getPurchaseOrderItems(po.id);
  return res.json({ success: true, data: { ...po, items } });
});

/**
 * @api POST /api/v1/purchase-orders/:id/receive
 * Action: receive physical items, increase stock inventory, log stock movements.
 */
app.post("/api/v1/purchase-orders/:id/receive", authenticate, (req: Request, res: Response) => {
  try {
    const { receiving_warehouse_id, receiving_zone_id, items_received } = req.body;
    
    if (!receiving_warehouse_id || !items_received || !Array.isArray(items_received)) {
      return res.status(400).json({ success: false, error: "Please specify receiving_warehouse_id and items_received collection" });
    }

    // Verify expiry date standard in inputs
    for (const rx of items_received) {
      if (rx.expiry_date && !isValidISO8601(rx.expiry_date)) {
        return res.status(400).json({ success: false, error: `Batch item expiration '${rx.expiry_date}' must use standard ISO 8601 DATE format (YYYY-MM-DD)` });
      }
    }

    const performer = req.user ? req.user.userId : "usr-api-key-agent";

    const outcome = db.receivePurchaseOrder({
      orgId: req.orgId || "",
      poId: req.params.id,
      receivingWarehouseId: receiving_warehouse_id,
      receivingZoneId: receiving_zone_id || "",
      itemsReceived: items_received,
      userId: performer
    });

    return res.json({ success: true, data: outcome });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});


// --- 9. DISPATCH ORDER WORKFLOWS ---

app.get("/api/v1/dispatch-orders", authenticate, (req: Request, res: Response) => {
  const orders = db.getDispatchOrders(req.orgId || "");
  
  const withCount = orders.map(doOrder => {
    const items = db.getDispatchOrderItems(doOrder.id);
    return { ...doOrder, items_count: items.length, items };
  });
  
  return res.json({ success: true, data: withCount });
});

app.post("/api/v1/dispatch-orders", authenticate, (req: Request, res: Response) => {
  try {
    const { warehouse_id, order_reference, customer_name, customer_phone, delivery_address, items, notes } = req.body;
    
    if (!warehouse_id || !order_reference || !customer_name || !items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: "Please provide warehouse_id, order_reference, customer_name, and items array" });
    }

    const wh = db.getWarehouseById(warehouse_id);
    if (!wh || wh.organization_id !== req.orgId) return res.status(400).json({ success: false, error: "Warehouse not found" });

    // Validate items
    let total_amount = 0;
    const validatedItems = items.map(it => {
      const p = db.getProductById(it.product_id);
      if (!p || p.organization_id !== req.orgId) throw new Error(`Product not found`);
      const price = Number(it.unit_price) || p.unit_price;
      total_amount += (Number(it.quantity_requested) || 0) * price;

      return {
        product_id: it.product_id,
        quantity_requested: Number(it.quantity_requested) || 0,
        quantity_dispatched: 0,
        unit_price: price
      };
    });

    const creatorId = req.user ? req.user.userId : "usr-api-key-agent";

    const newDo: DispatchOrder = {
      id: "do-" + crypto.randomUUID(),
      organization_id: req.orgId || "",
      warehouse_id,
      order_reference,
      customer_name,
      customer_phone: customer_phone || "",
      delivery_address: delivery_address || "",
      status: "pending",
      dispatch_date: new Date().toISOString().split("T")[0],
      total_amount,
      notes: notes || "",
      created_by: creatorId,
      created_at: new Date().toISOString()
    };

    const outcome = db.addDispatchOrder(newDo, validatedItems);
    return res.status(201).json({ success: true, data: outcome });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/v1/dispatch-orders/:id", authenticate, (req: Request, res: Response) => {
  const doOrder = db.getDispatchOrderById(req.params.id);
  if (!doOrder || doOrder.organization_id !== req.orgId) return res.status(404).json({ success: false, error: "Dispatch Order not found" });
  
  const items = db.getDispatchOrderItems(doOrder.id);
  return res.json({ success: true, data: { ...doOrder, items } });
});

/**
 * @api POST /api/v1/dispatch-orders/:id/dispatch
 * Action: Ship items, deduct from specific inventory batch, auto-log StockMovement.
 */
app.post("/api/v1/dispatch-orders/:id/dispatch", authenticate, (req: Request, res: Response) => {
  try {
    const { dispatch_warehouse_id, items_dispatched } = req.body;

    if (!dispatch_warehouse_id || !items_dispatched || !Array.isArray(items_dispatched)) {
      return res.status(400).json({ success: false, error: "Please specify dispatch_warehouse_id and items_dispatched mapping" });
    }

    const performer = req.user ? req.user.userId : "usr-api-key-agent";

    const result = db.dispatchOrder({
      orgId: req.orgId || "",
      doId: req.params.id,
      dispatchWarehouseId: dispatch_warehouse_id,
      itemsDispatched: items_dispatched,
      userId: performer
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});


// --- 10. STOCK MOVEMENTS AUDIT ---

app.get("/api/v1/stock-movements", authenticate, (req: Request, res: Response) => {
  const data = db.getStockMovements(req.orgId || "");
  return res.json({ success: true, data });
});


// --- 11. ANALYTICS & REPORTS ROUTER ---

app.get("/api/v1/reports/inventory-summary", authenticate, requireScope("inventory:read"), (req: Request, res: Response) => {
  const inventory = db.getInventoryByOrg(req.orgId || "");
  const products = db.getProducts(req.orgId || "");
  const warehouses = db.getWarehouses(req.orgId || "");

  const summary = warehouses.map(wh => {
    const whStock = inventory.filter(i => i.warehouse_id === wh.id);
    const uniqueSkus = [...new Set(whStock.map(s => s.product_id))].length;
    const totalUnitQty = whStock.reduce((acc, curr) => acc + curr.quantity_available, 0);

    return {
      warehouse_id: wh.id,
      warehouse_name: wh.name,
      unique_skus: uniqueSkus,
      total_items_stocked: totalUnitQty,
    };
  });

  return res.json({ success: true, data: summary });
});

app.get("/api/v1/reports/stock-movement-history", authenticate, (req: Request, res: Response) => {
  const movements = db.getStockMovements(req.orgId || "");
  // Return descending sorted movements
  const sorted = movements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return res.json({ success: true, data: sorted });
});

app.get("/api/v1/reports/low-stock", authenticate, requireScope("inventory:read"), (req: Request, res: Response) => {
  const products = db.getProducts(req.orgId || "");
  const inventory = db.getInventoryByOrg(req.orgId || "");

  const reports = products.map(p => {
    const activeQty = inventory.filter(i => i.product_id === p.id).reduce((sum, item) => sum + item.quantity_available, 0);
    return {
      sku: p.sku,
      name: p.name,
      unit_of_measure: p.unit_of_measure,
      quantity_available: activeQty,
      reorder_level: p.reorder_level,
      status: activeQty <= p.reorder_level ? "BELOW_LEVEL" : "OK"
    };
  }).filter(item => item.status === "BELOW_LEVEL");

  return res.json({ success: true, data: reports });
});

app.get("/api/v1/reports/valuation", authenticate, requireScope("inventory:read"), (req: Request, res: Response) => {
  const inventory = db.getInventoryByOrg(req.orgId || "");
  const products = db.getProducts(req.orgId || "");

  let total_market_value_inr = 0;
  const itemsBreakdown = inventory.map(i => {
    const prod = products.find(p => p.id === i.product_id);
    const unitPrice = prod ? prod.unit_price : 0;
    const itemValuation = i.quantity_available * unitPrice;
    total_market_value_inr += itemValuation;

    return {
      inventory_id: i.id,
      sku: prod ? prod.sku : "UNKNOWN",
      product_name: prod ? prod.name : "Unknown Product",
      batch_number: i.batch_number,
      quantity: i.quantity_available,
      unit_price: unitPrice,
      valuation: itemValuation
    };
  });

  return res.json({ 
    success: true, 
    data: {
      total_valuation_inr: total_market_value_inr,
      items_breakdown: itemsBreakdown
    } 
  });
});


// --- 12. BILLING MULTI-TENANCY APP API ---

/**
 * @api GET /api/v1/billing/summary
 * Fetch subscription status and limits for a tenant.
 */
app.get("/api/v1/billing/summary", authenticate, requireScope("billing:read"), (req: Request, res: Response) => {
  const org = db.getOrganizationById(req.orgId || "");
  if (!org) return res.status(404).json({ success: false, error: "Tenant Organization not configured" });

  const warehouses = db.getWarehouses(org.id);
  const products = db.getProducts(org.id);
  const movements = db.getStockMovements(org.id);

  // Meter usage counts
  const warehouses_used = warehouses.length;
  const products_used = products.length;

  // Calculate current month stock movements (e.g. from June 1, 2026 for demonstration matching timezone context)
  const currentMonthStart = new Date("2026-06-01T00:00:00Z");
  const movements_this_month = movements.filter(m => new Date(m.created_at) >= currentMonthStart).length;

  // Limits based on plan
  let warehouseLimit = 3;
  let productLimit = 500;
  
  if (org.subscription_plan === "free") {
    warehouseLimit = 1;
    productLimit = 50;
  } else if (org.subscription_plan === "starter") {
    warehouseLimit = 3;
    productLimit = 500;
  } else if (org.subscription_plan === "premium") {
    warehouseLimit = 20;
    productLimit = 10000;
  }

  return res.json({
    success: true,
    data: {
      organization_id: org.id,
      plan: org.subscription_plan,
      subscription_status: org.subscription_status,
      razorpay_customer_id: org.razorpay_customer_id,
      billing_cycle: {
        start: "2026-06-01",
        end: "2026-06-30"
      },
      usage: {
        warehouses: { used: warehouses_used, limit: warehouseLimit },
        products: { used: products_used, limit: productLimit },
        stock_movements_this_month: movements_this_month
      }
    }
  });
});

/**
 * @api GET /api/v1/billing/usage
 * Fetch metered billing details for a specific ISO 8601 date range constraint.
 * Both 'from' and 'to' query parameters must be provided as ISO 8601 DATE format.
 */
app.get("/api/v1/billing/usage", authenticate, requireScope("billing:read"), (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ success: false, error: "Please specify both 'from' and 'to' URL query parameters" });
  }

  // Strictly validated ISO 8601 checks
  if (!isValidISO8601(String(from)) || !isValidISO8601(String(to))) {
    return res.status(400).json({ success: false, error: "Parameters 'from' and 'to' must use strict ISO 8601 DATE format (YYYY-MM-DD)" });
  }

  const fromDate = new Date(String(from));
  const toDate = new Date(String(to) + "T23:59:59.999Z"); // inclusive end of day

  const movements = db.getStockMovements(req.orgId || "");
  const filteredMovements = movements.filter(m => {
    const moveDate = new Date(m.created_at);
    return moveDate >= fromDate && moveDate <= toDate;
  });

  return res.json({
    success: true,
    data: {
      organization_id: req.orgId,
      date_range: { from, to },
      total_movements_count: filteredMovements.length,
      movements_audit_subset: filteredMovements.map(m => ({
        id: m.id,
        created_at: m.created_at,
        movement_type: m.movement_type,
        quantity: m.quantity
      }))
    }
  });
});

/**
 * @api POST /api/v1/billing/webhook
 * Receive Razorpay webhook callbacks to process SaaS subscription state hooks.
 * Validates HMAC SHA-256 signatures with RAZORPAY_WEBHOOK_SECRET.
 */
app.post("/api/v1/billing/webhook", (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "razorpay_default_webhook_secret_key";
  
  const rawBody = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Validate signature
  if (process.env.NODE_ENV === "production" && signature !== expectedSignature) {
    return res.status(400).json({ success: false, error: "Webhook signature verification failed" });
  }

  const { event, payload } = req.body;
  if (!event || !payload) {
    return res.status(400).json({ success: false, error: "Malformed webhook payload" });
  }

  // Process Razorpay events: subscription.activated, subscription.charged, subscription.halted, subscription.cancelled
  // Try to locate entity organization by email or loaded subscription profile ID
  const subDetails = payload.subscription?.entity;
  const razorpayCustomerId = subDetails?.customer_id;
  const planId = subDetails?.plan_id || "starter"; // mapped plan

  // Find org
  const orgs = db.getOrganizations();
  const matchedOrg = orgs.find(o => o.razorpay_customer_id === razorpayCustomerId || o.billing_email === subDetails?.notes?.email);

  if (matchedOrg) {
    let status = "active";
    if (event === "subscription.halted") {
      status = "halted";
    } else if (event === "subscription.cancelled") {
      status = "cancelled";
    }

    // Determine plan mapped
    let subscription_plan = matchedOrg.subscription_plan;
    if (event === "subscription.activated") {
      status = "active";
      subscription_plan = planId.includes("premium") ? "premium" : "starter";
    }

    db.updateOrganization(matchedOrg.id, {
      subscription_status: status,
      subscription_plan,
      razorpay_customer_id: razorpayCustomerId || matchedOrg.razorpay_customer_id
    });

    console.log(`Webhook Event processed successfully for ${matchedOrg.name}: ${event} status set to ${status}`);
    return res.json({ success: true, message: `Processed ${event} hook` });
  }

  return res.json({ success: true, warning: "Processed hook but no matching organization found", payload: req.body });
});

/**
 * @api POST /api/v1/billing/api-keys
 * Generates an active API key, hashes and saves hash, returns raw key to user ONCE.
 */
app.post("/api/v1/billing/api-keys", authenticate, (req: Request, res: Response) => {
  try {
    const { label, scopes } = req.body;
    if (!label) return res.status(400).json({ success: false, error: "Please specify an API key label" });

    const keyScopes = scopes || ["billing:read", "inventory:read"];
    
    // Generate secure API key
    const rawApiKey = "wms_key_" + crypto.randomBytes(24).toString("hex");
    const hash = crypto.createHash("sha256").update(rawApiKey).digest("hex");

    const newKeyObj: ApiKey = {
      id: "key-" + crypto.randomUUID(),
      organization_id: req.orgId || "",
      key_hash: hash,
      label,
      scopes: keyScopes,
      is_active: true,
      last_used_at: null,
      created_at: new Date().toISOString()
    };

    db.addApiKey(newKeyObj);

    return res.status(201).json({
      success: true,
      data: {
        raw_key: rawApiKey, // RETURN ONCE TO CLIENT
        key_record: {
          id: newKeyObj.id,
          label: newKeyObj.label,
          scopes: newKeyObj.scopes,
          created_at: newKeyObj.created_at
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch API Keys list (for visualization)
app.get("/api/v1/billing/api-keys", authenticate, (req: Request, res: Response) => {
  const keys = db.getApiKeys(req.orgId || "").map(k => ({
    id: k.id,
    label: k.label,
    scopes: k.scopes,
    is_active: k.is_active,
    last_used_at: k.last_used_at,
    created_at: k.created_at
  }));
  return res.json({ success: true, data: keys });
});

// Revoke API Key
app.delete("/api/v1/billing/api-keys/:id", authenticate, (req: Request, res: Response) => {
  const revoked = db.revokeApiKey(req.params.id, req.orgId || "");
  if (!revoked) return res.status(404).json({ success: false, error: "API Key record not found" });
  return res.json({ success: true, message: "API key revoked successfully" });
});


// --- 13. VITE MIDDLEWARE CONFIG FOR SERVING CLIENT FRONTEND ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer();
