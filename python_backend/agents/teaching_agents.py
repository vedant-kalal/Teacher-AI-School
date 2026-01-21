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
        prompt = f"""You are an expert teacher who explains concepts to young students. Create a comprehensive, engaging lesson script for teaching about: {topic}

IMPORTANT: Teach like you are explaining to a 10-12 year old student who has never heard of this topic before.

Create a detailed lesson with 10-14 segments. Each segment should feel like a real teacher explaining in class with patience and clarity.

CRITICAL: Make the teaching feel CONTINUOUS and NATURAL:
- The first segment introduces the topic warmly
- Middle segments FLOW NATURALLY with transitions like "Now that we understand X, let's explore Y..." or "Building on this..."
- NEVER start a new segment like you're starting over (avoid "Today we will learn..." in the middle)
- The LAST segment MUST be a proper CLOSING: "Thank you for learning with me today! Let me summarize what we covered..."
- Each segment must teach something UNIQUE - no repetition allowed

For EACH segment, provide:
1. narration_text: What the teacher says (4-6 sentences, simple words, explain every concept from basics, use analogies and real-life examples)
2. board_text: What appears on the board - MUST include definitions, descriptions, and explanations like a real teacher writes
3. board_style: "title", "heading", "text", "formula", "bullet", or "highlight"
4. needs_visual: true if this segment needs a diagram or image (aim for 6-8 visuals per lesson)
5. visual_type: "diagram", "image", "3d_model", or "video" (only if needs_visual is true)
6. visual_prompt: A detailed prompt for generating the visual (only if needs_visual is true)
7. clear_board: true if the board should be cleared before this segment
8. complex_terms: List of difficult words/phrases in this segment that need simpler explanation

CRITICAL Rules for board_text - Write like a REAL TEACHER on a blackboard:
- NO markdown symbols (no #, *, **, `, etc.)
- NO emojis - keep it professional and clean
- Use proper mathematical symbols: × ÷ ² ³ √ π θ α β γ Δ Σ Ω → ← ≤ ≥ ≠ ∞ °
- Use bullet points with • symbol
- Write 5-8 lines per segment minimum
- ALWAYS include:
  * DEFINITION: What is it? (simple explanation)
  * DESCRIPTION: How does it work? What does it do?
  * EXAMPLE: Real-world example the student can relate to
  * KEY POINTS: Important things to remember
- Use arrows (→) to show cause and effect
- Underline or highlight key words using colons

Example board_text format:
"What is Photosynthesis?

Definition: The process plants use to make their own food using sunlight.

How it works:
• Sunlight + Water + Carbon Dioxide → Sugar + Oxygen
• Plants have special cells called chloroplasts
• Chloroplasts contain chlorophyll (the green color)

In simple words: Plants are like little factories that turn sunlight into food!

Example: A tree in your backyard does this every day to grow bigger."

Teaching style:
- Start from absolute basics - assume the student knows nothing
- Explain WHY things happen, not just WHAT happens
- Use simple analogies (like comparing to everyday objects)
- Break complex ideas into small, easy steps
- Give real-world examples students can relate to
- Include multiple examples for each concept
- Explain every technical term in simple words
- Write definitions for every new term introduced

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
      "pause_after_ms": 500,
      "complex_terms": ["difficult word 1", "technical phrase 2"]
    }}
  ],
  "key_formulas": ["E = mc²", "F = ma"],
  "learning_objectives": ["Understand X", "Apply Y"],
  "conclusion": {{
    "summary_text": "Key points we learned today...",
    "thank_you_message": "Thank you for learning with me! You now understand..."
  }}
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
            "title": f"Understanding {topic}",
            "introduction": f"Today we'll learn about {topic} from the very beginning",
            "segments": [
                {
                    "segment_id": "seg_1",
                    "narration_text": f"Welcome everyone! Today we're going to explore {topic}. Don't worry if you've never heard of this before - we'll start from the very basics and I'll explain everything step by step.",
                    "board_text": f"Today's Topic: {topic}\n\nWhat we will learn:\n• What is {topic}?\n• Why is it important?\n• How does it work?\n• Real examples from everyday life",
                    "board_style": "title",
                    "needs_visual": False,
                    "visual_type": None,
                    "visual_prompt": None,
                    "clear_board": True,
                    "pause_after_ms": 1000,
                    "complex_terms": []
                },
                {
                    "segment_id": "seg_2",
                    "narration_text": f"Let's start by understanding what {topic} really means. Think of it like this - I'll explain it in the simplest way possible so everyone can understand.",
                    "board_text": f"What is {topic}?\n\nDefinition:\n{topic} is...\n\nIn simple words:\nImagine...\n\nKey Points:\n• Point 1 with explanation\n• Point 2 with example\n• Point 3 with why it matters",
                    "board_style": "text",
                    "needs_visual": True,
                    "visual_type": "diagram",
                    "visual_prompt": f"Educational concept map diagram showing the main components and relationships in {topic}, with clear labels and arrows, suitable for young students",
                    "clear_board": False,
                    "pause_after_ms": 500,
                    "complex_terms": []
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

        prompt = f"""You are a friendly teacher explaining {topic} to young students (ages 10-12) who have never heard of this before.

