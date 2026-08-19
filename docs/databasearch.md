Section 19 — Database Design
•	Philosophy
•	Our database should not store AI conversations.
•	It should store business objects.
•	HiveForge is a Mission Management Platform, not a chatbot.
•	So everything revolves around:
•	Workspace
    ↓
Mission
    ↓
Tasks
    ↓
Digital Workers
    ↓
Deliverables
•	________________________________________
•	Core Database
•	Workspace
│
├── Missions
│
├── Knowledge
│
├── Workforce
│
└── Activity
•	________________________________________
•	Entity Relationship Diagram (MVP)
•	Workspace
│
├── Mission
│      │
│      ├── Task
│      │      │
│      │      └── Worker Assignment
│      │
│      └── Deliverable
│
├── Knowledge
│
└── Activity Log
•	________________________________________
•	Entity 1 — Workspace
•	Represents one business or organization.
•	Workspace

id

name

description

industry

createdAt

updatedAt
•	Example
•	Workspace

Acme Coffee
•	________________________________________
•	Entity 2 — Mission
•	The heart of HiveForge.
•	Mission

id

workspaceId

title

description

status

priority

executionGraph

createdAt

completedAt
•	Status
•	Draft

Planning

Executing

Reviewing

Completed

Failed
•	________________________________________
•	Entity 3 — Task
•	Every Mission becomes Tasks.
•	Task

id

missionId

workerType

title

status

dependencyIds

startedAt

completedAt

output
•	Example
•	Research

↓

Finance

↓

Marketing
•	________________________________________
•	Entity 4 — Worker Assignment
•	Notice...
•	We're NOT storing workers.
•	We're storing
•	Worker Assignments.
•	Because workers are stateless.
•	WorkerAssignment

id

missionId

taskId

workerType

status

startedAt

completedAt

duration
•	Example
•	Research Worker

Mission

Coffee Shop
•	________________________________________
•	Entity 5 — Deliverable
•	Final outputs.
•	Deliverable

id

missionId

type

title

content

metadata
•	Types
•	Executive Summary

Research

Finance

Marketing

Operations
•	________________________________________
•	Entity 6 — Knowledge
•	Workspace knowledge.
•	Knowledge

id

workspaceId

title

type

content

source
•	Types
•	Document

Note

Website

PDF

Image
•	________________________________________
•	Entity 7 — Activity
•	Timeline.
•	Activity

id

workspaceId

missionId

type

message

createdAt
•	Example
•	Mission Started

↓

Research Completed

↓

Finance Started

↓

Mission Finished
•	________________________________________
•	Mission State Machine
•	Draft

↓

Planning

↓

Executing

↓

Reviewing

↓

Completed
•	If error
•	Executing

↓

Failed
•	________________________________________
•	Task State Machine
•	Pending

↓

Ready

↓

Running

↓

Completed
•	or
•	Running

↓

Failed
•	________________________________________
•	Worker State
•	Remember
•	Workers are stateless.
•	Runtime only.
•	Idle

↓

Assigned

↓

Executing

↓

Returned

↓

Destroyed
•	Nothing is stored.
•	Only assignment history.
•	________________________________________
•	Entity 8 — Product (Inventory)
•	Represents catalog items in the retail store.
•	Product
    id
    workspaceId
    sku
    name
    category
    costPrice
    sellingPrice
    stock
    minStockLevel
    barcode
    createdAt
    updatedAt

•	Entity 9 — Sale (POS Transactions)
•	Represents POS checkout transactions and receipts.
•	Sale
    id
    workspaceId
    invoiceNo
    subtotal
    discount
    tax
    totalAmount
    paymentMethod (CASH, UPI, CARD)
    customerName
    customerPhone
    items (JSONB Array of line items)
    createdAt

•	________________________________________
•	PostgreSQL Tables
•	workspaces
  missions
  tasks
  worker_assignments
  deliverables
  knowledge
  activities
  products
  sales

•	________________________________________
•	Database Design Principles
•	✅ Normalize core business data
•	✅ Store AI outputs & invoice items as JSONB
•	✅ Stateless workers
•	✅ Mission & Store-centric schema
•	✅ Clean, extensible database design

