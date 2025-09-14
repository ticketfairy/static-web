#!/usr/bin/env python3
"""
Test script for GitHub Issues integration
"""

import os
import sys
from dotenv import load_dotenv
from github_integration import create_github_issue, get_repository_info

load_dotenv()

def test_github_integration():
    """Test the GitHub integration with a sample ticket"""
    
    # Check if GitHub token is available
    github_token = os.getenv("GITHUB_TOKEN")
    if not github_token:
        print("❌ GITHUB_TOKEN environment variable not set")
        print("Please set your GitHub personal access token in the .env file")
        return False
    
    print("✅ GitHub token found")
    
    # Test repository - you can change this to your own repo for testing
    test_repo = input("Enter a test repository (owner/repo) or press Enter for demo: ").strip()
    if not test_repo:
        print("⚠️  No repository specified. Skipping live test.")
        return True
    
    print(f"🔍 Testing with repository: {test_repo}")
    
    # Test repository access
    print("\n1. Testing repository access...")
    repo_info = get_repository_info(test_repo, github_token)
    
    if repo_info["success"]:
        print(f"✅ Repository access successful")
        print(f"   - Name: {repo_info['full_name']}")
        print(f"   - Issues enabled: {repo_info['has_issues']}")
        print(f"   - Private: {repo_info['private']}")
        
        if not repo_info["has_issues"]:
            print("❌ Issues are not enabled for this repository")
            return False
    else:
        print(f"❌ Repository access failed: {repo_info['error']}")
        return False
    
    # Ask user if they want to create a test issue
    create_test = input("\n2. Create a test issue? (y/N): ").strip().lower()
    if create_test != 'y':
        print("✅ Repository validation successful. Skipping issue creation.")
        return True
    
    # Test issue creation
    print("\n3. Testing issue creation...")
    test_title = "Test Issue from Ticket Fairy"
    test_description = """This is a test issue created by the Ticket Fairy GitHub integration.

## What
- Test the GitHub Issues API integration
- Verify ticket creation functionality

## Why  
- Ensure the integration works correctly
- Validate authentication and permissions

## How
- Use the GitHub REST API
- Create issue with title and description
- Add appropriate labels if needed

**Note:** This is a test issue and can be safely closed."""
    
    result = create_github_issue(
        title=test_title,
        description=test_description,
        repo_name=test_repo,
        github_token=github_token,
        labels=["test", "ticket-fairy"]
    )
    
    if result["success"]:
        print(f"✅ Test issue created successfully!")
        print(f"   - Issue number: #{result['issue_number']}")
        print(f"   - URL: {result['issue_url']}")
        print(f"   - You can view it at: {result['issue_url']}")
        return True
    else:
        print(f"❌ Issue creation failed: {result['error']}")
        return False

def test_api_endpoints():
    """Test the Flask API endpoints"""
    print("\n🧪 Testing API endpoints...")
    
    try:
        import requests
        
        # Test the repository info endpoint
        print("1. Testing /github-repo-info endpoint...")
        response = requests.post(
            "http://localhost:4000/github-repo-info",
            json={"repo_name": "octocat/Hello-World"}
        )
        
        if response.status_code == 200:
            print("✅ Repository info endpoint working")
        else:
            print(f"❌ Repository info endpoint failed: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Could not test API endpoints (server may not be running): {e}")

if __name__ == "__main__":
    print("🐙 GitHub Issues Integration Test")
    print("=" * 40)
    
    success = test_github_integration()
    
    if success:
        print("\n🎉 GitHub integration test completed successfully!")
        test_api_endpoints()
    else:
        print("\n❌ GitHub integration test failed!")
        sys.exit(1)
    
    print("\n📋 Setup Instructions:")
    print("1. Make sure GITHUB_TOKEN is set in your .env file")
    print("2. The token needs 'repo' scope for private repos or 'public_repo' for public repos")
    print("3. Start the Flask server: python api.py")
    print("4. Test the integration in the Ticket Fairy web app")