1. THE BOARD CONTENT (what's written):
{board_content}

2. ORIGINAL NARRATION IDEA:
{base_text}
{visual_section}

IMPORTANT RULES:
- Speak like you're talking to a child - use simple, everyday words
- NO emojis in your speech
- Explain EVERYTHING from basics - don't assume they know anything
- Use analogies to everyday things kids understand (toys, games, food, school, etc.)
- Be 5-8 sentences long for thorough explanation
- When you use a difficult word, immediately explain it: "This is called X, which simply means..."
- If there's a visual, describe EVERY part of it in detail
- Make connections between concepts using simple cause-and-effect language
- Sound enthusiastic but not over the top

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


class BoardLayoutAgent:
    """
    Intelligent Board Layout Agent that decides the structure of each board page.
    Controls: text size, image size, image position, board structure, spacing.
    """
    def __init__(self):
        pass
    
    async def plan_page_layout(
        self,
        page_content: Dict[str, Any],
        has_image: bool,
        image_info: Optional[Dict[str, Any]] = None,
        topic: str = ""
    ) -> Dict[str, Any]:
        """
        Decide the optimal layout for a board page based on content.
        
        Args:
            page_content: What text will be on this page
            has_image: Whether an image will be displayed
            image_info: Details about the image (type, importance, etc.)
            topic: The lesson topic
        
        Returns:
            Layout configuration for the page
        """
        llm = get_llm("gpt-4o-mini", 0.5)
        
        text_lines = page_content.get("lines", [])
        total_text = "\n".join([line.get("text", "") for line in text_lines])
        text_length = len(total_text)
        num_lines = len(text_lines)
        
        prompt = f"""You are an expert at designing educational blackboard layouts. 
Analyze this content and decide the OPTIMAL layout for maximum readability and visual impact.

CONTENT TO DISPLAY:
Topic: {topic}
Number of text lines: {num_lines}
Total text length: {text_length} characters
Text preview: {total_text[:200]}...

HAS IMAGE: {has_image}
{f"Image type: {image_info.get('visual_type', 'image')}" if image_info else ""}
{f"Image importance: {image_info.get('importance', 'normal')}" if image_info else ""}
{f"Image title: {image_info.get('title', '')}" if image_info else ""}

IMPORTANT: Both text AND images are important for students.
Text explains the concept, images help visualize it.

Layout rules:
- Text gets 55-65% of the board width (for detailed explanations)
- Images get 35-45% of the board width (LARGE, visible, readable images)
- If LOTS of text (>300 chars): use MEDIUM text size for more content
- If LITTLE text (<100 chars): use LARGE text for emphasis
- Images must be LARGE so students can see and understand them clearly
- If no image: text uses 100% width

Return JSON with layout decisions:
{{
  "text_size": "small" | "medium" | "large",
  "text_width_percent": 55-65,
  "image_size": "large",
  "image_width_percent": 35-45,
  "image_position": "right",
  "image_height_percent": 60-80,
  "line_spacing": "compact" | "normal" | "relaxed",
  "board_padding": "minimal" | "normal" | "spacious",
  "title_size": "normal" | "large" | "huge",
  "layout_reason": "Brief explanation of why this layout"
}}"""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You design optimal blackboard layouts for educational content. Return JSON only."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            result = json.loads(content)
            print(f"📐 [Layout Agent] Decided: text={result.get('text_size')}, image={result.get('image_size')}, position={result.get('image_position')}")
            return result
        except Exception as e:
            print(f"Error in layout agent: {e}")
            return self._default_layout(has_image, image_info)
    
    def _default_layout(self, has_image: bool, image_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback layout with balanced text and large images"""
        if has_image:
            return {
                "text_size": "large",
                "text_width_percent": 60,
                "image_size": "large",
                "image_width_percent": 40,
                "image_position": "right",
                "image_height_percent": 70,
                "line_spacing": "normal",
                "board_padding": "normal",
                "title_size": "large",
                "layout_reason": "Balanced layout with large readable images"
            }
        else:
            return {
                "text_size": "large",
                "text_width_percent": 100,
                "image_size": "none",
                "image_width_percent": 0,
                "image_position": "none",
                "image_height_percent": 0,
                "line_spacing": "relaxed",
                "board_padding": "spacious",
                "title_size": "huge",
                "layout_reason": "Text-only page, maximize readability"
            }
    
    async def adjust_for_content_type(
        self,
        base_layout: Dict[str, Any],
        content_type: str,
        styles: List[str]
    ) -> Dict[str, Any]:
        """
        Fine-tune layout based on specific content types.
        
        Args:
            base_layout: The initial layout decision
            content_type: "formula", "bullet_list", "paragraph", "mixed"
            styles: List of BoardWriteStyle values in the content
        """
        adjusted = base_layout.copy()
        
        if content_type == "formula" or "formula" in styles:
            adjusted["text_size"] = "large"
            adjusted["line_spacing"] = "relaxed"
            adjusted["board_padding"] = "spacious"
        
        if content_type == "bullet_list" or styles.count("bullet") > 3:
            adjusted["line_spacing"] = "compact"
            adjusted["text_size"] = "medium"
        
        if "title" in styles:
            adjusted["title_size"] = "huge"
        
        return adjusted


class ImageSourceAgent:
    """
    Decides whether to use a real image from the internet or AI-generated image.
    Real images are better for: real photos of objects, people, places, scientific images
    AI images are better for: diagrams, abstract concepts, custom illustrations
    """
    def __init__(self):
        pass
    
    async def decide_image_source(
        self,
        visual_prompt: str,
        visual_type: str,
        topic: str
    ) -> Dict[str, Any]:
        llm = get_llm("gpt-4o-mini", 0.5)
        
        prompt = f"""You are an educational content expert deciding the best image source for teaching.

Topic: {topic}
Visual Type: {visual_type}
Visual Description: {visual_prompt}

Decide: Should this be a REAL image (from Google/internet) or AI-GENERATED image?

REAL IMAGE (from internet) is better for:
- Photos of real things: animals, planets, famous places, historical events
- Scientific photographs: microscope images, space photos, nature
- Real-world examples: real buildings, real food, real vehicles
- Educational diagrams that already exist (anatomy charts, periodic table, maps)

AI-GENERATED IMAGE is better for:
- Custom diagrams showing a specific concept
- Abstract visualizations (like showing how gravity works)
- Imaginary or hypothetical scenarios
- Step-by-step process illustrations
- Custom infographics with specific labels

Return JSON:
{{
  "source": "real" or "ai_generated",
  "search_query": "Google search query for finding this image (only if source is real)",
  "ai_prompt": "Prompt for AI image generation (only if source is ai_generated)",
  "reason": "Brief explanation of why this source was chosen"
}}"""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You decide optimal image sources for education. Return JSON only."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            result = json.loads(content)
            print(f"[ImageSource] Decided: {result.get('source')} for {visual_type}")
            return result
        except Exception as e:
            print(f"Error in image source agent: {e}")
            return {
                "source": "ai_generated",
                "ai_prompt": visual_prompt,
                "reason": "Fallback to AI generation"
            }


class UniqueContentAgent:
    """
    Ensures no teaching phase is repeated. Keeps track of what has been taught
    and validates new content is unique.
    """
    def __init__(self):
        self.taught_content: List[str] = []
    
    def reset(self):
        self.taught_content = []
    
    async def validate_and_enhance_script(
        self,
        script: Dict[str, Any],
        topic: str
    ) -> Dict[str, Any]:
        llm = get_llm("gpt-4o", 0.6)
        
        segments = script.get("segments", [])
        segment_summaries = [f"Segment {i+1}: {seg.get('board_text', '')[:100]}" for i, seg in enumerate(segments)]
        
        prompt = f"""You are a content quality checker for educational lessons about "{topic}".

Review these lesson segments and ensure:
1. NO segment is repeated or very similar to another
2. Each segment teaches something NEW and UNIQUE
3. The flow is CONTINUOUS and NATURAL (not "Now let's start..." each time)
4. Add smooth TRANSITIONS between segments (e.g., "Building on what we learned...", "Now that we understand X, let's see Y...")
5. Add a proper CONCLUSION segment that says "Thank you for learning with me today! Remember the key points we covered..."

Current segments:
{chr(10).join(segment_summaries)}

Previous taught content (must be different):
{chr(10).join(self.taught_content[-5:]) if self.taught_content else "None yet"}

Return JSON with:
{{
  "is_valid": true/false,
  "issues": ["list of any duplicate/repeated content"],
  "suggested_transitions": {{"seg_1": "transition text", "seg_2": "transition text"}},
  "needs_conclusion": true/false,
  "conclusion_text": "Proper thank you and summary if needed"
}}"""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You ensure educational content is unique and flows naturally."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            result = json.loads(content)
            
            for seg in segments:
                summary = seg.get('board_text', '')[:50]
                if summary and summary not in self.taught_content:
                    self.taught_content.append(summary)
            
            print(f"[UniqueContent] Valid: {result.get('is_valid')}, Issues: {len(result.get('issues', []))}")
            return result
        except Exception as e:
            print(f"Error in unique content agent: {e}")
            return {"is_valid": True, "issues": [], "suggested_transitions": {}, "needs_conclusion": False}


class ImageAnalyzerAgent:
    """
    Analyzes image content to help the narration agent explain what's in the image.
    """
    def __init__(self):
        pass
    
    async def analyze_image_for_teaching(
        self,
        image_prompt: str,
        visual_type: str,
        topic: str
    ) -> Dict[str, Any]:
        llm = get_llm("gpt-4o-mini", 0.6)
        
        prompt = f"""You are an expert at understanding educational images and helping teachers explain them.

Topic: {topic}
Image Type: {visual_type}
Image Description: {image_prompt}

Analyze what this image shows and provide teaching guidance:

1. What are the KEY ELEMENTS a teacher should point out?
2. What should students LOOK AT first?
3. What LABELS or parts need explanation?
4. How does this connect to the topic being taught?
5. What QUESTIONS can the teacher ask about this image?

Return JSON:
{{
  "key_elements": ["list of main things to notice"],
  "teaching_points": ["specific things to explain about the image"],
  "student_focus": "What students should look at first",
  "connection_to_topic": "How this relates to what's being taught",
  "suggested_questions": ["questions to ask students about the image"],
  "explanation_script": "A 2-3 sentence script for explaining this image to students"
}}"""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You analyze educational images for teaching purposes."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            return json.loads(content)
        except Exception as e:
            print(f"Error in image analyzer: {e}")
            return {
                "key_elements": [],
                "teaching_points": [],
                "explanation_script": f"Take a look at this {visual_type} about {topic}."
            }


class ChalkDrawingAgent:
    """
    Creates REAL, DETAILED chalk drawings using Gemini's nano banana image generation.
    Generates actual chalk-style diagram images that look like real blackboard drawings.
    """
    def __init__(self):
        pass
    
    async def analyze_for_drawings(
        self,
        segments: List[Dict[str, Any]],
        topic: str
    ) -> List[Dict[str, Any]]:
        llm = get_llm("gpt-4o", 0.7)
        
        segment_list = "\n".join([
            f"Segment {i+1}: {seg.get('narration_text', '')[:150]}..."
            for i, seg in enumerate(segments)
        ])
        
        prompt = f"""You are an EXPERT TEACHER who knows exactly what diagrams help students understand concepts.

Topic: {topic}

Analyze these lesson segments and plan DETAILED chalk diagrams that will be GENERATED AS IMAGES:
{segment_list}

Create 2-3 DETAILED educational diagrams. For each diagram, provide:
1. A very detailed subject description (what exactly to draw)
2. All important parts that should be labeled
3. The style of diagram

IMPORTANT: Be EXTREMELY DETAILED in the 'subject' field because it will be used to generate an actual image.
Include specific details like:
- Exact components/parts to show
- How they should be arranged
- What details are most important
- Any cross-sections, cutaways, or specific views needed

Return JSON:
{{
  "drawings": [
    {{
      "segment_index": 2,
      "drawing_type": "anatomical_diagram",
      "title": "Structure of the Human Heart",
      "subject": "A detailed cross-sectional view of a human heart showing all four chambers clearly visible. The right atrium and right ventricle on the right side, left atrium and left ventricle on the left side. Include the thick muscular walls of the ventricles. Show the aorta emerging from the top left, pulmonary artery from the top right. Include tricuspid valve between right chambers and mitral valve between left chambers. Draw arrows showing blood flow direction through each chamber.",
      "key_parts": ["Right Atrium", "Left Atrium", "Right Ventricle", "Left Ventricle", "Aorta", "Pulmonary Artery", "Tricuspid Valve", "Mitral Valve"],
      "style": "scientific_cross_section",
      "explanation": "This diagram shows how blood flows through the four chambers of the heart"
    }}
  ]
}}

Drawing types: anatomical_diagram, scientific_diagram, process_flowchart, labeled_parts, comparison_diagram, cycle_diagram, structure_diagram
Style: scientific_cross_section, labeled_illustration, step_by_step, comparative_view"""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You plan detailed educational diagrams. The 'subject' field must be extremely detailed because it will be used to generate an actual image. Include every important detail that should be visible in the diagram."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            result = json.loads(content)
            print(f"[ChalkDrawing] Planned {len(result.get('drawings', []))} detailed diagrams for Gemini generation")
            return result.get("drawings", [])
        except Exception as e:
            print(f"Error in chalk drawing agent: {e}")
            return []
    
    async def generate_chalk_image(
        self,
        drawing: Dict[str, Any],
        topic: str
    ) -> Optional[Dict[str, Any]]:
        """Generate a chalk diagram image using Gemini nano banana model"""
        from python_backend.streaming.gemini_chalk_generator import generate_chalk_diagram_with_labels
        
        subject = drawing.get('subject', drawing.get('title', 'diagram'))
        key_parts = drawing.get('key_parts', [])
        explanation = drawing.get('explanation', '')
        title = drawing.get('title', topic)
        
        print(f"🎨 [ChalkDrawing] Generating chalk image: {title}")
        
        result = await generate_chalk_diagram_with_labels(
            subject=subject,
            topic=topic,
            key_parts=key_parts,
            explanation=explanation
        )
        
        if result:
            result["title"] = title
            result["drawing_type"] = drawing.get("drawing_type", "diagram")
            result["segment_index"] = drawing.get("segment_index", 0)
            print(f"✅ [ChalkDrawing] Generated chalk image: {title}")
            return result
        else:
            print(f"⚠️ [ChalkDrawing] Failed to generate: {title}")
            return None
    
    async def generate_drawing_steps(
        self,
        drawing: Dict[str, Any],
        topic: str
    ) -> Dict[str, Any]:
        """Legacy method - now generates chalk images instead of SVG steps"""
        result = await self.generate_chalk_image(drawing, topic)
        if result:
            return {
                "title": result.get("title", drawing.get("title", "")),
                "drawing_type": result.get("drawing_type", "chalk_image"),
                "is_generated_image": True,
                "image_base64": result.get("image_base64", ""),
                "mime_type": result.get("mime_type", "image/png"),
                "key_parts": result.get("key_parts", []),
                "explanation": result.get("explanation", drawing.get("explanation", "")),
                "label_positions": result.get("label_positions", [])
            }
        return {"title": drawing.get("title", ""), "steps": [], "is_generated_image": False}
    
    def _legacy_generate_drawing_steps(
        self,
        drawing: Dict[str, Any],
        topic: str
    ) -> Dict[str, Any]:
        """Kept for backwards compatibility - not used"""
        llm = get_llm("gpt-4o", 0.7)
        
        subject = drawing.get('subject', drawing.get('title', 'diagram'))
        key_parts = drawing.get('key_parts', [])
        style = drawing.get('style', 'educational')
        
        prompt = f"""You are a MASTER ARTIST creating a DETAILED chalk drawing for a blackboard.

Topic: {topic}
Subject to Draw: {subject}
Key Parts to Show: {', '.join(key_parts) if key_parts else 'Main features'}
Style: {style}

Create a DETAILED SVG drawing with realistic shapes using PATH elements.
The drawing should look like actual chalk art on a blackboard - detailed, beautiful, educational.

IMPORTANT: Use SVG path elements with 'd' attribute for complex shapes.
- Use M (move), L (line), C (curve), Q (quadratic curve), A (arc), Z (close)
- Create smooth, natural curves that look hand-drawn
- Add texture and detail to make it realistic

Canvas size: 600 x 400 pixels
Use white (#ffffff) or light colors for chalk effect.

Return JSON:
{{
  "title": "{drawing.get('title', '')}",
  "drawing_type": "{drawing.get('drawing_type', 'detailed_illustration')}",
  "total_duration_ms": 12000,
  "explanation": "{drawing.get('explanation', '')}",
  "steps": [
    {{
      "step_id": 1,
      "type": "path",
      "d": "M 100 200 C 120 150 180 150 200 200 C 220 250 180 280 150 280 C 120 280 80 250 100 200",
      "stroke": "#ffffff",
      "fill": "none",
      "strokeWidth": 2,
      "delay_ms": 0,
      "draw_duration_ms": 1500,
      "description": "Main outline"
    }},
    {{
      "step_id": 2,
      "type": "path", 
      "d": "M 140 220 Q 150 210 160 220 Q 170 230 160 240 Q 150 250 140 240 Q 130 230 140 220",
      "stroke": "#ffffff",
      "fill": "none",
      "strokeWidth": 1.5,
      "delay_ms": 1500,
      "draw_duration_ms": 1000,
      "description": "Inner detail"
    }},
    {{
      "step_id": 3,
      "type": "label",
      "x": 250,
      "y": 220,
      "text": "Nucleus",
      "lineToX": 150,
      "lineToY": 230,
      "delay_ms": 2500,
      "draw_duration_ms": 800
    }}
  ]
}}

Step types available:
- "path": SVG path with 'd' attribute for complex shapes (USE THIS MOST)
- "label": Text label with optional leader line (lineToX, lineToY)
- "text": Simple text without leader line
- "circle": For simple circles (x, y, radius)
- "group": Collection of related paths

Create 8-15 steps to build up a DETAILED drawing.
Make it look like real chalk art, not basic shapes!"""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You are a master SVG artist. Create detailed, realistic chalk drawings using SVG path elements. Your drawings should look like actual illustrations, not simple geometric shapes."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            return json.loads(content)
        except Exception as e:
            print(f"Error generating drawing steps: {e}")
            return {"title": drawing.get("title", ""), "steps": []}


class HinglishNarrationAgent:
    """
    Converts English narration to Hinglish (Hindi-English mixed) like real Indian teachers speak.
    Uses DEVANAGARI script for Hindi words for proper TTS pronunciation.
    Example: "देखो बच्चों, यह engine कैसे काम करता है - it converts fuel into power."
    """
    def __init__(self):
        pass
    
    async def convert_to_hinglish(
        self,
        english_text: str,
        topic: str,
        formality: str = "friendly"
    ) -> str:
        llm = get_llm("gpt-4o", 0.8)
        
        prompt = f"""You are a friendly Indian teacher who speaks in HINGLISH (mixing Hindi and English naturally).

Convert this English narration to Hinglish like a real Indian teacher speaks in class.

CRITICAL: Write Hindi words in DEVANAGARI SCRIPT (हिंदी) for proper pronunciation by TTS.
Keep English words in English script.

Topic: {topic}
Original text: {english_text}

RULES for Hinglish:
1. Mix Hindi and English NATURALLY - like how teachers actually speak
2. Write Hindi words in DEVANAGARI (not Roman):
   - "देखो बच्चों" (not "Dekho bachcho")
   - "समझे?" (not "Samjhe?")
   - "ठीक है?" (not "Theek hai?")
   - "यह देखो" (not "Yeh dekho")
   - "बहुत अच्छा!" (not "Bahut accha!")
   - "क्या तुम्हें पता है?" (not "Kya tumhe pata hai?")
3. Keep TECHNICAL TERMS in English (engine, photosynthesis, gravity, black hole, etc.)
4. Keep COMMON ENGLISH words in English when natural (important, problem, example, etc.)
5. Use Devanagari connecting words: "तो", "और", "लेकिन", "क्योंकि", "इसलिए"
6. Add teacher expressions: "देखो", "समझो", "याद रखो", "ध्यान दो"
7. Keep it simple and warm like a classroom teacher

IMPORTANT: 
- DO NOT use emojis
- Write Hindi in DEVANAGARI script for correct pronunciation
- Keep scientific/technical terms in English
- Mix naturally, don't force Hindi where English sounds better
- Sound like a real teacher, not a textbook

Example conversions:
- "Let me explain how this works" -> "चलो, मैं तुम्हें समझाता हूं कि यह कैसे काम करता है"
- "This is very important" -> "यह बहुत important है, ध्यान से सुनो"
- "Do you understand?" -> "समझ आया? कोई doubt है तो पूछो"
- "The engine has three parts" -> "देखो, engine के तीन parts होते हैं"
- "A black hole is very powerful" -> "देखो बच्चों, black hole बहुत powerful होता है"
- "Now let's learn about gravity" -> "अब चलो gravity के बारे में सीखते हैं"

Return ONLY the Hinglish text with Hindi in Devanagari, nothing else."""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You are an expert at natural Hinglish speaking like Indian teachers. Write Hindi in Devanagari script."),
                HumanMessage(content=prompt)
            ])
            
            result = response.content.strip()
            result = result.replace('**', '').replace('*', '')
            return result
        except Exception as e:
            print(f"Error converting to Hinglish: {e}")
            return english_text


script_planner = ScriptPlannerAgent()
script_analyzer = ScriptAnalyzerAgent()
visual_coordinator = VisualCoordinatorAgent()
visual_generator = VisualGeneratorAgent()
narration_agent = NarrationAgent()
board_writer = BoardWriterAgent()
decider_agent = DeciderAgent()
layout_agent = BoardLayoutAgent()
image_source_agent = ImageSourceAgent()
unique_content_agent = UniqueContentAgent()
image_analyzer_agent = ImageAnalyzerAgent()
chalk_drawing_agent = ChalkDrawingAgent()
hinglish_agent = HinglishNarrationAgent()
