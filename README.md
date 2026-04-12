# EduFU React SPA

A modern, high-performance Online Learning Platform (SPA) built with React 18, Vite, and Tailwind CSS. Featuring premium "Liquid Glass" aesthetics, state-of-the-art animations, and real-time backend synchronization via Supabase.

## Key Features
- **3 Dynamic Learning Modes**: Study (sequential), Practice (instant feedback), and Mock Exam (timed).
- **Dual Exam Interfaces**: Choose between the modern "EduFU" glassmorphism interface or the classic "EOS" exam delivery system interface.
- **Multilingual Support (i18n)**: Seamlessly switch between English and Vietnamese across the entire application interface, while preserving original question content.
- **Backend & Authentication**: Powered by Supabase with secure Google OAuth login, protecting user data and test progress.
- **Admin Content Portal**: Secure gateway for managing question databases and answer keys, seamlessly integrated with Supabase.
- **Smart Data Handling**: Supporting multi-answer questions, session persistence using Zustand, and comprehensive exam history tracking.
- **Premium UI/UX**: Responsive backdrop-blur glassmorphism, Framer Motion transitions, and Apple-like liquid animations.
- **Keyboard Navigation**: Interactive Arrow Key support for all learning sessions.

## Tech Stack
- **Framework**: React 18
- **Bundler**: Vite
- **Styling**: Tailwind CSS (custom glass configuration)
- **Animations**: Framer Motion
- **State Management**: Zustand (with persistent storage)
- **Routing**: React Router DOM (HashRouter)
- **Backend & Auth**: Supabase

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/HungBB-1808/LearnAndReviewFE_EpPiTiYou.git

# Navigate to the project directory
cd EduGlassReact

# Install dependencies
npm install

# Run in development mode
# Note: Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment if required.
npm run dev
```

### Build for Production
```bash
npm run build
```

## Security & Deployment
- User sessions and data are protected by Supabase Row Level Security (RLS) policies.
- The platform is designed to be easily deployed to Vercel for fast global edge distribution.

## License
This project is for internal education purposes for FPT University students.
