# Email Application Architecture & Clarifications

This document outlines the agreed-upon scope and technical requirements for the NextGen Mail CRM.

## 1. Core Architecture
- **Nature:** It is a client, orchestration, and integration layer (Outlook-style).
- **Out of Scope:** SMTP/IMAP server implementation, domain hosting, spam filtering, or DNS management.
- **Providers:** Microsoft 365, Google Workspace, and Generic IMAP/SMTP.
- **Exclusion:** POP/POP3 is strictly unsupported.

## 2. Identity & Access
- **Mailbox Ownership:** Mailboxes are managed at the provider level. The app only **maps** mailboxes to users.
- **Permissions:** Supports Aliases and Shared mailboxes. The app respects provider-level permissions and never expands them.

## 3. Data Linking & Synchronization
- **Single Source of Truth:** Email content remains on the provider servers.
- **References:** CRM and other apps store **references only**, never copies of the email data.
- **Sync Features:** Background processing for New Emails, Folder changes, Deletions, and Read/Unread state.
- **Sync Polling:** Near-real-time where supported, polling fallback elsewhere.

## 4. Advanced Search & Indexing
- **Requirement:** Full-text, permission-aware search (Subject, Sender, Recipients, Body).
- **Technology:** Must support a dedicated search index (e.g., Elasticsearch or OpenSearch) rather than just relational DB queries.

## 5. Security & Attachments
- **Storage:** Attachments should use Object Storage and integrate with Document Management security logic.
- **Security:** Virus scanning is handled by the provider.
- **Encryption:** Standard provider encryption for content; platform-level encryption for cached/indexed data.

## 6. Frontend & Notifications
- **Availability:** Web, Desktop, and Mobile.
- **Offline Support (Desktop):** Offline read access, offline compose with queued send, and clear sync status.
- **Notifications:** Real-time web/desktop notifications with deep-linking to the email context.

## 7. Administrative Control
- **Admin Managed:** Signatures, Templates, UI sender restrictions, Domain allow/deny lists.
- **Account Adding:** Only Admins can add mail servers and configure providers.