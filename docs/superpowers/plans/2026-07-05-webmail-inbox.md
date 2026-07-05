# Webmail Inbox Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed a Google Workspace + Microsoft 365 webmail inbox (read + compose) directly in the portal PWA using OAuth 2.0, IMAP/XOAUTH2, and SMTP/XOAUTH2.

**Architecture:** OAuth tokens are stored AES-256-GCM encrypted in PostgreSQL. On inbox open, the NestJS backend opens an IMAP connection (XOAUTH2) and syncs new email headers into a `MailHeader` cache table; the frontend reads the cache instantly. Email bodies are fetched live from IMAP on demand and cached in IndexedDB (browser-only, never the server).

**Tech Stack:** NestJS + Prisma + PostgreSQL (API), React 18 + Vite (PWA), `imapflow` (IMAP), `nodemailer` (SMTP), `googleapis` (Google OAuth), native fetch (Microsoft OAuth), `dompurify` (frontend HTML sanitization), IndexedDB (body cache).

## Global Constraints

- All IDs follow the existing pattern: `BigInt @id @default(autoincrement())` for new Prisma models; relation field to `Profile` (not `User`) using `profileId BigInt`.
- Controller guard pattern: `@UseGuards(JwtAuthGuard)` — user ID available as `req.user.id` (BigInt).
- Swagger annotations required on all controllers: `@ApiTags`, `@ApiBearerAuth('bearer')`.
- Prisma table names use `@@map("snake_case")`, columns use `@map("snake_case")`.
- No email body or attachment content stored in PostgreSQL — metadata only.
- `MAIL_ENCRYPTION_KEY` must be a 64-character hex string (32 bytes) in `.env`.
- No existing test infrastructure — verification steps use curl and browser testing.
- Commit after every task using the message format shown in each task's commit step.

---

## File Map

### New files — Backend (`api/src/modules/mail/`)
| File | Responsibility |
|---|---|
| `mail-crypto.service.ts` | AES-256-GCM encrypt/decrypt for OAuth tokens |
| `mail-account.service.ts` | OAuth connect, callback, token refresh, list, disconnect |
| `mail-imap.service.ts` | IMAP: open connection, list folders, fetch headers, fetch body, mark read, move |
| `mail-sync.service.ts` | Sync pipeline: fetch new headers since watermark → upsert cache |
| `mail-smtp.service.ts` | Send, reply, forward via SMTP + XOAUTH2 |
| `mail.controller.ts` | All REST endpoints |
| `mail.module.ts` | NestJS module wiring |
| `dto/connect-account.dto.ts` | OAuth callback query params |
| `dto/send-message.dto.ts` | Send/reply/forward body |
| `dto/sync-result.dto.ts` | Sync response shape |

### Modified files — Backend
| File | Change |
|---|---|
| `api/prisma/schema.prisma` | Add `MailProvider` enum, `MailAccount` model, `MailHeader` model; add `mailAccounts` relation on `Profile` |
| `api/src/app.module.ts` | Import and register `MailModule` |

### New files — Shared (`apps/shared/src/lib/local-db/`)
| File | Responsibility |
|---|---|
| `LocalDB.ts` | IDBDatabase lifecycle, store registration, get/put/delete/clear |
| `useLocalDB.ts` | React hook wrapping `LocalDB` |
| `index.ts` | Re-exports |

### Modified files — Shared
| File | Change |
|---|---|
| `apps/shared/src/index.ts` | Export `LocalDB`, `useLocalDB` |

### New files — PWA (`apps/pwa/src/pages/mail/`)
| File | Responsibility |
|---|---|
| `index.tsx` | Route entry, registers LocalDB stores, renders `MailLayout` |
| `MailLayout.tsx` | 3-pane responsive shell |
| `components/AccountSidebar.tsx` | Account switcher + folder tree |
| `components/MessageList.tsx` | Header list with infinite scroll + unread badges |
| `components/MessageDetail.tsx` | Body viewer with DOMPurify sanitization |
| `components/ComposeModal.tsx` | Compose / Reply / Forward drawer |
| `components/AccountConnectPrompt.tsx` | Shown when no accounts connected |
| `components/SyncButton.tsx` | Manual refresh trigger |
| `hooks/useMailAccounts.ts` | Fetch + manage connected accounts |
| `hooks/useMailHeaders.ts` | Fetch cached headers, pagination |
| `hooks/useMailSync.ts` | Trigger sync, track sync state |
| `hooks/useMailBody.ts` | IndexedDB-first body fetch |

### Modified files — PWA
| File | Change |
|---|---|
| `apps/pwa/src/App.tsx` (or router file) | Add `/mail` route |

---

## Task 1: Install Backend Dependencies

**Files:**
- Modify: `api/package.json` (via npm install)

**Interfaces:**
- Produces: `imapflow` and `googleapis` importable in `api/src/`

- [ ] **Step 1: Install packages**

```bash
cd /path/to/portal/api
npm install imapflow googleapis
npm install --save-dev @types/node
```

Expected: packages added to `api/package.json` dependencies.

- [ ] **Step 2: Add env vars to `.env`**

Open `api/.env` and add:

```env
# Google OAuth (get from Google Cloud Console → Credentials → OAuth 2.0 Client)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/mail/auth/google/callback

# Microsoft OAuth (get from Azure Portal → App registrations)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/mail/auth/microsoft/callback

# AES-256-GCM key: generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
MAIL_ENCRYPTION_KEY=generate-and-paste-64-char-hex-here
```

- [ ] **Step 3: Verify imapflow imports**

Create a temporary file `api/src/modules/mail/` directory:

```bash
mkdir -p api/src/modules/mail/dto
```

Then confirm imapflow resolves:

```bash
node -e "require('imapflow'); console.log('imapflow ok')"
```

Expected output: `imapflow ok`

- [ ] **Step 4: Commit**

```bash
git add api/package.json api/package-lock.json
git commit -m "feat(mail): install imapflow and googleapis dependencies"
```

---

## Task 2: Prisma Models

**Files:**
- Modify: `api/prisma/schema.prisma`
- Create: migration via `npx prisma migrate dev`

**Interfaces:**
- Produces: `prisma.mailAccount`, `prisma.mailHeader` available in all services

- [ ] **Step 1: Add `MailProvider` enum and models to `schema.prisma`**

At the end of `api/prisma/schema.prisma`, append:

```prisma
enum MailProvider {
  GOOGLE
  MICROSOFT
}

model MailAccount {
  id             BigInt       @id @default(autoincrement())
  profileId      BigInt       @map("profile_id")
  profile        Profile      @relation(fields: [profileId], references: [id])
  provider       MailProvider
  emailAddress   String       @map("email_address") @db.VarChar(255)
  displayName    String?      @map("display_name") @db.VarChar(255)
  accessToken    String       @map("access_token") @db.Text
  refreshToken   String       @map("refresh_token") @db.Text
  tokenExpiresAt DateTime     @map("token_expires_at")
  isShared       Boolean      @default(false) @map("is_shared")
  label          String?      @db.VarChar(100)
  lastSyncedAt   DateTime?    @map("last_synced_at")
  createdAt      DateTime     @default(now()) @map("created_at")
  headers        MailHeader[]

  @@index([profileId])
  @@map("mail_accounts")
}

model MailHeader {
  id            BigInt      @id @default(autoincrement())
  accountId     BigInt      @map("account_id")
  account       MailAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  uid           String      @db.VarChar(255)
  folder        String      @db.VarChar(500)
  subject       String?     @db.VarChar(998)
  fromName      String?     @map("from_name") @db.VarChar(255)
  fromEmail     String?     @map("from_email") @db.VarChar(255)
  date          DateTime?
  isRead        Boolean     @default(false) @map("is_read")
  hasAttachment Boolean     @default(false) @map("has_attachment")
  snippet       String?     @db.VarChar(500)
  syncedAt      DateTime    @default(now()) @map("synced_at")

  @@unique([accountId, folder, uid])
  @@index([accountId, folder])
  @@map("mail_headers")
}
```

- [ ] **Step 2: Add `mailAccounts` relation on `Profile` model**

Find the `Profile` model in `schema.prisma` and add inside it (after the last existing field, before the closing `}`):

```prisma
  mailAccounts  MailAccount[]
```

- [ ] **Step 3: Run migration**

```bash
cd api
npx prisma migrate dev --name add_mail_accounts_and_headers
```

Expected: migration file created and applied. No errors.

- [ ] **Step 4: Verify tables exist**

```bash
npx prisma studio
```

Open browser at `http://localhost:5555` — confirm `mail_accounts` and `mail_headers` tables appear.

