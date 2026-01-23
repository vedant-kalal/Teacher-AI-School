"""
Video Coordinator Agent
Decides what educational videos to generate for each lesson and when to show them.
Works in parallel with lesson preparation to pre-generate videos using Google Veo.
"""
import json
import re
import asyncio
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from agents.teaching_agents import get_llm


class VideoCoordinatorAgent:
    """
    Analyzes lesson content and coordinates video generation.
    Decides what videos to create and optimal timing for display during lessons.
    """
    
    def __init__(self):
        pass
    
    async def analyze_for_videos(
        self,
        segments: List[Dict[str, Any]],
        topic: str
    ) -> List[Dict[str, Any]]:
        """
        Analyze lesson segments and plan educational videos.
        Returns list of video specifications with timing.
        """
        llm = get_llm("gpt-4o", 0.7)
        
        segment_list = "\n".join([
            f"Segment {i+1}: {seg.get('narration_text', '')[:200]}..."
            for i, seg in enumerate(segments[:10])
        ])
        
        prompt = f"""You are an EXPERT EDUCATIONAL VIDEO COORDINATOR.
Your job is to decide what educational videos would help students understand the lesson better.

TOPIC: {topic}

LESSON SEGMENTS:
{segment_list}

Analyze the lesson and plan 1-3 educational VIDEOS that would help students understand:
- How processes work (e.g., blood flowing through heart, electricity through circuit)
- How mechanisms operate (e.g., engine moving, gears turning)
- Natural phenomena in action (e.g., water cycle, plant growth)
- Scientific concepts visualized (e.g., atoms bonding, waves propagating)

For each video, provide:
1. segment_index: Which segment should display this video (1-based)
2. video_type: process_flow, working_model, animation, demonstration, cycle, or comparison
3. title: Short title for the video
4. subject: DETAILED description of what the video should show (be very specific)
5. description: Brief explanation for students about what they're seeing
6. loop: Should the video loop? (true for processes, false for one-time events)

IMPORTANT:
- Only suggest videos for concepts that truly benefit from MOTION visualization
- Don't suggest videos for static concepts that images handle better
- Each video should show something MOVING, FLOWING, or WORKING
- Be very detailed in the 'subject' field as this will be used to generate the video

Return JSON:
{{
  "video_plan": [
    {{
      "segment_index": 3,
      "video_type": "process_flow",
      "title": "Blood Flow Through the Heart",
      "subject": "A realistic visualization of blood flowing through a human heart. Show deoxygenated blood entering the right atrium, flowing through the tricuspid valve into the right ventricle, then being pumped to the lungs through the pulmonary artery. Then show oxygenated blood returning to the left atrium, flowing through the mitral valve to the left ventricle, and being pumped out through the aorta to the body. Use red for oxygenated blood and blue for deoxygenated blood.",
      "description": "Watch how blood moves through all four chambers of the heart",
      "loop": true
    }}
  ],
  "video_strategy": "Brief explanation of why these videos were chosen"
}}

Video types:
- process_flow: Step-by-step process with smooth transitions
- working_model: Mechanism or machine in action
- animation: Simplified animated visualization
- demonstration: Real-world concept demonstration
- cycle: Continuous loop (water cycle, carbon cycle, etc.)
- comparison: Side-by-side comparison of states"""

        try:
            response = await llm.ainvoke([
                SystemMessage(content="You are an expert at planning educational videos. Only suggest videos for concepts that truly benefit from motion visualization. Be very detailed in the 'subject' field."),
                HumanMessage(content=prompt)
            ])
            
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            
            result = json.loads(content)
            video_plan = result.get("video_plan", [])
            print(f"[VideoCoordinator] Planned {len(video_plan)} videos: {result.get('video_strategy', 'N/A')[:100]}")
            return video_plan
        except Exception as e:
            print(f"[VideoCoordinator] Error planning videos: {e}")
            return []
    
    async def decide_video_display_timing(
        self,
        video: Dict[str, Any],
        segment: Dict[str, Any],
        current_narration: str
    ) -> Dict[str, Any]:
        """
        Decide when exactly to display a video during a segment.
        Returns timing and display configuration.
        """
        return {
            "display_at_start": True,
            "display_duration_seconds": video.get("duration_seconds", 8) * 2,
            "loop": video.get("loop", True),
            "display_position": "right",
            "fade_in": True
        }


class VideoGenerationManager:
    """
    Manages parallel video generation tasks.
    Pre-generates videos while lesson preparation continues.
    """
    
    def __init__(self):
        self.pending_tasks: Dict[str, asyncio.Task] = {}
        self.completed_videos: Dict[str, Dict[str, Any]] = {}
    
    async def start_video_generation(
        self,
        video_plan: List[Dict[str, Any]],
        topic: str
    ) -> Dict[int, asyncio.Task]:
        """
        Start generating all planned videos in parallel.
        Returns dict mapping segment_index to generation tasks.
        """
        from streaming.veo_video_generator import generate_video_with_metadata
        
        video_tasks: Dict[int, asyncio.Task] = {}
        
        for video in video_plan:
            segment_idx = video.get("segment_index", 1) - 1
            if segment_idx < 0:
                segment_idx = 0
            
            task = asyncio.create_task(
                generate_video_with_metadata(
                    subject=video.get("subject", ""),
                    topic=topic,
                    title=video.get("title", ""),
                    description=video.get("description", ""),
                    video_type=video.get("video_type", "process_flow"),
                    loop=video.get("loop", True)
                )
            )
            
            video_tasks[segment_idx] = task
            self.pending_tasks[f"segment_{segment_idx}"] = task
            print(f"[VideoManager] Started video generation for segment {segment_idx + 1}: {video.get('title', 'Video')}")
        
        return video_tasks
    
    async def get_video_for_segment(
        self,
        segment_idx: int,
        video_tasks: Dict[int, asyncio.Task],
        timeout: float = 120.0
    ) -> Optional[Dict[str, Any]]:
        """
        Get the generated video for a specific segment.
        Waits for completion if still generating.
        """
        if segment_idx not in video_tasks:
            return None
        
        task = video_tasks[segment_idx]
        
        try:
            if task.done():
                result = task.result()
            else:
                result = await asyncio.wait_for(task, timeout=timeout)
            
            if result:
                self.completed_videos[f"segment_{segment_idx}"] = result
                print(f"[VideoManager] Video ready for segment {segment_idx + 1}")
            return result
        except asyncio.TimeoutError:
            print(f"[VideoManager] Video generation timed out for segment {segment_idx + 1}")
            return None
        except Exception as e:
            print(f"[VideoManager] Error getting video for segment {segment_idx + 1}: {e}")
            return None


video_coordinator = VideoCoordinatorAgent()
video_manager = VideoGenerationManager()
