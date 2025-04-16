# OrthoFlow

OrthoFlow is a web application for French spelling and grammar correction, offering a modern and intuitive user interface.

## Features

- ✍️ Rich text editor with Lexical
- 🔍 Real-time spelling and grammar checking
- 📊 Text readability analysis
- 📝 Automatic text correction generation
- 📄 PDF export functionality
- 🎨 Modern and responsive user interface

## Technologies Used

- **Frontend**:
  - Next.js 14
  - React 18
  - TypeScript
  - Tailwind CSS
  - Lexical (rich text editor)
  - Framer Motion (animations)
  - Radix UI
  - clsx
  - lucide-react
  - next-themes
  - tailwind-merge
  - tailwindcss-animate

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/nassoa/orthoflow.git
cd orthoflow
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter your text in the editor
2. Errors will be automatically detected and highlighted
3. Click on an error to see correction suggestions
4. Use the "Correct Text" button to generate a corrected version
5. Export your text to PDF if needed

## Project Structure

```
orthoflow/
├── src/
│   ├── app/              # Next.js pages, layouts, and API routes
│   ├── components/       # Reusable React components
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # Global and component-specific styles
│   ├── utils/            # Utility functions and services
│   ├── types/            # TypeScript type definitions
│   └── lib/              # Shared libraries (e.g., configuration, constants)
├── public/               # Static assets (e.g., images, fonts)
├── .next/                # Next.js build output (generated)
├── node_modules/         # Installed dependencies (generated)
├── .env.local            # Environment variables (local)
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation

```
