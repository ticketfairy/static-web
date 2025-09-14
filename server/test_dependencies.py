#!/usr/bin/env python3
"""
Test script to verify all dependencies are working correctly
"""

import os
from dotenv import load_dotenv

load_dotenv()

def test_anthropic():
    """Test Anthropic client initialization"""
    try:
        import anthropic
        print("✅ Anthropic package imported successfully")
        
        # Test client initialization (without making API calls)
        api_key = os.getenv("ANTHROPIC_API_KEY", "test-key")
        client = anthropic.Anthropic(api_key=api_key)
        print("✅ Anthropic client initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Anthropic test failed: {e}")
        return False

def test_github():
    """Test GitHub client initialization"""
    try:
        from github import Github
        print("✅ PyGithub package imported successfully")
        
        # Test client initialization (without making API calls)
        token = os.getenv("GITHUB_TOKEN", "test-token")
        client = Github(token)
        print("✅ GitHub client initialized successfully")
        return True
    except Exception as e:
        print(f"❌ GitHub test failed: {e}")
        return False

def test_git():
    """Test GitPython"""
    try:
        import git
        print("✅ GitPython package imported successfully")
        return True
    except Exception as e:
        print(f"❌ GitPython test failed: {e}")
        return False

def test_httpx():
    """Test httpx version"""
    try:
        import httpx
        print(f"✅ httpx package imported successfully (version: {httpx.__version__})")
        
        # Test client initialization
        client = httpx.Client()
        client.close()
        print("✅ httpx client initialized successfully")
        return True
    except Exception as e:
        print(f"❌ httpx test failed: {e}")
        return False

def test_claude_agent():
    """Test Claude agent import and initialization"""
    try:
        from claude_agent import ClaudeCodeAgent
        print("✅ ClaudeCodeAgent imported successfully")
        
        # Test initialization with dummy credentials
        agent = ClaudeCodeAgent("dummy-github-token", "dummy-anthropic-key")
        print("✅ ClaudeCodeAgent initialized successfully")
        return True
    except Exception as e:
        print(f"❌ ClaudeCodeAgent test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Claude Agent Dependencies")
    print("=" * 50)
    
    tests = [
        ("httpx", test_httpx),
        ("Anthropic", test_anthropic),
        ("GitHub", test_github),
        ("GitPython", test_git),
        ("Claude Agent", test_claude_agent),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        results.append(test_func())
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    
    passed = sum(results)
    total = len(results)
    
    for i, (test_name, _) in enumerate(tests):
        status = "✅ PASS" if results[i] else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All dependencies are working correctly!")
    else:
        print("⚠️  Some dependencies have issues. Please check the error messages above.")
        print("\n🔧 Troubleshooting steps:")
        print("1. Make sure you're in the correct virtual environment")
        print("2. Run: pip install -r requirements.txt")
        print("3. If httpx issues persist, run: pip install httpx==0.27.2")
        print("4. Check that all environment variables are set correctly")

if __name__ == "__main__":
    main()
