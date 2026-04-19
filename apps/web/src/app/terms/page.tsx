import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | AgentOS',
  description: 'Terms of Service for AgentOS by AI Freedom Studios.',
};

const sections = [
  {
    title: '1. Use of AgentOS',
    body: 'AgentOS is an AI operating layer for content creation, video generation, social publishing, task coordination, and provider integrations. You agree to use the service lawfully, responsibly, and only with accounts, API keys, media, prompts, and content that you are authorized to use.',
  },
  {
    title: '2. Connected Accounts and API Keys',
    body: 'When you connect third-party services such as YouTube, TikTok, LinkedIn, Meta, X, AI providers, or video generation providers, you authorize AgentOS to use those connections only to provide the features you request. You are responsible for maintaining access to those third-party accounts and complying with their terms.',
  },
  {
    title: '3. User Content',
    body: 'You retain ownership of the prompts, drafts, media, posts, videos, and other content you create or upload. You grant AgentOS permission to process that content only as needed to operate the application, generate requested outputs, store drafts, publish to selected destinations, and show previews or history inside your workspace.',
  },
  {
    title: '4. Publishing Responsibility',
    body: 'AgentOS may help prepare, schedule, or publish content to connected platforms. You are responsible for reviewing content before publishing and for ensuring it complies with applicable laws, platform rules, advertising standards, copyright rules, and privacy requirements.',
  },
  {
    title: '5. Third-Party Services',
    body: 'AgentOS integrates with third-party APIs and platforms. Availability, pricing, output quality, moderation, rate limits, account permissions, and service behavior may change based on those providers. AgentOS is not responsible for third-party outages, rejected content, removed posts, or provider policy decisions.',
  },
  {
    title: '6. Security',
    body: 'You should keep your login credentials, API keys, and connected accounts secure. If you believe your account or credentials have been compromised, disconnect affected providers and contact support as soon as possible.',
  },
  {
    title: '7. Service Changes',
    body: 'We may improve, modify, suspend, or remove features as the product evolves. We aim to make changes carefully, especially where workflows, stored content, or connected accounts may be affected.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'AgentOS is provided as a software tool and may be used with experimental AI systems. To the fullest extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the service.',
  },
  {
    title: '9. Contact',
    body: 'Questions about these terms can be sent to the project owner or support contact associated with your AgentOS deployment.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_28rem),linear-gradient(180deg,#f8fafc,#eef2f7)] px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            AgentOS
          </Link>
          <Link href="/privacy" className="text-sm text-slate-600 hover:text-slate-950">
            Privacy Policy
          </Link>
        </div>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-xl shadow-slate-200/70 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">Legal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Terms of Service</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            These terms describe how AgentOS may be used for AI-assisted content creation, social publishing, provider management, and connected account workflows.
          </p>
          <p className="mt-4 text-sm text-slate-500">Last updated: April 13, 2026</p>
        </section>

        <section className="mt-6 space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{section.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
