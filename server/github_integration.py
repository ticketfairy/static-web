"""
GitHub Issues Integration for Ticket Fairy
"""

import requests
import os
from typing import Dict, Any, Optional


def create_github_issue(
    title: str, 
    description: str, 
    repo_name: str,
    github_token: Optional[str] = None,
    labels: Optional[list] = None,
    assignees: Optional[list] = None
) -> Dict[str, Any]:
    """
    Create a GitHub issue using the GitHub API
    
    Args:
        title: Issue title
        description: Issue description/body
        repo_name: Repository name in format "owner/repo"
        github_token: GitHub personal access token
        labels: Optional list of label names to add to the issue
        assignees: Optional list of GitHub usernames to assign to the issue
    
    Returns:
        Dict containing success status and issue details or error message
    """
    try:
        # Use provided token or environment variable
        token = github_token or os.getenv("GITHUB_TOKEN")
        if not token:
            return {
                "success": False,
                "error": "GitHub token is required. Set GITHUB_TOKEN environment variable or provide in request."
            }
        
        # Validate repo_name format
        if "/" not in repo_name:
            return {
                "success": False,
                "error": "Repository name must be in format 'owner/repo'"
            }
        
        # GitHub API endpoint
        api_url = f"https://api.github.com/repos/{repo_name}/issues"
        
        # Prepare headers
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        }
        
        # Prepare issue data
        issue_data = {
            "title": title,
            "body": description
        }
        
        # Add optional fields if provided
        if labels:
            issue_data["labels"] = labels
        if assignees:
            issue_data["assignees"] = assignees
        
        # Make API request
        response = requests.post(api_url, json=issue_data, headers=headers)
        
        if response.status_code == 201:
            # Success - issue created
            issue_data = response.json()
            return {
                "success": True,
                "issue_number": issue_data["number"],
                "issue_url": issue_data["html_url"],
                "issue_id": issue_data["id"],
                "title": issue_data["title"],
                "state": issue_data["state"],
                "created_at": issue_data["created_at"],
                "repository": repo_name
            }
        elif response.status_code == 401:
            return {
                "success": False,
                "error": "Authentication failed. Check your GitHub token permissions."
            }
        elif response.status_code == 403:
            return {
                "success": False,
                "error": "Forbidden. Your token may not have permission to create issues in this repository."
            }
        elif response.status_code == 404:
            return {
                "success": False,
                "error": f"Repository '{repo_name}' not found or you don't have access to it."
            }
        elif response.status_code == 422:
            error_details = response.json()
            return {
                "success": False,
                "error": f"Validation failed: {error_details.get('message', 'Unknown validation error')}"
            }
        else:
            return {
                "success": False,
                "error": f"GitHub API error: {response.status_code} - {response.text}"
            }
    
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Network error: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }


def get_repository_info(repo_name: str, github_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Get basic repository information to validate access
    
    Args:
        repo_name: Repository name in format "owner/repo"
        github_token: GitHub personal access token
    
    Returns:
        Dict containing repository info or error message
    """
    try:
        token = github_token or os.getenv("GITHUB_TOKEN")
        if not token:
            return {
                "success": False,
                "error": "GitHub token is required"
            }
        
        api_url = f"https://api.github.com/repos/{repo_name}"
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        response = requests.get(api_url, headers=headers)
        
        if response.status_code == 200:
            repo_data = response.json()
            return {
                "success": True,
                "name": repo_data["name"],
                "full_name": repo_data["full_name"],
                "description": repo_data.get("description", ""),
                "private": repo_data["private"],
                "has_issues": repo_data["has_issues"],
                "permissions": repo_data.get("permissions", {})
            }
        else:
            return {
                "success": False,
                "error": f"Could not access repository: {response.status_code}"
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def list_repository_labels(repo_name: str, github_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Get available labels for a repository
    
    Args:
        repo_name: Repository name in format "owner/repo"
        github_token: GitHub personal access token
    
    Returns:
        Dict containing labels list or error message
    """
    try:
        token = github_token or os.getenv("GITHUB_TOKEN")
        if not token:
            return {
                "success": False,
                "error": "GitHub token is required"
            }
        
        api_url = f"https://api.github.com/repos/{repo_name}/labels"
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        response = requests.get(api_url, headers=headers)
        
        if response.status_code == 200:
            labels_data = response.json()
            return {
                "success": True,
                "labels": [
                    {
                        "name": label["name"],
                        "color": label["color"],
                        "description": label.get("description", "")
                    }
                    for label in labels_data
                ]
            }
        else:
            return {
                "success": False,
                "error": f"Could not fetch labels: {response.status_code}"
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
