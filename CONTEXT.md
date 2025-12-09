Automated SEO Reporting System – Full Project Specification
Client: Corominas Consulting
Developer: Muhammad

1. Project Overview
We want to build a fully automated monthly SEO reporting system for ~50 law firm clients.
 The system should:
Pull data from multiple sources (Google Search Console, GA4, Google Business Profile).


Generate a structured, multi-page dashboard (Looker Studio or similar, using next js).


Export a monthly Report.


Produce an LLM-written report text that matches the dashboard structure.


Run automatically on the 1st of each month.


Retry manually if a specific client report fails.


This spec defines all data inputs, comparisons, logic rules, dashboard pages, text generation rules, and video automation requirements.

4. Comparison Logic (Critical Feature)
To ensure we always highlight positive trends where possible, every metric must be evaluated across multiple comparison windows.
Comparison windows (all required): (clicks , impressions and conversions).
Last month vs previous month


Selection rule: “Most Positive Comparison Wins”
For each KPI (e.g., organic sessions, conversions, domain visibility, GMB actions):
Try monthly comparison.



5. Reporting Structure (Dashboard)
The dashboard should contain five pages.
 PDF and AI video follow exactly these pages — sequentially.

Page 1 — Overview
KPI Cards
Total ranking keywords (DataForSEO/SEMrush-style)


Change (using “most positive comparison wins” logic)


Organic sessions


Organic conversions


Google Business Profile actions (calls + directions + website clicks, aggregated)


Charts
Domain Visibility Line Chart


Total ranking keywords per month (12 months)


Organic Traffic Line Chart


Organic sessions + organic conversions (12 months)


LLM Summary
Short, positive monthly summary.

Page 2 — Keywords & Rankings
2.1 Top Keywords Table (Top 10–15)
Columns:
Keyword


Current position


Change vs last month


Data from DataForSEO.

2.2 Top Winners Table (Top 5)
Columns:
Keyword


Current position


Change vs last month


Rules:
No impression or volume filters


No top-20/top-30 restriction


Simply the largest positive ranking increases



2.3 New Rankings Table (Top 5)
Columns:
Keyword


Current position


Rules:
Previously not in index / no visibility


Now visible (position ≤100)



2.4 Controlled Losers Table (max. 3–5 rows)
Columns:
Keyword


Current position


Change vs last month (max. −3)


Rules:
Shown visually only


Not included in AI video narration



Page 3 — Local & Grid Rankings
3.1 Local Pack Summary (Conditional)
Only show this section if at least one money keyword is in the Local Pack.
Show:
Number of money keywords the law firm ranks for in the Local Pack


Change vs last month


Table:


Keyword


Local Pack position (1–3) (Check where to find)


Change vs last month


If none appear → hide section.

3.2 Local Grid Heatmaps  (Check where data lies)
Two heatmaps:
Last month


This month


Local Grid Rules
Radius: 10 km


Center: client’s address / city


Grid size: you may propose 7x7 or 9x9


Only show one keyword per month.


Keyword Selection Logic (Important)
Default: main money keyword


If Grid for main keyword:


shows no improvement


or worsens


or performs weakly overall
 → automatically choose a fallback keyword with better Grid performance.


Fallback keywords are provided in the config (3–5 options).

3.3 LLM Summary
Positive, calm interpretation of grid + local visibility.

Page 4 — Organic Traffic & Conversions
4.1 Line Chart
Organic sessions (12 months)


Organic conversions (12 months)


4.2 Top Landing Pages Table (Top 10)
Columns:
Landing page URL / title


Organic sessions


Organic conversions


Conversion rate


4.3 Search Console Macro KPIs
Displayed as KPI cards or small box:
Total clicks


Total impressions


CTR


Average position


Comparison windows follow the “most positive wins” logic.

Page 5 — Google Business Profile Activity
5.1 KPI Cards
Calls


Directions


Website clicks


(Each with best-positive comparison period.)
5.2 Time Series Chart
Line chart covering 6–12 months:
Calls


Directions


Website clicks


5.3 LLM Summary
Short, positive, reassuring commentary.

6. LLM Report Generation
The text report must follow the exact same 5-page structure, with one section per page:
Overview Summary


Keywords & Rankings


Local & Grid Visibility


Organic Traffic & Conversions


Google Business Profile Activity


Tone requirements
Professional


Calm & positive


No panic


Never emphasize losses


Use positive comparison windows when possible


