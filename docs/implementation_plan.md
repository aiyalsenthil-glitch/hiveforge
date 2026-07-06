# Implementation Plan - HiveForge Enterprise Monorepo

We will implement HiveForge using **Nx + pnpm** in an integrated monorepo. This plan aligns on the structural scaffolding and the architectural refinements requested, including normalized task dependency tables, queue-based scheduling, and modular package separation.

---

## Proposed Package Architecture

We will organize the code under `packages/` into discrete Nx libraries to isolate runtime, scheduling, planning, database models, and AI adapters:

```
e:\Projects\hiveforge\
├── package.json
├── pnpm-workspace.yaml
├── nx.json
├── tsconfig.base.json
├── apps/
│   ├── web/ (Next.js frontend)
│   └── api/ (NestJS API gateway)
└── packages/
    ├── shared/          # Interfaces, constants, validation contracts
    ├── database/        # Prisma schema and generated clients
    ├── ai-runtime/      # AIProvider interface and LLM adapters
    ├── worker-runtime/  # WorkerRegistry and worker executor definitions
    ├── planner/         # Dynamic graph planner using LLMs
    ├── scheduler/       # Task queue processor (BullMQ / In-Memory Queue)
    ├── graph/           # DAG dependency resolver
    └── context/         # Context aggregation and RAG services
```

---

## Database Schema (15 Normalized Entities)

We will configure the Prisma schema with normalized tables to support task resumability, auditing, and multi-tenant isolation:

1. `Workspace`
2. `Mission`
3. `MissionVersion`
4. `Task`
5. `TaskDependency`
6. `Worker`
7. `WorkerAssignment`
8. `Artifact`
9. `Knowledge`
10. `Activity`
11. `ExecutionLog`
12. `Embedding`
13. `File`
14. `PromptTemplate`
15. `AIProvider`

---

## User Review Required

> [!IMPORTANT]
> **Nx Scaffold Approach**: We will generate the Next.js (`apps/web`) and NestJS (`apps/api`) projects using standard Nx generators:
> - `@nx/next` for the frontend.
> - `@nx/nest` for the backend.
>
> **Task Queue Storage**: For local MVP setup, we can use an **in-memory queue/scheduler** matching the BullMQ interface, allowing immediate execution without requiring a local Redis server, while making it trivial to swap in Redis + BullMQ for production.

---

## Open Questions

1. **Redis Server**: Do you have a local Redis server running, or should we setup a Docker Compose file with PostgreSQL + Redis so we can run full BullMQ queue processing right away?

---

## Verification Plan

### Automated Checks
- Verify Nx build graph using `npx nx graph`.
- Verify database migrations run and connect successfully.
- Verify TypeScript compiler builds across all workspace packages and apps.
