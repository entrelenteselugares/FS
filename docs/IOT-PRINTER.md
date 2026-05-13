# IoT Printer Agent Architecture

## Overview

The **IoT Printer Agent** is a decoupled software layer designed to bridge the gap between our cloud infrastructure and on-site physical hardware (Printers). It allows for real-time photo printing at events without requiring complex network configurations.

## Architecture

The system uses a **Pull-Based (Polling)** model to ensure maximum resilience against flaky event Wi-Fi.

### Components

1. **Cloud Backend**: Manages the `PhygitalPrint` queue.
2. **Local Agent**: A Node.js script (`printer-agent/agent.js`) running on a local device (Raspberry Pi, Laptop, or PC).
3. **Hardware**: Physical printer (e.g., Epson L3250, DNP DS620) connected via USB/Network.

## Workflow

1. **Trigger**: An order is approved or a professional manually triggers a print.
2. **Queue**: The backend adds a record to the `PhygitalPrint` table with status `PENDING`.
3. **Poll**: The Local Agent polls `/api/phygital/events/:eventId/queue` (or passes `eventId` as query param).
4. **Download**: Agent downloads the high-res file to a local `temp/` folder.
5. **Print**: Agent executes the system print command:
   - **Linux**: `lp -d PRINTER_NAME`
   - **Windows**: `powershell Start-Process -Verb Print`
6. **Confirm**: Agent sends a `PATCH` to `/api/phygital/prints/:id/status` with status `PRINTED`.
7. **Cleanup**: Local file is deleted after successful spooling.

## Key Features

- **Resilience**: If the internet drops, the agent continues polling once reconnected. No print jobs are lost.
- **Sequential Processing**: Prevents spooler congestion by processing one job at a time.
- **Mock Mode**: Developers can test the full logic without wasting paper/ink.

## Configuration (.env)

- `BACKEND_URL`: URL of the cloud API.
- `EVENT_ID`: Unique ID of the event the agent is servicing.
- `PRINTER_NAME`: System name of the target printer.
- `AGENT_TOKEN`: Secure Bearer token for API authentication.
