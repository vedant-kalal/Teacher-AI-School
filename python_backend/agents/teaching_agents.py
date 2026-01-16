"""
Multi-Agent Teaching System
Advanced parallel agents for synchronized AI teaching experience with intelligent visual planning
"""
import os
import asyncio
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage


def get_llm(model: str = "gpt-4o-mini", temperature: float = 0.7) -> ChatOpenAI:
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        base_url=os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL"),
        api_key=os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "")
    )


class ScriptPlannerAgent:
    def __init__(self):
        pass
    
    async def plan_lesson_script(self, topic: str) -> Dict[str, Any]:
        llm = get_llm("gpt-4o-mini", 0.7)
        prompt = f"""You are an expert educational content planner. Create a comprehensive, engaging lesson script for teaching about: {topic}

Create a detailed lesson with 8-12 segments. Each segment should feel like a real teacher explaining in class.

For EACH segment, provide:
1. narration_text: What the teacher says (2-4 sentences, natural speaking style)
2. board_text: What appears on the board (clean text, NO markdown symbols like # or *, use → for arrows, use actual math symbols)
3. board_style: "title", "heading", "text", "formula", "bullet", or "highlight"
4. needs_visual: true if this segment needs a diagram or image
5. visual_type: "diagram", "image", "3d_model", or "video" (only if needs_visual is true)
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
            response = await llm.ainvoke([
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


class ScriptAnalyzerAgent:
    """
    Analyzes the FULL teaching script upfront to plan all visual content.
    This agent receives the complete script and decides what visuals are needed for each segment.
    """
    def __init__(self):
        pass
    
    async def analyze_script_for_visuals(self, script: Dict[str, Any], topic: str) -> Dict[str, Any]:
        llm = get_llm("gpt-4o", 0.6)
        
        full_script_text = self._extract_full_script_text(script)
        
        prompt = f"""You are an expert educational visual planner. You have the COMPLETE teaching script for a lesson about "{topic}".

FULL SCRIPT:
{full_script_text}

Your job is to analyze this entire script and plan ALL visual content (images, diagrams, 3D models, videos) that should be shown during the lesson.

For each visual, consider:
1. What moment in the narration would benefit most from a visual?
2. What type of visual would best illustrate the concept?
3. What should the visual contain to match what the teacher is explaining?

Create a comprehensive visual plan with these types:
- "image": Realistic photos or illustrations (planets, animals, objects, people, places)
- "diagram": Educational diagrams, flowcharts, concept maps, labeled illustrations
- "3d_model": 3D visualizations (molecules, geometric shapes, mechanical parts, anatomy)
- "video": Short animated sequences (processes, transformations, movements)

Return ONLY valid JSON:
{{
  "visual_plan": [
    {{
      "visual_id": "vis_1",
      "target_segment_id": "seg_2",
      "visual_type": "diagram",
      "trigger_phrase": "The exact phrase in narration when this visual should appear",
      "title": "Short title for the visual",
      "detailed_prompt": "Very detailed prompt for generating this visual, including style, colors, elements to include, labels, etc.",
      "importance": "critical" | "important" | "supplementary",
      "display_duration_ms": 5000,
      "position": "right" | "left" | "center" | "fullscreen"
    }}
  ],
  "total_visuals": 5,
  "visual_summary": "Brief summary of the visual strategy for this lesson"
}}

Create 4-8 strategically placed visuals that enhance the learning experience."""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You are an expert at planning educational visuals. Analyze the full script and plan visuals strategically."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            result = json.loads(content)
            print(f"📊 [Script Analyzer] Planned {len(result.get('visual_plan', []))} visuals for lesson")
            return result
        except Exception as e:
            print(f"Error in script analyzer: {e}")
            return {"visual_plan": [], "total_visuals": 0, "visual_summary": "Analysis failed"}
    
    def _extract_full_script_text(self, script: Dict[str, Any]) -> str:
        lines = []
        lines.append(f"Title: {script.get('title', 'Untitled')}")
        lines.append(f"Introduction: {script.get('introduction', '')}")
        lines.append("")
        
        for seg in script.get("segments", []):
            lines.append(f"[{seg.get('segment_id', 'unknown')}]")
            lines.append(f"Board ({seg.get('board_style', 'text')}): {seg.get('board_text', '')}")
            lines.append(f"Narration: {seg.get('narration_text', '')}")
            lines.append("")
        
        return "\n".join(lines)


class VisualCoordinatorAgent:
    """
    Coordinates the timing and sequencing of visual content during lesson delivery.
    Receives the visual plan and current lesson state to decide what to show and when.
    """
    def __init__(self):
        pass
    
    async def coordinate_visuals(
        self,
        visual_plan: List[Dict[str, Any]],
        current_segment_id: str,
        current_narration: str,
        segments_remaining: int,
        already_shown: List[str]
    ) -> Dict[str, Any]:
        llm = get_llm("gpt-4o-mini", 0.5)
        
        available_visuals = [v for v in visual_plan if v.get("visual_id") not in already_shown]
        
        if not available_visuals:
            return {"show_visual": False, "visual_to_show": None, "reason": "No visuals remaining"}
        
        prompt = f"""You are coordinating visual content for an AI lesson.

