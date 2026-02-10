import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default owner
  const passwordHash = await bcrypt.hash('admin123!', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'founder@agentos.ai' },
    update: {},
    create: {
      email: 'founder@agentos.ai',
      passwordHash,
      name: 'Founder',
      role: UserRole.OWNER,
    },
  });

  // Create teams
  const executiveTeam = await prisma.team.upsert({
    where: { id: 'team-executive' },
    update: {},
    create: {
      id: 'team-executive',
      name: 'Executive Leadership',
      description: 'Strategic oversight and orchestration',
    },
  });

  const engineeringTeam = await prisma.team.upsert({
    where: { id: 'team-engineering' },
    update: {},
    create: {
      id: 'team-engineering',
      name: 'Platform Engineering',
      description: 'Building the software infrastructure',
    },
  });

  const campaignTeam = await prisma.team.upsert({
    where: { id: 'team-campaign' },
    update: {},
    create: {
      id: 'team-campaign',
      name: 'Campaign Production',
      description: 'Delivering client work',
    },
  });

  // Create agents
  const agents = [
    { id: 'agent-aria', name: 'ARIA', role: 'Executive Orchestrator', description: 'Manages all other agents, interfaces with Founder, handles approvals & delegation.', promptTemplate: 'You are ARIA, the executive orchestrator. Analyze the request and delegate to appropriate agents.', tools: ['delegate_task', 'summarize', 'plan'], isOrchestrator: true, teamId: executiveTeam.id },
    { id: 'agent-atlas', name: 'ATLAS', role: 'Tech Lead / Architect', description: 'Complex features, system architecture, code review.', promptTemplate: 'You are ATLAS, a senior full-stack engineer. Handle complex features, system architecture, and code review.', tools: ['plan', 'analyze_metrics', 'create_brief'], isOrchestrator: false, teamId: engineeringTeam.id },
    { id: 'agent-nexus', name: 'NEXUS', role: 'Infrastructure Lead', description: 'CI/CD pipelines, server stability, auto-healing systems.', promptTemplate: 'You are NEXUS, a DevOps/SRE engineer. Manage CI/CD pipelines, server stability, and infrastructure.', tools: ['connect_platform', 'sync_data', 'test_connection'], isOrchestrator: false, teamId: engineeringTeam.id },
    { id: 'agent-synth', name: 'SYNTH', role: 'AI Specialist', description: 'Prompt engineering, model optimization, RAG systems.', promptTemplate: 'You are SYNTH, an ML/AI engineer. Handle prompt engineering, model optimization, and RAG systems.', tools: ['generate_text', 'create_post_draft', 'rewrite'], isOrchestrator: false, teamId: engineeringTeam.id },
    { id: 'agent-pixel', name: 'PIXEL', role: 'UI/UX Developer', description: 'React components, animations, accessibility, design systems.', promptTemplate: 'You are PIXEL, a frontend specialist. Create React components, animations, and accessible design systems.', tools: ['generate_video_brief', 'create_image_prompt', 'review_visual'], isOrchestrator: false, teamId: engineeringTeam.id },
    { id: 'agent-sentinel', name: 'SENTINEL', role: 'Security Officer', description: 'Security audits, vulnerability scanning, compliance checks.', promptTemplate: 'You are SENTINEL, a security officer. Perform security audits, vulnerability scanning, and compliance checks.', tools: ['review_content', 'check_compliance', 'flag_issue'], isOrchestrator: false, teamId: engineeringTeam.id },
    { id: 'agent-scout', name: 'SCOUT', role: 'Maintenance Dev', description: 'Bug fixes, dependency updates, maintenance tasks.', promptTemplate: 'You are SCOUT, a maintenance developer. Handle bug fixes, dependency updates, and maintenance tasks.', tools: ['research_topic', 'analyze_trends', 'monitor_competitors'], isOrchestrator: false, teamId: engineeringTeam.id },
    { id: 'agent-vp', name: 'AG-VP', role: 'Strategy Director', description: 'Campaign strategy, resource allocation, priority management.', promptTemplate: 'You are AG-VP, a strategy director. Oversee campaign strategy and resource allocation.', tools: ['set_priority', 'allocate_resources', 'approve'], isOrchestrator: false, teamId: campaignTeam.id },
    { id: 'agent-manager', name: 'AG-MANAGER', role: 'Project Manager', description: 'Task tracking, team coordination, deliverable management.', promptTemplate: 'You are AG-MANAGER. Coordinate tasks, track progress, and ensure deliverables are on time.', tools: ['create_task', 'assign_task', 'track_progress'], isOrchestrator: false, teamId: campaignTeam.id },
    { id: 'agent-engineer', name: 'AG-ENGINEER', role: 'Creative Director / Producer', description: 'Content production, creative direction, campaign execution.', promptTemplate: 'You are AG-ENGINEER, a creative director. Handle content production and campaign execution.', tools: ['deploy', 'configure', 'debug'], isOrchestrator: false, teamId: campaignTeam.id },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: {},
      create: agent,
    });
  }

  console.log('Seed completed successfully');
  console.log(`  Owner: ${owner.email}`);
  console.log(`  Teams: ${3}`);
  console.log(`  Agents: ${agents.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