- [ ] **Step 5: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations/
git commit -m "feat(mail): add MailAccount and MailHeader prisma models"
```

---

## Task 3: MailCryptoService

**Files:**
- Create: `api/src/modules/mail/mail-crypto.service.ts`

**Interfaces:**
- Produces:
  - `MailCryptoService.encrypt(plaintext: string): string`
  - `MailCryptoService.decrypt(ciphertext: string): string`
- Format: `iv_base64:authTag_base64:ciphertext_base64` (colon-delimited)

- [ ] **Step 1: Create `mail-crypto.service.ts`**

```typescript
// api/src/modules/mail/mail-crypto.service.ts
import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

@Injectable()
export class MailCryptoService {
  private readonly key: Buffer;

  constructor() {
    const hex = process.env.MAIL_ENCRYPTION_KEY ?? '';
    if (hex.length !== 64) {
      throw new Error('MAIL_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
    }
    this.key = Buffer.from(hex, 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) throw new Error('Invalid ciphertext');
    const [ivB64, tagB64, encB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const enc = Buffer.from(encB64, 'base64');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  }
}
```

- [ ] **Step 2: Verify encrypt/decrypt round-trip**

```bash
node -e "
const { createCipheriv, createDecipheriv, randomBytes } = require('crypto');
const key = Buffer.from(process.env.MAIL_ENCRYPTION_KEY, 'hex');
const iv = randomBytes(12);
const c = createCipheriv('aes-256-gcm', key, iv);
const enc = Buffer.concat([c.update('hello', 'utf8'), c.final()]);
const tag = c.getAuthTag();
const token = iv.toString('base64') + ':' + tag.toString('base64') + ':' + enc.toString('base64');
const [ivB, tB, eB] = token.split(':');
const d = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB,'base64'));
d.setAuthTag(Buffer.from(tB,'base64'));
const result = Buffer.concat([d.update(Buffer.from(eB,'base64')), d.final()]).toString('utf8');
console.log(result === 'hello' ? 'PASS' : 'FAIL');
"
```

Expected: `PASS`

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/mail/mail-crypto.service.ts
git commit -m "feat(mail): add AES-256-GCM token encryption service"
```

---

## Task 4: MailAccountService

**Files:**
- Create: `api/src/modules/mail/mail-account.service.ts`
- Create: `api/src/modules/mail/dto/connect-account.dto.ts`

**Interfaces:**
- Consumes: `MailCryptoService.encrypt()`, `MailCryptoService.decrypt()`, `PrismaService`
- Produces:
  - `getGoogleAuthUrl(): string`
  - `getMicrosoftAuthUrl(): string`
  - `handleGoogleCallback(code: string, profileId: bigint): Promise<MailAccount>`
  - `handleMicrosoftCallback(code: string, profileId: bigint): Promise<MailAccount>`
  - `getDecryptedAccessToken(account: MailAccount): Promise<string>` — refreshes if expired
  - `listAccounts(profileId: bigint): Promise<MailAccount[]>`
  - `deleteAccount(id: bigint, profileId: bigint): Promise<void>`

- [ ] **Step 1: Create `dto/connect-account.dto.ts`**

```typescript
// api/src/modules/mail/dto/connect-account.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthCallbackDto {
  @ApiProperty()
  @IsString()
  code: string;
}
```

- [ ] **Step 2: Create `mail-account.service.ts`**

```typescript
// api/src/modules/mail/mail-account.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailCryptoService } from './mail-crypto.service';
import { google } from 'googleapis';
import type { MailAccount } from '@prisma/client';

const GOOGLE_SCOPES = ['https://mail.google.com/'];

const MICROSOFT_SCOPES = [
  'https://outlook.office365.com/IMAP.AccessAsUser.All',
  'https://outlook.office365.com/SMTP.Send',
  'offline_access',
  'email',
  'profile',
].join(' ');

@Injectable()
export class MailAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: MailCryptoService,
  ) {}

  // ── Google ─────────────────────────────────────────────────────────────

  private googleOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  getGoogleAuthUrl(): string {
    return this.googleOAuth2Client().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_SCOPES,
    });
  }

  async handleGoogleCallback(code: string, profileId: bigint): Promise<MailAccount> {
    const client = this.googleOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Google did not return required tokens. Ensure prompt=consent was used.');
    }

    // Get email address
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();

    return this.prisma.mailAccount.create({
      data: {
        profileId,
        provider: 'GOOGLE',
        emailAddress: data.email!,
        displayName: data.name ?? null,
        accessToken: this.crypto.encrypt(tokens.access_token),
        refreshToken: this.crypto.encrypt(tokens.refresh_token),
        tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
      },
    });
  }

  // ── Microsoft ──────────────────────────────────────────────────────────

  getMicrosoftAuthUrl(): string {
    const tenant = process.env.MICROSOFT_TENANT_ID ?? 'common';
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
      scope: MICROSOFT_SCOPES,
      response_mode: 'query',
    });
    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
  }

  async handleMicrosoftCallback(code: string, profileId: bigint): Promise<MailAccount> {
    const tenant = process.env.MICROSOFT_TENANT_ID ?? 'common';
    const res = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          code,
          redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
          grant_type: 'authorization_code',
          scope: MICROSOFT_SCOPES,
        }),
      },
    );
    const tokens = await res.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      error?: string;
    };
    if (tokens.error) throw new Error(`Microsoft OAuth error: ${tokens.error}`);

    // Get email from Microsoft's userinfo endpoint
    const profile = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }).then(r => r.json()) as { mail?: string; userPrincipalName?: string; displayName?: string };

    const email = profile.mail ?? profile.userPrincipalName ?? '';

    return this.prisma.mailAccount.create({
      data: {
        profileId,
        provider: 'MICROSOFT',
        emailAddress: email,
        displayName: profile.displayName ?? null,
        accessToken: this.crypto.encrypt(tokens.access_token),
        refreshToken: this.crypto.encrypt(tokens.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
  }

  // ── Token refresh ──────────────────────────────────────────────────────

  async getDecryptedAccessToken(account: MailAccount): Promise<string> {
    const expiresAt = new Date(account.tokenExpiresAt);
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() < expiresAt.getTime() - fiveMinutes) {
      return this.crypto.decrypt(account.accessToken);
    }
    return account.provider === 'GOOGLE'
      ? this.refreshGoogleToken(account)
      : this.refreshMicrosoftToken(account);
  }

  private async refreshGoogleToken(account: MailAccount): Promise<string> {
    const client = this.googleOAuth2Client();
    client.setCredentials({ refresh_token: this.crypto.decrypt(account.refreshToken) });
    const { credentials } = await client.refreshAccessToken();
    await this.prisma.mailAccount.update({
      where: { id: account.id },
      data: {
        accessToken: this.crypto.encrypt(credentials.access_token!),
        tokenExpiresAt: new Date(credentials.expiry_date ?? Date.now() + 3600_000),
      },
    });
    return credentials.access_token!;
  }

  private async refreshMicrosoftToken(account: MailAccount): Promise<string> {
    const tenant = process.env.MICROSOFT_TENANT_ID ?? 'common';
    const res = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: this.crypto.decrypt(account.refreshToken),
          grant_type: 'refresh_token',
          scope: MICROSOFT_SCOPES,
        }),
      },
    );
    const tokens = await res.json() as { access_token: string; expires_in: number; error?: string };
    if (tokens.error) throw new Error(`Microsoft token refresh failed: ${tokens.error}`);
    await this.prisma.mailAccount.update({
      where: { id: account.id },
      data: {
        accessToken: this.crypto.encrypt(tokens.access_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
    return tokens.access_token;
  }

  // ── CRUD ───────────────────────────────────────────────────────────────

  listAccounts(profileId: bigint): Promise<MailAccount[]> {
    return this.prisma.mailAccount.findMany({
      where: { profileId },
      select: {
        id: true, provider: true, emailAddress: true,
        displayName: true, isShared: true, label: true,
        lastSyncedAt: true, createdAt: true,
        // Never expose tokens
        profileId: true, tokenExpiresAt: true,
        accessToken: false, refreshToken: false,
      } as any,
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteAccount(id: bigint, profileId: bigint): Promise<void> {
    const account = await this.prisma.mailAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.profileId !== profileId) throw new ForbiddenException();
    await this.prisma.mailAccount.delete({ where: { id } });
  }

  async findAccountForUser(accountId: bigint, profileId: bigint): Promise<MailAccount> {
    const account = await this.prisma.mailAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Mail account not found');
    if (account.profileId !== profileId) throw new ForbiddenException();
    return account;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/mail/
git commit -m "feat(mail): add MailAccountService with Google and Microsoft OAuth"
```

