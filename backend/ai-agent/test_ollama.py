#!/usr/bin/env python3

import ollama
import asyncio

async def test_ollama():
    try:
        print("Testing Ollama integration...")
        
        response = ollama.chat(
            model="smollm:1.7b",
            messages=[
                {"role": "user", "content": "Hello! Can you help me plan a trip to Paris?"}
            ]
        )
        
        print("Ollama response received:")
        print(response['message']['content'])
        
        return True
        
    except Exception as e:
        print(f"Error testing Ollama: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_ollama())
