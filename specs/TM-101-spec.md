# TM-101 UC-54 implementation contract

Authority: [current official Report 3](https://docs.google.com/document/d/1VwPkqRyC6ZlbXBQC0ztdektt0vAyE3qt/edit), §3.9.4.1 and Table 5. Drive revision 0B5_dfpH4IC_wQks1SFVRSmlzeFhsWmxtUjRZZzhMK3hJdDNBPQ, modified 2026-11-12T12:32:53.377Z, DOCX SHA-256 093D69D721831608F462DE0AC450E4BBF3A8A96477B991622FDEAD1EFA3D25BA.

Scope is Create Route only, Screen 20 list integration and Screen 21. UC-55, lifecycle UI, scheduling algorithm changes, Mobile screens, merge and deployment are outside this delivery.

Owner decisions received in this chat on 2026-11-13: Route Note is optional, blank stored null, maximum 2,000 characters. Owner approved implementation wording MSG139 “Route created successfully.”; MSG141 “Select two different Active points of interest.”; MSG143 “Distance and estimated travel time must be positive values.” The current Drive catalog now contains MSG139, MSG141 and MSG143. The later Owner approval supplies the implementation wording shown here. MSG01, MSG126 and MSG127 retain catalog wording.

GET /api/v1/admin/routes?page=1&pageSize=20 returns {items: RouteDto[], page, pageSize, totalCount}. Staff only. GET /api/v1/admin/routes/options returns {pois:[{id,name,latitude,longitude}], transportModes:["Walking","Motorbike","Car","PublicTransit"]}. Only Active POIs; Staff only.

POST /api/v1/admin/routes, Idempotency-Key UUID header; JSON {fromPoiId,toPoiId,distanceKm,estimatedDurationMinutes,transportMode,routeNote}. Canonical enum names only. RouteDto contains {id,fromPoiId,toPoiId,fromPoiName,toPoiName,distanceKm,estimatedDurationMinutes,transportMode,status,routeNote,createdAtUtc,messageCode?,message?}. Creation returns 201 with MSG139 and server identifier. Status is Active. Existing storage supports decimal(6,2) distance and int duration; reject unrepresentable values rather than silently round/truncate.

Active Staff account is checked against authoritative SQL user state inside serializable transaction. Both Active distinct POIs are re-read at persistence boundary. Route, immutable audit and operation identity commit atomically. Repeat operation identifiers rejected per CCR-13 (called CR-13 in task); preserve existing unique directed endpoint/mode constraint. No arbitrary mode strings. Standard Result + ProblemDetails conventions; no response envelope.

SQL database-first migration adds status, optional note, creator and idempotency identity without deleting existing data. Existing valid rows connecting Active POIs may be Active; unsafe legacy backfill must fail closed rather than invent lifecycle decisions. Rollback must not silently discard new data.

Map preview reuses installed Mapbox GL and existing Directions helper. Walking uses walking profile; other existing modes use existing driving road geometry mapping, labeled as road geometry, not transit schedules. No persisted polyline, fabricated line, new provider, token or paid dependency.

PC-01 Active route joins two Active POIs. PC-02 planner/navigation can retrieve Active persisted route metrics while guidance remains Mapbox. PC-03 immutable audit exists. PC-04 validation/save/audit failure commits no route. Prove with SQL/API integration tests; skipped tests are not proof.

Acceptance follows all 20 criteria in user master prompt. Original SRS has inconsistent BR numbering between UC-specific text and global BR table; trace the UC-specific rules explicitly. Screen image is TBD, not Figure 84 as asserted by task. These discrepancies do not authorize modifying SRS.
