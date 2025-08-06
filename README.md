# S3UI - Modern S3 File Explorer

S3UI is a modern, user-friendly interface for managing your AWS S3 bucket files and folders. Built with Next.js and secured with Clerk authentication, it provides an intuitive way to browse, upload, download, and manage your S3 objects.

## Features

- 🔐 Secure authentication with Clerk
- 📁 Intuitive file and folder browsing
- ⬆️ Easy file uploads with drag-and-drop support
- ⬇️ Direct file downloads
- 🗑️ Delete files and folders
- 📊 Storage usage statistics
- 🎨 Modern UI with responsive design

## Getting Started

### Prerequisites

- Node.js 18.x or later
- AWS S3 bucket and credentials
- Clerk account for authentication

### Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your credentials
3. Install dependencies:

```bash
pnpm install
```

4. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

The following environment variables are required:

```
# S3 Configuration
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=s3ui--bucket

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Next.js
NEXT_PUBLIC_APP_URL=https://your-deployment-url.com
```

## Deployment

### Deploy on Vercel

The easiest way to deploy S3UI is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Import the project into Vercel
3. Add all required environment variables in the Vercel project settings
4. Deploy

### Deploy with Docker

S3UI can also be deployed using Docker:

1. Build the Docker image:

```bash
docker build -t s3ui .
```

2. Run the container:

```bash
docker run -p 3000:3000 --env-file .env.local s3ui
```

### Other Deployment Options

You can also deploy S3UI on any platform that supports Node.js applications:

1. Build the application:

```bash
pnpm build
```

2. Start the production server:

```bash
pnpm start
```
