"""
SDLC Brain — Production Prompt Templates

Full RCA pipeline:
  1. Classify incident
  2. Investigate (logs + codebase + architecture)
  3. Root Cause Analysis
  4. Impact Analysis
  5. Mitigation Runbook
  6. Proposed Code Fix + Patch
"""

from app.ai.prompts.base import BasePromptBuilder


class ProductionPromptBuilder(BasePromptBuilder):

    def rca_prompt(
        self,
        incident_title: str,
        raw_logs: str,
        architecture_text: str,
        codebase_text: str,
        severity: str = "",
        service: str = "",
    ) -> tuple[str, list[dict]]:
        """Build prompt for full incident RCA pipeline."""
        system = self.build_system_prompt(
            role="a Senior Site Reliability Engineer (SRE) performing Root Cause Analysis on a production incident",
            instructions="""You are given:
1. An incident report with logs/stack traces
2. The system architecture
3. The actual source code from the project workspace

Perform a thorough investigation and respond with a JSON object containing ALL of the following fields:

{
  "classification": "Short category like 'cache_timeout', 'db_connection_pool', 'memory_leak', 'null_pointer', 'api_rate_limit', 'auth_failure'",
  "root_cause": "Detailed root cause analysis. Trace through the architecture and code to explain exactly what happened and why. Reference specific files and line patterns when possible.",
  "impact": "Impact analysis: what services are affected, what users experience, data integrity concerns, SLA impact.",
  "affected_files": ["list", "of", "file/paths", "that", "are", "involved"],
  "mitigation_runbook": "Step-by-step mitigation runbook for a DevOps engineer to stop the bleeding RIGHT NOW. Include specific commands, config changes, and rollback steps. Use numbered steps.",
  "proposed_fix": "Explanation of the permanent code fix needed. Describe what needs to change and why.",
  "code_patch": "The actual code changes as a unified diff. Show the file path, the old code, and the new code. Format as:\\n--- a/path/to/file\\n+++ b/path/to/file\\n@@ ... @@\\n-old line\\n+new line",
  "confidence": 0.85,
  "severity_assessment": "Your assessment: low, medium, high, or critical",
  "title": "A concise incident title"
}

IMPORTANT RULES:
- Trace the incident through Architecture → Service → Code to find the root cause
- Reference specific files from the codebase when explaining the root cause
- The mitigation_runbook should be actionable RIGHT NOW (restart service, scale up, rollback, etc.)
- The code_patch should be a real, applicable diff
- Properly escape all newlines as \\n in JSON string values
- Respond ONLY with valid JSON. No markdown wrapping."""
        )

        user_content = f"## Incident Report\n"
        if incident_title:
            user_content += f"**Title:** {incident_title}\n"
        if severity:
            user_content += f"**Severity:** {severity}\n"
        if service:
            user_content += f"**Affected Service:** {service}\n"

        user_content += f"\n### Raw Logs / Stack Trace\n```\n{raw_logs}\n```"

        if architecture_text:
            user_content += f"\n\n## System Architecture\n{architecture_text}"

        if codebase_text:
            user_content += f"\n\n## Source Code\n{codebase_text}"

        return system, [{"role": "user", "content": user_content}]


# Singleton
production_prompts = ProductionPromptBuilder()
