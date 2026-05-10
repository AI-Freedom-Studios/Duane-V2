import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe, PlayCircle, Shield, Sparkles, Video, Wand2 } from 'lucide-react';

const featureCards = [
  {
    title: 'Connect and manage channels',
    body: 'Connect YouTube, X, LinkedIn, Meta, and other supported platforms so teams can manage publishing from one workspace.',
    icon: Globe,
  },
  {
    title: 'Create with AI workflows',
    body: 'Use AgentOS to draft posts, manage creative tasks, prepare campaigns, and generate content from a single operating layer.',
    icon: Wand2,
  },
  {
    title: 'Publish and review results',
    body: 'Schedule or publish content, track connected account status, and review live channel data without switching tools.',
    icon: Video,
  },
];

const reviewerPoints = [
  'AIFREEDOMSTUDIOS is the public-facing application name used for the OAuth consent flow.',
  'Users sign in only after reading about the product and choosing to access the dashboard.',
  'Google account access is used to connect YouTube channels, upload videos, and read channel statistics needed for the application experience.',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_30rem),radial-gradient(circle_at_85%_10%,rgba(20,184,166,0.14),transparent_28rem),linear-gradient(180deg,#f8fafc,#eef2f7)] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/85 px-6 py-5 shadow-lg shadow-slate-200/60 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">AIFREEDOMSTUDIOS</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">AgentOS by AI Freedom Studios</p>
            <p className="mt-1 text-sm text-slate-500">Public app overview, privacy information, and sign-in access.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/privacy" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              Terms of Service
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </header>

        <section className="surface-glow animate-fade-up relative mt-6 overflow-hidden rounded-[2.5rem] border border-white/60 bg-slate-950 px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.36),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(20,184,166,0.28),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95)_34%,rgba(37,99,235,0.88),rgba(13,148,136,0.82))]" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 grid gap-10 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Public App Overview
                </div>
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
                  Google OAuth Review Ready
                </div>
              </div>

              <div className="max-w-4xl space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">AIFREEDOMSTUDIOS</p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
                  AgentOS helps teams create, connect, and publish from one calm operating layer.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
                  This application is used to connect social accounts, manage provider integrations, draft content, upload videos, and publish workflow-ready media from a single dashboard. Users can connect Google/YouTube so the app can upload videos and read channel information needed for publishing and reporting.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Open the dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Review privacy policy
                </Link>
              </div>
            </div>

            <aside className="rounded-[1.9rem] border border-white/12 bg-white/10 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-100">What reviewers should see</p>
                  <p className="text-xs text-slate-300">Public information available before login.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                  <Shield className="h-5 w-5 text-cyan-200" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {reviewerPoints.map((point) => (
                  <div key={point} className="rounded-[1.35rem] border border-white/12 bg-white/8 p-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <p className="text-sm leading-6 text-slate-100">{point}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/60">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-slate-950">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.body}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <article className="rounded-[2rem] border border-slate-200 bg-white/92 p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">How Google data is used</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Why AIFREEDOMSTUDIOS requests Google / YouTube access</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                Users can choose to connect their YouTube account so AgentOS can upload videos, identify the connected channel, and display channel statistics and recent uploads inside the workspace.
              </p>
              <p>
                Access is only used to perform the workflow the user requested, such as channel connection, publishing, and showing live channel data inside the product. Users can disconnect connected accounts from the Integrations or Social Media pages.
              </p>
              <p>
                The dashboard itself stays behind login, but this homepage, the privacy policy, and the terms of service remain public so reviewers and users can understand the application before signing in.
              </p>
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Quick links</p>
            <div className="mt-5 space-y-3">
              <Link href="/privacy" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50/50">
                <div>
                  <p className="font-medium text-slate-950">Privacy Policy</p>
                  <p className="text-sm text-slate-500">How AgentOS handles connected-account and workspace data.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link href="/terms" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50/50">
                <div>
                  <p className="font-medium text-slate-950">Terms of Service</p>
                  <p className="text-sm text-slate-500">Rules for using AgentOS, integrations, publishing, and provider workflows.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link href="/login" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-300 hover:bg-blue-50/50">
                <div>
                  <p className="font-medium text-slate-950">Sign in to the app</p>
                  <p className="text-sm text-slate-500">Access the protected dashboard after reviewing the product overview.</p>
                </div>
                <PlayCircle className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </article>
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-slate-200/80 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>AIFREEDOMSTUDIOS / AgentOS by AI Freedom Studios</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-950">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-950">Terms of Service</Link>
            <Link href="/login" className="hover:text-slate-950">Sign in</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