---

## Task 5: MailImapService

**Files:**
- Create: `api/src/modules/mail/mail-imap.service.ts`

**Interfaces:**
- Consumes: `MailAccountService.getDecryptedAccessToken(account)`
- Produces:
  - `listFolders(account, accessToken): Promise<FolderItem[]>`
  - `fetchNewHeaders(account, accessToken, folder, sinceUid): Promise<HeaderItem[]>`
  - `fetchBody(account, accessToken, folder, uid): Promise<{ html: string; text: string }>`
  - `markRead(account, accessToken, folder, uid, isRead): Promise<void>`
  - `moveMessage(account, accessToken, folder, uid, targetFolder): Promise<void>`
  - `trashMessage(account, accessToken, folder, uid): Promise<void>`
- Types:
  ```typescript
  type FolderItem = { name: string; path: string; delimiter: string; flags: Set<string> }
  type HeaderItem = { uid: string; subject: string | null; fromName: string | null; fromEmail: string | null; date: Date | null; isRead: boolean; hasAttachment: boolean; snippet: string | null }
  ```

- [ ] **Step 1: Create `mail-imap.service.ts`**

```typescript
// api/src/modules/mail/mail-imap.service.ts
import { Injectable } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import type { MailAccount } from '@prisma/client';

export type FolderItem = {
  name: string;
  path: string;
  delimiter: string;
  flags: Set<string>;
};

export type HeaderItem = {
  uid: string;
  subject: string | null;
  fromName: string | null;
  fromEmail: string | null;
  date: Date | null;
  isRead: boolean;
  hasAttachment: boolean;
  snippet: string | null;
};

@Injectable()
export class MailImapService {
  private buildClient(account: MailAccount, accessToken: string): ImapFlow {
    const isGoogle = account.provider === 'GOOGLE';
    return new ImapFlow({
      host: isGoogle ? 'imap.gmail.com' : 'outlook.office365.com',
      port: 993,
      secure: true,
      logger: false,
      auth: {
        user: account.emailAddress,
        accessToken,
      },
    });
  }

  async listFolders(account: MailAccount, accessToken: string): Promise<FolderItem[]> {
    const client = this.buildClient(account, accessToken);
    await client.connect();
    try {
      const list = await client.list();
      return list.map(m => ({
        name: m.name,
        path: m.path,
        delimiter: m.delimiter ?? '/',
        flags: m.flags ?? new Set(),
      }));
    } finally {
      await client.logout();
    }
  }

  async fetchNewHeaders(
    account: MailAccount,
    accessToken: string,
    folder: string,
    sinceUid: number = 1,
  ): Promise<HeaderItem[]> {
    const client = this.buildClient(account, accessToken);
    await client.connect();
    try {
      const lock = await client.getMailboxLock(folder);
      try {
        const messages = client.fetch(
          `${sinceUid}:*`,
          { uid: true, flags: true, envelope: true, bodyStructure: true },
          { uid: true },
        );
        const results: HeaderItem[] = [];
        for await (const msg of messages) {
          const addr = msg.envelope?.from?.[0];
          const hasAttachment = this.checkAttachment(msg.bodyStructure);
          results.push({
            uid: String(msg.uid),
            subject: msg.envelope?.subject ?? null,
            fromName: addr?.name ?? null,
            fromEmail: addr?.address ?? null,
            date: msg.envelope?.date ?? null,
            isRead: msg.flags?.has('\\Seen') ?? false,
            hasAttachment,
            snippet: null, // populated by sync service from body
          });
        }
        return results;
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  private checkAttachment(structure: any): boolean {
    if (!structure) return false;
    if (structure.disposition?.toLowerCase() === 'attachment') return true;
    if (Array.isArray(structure.childNodes)) {
      return structure.childNodes.some((c: any) => this.checkAttachment(c));
    }
    return false;
  }

  async fetchBody(
    account: MailAccount,
    accessToken: string,
    folder: string,
    uid: string,
  ): Promise<{ html: string; text: string }> {
    const client = this.buildClient(account, accessToken);
    await client.connect();
    try {
      const lock = await client.getMailboxLock(folder);
      try {
        const message = await client.fetchOne(
          uid,
          { bodyParts: ['TEXT'], source: true },
          { uid: true },
        );
        // source is the raw RFC822 message; extract text parts
        const raw = message?.source?.toString('utf8') ?? '';
        // Simple extraction: return raw as html fallback
        return { html: raw, text: raw };
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  async markRead(
    account: MailAccount,
    accessToken: string,
    folder: string,
    uid: string,
    isRead: boolean,
  ): Promise<void> {
    const client = this.buildClient(account, accessToken);
    await client.connect();
    try {
      const lock = await client.getMailboxLock(folder);
      try {
        if (isRead) {
          await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
        } else {
          await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
        }
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  async moveMessage(
    account: MailAccount,
    accessToken: string,
    folder: string,
    uid: string,
    targetFolder: string,
  ): Promise<void> {
    const client = this.buildClient(account, accessToken);
    await client.connect();
    try {
      const lock = await client.getMailboxLock(folder);
      try {
        await client.messageMove(uid, targetFolder, { uid: true });
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  async trashMessage(
    account: MailAccount,
    accessToken: string,
    folder: string,
    uid: string,
  ): Promise<void> {
    const isGoogle = account.provider === 'GOOGLE';
    const trashFolder = isGoogle ? '[Gmail]/Trash' : 'Deleted Items';
    await this.moveMessage(account, accessToken, folder, uid, trashFolder);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/modules/mail/mail-imap.service.ts
git commit -m "feat(mail): add MailImapService with IMAP XOAUTH2 support"
```

---

## Task 6: MailSyncService

**Files:**
- Create: `api/src/modules/mail/mail-sync.service.ts`
- Create: `api/src/modules/mail/dto/sync-result.dto.ts`

**Interfaces:**
- Consumes: `MailAccountService.getDecryptedAccessToken()`, `MailImapService.fetchNewHeaders()`, `PrismaService`
- Produces:
  - `syncAccount(account: MailAccount, folder?: string): Promise<SyncResult>`
  - `syncAllAccounts(profileId: bigint): Promise<SyncResult[]>`
- Types:
  ```typescript
  type SyncResult = { accountId: string; folder: string; newCount: number; error?: string }
  ```

- [ ] **Step 1: Create `dto/sync-result.dto.ts`**

```typescript
// api/src/modules/mail/dto/sync-result.dto.ts
export class SyncResultDto {
  accountId: string;
  folder: string;
  newCount: number;
  error?: string;
}
```

- [ ] **Step 2: Create `mail-sync.service.ts`**

```typescript
// api/src/modules/mail/mail-sync.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailAccountService } from './mail-account.service';
import { MailImapService } from './mail-imap.service';
import type { MailAccount } from '@prisma/client';
import type { SyncResultDto } from './dto/sync-result.dto';

const DEFAULT_FOLDERS: Record<string, string[]> = {
  GOOGLE: ['INBOX', '[Gmail]/Sent Mail', '[Gmail]/Drafts', '[Gmail]/Spam', '[Gmail]/Trash'],
  MICROSOFT: ['INBOX', 'Sent Items', 'Drafts', 'Junk Email', 'Deleted Items'],
};

@Injectable()
export class MailSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: MailAccountService,
    private readonly imapService: MailImapService,
  ) {}

  async syncAccount(account: MailAccount, folder?: string): Promise<SyncResultDto[]> {
    let accessToken: string;
    try {
      accessToken = await this.accountService.getDecryptedAccessToken(account);
    } catch {
      return [{ accountId: String(account.id), folder: folder ?? 'INBOX', newCount: 0, error: 'token_refresh_failed' }];
    }

    const foldersToSync = folder
      ? [folder]
      : DEFAULT_FOLDERS[account.provider] ?? ['INBOX'];

    const results: SyncResultDto[] = [];
    for (const f of foldersToSync) {
      try {
        const result = await this.syncFolder(account, accessToken, f);
        results.push(result);
      } catch (err: any) {
        results.push({ accountId: String(account.id), folder: f, newCount: 0, error: err?.message ?? 'sync_failed' });
      }
    }

    await this.prisma.mailAccount.update({
      where: { id: account.id },
      data: { lastSyncedAt: new Date() },
    });

    return results;
  }

  private async syncFolder(account: MailAccount, accessToken: string, folder: string): Promise<SyncResultDto> {
    // Find highest UID we already have for this folder
    const latest = await this.prisma.mailHeader.findFirst({
      where: { accountId: account.id, folder },
      orderBy: { uid: 'desc' },
      select: { uid: true },
    });
    const sinceUid = latest ? Number(latest.uid) + 1 : 1;

    const headers = await this.imapService.fetchNewHeaders(account, accessToken, folder, sinceUid);
    if (headers.length === 0) return { accountId: String(account.id), folder, newCount: 0 };

    // Upsert all headers
    await this.prisma.$transaction(
      headers.map(h =>
        this.prisma.mailHeader.upsert({
          where: { accountId_folder_uid: { accountId: account.id, folder, uid: h.uid } },
          create: {
            accountId: account.id,
            uid: h.uid,
            folder,
            subject: h.subject,
            fromName: h.fromName,
            fromEmail: h.fromEmail,
            date: h.date,
            isRead: h.isRead,
            hasAttachment: h.hasAttachment,
            snippet: h.snippet,
          },
          update: {
            isRead: h.isRead,
            subject: h.subject,
          },
        }),
      ),
    );

    return { accountId: String(account.id), folder, newCount: headers.length };
  }

  async syncAllAccounts(profileId: bigint): Promise<SyncResultDto[]> {
    const accounts = await this.prisma.mailAccount.findMany({ where: { profileId } });
    const all: SyncResultDto[] = [];
    for (const account of accounts) {
      const results = await this.syncAccount(account);
      all.push(...results);
    }
    return all;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/mail/mail-sync.service.ts api/src/modules/mail/dto/sync-result.dto.ts
git commit -m "feat(mail): add MailSyncService with header cache upsert pipeline"
```

