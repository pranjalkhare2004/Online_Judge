# Online Judge Frontend

A modern, responsive frontend for an online competitive programming platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🚀 **Modern Tech Stack**: Next.js 14, React 18, TypeScript
- 🎨 **Beautiful UI**: Tailwind CSS with shadcn/ui components
- 🔐 **Authentication**: NextAuth.js with multiple providers
- 💻 **Code Editor**: Monaco Editor with syntax highlighting
- 📱 **Responsive Design**: Mobile-first approach
- 🌙 **Dark Mode**: System-aware theme switching
- ⚡ **Performance**: Optimized for speed and SEO

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with shadcn/ui
- **Code Editor**: Monaco Editor
- **Authentication**: NextAuth.js
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Zod validation
- **Testing**: Jest with React Testing Library

## Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/online-judge.git
cd online-judge/ONLINE-JUDGE-FRONTEND
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_API_URL=http://localhost:5000/api
MONGODB_URI=your-mongodb-connection-string
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with coverage

## Project Structure

```
├── app/                    # App Router pages and layouts
├── components/            # Reusable UI components
├── contexts/             # React contexts (Auth, Theme, etc.)
├── hooks/               # Custom React hooks
├── lib/                # Utility functions and configurations
├── public/             # Static assets
├── styles/            # Global styles
└── types/            # TypeScript type definitions
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy automatically on push

### Docker

```bash
docker build -t online-judge-frontend .
docker run -p 3000:3000 online-judge-frontend
```

### Manual Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Join our community discussions
