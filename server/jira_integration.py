import os
import requests
from requests.auth import HTTPBasicAuth

# Load credentials
JIRA_EMAIL="victoryqwei@gmail.com"
JIRA_TOKEN="ATATT3xFfGF0TNoCovy37QtBddON3P23XMH0O57ToNydWXrqHCSMvbWG8Fa1MUqXJ3wb24lUBZyU6GxezVkyPEdCaYaNSt6euieukCCzD8ZCKHDIl1ojJD5xcCZtZG_r_nCTL7oxpSWue8xJoZV5MiHUK0hOz05RyPKAuIxEWJNXY_Qi4fz6c3Y=0CDEE562"
JIRA_DOMAIN="ticketfairy.atlassian.net"

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
