import os
import requests
from requests.auth import HTTPBasicAuth

# Load credentials
JIRA_EMAIL = os.getenv("JIRA_EMAIL")
JIRA_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_DOMAIN = os.getenv("JIRA_DOMAIN")

url = f"https://{JIRA_DOMAIN}/rest/api/3/issue"

auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_TOKEN)
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

payload = {
    "fields": {
        "project": {
            "key": "SCRUM"  # <-- replace with your Jira project key
        },
        "summary": "Ticket created from Python script",
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
                            "text": "This issue was created via the Jira REST API using Python.",
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
    print("Issue created successfully:", response.json()["key"])
else:
    print("Failed to create issue:", response.status_code, response.text)
