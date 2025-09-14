#!/usr/bin/env python3
"""
Test script for Claude Code Agent

Run this script to test the agent functionality without creating actual PRs.
"""

import os
import json
from dotenv import load_dotenv
from claude_agent import ClaudeCodeAgent

load_dotenv()

def test_ticket_analysis():
    """Test ticket analysis functionality"""
    print("🧪 Testing Ticket Analysis...")
    
    # Test ticket description
    ticket_description = """
    Add a search functionality to the product catalog page.
    
    Requirements:
    - Add a search input field at the top of the catalog
    - Implement real-time search filtering
    - Search should work on product name and description
    - Add a clear button to reset the search
    - Show "No results found" message when no products match
    - Maintain search state in URL for bookmarking
    
    Technical Notes:
    - Use debouncing to avoid excessive API calls
    - Implement case-insensitive search
    - Consider adding search analytics
    """
    
    try:
        # Initialize agent (GitHub token not needed for analysis only)
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_api_key:
            print("❌ ANTHROPIC_API_KEY not found in environment variables")
            return False
            
        agent = ClaudeCodeAgent("", anthropic_api_key)
        
        # Analyze ticket
        analysis = agent.analyze_ticket(ticket_description)
        
        print("✅ Ticket analysis completed!")
        print(f"📋 Title: {analysis.title}")
        print(f"📝 Description: {analysis.description[:100]}...")
        print(f"📋 Requirements ({len(analysis.requirements)}):")
        for i, req in enumerate(analysis.requirements, 1):
            print(f"   {i}. {req}")
        print(f"📁 Files to modify ({len(analysis.files_to_modify)}):")
        for file in analysis.files_to_modify:
            print(f"   - {file}")
        print(f"🔧 Implementation plan ({len(analysis.implementation_plan)}):")
        for i, step in enumerate(analysis.implementation_plan, 1):
            print(f"   {i}. {step}")
        print(f"⚡ Complexity: {analysis.estimated_complexity}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during ticket analysis: {e}")
        return False


def test_repository_structure_analysis():
    """Test repository structure analysis (requires GitHub token)"""
    print("\n🧪 Testing Repository Structure Analysis...")
    
    github_token = os.getenv("GITHUB_TOKEN")
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not github_token:
        print("⚠️  Skipping repository analysis - GITHUB_TOKEN not found")
        return True
    
    if not anthropic_api_key:
        print("❌ ANTHROPIC_API_KEY not found")
        return False
    
    try:
        agent = ClaudeCodeAgent(github_token, anthropic_api_key)
        
        # Test with a public repository (you can change this)
        test_repo = "octocat/Hello-World"  # Simple public repo
        
        print(f"📁 Analyzing repository: {test_repo}")
        
        # Clone and analyze structure
        repo, local_path = agent.clone_repository(test_repo)
        structure = agent.get_repository_structure(local_path)
        
        print("✅ Repository structure analysis completed!")
        print(f"📊 Repository: {repo.full_name}")
        print(f"📝 Description: {repo.description}")
        print(f"🌟 Stars: {repo.stargazers_count}")
        print(f"📁 Structure preview:")
        
        # Show first 10 lines of structure
        structure_lines = structure.split('\n')[:10]
        for line in structure_lines:
            print(f"   {line}")
        
        if len(structure.split('\n')) > 10:
            print(f"   ... and {len(structure.split('\n')) - 10} more files")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during repository analysis: {e}")
        return False


def test_api_endpoints():
    """Test API endpoint configuration"""
    print("\n🧪 Testing API Configuration...")
    
    # Check environment variables
    github_token = os.getenv("GITHUB_TOKEN")
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    
    print(f"🔑 GitHub Token: {'✅ Configured' if github_token else '❌ Missing'}")
    print(f"🔑 Anthropic API Key: {'✅ Configured' if anthropic_api_key else '❌ Missing'}")
    
    if github_token and anthropic_api_key:
        print("✅ All API credentials configured!")
        return True
    else:
        print("⚠️  Some credentials are missing. Set environment variables:")
        if not github_token:
            print("   export GITHUB_TOKEN=your_github_token")
        if not anthropic_api_key:
            print("   export ANTHROPIC_API_KEY=your_anthropic_key")
        return False


def main():
    """Run all tests"""
    print("🚀 Claude Code Agent Test Suite")
    print("=" * 50)
    
    results = []
    
    # Test 1: API Configuration
    results.append(test_api_endpoints())
    
    # Test 2: Ticket Analysis
    results.append(test_ticket_analysis())
    
    # Test 3: Repository Analysis (optional)
    results.append(test_repository_structure_analysis())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! The agent is ready to use.")
        print("\n📚 Next steps:")
        print("1. Run 'python example_usage.py' for usage examples")
        print("2. Start the Flask server: 'python api.py'")
        print("3. Test the API endpoints with your favorite HTTP client")
    else:
        print("⚠️  Some tests failed. Please check the configuration.")
        print("\n🔧 Troubleshooting:")
        print("1. Ensure all environment variables are set")
        print("2. Check API key validity")
        print("3. Verify network connectivity")


if __name__ == "__main__":
    main()
