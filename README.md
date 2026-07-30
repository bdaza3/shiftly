# Shiftly
Shiftly is a shift scheduling and team coordination app built with Next.js and Supabase. It supports email/password auth, Google OAuth, company onboarding, role-based company membership, shift management, and employee requests.

## What It Does

- Create or join a company with a join code.
- Manage company members with employee, manager, admin, and owner roles.
- Create, update, and delete shifts.
- Track shift assignments and request flows.
- Update user profile details through Supabase Auth and the `profiles` table.

## Stack

- Next.js 16
- React 19
- Supabase Auth, Postgres, and Realtime
- TypeScript
- Tailwind CSS

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create your environment file from the existing template values in the repo and point it at your Supabase project.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Run the app.

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Create a new Supabase project.
2. Enable Email/Password auth.
3. Enable Google OAuth if you want the Google sign-in button to work.
4. Add redirect URLs for your app, including:
	- `http://localhost:3000/register`
	- your production `/register` URL
5. Run the database migration in `db/migrations/001_rebuild_supabase.sql`.
6. Make sure the service role key stays server-only and is never exposed in the browser.

## Database Notes

This app expects the following main tables and relations:

- `profiles` linked to `auth.users`
- `companies`
- `company_members`
- `requests`
- `shifts`
- `shift_assignments`

The migration also creates RLS policies and a `public.users` view used by the server routes.

## Resume Angle

This project is strongest when described as a full-stack workflow app rather than just a UI demo. It shows:

- Auth integration with Supabase
- Role-based access control
- Server-side authorization checks
- Realtime database-driven UI updates
- Multi-tenant data modeling for companies and members

## Security Checklist Before Publishing

- Rotate any Supabase keys before making the repository public.
- Do not commit `.env.local`, `.env.production`, or `.env.staging` with real secrets.
- Keep the service role key out of any client bundle.
- Review any hard-coded project refs or callback URLs before deployment.

## Deploy

The app can be deployed on Vercel or any platform that supports Next.js. Point the production environment variables at the new Supabase project and verify auth redirects in the Supabase dashboard.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
