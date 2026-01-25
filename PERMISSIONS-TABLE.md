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
- `**` - KVS has NO RLS policies. All access requires Service Role (backend only, never exposed to frontend)

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
| **Delete Tokens** | 🔴 Service Role | 🔴 Service Role | Backend only |

**Critical:** 
- KVS operations ALWAYS happen on backend. Frontend NEVER accesses KVS directly.
- KVS has NO RLS policies - all access requires Service Role.
- Only GMB and GBP OAuth tokens are stored in KVS.
- Shareable reports trigger token refresh/cache operations indirectly through API calls.

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

## 🎯 External API Calls (Google APIs, that uses kvs table)

| Service | Admin | Shareable Report | Token Source |
|---------|-------|------------------|--------------|
| **Google Business Profile API** | 🔴 Service Role* | 🔴 Service Role* | KVS (OAuth token) |
| **GMB (Grid My Business) API** | 🔴 Service Role* | 🔴 Service Role* | KVS (OAuth token, cached) |

**Note:** `*` Service Role used to READ/WRITE tokens from KVS. External API calls happen on backend.

---

## 🚦 RLS Policy Checks

| Table | Admin | Shareable Report | Policy |
|-------|-------|------------------|--------|
| All tables (except admins, kvs) | ✅ Checked | ❌ Bypassed | `FOR ALL USING (public.is_admin())` |
| `admins` table | ❌ No policy | ❌ No policy | Accessed via RPC only |
| `kvs` table | ❌ No policy | ❌ No policy | Service Role access only |

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
- **Dashboard:** Login + JWT, RLS checks `is_admin()`
- **All Tables:** Anon + JWT (except KVS: Service Role only)
- **Cache:** Read with Anon + JWT, Write with Service Role
- **KVS:** Backend Service Role only (never exposed)
- **External APIs:** Backend Service Role (tokens from KVS or cookies)

### What Shareable Report Can Access:
- **Report Page:** Token in URL (validated on backend)
- **All Operations:** Backend Service Role (bypasses RLS)
- **Isolation:** Can only access data for their specific report
- **KVS:** Backend Service Role only (never exposed)
- **Safe:** Service role stays on backend, never exposed to frontend

---

## 🔒 Security Guarantees

### ✅ Service Role Secret Protection
- **NEVER exposed to browser or frontend code**
- **Only in backend:** `"use server"` files and API routes
- **Environment variable:** `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- **Never visible in network requests or browser bundle**

### ✅ Token Enumeration Protection
- **Report tokens:** 64-char hex (2^256 combinations) - impossible to brute force
- **List all report_links:** Blocked by admin-only RLS
- **Database extraction:** Requires admin access
- **Token validation:** Required for all report access

### ✅ Data Access Protection
- **Admin:** Full access to all data (via RLS checks)
- **Public/Shareable:** Only their specific report (via token validation)
- **OAuth Tokens & API Keys:** Backend only (never exposed to any user)
- **KVS:** No RLS policy - Service Role access only

---

## 📋 Key Takeaways

### Admin Dashboard:
- **Authentication:** Anon Key + JWT
- **Database Access:** RLS checks `is_admin()` on every request
- **Cache:** Read with Anon + JWT, Write with Service Role
- **KVS:** Service Role only (backend)

### Shareable Reports:
- **Authentication:** Token validation (backend)
- **Database Access:** Service Role for everything (bypasses RLS)
- **Isolation:** Can only access their specific report
- **KVS:** Service Role only (backend)

### KVS (Secrets Storage):
- **Access:** Service Role ONLY (no RLS policies)
- **Location:** Backend only (`"use server"` files)
- **Contains:** GMB and GBP OAuth tokens (encrypted)
- **Security:** Never exposed to frontend or browser

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
