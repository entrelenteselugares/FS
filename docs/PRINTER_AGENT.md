# Printer Agent: IoT Printing Automation

## Overview

The Printer Agent is a lightweight Node.js service designed to run on-site (Raspberry Pi or Windows PC) during events. It enables the "Phygital" experience by automatically downloading and printing photos as they are uploaded and paid for.

## 1. Architecture

The agent follows a **Poll-based architecture** to bypass firewall/NAT issues often found in event venues (e.g., Hotel Wi-Fi).

- **Polling Frequency**: Every 5 seconds (configurable).
- **Communication Protocol**: HTTP/JSON via authenticated REST endpoints.
- **Payload**: Metadata including `referenceCode`, `imageUrl`, and `jobId`.

## 2. Operation Lifecycle

1. **Queue Fetch**: The agent requests `PENDING_PRINT` jobs from `/api/phygital/events/:eventId/queue`.
2. **Sequential Download**: Photos are downloaded to a local `temp/` folder using the unique `referenceCode` as the filename.
3. **Print Execution**:
   - **Linux (Raspberry Pi)**: Uses the `lp` command (CUPS) with the `-d` (destination) flag.
   - **Windows**: Uses PowerShell's `Start-Process -Verb Print`.
4. **Server Confirmation**: Upon successful spooling, the agent notifies the backend via `/api/phygital/prints/:id/status`.
5. **Auto-Cleanup**: Local files are deleted after 10 seconds to save disk space and maintain privacy.

## 3. Resilience Features

- **Mock Mode**: Allows testing the queue logic without consuming paper/ink (`MOCK_MODE=true`).
- **Processing Lock**: Ensures only one batch is processed at a time to prevent duplicate prints or spooler congestion.
- **Fail-safe Cleanup**: Temporary files are deleted even if the server confirmation fails in subsequent runs.

## 4. Configuration (`.env`)

| Variable       | Description                                              |
| :------------- | :------------------------------------------------------- |
| `BACKEND_URL`  | The URL of the Foto Segundo API (e.g., Vercel or Local). |
| `EVENT_ID`     | The unique ID or Slug of the event being served.         |
| `PRINTER_NAME` | The local name of the printer (e.g., `EPSON_L3250`).     |
| `AGENT_TOKEN`  | Secure token for admin-level queue access.               |
| `MOCK_MODE`    | Set to `true` to simulate printing for dry runs.         |
