import os
import requests
from requests.auth import HTTPBasicAuth

# Load credentials
JIRA_EMAIL=os.getenv("JIRA_EMAIL")
JIRA_TOKEN=os.getenv("JIRA_API_TOKEN")
JIRA_DOMAIN=os.getenv("JIRA_DOMAIN")
JIRA_PROJECT_KEY=os.getenv("JIRA_PROJECT_KEY")

url = f"https://{JIRA_DOMAIN}/rest/api/3/issue"

auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_TOKEN)
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

def create_jira_ticket(title, description):
    payload = {
        "fields": {
            "project": {
                "key": JIRA_PROJECT_KEY
            },
            "summary": title,
            "issuetype": {
                "name": "Task"  # e.g. Bug, Task, Story
            },
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "text": description,
                                "type": "text"
                            }
                        ]
                    }
                ]
            }
        }
    }

    response = requests.post(url, json=payload, headers=headers, auth=auth)
    
    if response.status_code == 201:
        response_data = response.json()
        ticket_key = response_data.get("key")
        
        # Construct the proper Jira ticket URL
        ticket_url = f"https://{JIRA_DOMAIN}/browse/{ticket_key}"
        
        # Return enhanced response with ticket URL
        return {
            "key": ticket_key,
            "self": ticket_url,  # This is what the frontend expects
            "id": response_data.get("id"),
            "success": True
        }
    else:
        print(f"Failed to create Jira ticket: {response.status_code} - {response.text}")
        return {
            "success": False,
            "error": f"Failed to create ticket: {response.status_code}"
        }
