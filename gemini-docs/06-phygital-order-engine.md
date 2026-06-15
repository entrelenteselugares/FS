# 06. Phygital Order Engine - Foto Segundo

Documentation of the phygital (physical + digital) photography fulfillment pipeline and the IoT printing agent.

## ⚙️ The Phygital Concept

Foto Segundo bridges the gap between high-end digital photography and physical souvenirs. Consumers scan a QR code at live events (like weddings or corporate parties), upload their photos (or purchase photos taken by the professional), which then trigger automated physical prints immediately on-site.

---

## 🔄 The Lifecycle of a Phygital Print Job

```mermaid
sequenceDiagram
    participant User as Consumer / Pro
    participant Web as Web Client
    participant API as Express API
    participant DB as Postgres Queue
    participant IoT as IoT Print Agent
    participant Printer as Physical Printer

    User->>Web: Upload Photo / Confirm Buy
    Web->>API: POST /api/phygital/upload
    API->>API: Apply Watermark (if applicable) & Upload to S3
    API->>DB: CREATE PhygitalPrint (status: PENDING_PRINT)
    DB-->>API: Return unique PIN (referenceCode)
    API-->>Web: Show PIN to User
    loop Heartbeat Pull
        IoT->>API: GET /api/phygital/list-pending?eventId=...
        API->>DB: Fetch PENDING_PRINT items
        DB-->>API: Return items list
        API-->>IoT: Return items list
    end
    IoT->>Printer: Execute Local Print Command
    Printer-->>IoT: Print Completed
    IoT->>API: PATCH /api/phygital/prints/:id/status (PRINTED)
    API->>DB: UPDATE PhygitalPrint status
```

---

## 📟 IoT Print Agent Specification

The printing agent is a lightweight client executing locally in the event space, connected to the physical photo printers (e.g., thermal photo printers).

1. **Authentication**: Connects to the cloud backend using a dedicated authorization header or webhook endpoint.
2. **Polling / Fetching**: Periodically polls `GET /phygital/events/:eventId/prints` to check for new prints.
3. **Local Spooling**: Downloads the target image file and sends standard print commands to the operating system's default printer queue.
4. **Fulfillment Confirmation**: Upon successful print spooling, calls `PATCH /phygital/prints/:id/status` passing `status: PRINTED` (or `FAILED` if a paper jam or error occurs).

---

## 🧪 Simulation & Telemetry

- **Stress Testing Simulation**: The API exposes a `POST /phygital/simulate` endpoint (secured via custom master key `FOTO_SEGUNDO_STRESS_2026`) that registers mock print requests to pressure-test the local agent's throughput.
- **Diagnostics**: Dashboard users (Admin, Cartório, Professionals) can access `/profissional/monitor/:eventId` to check print logs, connection latency, and queue health in real-time.
