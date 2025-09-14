#!/usr/bin/env python3
"""
Test script to check available Claude models
"""

import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

def test_models():
    """Test different Claude model names"""
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if not anthropic_api_key:
        print("❌ ANTHROPIC_API_KEY not found")
        return
    
    client = anthropic.Anthropic(api_key=anthropic_api_key)
    
    # Try different model names
    models_to_try = [
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-latest",
        "claude-3-5-sonnet",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307"
    ]
    
    for model in models_to_try:
        try:
            print(f"Testing model: {model}")
            response = client.messages.create(
                model=model,
                max_tokens=10,
                messages=[{"role": "user", "content": "Hello"}]
            )
            print(f"✅ {model} works!")
            print(f"Response: {response.content[0].text}")
            break
        except Exception as e:
            print(f"❌ {model} failed: {e}")
            continue
    
    print("Done testing models")

if __name__ == "__main__":
    test_models()
