"""
Claude Code Agent for GitHub PR Generation

This module implements a Claude-powered agent that can:
1. Analyze ticket descriptions
2. Connect to GitHub repositories
3. Generate code changes based on ticket requirements
4. Create pull requests with the generated changes
"""

import os
import json
import tempfile
import shutil
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

import anthropic
from github import Github
from github.Repository import Repository
from git import Repo
import requests
from dotenv import load_dotenv

load_dotenv()


@dataclass
class TicketAnalysis:
    """Structured representation of ticket analysis results"""
    title: str
    description: str
    requirements: List[str]
    files_to_modify: List[str]
    implementation_plan: List[str]
    estimated_complexity: str  # "low", "medium", "high"


@dataclass
class CodeChange:
    """Represents a code change to be made"""
    file_path: str
    original_content: str
    new_content: str
    change_description: str


@dataclass
class PRResult:
    """Result of PR creation"""
    success: bool
    pr_url: Optional[str] = None
    pr_number: Optional[int] = None
    error_message: Optional[str] = None


class ClaudeCodeAgent:
    """
    Main agent class that orchestrates the ticket-to-PR process
    """
    
    def __init__(self, github_token: str, anthropic_api_key: str):
        """
        Initialize the Claude Code Agent
        
        Args:
            github_token: GitHub personal access token
            anthropic_api_key: Anthropic API key for Claude
        """
        self.github = Github(github_token)
        self.claude = anthropic.Anthropic(api_key=anthropic_api_key)
        self.temp_dir = None
        
    def analyze_ticket(self, ticket_description: str, repository_context: str = "") -> TicketAnalysis:
        """
        Analyze a ticket description using Claude to extract requirements and implementation plan
        
        Args:
            ticket_description: The ticket description to analyze
            repository_context: Optional context about the repository structure
            
        Returns:
            TicketAnalysis object with structured analysis results
        """
        prompt = f"""
        You are a senior software engineer analyzing a ticket for implementation. 
        
        Ticket Description:
        {ticket_description}
        
        Repository Context:
        {repository_context}
        
        Please analyze this ticket and provide a structured response in JSON format with the following fields:
        
        {{
            "title": "A concise title for the implementation",
            "description": "A clear description of what needs to be implemented",
            "requirements": ["List of specific requirements extracted from the ticket"],
            "files_to_modify": ["List of files that likely need to be modified (use your best judgment)"],
            "implementation_plan": ["Step-by-step implementation plan"],
            "estimated_complexity": "low|medium|high"
        }}
        
        Focus on:
        1. Extracting clear, actionable requirements
        2. Identifying which files might need changes
        3. Creating a logical implementation sequence
        4. Assessing complexity realistically
        
        Return only the JSON object, no additional text.
        """
        
        try:
            response = self.claude.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            analysis_json = json.loads(response.content[0].text)
            
            return TicketAnalysis(
                title=analysis_json["title"],
                description=analysis_json["description"],
                requirements=analysis_json["requirements"],
                files_to_modify=analysis_json["files_to_modify"],
                implementation_plan=analysis_json["implementation_plan"],
                estimated_complexity=analysis_json["estimated_complexity"]
            )
            
        except Exception as e:
            # Fallback analysis if Claude fails
            return TicketAnalysis(
                title="Implement ticket requirements",
                description=ticket_description,
                requirements=[ticket_description],
                files_to_modify=[],
                implementation_plan=["Analyze requirements", "Implement changes", "Test implementation"],
                estimated_complexity="medium"
            )
    
    def clone_repository(self, repo_name: str, branch: str = "main") -> Tuple[Repository, str]:
        """
        Clone a GitHub repository to a temporary directory
        
        Args:
            repo_name: Repository name in format "owner/repo"
            branch: Branch to clone (default: main)
            
        Returns:
            Tuple of (GitHub Repository object, local path to cloned repo)
        """
        # Get repository object
        repo = self.github.get_repo(repo_name)
        
        # Create temporary directory
        self.temp_dir = tempfile.mkdtemp()
        local_path = os.path.join(self.temp_dir, "repo")
        
        # Clone repository
        clone_url = f"https://{self.github._Github__requester._Requester__auth.token}@github.com/{repo_name}.git"
        git_repo = Repo.clone_from(clone_url, local_path, branch=branch)
        
        return repo, local_path
    
    def get_repository_structure(self, local_path: str, max_files: int = 50) -> str:
        """
        Get a summary of the repository structure for context
        
        Args:
            local_path: Path to the local repository
            max_files: Maximum number of files to include in summary
            
        Returns:
            String representation of repository structure
        """
        structure = []
        repo_path = Path(local_path)
        
        # Common directories to prioritize
        priority_dirs = ["src", "lib", "app", "components", "services", "utils", "api"]
        
        # Common file extensions to include
        code_extensions = {".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".cpp", ".c", ".go", ".rs", ".php"}
        
        files_added = 0
        
        # First, add priority directories
        for priority_dir in priority_dirs:
            priority_path = repo_path / priority_dir
            if priority_path.exists() and priority_path.is_dir():
                for file_path in priority_path.rglob("*"):
                    if (file_path.is_file() and 
                        file_path.suffix in code_extensions and 
                        files_added < max_files):
                        rel_path = file_path.relative_to(repo_path)
                        structure.append(str(rel_path))
                        files_added += 1
        
        # Then add other important files
        for file_path in repo_path.rglob("*"):
            if (file_path.is_file() and 
                file_path.suffix in code_extensions and 
                files_added < max_files and
                str(file_path.relative_to(repo_path)) not in structure):
                rel_path = file_path.relative_to(repo_path)
                structure.append(str(rel_path))
                files_added += 1
        
        return "\n".join(sorted(structure))
    
    def generate_code_changes(self, analysis: TicketAnalysis, local_repo_path: str) -> List[CodeChange]:
        """
        Generate code changes based on ticket analysis
        
        Args:
            analysis: TicketAnalysis object with implementation requirements
            local_repo_path: Path to the local repository
            
        Returns:
            List of CodeChange objects
        """
        changes = []
        repo_structure = self.get_repository_structure(local_repo_path)
        
        # Read existing files that might need modification
        existing_files_content = {}
        for file_path in analysis.files_to_modify:
            full_path = os.path.join(local_repo_path, file_path)
            if os.path.exists(full_path):
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        existing_files_content[file_path] = f.read()
                except Exception as e:
                    print(f"Could not read {file_path}: {e}")
        
        prompt = f"""
        You are a senior software engineer implementing the following ticket:
        
        Title: {analysis.title}
        Description: {analysis.description}
        Requirements: {', '.join(analysis.requirements)}
        Implementation Plan: {', '.join(analysis.implementation_plan)}
        
        Repository Structure:
        {repo_structure}
        
        Existing Files Content:
        {json.dumps(existing_files_content, indent=2)}
        
        Please generate the necessary code changes to implement this ticket. For each file that needs to be modified or created, provide:
        
        1. The complete new content of the file
        2. A description of what changes were made
        
        Respond in JSON format:
        {{
            "changes": [
                {{
                    "file_path": "path/to/file.ext",
                    "new_content": "complete file content here",
                    "change_description": "description of changes made"
                }}
            ]
        }}
        
        Guidelines:
        - Write clean, maintainable, and well-documented code
        - Follow the existing code style and patterns in the repository
        - Include appropriate error handling
        - Add comments where necessary
        - Ensure the code is production-ready
        - Only include files that actually need changes
        
        Return only the JSON object, no additional text.
        """
        
        try:
            response = self.claude.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            changes_json = json.loads(response.content[0].text)
            
            for change_data in changes_json["changes"]:
                file_path = change_data["file_path"]
                original_content = existing_files_content.get(file_path, "")
                
                changes.append(CodeChange(
                    file_path=file_path,
                    original_content=original_content,
                    new_content=change_data["new_content"],
                    change_description=change_data["change_description"]
                ))
                
        except Exception as e:
            print(f"Error generating code changes: {e}")
            # Return empty changes if generation fails
            
        return changes
    
    def apply_changes(self, changes: List[CodeChange], local_repo_path: str) -> bool:
        """
        Apply code changes to the local repository
        
        Args:
            changes: List of CodeChange objects
            local_repo_path: Path to the local repository
            
        Returns:
            True if all changes applied successfully, False otherwise
        """
        try:
            for change in changes:
                file_path = os.path.join(local_repo_path, change.file_path)
                
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                
                # Write the new content
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(change.new_content)
                    
            return True
            
        except Exception as e:
            print(f"Error applying changes: {e}")
            return False
    
    def create_pull_request(self, repo: Repository, analysis: TicketAnalysis, 
                          changes: List[CodeChange], local_repo_path: str,
                          base_branch: str = "main") -> PRResult:
        """
        Create a pull request with the generated changes
        
        Args:
            repo: GitHub Repository object
            analysis: TicketAnalysis object
            changes: List of applied changes
            local_repo_path: Path to local repository
            base_branch: Base branch for the PR
            
        Returns:
            PRResult object with PR creation results
        """
        try:
            # Create a new branch
            branch_name = f"feature/{analysis.title.lower().replace(' ', '-')}"
            git_repo = Repo(local_repo_path)
            
            # Create and checkout new branch
            new_branch = git_repo.create_head(branch_name)
            new_branch.checkout()
            
            # Stage and commit changes
            git_repo.git.add(A=True)
            
            commit_message = f"{analysis.title}\n\n{analysis.description}"
            git_repo.index.commit(commit_message)
            
            # Push branch to remote
            origin = git_repo.remote('origin')
            origin.push(new_branch)
            
            # Create pull request description
            pr_description = f"""
## Description
{analysis.description}

## Requirements
{chr(10).join(f'- {req}' for req in analysis.requirements)}

## Implementation Plan
{chr(10).join(f'{i+1}. {step}' for i, step in enumerate(analysis.implementation_plan))}

## Changes Made
{chr(10).join(f'- **{change.file_path}**: {change.change_description}' for change in changes)}

## Complexity
{analysis.estimated_complexity.capitalize()}

---
*This PR was generated automatically by Claude Code Agent*
            """
            
            # Create the pull request
            pr = repo.create_pull(
                title=analysis.title,
                body=pr_description.strip(),
                head=branch_name,
                base=base_branch
            )
            
            return PRResult(
                success=True,
                pr_url=pr.html_url,
                pr_number=pr.number
            )
            
        except Exception as e:
            return PRResult(
                success=False,
                error_message=str(e)
            )
    
    def generate_pr_from_ticket(self, ticket_description: str, repo_name: str, 
                               base_branch: str = "main") -> PRResult:
        """
        Complete workflow: analyze ticket and generate PR
        
        Args:
            ticket_description: Description of the ticket to implement
            repo_name: GitHub repository name (owner/repo)
            base_branch: Base branch for the PR
            
        Returns:
            PRResult object with the final result
        """
        try:
            # Step 1: Clone repository
            repo, local_path = self.clone_repository(repo_name, base_branch)
            
            # Step 2: Get repository context
            repo_structure = self.get_repository_structure(local_path)
            
            # Step 3: Analyze ticket
            analysis = self.analyze_ticket(ticket_description, repo_structure)
            
            # Step 4: Generate code changes
            changes = self.generate_code_changes(analysis, local_path)
            
            if not changes:
                return PRResult(
                    success=False,
                    error_message="No code changes were generated"
                )
            
            # Step 5: Apply changes
            if not self.apply_changes(changes, local_path):
                return PRResult(
                    success=False,
                    error_message="Failed to apply code changes"
                )
            
            # Step 6: Create pull request
            result = self.create_pull_request(repo, analysis, changes, local_path, base_branch)
            
            return result
            
        except Exception as e:
            return PRResult(
                success=False,
                error_message=f"Workflow failed: {str(e)}"
            )
            
        finally:
            # Cleanup temporary directory
            if self.temp_dir and os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
    
    def __del__(self):
        """Cleanup temporary directory on object destruction"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)


# Convenience function for easy usage
def create_pr_from_ticket(ticket_description: str, repo_name: str, 
                         github_token: str = None, anthropic_api_key: str = None,
                         base_branch: str = "main") -> PRResult:
    """
    Convenience function to create a PR from a ticket description
    
    Args:
        ticket_description: Description of the ticket to implement
        repo_name: GitHub repository name (owner/repo)
        github_token: GitHub token (defaults to GITHUB_TOKEN env var)
        anthropic_api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
        base_branch: Base branch for the PR
        
    Returns:
        PRResult object with the final result
    """
    if not github_token:
        github_token = os.getenv("GITHUB_TOKEN")
    if not anthropic_api_key:
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        
    if not github_token or not anthropic_api_key:
        return PRResult(
            success=False,
            error_message="GitHub token and Anthropic API key are required"
        )
    
    agent = ClaudeCodeAgent(github_token, anthropic_api_key)
    return agent.generate_pr_from_ticket(ticket_description, repo_name, base_branch)