---

## Task 7: MailSmtpService

**Files:**
- Create: `api/src/modules/mail/mail-smtp.service.ts`
- Create: `api/src/modules/mail/dto/send-message.dto.ts`

**Interfaces:**
- Consumes: `MailAccountService.getDecryptedAccessToken()`, nodemailer
- Produces:
  - `send(account, accessToken, dto): Promise<void>`
  - `reply(account, accessToken, dto): Promise<void>`
  - `forward(account, accessToken, dto): Promise<void>`

- [ ] **Step 1: Create `dto/send-message.dto.ts`**

```typescript
// api/src/modules/mail/dto/send-message.dto.ts
import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty()
  @IsEmail()
  to: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  cc?: string[];

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  body: string; // HTML content

  @ApiPropertyOptional({ description: 'UID of message being replied to' })
  @IsOptional()
  @IsString()
  inReplyToUid?: string;

  @ApiPropertyOptional({ description: 'UID of message being forwarded' })
  @IsOptional()
  @IsString()
  forwardUid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  folder?: string; // source folder for reply/forward
}
```

- [ ] **Step 2: Create `mail-smtp.service.ts`**

```typescript
// api/src/modules/mail/mail-smtp.service.ts
import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { MailAccount } from '@prisma/client';
import type { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MailSmtpService {
  private buildTransport(account: MailAccount, accessToken: string) {
    const isGoogle = account.provider === 'GOOGLE';
    return nodemailer.createTransport({
      host: isGoogle ? 'smtp.gmail.com' : 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        type: 'OAuth2',
        user: account.emailAddress,
        accessToken,
      },
    });
  }

  async send(account: MailAccount, accessToken: string, dto: SendMessageDto): Promise<void> {
    const transport = this.buildTransport(account, accessToken);
    await transport.sendMail({
      from: account.emailAddress,
      to: dto.to,
      cc: dto.cc?.join(', '),
      subject: dto.subject,
      html: dto.body,
    });
  }

  async reply(account: MailAccount, accessToken: string, dto: SendMessageDto): Promise<void> {
    const transport = this.buildTransport(account, accessToken);
    await transport.sendMail({
      from: account.emailAddress,
      to: dto.to,
      cc: dto.cc?.join(', '),
      subject: dto.subject.startsWith('Re:') ? dto.subject : `Re: ${dto.subject}`,
      html: dto.body,
    });
  }

  async forward(account: MailAccount, accessToken: string, dto: SendMessageDto): Promise<void> {
    const transport = this.buildTransport(account, accessToken);
    await transport.sendMail({
      from: account.emailAddress,
      to: dto.to,
      subject: dto.subject.startsWith('Fwd:') ? dto.subject : `Fwd: ${dto.subject}`,
      html: dto.body,
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/mail/mail-smtp.service.ts api/src/modules/mail/dto/send-message.dto.ts
git commit -m "feat(mail): add MailSmtpService for send/reply/forward via XOAUTH2"
```

---

## Task 8: MailController + MailModule + App Registration

**Files:**
- Create: `api/src/modules/mail/mail.controller.ts`
- Create: `api/src/modules/mail/mail.module.ts`
- Modify: `api/src/app.module.ts`

**Interfaces:**
- Consumes: All mail services
- Produces: REST API at `/mail/*` (protected by `JwtAuthGuard`)

- [ ] **Step 1: Create `mail.controller.ts`**

```typescript
// api/src/modules/mail/mail.controller.ts
import {
  Controller, Get, Post, Delete, Patch, Param, Body,
  Query, Req, Res, UseGuards, ParseIntPipe
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { MailAccountService } from './mail-account.service';
import { MailSyncService } from './mail-sync.service';
import { MailImapService } from './mail-imap.service';
import { MailSmtpService } from './mail-smtp.service';
import { SendMessageDto } from './dto/send-message.dto';
import type { Response } from 'express';

@Controller('mail')
@UseGuards(JwtAuthGuard)
@ApiTags('Mail')
@ApiBearerAuth('bearer')
export class MailController {
  constructor(
    private readonly accountService: MailAccountService,
    private readonly syncService: MailSyncService,
    private readonly imapService: MailImapService,
    private readonly smtpService: MailSmtpService,
  ) {}

  // ── OAuth ────────────────────────────────────────────────────────────

  @Get('auth/google/url')
  getGoogleUrl() {
    return { url: this.accountService.getGoogleAuthUrl() };
  }

  @Get('auth/microsoft/url')
  getMicrosoftUrl() {
    return { url: this.accountService.getMicrosoftAuthUrl() };
  }

  @Get('auth/google/callback')
  async googleCallback(@Query('code') code: string, @Req() req: any, @Res() res: Response) {
    await this.accountService.handleGoogleCallback(code, BigInt(req.user.id));
    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:5173';
    res.redirect(`${appUrl}/mail`);
  }

  @Get('auth/microsoft/callback')
  async microsoftCallback(@Query('code') code: string, @Req() req: any, @Res() res: Response) {
    await this.accountService.handleMicrosoftCallback(code, BigInt(req.user.id));
    const appUrl = process.env.APP_BASE_URL ?? 'http://localhost:5173';
    res.redirect(`${appUrl}/mail`);
  }

  // ── Accounts ─────────────────────────────────────────────────────────

  @Get('accounts')
  listAccounts(@Req() req: any) {
    return this.accountService.listAccounts(BigInt(req.user.id));
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id') id: string, @Req() req: any) {
    return this.accountService.deleteAccount(BigInt(id), BigInt(req.user.id));
  }

  // ── Sync ──────────────────────────────────────────────────────────────

  @Post('sync')
  syncAll(@Req() req: any) {
    return this.syncService.syncAllAccounts(BigInt(req.user.id));
  }

  @Post(':accountId/sync')
  async syncOne(@Param('accountId') accountId: string, @Query('folder') folder: string | undefined, @Req() req: any) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    return this.syncService.syncAccount(account, folder);
  }

  // ── Headers ───────────────────────────────────────────────────────────

  @Get(':accountId/headers')
  @ApiQuery({ name: 'folder', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listHeaders(
    @Param('accountId') accountId: string,
    @Query('folder') folder: string = 'INBOX',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Req() req: any,
  ) {
    await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const skip = (Number(page) - 1) * Number(limit);
    return {
      data: await (req.app as any).get('PrismaService')?.mailHeader.findMany?.({
        where: { accountId: BigInt(accountId), folder },
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }) ?? [],
    };
  }

  // ── Folders ───────────────────────────────────────────────────────────

  @Get(':accountId/folders')
  async listFolders(@Param('accountId') accountId: string, @Req() req: any) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    return this.imapService.listFolders(account, accessToken);
  }

  // ── Message body ─────────────────────────────────────────────────────

  @Get(':accountId/message/:uid')
  async getMessage(
    @Param('accountId') accountId: string,
    @Param('uid') uid: string,
    @Query('folder') folder: string = 'INBOX',
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    return this.imapService.fetchBody(account, accessToken, folder, uid);
  }

  // ── Message actions ───────────────────────────────────────────────────

  @Patch(':accountId/message/:uid/read')
  async markRead(
    @Param('accountId') accountId: string,
    @Param('uid') uid: string,
    @Query('folder') folder: string = 'INBOX',
    @Query('isRead') isRead: string = 'true',
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    await this.imapService.markRead(account, accessToken, folder, uid, isRead !== 'false');
    await (req.prisma ?? req.app?.get?.('PrismaService'))?.mailHeader?.update?.({
      where: { accountId_folder_uid: { accountId: account.id, folder, uid } },
      data: { isRead: isRead !== 'false' },
    }).catch(() => null);
    return { ok: true };
  }

  @Delete(':accountId/message/:uid')
  async trashMessage(
    @Param('accountId') accountId: string,
    @Param('uid') uid: string,
    @Query('folder') folder: string = 'INBOX',
    @Req() req: any,
  ) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    await this.imapService.trashMessage(account, accessToken, folder, uid);
    return { ok: true };
  }

  // ── Send ──────────────────────────────────────────────────────────────

  @Post(':accountId/send')
  async sendMessage(@Param('accountId') accountId: string, @Body() dto: SendMessageDto, @Req() req: any) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    await this.smtpService.send(account, accessToken, dto);
    return { ok: true };
  }

  @Post(':accountId/reply')
  async replyMessage(@Param('accountId') accountId: string, @Body() dto: SendMessageDto, @Req() req: any) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    await this.smtpService.reply(account, accessToken, dto);
    return { ok: true };
  }

  @Post(':accountId/forward')
  async forwardMessage(@Param('accountId') accountId: string, @Body() dto: SendMessageDto, @Req() req: any) {
    const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
    const accessToken = await this.accountService.getDecryptedAccessToken(account);
    await this.smtpService.forward(account, accessToken, dto);
    return { ok: true };
  }
}
```

