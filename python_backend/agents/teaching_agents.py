"""
Multi-Agent Teaching System
Parallel agents for synchronized AI teaching experience
"""
import os
import asyncio
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

OPENAI_BASE_URL = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
OPENAI_API_KEY = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY")


def get_llm(model: str = "gpt-4o-mini", temperature: float = 0.7) -> ChatOpenAI:
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        base_url=OPENAI_BASE_URL,
        api_key=OPENAI_API_KEY
    )


class ScriptPlannerAgent:
    def __init__(self):
        self.llm = get_llm("gpt-4o-mini", 0.7)
    
    async def plan_lesson_script(self, topic: str) -> Dict[str, Any]:
        prompt = f"""You are an expert educational content planner. Create a comprehensive, engaging lesson script for teaching about: {topic}

Create a detailed lesson with 8-12 segments. Each segment should feel like a real teacher explaining in class.

For EACH segment, provide:
1. narration_text: What the teacher says (2-4 sentences, natural speaking style)
2. board_text: What appears on the board (clean text, NO markdown symbols like # or *, use → for arrows, use actual math symbols)
3. board_style: "title", "heading", "text", "formula", "bullet", or "highlight"
4. needs_visual: true if this segment needs a diagram or image
5. visual_type: "diagram" or "image" (only if needs_visual is true)
6. visual_prompt: A detailed prompt for generating the visual (only if needs_visual is true)
7. clear_board: true if the board should be cleared before this segment

Rules for board_text:
- NO markdown symbols (no #, *, **, `, etc.)
- Use proper mathematical symbols: × ÷ ² ³ √ π θ α β γ Δ Σ Ω → ← ≤ ≥ ≠ ∞ °
- Use emojis for engagement: 📝 💡 ⭐ ✅ 🔬 🧠 📚 ⚛️ 🌍 🚀
- Use bullet points with • symbol
- Keep formulas clean and readable

Make the content comprehensive with:
- Clear introduction
- Key concepts explained in detail
- Multiple examples
- Visual demonstrations
- Summary

Return ONLY valid JSON in this format:
{{
  "title": "Lesson title",
  "introduction": "Brief overview",
  "segments": [
    {{
      "segment_id": "seg_1",
      "narration_text": "What the teacher says...",
      "board_text": "What appears on board...",
      "board_style": "title",
      "needs_visual": false,
      "visual_type": null,
      "visual_prompt": null,
      "clear_board": false,
      "pause_after_ms": 500
    }}
  ],
  "key_formulas": ["E = mc²", "F = ma"],
  "learning_objectives": ["Understand X", "Apply Y"]
}}"""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content="You are an educational content planner. Always respond with valid JSON only."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON parse error in script planner: {e}")
            return self._create_fallback_script(topic)
        except Exception as e:
            print(f"Error in script planner: {e}")
            return self._create_fallback_script(topic)
    
    def _create_fallback_script(self, topic: str) -> Dict[str, Any]:
        return {
            "title": f"📚 {topic}",
            "introduction": f"Today we'll learn about {topic}",
            "segments": [
                {
                    "segment_id": "seg_1",
                    "narration_text": f"Welcome everyone! Today we're going to explore {topic}. This is a fascinating subject that I'm excited to share with you.",
                    "board_text": f"📚 {topic}",
                    "board_style": "title",
                    "needs_visual": False,
                    "visual_type": None,
                    "visual_prompt": None,
                    "clear_board": True,
                    "pause_after_ms": 1000
                },
                {
                    "segment_id": "seg_2",
                    "narration_text": f"Let's start by understanding what {topic} really means and why it's important.",
                    "board_text": f"💡 Key Concepts:\n• Definition and overview\n• Main principles\n• Real-world applications",
                    "board_style": "text",
                    "needs_visual": True,
                    "visual_type": "diagram",
                    "visual_prompt": f"Educational concept map diagram showing the main components and relationships in {topic}",
                    "clear_board": False,
                    "pause_after_ms": 500
                }
            ],
            "key_formulas": [],
            "learning_objectives": [f"Understand the fundamentals of {topic}"]
        }


