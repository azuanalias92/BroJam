# BroJam 🤝

A modern tiered marketplace system where users can borrow items from each other and build their reputation through successful transactions. BroJam creates a community-driven sharing economy with a gamified tier system that rewards trustworthy users.

## ✨ Features

### 🏪 Marketplace
- Browse and search available items for borrowing
- Advanced filtering by category, location, and availability
- Item cards with detailed information and images
- Request-to-borrow system with messaging

### 👤 User Management
- Secure authentication with Supabase Auth
- User profiles with reputation tracking
- Tiered system (Bronze, Silver, Gold, Platinum)
- Avatar and profile customization

### 🎯 Tier System
- **Bronze**: Basic borrowing privileges
- **Silver**: Extended borrowing duration
- **Gold**: Premium item access
- **Platinum**: Exclusive items and priority support

### 🌐 Internationalization
- Multi-language support (English & Malay)
- Dynamic language switching
- Localized content and UI

### 📱 Modern UI/UX
- Responsive design for all devices
- Dark/light theme support
- Intuitive navigation with icons
- Professional component library with shadcn/ui

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Modern component library
- **Lucide React** - Beautiful icons

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security** - Data protection
- **Real-time subscriptions** - Live updates

### Development Tools
- **ESLint** - Code linting
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Date-fns** - Date utilities

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager
- Supabase account for backend services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BroJam
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Run the SQL schema in `supabase-schema.sql` in your Supabase dashboard
   - Enable Row Level Security policies
   - Configure authentication providers

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3001](http://localhost:3001) to view the application.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── marketplace/      # Marketplace features
│   ├── ui/               # shadcn/ui components
│   └── LanguageSwitcher.tsx
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   └── TranslationContext.tsx
├── lib/                  # Utilities and configurations
│   ├── supabase.ts       # Supabase client
│   ├── tiers.ts          # Tier system logic
│   └── utils.ts          # Helper functions
└── messages/             # Translation files
    ├── en.json           # English translations
    └── ms.json           # Malay translations
```

## 🌍 Internationalization

BroJam supports multiple languages with a custom translation system:

- **English (en)** - Default language
- **Malay (ms)** - Secondary language

Translations are managed through JSON files in the `messages/` directory.

## 🔐 Authentication & Security

- Supabase Auth integration with email/password and OAuth
- Row Level Security (RLS) for data protection
- Secure session management
- Protected routes and API endpoints

## 📱 PWA Support

BroJam includes Progressive Web App features:
- Web app manifest for installability
- Custom app icons and favicons
- Responsive design for mobile devices

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed on any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React framework
- [Supabase](https://supabase.com) - Backend-as-a-Service
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Lucide](https://lucide.dev) - Icon library
