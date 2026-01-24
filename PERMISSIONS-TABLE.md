# 🔐 Complete Permissions & Access Control Table

## Legend
- 🔵 **Anon Key + JWT** = User authentication (RLS checks apply)
- 🔴 **Service Role** = System authentication (bypasses RLS)
- ✅ **Allowed** = Has permission
- ❌ **Blocked** = No permission
- ⚠️ **N/A** = Not applicable for this user type

---

## 📊 Database Table Access

| Table | Admin Read | Admin Write | Shareable Read | Shareable Write |
|-------|------------|-------------|----------------|-----------------|
| `admins` | ❌ No RLS policy | ❌ No RLS policy | ❌ No RLS policy | ❌ No RLS policy |
| `clients` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |
| `projects` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |
| `datasources` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |
| `report_links` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | 🔴 Service Role* |
| `reports` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |
| `kvs` | 🔴 Service Role** | 🔴 Service Role** | 🔴 Service Role** | 🔴 Service Role** |
| `dashboard_cache` | 🔵 Anon + JWT | 🔴 Service Role | 🔴 Service Role | 🔴 Service Role |
| `google_analytics_properties` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |
| `semrush_domains` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |
| `mangools_domains` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |
| `google_search_console_sites` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |
| `google_business_profile_locations` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |
| `gmb_profiles` | 🔵 Anon + JWT | 🔵 Anon + JWT | 🔴 Service Role | ⚠️ N/A |

**Notes:**
- `*` - Only for locking today date on first access
- `**` - KVS always uses Service Role (backend only, never exposed to frontend)

---

## 🔍 Data Fetching Operations

| Action | Admin | Shareable Report | RLS Check |
|--------|-------|------------------|-----------|
| **Fetch Google Analytics Property** | 🔵 Anon + JWT | 🔴 Service Role | Admin: ✅ Yes<br>Shareable: ❌ Bypassed |
| **Fetch Semrush Domain** | 🔵 Anon + JWT | 🔴 Service Role | Admin: ✅ Yes<br>Shareable: ❌ Bypassed |
| **Fetch Mangools Domain** | 🔵 Anon + JWT | 🔴 Service Role | Admin: ✅ Yes<br>Shareable: ❌ Bypassed |
| **Fetch GBP Location** | 🔵 Anon + JWT | 🔴 Service Role | Admin: ✅ Yes<br>Shareable: ❌ Bypassed |
| **Fetch GMB Profile** | 🔵 Anon + JWT | 🔴 Service Role | Admin: ✅ Yes<br>Shareable: ❌ Bypassed |
| **Fetch Search Console Site** | 🔵 Anon + JWT | 🔴 Service Role | Admin: ✅ Yes<br>Shareable: ❌ Bypassed |
| **Fetch Project Details** | 🔵 Anon + JWT | 🔴 Service Role | Admin: ✅ Yes<br>Shareable: ❌ Bypassed |
| **Fetch Client Details** | 🔵 Anon + JWT | 🔴 Service Role | Admin: ✅ Yes<br>Shareable: ❌ Bypassed |

---

## 💾 Cache Operations

| Operation | Admin | Shareable Report | Why Service Role? |
|-----------|-------|------------------|-------------------|
| **Read Cache** | 🔵 Anon + JWT | 🔴 Service Role | Admin has RLS permission<br>Shareable bypasses RLS |
| **Write Cache** | 🔴 Service Role | 🔴 Service Role | More reliable, session-independent |
| **Delete Cache** | 🔴 Service Role | ⚠️ N/A | Admin-only operation |

---

## 🔑 KVS (Secrets Management)

| Operation | Admin | Shareable Report | Location |
|-----------|-------|------------------|----------|
| **Read OAuth Tokens** | 🔴 Service Role | 🔴 Service Role | Backend only |
| **Write OAuth Tokens** | 🔴 Service Role | 🔴 Service Role | Backend only |
| **Refresh Tokens** | 🔴 Service Role | 🔴 Service Role | Backend only |
| **Delete Tokens** | 🔴 Service Role | ⚠️ N/A | Backend only |
| **Read API Keys** | 🔴 Service Role | 🔴 Service Role | Backend only |
| **Write API Keys** | 🔴 Service Role | ⚠️ N/A | Backend only |

