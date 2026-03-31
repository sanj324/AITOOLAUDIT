import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function checklistSeed(toolId, parameterName, description, severity, weight, evidenceRequired = true) {
  return {
    parameter_name: parameterName,
    description: description,
    tool_id: toolId,
    severity: severity,
    weight: weight,
    evidence_required: evidenceRequired
  };
}

async function main() {
  const roles = [
    { role_code: "ADMIN", role_name: "Admin", description: "System administrator with full access." },
    { role_code: "AUDITOR", role_name: "Auditor", description: "Performs internal audits and captures findings." },
    { role_code: "REVIEWER", role_name: "Reviewer", description: "Reviews submitted audits and observations." }
  ];

  for (const role of roles) {
    await prisma.role_master.upsert({
      where: { role_code: role.role_code },
      update: { ...role, is_active: true, is_deleted: false },
      create: role
    });
  }

  const adminRole = await prisma.role_master.findUnique({ where: { role_code: "ADMIN" } });
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  await prisma.user_master.upsert({
    where: { email: "admin@aiaudit.local" },
    update: {
      full_name: "System Administrator",
      password_hash: passwordHash,
      role_id: adminRole.id,
      is_active: true,
      is_deleted: false
    },
    create: {
      full_name: "System Administrator",
      email: "admin@aiaudit.local",
      password_hash: passwordHash,
      role_id: adminRole.id,
      department: "Internal Audit",
      designation: "Lead Administrator"
    }
  });

  const tools = [
    {
      tool_name: "ChatGPT",
      description: "OpenAI workspace used for enterprise generative AI productivity and analysis.",
      risk_level: "HIGH"
    },
    {
      tool_name: "GitHub",
      description: "Enterprise source code collaboration platform used for repositories, actions, and auditability.",
      risk_level: "HIGH"
    },
    {
      tool_name: "GitHub Copilot",
      description: "AI coding assistant embedded within developer workflows.",
      risk_level: "HIGH"
    },
    {
      tool_name: "Claude",
      description: "Anthropic enterprise assistant used for secure enterprise reasoning and knowledge work.",
      risk_level: "HIGH"
    },
    {
      tool_name: "Eraser",
      description: "Diagramming and AI documentation workspace used by product and engineering teams.",
      risk_level: "MEDIUM"
    }
  ];

  for (const tool of tools) {
    await prisma.tool_master.upsert({
      where: { tool_name: tool.tool_name },
      update: { ...tool, is_active: true, is_deleted: false },
      create: tool
    });
  }

  const toolRecords = await prisma.tool_master.findMany({
    where: {
      tool_name: {
        in: tools.map((tool) => tool.tool_name)
      }
    }
  });

  const toolMap = new Map(toolRecords.map((tool) => [tool.tool_name, tool.id]));

  const checklistSeeds = [
    checklistSeed(
      toolMap.get("ChatGPT"),
      "[Team] Workspace Owner and RBAC Governance",
      "Validate that workspace ownership is formally assigned and role-based access controls are limited to approved team responsibilities.",
      "CRITICAL",
      18
    ),
    checklistSeed(
      toolMap.get("ChatGPT"),
      "[Team] SSO, Domain Verification, and Joiner-Mover-Leaver Control",
      "Review whether workforce access is governed through enterprise identity controls such as SSO and centrally managed provisioning or removal.",
      "CRITICAL",
      18
    ),
    checklistSeed(
      toolMap.get("ChatGPT"),
      "[Team] App and Agent Feature Restriction Review",
      "Confirm that advanced workspace features, connected apps, and agent capabilities are enabled only for approved roles and use cases.",
      "HIGH",
      16
    ),
    checklistSeed(
      toolMap.get("ChatGPT"),
      "[Business] Data Retention, Residency, and Deletion Alignment",
      "Check whether retention and residency settings align with internal privacy commitments, contract requirements, and regulatory obligations.",
      "CRITICAL",
      20
    ),
    checklistSeed(
      toolMap.get("ChatGPT"),
      "[Business] Sensitive Data Prompting and DLP Restriction",
      "Assess whether teams are prevented from entering customer data, credentials, source code, or regulated records without approved controls.",
      "CRITICAL",
      20
    ),
    checklistSeed(
      toolMap.get("ChatGPT"),
      "[Business] Compliance API and Monitoring Coverage",
      "Verify that compliance or activity logging is enabled and reviewed so business usage can be reconstructed during investigations or audits.",
      "HIGH",
      14
    ),
    checklistSeed(
      toolMap.get("ChatGPT"),
      "[Business] Approved Use Case and Policy Acknowledgement",
      "Confirm that each business team using ChatGPT has documented approved use cases, prohibited use cases, and user awareness evidence.",
      "HIGH",
      14
    ),

    checklistSeed(
      toolMap.get("GitHub"),
      "[Team] Enterprise Ownership, Org Delegation, and Admin Segregation",
      "Validate that enterprise and organization administration follows least privilege and clear ownership with no unmanaged privileged accounts.",
      "CRITICAL",
      18
    ),
    checklistSeed(
      toolMap.get("GitHub"),
      "[Team] SAML, SCIM, or Enterprise Managed Identity Control",
      "Check whether repository access is governed through centralized identity controls and timely user lifecycle management.",
      "CRITICAL",
      18
    ),
    checklistSeed(
      toolMap.get("GitHub"),
      "[Team] Audit Log Review, Export, or Streaming Coverage",
      "Confirm that enterprise audit logs are enabled, reviewed, and exported or streamed to central monitoring where required.",
      "HIGH",
      16
    ),
    checklistSeed(
      toolMap.get("GitHub"),
      "[Business] Repository Visibility and Sharing Control",
      "Assess whether repository visibility, outside collaborator use, and public sharing are controlled according to data classification.",
      "CRITICAL",
      20
    ),
    checklistSeed(
      toolMap.get("GitHub"),
      "[Business] Secret Scanning and Push Protection Readiness",
      "Review whether secret scanning and push protection are enabled for business-critical repositories handling sensitive information.",
      "CRITICAL",
      20
    ),
    checklistSeed(
      toolMap.get("GitHub"),
      "[Business] Branch Protection and Change Approval Discipline",
      "Validate that business-critical repositories enforce review, protection, and controlled deployment paths before code reaches production.",
      "HIGH",
      16
    ),
    checklistSeed(
      toolMap.get("GitHub"),
      "[Business] Third-Party GitHub App and Token Governance",
      "Check whether GitHub Apps, PATs, and automation tokens are approved, reviewed, and rotated based on risk and necessity.",
      "HIGH",
      14
    ),

    checklistSeed(
      toolMap.get("GitHub Copilot"),
      "[Team] Copilot License Assignment and Role Governance",
      "Confirm that Copilot licenses are assigned only to approved teams and reviewed periodically for necessity and risk.",
      "HIGH",
      14
    ),
    checklistSeed(
      toolMap.get("GitHub Copilot"),
      "[Team] Enterprise AI Controls and Feature Policy Review",
      "Validate that Copilot feature availability is centrally controlled through enterprise policies rather than unmanaged local discretion.",
      "CRITICAL",
      18
    ),
    checklistSeed(
      toolMap.get("GitHub Copilot"),
      "[Team] Feedback Collection and Data Sharing Preference Control",
      "Check whether feedback collection or related sharing settings are disabled unless explicitly approved by governance.",
      "HIGH",
      14
    ),
    checklistSeed(
      toolMap.get("GitHub Copilot"),
      "[Business] Content Exclusion and Sensitive Repository Scope",
      "Review whether repositories containing restricted code or regulated logic are excluded from AI assistance where required.",
      "CRITICAL",
      20
    ),
    checklistSeed(
      toolMap.get("GitHub Copilot"),
      "[Business] Secure Coding Standard Alignment",
      "Assess whether teams have explicit review controls to validate Copilot-generated output against secure coding and architecture standards.",
      "CRITICAL",
      18
    ),
    checklistSeed(
      toolMap.get("GitHub Copilot"),
      "[Business] Open Source, IP, and License Review Safeguard",
      "Confirm that generated code is reviewed for licensing, intellectual property, and originality concerns before business adoption.",
      "HIGH",
      16
    ),
    checklistSeed(
      toolMap.get("GitHub Copilot"),
      "[Business] Model and Prompt Usage Restriction for Sensitive Workloads",
      "Check whether teams are prevented from using Copilot for sensitive algorithms, production secrets, or regulated code without approval.",
      "HIGH",
      14
    ),

    checklistSeed(
      toolMap.get("Claude"),
      "[Team] Workspace Ownership, SSO, and Managed Access Control",
      "Validate that Claude workspace access is governed through centralized identity and approved administrative ownership.",
      "CRITICAL",
      18
    ),
    checklistSeed(
      toolMap.get("Claude"),
      "[Team] Role Allocation and Cross-Team Access Restriction",
      "Review whether team members have only the minimum roles necessary and whether cross-functional access is justified and approved.",
      "HIGH",
      14
    ),
    checklistSeed(
      toolMap.get("Claude"),
      "[Team] Conversation and Usage Monitoring Review",
      "Confirm that administrative visibility, monitoring, or exported activity is reviewed for anomalous usage and policy breaches.",
      "HIGH",
      14
    ),
    checklistSeed(
      toolMap.get("Claude"),
      "[Business] Data Handling and Retention Alignment",
      "Check whether Claude data handling, retention, and deletion behavior align with enterprise commitments and regulatory expectations.",
      "CRITICAL",
      20
    ),
    checklistSeed(
      toolMap.get("Claude"),
      "[Business] Restricted Information Usage Guardrail",
      "Assess whether teams are prohibited from entering customer secrets, source code, payment data, or other restricted information without control evidence.",
      "CRITICAL",
      20
    ),
    checklistSeed(
      toolMap.get("Claude"),
      "[Business] Approved Use Cases and Human Review Requirement",
      "Validate that material business decisions or regulated customer outputs produced with Claude are subject to documented human review.",
      "HIGH",
      16
    ),
    checklistSeed(
      toolMap.get("Claude"),
      "[Business] Third-Party Connector and Data Source Governance",
      "Review whether connected data sources, if enabled, are limited to approved repositories and business use cases.",
      "HIGH",
      14
    ),

    checklistSeed(
      toolMap.get("Eraser"),
      "[Team] Workspace Ownership and Collaboration Governance",
      "Validate that Eraser workspaces have named owners, controlled membership, and documented responsibility for content shared across teams.",
      "HIGH",
      14
    ),
    checklistSeed(
      toolMap.get("Eraser"),
      "[Team] SSO and Access Lifecycle Control",
      "Check whether business or enterprise access to Eraser is governed through centralized identity and timely user deprovisioning.",
      "HIGH",
      14
    ),
    checklistSeed(
      toolMap.get("Eraser"),
      "[Team] Version History and Change Accountability",
      "Confirm that business-relevant architectural diagrams and AI-generated artifacts maintain sufficient change history for review.",
      "MEDIUM",
      10,
      false
    ),
    checklistSeed(
      toolMap.get("Eraser"),
      "[Business] Diagram Sharing and Public Link Restriction",
      "Assess whether public links, guest access, and cross-team sharing are controlled for architecture diagrams containing sensitive system information.",
      "CRITICAL",
      18
    ),
    checklistSeed(
      toolMap.get("Eraser"),
      "[Business] Architecture Data Classification Enforcement",
      "Review whether teams classify diagrams and avoid exposing confidential infrastructure, security design, or customer flow details in shared content.",
      "CRITICAL",
      18
    ),
    checklistSeed(
      toolMap.get("Eraser"),
      "[Business] AI Diagram Generation Usage Restriction",
      "Validate that AI-powered diagram generation is restricted from using sensitive production, customer, or regulatory information without approval.",
      "HIGH",
      14
    ),
    checklistSeed(
      toolMap.get("Eraser"),
      "[Business] Design Review and Approval Integration",
      "Confirm that diagrams used for production design or business approval are reviewed through formal architecture or control checkpoints.",
      "HIGH",
      14,
      false
    )
  ];

  for (const checklist of checklistSeeds) {
    await prisma.checklist_master.upsert({
      where: {
        parameter_name_tool_id: {
          parameter_name: checklist.parameter_name,
          tool_id: checklist.tool_id
        }
      },
      update: {
        ...checklist,
        is_active: true,
        is_deleted: false
      },
      create: checklist
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
