# TM-209 thumbnail resilience

Authorized by the master execution request on 2026-11-15. Existing typed API mapping and image-present/null behavior are retained. Search thumbnails must show the existing neutral placeholder while loading and after network errors, preserve the existing aspect ratio and alt text, and recover when a card receives a different URL. No fallback URL, POI image, new screen or API is introduced.

Acceptance: image load/error behavior and URL replacement are exercised through DOM events. Existing card content, pagination links and accessibility remain unchanged.
