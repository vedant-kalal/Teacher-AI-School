"""
Streaming Lesson Workflow
Real-time synchronized lesson delivery with intelligent visual planning
"""
import asyncio
import uuid
import os
import base64
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime

from schemas.events import (
    EventType, MediaType, BoardWriteStyle,
    BoardWriteEvent, NarrationSegment, MediaReadyEvent,
    clean_text_for_board, format_formula_for_board
)
from streaming.lesson_streamer import LessonStreamer, create_streamer, get_streamer, remove_streamer
from agents.teaching_agents import (
    script_planner, script_analyzer, visual_coordinator, visual_generator,
    narration_agent, board_writer, decider_agent, layout_agent,
    image_source_agent, unique_content_agent, image_analyzer_agent
)


OPENAI_BASE_URL = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL", "")
OPENAI_API_KEY = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "")


def get_media_type(visual_type: str) -> MediaType:
    type_map = {
        "image": MediaType.IMAGE,
        "diagram": MediaType.DIAGRAM,
        "3d_model": MediaType.SIMULATION,
        "video": MediaType.VIDEO
    }
    return type_map.get(visual_type, MediaType.IMAGE)


async def generate_image_async(prompt: str, topic: str, visual_type: str = "image") -> Optional[Dict[str, Any]]:
    print(f"🎨 [Image Gen] Starting generation for: {prompt[:50]}...")
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            style_suffix = {
                "image": "Photorealistic, high quality, detailed",
                "diagram": "Clean educational diagram, labeled, professional infographic style",
                "3d_model": "3D rendered visualization, clear lighting, detailed textures",
                "video": "Key frame from educational animation, dynamic"
            }.get(visual_type, "Educational, professional")
            
            full_prompt = f"{prompt}. Style: {style_suffix}. Topic: {topic}."
            
            response = await client.post(
                f"{OPENAI_BASE_URL}/images/generations",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-image-1",
                    "prompt": full_prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "medium"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("data") and len(data["data"]) > 0:
                    image_data = data["data"][0]
                    print(f"✅ [Image Gen] Successfully generated image for: {prompt[:30]}...")
                    if "b64_json" in image_data:
                        return {
                            "image_base64": image_data["b64_json"],
                            "prompt": prompt,
                            "visual_type": visual_type
                        }
                    elif "url" in image_data:
                        return {
                            "image_url": image_data["url"],
                            "prompt": prompt,
                            "visual_type": visual_type
                        }
            else:
                print(f"❌ [Image Gen] Failed: {response.status_code} - {response.text[:200]}")
                return None
    except Exception as e:
        print(f"❌ [Image Gen] Error: {e}")
        return None


async def run_streaming_lesson(run_id: str, topic: str):
    streamer = get_streamer(run_id)
    if not streamer:
        streamer = create_streamer(run_id, topic)
    
    try:
        print(f"\n{'='*60}")
        print(f"🎓 STREAMING LESSON - Starting")
        print(f"📚 Topic: {topic}")
        print(f"🆔 Run ID: {run_id}")
        print(f"{'='*60}\n")
        
        await streamer.emit_status_update("Planning lesson script...", 0.05)
        
        script = await script_planner.plan_lesson_script(topic)
        title = script.get("title", f"{topic}")
        segments = script.get("segments", [])
        conclusion = script.get("conclusion", {})
        
        print(f"✅ Lesson script created with {len(segments)} segments")
        
        unique_content_agent.reset()
        content_validation = await unique_content_agent.validate_and_enhance_script(script, topic)
        if not content_validation.get("is_valid"):
            print(f"⚠️ Content issues found: {content_validation.get('issues', [])}")
        
        if content_validation.get("needs_conclusion") and not conclusion:
            conclusion = {
                "summary_text": content_validation.get("conclusion_text", "Thank you for learning with me today!"),
                "thank_you_message": "You now understand the key concepts we covered!"
            }
        
        print(f"📝 Content validation: Valid={content_validation.get('is_valid')}")
        
        await streamer.emit_status_update("Analyzing script for visual content...", 0.1)
        
        visual_plan_result = await script_analyzer.analyze_script_for_visuals(script, topic)
        visual_plan = visual_plan_result.get("visual_plan", [])
        
        print(f"📊 Visual plan: {len(visual_plan)} visuals planned")
        print(f"📝 Visual strategy: {visual_plan_result.get('visual_summary', 'N/A')}")
        
        await streamer.emit_status_update("Pre-generating visual content...", 0.15)
        
        visual_tasks: Dict[str, asyncio.Task] = {}
        generated_visuals: Dict[str, Dict[str, Any]] = {}
        
        for visual in visual_plan:
            visual_id = visual.get("visual_id")
            if not visual_id:
                visual_id = str(uuid.uuid4())
                visual["visual_id"] = visual_id
            
            enhanced = await visual_generator.generate_enhanced_prompt(visual, script, topic)
            
            source_decision = await image_source_agent.decide_image_source(
                enhanced.get("enhanced_prompt", visual.get("detailed_prompt", "")),
                enhanced.get("visual_type", visual.get("visual_type", "image")),
                topic
            )
            
            image_analysis = await image_analyzer_agent.analyze_image_for_teaching(
                enhanced.get("enhanced_prompt", visual.get("detailed_prompt", "")),
                enhanced.get("visual_type", visual.get("visual_type", "image")),
                topic
            )
            
            task = asyncio.create_task(
                generate_image_async(
                    source_decision.get("ai_prompt", enhanced.get("enhanced_prompt", visual.get("detailed_prompt", ""))),
                    topic,
                    enhanced.get("visual_type", visual.get("visual_type", "image"))
                )
            )
            visual_tasks[visual_id] = {
                "task": task,
                "info": visual,
                "enhanced": enhanced,
                "source_decision": source_decision,
                "image_analysis": image_analysis
            }
            
            print(f"🚀 [Pre-Gen] Started generation for: {visual.get('title', visual_id)} (Source: {source_decision.get('source', 'ai_generated')})")
        
        await streamer.emit_lesson_start(title)
        await asyncio.sleep(0.5)
        
        total_segments = len(segments)
        current_content_lines = 0
        max_board_lines = 12
        shown_visuals: List[str] = []
        
        for idx, segment in enumerate(segments):
            progress = 0.2 + (idx / total_segments) * 0.7
            await streamer.emit_status_update(f"Teaching segment {idx + 1}/{total_segments}", progress)
            
            segment_id = segment.get("segment_id", f"seg_{idx+1}")
            narration_text = segment.get("narration_text", "")
            board_text = segment.get("board_text", "")
            board_style = segment.get("board_style", "text")
            
            decision = await decider_agent.decide_next_action(
                segment,
                total_segments - idx - 1,
                (current_content_lines / max_board_lines) * 100
            )
            
            if decision.get("should_clear_board") or segment.get("clear_board") or current_content_lines >= max_board_lines:
                await streamer.emit_board_clear("fade")
                await asyncio.sleep(0.6)
                current_content_lines = 0
            
            coordination = await visual_coordinator.coordinate_visuals(
                visual_plan,
                segment_id,
                narration_text,
                total_segments - idx - 1,
                shown_visuals
            )
            
            has_visual_this_segment = coordination.get("show_visual", False)
            visual_info_for_layout = None
            
            if has_visual_this_segment:
                visual_to_show = coordination.get("visual_to_show")
                if visual_to_show and visual_to_show in visual_tasks:
                    visual_info_for_layout = visual_tasks[visual_to_show].get("info")
            
            page_content = {
                "lines": [{"text": board_text, "style": board_style}],
                "segment_id": segment_id
            }
            layout_decision = await layout_agent.plan_page_layout(
                page_content,
                has_visual_this_segment,
                visual_info_for_layout,
                topic
            )
            
            await streamer.emit_layout_update(layout_decision)
            print(f"📐 [Layout] Segment {idx+1}: text={layout_decision.get('text_size')}, image={layout_decision.get('image_size')}, pos={layout_decision.get('image_position')}")
            
            formatted_board = await board_writer.format_board_content(board_text, board_style, topic)
            
            style_map = {
                "title": BoardWriteStyle.TITLE,
                "heading": BoardWriteStyle.HEADING,
                "text": BoardWriteStyle.TEXT,
                "formula": BoardWriteStyle.FORMULA,
                "bullet": BoardWriteStyle.BULLET,
                "highlight": BoardWriteStyle.HIGHLIGHT
            }
            
            pacing = decision.get("pacing", "normal")
            char_delay = {"slow": 70, "normal": 50, "fast": 30}.get(pacing, 50)
            
            text_size_from_layout = layout_decision.get("text_size", "medium")
            
            board_event = BoardWriteEvent(
                text=formatted_board,
                style=style_map.get(board_style, BoardWriteStyle.TEXT),
                color="white" if board_style != "highlight" else "yellow",
                size=text_size_from_layout,
                char_delay_ms=char_delay,
                duration_ms=len(formatted_board) * char_delay,
                sync_with_narration=True
            )
            
            visual_context = None
            visual_to_display = None
            
            if coordination.get("show_visual"):
                print(f"🎯 [Coordinator] Decision: Show '{coordination.get('visual_to_show')}' - {coordination.get('reason', 'N/A')}")
                visual_to_show = coordination.get("visual_to_show")
                
                if visual_to_show and visual_to_show in visual_tasks:
                    task_info = visual_tasks[visual_to_show]
                    task = task_info["task"]
                    visual_info = task_info["info"]
                    
                    if task.done():
                        result = task.result()
                        if result:
                            image_analysis = task_info.get("image_analysis", {})
                            visual_to_display = {
                                "info": visual_info,
                                "result": result,
                                "duration": coordination.get("display_duration_ms", 5000),
                                "analysis": image_analysis
                            }
                            visual_context = {
                                "title": visual_info.get("title", ""),
                                "description": visual_info.get("detailed_prompt", ""),
                                "visual_type": visual_info.get("visual_type", "image"),
                                "teaching_points": image_analysis.get("teaching_points", []),
                                "explanation_script": image_analysis.get("explanation_script", "")
                            }
                            shown_visuals.append(visual_to_show)
                    else:
                        try:
                            result = await asyncio.wait_for(task, timeout=15)
                            if result:
                                image_analysis = task_info.get("image_analysis", {})
                                visual_to_display = {
                                    "info": visual_info,
                                    "result": result,
                                    "duration": coordination.get("display_duration_ms", 5000),
                                    "analysis": image_analysis
                                }
                                visual_context = {
                                    "title": visual_info.get("title", ""),
                                    "description": visual_info.get("detailed_prompt", ""),
                                    "visual_type": visual_info.get("visual_type", "image"),
                                    "teaching_points": image_analysis.get("teaching_points", []),
                                    "explanation_script": image_analysis.get("explanation_script", "")
                                }
                                shown_visuals.append(visual_to_show)
                        except asyncio.TimeoutError:
                            print(f"⏰ [Visual] Timeout waiting for: {visual_to_show}")
            
            expanded_narration = await narration_agent.expand_narration(
                narration_text, 
                topic, 
                formatted_board,
                visual_context
            )
            
            words = len(expanded_narration.split())
            narration_duration = int((words / 150) * 60 * 1000)
            
            narration_segment = NarrationSegment(
                text=expanded_narration,
                duration_ms=narration_duration,
                speed=1.0 if pacing == "normal" else (0.9 if pacing == "slow" else 1.1),
                pause_after_ms=segment.get("pause_after_ms", 500)
            )
            
            await streamer.emit_board_write(board_event)
            
            if visual_to_display:
                visual_info = visual_to_display["info"]
                result = visual_to_display["result"]
                media = MediaReadyEvent(
                    media_type=get_media_type(visual_info.get("visual_type", "image")),
                    title=visual_info.get("title", "Visual"),
                    description=visual_info.get("detailed_prompt", "")[:100],
                    image_base64=result.get("image_base64"),
                    image_url=result.get("image_url"),
                    display_on_board=True,
                    display_duration_ms=visual_to_display["duration"]
                )
                await streamer.emit_media_ready(media)
                print(f"📸 [Visual] Displayed: {visual_info.get('title', 'Visual')}")
            
            await streamer.emit_narration_segment(narration_segment)
            
            lines_added = formatted_board.count('\n') + 1
            current_content_lines += lines_added
            
            write_duration = board_event.duration_ms / 1000
            narration_duration_sec = narration_duration / 1000
            sync_duration = max(write_duration, narration_duration_sec)
            await asyncio.sleep(sync_duration)
            
            pause_duration = segment.get("pause_after_ms", 500) / 1000
            await streamer.emit_pause(int(pause_duration * 1000))
            await asyncio.sleep(pause_duration)
        
        remaining_visuals = [v_id for v_id in visual_tasks.keys() if v_id not in shown_visuals]
        if remaining_visuals:
            print(f"📊 Showing {len(remaining_visuals)} remaining visuals...")
            for v_id in remaining_visuals[:3]:
                task_info = visual_tasks[v_id]
                task = task_info["task"]
                try:
                    if not task.done():
                        result = await asyncio.wait_for(task, timeout=20)
                    else:
                        result = task.result()
                    
                    if result:
                        visual_info = task_info["info"]
                        media = MediaReadyEvent(
                            media_type=get_media_type(visual_info.get("visual_type", "image")),
                            title=visual_info.get("title", "Visual"),
                            description=visual_info.get("detailed_prompt", "")[:100],
                            image_base64=result.get("image_base64"),
                            image_url=result.get("image_url"),
                            display_on_board=True,
                            display_duration_ms=5000
                        )
                        await streamer.emit_media_ready(media)
                        await asyncio.sleep(3)
                except Exception as e:
                    print(f"Error displaying remaining visual {v_id}: {e}")
        
        if conclusion:
            await streamer.emit_board_clear("fade")
            await asyncio.sleep(0.6)
            
            conclusion_text = conclusion.get("summary_text", "Let me summarize what we learned today...")
            thank_you = conclusion.get("thank_you_message", "Thank you for learning with me!")
            
            conclusion_board = f"Summary\n\n{conclusion_text}\n\n{thank_you}"
            conclusion_event = BoardWriteEvent(
                text=conclusion_board,
                style=BoardWriteStyle.HIGHLIGHT,
                color="yellow",
                size="large",
                char_delay_ms=40,
                duration_ms=len(conclusion_board) * 40,
                sync_with_narration=True
            )
            await streamer.emit_board_write(conclusion_event)
            
            conclusion_narration = NarrationSegment(
                text=f"{conclusion_text} {thank_you}",
                duration_ms=5000,
                speed=0.9,
                pause_after_ms=1000
            )
            await streamer.emit_narration_segment(conclusion_narration)
            await asyncio.sleep(5)
        
        summary = f"Lesson on '{topic}' complete! We covered {total_segments} key concepts with {len(shown_visuals)} visual aids. Thank you for learning!"
        await streamer.emit_lesson_end(summary)
        
        print(f"\n{'='*60}")
        print(f"✅ STREAMING LESSON COMPLETE!")
        print(f"📚 Topic: {topic}")
        print(f"📊 Segments delivered: {total_segments}")
        print(f"🖼️ Visuals shown: {len(shown_visuals)}/{len(visual_plan)}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ Error in streaming lesson: {e}")
        import traceback
        traceback.print_exc()
        await streamer.emit_error(str(e))
    finally:
        pass


streaming_runs: Dict[str, Dict[str, Any]] = {}


async def start_streaming_lesson(run_id: str, topic: str):
    streaming_runs[run_id] = {
        "status": "RUNNING",
        "topic": topic,
        "started_at": datetime.now().isoformat()
    }
    
    await run_streaming_lesson(run_id, topic)
    
    streaming_runs[run_id]["status"] = "COMPLETED"
    streaming_runs[run_id]["completed_at"] = datetime.now().isoformat()


def get_streaming_status(run_id: str) -> Optional[Dict[str, Any]]:
    return streaming_runs.get(run_id)
