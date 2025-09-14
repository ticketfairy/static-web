#!/usr/bin/env python3
"""
Example usage of the Claude Code Agent

This script demonstrates how to use the Claude agent to generate PRs from ticket descriptions.
"""

import os
import json
from dotenv import load_dotenv
from claude_agent import create_pr_from_ticket, ClaudeCodeAgent

# Load environment variables
load_dotenv()

def example_analyze_ticket():
    """Example: Analyze a ticket without creating a PR"""
    print("=== Analyzing Ticket ===")
    
    ticket_description = """
    Add a dark mode toggle to the user settings page. 
    
    Requirements:
    - Add a toggle switch in the settings UI
    - Store the preference in localStorage
    - Apply dark theme styles when enabled
    - Make sure all components respect the dark mode setting
    """
    
    # Initialize agent
    github_token = os.getenv("GITHUB_TOKEN")
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not github_token or not anthropic_api_key:
        print("Error: Please set GITHUB_TOKEN and ANTHROPIC_API_KEY environment variables")
        return
    
    agent = ClaudeCodeAgent(github_token, anthropic_api_key)
    
    # Analyze the ticket and get implementation
    analysis, code_changes = agent.analyze_ticket(ticket_description)
    
    print(f"Title: {analysis.title}")
    print(f"Description: {analysis.description}")
    print(f"Requirements: {analysis.requirements}")
    print(f"Files to modify: {analysis.files_to_modify}")
    print(f"Implementation plan: {analysis.implementation_plan}")
    print(f"Estimated complexity: {analysis.estimated_complexity}")
    print(f"Code changes generated: {len(code_changes)}")
    for change in code_changes:
        print(f"  - {change.file_path}: {change.change_description}")


def example_generate_pr():
    """Example: Generate a complete PR from a ticket description"""
    print("\n=== Generating PR ===")
    
    ticket_description = """
    Fix the login form validation bug where empty email field shows success message.
    
    The issue is in the LoginForm component - it's not properly validating the email field 
    before submission. We need to add proper email validation and show appropriate error messages.
    """
    
    # Replace with your actual repository
    repo_name = "your-username/your-repo"  # Change this!
    
    result = create_pr_from_ticket(
        ticket_description=ticket_description,
        repo_name=repo_name,
        base_branch="main"
    )
    
    if result.success:
        print(f"✅ PR created successfully!")
        print(f"PR URL: {result.pr_url}")
        print(f"PR Number: {result.pr_number}")
    else:
        print(f"❌ Failed to create PR: {result.error_message}")


def example_api_usage():
    """Example: How to use the API endpoints"""
    print("\n=== API Usage Examples ===")
    
    print("1. Check agent status:")
    print("GET /agent-status")
    print()
    
    print("2. Analyze a ticket:")
    print("POST /analyze-ticket")
    print(json.dumps({
        "ticket_description": "Add user authentication to the app",
        "repo_name": "owner/repo"  # optional
    }, indent=2))
    print()
    
    print("3. Generate a PR:")
    print("POST /generate-pr")
    print(json.dumps({
        "ticket_description": "Fix the navigation menu bug on mobile devices",
        "repo_name": "owner/repo",
        "base_branch": "main"  # optional, defaults to "main"
    }, indent=2))
    print()


if __name__ == "__main__":
    print("Claude Code Agent - Example Usage")
    print("=" * 40)
    
    # Check if environment variables are set
    github_token = os.getenv("GITHUB_TOKEN")
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not github_token:
        print("⚠️  GITHUB_TOKEN environment variable not set")
    if not anthropic_api_key:
        print("⚠️  ANTHROPIC_API_KEY environment variable not set")
    
    if github_token and anthropic_api_key:
        print("✅ Environment variables configured")
        
        # Run examples (uncomment to test)
        example_analyze_ticket()
        # example_generate_pr()  # Uncomment and set repo_name to test
    else:
        print("\n📝 To use the agent, set these environment variables:")
        print("export GITHUB_TOKEN=your_github_token")
        print("export ANTHROPIC_API_KEY=your_anthropic_key")
    
    example_api_usage()
