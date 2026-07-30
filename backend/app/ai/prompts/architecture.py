"""
SDLC Brain — Architecture Prompt Templates

Prompts for generating system design, API contracts, and DB schemas.
"""

from app.ai.prompts.base import BasePromptBuilder


class ArchitecturePromptBuilder(BasePromptBuilder):
    """Builds prompts for architecture artifact generation."""

    def system_design_prompt(self, stories_text: str, instructions: str = "") -> tuple[str, list[dict]]:
        """Build prompt for approved stories → System Design."""
        system = self.build_system_prompt(
            role="an expert Software Architect with 15+ years of experience",
            instructions="""From the approved user stories, generate a comprehensive system architecture design.

Provide:
- **title**: A descriptive architecture title
- **description**: Overview of the architecture, key decisions, and rationale
- **architecture_type**: "monolith", "microservices", "serverless", or "event-driven"
- **components**: JSON array of component objects, each with:
  - name: Component/service name
  - type: "frontend", "backend", "database", "cache", "queue", "gateway", "storage"
  - description: What this component does
  - tech: Recommended technology
- **tech_stack**: JSON object with keys: frontend, backend, database, cache, messaging, deployment
- **mermaid_diagram**: A valid Mermaid flowchart diagram showing the system architecture
  - Use `graph TD` syntax
  - Show all components and their connections
  - Use descriptive labels

Guidelines:
- Design for scalability, maintainability, and security
- Follow SOLID and Clean Architecture principles
- Consider non-functional requirements (performance, security, availability)
- The Mermaid diagram must be valid and render correctly

Respond in valid JSON."""
        )

        user_content = f"## Approved User Stories\n\n{stories_text}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]

    def api_contracts_prompt(self, design_text: str, stories_text: str, instructions: str = "") -> tuple[str, list[dict]]:
        """Build prompt for system design → API Contracts."""
        system = self.build_system_prompt(
            role="an expert API Designer following RESTful best practices",
            instructions="""From the system design and user stories, generate comprehensive API contracts.

For each endpoint, provide:
- **method**: HTTP method (GET, POST, PUT, PATCH, DELETE)
- **path**: RESTful path (e.g., /api/v1/users/{id})
- **summary**: One-line description
- **description**: Detailed description of what the endpoint does
- **service**: Which backend service handles this
- **request_body**: JSON schema for the request body (if applicable)
- **response_body**: JSON schema for the response body
- **status_codes**: Array of {code, description} objects

Guidelines:
- Follow RESTful naming conventions
- Use proper HTTP methods and status codes
- Include authentication/authorization headers
- Version the API (v1)
- Include pagination for list endpoints
- Include error response schemas

Respond in valid JSON as an array of endpoint objects."""
        )

        user_content = f"## System Design\n\n{design_text}\n\n## User Stories\n\n{stories_text}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]

    def db_schema_prompt(self, design_text: str, api_text: str, instructions: str = "") -> tuple[str, list[dict]]:
        """Build prompt for system design + APIs → Database Schema."""
        system = self.build_system_prompt(
            role="an expert Database Architect",
            instructions="""From the system design and API contracts, generate a comprehensive database schema.

For each table, provide:
- **table_name**: snake_case table name
- **description**: What data this table stores
- **columns**: JSON array of column objects with:
  - name: Column name (snake_case)
  - type: SQL type (VARCHAR, INTEGER, TEXT, BOOLEAN, TIMESTAMP, UUID, JSONB, etc.)
  - nullable: true/false
  - primary_key: true/false
  - default: Default value (if any)
  - description: What this column stores
- **relationships**: JSON array of FK relationships with:
  - column: Local column name
  - references_table: Target table
  - references_column: Target column
  - on_delete: CASCADE, SET NULL, RESTRICT
- **indexes**: JSON array of index definitions
- **mermaid_diagram**: Mermaid ER diagram for this table and its relationships

Guidelines:
- Normalize to 3NF where appropriate
- Include audit columns (created_at, updated_at)
- Use UUIDs for primary keys
- Add proper indexes for query performance
- Include soft delete support where appropriate

Respond in valid JSON as an array of table objects."""
        )

        user_content = f"## System Design\n\n{design_text}\n\n## API Contracts\n\n{api_text}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]


architecture_prompts = ArchitecturePromptBuilder()
