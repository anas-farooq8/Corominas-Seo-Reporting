module.exports = [
"[project]/lib/actions/datasources.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4035c1705a267770e321fea6d4df08af736f28114c":"deleteDatasource","4071b6eda7da4b33a9577a1d4bc37812d2284e22ec":"createDatasource","607cedd05b139f2cc20f7735bcf76a7c86239494af":"updateDatasource"},"",""] */ __turbopack_context__.s([
    "createDatasource",
    ()=>createDatasource,
    "deleteDatasource",
    ()=>deleteDatasource,
    "updateDatasource",
    ()=>updateDatasource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
const datasourceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    customer_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "mangools",
        "gsc",
        "ga4",
        "gbp"
    ]),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Name is required"),
    config: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional()
});
async function createDatasource(input) {
    try {
        const validated = datasourceSchema.parse(input);
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
        const { data, error } = await supabase.from("datasources").insert([
            {
                ...validated,
                config: validated.config || {}
            }
        ]).select().single();
        if (error) throw new Error(error.message);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/dashboard/customers/${validated.customer_id}`);
        return {
            success: true,
            data
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create datasource";
        console.error("Create datasource error:", error);
        return {
            success: false,
            error: message
        };
    }
}
async function updateDatasource(id, input) {
    try {
        const validated = datasourceSchema.partial().parse(input);
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
        const { data, error } = await supabase.from("datasources").update({
            ...validated,
            updated_at: new Date().toISOString()
        }).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
        return {
            success: true,
            data
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update datasource";
        console.error("Update datasource error:", error);
        return {
            success: false,
            error: message
        };
    }
}
async function deleteDatasource(id) {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
        // Soft delete by setting is_active to false
        const { error } = await supabase.from("datasources").update({
            is_active: false
        }).eq("id", id);
        if (error) throw new Error(error.message);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
        return {
            success: true
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete datasource";
        console.error("Delete datasource error:", error);
        return {
            success: false,
            error: message
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createDatasource,
    updateDatasource,
    deleteDatasource
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createDatasource, "4071b6eda7da4b33a9577a1d4bc37812d2284e22ec", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateDatasource, "607cedd05b139f2cc20f7735bcf76a7c86239494af", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteDatasource, "4035c1705a267770e321fea6d4df08af736f28114c", null);
}),
"[project]/lib/mangools/api.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchMangoolsDomains",
    ()=>fetchMangoolsDomains,
    "parseMangoolsDomainForDb",
    ()=>parseMangoolsDomainForDb
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)");
;
const MANGOOLS_API_BASE = "https://api.mangools.com/v3";
const fetchMangoolsDomains = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cache"])(async ()=>{
    const accessToken = process.env.MANGOOLS_X_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error("MANGOOLS_X_ACCESS_TOKEN environment variable is not set");
    }
    try {
        const response = await fetch(`${MANGOOLS_API_BASE}/serpwatcher/trackings`, {
            method: "GET",
            headers: {
                "x-access-token": accessToken,
                "Content-Type": "application/json",
                Accept: "*/*"
            },
            next: {
                revalidate: 300
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Mangools API] Error response:", errorText);
            throw new Error(`Mangools API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        // Filter out deleted domains
        const activeDomains = data.filter((domain)=>!domain.is_deleted);
        return activeDomains;
    } catch (error) {
        console.error("[Mangools API] Fetch failed:", error);
        throw error;
    }
});
function parseMangoolsDomainForDb(domain) {
    return {
        mangools_id: domain._id,
        domain: domain.domain,
        location_code: domain.location?.code ?? null,
        location_label: domain.location?.label ?? null,
        keywords_count: domain.count ?? 0
    };
}
}),
"[project]/lib/actions/domains.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"401037ee78f3a565d7c195af2bc5e8ccf5392f5f9e":"detachMangoolsDomain","60cf7c1cbf82bc827a9941a9142a3090fe7e3ddb2b":"attachMangoolsDomain"},"",""] */ __turbopack_context__.s([
    "attachMangoolsDomain",
    ()=>attachMangoolsDomain,
    "detachMangoolsDomain",
    ()=>detachMangoolsDomain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mangools$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mangools/api.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
async function attachMangoolsDomain(datasourceId, domain) {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
        // Parse domain data for storage
        const domainData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mangools$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseMangoolsDomainForDb"])(domain);
        // Insert or update the domain
        const { data: insertedDomain, error: domainError } = await supabase.from("mangools_domains").upsert({
            datasource_id: datasourceId,
            ...domainData,
            is_active: true
        }, {
            onConflict: "datasource_id,mangools_id"
        }).select().single();
        if (domainError) throw new Error(domainError.message);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
        return {
            success: true,
            data: insertedDomain
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to attach domain";
        console.error("Attach domain error:", error);
        return {
            success: false,
            error: message
        };
    }
}
async function detachMangoolsDomain(domainId) {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
        const { error } = await supabase.from("mangools_domains").update({
            is_active: false
        }).eq("id", domainId);
        if (error) throw new Error(error.message);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
        return {
            success: true
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to detach domain";
        console.error("Detach domain error:", error);
        return {
            success: false,
            error: message
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    attachMangoolsDomain,
    detachMangoolsDomain
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(attachMangoolsDomain, "60cf7c1cbf82bc827a9941a9142a3090fe7e3ddb2b", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(detachMangoolsDomain, "401037ee78f3a565d7c195af2bc5e8ccf5392f5f9e", null);
}),
"[project]/.next-internal/server/app/dashboard/customers/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions/datasources.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/lib/actions/domains.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$datasources$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/datasources.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$domains$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/domains.ts [app-rsc] (ecmascript)");
;
;
;
;
}),
"[project]/.next-internal/server/app/dashboard/customers/[id]/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions/datasources.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/lib/actions/domains.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "401037ee78f3a565d7c195af2bc5e8ccf5392f5f9e",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$domains$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["detachMangoolsDomain"],
    "4035c1705a267770e321fea6d4df08af736f28114c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$datasources$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteDatasource"],
    "4071b6eda7da4b33a9577a1d4bc37812d2284e22ec",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$datasources$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createDatasource"],
    "60cf7c1cbf82bc827a9941a9142a3090fe7e3ddb2b",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$domains$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["attachMangoolsDomain"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$dashboard$2f$customers$2f5b$id$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$lib$2f$actions$2f$datasources$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$lib$2f$actions$2f$domains$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/dashboard/customers/[id]/page/actions.js { ACTIONS_MODULE0 => "[project]/lib/actions/datasources.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/lib/actions/domains.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$datasources$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/datasources.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$domains$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/domains.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_349716b7._.js.map