Current segment: {current_segment_id}
Current narration: "{current_narration}"
Segments remaining: {segments_remaining}
Already shown visuals: {already_shown}

Available visuals to show:
{json.dumps(available_visuals, indent=2)}

Decide:
1. Should we show a visual right now? (based on trigger_phrase matching current narration)
2. If yes, which visual? (prioritize by importance and relevance to current narration)
3. How long to display it?

Return JSON only:
{{
  "show_visual": true/false,
  "visual_to_show": "visual_id or null",
  "display_duration_ms": 5000,
  "reason": "Brief explanation of decision"
}}"""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You coordinate visual timing in educational lessons. Be strategic about when to show visuals."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            return json.loads(content)
        except Exception as e:
            print(f"Error in visual coordinator: {e}")
            segment_visuals = [v for v in available_visuals if v.get("target_segment_id") == current_segment_id]
            if segment_visuals:
                return {
                    "show_visual": True,
                    "visual_to_show": segment_visuals[0].get("visual_id"),
                    "display_duration_ms": 5000,
                    "reason": "Default to segment's planned visual"
                }
            return {"show_visual": False, "visual_to_show": None, "reason": "No matching visual"}


class VisualGeneratorAgent:
    """
    Generates visual content with FULL script context for accuracy.
    Receives the entire script to understand what the teacher is explaining.
    """
    def __init__(self):
        pass
    
    async def generate_enhanced_prompt(
        self,
        visual_info: Dict[str, Any],
        full_script: Dict[str, Any],
        topic: str
    ) -> Dict[str, Any]:
        llm = get_llm("gpt-4o", 0.7)
        
        script_context = self._get_relevant_context(visual_info, full_script)
        
        prompt = f"""You are creating a detailed prompt for generating an educational {visual_info.get('visual_type', 'image')}.

TOPIC: {topic}

FULL CONTEXT (what the teacher is explaining):
{script_context}

VISUAL REQUEST:
Title: {visual_info.get('title', 'Educational Visual')}
Original Prompt: {visual_info.get('detailed_prompt', '')}
Type: {visual_info.get('visual_type', 'image')}
Importance: {visual_info.get('importance', 'important')}

Create the BEST possible prompt for generating this visual. Include:
1. Specific visual elements to include
2. Style and aesthetic (educational, professional, clear)
3. Colors and composition
4. Labels or annotations if needed
5. Scale and perspective

For 3D models: describe the 3D structure, materials, lighting
For diagrams: describe layout, arrows, labels, color coding
For videos: describe the animation sequence, transitions

