# Claude Code Agent

A powerful AI agent that automatically generates GitHub pull requests from ticket descriptions using Claude AI.

## Features

- 🎯 **Intelligent Ticket Analysis**: Uses Claude to understand requirements and create implementation plans
- 🔍 **Repository Context Awareness**: Analyzes existing codebase structure and patterns
- 💻 **Automated Code Generation**: Generates production-ready code changes
- 🚀 **Seamless GitHub Integration**: Creates branches, commits, and pull requests automatically
- 📊 **Complexity Assessment**: Estimates implementation complexity (low/medium/high)
- 🔧 **Flexible API**: Easy integration with existing workflows

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

```bash
export GITHUB_TOKEN=your_github_personal_access_token
export ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Basic Usage

```python
from claude_agent import create_pr_from_ticket

# Generate a PR from a ticket description
result = create_pr_from_ticket(
    ticket_description="Add user authentication to the login page",
    repo_name="owner/repository-name"
)

if result.success:
    print(f"PR created: {result.pr_url}")
else:
    print(f"Error: {result.error_message}")
```

## API Endpoints

### 1. Generate PR

**POST** `/generate-pr`

Creates a complete pull request from a ticket description.

```json
{
  "ticket_description": "Fix the navigation menu bug on mobile devices",
  "repo_name": "owner/repo",
  "base_branch": "main",
  "github_token": "optional_token_override",
  "anthropic_api_key": "optional_key_override"
}
```

**Response:**

```json
{
  "success": true,
  "pr_url": "https://github.com/owner/repo/pull/123",
  "pr_number": 123,
  "message": "Successfully created PR #123"
}
```

### 2. Analyze Ticket

**POST** `/analyze-ticket`

Analyzes a ticket description without creating a PR.

```json
{
  "ticket_description": "Add dark mode toggle to settings",
  "repo_name": "owner/repo"
}
```

**Response:**

```json
{
  "success": true,
  "analysis": {
    "title": "Implement Dark Mode Toggle in Settings",
    "description": "Add a toggle switch to enable/disable dark mode...",
    "requirements": ["Add toggle component", "Implement theme switching"],
    "files_to_modify": ["src/components/Settings.tsx", "src/styles/theme.css"],
    "implementation_plan": ["Create toggle component", "Add theme context"],
    "estimated_complexity": "medium"
  }
}
```

### 3. Agent Status

**GET** `/agent-status`

Checks if the agent is properly configured.

```json
{
  "github_token_configured": true,
  "anthropic_api_key_configured": true,
  "agent_ready": true
}
```

## Configuration

### Required Environment Variables

- `GITHUB_TOKEN`: GitHub Personal Access Token with repo permissions
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude access

### GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Set the token as `GITHUB_TOKEN` environment variable

### Anthropic API Key Setup

1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Generate an API key
3. Set the key as `ANTHROPIC_API_KEY` environment variable

## Advanced Usage

### Custom Agent Configuration

```python
from claude_agent import ClaudeCodeAgent

# Initialize with custom settings
agent = ClaudeCodeAgent(
    github_token="your_token",
    anthropic_api_key="your_key"
)

# Analyze ticket with repository context
analysis = agent.analyze_ticket(
    ticket_description="Your ticket description",
    repository_context="Optional repo structure info"
)

# Generate PR with full control
result = agent.generate_pr_from_ticket(
    ticket_description="Your ticket",
    repo_name="owner/repo",
    base_branch="develop"
)
```

### Workflow Integration

The agent can be integrated into various workflows:

1. **Jira Integration**: Automatically create PRs from Jira tickets
2. **Slack Bots**: Generate PRs from Slack commands
3. **CI/CD Pipelines**: Automated code generation in deployment workflows
4. **Issue Tracking**: Convert GitHub issues to PRs

## How It Works

1. **Ticket Analysis**: Claude analyzes the ticket description to extract:

   - Requirements and acceptance criteria
   - Files that need modification
   - Implementation strategy
   - Complexity assessment

2. **Repository Context**: The agent clones the repository and analyzes:

   - Code structure and patterns
   - Existing components and utilities
   - Architecture and conventions

3. **Code Generation**: Claude generates production-ready code:

   - Follows existing code style
   - Includes proper error handling
   - Adds appropriate documentation
   - Maintains code quality standards

4. **PR Creation**: The agent automatically:
   - Creates a feature branch
   - Commits the changes
   - Pushes to GitHub
   - Opens a pull request with detailed description

## Best Practices

### Writing Good Ticket Descriptions

✅ **Good Example:**

```
Add user authentication to the login page

Requirements:
- Create a login form with email and password fields
- Add form validation for empty fields and email format
- Integrate with existing auth API endpoint
- Show loading state during authentication
- Redirect to dashboard on successful login
- Display error messages for failed attempts

Acceptance Criteria:
- Form validates input before submission
- Loading spinner shows during API call
- Error messages are user-friendly
- Successful login redirects to /dashboard
```

❌ **Poor Example:**

```
Fix login
```

### Repository Considerations

- Ensure the repository has a clear structure
- Include README files with setup instructions
- Use consistent naming conventions
- Maintain up-to-date documentation

### Security Notes

- Never commit API keys or tokens to the repository
- Use environment variables for sensitive configuration
- Regularly rotate GitHub tokens
- Monitor API usage and costs

## Troubleshooting

### Common Issues

**"GitHub token is required"**

- Ensure `GITHUB_TOKEN` environment variable is set
- Verify token has correct permissions

**"Repository not found"**

- Check repository name format (owner/repo)
- Verify token has access to the repository

**"Failed to apply code changes"**

- Check if files are locked or have permission issues
- Ensure repository is not corrupted

**"Claude API error"**

- Verify `ANTHROPIC_API_KEY` is correct
- Check API quota and billing status

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Examples

See `example_usage.py` for comprehensive examples including:

- Basic ticket analysis
- PR generation
- API endpoint usage
- Error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review example usage
3. Open a GitHub issue with detailed information
