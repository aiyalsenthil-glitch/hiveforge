— Backend Architecture
Philosophy
HiveForge is not a CRUD application.
It is an Execution Engine.
Almost every backend exists to store data.
HiveForge exists to execute Missions.
So our backend revolves around one pipeline:
Mission
     ↓
Planning
     ↓
Execution
     ↓
Coordination
     ↓
Reporting
Everything else supports this pipeline.
________________________________________
High-Level Architecture
                Frontend (Next.js)

                       │

             REST API + WebSocket

                       │

                  NestJS Backend

                       │

      ──────────────────────────────────────

        Workspace Module

        Mission Module

        Hive Core Module

        Knowledge Module

        Report Module

      ──────────────────────────────────────

                    PostgreSQL

                       │

                  Fireworks AI
________________________________________
NestJS Modules
Instead of dozens of modules, we'll have 8 core modules.
src/

modules/

    workspace/

    mission/

    hive-core/

    worker/

    knowledge/

    report/

    ai/

    common/
Each module has a single responsibility.
________________________________________
Workspace Module
Responsible for:
•	Create Workspace 
•	Update Workspace 
•	Load Workspace 
•	Workspace Settings 
API
POST /workspaces

GET /workspaces

GET /workspaces/:id

PATCH /workspaces/:id
________________________________________
Mission Module
The Mission Module owns the business lifecycle.
Responsibilities
•	Create Mission 
•	Retrieve Mission 
•	Mission Status 
•	Mission History 
APIs
POST /missions

GET /missions

GET /missions/:id

DELETE /missions/:id
Notice...
Mission Module does not execute anything.
It simply creates the Mission.
Execution belongs to Hive Core.
________________________________________
Hive Core Module
This is the heart.
Responsibilities
•	Analyze Mission 
•	Create MissionPlan 
•	Build Execution Graph 
•	Schedule Tasks 
•	Execute Workers 
•	Merge Results 
Internal Services
Hive Core

MissionPlannerService

TaskGraphService

DispatcherService

ExecutionService

ContextBuilderService

ReportComposerService
________________________________________
Worker Module
Contains every Digital Worker.
workers/

research/

finance/

marketing/

operations/
Each Worker implements exactly one interface.
DigitalWorker.execute(...)
No exceptions.
________________________________________
AI Module
Responsible for every AI call.
AI Module

↓

Provider Interface

↓

Fireworks Provider

↓

Gemma

↓

Future Providers
Hive Core never talks to Fireworks directly.
________________________________________
Knowledge Module
Responsible for
•	Workspace Notes 
•	Documents 
•	Context Retrieval 
Future
•	Vector Search 
•	Embeddings 
•	RAG 
________________________________________
Report Module
Responsible for
•	Executive Summary 
•	Final Report 
•	PDF (Future) 
•	Export 
Report Module never calls AI.
It formats outputs.
________________________________________
Common Module
Shared utilities
•	Logger 
•	Errors 
•	Config 
•	Types 
•	DTOs 
•	Validators 
________________________________________
Request Flow
Example
User
Launch Coffee Shop
↓
POST /missions
Mission Module
↓
Hive Core
↓
Mission Planner
↓
Mission Plan
↓
Dispatcher
↓
Research Worker
↓
Finance Worker
↓
Marketing Worker
↓
Operations Worker
↓
Report
↓
Frontend
________________________________________
API Design
I think we should keep APIs extremely clean.
________________________________________
Workspace
POST /workspaces

GET /workspaces

GET /workspaces/:id
________________________________________
Mission
POST /missions

GET /missions

GET /missions/:id
________________________________________
Execution
POST /missions/:id/start

GET /missions/:id/status

GET /missions/:id/timeline
________________________________________
Deliverables
GET /missions/:id/report
Simple.
Readable.
RESTful.
________________________________________
WebSocket
Instead of polling...
We'll stream progress.
Mission Started

↓

Planning

↓

Research

↓

Finance

↓

Marketing

↓

Operations

↓

Completed
Frontend updates instantly.
This makes the demo much more impressive.
________________________________________
Background Execution
Hive Core runs asynchronously.
HTTP Request

↓

Mission Created

↓

Queue

↓

Hive Core

↓

Worker Execution

↓

Mission Finished
The user doesn't wait for one long request.
________________________________________
Why a Queue?
Even in the MVP.
Because later we can swap:
In Memory Queue

↓

BullMQ

↓

RabbitMQ

↓

AWS SQS
without changing Hive Core.
________________________________________
Error Flow
Worker Error

↓

Execution Service

↓

Retry

↓

Fallback

↓

Mission Status

↓

Continue
Mission doesn't crash.
________________________________________
Folder Structure
src/

modules/

workspace/

mission/

hive-core/

worker/

knowledge/

report/

ai/

common/

prisma/

config/
Simple.
Professional.
Scalable.
________________________________________
Dependency Rule
One strict rule.
Frontend

↓

Mission Module

↓

Hive Core

↓

Worker Module

↓

AI Module
Never:
Worker

↓

Mission Module
Workers never know Missions exist.
This keeps the system loosely coupled.
________________________________________
MVP Module Map
Frontend

↓

Mission API

↓

Hive Core

↓

Planner

↓

Dispatcher

↓

Research

↓

Finance

↓

Marketing

↓

Operations

↓

Composer

↓

Report
