#!/usr/bin/env python3
"""
Test script for unique branch naming functionality
"""

import sys
import os

# Add the server directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from claude_agent import ClaudeCodeAgent, TicketAnalysis

def test_unique_branch_naming():
    """Test the unique branch naming functionality"""
    
    # Create a mock agent (we don't need real API keys for this test)
    agent = ClaudeCodeAgent("fake_github_token", "fake_anthropic_key")
    
    # Test cases
    test_cases = [
        {
            "description": "PROJ-123: Add user authentication to login page",
            "expected_prefix": "feature/proj-123-",
            "should_contain": "add-user-authentication"
        },
        {
            "description": "Fix the navigation bug in mobile view when users scroll down",
            "expected_prefix": "feature/ticket-",
            "should_contain": "fix-the-navigation-bug"
        },
        {
            "description": "ABC-456 - Implement new dashboard feature with charts and graphs",
            "expected_prefix": "feature/abc-456-",
            "should_contain": "implement-new-dashboard"
        },
        {
            "description": "Update the homepage styling to match the new brand guidelines",
            "expected_prefix": "feature/ticket-",
            "should_contain": "update-the-homepage-styling"
        }
    ]
    
    print("Testing unique branch naming...")
    print("=" * 60)
    
    all_passed = True
    generated_branches = []
    
    for i, test_case in enumerate(test_cases, 1):
        description = test_case["description"]
        expected_prefix = test_case["expected_prefix"]
        should_contain = test_case["should_contain"]
        
        try:
            # Extract ticket number
            ticket_number = agent.extract_ticket_number(description)
            
            # Create title from description
            title = agent.create_title_from_description(description)
            
            # Create mock analysis
            analysis = TicketAnalysis(
                title=title,
                description=description,
                requirements=[],
                files_to_modify=[],
                implementation_plan=[],
                estimated_complexity="medium",
                ticket_number=ticket_number
            )
            
            # Generate branch name
            branch_name = agent.create_unique_branch_name(analysis, description)
            
            # Check if branch name meets expectations
            prefix_ok = branch_name.startswith(expected_prefix) or (expected_prefix == "feature/ticket-" and branch_name.startswith("feature/ticket-"))
            contains_ok = should_contain.lower() in branch_name.lower()
            is_unique = branch_name not in generated_branches
            
            if prefix_ok and contains_ok and is_unique:
                status = "✅ PASS"
            else:
                status = "❌ FAIL"
                all_passed = False
            
            generated_branches.append(branch_name)
            
            print(f"Test {i}: {status}")
            print(f"  Description: {description[:50]}{'...' if len(description) > 50 else ''}")
            print(f"  Ticket Number: {ticket_number}")
            print(f"  Title: {title}")
            print(f"  Branch: {branch_name}")
            print(f"  Expected prefix: {expected_prefix}")
            print(f"  Should contain: {should_contain}")
            print(f"  Prefix OK: {prefix_ok}, Contains OK: {contains_ok}, Unique: {is_unique}")
            print()
            
        except Exception as e:
            print(f"Test {i}: ❌ ERROR - {e}")
            all_passed = False
    
    print("=" * 60)
    print("Generated branch names:")
    for i, branch in enumerate(generated_branches, 1):
        print(f"  {i}. {branch}")
    
    print(f"\nUnique branches: {len(set(generated_branches))} / {len(generated_branches)}")
    
    if all_passed and len(set(generated_branches)) == len(generated_branches):
        print("🎉 All tests passed! Branch names are unique and meaningful.")
    else:
        print("❌ Some tests failed or branches are not unique!")
    
    return all_passed

def test_edge_cases():
    """Test edge cases for branch naming"""
    
    print("\nTesting edge cases...")
    print("=" * 60)
    
    agent = ClaudeCodeAgent("fake_github_token", "fake_anthropic_key")
    
    edge_cases = [
        {
            "description": "",
            "name": "Empty description"
        },
        {
            "description": "A" * 200,  # Very long description
            "name": "Very long description"
        },
        {
            "description": "Fix bug with special chars: @#$%^&*()!",
            "name": "Special characters"
        },
        {
            "description": "Multiple    spaces   and\n\nnewlines",
            "name": "Multiple spaces and newlines"
        }
    ]
    
    for i, case in enumerate(edge_cases, 1):
        try:
            title = agent.create_title_from_description(case["description"])
            ticket_number = agent.extract_ticket_number(case["description"])
            
            analysis = TicketAnalysis(
                title=title,
                description=case["description"],
                requirements=[],
                files_to_modify=[],
                implementation_plan=[],
                estimated_complexity="medium",
                ticket_number=ticket_number
            )
            
            branch_name = agent.create_unique_branch_name(analysis, case["description"])
            
            print(f"Edge Case {i}: ✅ {case['name']}")
            print(f"  Branch: {branch_name}")
            print(f"  Length: {len(branch_name)}")
            print()
            
        except Exception as e:
            print(f"Edge Case {i}: ❌ {case['name']} - ERROR: {e}")

if __name__ == "__main__":
    success = test_unique_branch_naming()
    test_edge_cases()
    
    if success:
        print("\n🎉 All tests passed! The unique branch naming should prevent duplicate PR errors.")
    else:
        print("\n❌ Some tests failed. Please review the implementation.")
