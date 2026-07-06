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
•	PostgreSQL Tables
•	workspaces

missions

tasks

worker_assignments

deliverables

knowledge

activities
•	Only 7 tables.
•	Very clean.
•	________________________________________
•	Why not store Workers?
•	Because
•	Research Worker
•	today
•	=
•	Research Worker
•	tomorrow
•	They're code.
•	Not data.
•	Only assignments change.
•	This is a huge simplification.
•	________________________________________
•	JSON Storage
•	Instead of 100 tables...
•	We'll leverage PostgreSQL's JSONB.
•	Mission
•	executionGraph

JSONB
•	Task
•	input

JSONB

output

JSONB
•	Deliverable
•	metadata

JSONB
•	This gives us flexibility during the hackathon.
•	________________________________________
•	MVP ER Diagram
•	Workspace
     │
     ▼
 Mission
     │
 ┌───┴───────────┐
 ▼               ▼
Task      Deliverable
 │
 ▼
WorkerAssignment

Workspace
 │
 ▼
Knowledge

Workspace
 │
 ▼
Activity
•	________________________________________
•	Database Design Principles
•	✅ Normalize core business data
•	✅ Store AI outputs as JSONB
•	✅ Stateless workers
•	✅ Mission-centric
•	✅ Simple schema
