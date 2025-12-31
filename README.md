# Soluly

**The all-in-one business management platform for consulting firms and service-based companies.**

Soluly helps consultants, agencies, and service providers manage their entire business from a single platform — projects, clients, time tracking, finances, and team collaboration.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20macOS%20%7C%20Windows-lightgrey)

## Features

### Project Management
- Track multiple client projects with status, budgets, and profitability
- Milestones and task management within projects
- Team member assignments and hour tracking
- Contracts and invoices per project
- Project cost and expense tracking

### Time & Billing
- Billable hour logging by project and team member
- Weekly time entry management with customizable rates
- Billable vs non-billable time tracking
- Automatic session tracking
- Team member utilization metrics

### CRM & Sales Pipeline
- Lead management with status tracking (cold, warm, hot)
- Client profiles with contact information
- Quotes and proposals with line items
- Sales pipeline stages (draft → proposal → negotiation → won/lost)
- Activity history and task management
- Contact import/export (CSV)
- Tags and custom fields

### Support & Tickets
- Issue tracking with categories
- Feature request management
- Customer feedback collection with sentiment tracking
- Complete ticket workflow

### Financial Management
- Revenue, costs, and profitability dashboards
- Expense tracking with categories
- Financial projections and scenario analysis
- Quarterly goal setting and KPI tracking
- Team payment recording
- Per-project and per-client profit analysis

### Team Management
- Complete team roster with roles and departments
- Granular role-based access control
- Team invitations via email
- Resource utilization tracking
- Payment management

### Email Integration
- Gmail OAuth integration
- IMAP support for other email providers
- AI-assisted email categorization
- Auto-link emails to tickets, quotes, and projects
- Sender filtering (whitelist/blacklist)

### Forms & Surveys
- Visual form builder
- Shareable public form links
- Response collection and management

### Reporting
- Custom report templates (projects, contacts, sales, team)
- PDF export
- Charts and visualizations
- Date range filtering

### Dashboard
- Customizable stat cards and widgets
- Quick actions
- Recent activity feed
- Upcoming deadlines and milestones

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Query (TanStack)
- React Router v6
- Recharts

**Backend**
- Supabase (PostgreSQL + Auth)
- Row-level security (RLS)

**Desktop**
- Electron
- Available for macOS (Intel & Apple Silicon) and Windows

**Testing**
- Vitest
- Playwright (E2E)

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/hashim1213/soluly-business-suite.git
cd soluly-business-suite

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start the development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Building for Production

```bash
# Build web app
npm run build

# Build desktop app (macOS)
npm run electron:build:mac

# Build desktop app (Windows)
npm run electron:build:win

# Build all platforms
npm run electron:build:all
```

## Downloads

Download the latest release for your platform:

- [macOS (Apple Silicon)](https://github.com/hashim1213/soluly-business-suite/releases/latest/download/Soluly-1.0.0-arm64.dmg)
- [macOS (Intel)](https://github.com/hashim1213/soluly-business-suite/releases/latest/download/Soluly-1.0.0-x64.dmg)
- [Windows](https://github.com/hashim1213/soluly-business-suite/releases/latest/download/Soluly-Setup-1.0.0.exe)

## Project Structure

```
soluly-business-suite/
├── src/
│   ├── pages/           # Page components
│   ├── components/      # UI components
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # React contexts
│   ├── integrations/    # Supabase client
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
├── electron/            # Electron main process
├── e2e/                 # End-to-end tests
├── build/               # Build resources
└── public/              # Static assets
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/hashim1213/soluly-business-suite/issues) page.