- [ ] **Step 2: Create `mail.module.ts`**

```typescript
// api/src/modules/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailAccountService } from './mail-account.service';
import { MailImapService } from './mail-imap.service';
import { MailSyncService } from './mail-sync.service';
import { MailSmtpService } from './mail-smtp.service';
import { MailCryptoService } from './mail-crypto.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MailController],
  providers: [
    MailAccountService,
    MailImapService,
    MailSyncService,
    MailSmtpService,
    MailCryptoService,
  ],
})
export class MailModule {}
```

- [ ] **Step 3: Register in `app.module.ts`**

Add to `api/src/app.module.ts`:

```typescript
// Add import at top:
import { MailModule } from './modules/mail/mail.module';

// Add to imports array:
MailModule,
```

- [ ] **Step 4: Fix `listHeaders` to use injected PrismaService**

The `listHeaders` endpoint above has a hack. Replace it with proper injection. In `mail.controller.ts`, inject `PrismaService`:

```typescript
import { PrismaService } from '../../common/prisma/prisma.service';

// Add to constructor:
constructor(
  private readonly accountService: MailAccountService,
  private readonly syncService: MailSyncService,
  private readonly imapService: MailImapService,
  private readonly smtpService: MailSmtpService,
  private readonly prisma: PrismaService,
) {}

// Replace listHeaders method:
@Get(':accountId/headers')
@ApiQuery({ name: 'folder', required: false })
@ApiQuery({ name: 'page', required: false })
@ApiQuery({ name: 'limit', required: false })
async listHeaders(
  @Param('accountId') accountId: string,
  @Query('folder') folder: string = 'INBOX',
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '50',
  @Req() req: any,
) {
  await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
  const skip = (Number(page) - 1) * Number(limit);
  const data = await this.prisma.mailHeader.findMany({
    where: { accountId: BigInt(accountId), folder },
    orderBy: { date: 'desc' },
    skip,
    take: Number(limit),
  });
  return { data };
}

// Replace markRead to use prisma directly:
@Patch(':accountId/message/:uid/read')
async markRead(/* ... same params ... */) {
  const account = await this.accountService.findAccountForUser(BigInt(accountId), BigInt(req.user.id));
  const accessToken = await this.accountService.getDecryptedAccessToken(account);
  await this.imapService.markRead(account, accessToken, folder, uid, isRead !== 'false');
  await this.prisma.mailHeader.updateMany({
    where: { accountId: account.id, folder, uid },
    data: { isRead: isRead !== 'false' },
  }).catch(() => null);
  return { ok: true };
}
```

Also add `PrismaModule` is already imported via `PrismaModule` in `mail.module.ts` — add `PrismaService` to providers if not already exported from `PrismaModule`. Check `common/prisma/prisma.module.ts` — if it exports `PrismaService`, no change needed; it almost certainly does.

- [ ] **Step 5: Build and start the API**

```bash
cd api
npm run build
npm run start:dev
```

Expected: No TypeScript errors, API starts on port 3000.

- [ ] **Step 6: Verify endpoints exist**

```bash
curl http://localhost:3000/api/mail/auth/google/url
```

Expected: `{"url":"https://accounts.google.com/..."}` (or wrapped in response envelope)

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/mail/ api/src/app.module.ts
git commit -m "feat(mail): add MailController, MailModule, register in AppModule"
```

---

## Task 9: Shared LocalDB System

**Files:**
- Create: `apps/shared/src/lib/local-db/LocalDB.ts`
- Create: `apps/shared/src/lib/local-db/useLocalDB.ts`
- Create: `apps/shared/src/lib/local-db/index.ts`
- Modify: `apps/shared/src/index.ts`

**Interfaces:**
- Produces:
  - `LocalDB.register(config: { store: string; keyPath: string }): void`
  - `LocalDB.get<T>(store, key): Promise<T | undefined>`
  - `LocalDB.put<T>(store, value): Promise<void>`
  - `LocalDB.delete(store, key): Promise<void>`
  - `LocalDB.clear(store): Promise<void>`
  - `useLocalDB(): typeof LocalDB` (React hook)

- [ ] **Step 1: Create `LocalDB.ts`**

```typescript
// apps/shared/src/lib/local-db/LocalDB.ts
interface StoreConfig {
  store: string;
  keyPath: string;
}

class LocalDBManager {
  private db: IDBDatabase | null = null;
  private stores = new Map<string, StoreConfig>();
  private dbVersion = 1;
  private readonly DB_NAME = 'portal-cache';
  private openPromise: Promise<IDBDatabase> | null = null;

  register(config: StoreConfig): void {
    if (this.stores.has(config.store)) return;
    this.stores.set(config.store, config);
    this.dbVersion += 1;
    this.db = null; // force reconnect with new version
    this.openPromise = null;
  }

  private open(): Promise<IDBDatabase> {
    if (this.openPromise) return this.openPromise;
    this.openPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.dbVersion);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        for (const cfg of this.stores.values()) {
          if (!db.objectStoreNames.contains(cfg.store)) {
            db.createObjectStore(cfg.store, { keyPath: cfg.keyPath });
          }
        }
      };
      req.onsuccess = () => { this.db = req.result; resolve(this.db!); };
      req.onerror = () => { this.openPromise = null; reject(req.error); };
    });
    return this.openPromise;
  }

  async get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readonly').objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(store: string, value: T): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(store: string, key: IDBValidKey): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear(store: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const LocalDB = new LocalDBManager();
```

- [ ] **Step 2: Create `useLocalDB.ts`**

```typescript
// apps/shared/src/lib/local-db/useLocalDB.ts
import { LocalDB } from './LocalDB';

export function useLocalDB() {
  return LocalDB;
}
```

- [ ] **Step 3: Create `index.ts`**

```typescript
// apps/shared/src/lib/local-db/index.ts
export { LocalDB } from './LocalDB';
export { useLocalDB } from './useLocalDB';
```

- [ ] **Step 4: Export from `apps/shared/src/index.ts`**

Open `apps/shared/src/index.ts` and add:

```typescript
export { LocalDB, useLocalDB } from './lib/local-db';
```

- [ ] **Step 5: Create `lib` directory scaffold**

```bash
mkdir -p apps/shared/src/lib/local-db
```

- [ ] **Step 6: Commit**

```bash
git add apps/shared/src/lib/ apps/shared/src/index.ts
git commit -m "feat(shared): add LocalDB IndexedDB cache system with plugin registration"
```

---

## Task 10: Frontend — Install Dependencies + Mail API Client

**Files:**
- Modify: `apps/pwa/package.json` (via npm install)
- Create: `apps/pwa/src/pages/mail/api/mail-api.ts`

**Interfaces:**
- Produces: `mailApi` object with methods matching backend endpoints

- [ ] **Step 1: Install dompurify**

```bash
cd apps/pwa
npm install dompurify
npm install --save-dev @types/dompurify
```

- [ ] **Step 2: Create `apps/pwa/src/pages/mail/api/mail-api.ts`**

First find how the shared API client works. Open `apps/shared/src/api/index.ts` and note the base URL and auth header pattern. Then create:

```typescript
// apps/pwa/src/pages/mail/api/mail-api.ts

