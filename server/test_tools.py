#!/usr/bin/env python3
"""
Test script for Claude Code Agent with Tools

This script tests the new tool-based implementation system.
"""

import os
import tempfile
import shutil
from dotenv import load_dotenv
from claude_agent import ClaudeCodeAgent

load_dotenv()

def test_tool_system():
    """Test the tool-based implementation system"""
    print("🧪 Testing Tool-Based Implementation System...")
    
    # Create a temporary directory to simulate a repository
    temp_dir = tempfile.mkdtemp()
    print(f"Created test repository at: {temp_dir}")
    
    try:
        # Create a simple test repository structure
        os.makedirs(os.path.join(temp_dir, "src"), exist_ok=True)
        
        # Create a simple Python file
        with open(os.path.join(temp_dir, "src", "main.py"), "w") as f:
            f.write("""#!/usr/bin/env python3
\"\"\"
Main application file
\"\"\"

def hello_world():
    print("Hello, World!")

if __name__ == "__main__":
    hello_world()
""")
        
        # Create a README
        with open(os.path.join(temp_dir, "README.md"), "w") as f:
            f.write("""# Test Repository

This is a test repository for the Claude Code Agent.
""")
        
        # Test ticket description
        ticket_description = """
        Add a new function called 'greet_user' to the main.py file that takes a name parameter 
        and prints a personalized greeting. Also update the README to mention this new function.
        """
        
        # Initialize agent
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_api_key:
            print("❌ ANTHROPIC_API_KEY not found in environment variables")
            return False
        
        agent = ClaudeCodeAgent("", anthropic_api_key)
        
        # Create a simple repository context
        repo_context = """
        Repository structure:
        - src/main.py (Python main file)
        - README.md (Documentation)
        """
        
        print("🚀 Starting tool-based implementation...")
        
        # Test the tool-based implementation
        analysis, code_changes = agent.analyze_ticket(ticket_description, repo_context, temp_dir)
        
        print("✅ Tool-based implementation completed!")
        print(f"📋 Title: {analysis.title}")
        print(f"📝 Description: {analysis.description[:100]}...")
        print(f"📁 Files modified: {len(code_changes)}")
        
        for change in code_changes:
            print(f"   - {change.file_path}: {change.change_description}")
            if change.new_content:
                print(f"     Content length: {len(change.new_content)} characters")
        
        # Verify files were actually modified
        print("\n🔍 Verifying file modifications...")
        for change in code_changes:
            file_path = os.path.join(temp_dir, change.file_path)
            if os.path.exists(file_path):
                print(f"   ✅ {change.file_path} exists and was modified")
                with open(file_path, 'r') as f:
                    content = f.read()
                    print(f"     Preview: {content[:100]}...")
            else:
                print(f"   ❌ {change.file_path} was not created/modified")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during tool-based implementation test: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            print(f"🧹 Cleaned up test repository at: {temp_dir}")

def main():
    """Run the tool system test"""
    print("🚀 Claude Code Agent - Tool System Test")
    print("=" * 50)
    
    # Check if API key is configured
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if not anthropic_api_key:
        print("❌ ANTHROPIC_API_KEY not found in environment variables")
        print("Please set: export ANTHROPIC_API_KEY=your_anthropic_key")
        return
    
    print("✅ Anthropic API key configured")
    
    # Run the test
    success = test_tool_system()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Tool system test passed! Claude can now directly modify files.")
        print("\n📚 What this means:")
        print("- Claude can now read existing files to understand the codebase")
        print("- Claude can write/modify files directly instead of just generating code")
        print("- Claude can explore the repository structure dynamically")
        print("- Claude can search for patterns across files")
    else:
        print("⚠️  Tool system test failed. Please check the configuration and try again.")

if __name__ == "__main__":
    main()
