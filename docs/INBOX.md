# INBOX — Founder 접수 큐

> 접수원 ([INTAKE] role) append-only.
> PM 이 사이클 진입/종료 시 read → 새 entry 흡수 → 처리 후 [PROCESSED] 마커 추가.
> 접수원은 entry middle 수정 X. PM 도 entry 자체 수정 X — 마커만 entry 끝에 append.

---