const BASE = '/api/mail';

function headers(): HeadersInit {
  const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token') ?? '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers(), ...options?.headers } });
  if (!res.ok) throw new Error(`Mail API error: ${res.status}`);
  return res.json();
}

export const mailApi = {
  getGoogleAuthUrl: () => api<{ url: string }>('/auth/google/url'),
  getMicrosoftAuthUrl: () => api<{ url: string }>('/auth/microsoft/url'),

  listAccounts: () => api<MailAccount[]>('/accounts'),
  deleteAccount: (id: string) => api<void>(`/accounts/${id}`, { method: 'DELETE' }),

  syncAll: () => api<SyncResult[]>('/sync', { method: 'POST' }),
  syncAccount: (accountId: string, folder?: string) =>
    api<SyncResult[]>(`/${accountId}/sync?${folder ? `folder=${encodeURIComponent(folder)}` : ''}`, { method: 'POST' }),

  listFolders: (accountId: string) => api<FolderItem[]>(`/${accountId}/folders`),
  listHeaders: (accountId: string, folder = 'INBOX', page = 1, limit = 50) =>
    api<{ data: MailHeader[] }>(`/${accountId}/headers?folder=${encodeURIComponent(folder)}&page=${page}&limit=${limit}`),
  getMessage: (accountId: string, uid: string, folder = 'INBOX') =>
    api<{ html: string; text: string }>(`/${accountId}/message/${uid}?folder=${encodeURIComponent(folder)}`),

  markRead: (accountId: string, uid: string, folder: string, isRead: boolean) =>
    api<{ ok: boolean }>(`/${accountId}/message/${uid}/read?folder=${encodeURIComponent(folder)}&isRead=${isRead}`, { method: 'PATCH' }),
  trashMessage: (accountId: string, uid: string, folder: string) =>
    api<{ ok: boolean }>(`/${accountId}/message/${uid}?folder=${encodeURIComponent(folder)}`, { method: 'DELETE' }),

  sendMessage: (accountId: string, dto: SendMessageDto) =>
    api<{ ok: boolean }>(`/${accountId}/send`, { method: 'POST', body: JSON.stringify(dto) }),
  replyMessage: (accountId: string, dto: SendMessageDto) =>
    api<{ ok: boolean }>(`/${accountId}/reply`, { method: 'POST', body: JSON.stringify(dto) }),
  forwardMessage: (accountId: string, dto: SendMessageDto) =>
    api<{ ok: boolean }>(`/${accountId}/forward`, { method: 'POST', body: JSON.stringify(dto) }),
};

// Types (frontend mirrors)
export type MailAccount = {
  id: string; provider: 'GOOGLE' | 'MICROSOFT'; emailAddress: string;
  displayName: string | null; isShared: boolean; label: string | null;
  lastSyncedAt: string | null; createdAt: string;
};
export type MailHeader = {
  id: string; accountId: string; uid: string; folder: string;
  subject: string | null; fromName: string | null; fromEmail: string | null;
  date: string | null; isRead: boolean; hasAttachment: boolean; snippet: string | null;
};
export type FolderItem = { name: string; path: string; delimiter: string };
export type SyncResult = { accountId: string; folder: string; newCount: number; error?: string };
export type SendMessageDto = {
  to: string; cc?: string[]; subject: string; body: string;
  inReplyToUid?: string; forwardUid?: string; folder?: string;
};
```

**Note:** Check how the existing shared API client handles auth tokens (look at `apps/shared/src/api/index.ts`) and adapt `headers()` to match the same token retrieval pattern used elsewhere in the app.

- [ ] **Step 3: Commit**

```bash
git add apps/pwa/ apps/shared/
git commit -m "feat(mail): add frontend mail API client and install dompurify"
```

---

## Task 11: Frontend Hooks

**Files:**
- Create: `apps/pwa/src/pages/mail/hooks/useMailAccounts.ts`
- Create: `apps/pwa/src/pages/mail/hooks/useMailSync.ts`
- Create: `apps/pwa/src/pages/mail/hooks/useMailHeaders.ts`
- Create: `apps/pwa/src/pages/mail/hooks/useMailBody.ts`

**Interfaces:**
- `useMailAccounts()` → `{ accounts, loading, connectGoogle, connectMicrosoft, disconnect }`
- `useMailSync(accounts)` → `{ sync, syncing, lastSyncedAt }`
- `useMailHeaders(accountId, folder)` → `{ headers, loading, loadMore, hasMore }`
- `useMailBody(accountId, uid, folder)` → `{ html, loading }`

- [ ] **Step 1: Create `useMailAccounts.ts`**

```typescript
// apps/pwa/src/pages/mail/hooks/useMailAccounts.ts
import { useState, useEffect, useCallback } from 'react';
import { mailApi, type MailAccount } from '../api/mail-api';

export function useMailAccounts() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setAccounts(await mailApi.listAccounts()); }
    catch { /* silently fail — user may have no accounts yet */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const connectGoogle = useCallback(async () => {
    const { url } = await mailApi.getGoogleAuthUrl();
    window.location.href = url;
  }, []);

  const connectMicrosoft = useCallback(async () => {
    const { url } = await mailApi.getMicrosoftAuthUrl();
    window.location.href = url;
  }, []);

  const disconnect = useCallback(async (id: string) => {
    await mailApi.deleteAccount(id);
    await load();
  }, [load]);

  return { accounts, loading, connectGoogle, connectMicrosoft, disconnect, reload: load };
}
```

- [ ] **Step 2: Create `useMailSync.ts`**

```typescript
// apps/pwa/src/pages/mail/hooks/useMailSync.ts
import { useState, useCallback } from 'react';
import { mailApi, type MailAccount } from '../api/mail-api';

export function useMailSync(accounts: MailAccount[], onComplete?: () => void) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    if (syncing || accounts.length === 0) return;
    setSyncing(true);
    try {
      await mailApi.syncAll();
      setLastSyncedAt(new Date());
      onComplete?.();
    } finally {
      setSyncing(false);
    }
  }, [syncing, accounts, onComplete]);

  return { sync, syncing, lastSyncedAt };
}
```

- [ ] **Step 3: Create `useMailHeaders.ts`**

```typescript
// apps/pwa/src/pages/mail/hooks/useMailHeaders.ts
import { useState, useEffect, useCallback } from 'react';
import { mailApi, type MailHeader } from '../api/mail-api';

const PAGE_SIZE = 50;

export function useMailHeaders(accountId: string | null, folder: string) {
  const [headers, setHeaders] = useState<MailHeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (reset = false) => {
    if (!accountId) return;
    setLoading(true);
    const currentPage = reset ? 1 : page;
    try {
      const { data } = await mailApi.listHeaders(accountId, folder, currentPage, PAGE_SIZE);
      if (reset) setHeaders(data);
      else setHeaders(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      if (!reset) setPage(p => p + 1);
    } finally {
      setLoading(false);
    }
  }, [accountId, folder, page]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    void load(true);
  }, [accountId, folder]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => { void load(); }, [load]);
  const refresh = useCallback(() => { setPage(1); void load(true); }, [load]);

  return { headers, loading, loadMore, hasMore, refresh };
}
```

- [ ] **Step 4: Create `useMailBody.ts`**

```typescript
// apps/pwa/src/pages/mail/hooks/useMailBody.ts
import { useState, useEffect } from 'react';
import { useLocalDB } from '@stanforte/shared';
import { mailApi } from '../api/mail-api';

type CachedBody = { uid: string; html: string; cachedAt: number };