**Critical:** KVS operations ALWAYS happen on backend. Frontend NEVER accesses KVS directly.

---

## 🔐 Authentication Operations

| Operation | Admin | Shareable Report | Description |
|-----------|-------|------------------|-------------|
| **Login** | 🔵 Anon Key | ⚠️ N/A | Supabase Auth with credentials |
| **Check is_admin()** | 🔵 Anon + JWT | ⚠️ N/A | RPC function call |
| **Validate Token** | ⚠️ N/A | 🔴 Service Role | Backend validates report token |
| **Lock Today Date** | ⚠️ N/A | 🔴 Service Role | First access locks date |
| **Get User Session** | 🔵 Anon + JWT | ⚠️ N/A | Middleware check |

---

## 📡 API Endpoint Calls

| Endpoint | Admin | Shareable Report | Query Params |
|----------|-------|------------------|--------------|
| `/api/clients` | 🔵 Anon + JWT | ⚠️ N/A | None |
| `/api/projects/[id]` | 🔵 Anon + JWT | ⚠️ N/A | None |
| `/api/reports/link/[token]` | ⚠️ N/A | 🔴 Service Role | None |
| `/api/reports/project/[id]` | ⚠️ N/A | 🔴 Service Role | None |
| `/api/google-analytics/dashboard/[id]` | 🔵 Anon + JWT | 🔴 Service Role | Shareable: `?today=YYYY-MM-DD` |
| `/api/semrush/dashboard/[id]` | 🔵 Anon + JWT | 🔴 Service Role | Shareable: `?today=YYYY-MM-DD` |
| `/api/mangools/dashboard/[id]` | 🔵 Anon + JWT | 🔴 Service Role | Shareable: `?today=YYYY-MM-DD` |
| `/api/gbp/dashboard/[id]` | 🔵 Anon + JWT | 🔴 Service Role | Shareable: `?today=YYYY-MM-DD` |
| `/api/gmb/dashboard/[id]` | 🔵 Anon + JWT | 🔴 Service Role | Shareable: `?today=YYYY-MM-DD` |
| `/api/search-console/dashboard/[id]` | 🔵 Anon + JWT | 🔴 Service Role | Shareable: `?today=YYYY-MM-DD` |

---

## 🎯 External API Calls (Google, Semrush, etc.)

| Service | Admin | Shareable Report | Token Source |
|---------|-------|------------------|--------------|
| **Google Analytics API** | 🔴 Service Role* | 🔴 Service Role* | KVS (OAuth token) |
| **Google Search Console API** | 🔴 Service Role* | 🔴 Service Role* | KVS (OAuth token) |
| **Google Business Profile API** | 🔴 Service Role* | 🔴 Service Role* | KVS (OAuth token) |
| **Semrush API** | 🔴 Service Role* | 🔴 Service Role* | KVS (API key) |
| **Mangools API** | 🔴 Service Role* | 🔴 Service Role* | KVS (API key) |
| **GMB (Grid My Business) API** | 🔴 Service Role* | 🔴 Service Role* | KVS (API token) |

**Note:** `*` Service Role used to READ tokens from KVS. External API calls happen on backend.

---

## 🚦 RLS Policy Checks

| Table | Admin | Shareable Report | Policy |
|-------|-------|------------------|--------|
| All tables (except admins) | ✅ Checked | ❌ Bypassed | `FOR ALL USING (public.is_admin())` |
| `admins` table | ❌ No policy | ❌ No policy | N/A (accessed via RPC only) |

---

## 🔄 Decision Logic Flow

### How System Decides Which Key to Use:

```typescript
// In all dashboard action files:
export async function fetchDashboardData(
  datasourceId: string,
  options?: DashboardOptions  // { today?: string }
) {
  // Decision point:
  const useServiceRole = !!options?.today
  
  // Choose client:
  const supabase = useServiceRole 
    ? createServiceClient()  // 🔴 Service Role (Shareable)
    : await createClient()   // 🔵 Anon + JWT (Admin)
  
  // Fetch data...
}
```

**Decision Tree:**
```
Request has ?today parameter?
├─ YES → options?.today = "2026-01-24"
│        → useServiceRole = true
│        → createServiceClient()
│        → 🔴 Service Role
│        → Bypasses RLS
│        → Shareable Report
│
└─ NO  → options?.today = undefined
         → useServiceRole = false
         → createClient()
         → 🔵 Anon Key + JWT
         → RLS checks is_admin()
         → Admin Dashboard
```

