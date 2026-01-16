"""
AI Teacher Agent using LangGraph
Orchestrates educational content generation
"""
import os
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from tools.lesson_tools import ALL_TOOLS

def create_ai_teacher_agent():
    """Create the AI Teacher agent with all educational tools"""
    
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        base_url=os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL"),
        api_key=os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY"),
        temperature=0.7
    )
    
    system_prompt = """You are an expert AI Teacher that creates comprehensive educational lessons.

Your role is to generate engaging, multi-modal educational content including:
- Structured lesson plans
- Blackboard/whiteboard content
- Visual diagrams
- Educational images
- 3D simulations
- Video storyboards

When asked to teach a topic, use the available tools to create rich educational content.
Always be clear, accurate, and age-appropriate for the target audience.

For each lesson, systematically use the tools in this order:
1. lesson_planner - Create the lesson structure
2. board_writer - Generate blackboard content
3. diagram_creator - Create visual diagrams
4. image_generator - Describe educational images
5. simulation_3d_creator - Design 3D simulations
6. video_storyboard - Plan video content
7. quality_reviewer - Review the final content

Be concise but thorough in your responses."""

    agent = create_react_agent(
        model=llm,
        tools=ALL_TOOLS,
        prompt=system_prompt
    )
    
    return agent

ai_teacher_agent = create_ai_teacher_agent()