export function useMailBody(accountId: string | null, uid: string | null, folder: string) {
  const db = useLocalDB();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId || !uid) { setHtml(null); return; }
    const cacheKey = `${accountId}:${folder}:${uid}`;
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      try {
        // 1. Check IndexedDB cache first
        const cached = await db.get<CachedBody>('mailBodies', cacheKey);
        if (cached && !cancelled) { setHtml(cached.html); setLoading(false); return; }

        // 2. Fetch live from API
        const { html: rawHtml } = await mailApi.getMessage(accountId!, uid!, folder);
        if (cancelled) return;
        setHtml(rawHtml);

        // 3. Cache in IndexedDB
        await db.put<CachedBody>('mailBodies', { uid: cacheKey, html: rawHtml, cachedAt: Date.now() });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetch();
    return () => { cancelled = true; };
  }, [accountId, uid, folder, db]);

  return { html, loading };
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/pwa/src/pages/mail/hooks/
git commit -m "feat(mail): add mail hooks for accounts, sync, headers, and body"
```

---

## Task 12: Frontend Components

**Files:**
- Create: `apps/pwa/src/pages/mail/components/AccountConnectPrompt.tsx`
- Create: `apps/pwa/src/pages/mail/components/SyncButton.tsx`
- Create: `apps/pwa/src/pages/mail/components/AccountSidebar.tsx`
- Create: `apps/pwa/src/pages/mail/components/MessageList.tsx`
- Create: `apps/pwa/src/pages/mail/components/MessageDetail.tsx`
- Create: `apps/pwa/src/pages/mail/components/ComposeModal.tsx`

**Interfaces:**
- `AccountConnectPrompt` — `{ onConnectGoogle, onConnectMicrosoft }`
- `SyncButton` — `{ onSync, syncing, lastSyncedAt }`
- `AccountSidebar` — `{ accounts, selectedAccountId, selectedFolder, onSelectAccount, onSelectFolder, onDisconnect }`
- `MessageList` — `{ accountId, folder, selectedUid, onSelect }`
- `MessageDetail` — `{ accountId, uid, folder, onReply, onForward, onClose }`
- `ComposeModal` — `{ accountId, mode, originalMessage, onClose, onSent }`

- [ ] **Step 1: Create `AccountConnectPrompt.tsx`**

```tsx
// apps/pwa/src/pages/mail/components/AccountConnectPrompt.tsx
type Props = { onConnectGoogle: () => void; onConnectMicrosoft: () => void };

