# Syndicate 708 AI

Secure multi-model AI workflow interface. Chat with Kimi, DeepSeek, Qwen, Claude, GPT, and more — all traffic routed through US-based servers.

## Features

- **Multi-model chat** — Switch between models via dropdown (Fireworks, OpenRouter, Groq)
- **Chinese-developed models on US infrastructure** — Kimi, DeepSeek, Qwen via Fireworks.ai
- **Document upload** — Attach PDFs, text, CSV, JSON and chat over their contents
- **Saved chats** — Conversations persist locally in SQLite
- **Shareable conversations** — Share links between Syndicate 708 members
- **Model comparison** — Side-by-side outputs from up to 4 models
- **Prompt library** — Save and share process prompts (company overviews, workflows, etc.)
- **Security** — 2FA, TLS, local data storage, no telemetry, unindexed by default

## Quick Start

### Prerequisites

- Node.js 20+
- At least one LLM API key (Fireworks recommended)

### 1. Install

```bash
git clone https://github.com/shreyshreygowda/syndicate-ai.git
cd syndicate-ai
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:

```env
AUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
FIREWORKS_API_KEY=fw_your_key_here

# Optional additional providers
OPENROUTER_API_KEY=sk-or-...
GROQ_API_KEY=gsk_...

# Recommended for production
REQUIRE_2FA=true
NOINDEX=true
```

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000 — you'll be guided through initial admin setup on first launch.

## Docker Deployment

```bash
# Basic (HTTP on port 3000)
docker compose up -d syndicate-ai

# With HTTPS reverse proxy
docker compose --profile production up -d
```

Data persists in Docker volumes (`syndicate-data`, `syndicate-uploads`).

## Self-Hosting on Syndicate Devices

### Option A: Direct (LAN)

1. Clone repo on any Syndicate 708 machine
2. Set `NEXTAUTH_URL=http://<device-ip>:3000`
3. Run `npm run dev` or `docker compose up -d`
4. Access from any device on the network

### Option B: Secure Remote Access

1. Deploy with Docker + Caddy profile
2. Point a domain (or use Tailscale for private networking)
3. Enable `REQUIRE_2FA=true`
4. Set `NOINDEX=true` to prevent search indexing

### Option C: Tailscale (Recommended for remote)

```bash
# Install Tailscale on the host
tailscale up

# Run the app bound to Tailscale IP
NEXTAUTH_URL=http://100.x.x.x:3000 npm run dev
```

Only Tailscale network members can access — no public exposure needed.

## API Keys

| Provider | Get Key | Models |
|----------|---------|--------|
| [Fireworks AI](https://fireworks.ai) | Primary — Kimi, DeepSeek, Qwen, Llama | US-hosted |
| [OpenRouter](https://openrouter.ai) | Claude, GPT-4o, DeepSeek | US routing |
| [Groq](https://groq.com) | Fast Llama, Mixtral | US LPU |

Fireworks is the primary backend for reaching Chinese-developed models on US infrastructure.

## Adding Users

Currently, create additional users by running the setup script:

```bash
npx tsx scripts/add-user.ts email@example.com "User Name" password
```

Or add directly to the SQLite database in `./data/syndicate.db`.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Browser    │────▶│  Next.js App │────▶│  SQLite (local) │
│  (React UI) │     │  (API routes)│     │  Chats, Docs    │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────┴───────┐
                    │ Provider Layer│
                    ├──────────────┤
                    │ Fireworks AI │──▶ Kimi, DeepSeek, Qwen
                    │ OpenRouter   │──▶ Claude, GPT-4o
                    │ Groq         │──▶ Llama, Mixtral
                    └──────────────┘
                           │
                    All US-based servers
```

The provider layer is designed for extensibility — add new providers by implementing the `LLMProvider` interface in `src/lib/providers/`.

## Budget

Estimated monthly cost within $50/month:

| Item | Cost |
|------|------|
| Self-hosted (your hardware) | $0 |
| Fireworks API usage | ~$10-30 |
| OpenRouter/Groq (optional) | ~$5-20 |
| Domain (optional) | ~$1 |

## Security Checklist

- [ ] Set strong `AUTH_SECRET`
- [ ] Enable 2FA for all users (`REQUIRE_2FA=true`)
- [ ] Deploy behind HTTPS (Caddy or nginx)
- [ ] Set `NOINDEX=true`
- [ ] Keep API keys in `.env` only — never commit
- [ ] Restrict network access (Tailscale or firewall)
- [ ] Regular backups of `./data/syndicate.db`

## License

Private — Syndicate 708 internal use.
