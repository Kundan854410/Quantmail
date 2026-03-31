---
Target Agent: Claude Opus 4.6 (GitHub Copilot Matrix)
Task Priority: Maximum (Core Foundation)
Application: Quantmail (The Biometric Identity Gateway for Infinity Trinity)
---

# SYSTEM DIRECTIVE FOR CLAUDE OPUS 4.6:
You are assigned to build the Master Biometric Single Sign-On (SSO) infrastructure for 'Quantmail'. 
Do not build a standard email client. You must build an Agentic Identity Router matching the following constraints:

## 1. Biometric Proof of Personhood (The Core Auth)
- Bypass standard passwords/OTP.
- Initialize an integration flow mimicking `Incode`/`Microblink` SDKs for facial liveness checking during registration.
- Schema must attach a unique cryptographic Hash tied to the facial matrix (`Liveness_Grid`). If the hash fails or implies a bot/synthetic identity, decline with HTTP 403 `STRICT_BOT_DROP`.

## 2. The Zero-Spam 'Shadow Inbox' Filter
- Any incoming SMTP/IMAP ping from non-verified sender domains (`@gmail.com`, `@yahoo.com`) MUST NOT touch the primary inbox. 
- Build a generic Webhook handler `InboxInterceptor.ts` that immediately drops unverified incoming traffic to a separate `Shadow` database table.

## 3. The Autonomous Co-Pilot Hooks
- Ensure your database Prisma schema has a 1-to-1 relationship between `User` and `Digital_Twin`.
- Prepare REST API endpoints where the AI Agent can fetch inbox summaries and autonomously POST replies using x402 transactional formatting.

**Expected PR:** A complete Fastify/Node.js + Prisma ORM backend structure initialized with these exact constraints. Write the Dockerfile and deploy script automatically.