Explain stability as a good sign (“consistent visibility despite seasonal fluctuations”)


Inputs given to LLM
Data per page


Selected comparison window per KPI


Keyword tables


Local grid keyword chosen


Grid improvement signals


Summaries for organic and GMB


Output
5–7 paragraphs, matching pages


Ready to be read by the avatar


Approx. 800–1500 words total


Pure interpretation + reassurance


No operational “we will do X” commitments
 (just soft strategic framing)



7. AI Video Generation
The system must generate:
A PDF from the dashboard (monthly per client)


An AI video of ~5–10 minutes


Avatar = our SEO manager (we will provide visuals/voice)


Video switches pages exactly in sync


Suggested: ~1 minute per page


Script comes from LLM report


The avatar should be positioned similar to Loom-style layout (avatar + screen recording feel)


Key Requirements
Automated creation


Automated page switching


Automated voice sync


Output: video file (MP4) or shareable link



8. Automation & Scheduling
Automatic schedule
Run on the 1st of every month


Reporting period: entire previous month


If data is missing or API errors occur
Do not generate the report


Send an email to us:


Client name


Reason for failure


After we fix the issue, we can manually trigger regeneration
 (CLI command or simple UI button — your choice)



9. Error Handling & Logging
Log all API calls


Log missing connections (GSC, GA4, DataForSEO, GBP)


Email alert summarizing failed clients


No alerts for successful clients


Ability to re-run individual clients on demand



10. Security & Credentials
All API keys stored securely (env vars, .env, secrets manager)


You will receive real API keys to test with real clients


No keys stored in source code


Keys must be referenced programmatically at runtime



11. Development Requirements
Storage
You may choose:
PostgreSQL / Supabase (preferred)
 or


Another scalable relational DB


Data retention
Keep historical data as long as the client is with us


Minimum 12–24 months recommended


Data model must allow easy expansion (e.g., new KPIs later)


Documentation
Only minimal documentation needed:
How to add a new client


How to manually re-run a client


Where logs/errors appear


No extensive developer manual required.

12. Summary of Critical Logic Rules
(A) Comparison Logic
Always show the most positive valid comparison window.
(B) Keyword Winners
Pure ranking movement — no filtering.
(C) New Rankings
Keywords entering visibility for the first time.
(D) Losers
Max 3–5, small table, no video narration.
(E) Grid Keyword Selection
Main money keyword → fallback keyword if needed.
(F) Local Pack Summary
Show only if at least 1 money keyword is in Local Pack.
(G) LLM Tone
Always reassuring, stabilizing, positive framing.





I want to build a app with the above things:
But for now only focus on page 2 for now:
in app, we come, and have the option to add a customer and add a name, then we store the names (in storage)
we use supabase for storage, do output the tables, rls, policies, fucntions, triggers etc.

then for each customer, we will one option for now (we will have multiple later), one datasource for now:
mangools:
1. select domain. 

