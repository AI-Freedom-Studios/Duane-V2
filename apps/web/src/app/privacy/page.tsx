import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | AIFREEDOMSTUDIOS',
  description: 'Privacy Policy for AIFREEDOMSTUDIOS and AgentOS by AI Freedom Studios.',
};

const sections = [
  {
    title: '1. Information We Process',
    body: 'AgentOS may process account information such as name, email address, role, connected social account identifiers, provider labels, prompts, drafts, generated media, task data, and workspace activity needed to operate the product.',
  },
  {
    title: '2. Connected Social Accounts',
    body: 'When you connect platforms such as YouTube, TikTok, LinkedIn, Meta, or X, AgentOS stores authorization tokens securely so the application can perform actions you request, such as account display, publishing preparation, or posting workflows. You can disconnect connected accounts from the Integrations or Social Media pages.',
  },
  {
    title: '3. API Keys and Provider Credentials',
    body: 'Provider keys are used to connect AI, video, storage, and automation services. These credentials are stored in encrypted form where supported by the application and are used only to call the provider features you choose to use.',
  },
  {
    title: '4. How Information Is Used',
    body: 'We use information to authenticate users, provide workspace features, generate requested content, manage integrations, display connected account status, maintain audit logs, troubleshoot errors, and improve the reliability of the service.',
  },
  {
    title: '5. Third-Party Providers',
    body: 'When you use connected services, relevant data may be sent to third-party providers such as social platforms, AI model providers, video generation services, storage providers, or analytics tools. Their handling of data is governed by their own privacy policies and terms.',
  },
  {
    title: '6. Data Retention',
    body: 'Workspace data and connected account records may be retained while your account is active or as needed for operational, security, legal, or troubleshooting purposes. You may remove provider keys and disconnect social accounts from the application.',
  },
  {
    title: '7. Security',
    body: 'AgentOS is designed to protect sensitive integration data through access controls and credential encryption where implemented. No system is perfectly secure, so users should avoid sharing unnecessary secrets and should rotate credentials if exposure is suspected.',
  },
  {
    title: '8. Children',
    body: 'AgentOS is intended for professional and business use and is not directed to children. Users should not submit personal information from children through the service.',
  },
  {
    title: '9. Contact',
    body: 'For privacy questions, data removal requests, or connected account concerns, contact the project owner or support contact associated with your AgentOS deployment.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_28rem),linear-gradient(180deg,#f8fafc,#eef2f7)] px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            AIFREEDOMSTUDIOS
          </Link>
          <Link href="/terms" className="text-sm text-slate-600 hover:text-slate-950">
            Terms of Service
          </Link>
        </div>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-xl shadow-slate-200/70 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">Privacy</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            This policy explains how AIFREEDOMSTUDIOS and AgentOS handle information for AI workflows, social platform connections, video generation, provider keys, and workspace activity.
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
