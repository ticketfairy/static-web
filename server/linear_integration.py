import os
import requests
import json

# Load credentials from environment
LINEAR_API_TOKEN = os.getenv("LINEAR_API_TOKEN")
LINEAR_GRAPHQL_ENDPOINT = "https://api.linear.app/graphql"


def create_linear_issue(title, description, team_id=None):
    """
    Create a Linear issue using GraphQL API

    Args:
        title (str): Issue title
        description (str): Issue description in markdown
        team_id (str, optional): Team ID. If not provided, will use the first available team

    Returns:
        dict: Response containing success status, issue data, and URL
    """
    if not LINEAR_API_TOKEN:
        return {"success": False, "error": "LINEAR_API_TOKEN not configured"}

    headers = {"Authorization": LINEAR_API_TOKEN, "Content-Type": "application/json"}

    # If no team_id provided, get the first available team
    if not team_id:
        team_id = get_first_team_id()
        if not team_id:
            return {"success": False, "error": "No team found or unable to fetch teams"}

    # GraphQL mutation to create an issue
    mutation = """
    mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
            success
            issue {
                id
                identifier
                title
                url
                team {
                    id
                    name
                    key
                }
            }
        }
    }
    """

    variables = {
        "input": {"title": title, "description": description, "teamId": team_id}
    }

    payload = {"query": mutation, "variables": variables}

    try:
        response = requests.post(LINEAR_GRAPHQL_ENDPOINT, headers=headers, json=payload)

        if response.status_code == 200:
            data = response.json()

            if "errors" in data:
                return {"success": False, "error": f"GraphQL errors: {data['errors']}"}

            issue_create_result = data.get("data", {}).get("issueCreate", {})

            if issue_create_result.get("success"):
                issue = issue_create_result.get("issue", {})
                return {
                    "success": True,
                    "id": issue.get("id"),
                    "identifier": issue.get("identifier"),
                    "title": issue.get("title"),
                    "url": issue.get("url"),
                    "team": issue.get("team", {}),
                }
            else:
                return {"success": False, "error": "Issue creation failed"}
        else:
            return {
                "success": False,
                "error": f"HTTP error: {response.status_code} - {response.text}",
            }

    except Exception as e:
        return {"success": False, "error": f"Request failed: {str(e)}"}


def get_first_team_id():
    """
    Get the first available team ID for the authenticated user

    Returns:
        str: Team ID or None if no teams found
    """
    if not LINEAR_API_TOKEN:
        return None

    headers = {"Authorization": LINEAR_API_TOKEN, "Content-Type": "application/json"}

    # GraphQL query to get teams
    query = """
    query Teams {
        teams {
            nodes {
                id
                name
                key
            }
        }
    }
    """

    payload = {"query": query}

    try:
        response = requests.post(LINEAR_GRAPHQL_ENDPOINT, headers=headers, json=payload)

        if response.status_code == 200:
            data = response.json()

            if "errors" in data:
                print(f"GraphQL errors when fetching teams: {data['errors']}")
                return None

            teams = data.get("data", {}).get("teams", {}).get("nodes", [])

            if teams:
                # Return the first team's ID
                return teams[0].get("id")
            else:
                print("No teams found")
                return None
        else:
            print(
                f"HTTP error when fetching teams: {response.status_code} - {response.text}"
            )
            return None

    except Exception as e:
        print(f"Request failed when fetching teams: {str(e)}")
        return None


def get_user_teams():
    """
    Get all teams for the authenticated user

    Returns:
        list: List of team objects with id, name, and key
    """
    if not LINEAR_API_TOKEN:
        return []

    headers = {"Authorization": LINEAR_API_TOKEN, "Content-Type": "application/json"}

    query = """
    query Teams {
        teams {
            nodes {
                id
                name
                key
            }
        }
    }
    """

    payload = {"query": query}

    try:
        response = requests.post(LINEAR_GRAPHQL_ENDPOINT, headers=headers, json=payload)

        if response.status_code == 200:
            data = response.json()

            if "errors" in data:
                print(f"GraphQL errors when fetching teams: {data['errors']}")
                return []

            teams = data.get("data", {}).get("teams", {}).get("nodes", [])
            return teams
        else:
            print(
                f"HTTP error when fetching teams: {response.status_code} - {response.text}"
            )
            return []

    except Exception as e:
        print(f"Request failed when fetching teams: {str(e)}")
        return []
