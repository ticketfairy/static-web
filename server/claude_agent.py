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
import re
import hashlib
import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

import anthropic
from anthropic import RateLimitError
from github import Github
from github.Repository import Repository
from git import Repo
import requests
from dotenv import load_dotenv

load_dotenv()

# Budget constants to prevent token overuse and wandering behavior
MAX_ITERATIONS = 10
MAX_TOOL_CALLS = 10          # hard stop
MAX_READS = 3               # read_file/peek_file counts toward this
MAX_SEARCHES = 2            # search_files
RESPONSE_MAX_TOKENS = 2500   # keep outputs short


@dataclass
class TicketAnalysis:
    """Structured representation of ticket analysis results"""
    title: str
    description: str
    requirements: List[str]
    files_to_modify: List[str]
    implementation_plan: List[str]
    estimated_complexity: str  # "low", "medium", "high"
    ticket_number: Optional[str] = None  # JIRA ticket number (e.g., "PROJ-123")


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
        try:
            self.github = Github(github_token) if github_token else None
            self.claude = anthropic.Anthropic(api_key=anthropic_api_key)
            self.temp_dir = None
            self.current_repo_path = None  # Track current repository path for tools
        except Exception as e:
            print(f"Error initializing Claude Code Agent: {e}")
            raise

    def _get_file_tools(self):
        """
        Define the file operation tools that Claude can use
        """
        return [
            {
                "name": "read_file",
                "description": "Read the contents of a file in the repository",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "Relative path to the file from repository root"
                        }
                    },
                    "required": ["file_path"]
                }
            },
            {
                "name": "write_file",
                "description": "Write content to a file in the repository (creates or overwrites)",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "Relative path to the file from repository root"
                        },
                        "content": {
                            "type": "string",
                            "description": "Complete content to write to the file"
                        }
                    },
                    "required": ["file_path", "content"]
                }
            },
            {
                "name": "list_directory",
                "description": "List files and directories in a given path",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "directory_path": {
                            "type": "string",
                            "description": "Relative path to the directory from repository root (empty string for root)"
                        }
                    },
                    "required": ["directory_path"]
                }
            },
            {
                "name": "search_files",
                "description": "Search for text patterns in files within the repository",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "pattern": {
                            "type": "string",
                            "description": "Text pattern to search for"
                        },
                        "file_extension": {
                            "type": "string",
                            "description": "Optional file extension filter (e.g., '.py', '.js')"
                        }
                    },
                    "required": ["pattern"]
                }
            },
            {
                "name": "peek_file",
                "description": "Read first/last N lines of a file plus a symbol outline to reduce tokens",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "Relative path to the file from repository root"
                        },
                        "head": {
                            "type": "integer",
                            "description": "Lines from top",
                            "default": 80
                        },
                        "tail": {
                            "type": "integer", 
                            "description": "Lines from bottom",
                            "default": 60
                        }
                    },
                    "required": ["file_path"]
                }
            },
            {
                "name": "read_files",
                "description": "Read multiple small files at once; each is truncated to 2KB",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "files": {
                            "type": "array",
                            "items": {"type": "string"},
                            "maxItems": 5,
                            "description": "List of file paths to read"
                        },
                        "truncate_bytes": {
                            "type": "integer",
                            "default": 2048,
                            "description": "Maximum bytes per file"
                        }
                    },
                    "required": ["files"]
                }
            }
        ]

    def _execute_tool(self, tool_name: str, tool_input: dict) -> dict:
        """
        Execute a file operation tool
        """
        if not self.current_repo_path:
            return {"error": "No repository path set. Cannot execute file operations."}
        
        try:
            if tool_name == "read_file":
                file_path = os.path.join(self.current_repo_path, tool_input["file_path"])
                if not os.path.exists(file_path):
                    return {"error": f"File not found: {tool_input['file_path']}"}
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return {"content": content}
            
            elif tool_name == "write_file":
                file_path = os.path.join(self.current_repo_path, tool_input["file_path"])
                
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(tool_input["content"])
                return {"success": f"File written successfully: {tool_input['file_path']}"}
            
            elif tool_name == "list_directory":
                dir_path = os.path.join(self.current_repo_path, tool_input["directory_path"])
                if not os.path.exists(dir_path):
                    return {"error": f"Directory not found: {tool_input['directory_path']}"}
                
                items = []
                for item in os.listdir(dir_path):
                    item_path = os.path.join(dir_path, item)
                    items.append({
                        "name": item,
                        "type": "directory" if os.path.isdir(item_path) else "file"
                    })
                return {"items": items}
            
            elif tool_name == "search_files":
                pattern = tool_input["pattern"]
                file_extension = tool_input.get("file_extension")
                matches = []
                
                for root, dirs, files in os.walk(self.current_repo_path):
                    # Skip hidden directories and common build/cache directories
                    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'venv', 'dist', 'build']]
                    
                    for file in files:
                        if file.startswith('.'):
                            continue
                        
                        if file_extension and not file.endswith(file_extension):
                            continue
                        
                        file_path = os.path.join(root, file)
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()
                                if pattern in content:
                                    rel_path = os.path.relpath(file_path, self.current_repo_path)
                                    # Find line numbers where pattern occurs
                                    lines = content.split('\n')
                                    line_numbers = [i+1 for i, line in enumerate(lines) if pattern in line]
                                    matches.append({
                                        "file": rel_path,
                                        "line_numbers": line_numbers[:5]  # Limit to first 5 matches per file
                                    })
                        except (UnicodeDecodeError, PermissionError):
                            continue
                
                return {"matches": matches[:20]}  # Limit to 20 files
            
            elif tool_name == "peek_file":
                file_path = os.path.join(self.current_repo_path, tool_input["file_path"])
                if not os.path.exists(file_path):
                    return {"error": f"File not found: {tool_input['file_path']}"}
                
                head = int(tool_input.get("head", 80))
                tail = int(tool_input.get("tail", 60))
                
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()
                    
                    head_block = "".join(lines[:head])
                    tail_block = "".join(lines[-tail:]) if tail > 0 and len(lines) > head else ""
                    
                    # Quick-and-dirty outline - find function/class definitions
                    outline = []
                    for i, line in enumerate(lines):
                        stripped = line.strip()
                        if re.match(r'^\s*(export\s+)?(class|function|const|let|var|def|interface|type)\b', stripped):
                            outline.append(f"L{i+1}: {stripped}")
                    
                    return {
                        "head": head_block,
                        "tail": tail_block,
                        "outline": outline[:120],  # Limit outline entries
                        "total_lines": len(lines)
                    }
                except Exception as e:
                    return {"error": f"Could not read file: {str(e)}"}
            
            elif tool_name == "read_files":
                files = tool_input["files"]
                truncate_bytes = int(tool_input.get("truncate_bytes", 2048))
                results = {}
                
                for file_path in files:
                    full_path = os.path.join(self.current_repo_path, file_path)
                    if not os.path.exists(full_path):
                        results[file_path] = {"error": f"File not found: {file_path}"}
                        continue
                    
                    try:
                        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read(truncate_bytes)
                            if f.read(1):  # Check if there's more content
                                content += "\n... (truncated)"
                        
                        # Add a quick outline for each file
                        lines = content.split('\n')
                        outline = []
                        for i, line in enumerate(lines):
                            stripped = line.strip()
                            if re.match(r'^\s*(export\s+)?(class|function|const|let|var|def|interface|type)\b', stripped):
                                outline.append(f"L{i+1}: {stripped}")
                        
                        results[file_path] = {
                            "content": content,
                            "outline": outline[:20],  # Limit outline
                            "truncated": len(content) >= truncate_bytes
                        }
                    except Exception as e:
                        results[file_path] = {"error": f"Could not read file: {str(e)}"}
                
                return {"files": results}
            
            else:
                return {"error": f"Unknown tool: {tool_name}"}
                
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}"}

    def extract_keywords(self, ticket: str) -> List[str]:
        """
        Extract relevant keywords from ticket description for targeted searches
        
        Args:
            ticket: The ticket description to analyze
            
        Returns:
            List of relevant keywords for searching
        """
        # Extract alphanum words ≥ 3 chars, drop very common words
        words = re.findall(r'[A-Za-z0-9_-]{3,}', ticket)
        stop = {"the", "and", "with", "from", "into", "that", "this", "ticket", 
                "add", "update", "create", "implement", "fix", "bug", "feature"}
        uniq = []
        for w in words:
            lw = w.lower()
            if lw not in stop and lw not in uniq:
                uniq.append(lw)
        return uniq[:6]  # keep it tight

    def _prune_messages(self, messages: List[dict], max_user_msgs: int = 6, max_assistant_msgs: int = 6) -> List[dict]:
        """
        Prune message history to keep context short and avoid token explosion
        
        Args:
            messages: List of message dictionaries
            max_user_msgs: Maximum number of user messages to keep
            max_assistant_msgs: Maximum number of assistant messages to keep
            
        Returns:
            Pruned list of messages
        """
        pruned = []
        user_count = assistant_count = 0
        
        # Keep system/first prompt + the most recent few
        for m in reversed(messages):
            role = m["role"]
            if role == "user" and user_count < max_user_msgs:
                pruned.append(m)
                user_count += 1
            elif role == "assistant" and assistant_count < max_assistant_msgs:
                pruned.append(m)
                assistant_count += 1
            elif role not in ("user", "assistant"):
                pruned.append(m)
        
        return list(reversed(pruned))

    def extract_ticket_number(self, ticket_description: str) -> Optional[str]:
        """
        Extract JIRA ticket number from ticket description
        
        Args:
            ticket_description: The ticket description to analyze
            
        Returns:
            Ticket number if found (e.g., "PROJ-123"), None otherwise
        """
        # Common JIRA ticket patterns:
        # - PROJ-123
        # - ABC-456
        # - TICKET-789
        # Look for pattern: uppercase letters, dash, numbers
        patterns = [
            r'\b([A-Z]{2,10}-\d+)\b',  # Standard JIRA format (e.g., PROJ-123)
            r'\b([A-Z]+\d+)\b',        # Alternative format (e.g., PROJ123)
        ]
        
        for pattern in patterns:
            match = re.search(pattern, ticket_description)
            if match:
                return match.group(1)
        
        return None

    def create_title_from_description(self, description: str) -> str:
        """
        Create a meaningful title from ticket description
        
        Args:
            description: The ticket description
            
        Returns:
            A clean, meaningful title for the ticket
        """
        # Remove JIRA ticket numbers from the beginning
        clean_desc = re.sub(r'^[A-Z]+-\d+:?\s*', '', description.strip())
        
        # Take first line or first sentence
        first_line = clean_desc.split('\n')[0].strip()
        if not first_line:
            first_line = clean_desc[:100].strip()
        
        # Clean up and truncate
        title = first_line[:80].strip()
        if not title:
            title = "Implement ticket requirements"
            
        return title

    def create_unique_branch_name(self, analysis: TicketAnalysis, ticket_description: str) -> str:
        """
        Create a unique branch name based on ticket content
        
        Args:
            analysis: TicketAnalysis object
            ticket_description: Original ticket description
            
        Returns:
            Unique branch name
        """
        # Start with ticket number if available
        if analysis.ticket_number:
            prefix = analysis.ticket_number.lower()
        else:
            # Create a short hash from the description for uniqueness
            desc_hash = hashlib.md5(ticket_description.encode()).hexdigest()[:8]
            prefix = f"ticket-{desc_hash}"
        
        # Create slug from title
        title_slug = analysis.title.lower()
        title_slug = re.sub(r'[^a-z0-9\s-]', '', title_slug)  # Remove special chars
        title_slug = re.sub(r'\s+', '-', title_slug.strip())   # Replace spaces with dashes
        title_slug = re.sub(r'-+', '-', title_slug)            # Remove multiple dashes
        title_slug = title_slug.strip('-')                     # Remove leading/trailing dashes
        
        # Truncate if too long
        if len(title_slug) > 50:
            title_slug = title_slug[:50].rstrip('-')
        
        return f"feature/{prefix}-{title_slug}"
        
    def analyze_ticket(self, ticket_description: str, repository_context: str = "", local_repo_path: str = "") -> Tuple[TicketAnalysis, List[CodeChange]]:
        """
        Analyze a ticket description and implement the required changes using Claude with tools
        
        Args:
            ticket_description: The ticket description to implement
            repository_context: Optional context about the repository structure
            local_repo_path: Path to the local repository for file operations
            
        Returns:
            Tuple of (TicketAnalysis object, List of CodeChange objects)
        """
        # Set the current repository path for tools
        self.current_repo_path = local_repo_path
        
        # Extract ticket number from description
        ticket_number = self.extract_ticket_number(ticket_description)
        
        # Extract keywords for targeted searches
        keywords = self.extract_keywords(ticket_description)
        
        # Initial prompt for Claude with strict budget and targeted workflow
        initial_prompt = f"""You are a senior engineer with a strict tool and token budget.

OBJECTIVE
Implement the ticket with minimal exploration: produce concrete code edits and create a PR.

BUDGET RULES (hard):
- Max {MAX_TOOL_CALLS} tool calls total.
- Max {MAX_READS} reads (prefer peek_file over read_file).
- Max {MAX_SEARCHES} searches.
- After you have enough context for the first change, STOP EXPLORING and WRITE THE CHANGE.

WORKFLOW
1) Make a 3-step PLAN: (a) likely files, (b) exact searches, (c) specific edit(s) you'll attempt first.
2) Do at most {MAX_SEARCHES} targeted search_files using 1-3 precise keywords each.
3) For the TOP-1 candidate file per change, use peek_file. Only use read_file if the specific lines are needed to write.
4) Write changes EARLY via write_file. Prefer localized changes; follow project patterns you see.
5) If a file doesn't exist yet, create it in an appropriate directory.

OUTPUT DISCIPLINE
- Keep responses short.
- Avoid repeating long excerpts; rely on outlines and peeks.
- If tool budgets are low/exhausted: proceed to write.

TICKET
{ticket_description}

SUGGESTED KEYWORDS (use these for targeted searches):
{', '.join(keywords) if keywords else 'No keywords extracted'}

REPO CONTEXT (paths only):
{repository_context[:12000] if repository_context else "N/A"}

AVAILABLE TOOLS:
- peek_file: Read first/last N lines + symbol outline (PREFERRED for exploration)
- read_files: Read multiple small files at once, truncated to 2KB each (efficient batching)
- read_file: Read complete file contents (use sparingly)
- write_file: Create or modify files
- list_directory: List files and directories
- search_files: Search for text patterns (use keywords above)

Begin by posting your PLAN, then act."""

        try:
            # Track changes made during the conversation
            files_modified = []
            
            # Budget tracking
            tool_calls_used = 0
            reads_used = 0
            searches_used = 0
            
            # Start the conversation with Claude
            messages = [{"role": "user", "content": [{"type": "text", "text": initial_prompt}]}]
            
            # Allow Claude to use tools iteratively with budget constraints
            iteration = 0
            
            while iteration < MAX_ITERATIONS:
                iteration += 1
                print(f"Claude iteration {iteration}")
                
                # Prune messages to avoid token explosion
                messages = self._prune_messages(messages)
                
                try:
                    response = self.claude.messages.create(
                        model="claude-sonnet-4-0",
                        max_tokens=RESPONSE_MAX_TOKENS,
                        messages=messages,
                        tools=self._get_file_tools()
                    )
                except RateLimitError:
                    print("Rate limit encountered. Forcing write mode with reduced tokens.")
                    messages.append({"role": "user", "content": [{"type": "text", "text": "Rate limit encountered. Do not read more. Implement changes now."}]})
                    response = self.claude.messages.create(
                        model="claude-sonnet-4-0",
                        max_tokens=int(RESPONSE_MAX_TOKENS * 0.6),
                        messages=messages,
                        tools=self._get_file_tools()
                    )
                # Add Claude's response to messages
                messages.append({"role": "assistant", "content": response.content})
                
                # Check if Claude wants to use tools
                tool_calls = []
                for content_block in response.content:
                    if content_block.type == "tool_use":
                        tool_calls.append(content_block)
                
                if not tool_calls:
                    # Claude is done, break the loop
                    print("Claude finished implementation")
                    break
                
                # Execute tool calls with budget enforcement
                tool_results = []
                for tool_call in tool_calls:
                    print(f"Executing tool: {tool_call.name} with input: {tool_call.input}")
                    
                    # Check budget constraints
                    if tool_call.name in ("read_file", "peek_file", "read_files"):
                        if reads_used >= MAX_READS:
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": tool_call.id,
                                "content": json.dumps({"error": "read budget exhausted"})
                            })
                            continue
                        reads_used += 1
                    
                    if tool_call.name == "search_files":
                        if searches_used >= MAX_SEARCHES:
                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": tool_call.id,
                                "content": json.dumps({"error": "search budget exhausted"})
                            })
                            continue
                        searches_used += 1
                    
                    tool_calls_used += 1
                    if tool_calls_used >= MAX_TOOL_CALLS:
                        # Add a user message telling Claude the budget is out and to proceed to writing
                        messages.append({"role": "user", "content": [{"type": "text", "text": "Tool budget exhausted. Proceed to implement changes now."}]})
                        break
                    
                    result = self._execute_tool(tool_call.name, tool_call.input)
                    
                    # Track file modifications
                    if tool_call.name == "write_file" and "success" in result:
                        files_modified.append({
                            "file_path": tool_call.input["file_path"],
                            "change_description": f"Modified via {tool_call.name}"
                        })
                    
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_call.id,
                        "content": json.dumps(result)
                    })
                
                # Add tool results to messages
                if tool_results:
                    messages.append({"role": "user", "content": tool_results})
            
            # Create analysis from the ticket
            analysis = TicketAnalysis(
                title=self.create_title_from_description(ticket_description),
                description=ticket_description,
                requirements=[ticket_description],
                files_to_modify=[f["file_path"] for f in files_modified],
                implementation_plan=["Explore codebase", "Understand requirements", "Implement changes", "Test implementation"],
                estimated_complexity="medium",
                ticket_number=ticket_number
            )

            print(f"Analysis: {analysis}")
            
            # Create code changes from files modified
            code_changes = []
            for file_info in files_modified:
                file_path = file_info["file_path"]
                full_path = os.path.join(local_repo_path, file_path)
                
                # Read the new content
                new_content = ""
                if os.path.exists(full_path):
                    try:
                        with open(full_path, 'r', encoding='utf-8') as f:
                            new_content = f.read()
                    except Exception as e:
                        print(f"Could not read modified file {file_path}: {e}")
                
                code_changes.append(CodeChange(
                    file_path=file_path,
                    original_content="",  # We don't track original content in tool mode
                    new_content=new_content,
                    change_description=file_info["change_description"]
                ))

            print(f"Code changes: {code_changes}")
            
            return analysis, code_changes
            
        except Exception as e:
            print(f"Error in analyze_ticket with tools: {e}")
            import traceback
            traceback.print_exc()
            
            # Fallback analysis if Claude fails
            fallback_title = self.create_title_from_description(ticket_description)
            fallback_analysis = TicketAnalysis(
                title=fallback_title,
                description=ticket_description,
                requirements=[ticket_description],
                files_to_modify=[],
                implementation_plan=["Analyze requirements", "Implement changes", "Test implementation"],
                estimated_complexity="medium",
                ticket_number=ticket_number
            )
            
            # Create a simple fallback change
            fallback_change = CodeChange(
                file_path="IMPLEMENTATION_NOTES.md",
                original_content="",
                new_content=f"""# Implementation for: {fallback_title}

## Description
{ticket_description}

## Status
This is a placeholder implementation due to an error in tool-based code generation.
Please review the ticket requirements and implement manually.

## Error
{str(e)}
""",
                change_description=f"Created implementation notes for {fallback_title}"
            )
            
            return fallback_analysis, [fallback_change]
    
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
        
        # Create a more focused prompt
        repo_summary = repo_structure[:2000] if len(repo_structure) > 2000 else repo_structure
        files_summary = {}
        
        # Limit existing files content to avoid token limits
        for file_path, content in existing_files_content.items():
            if len(content) > 1000:
                files_summary[file_path] = content[:1000] + "\n... (truncated)"
            else:
                files_summary[file_path] = content
        
        prompt = f"""You are implementing this ticket:

TICKET: {analysis.title}

DESCRIPTION: {analysis.description}

REQUIREMENTS:
{chr(10).join(f'- {req}' for req in analysis.requirements[:5])}

REPOSITORY FILES (sample):
{repo_summary}

EXISTING FILES TO MODIFY:
{json.dumps(files_summary, indent=2) if files_summary else "No existing files provided"}

TASK: Generate code changes to implement this ticket.

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format:

{{
    "changes": [
        {{
            "file_path": "relative/path/to/file.ext",
            "new_content": "complete file content here",
            "change_description": "brief description of changes"
        }}
    ]
}}

RULES:
- Include at least 1 file change
- Use relative paths from repository root
- Provide complete file content, not just diffs
- Write production-ready code with proper error handling
- Follow existing code patterns if files exist
- If creating new files, use appropriate file extensions

Respond with JSON only, no markdown, no explanations."""
        
        try:
            print(f"Generating code changes for ticket: {analysis.title}")
            print(f"Repository structure has {len(repo_structure.split())} files")
            print(f"Existing files to modify: {analysis.files_to_modify}")
            
            try:
                response = self.claude.messages.create(
                    model="claude-3-5-sonnet-20240620",
                    max_tokens=RESPONSE_MAX_TOKENS,  # Use budget-constrained tokens
                    messages=[{"role": "user", "content": prompt}]
                )
            except RateLimitError:
                print("Rate limit in generate_code_changes. Using fallback approach.")
                # Return empty changes to trigger fallback
                return changes
            
            response_text = response.content[0].text
            print(f"Claude response length: {len(response_text)} characters")
            print(f"Claude response preview: {response_text[:200]}...")
            
            # Try to extract JSON from the response
            try:
                changes_json = json.loads(response_text)
            except json.JSONDecodeError as json_error:
                print(f"JSON parsing failed: {json_error}")
                print(f"Raw response: {response_text}")
                
                # Try to extract JSON from markdown code blocks
                import re
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
                if json_match:
                    try:
                        changes_json = json.loads(json_match.group(1))
                        print("Successfully extracted JSON from code block")
                    except json.JSONDecodeError:
                        print("Failed to parse JSON even from code block")
                        return changes
                else:
                    print("No JSON found in response")
                    return changes
            
            if "changes" not in changes_json:
                print(f"No 'changes' key in response: {changes_json}")
                return changes
            
            changes_list = changes_json["changes"]
            print(f"Found {len(changes_list)} changes to apply")
            
            for i, change_data in enumerate(changes_list):
                print(f"Processing change {i+1}: {change_data.get('file_path', 'unknown')}")
                
                if not all(key in change_data for key in ["file_path", "new_content", "change_description"]):
                    print(f"Skipping incomplete change data: {change_data}")
                    continue
                
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
            import traceback
            traceback.print_exc()
            # Return empty changes if generation fails
            
        # If no changes were generated, create a simple example change
        if not changes:
            print("No changes generated by Claude, creating fallback change")
            
            # Create a simple README or implementation file as fallback
            fallback_content = f"""# Implementation for: {analysis.title}

## Description
{analysis.description}

## Requirements
{chr(10).join(f'- {req}' for req in analysis.requirements)}

## Implementation Plan
{chr(10).join(f'{i+1}. {step}' for i, step in enumerate(analysis.implementation_plan))}

## Status
This is a placeholder implementation. Please review and modify as needed.

## Next Steps
- Review the requirements above
- Implement the actual functionality
- Add appropriate tests
- Update documentation
"""
            
            changes.append(CodeChange(
                file_path="IMPLEMENTATION_NOTES.md",
                original_content="",
                new_content=fallback_content,
                change_description=f"Created implementation notes for {analysis.title}"
            ))
            
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
                          ticket_description: str, base_branch: str = "main") -> PRResult:
        """
        Create a pull request with the generated changes
        
        Args:
            repo: GitHub Repository object
            analysis: TicketAnalysis object
            changes: List of applied changes
            local_repo_path: Path to local repository
            ticket_description: Original ticket description for unique branch naming
            base_branch: Base branch for the PR
            
        Returns:
            PRResult object with PR creation results
        """
        try:
            # Create a unique branch name based on ticket content
            branch_name = self.create_unique_branch_name(analysis, ticket_description)
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
            
            # Step 3: Analyze ticket and generate code changes
            analysis, changes = self.analyze_ticket(ticket_description, repo_structure, local_path)
            
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
            result = self.create_pull_request(repo, analysis, changes, local_path, ticket_description, base_branch)
            
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
