# System Architecture - Foto Segundo

Conceptual overview of the platform's architectural patterns and communication flows.

## 🏛️ 4-Tier Business Model
The system is built on a 4-tier vertical structure:
1. **Master (Admin)**: Full control over global parameters, franchises, and revenue.
2. **Partner (Franchisee/Unit)**: Management of local operational units and print logistics.
3. **Professional (Fotógrafo)**: Field execution, gallery management, and service catalog.
4. **Consumer (Client)**: Final user experience, checkout, and phygital asset access.

## 🏗️ Backend Design Patterns
- **Service-Oriented Architecture (SOA)**: Core business logic is encapsulated in Services (e.g., `PhygitalService`, `LogisticsService`).
- **Controller-Service-Repository**: Controllers handle HTTP requests, Services execute logic, and Prisma handles the DB abstraction.
- **Middleware Chain**: Heavy use of custom middlewares for role-based access control (RBAC) and data validation.

## 🖼️ Frontend Architecture
- **Component-Driven Development**: High-reusability atomic components (e.g., `EventCard`, `DashboardLayout`).
- **Role-Based Routing**: Clean separation of views based on user authentication level.
- **State Management**: React Hooks + Local Storage for session and temporary data.

## 📠 Phygital Pipeline
Unique hybrid architecture where the cloud backend communicates with local **Printer Agents** to materialize digital assets instantly in physical locations.
