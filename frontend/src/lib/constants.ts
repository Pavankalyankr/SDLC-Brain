/**
 * SDLC Brain — Application Constants
 */

export const APP_NAME = "SDLC Brain";
export const APP_DESCRIPTION = "AI-Powered Software Development Lifecycle Assistant";

export const ARTIFACT_STATUSES = {
  DRAFT: "draft",
  REVIEW: "review",
  APPROVED: "approved",
} as const;

export const TASK_TYPES = {
  AGILE: "agile",
  ARCHITECTURE: "architecture",
  DEVELOPMENT: "development",
  QA: "qa",
  CODE_REVIEW: "code_review",
  KNOWLEDGE: "knowledge",
  DEVOPS: "devops",
  PRODUCTION: "production",
  PROJECT_MANAGEMENT: "project_management",
} as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Projects", href: "/projects", icon: "FolderKanban" },
] as const;

export const PROJECT_NAV_ITEMS = [
  { label: "Overview", href: "", icon: "LayoutDashboard" },
  { label: "Requirements", href: "/requirements", icon: "ClipboardList" },
  { label: "Architecture", href: "/architecture", icon: "Network" },
  { label: "Development", href: "/development", icon: "Code2" },
  { label: "QA & Testing", href: "/qa", icon: "TestTube2" },
  { label: "Knowledge", href: "/knowledge", icon: "BookOpen" },
  { label: "Code Review", href: "/code-review", icon: "GitPullRequest" },
  { label: "DevOps", href: "/devops", icon: "Container" },
  { label: "Production", href: "/production", icon: "Server" },
] as const;

export const MODEL_CATEGORIES = {
  REASONING: "reasoning",
  ENGINEERING: "engineering",
} as const;