---

## 🛡️ Security Summary

### What Admin Can Access:

| Resource | Access Method | Security |
|----------|---------------|----------|
| Dashboard | Login + JWT | RLS checks `is_admin()` |
| All Tables | Anon + JWT | RLS checks `is_admin()` |
| Cache Read | Anon + JWT | RLS checks `is_admin()` |
| Cache Write | Backend Service Role | Reliable writes |
| KVS | Backend Service Role | Never exposed to browser |
| External APIs | Backend Service Role | Tokens from KVS |

### What Shareable Report Can Access:

| Resource | Access Method | Security |
|----------|---------------|----------|
| Report Page | Token in URL | Backend validates token |
| Report Data | Backend Service Role | Token validated first |
| All Tables | Backend Service Role | Bypasses RLS (token is auth) |
| Cache Read | Backend Service Role | Bypasses RLS |
| Cache Write | Backend Service Role | Same as admin |
| KVS | Backend Service Role | Never exposed to browser |
| External APIs | Backend Service Role | Tokens from KVS |

---

## 🔒 Security Guarantees

### ✅ Service Role Secret Protection

| Aspect | Status |
|--------|--------|
| **Exposed to Browser** | ❌ NEVER |
| **In Frontend Code** | ❌ NEVER |
| **In Environment Variable** | ✅ `SUPABASE_SERVICE_ROLE_KEY` (server-only) |
| **Used in `"use server"` Files** | ✅ Only server-side |
| **Used in API Routes** | ✅ Only server-side |
| **Visible in Network Requests** | ❌ NEVER |
| **In Browser Bundle** | ❌ NEVER |

### ✅ Token Enumeration Protection

| Attack Vector | Status |
|---------------|--------|
| **List all report_links** | ❌ Blocked (admin-only RLS) |
| **Brute force tokens** | ❌ Impossible (64-char hex = 2^256 combinations) |
| **Extract tokens from database** | ❌ Requires admin access |
| **Access report without token** | ❌ Token validation required |

### ✅ Data Access Protection

| Data Type | Admin Access | Public Access |
|-----------|-------------|---------------|
| **Client PII** | ✅ Full access | ❌ Blocked |
| **Report Tokens** | ✅ Can create/view | ❌ Blocked (must have specific token) |
| **OAuth Tokens** | ❌ Backend only | ❌ Backend only |
| **API Keys** | ❌ Backend only | ❌ Backend only |
| **Cached Metrics** | ✅ Can view all | ✅ Only for their report |
| **Dashboard Data** | ✅ All projects | ✅ Only their project |

---

## 📋 Key Takeaways

### Admin Dashboard:
- 🔵 **Uses:** Anon Key + JWT for reads
- 🔴 **Uses:** Service Role for cache writes
- ✅ **Security:** RLS checks `is_admin()` on every request
- ✅ **Reliability:** Service role for cache writes (session-independent)

### Shareable Reports:
- 🔴 **Uses:** Service Role for EVERYTHING
- ✅ **Security:** Token validation required
- ✅ **Isolation:** Can only access data for specific report
- ✅ **Safe:** Service role stays on backend, never exposed

### KVS (Secrets):
- 🔴 **Always:** Service Role only
- ✅ **Location:** Backend only (`"use server"`)
- ❌ **Never:** Frontend access
- ✅ **Safe:** Tokens never exposed to browser

### Cache:
- 📖 **Read:** Different based on user type
  - Admin: Anon + JWT (has permission)
  - Shareable: Service Role (bypasses RLS)
- ✍️ **Write:** Always Service Role (both admin and shareable)
  - More reliable
  - Session-independent
  - Consistent architecture

---

## 🎯 Quick Reference

**When you see:**
- `options?.today` is **undefined** → 🔵 **Admin** (Anon + JWT)
- `options?.today` is **defined** → 🔴 **Shareable** (Service Role)

**Remember:**
- 🔵 Blue Key = Your ID (proves you're admin)
- 🔴 Red Key = Master Key (system access)
- Frontend NEVER has Red Key
- Red Key ONLY on backend
- Secrets NEVER in browser
- RLS protects admin data
- Token validation protects shareable reports

**All systems secure! 🎉**
