# -----------------------------------------------------------------------------
# File: gemini_client.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Client for interacting with Google Gemini API for generating AI responses
# -----------------------------------------------------------------------------

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Try different model names - gemini-1.5-flash is the latest, but fallback to others if needed
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


async def get_gemini_response(full_prompt: str) -> str:
    """
    Call Gemini API with a full prompt string.
    The prompt should already include system instructions and the user question.
    Returns the generated answer text.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in environment variables")
    
    # Use the provided full prompt directly
    prompt = full_prompt
    
    # List of models to try in order
    models_to_try = [
        GEMINI_MODEL,
        "gemini-2.5-flash",
        "gemini-flash-latest",
    ]
    # Remove duplicates while preserving order
    models_to_try = list(dict.fromkeys(models_to_try))
    
    last_error = None
    
    async with httpx.AsyncClient() as client:
        for model_name in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
                
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }
                
                response = await client.post(
                    url,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract the generated text from Gemini response
                    if "candidates" in data and len(data["candidates"]) > 0:
                        candidate = data["candidates"][0]
                        if "content" in candidate and "parts" in candidate["content"]:
                            parts = candidate["content"]["parts"]
                            if len(parts) > 0 and "text" in parts[0]:
                                return parts[0]["text"].strip()
                    
                    # Check for errors in response
                    if "error" in data:
                        error_msg = data["error"].get("message", "Unknown error")
                        last_error = f"Gemini API error: {error_msg}"
                        continue  # Try next model
                    
                    # If we got here but no text, try next model
                    last_error = "No text in response"
                    continue
                
                elif response.status_code == 404:
                    # Model not found, try next one
                    last_error = f"Model {model_name} not found (404)"
                    continue
                
                else:
                    # Other error, try next model
                    error_text = response.text[:200] if response.text else "No error details"
                    last_error = f"Status {response.status_code}: {error_text}"
                    continue
                    
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    last_error = f"Model {model_name} not found (404)"
                    continue
                else:
                    last_error = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
                    continue
            except httpx.HTTPError as e:
                last_error = f"HTTP error: {str(e)}"
                continue
            except Exception as e:
                last_error = f"Unexpected error: {str(e)}"
                continue
        
        # If we get here, all models failed
        raise Exception(
            f"Failed to get response from Gemini API after trying {len(models_to_try)} models. "
            f"Last error: {last_error}. "
            f"Please check your GEMINI_API_KEY and ensure it has access to Gemini models."
        )