export function AccountConnectPrompt({ onConnectGoogle, onConnectMicrosoft }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 16 }}>
      <h2>Connect your work email</h2>
      <p style={{ color: '#6b7280', textAlign: 'center', maxWidth: 360 }}>
        Connect your Google Workspace or Microsoft 365 account to access your inbox directly from the portal.
      </p>
      <button onClick={onConnectGoogle} style={{ padding: '10px 24px', background: '#4285F4', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
        Connect Google Workspace
      </button>
      <button onClick={onConnectMicrosoft} style={{ padding: '10px 24px', background: '#00a4ef', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
        Connect Microsoft 365
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `SyncButton.tsx`**

```tsx
// apps/pwa/src/pages/mail/components/SyncButton.tsx
type Props = { onSync: () => void; syncing: boolean; lastSyncedAt: Date | null };

export function SyncButton({ onSync, syncing, lastSyncedAt }: Props) {
  return (
    <button
      onClick={onSync}
      disabled={syncing}
      title={lastSyncedAt ? `Last synced: ${lastSyncedAt.toLocaleTimeString()}` : 'Click to sync'}
      style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', cursor: syncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
    >
      <span style={{ display: 'inline-block', animation: syncing ? 'spin 1s linear infinite' : 'none' }}>↻</span>
      {syncing ? 'Syncing…' : 'Refresh'}
    </button>
  );
}
```

- [ ] **Step 3: Create `AccountSidebar.tsx`**

```tsx
// apps/pwa/src/pages/mail/components/AccountSidebar.tsx
import type { MailAccount } from '../api/mail-api';

const GOOGLE_FOLDERS = ['INBOX', '[Gmail]/Sent Mail', '[Gmail]/Drafts', '[Gmail]/Spam', '[Gmail]/Trash'];
const MICROSOFT_FOLDERS = ['INBOX', 'Sent Items', 'Drafts', 'Junk Email', 'Deleted Items'];
const FOLDER_LABELS: Record<string, string> = {
  'INBOX': 'Inbox', '[Gmail]/Sent Mail': 'Sent', '[Gmail]/Drafts': 'Drafts',
  '[Gmail]/Spam': 'Spam', '[Gmail]/Trash': 'Trash',
  'Sent Items': 'Sent', 'Junk Email': 'Junk', 'Deleted Items': 'Trash',
};

type Props = {
  accounts: MailAccount[];
  selectedAccountId: string | 'all';
  selectedFolder: string;
  onSelectAccount: (id: string | 'all') => void;
  onSelectFolder: (folder: string) => void;
  onDisconnect: (id: string) => void;
};

export function AccountSidebar({ accounts, selectedAccountId, selectedFolder, onSelectAccount, onSelectFolder, onDisconnect }: Props) {
  const folders = selectedAccountId === 'all'
    ? ['INBOX']
    : accounts.find(a => a.id === selectedAccountId)?.provider === 'GOOGLE'
      ? GOOGLE_FOLDERS
      : MICROSOFT_FOLDERS;

  return (
    <aside style={{ width: 220, borderRight: '1px solid #e5e7eb', height: '100%', overflowY: 'auto', padding: '12px 0' }}>
      <div style={{ padding: '0 12px 8px', fontWeight: 700, fontSize: 13, color: '#6b7280', textTransform: 'uppercase' }}>Accounts</div>
      <div
        onClick={() => onSelectAccount('all')}
        style={{ padding: '8px 16px', cursor: 'pointer', background: selectedAccountId === 'all' ? '#f0f4ff' : 'transparent', fontWeight: 600 }}
      >
        All Accounts
      </div>
      {accounts.map(a => (
        <div key={a.id}
          onClick={() => onSelectAccount(a.id)}
          style={{ padding: '8px 16px', cursor: 'pointer', background: selectedAccountId === a.id ? '#f0f4ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.label ?? a.emailAddress}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDisconnect(a.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 11, flexShrink: 0 }}
            title="Disconnect"
          >✕</button>
        </div>
      ))}

      <div style={{ padding: '16px 12px 8px', fontWeight: 700, fontSize: 13, color: '#6b7280', textTransform: 'uppercase', borderTop: '1px solid #e5e7eb', marginTop: 8 }}>Folders</div>
      {folders.map(f => (
        <div
          key={f}
          onClick={() => onSelectFolder(f)}
          style={{ padding: '6px 16px', cursor: 'pointer', background: selectedFolder === f ? '#f0f4ff' : 'transparent', fontSize: 14 }}
        >
          {FOLDER_LABELS[f] ?? f}
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 4: Create `MessageList.tsx`**

```tsx
// apps/pwa/src/pages/mail/components/MessageList.tsx
import { useMailHeaders } from '../hooks/useMailHeaders';
import type { MailHeader } from '../api/mail-api';

type Props = {
  accountId: string | null;
  folder: string;
  selectedUid: string | null;
  onSelect: (header: MailHeader) => void;
  onRefresh?: () => void;
};

export function MessageList({ accountId, folder, selectedUid, onSelect, onRefresh }: Props) {
  const { headers, loading, loadMore, hasMore, refresh } = useMailHeaders(accountId, folder);

  function handleRefresh() { refresh(); onRefresh?.(); }

  return (
    <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
      {loading && headers.length === 0 && (
        <div style={{ padding: 24, color: '#6b7280' }}>Loading…</div>
      )}
      {headers.map(h => (
        <div
          key={h.uid}
          onClick={() => onSelect(h)}
          style={{
            padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
            background: selectedUid === h.uid ? '#f0f4ff' : h.isRead ? '#fff' : '#fafafa',
            fontWeight: h.isRead ? 400 : 600,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              {h.fromName ?? h.fromEmail ?? '(unknown)'}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
              {h.date ? new Date(h.date).toLocaleDateString() : ''}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {h.subject ?? '(no subject)'}
          </div>
          {h.snippet && (
            <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {h.snippet}
            </div>
          )}
        </div>
      ))}
      {hasMore && (
        <button onClick={loadMore} style={{ margin: 12, padding: '8px', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `MessageDetail.tsx`**

```tsx
// apps/pwa/src/pages/mail/components/MessageDetail.tsx
import { useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useMailBody } from '../hooks/useMailBody';
import type { MailHeader } from '../api/mail-api';

type Props = {
  accountId: string;
  header: MailHeader;
  onReply: () => void;
  onForward: () => void;
};

export function MessageDetail({ accountId, header, onReply, onForward }: Props) {
  const { html, loading } = useMailBody(accountId, header.uid, header.folder);
  const safeHtml = html ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) : '';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{header.subject ?? '(no subject)'}</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          From: {header.fromName ? `${header.fromName} <${header.fromEmail}>` : header.fromEmail}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Date: {header.date ? new Date(header.date).toLocaleString() : ''}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={onReply} style={{ padding: '6px 16px', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', background: '#fff', fontWeight: 600 }}>
          Reply
        </button>
        <button onClick={onForward} style={{ padding: '6px 16px', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>
          Forward
        </button>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
        {loading ? (
          <div style={{ color: '#6b7280' }}>Loading message…</div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: safeHtml }} style={{ fontSize: 14, lineHeight: 1.7 }} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `ComposeModal.tsx`**

```tsx
// apps/pwa/src/pages/mail/components/ComposeModal.tsx
import { useState } from 'react';
import { mailApi, type MailHeader, type SendMessageDto } from '../api/mail-api';

type Mode = 'compose' | 'reply' | 'forward';

type Props = {
  accountId: string;
  mode: Mode;
  originalHeader?: MailHeader;
  onClose: () => void;
  onSent: () => void;
};

export function ComposeModal({ accountId, mode, originalHeader, onClose, onSent }: Props) {
  const [to, setTo] = useState(mode === 'reply' ? (originalHeader?.fromEmail ?? '') : '');
  const [subject, setSubject] = useState(() => {
    if (!originalHeader) return '';
    if (mode === 'reply') return `Re: ${originalHeader.subject ?? ''}`;
    if (mode === 'forward') return `Fwd: ${originalHeader.subject ?? ''}`;
    return '';
  });
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!to || !subject) return;
    setSending(true);
    const dto: SendMessageDto = { to, subject, body };
    try {
      if (mode === 'reply') await mailApi.replyMessage(accountId, dto);
      else if (mode === 'forward') await mailApi.forwardMessage(accountId, dto);
      else await mailApi.sendMessage(accountId, dto);
      onSent();
      onClose();
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', zIndex: 1000, padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          {mode === 'compose' ? 'New Message' : mode === 'reply' ? 'Reply' : 'Forward'}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="To" style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', fontSize: 14 }} />
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', fontSize: 14 }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message body…" rows={10} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', fontSize: 14, resize: 'vertical' }} />
        </div>
        <div style={{ padding: '8px 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Cancel</button>
          <button onClick={handleSend} disabled={sending || !to || !subject} style={{ padding: '8px 20px', background: '#034785', color: '#fff', border: 'none', borderRadius: 6, cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/pwa/src/pages/mail/components/
git commit -m "feat(mail): add mail UI components (sidebar, list, detail, compose)"
```

---

## Task 13: MailLayout + Route Registration

**Files:**
- Create: `apps/pwa/src/pages/mail/MailLayout.tsx`
- Create: `apps/pwa/src/pages/mail/index.tsx`
- Modify: PWA router file (wherever `/` routes are defined — find it with `grep -r 'createBrowserRouter\|<Route' apps/pwa/src --include="*.tsx" -l`)

**Interfaces:**
- `index.tsx` registers LocalDB stores then renders `MailLayout`
- `MailLayout` composes all components into the 3-pane shell

- [ ] **Step 1: Find the router file**

```bash
grep -rl 'createBrowserRouter\|BrowserRouter\|<Route path' apps/pwa/src --include="*.tsx" | head -5
```

Note the file path — it is your router file.

- [ ] **Step 2: Create `MailLayout.tsx`**

```tsx
// apps/pwa/src/pages/mail/MailLayout.tsx
import { useState, useCallback } from 'react';
import { AccountSidebar } from './components/AccountSidebar';
import { MessageList } from './components/MessageList';
import { MessageDetail } from './components/MessageDetail';
import { ComposeModal } from './components/ComposeModal';
import { AccountConnectPrompt } from './components/AccountConnectPrompt';
import { SyncButton } from './components/SyncButton';
import { useMailAccounts } from './hooks/useMailAccounts';
import { useMailSync } from './hooks/useMailSync';
import type { MailHeader } from './api/mail-api';

export function MailLayout() {
  const { accounts, loading, connectGoogle, connectMicrosoft, disconnect } = useMailAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [selectedFolder, setSelectedFolder] = useState('INBOX');
  const [selectedHeader, setSelectedHeader] = useState<MailHeader | null>(null);
  const [compose, setCompose] = useState<{ mode: 'compose' | 'reply' | 'forward'; header?: MailHeader } | null>(null);

  const { sync, syncing, lastSyncedAt } = useMailSync(accounts);

  const activeAccountId = selectedAccountId === 'all'
    ? (accounts[0]?.id ?? null)
    : selectedAccountId;

  if (!loading && accounts.length === 0) {
    return <AccountConnectPrompt onConnectGoogle={connectGoogle} onConnectMicrosoft={connectMicrosoft} />;
  }

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <AccountSidebar
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        selectedFolder={selectedFolder}
        onSelectAccount={id => { setSelectedAccountId(id); setSelectedHeader(null); }}
        onSelectFolder={f => { setSelectedFolder(f); setSelectedHeader(null); }}
        onDisconnect={disconnect}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setCompose({ mode: 'compose' })}
            style={{ padding: '6px 18px', background: '#034785', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            + Compose
          </button>
          <SyncButton onSync={sync} syncing={syncing} lastSyncedAt={lastSyncedAt} />
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <MessageList
            accountId={activeAccountId}
            folder={selectedFolder}
            selectedUid={selectedHeader?.uid ?? null}
            onSelect={setSelectedHeader}
          />

          {selectedHeader && activeAccountId ? (
            <MessageDetail
              accountId={activeAccountId}
              header={selectedHeader}
              onReply={() => setCompose({ mode: 'reply', header: selectedHeader })}
              onForward={() => setCompose({ mode: 'forward', header: selectedHeader })}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              Select a message to read
            </div>
          )}
        </div>
      </div>

      {compose && activeAccountId && (
        <ComposeModal
          accountId={activeAccountId}
          mode={compose.mode}
          originalHeader={compose.header}
          onClose={() => setCompose(null)}
          onSent={() => { /* headers will refresh on next sync */ }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `apps/pwa/src/pages/mail/index.tsx`**

```tsx
// apps/pwa/src/pages/mail/index.tsx
import { useEffect } from 'react';
import { LocalDB } from '@stanforte/shared';
import { MailLayout } from './MailLayout';

// Register this feature's IndexedDB stores once before render
LocalDB.register({ store: 'mailBodies', keyPath: 'uid' });

export function MailPage() {
  return <MailLayout />;
}
```

- [ ] **Step 4: Add `/mail` route to the router file**

In the router file found in Step 1, add:

```tsx
import { MailPage } from './pages/mail';

// Inside your route definitions, add:
{ path: '/mail', element: <MailPage /> }
// Or if using JSX router:
<Route path="/mail" element={<MailPage />} />
```

- [ ] **Step 5: Add Mail link to sidebar nav**

Find the main navigation sidebar component (likely in `apps/pwa/src/shared/` or similar). Add a Mail nav item pointing to `/mail`:

```tsx
{ label: 'Mail', path: '/mail', icon: '✉' }
```

Adapt to whatever pattern the existing nav items use.

- [ ] **Step 6: Start the PWA and verify**

```bash
cd apps/pwa
npm run dev
```

Open `http://localhost:5173/mail` in the browser.

Expected:
- If no accounts connected: "Connect your work email" prompt with two buttons
- Clicking "Connect Google Workspace" redirects to Google's OAuth consent screen
- After OAuth completes: redirect back to `/mail` and inbox loads

- [ ] **Step 7: Commit**

```bash
git add apps/pwa/src/pages/mail/
git commit -m "feat(mail): add MailLayout, route registration, and nav link"
```

---

## Self-Review Checklist

Before marking this plan complete, verify:

- [ ] All spec sections have a corresponding task:
  - OAuth connect (Google + Microsoft) → Tasks 4, 8
  - IMAP header sync → Tasks 5, 6, 8
  - IMAP body fetch → Task 5
  - SMTP send/reply/forward → Task 7, 8
  - PostgreSQL models → Task 2
  - IndexedDB LocalDB system → Task 9
  - All accounts / shared inbox → AccountSidebar `'all'` selection
  - Body caching in IndexedDB → Task 11 `useMailBody`
  - DOMPurify sanitization → Task 12 `MessageDetail`
  - Manual refresh / sync on mount → Tasks 11 `useMailSync`, 13 `MailLayout`
- [ ] All type names consistent across tasks (`MailAccount`, `MailHeader`, `FolderItem`, `SyncResult`, `SendMessageDto`)
- [ ] No TBD or placeholder steps
- [ ] `PrismaService` is injected properly in controller (Task 8 Step 4 note)
- [ ] Auth token retrieval in `mail-api.ts` matches the app's actual token storage (Task 10 Step 2 note)