we get the domains from:
Request URL
https://api.mangools.com/v3/serpwatcher/trackings
Request Method
GET
Status Code
304 Not Modified
Remote Address
52.54.208.41:443
Referrer Policy
unsafe-url
access-control-allow-credentials
true
access-control-allow-headers
Cache-Control,Content-type,Accept,X-Access-Token,X-Human-Token,X-Key,Origin,X-Mangools-Client,x-recaptcha-token,Last-Modified,If-Modified-Since,Cookie,Set-Cookie
access-control-allow-methods
GET,PUT,POST,DELETE,OPTIONS,PATCH
access-control-allow-origin
https://app.mangools.com
cache-control
private, must-revalidate
connection
keep-alive
date
Tue, 09 Dec 2025 06:56:44 GMT
etag
W/"74256-EM5EOy1/QiWN23ZvS8kuHQ"
server
nginx
set-cookie
api.mangools.com=eyJkZXZpY2VJRCI6IjgyYTZmZDRhLTYwMzUtNGEzNC1hZGFiLWI0MGFhMjZjOTEzNiJ9; path=/; expires=Fri, 07 Dec 2035 06:56:44 GMT; samesite=lax; secure; httponly
set-cookie
api.mangools.com.sig=RRlW2YoZ8uv0x-LbqWKv4RrrOYY; path=/; expires=Fri, 07 Dec 2035 06:56:44 GMT; samesite=lax; secure; httponly
x-powered-by
Express
x-request-id
e3ecc6dc290cc78e2bf32539a201bcf3
accept
*/*
accept-encoding
gzip, deflate, br, zstd
accept-language
en-US,en;q=0.9
connection
keep-alive
host
api.mangools.com
if-none-match
W/"74256-EM5EOy1/QiWN23ZvS8kuHQ"
origin
https://app.mangools.com
referer
https://app.mangools.com/serpwatcher/trackings
sec-ch-ua
"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"Windows"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-site
user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
x-access-token
bde7a46d8d61223404ecb14a37c4519fc97d1bcde52d745f14849a06309b96f4



then for one customer, we are in, we can select multiple domains. and save them in the database, the required stuff only,:
[
    {
        "_id": "692eaad2cf80360aad3a6d27",
        "domain": "arbeitsrecht-kroeber.de",
        "location": {
            "_id": 2276,
            "code": "de",
            "label": "Germany"
        },
        "platform_id": 1,
        "count": 39,
        "tracked_keyword_ids": [],
        "tracking_config": {
            "place_id": null,
            "ludocid": null,
            "name": null,
            "address": null,
            "forced_place_id": null
        },
        "share_token": "SHRb3Us3JYnv0TIlIDjosnoeTYl2cqJfzcs1LaLXXGRspPTmxuc1rsHZdurgrAW1",
        "created_at": 1764666066,
        "is_deleted": false,
        "reports_active": [
            null,
            null
        ],
        "stats": {
            "timeframes": {
                "2025-12-02": {
                    "performance_index": 0.07056351099486881,
                    "visibility_index": 0.48980571274129353,
                    "performance_total": 130379,
                    "estimated_visits": 0,
                    "rank_distribution": {
                        "1": 0,
                        "3": 0,
                        "10": 0,
                        "20": 1,
                        "100": 1,
                        "rest": 4
                    }
                },
                "2025-12-03": {
                    "performance_index": 0.5798479816534872,
                    "visibility_index": 1.068973409764183,
                    "performance_total": 130379,
                    "estimated_visits": 1,
                    "rank_distribution": {
                        "1": 0,
                        "3": 0,
                        "10": 3,
                        "20": 2,
                        "100": 0,
                        "rest": 1
                    }
                },
                "2025-12-04": {
                    "performance_index": 0.45329385867355937,
                    "visibility_index": 0.7956061097510196,
                    "performance_total": 130379,
                    "estimated_visits": 0,
                    "rank_distribution": {
                        "1": 0,
                        "3": 0,
                        "10": 3,
                        "20": 2,
                        "100": 0,
                        "rest": 1
                    }
                },
                "2025-12-05": {
                    "performance_index": 15.23251443867494,
                    "visibility_index": 2.813714797695699,
                    "performance_total": 130379,
                    "estimated_visits": 130,
                    "rank_distribution": {
                        "1": 1,
                        "3": 2,
                        "10": 10,
                        "20": 5,
                        "100": 5,
                        "rest": 16
                    }
                },
                "2025-12-06": {
                    "performance_index": 14.337431641598725,
                    "visibility_index": 2.1291345875933154,
                    "performance_total": 130379,
                    "estimated_visits": 123,
                    "rank_distribution": {
                        "1": 1,
                        "3": 2,
                        "10": 7,
                        "20": 7,
                        "100": 3,
                        "rest": 19
                    }
                },
                "2025-12-07": {
                    "performance_index": 13.14858988027213,
                    "visibility_index": 1.20347047052126,
                    "performance_total": 130379,
                    "estimated_visits": 102,
                    "rank_distribution": {
                        "1": 0,
                        "3": 2,
                        "10": 10,
                        "20": 6,
                        "100": 3,
                        "rest": 18
                    }
                }
            }
        }
    },
	]


in the env:
mangools-x-access-token=bde7a46d8d61223404ecb14a37c4519fc97d1bcde52d745f14849a06309b96f4


then whenever we open our dashboard we can see the customers, we select one and can see the domains attached we can also attach another one by getting them from the 
mangools request.


so for now we have a beautiful dashboard for Corominas-Seo-Reporting-System:
where we can open(edit), add, and delete customers.

and inn customers we can add datasource , for now only supported mangools.
by getting the domains from the ip (also make it somewhow show, that this domain is attached to that customer etc).
, we can slect domains to attach to the customers.

so when we open the cusomter we can see the datasource and domains attaach, we will have mulitple options, but for now don't fprget it is for mangools.


construct beautiful ui.

for now this will be it.


https://corominas-consulting.de/