Return JSON:
{{
  "enhanced_prompt": "The complete, detailed prompt for image/diagram generation",
  "style_hints": "Additional style guidance",
  "negative_prompt": "What to avoid in the generation",
  "recommended_size": "1024x1024 or 1024x768",
  "visual_type": "image|diagram|3d_model|video"
}}"""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You create detailed prompts for educational visual content. Be specific and descriptive."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            result = json.loads(content)
            print(f"🎨 [Visual Generator] Enhanced prompt for: {visual_info.get('title', 'visual')}")
            return result
        except Exception as e:
            print(f"Error generating enhanced prompt: {e}")
            return {
                "enhanced_prompt": visual_info.get('detailed_prompt', f"Educational illustration about {topic}"),
                "style_hints": "Professional, educational, clear",
                "negative_prompt": "blurry, text, watermark",
                "recommended_size": "1024x1024",
                "visual_type": visual_info.get('visual_type', 'image')
            }
    
    def _get_relevant_context(self, visual_info: Dict[str, Any], full_script: Dict[str, Any]) -> str:
        target_segment = visual_info.get("target_segment_id", "")
        
        lines = [f"Topic: {full_script.get('title', 'Unknown')}"]
        lines.append(f"Introduction: {full_script.get('introduction', '')}")
        lines.append("")
        
        found_target = False
        for seg in full_script.get("segments", []):
            if seg.get("segment_id") == target_segment:
                found_target = True
                lines.append(">>> TARGET SEGMENT (visual should match this) <<<")
            
            lines.append(f"[{seg.get('segment_id')}] {seg.get('narration_text', '')}")
            
            if found_target and seg.get("segment_id") != target_segment:
                break
        
        return "\n".join(lines)


class NarrationAgent:
    """
    Enhanced speaking agent that narrates both board content AND describes visual content in sync.
    When a visual (image/diagram/3D model) is being displayed, the agent describes it naturally.
    """
    def __init__(self):
        pass
    
    async def expand_narration(
        self, 
        base_text: str, 
        topic: str, 
        board_content: str = "",
        visual_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate comprehensive narration that includes both board content and visual descriptions.
        
        Args:
            base_text: The original narration text
            topic: The lesson topic
            board_content: What's currently on the blackboard
            visual_context: Info about currently displayed visual (title, description, type)
        """
        llm = get_llm("gpt-4o-mini", 0.8)
        
        visual_section = ""
        if visual_context:
            visual_title = visual_context.get("title", "")
            visual_desc = visual_context.get("description", "")
            visual_type = visual_context.get("visual_type", "image")
            
            visual_section = f"""

VISUAL CURRENTLY DISPLAYED:
- Type: {visual_type}
- Title: {visual_title}
- Description: {visual_desc}

You MUST describe this visual naturally in your narration. Point to specific elements like:
- "As you can see in this {visual_type}..."
- "Notice how the..." or "Looking at this diagram..."
- "This image shows us..." or "In this visualization..."
- Describe specific elements: "The sphere here represents...", "These arrows indicate...", "The blue area shows..."
"""

        prompt = f"""You are a teacher explaining {topic}. Create natural spoken narration that combines:

1. THE BOARD CONTENT (what's written):
{board_content}

2. ORIGINAL NARRATION IDEA:
{base_text}
{visual_section}

Your narration should:
- Sound like a real teacher speaking to a class
- Be 4-6 sentences long
- Flow naturally between explaining the board content and the visual (if any)
- Use conversational language ("Now, let's look at...", "You can see here that...")
- If there's a visual, describe its specific elements in detail
- Make connections between the board text and the visual
- Be engaging and clear

Return ONLY the narration text. No quotes, no formatting, just what the teacher would say."""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You are a friendly, engaging teacher. Speak naturally and describe visuals in detail when present."),
                HumanMessage(content=prompt)
            ])
            result = response.content.strip()
            print(f"🎤 [Narration] Generated {len(result.split())} words" + (" (with visual)" if visual_context else ""))
            return result
        except Exception as e:
            print(f"Error expanding narration: {e}")
            return base_text
    
    async def describe_visual(
        self, 
        visual_info: Dict[str, Any], 
        topic: str,
        preceding_narration: str = ""
    ) -> str:
        """
        Generate a focused description of a visual element.
        Used when introducing a new visual during the lesson.
        """
        llm = get_llm("gpt-4o-mini", 0.7)
        
        visual_type = visual_info.get("visual_type", "image")
        title = visual_info.get("title", "")
        description = visual_info.get("detailed_prompt", visual_info.get("description", ""))
        
        prompt = f"""You are a teacher showing a {visual_type} to your class about {topic}.

Visual Title: {title}
Visual Description: {description}
What you just said: {preceding_narration}

Now describe this visual to your students in 2-3 sentences. Be specific about what they can see:
- Point out key elements ("Here you can see...")
- Explain what different parts represent
- Connect it to what you just explained

Return ONLY the visual description, nothing else."""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You describe educational visuals clearly and specifically."),
                HumanMessage(content=prompt)
            ])
            return response.content.strip()
        except Exception as e:
            print(f"Error describing visual: {e}")
            return f"Take a look at this {visual_type} showing {title}."


class BoardWriterAgent:
    def __init__(self):
        pass
    
    async def format_board_content(self, text: str, style: str, topic: str) -> str:
        llm = get_llm("gpt-4o-mini", 0.5)
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
            response = await llm.ainvoke([
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
        pass
    
    async def decide_next_action(
        self, 
        current_segment: Dict[str, Any],
        segments_remaining: int,
        board_fill_percentage: float
    ) -> Dict[str, Any]:
        llm = get_llm("gpt-4o-mini", 0.6)
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
            response = await llm.ainvoke([
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


script_planner = ScriptPlannerAgent()
script_analyzer = ScriptAnalyzerAgent()
visual_coordinator = VisualCoordinatorAgent()
visual_generator = VisualGeneratorAgent()
narration_agent = NarrationAgent()
board_writer = BoardWriterAgent()
decider_agent = DeciderAgent()
