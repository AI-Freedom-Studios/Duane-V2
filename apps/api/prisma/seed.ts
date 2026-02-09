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
      description: 'Core platform development and infrastructure',
    },
  });

  const campaignTeam = await prisma.team.upsert({
    where: { id: 'team-campaign' },
    update: {},
    create: {
      id: 'team-campaign',
      name: 'Campaign Production',
      description: 'Content creation and campaign management',
    },
  });

  // Create agents
  const agents = [
    { id: 'agent-aria', name: 'ARIA', role: 'Chief Orchestrator', description: 'AI orchestration agent that delegates tasks to other agents', promptTemplate: 'You are ARIA, the chief orchestrator. Analyze the request and delegate to appropriate agents.', tools: ['delegate_task', 'summarize', 'plan'], isOrchestrator: true, teamId: executiveTeam.id },
    { id: 'agent-atlas', name: 'ATLAS', role: 'Strategic Planner', description: 'Strategic planning and campaign architecture', promptTemplate: 'You are ATLAS, a strategic planner. Create comprehensive plans for campaigns and projects.', tools: ['plan', 'analyze_metrics', 'create_brief'], isOrchestrator: false, teamId: executiveTeam.id },
    { id: 'agent-nexus', name: 'NEXUS', role: 'Integration Specialist', description: 'Manages connections between platforms and services', promptTemplate: 'You are NEXUS, an integration specialist. Help connect and synchronize data between platforms.', tools: ['connect_platform', 'sync_data', 'test_connection'], isOrchestrator: false, teamId: engineeringTeam.id },
    { id: 'agent-synth', name: 'SYNTH', role: 'Content Generator', description: 'AI-powered content creation and copywriting', promptTemplate: 'You are SYNTH, a content generator. Create engaging content for various platforms.', tools: ['generate_text', 'create_post_draft', 'rewrite'], isOrchestrator: false, teamId: campaignTeam.id },
    { id: 'agent-pixel', name: 'PIXEL', role: 'Visual Designer', description: 'Image and video brief generation', promptTemplate: 'You are PIXEL, a visual designer. Create visual content briefs and direct media generation.', tools: ['generate_video_brief', 'create_image_prompt', 'review_visual'], isOrchestrator: false, teamId: campaignTeam.id },
    { id: 'agent-sentinel', name: 'SENTINEL', role: 'Quality Assurance', description: 'Content review, compliance checking, and brand safety', promptTemplate: 'You are SENTINEL, a QA agent. Review content for quality, compliance, and brand safety.', tools: ['review_content', 'check_compliance', 'flag_issue'], isOrchestrator: false, teamId: executiveTeam.id },
    { id: 'agent-scout', name: 'SCOUT', role: 'Research Analyst', description: 'Market research, trend analysis, and competitor monitoring', promptTemplate: 'You are SCOUT, a research analyst. Gather insights on trends, competitors, and market conditions.', tools: ['research_topic', 'analyze_trends', 'monitor_competitors'], isOrchestrator: false, teamId: campaignTeam.id },
    { id: 'agent-vp', name: 'AG-VP', role: 'Vice President', description: 'Executive oversight and priority management', promptTemplate: 'You are AG-VP. Oversee project priorities and resource allocation.', tools: ['set_priority', 'allocate_resources', 'approve'], isOrchestrator: false, teamId: executiveTeam.id },
    { id: 'agent-manager', name: 'AG-MANAGER', role: 'Project Manager', description: 'Task tracking and team coordination', promptTemplate: 'You are AG-MANAGER. Coordinate tasks, track progress, and ensure deliverables are on time.', tools: ['create_task', 'assign_task', 'track_progress'], isOrchestrator: false, teamId: engineeringTeam.id },
    { id: 'agent-engineer', name: 'AG-ENGINEER', role: 'Platform Engineer', description: 'Technical implementation and system maintenance', promptTemplate: 'You are AG-ENGINEER. Handle technical implementation tasks and system maintenance.', tools: ['deploy', 'configure', 'debug'], isOrchestrator: false, teamId: engineeringTeam.id },
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