class NarrationAgent:
    def __init__(self):
        self.llm = get_llm("gpt-4o-mini", 0.8)
    
    async def expand_narration(self, base_text: str, topic: str, context: str = "") -> str:
        prompt = f"""Expand this narration for a teacher explaining {topic}:

Original: "{base_text}"
Context: {context}

Make it:
- Natural speaking style (conversational)
- 3-5 sentences
- Engaging and clear
- Include helpful examples

Return ONLY the expanded narration text, nothing else."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content="You are a friendly, engaging teacher. Speak naturally."),
                HumanMessage(content=prompt)
            ])
            return response.content.strip()
        except Exception as e:
            print(f"Error expanding narration: {e}")
            return base_text


class BoardWriterAgent:
    def __init__(self):
        self.llm = get_llm("gpt-4o-mini", 0.5)
    
    async def format_board_content(self, text: str, style: str, topic: str) -> str:
        prompt = f"""Format this text for a teacher's blackboard about {topic}:

Text: "{text}"
Style: {style}

Rules:
- NO markdown (no #, *, **, `)
- Use proper symbols: × ÷ ² ³ √ π → ← ≤ ≥ ≠ ∞ °
- Use bullet points with • symbol
- Add relevant emojis (📝 💡 ⭐ ✅ 🔬 🧠 📚)
- Keep it clean and readable
- For formulas, use proper notation

Return ONLY the formatted board text."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content="You format text for educational blackboards. Clean, visual, engaging."),
                HumanMessage(content=prompt)
            ])
            return self._clean_board_text(response.content.strip())
        except Exception as e:
            print(f"Error formatting board: {e}")
            return self._clean_board_text(text)
    
    def _clean_board_text(self, text: str) -> str:
        text = re.sub(r'#+ ?', '', text)
        text = text.replace('**', '')
        text = text.replace('*', '')
        text = text.replace('`', '')
        text = re.sub(r'^- ', '• ', text, flags=re.MULTILINE)
        
        replacements = {
            '->': '→', '<-': '←', '=>': '⇒',
            '>=': '≥', '<=': '≤', '!=': '≠',
            'sqrt': '√', 'pi': 'π', 'infinity': '∞',
            'degrees': '°', 'deg': '°'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text.strip()


class DeciderAgent:
    def __init__(self):
        self.llm = get_llm("gpt-4o-mini", 0.6)
    
    async def decide_next_action(
        self, 
        current_segment: Dict[str, Any],
        segments_remaining: int,
        board_fill_percentage: float
    ) -> Dict[str, Any]:
        prompt = f"""You are directing an AI lesson. Current state:
- Current segment: {json.dumps(current_segment, indent=2)}
- Segments remaining: {segments_remaining}
- Board fill: {board_fill_percentage}%

Decide:
1. should_clear_board: true if board is >70% full
2. should_generate_visual: true if segment needs_visual is true
3. visual_priority: 1-3 (1=immediate, 2=can wait, 3=optional)
4. pacing: "slow", "normal", or "fast"

Return JSON only:
{{"should_clear_board": bool, "should_generate_visual": bool, "visual_priority": int, "pacing": "normal"}}"""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content="You control lesson pacing. Respond with JSON only."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            return json.loads(content)
        except Exception as e:
            print(f"Error in decider: {e}")
            return {
                "should_clear_board": board_fill_percentage > 70,
                "should_generate_visual": current_segment.get("needs_visual", False),
                "visual_priority": 1,
                "pacing": "normal"
            }


class VisualGeneratorAgent:
    def __init__(self):
        self.llm = get_llm("gpt-4o-mini", 0.7)
    
    async def generate_visual_prompt(self, base_prompt: str, visual_type: str, topic: str) -> str:
        enhancement_prompt = f"""Enhance this prompt for generating an educational {visual_type} about {topic}:

Original: "{base_prompt}"

Make it:
- Detailed and specific
- Educational style
- Clean, clear visuals
- Professional quality

Return ONLY the enhanced prompt, nothing else."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content="You create detailed prompts for educational visuals."),
                HumanMessage(content=enhancement_prompt)
            ])
            return response.content.strip()
        except Exception as e:
            return base_prompt


script_planner = ScriptPlannerAgent()
narration_agent = NarrationAgent()
board_writer = BoardWriterAgent()
decider_agent = DeciderAgent()
visual_generator = VisualGeneratorAgent()
