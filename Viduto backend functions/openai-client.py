import json
from typing import List, Dict, Any
from openai import AsyncOpenAI
from loguru import logger
from app.core.config import settings
from app.schemas.video import AIScriptOutput, AISceneOutput


class OpenAIClient:
    """Client for OpenAI services - handles script generation and revision analysis"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def generate_video_script(self, user_prompt: str) -> AIScriptOutput:
        """Generate video script from user prompt - equivalent to n8n AI Agent1"""
        
        system_message = """You are an AI assistant that converts structured user video prompts into a JSON scene breakdown.

Your tasks:
1. Parse the user prompt carefully.
2. Extract exactly 5 scenes from the "SCENE-BY-SCENE BREAKDOWN" section of the prompt.
3. Do not add, invent, or modify the visual or voiceover details. Only use what is explicitly written in the user prompt.
4. For each scene, output:
   - "scene_number": The number of the scene.
   - "visual_description": The visual text provided in the prompt.
   - "voiceover": The voiceover text provided in the prompt.
   - "shot_type": Leave empty string `""` if not specified in the prompt.
   - "sound_effects": Generate based on the visual description. Use descriptive, cinematic, and artistic language. Avoid psychological manipulation terms (e.g., tension, fear, FOMO). Focus on immersive, luxury, creative sound effects.
   - "music_direction": Generate based on the vibe, visual, and voiceover. Always use positive, artistic, and creative language. Avoid brand names. Describe styles in terms of cinematic build-ups, dramatic keys, uplifting progressions, refined accents, premium atmosphere, and emotional impact. Emphasize luxury, exclusivity, aspiration, power, and inspiration.
5. Always output valid JSON in this format:
{
  "scenes": [
    {
      "scene_number": 1,
      "visual_description": "...",
      "voiceover": "...",
      "shot_type": "...",
      "sound_effects": "...",
      "music_direction": "..."
    },
    ...
  ]
}
6. Do not include any explanations, markdown formatting, or extra text — only return the final JSON."""

        user_message = f"""
user prompt: {user_prompt}

Output in JSON format:
{{
  "scenes": [
    {{
      "scene_number": 1,
      "visual_description": "...",
      "voiceover": "...",
      "shot_type": "...",
      "sound_effects": "...",
      "music_direction": "..."
    }},
    ...
  ]
}}

5 scenes
"""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-1106-preview",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            logger.info(f"OpenAI script response: {content}")
            
            # Parse JSON response
            try:
                json_data = json.loads(content)
                scenes = [AISceneOutput(**scene) for scene in json_data["scenes"]]
                return AIScriptOutput(scenes=scenes)
            except json.JSONDecodeError:
                # Try to extract JSON from response if there's extra text
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    json_data = json.loads(json_match.group())
                    scenes = [AISceneOutput(**scene) for scene in json_data["scenes"]]
                    return AIScriptOutput(scenes=scenes)
                else:
                    raise ValueError("Could not parse JSON from OpenAI response")
                    
        except Exception as e:
            logger.error(f"Error generating script: {e}")
            raise
    
    async def analyze_revision_request(
        self, 
        revision_request: str, 
        existing_scenes: List[Dict[str, Any]],
        video_id: str
    ) -> List[Dict[str, Any]]:
        """Analyze revision request and determine what changes to make"""
        
        system_message = f"""
You are an AI Video Revision Agent.

You have access to the following tools:

**Tool 1: getManyRows**
Purpose: Fetches all existing video scenes from the database.
Output: An array of scenes. Each scene contains:
* scene_number
* voiceover_script
* visual_description
* music_description
* sound_effects

**Tool 2: updateRow**
Purpose: Updates a single scene in the database.
Parameters:
```json
{{
  "scene_number": (number, required),
  "voiceover_script": (string, optional),
  "visual_description": (string, optional),
  "music_description": (string, optional),
  "sound_effects": (string, optional)
}}
```

### Steps to Follow

1. Take the user_feedback: "{revision_request}"
2. I've provided all scenes below.
3. Search through each scene (check scene_number, voiceover, visual_description, music_description, sound_effects).
4. Identify the exact scene(s) and field(s) that the user_feedback refers to.
5. For each affected scene:
   * Use the **new updated values** for fields the user mentioned.
   * Use the **original values from the scenes** for fields the user did **not** mention.
   * Return a complete object containing all 4 fields (voiceover, visual_description, music_direction, sound_effects).
6. Return a JSON array summarizing what was changed (only include the fields that were actually modified).

### Example Response:
```json
[
  {{
    "scene_number": 1,
    "changed": {{
      "voiceover": "New voiceover text here"
    }}
  }}
]
```

Note: If a user asks to change the music or sound effects, always use positive, artistic, and creative language. Avoid words related to psychological manipulation. Instead, describe music in terms of cinematic build-ups, dramatic keys, uplifting progressions, refined accents, premium atmosphere, and emotional impact.

video_id: {video_id}
"""

        # Format existing scenes for the prompt
        scenes_text = "Existing scenes:\n"
        for scene in existing_scenes:
            scenes_text += f"""Scene {scene.get('scene_number', 'unknown')}:
- voiceover: {scene.get('voiceover', '')}
- visual_description: {scene.get('visual_description', '')}
- music_direction: {scene.get('music_direction', '')}
- sound_effects: {scene.get('sound_effects', '')}

"""

        user_message = f"{scenes_text}\nUser revision request: {revision_request}"

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-1106-preview",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            logger.info(f"OpenAI revision analysis: {content}")
            
            # Parse JSON response
            try:
                # Extract JSON from response
                import re
                json_match = re.search(r'\[.*\]', content, re.DOTALL)
                if json_match:
                    changes = json.loads(json_match.group())
                    return changes
                else:
                    # Fallback: try to parse entire response as JSON
                    changes = json.loads(content)
                    return changes
                    
            except json.JSONDecodeError as e:
                logger.error(f"Could not parse revision analysis JSON: {e}")
                logger.error(f"Response content: {content}")
                raise ValueError("Could not parse revision analysis response")
                
        except Exception as e:
            logger.error(f"Error analyzing revision: {e}")
            raise
