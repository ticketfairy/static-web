from flask import Flask, request, jsonify
from flask_cors import CORS
from twelvelabs import TwelveLabs
from twelvelabs.indexes import IndexesCreateRequestModelsItem
from twelvelabs.tasks import TasksRetrieveResponse
import os
from dotenv import load_dotenv
from time import time
import json
import cohere
from jira_integration import create_jira_ticket
from linear_integration import create_linear_issue
from claude_agent import create_pr_from_ticket, ClaudeCodeAgent

load_dotenv()

app = Flask(__name__)
CORS(app)

# set up twelve labs client
TWELVE_LABS_API_KEY = os.getenv("TWELVE_LABS_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

PROMPT = """
### Prompt:
Analyze the following video and extract the key information about the requested changes. Create a concise, action-oriented developer ticket in JSON format. 
Ensure the title is short, specific, and reflects the core task, while the description provides enough detail for a developer to understand context, requirements, and intent.

### Output format (JSON):

{
  "title": "<clear, concise summary of the change>",
  "description": "<detailed explanation of the problem, goal, and desired outcome, including context from the video>"
}

### Guidelines:
- Ignore filler or unrelated conversation
- Use plain, professional language suitable for a ticketing system.
- If any numbers or specifics are mentioned in the video, include the specific number or spec
- Write ticket in bullet point and make bulletpoints follow sections of What, Why, and How
- If context is not mentioned in the video, leave the section empty, do not fill with any information that is NOT mentioned in the video
"""

@app.route("/analyze-video", methods=["POST"])
def analyze_video():
    try:
        # Get video URL from request
        data = request.get_json()
        if not data or "video_url" not in data:
            return jsonify({"error": "video_url is required"}), 400

        video_url = data["video_url"]
        user_notes = data["user_notes"]

        # Create TwelveLabs client
        client = TwelveLabs(api_key=TWELVE_LABS_API_KEY)

        # Create a new index with timestamp
        current_time = time()
        index_name = f"ticket-summary-{current_time}"

        index = client.indexes.create(
            index_name=index_name,
            models=[
                IndexesCreateRequestModelsItem(
                    model_name="pegasus1.2", model_options=["visual", "audio"]
                )
            ],
        )

        # Create a new task with video URL
        task = client.tasks.create(
            index_id=index.id,
            video_url=video_url,
        )

        # Wait for task completion
        def on_task_update(task: TasksRetrieveResponse):
            print(f"Status: {task.status}")

        task = client.tasks.wait_for_done(task_id=task.id, callback=on_task_update)

        if task.status != "ready":
            return (
                jsonify({"error": f"Video indexing failed with status: {task.status}"}),
                500,
            )

        # Analyze the video and get the ticket
        text_stream = client.analyze_stream(video_id=task.video_id, prompt=PROMPT)

        result_text = ""
        for text in text_stream:
            if text.event_type == "text_generation":
                result_text += text.text

        # Try to parse the JSON response
        try:
            ticket_data = json.loads(result_text)
            print(ticket_data)

            # Enhance description with user notes using Cohere
            if user_notes and user_notes.strip():
                enhanced_description = enhance_description_with_notes(
                    ticket_data.get("description", ""), user_notes
                )
                ticket_data["description"] = enhanced_description

            return jsonify(
                {
                    "success": True,
                    "ticket": ticket_data,
                    "video_id": task.video_id,
                    "index_id": index.id,
                }
            )
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw text
            return jsonify(
                {
                    "success": True,
                    "raw_response": result_text,
                    "video_id": task.video_id,
                    "index_id": index.id,
                }
            )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/create-jira-ticket", methods=["POST"])
def create_jira_ticket_endpoint():
    try:
        # Get ticket data from request
        data = request.get_json()
        if not data or "title" not in data or "description" not in data:
            return jsonify({"error": "title and description are required"}), 400

        title = data["title"]
        description = data["description"]

        # Create Jira ticket
        result = create_jira_ticket(title, description)

        if result["self"]:
            return jsonify(result), 200
        else:
            return jsonify({"error": "Failed to create ticket"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/create-linear-issue", methods=["POST"])
def create_linear_issue_endpoint():
    try:
        # Get ticket data from request
        data = request.get_json()
        if not data or "title" not in data or "description" not in data:
            return jsonify({"error": "title and description are required"}), 400

        title = data["title"]
        description = data["description"]
        team_id = data.get("team_id")  # Optional team ID

        # Create Linear issue
        result = create_linear_issue(title, description, team_id)

        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def enhance_description_with_notes(original_description, user_notes):
    """Use Cohere to enhance the ticket description by incorporating user notes."""
    try:
        co = cohere.ClientV2(COHERE_API_KEY)

        prompt = f"""You are helping to create a developer ticket. You have an original description from video analysis and additional user notes. Your task is to create an enhanced description that incorporates the key ideas from the user notes while maintaining the structure and clarity of the original description.

            Original Description:
            {original_description}

            User Notes:
            {user_notes}

            Please create an enhanced description that:
            1. Keeps the core information from the original description
            2. Incorporates relevant insights and requirements from the user notes
            3. Maintains a professional, developer-friendly tone
            4. Ensures the description is actionable and clear
            5. Removes any redundancy between the original and notes

            Return only the enhanced description, no additional commentary."""

        response = co.chat(
            model="command-r-03-2024", messages=[{"role": "user", "content": prompt}]
        )

        return response.message.content[0].text

    except Exception as e:
        print(f"Error enhancing description with Cohere: {e}")
        # Fallback: append user notes to original description
        return f"{original_description}\n\nAdditional Notes:\n{user_notes}"


@app.route("/enhance-ticket", methods=["POST"])
def enhance_ticket():
    """Use Cohere to enhance ticket title and description based on additional context."""
    try:
        data = request.get_json()
        if not data or "title" not in data or "description" not in data or "context" not in data:
            return jsonify({"error": "title, description, and context are required"}), 400

        original_title = data["title"]
        original_description = data["description"]
        additional_context = data["context"]

        if not additional_context.strip():
            return jsonify({
                "success": True,
                "title": original_title,
                "description": original_description
            })

        co = cohere.ClientV2(COHERE_API_KEY)

        # Enhance the title
        title_prompt = f"""You are helping to improve a developer ticket title. You have an original title and additional context. Create an enhanced title that is concise, specific, and incorporates key insights from the context.

Original Title: {original_title}

Additional Context: {additional_context}

Please create an enhanced title that:
1. Remains concise (under 80 characters)
2. Is more specific and actionable than the original
3. Incorporates key insights from the additional context
4. Uses clear, professional language suitable for a ticketing system

Return only the enhanced title, no additional commentary."""

        title_response = co.chat(
            model="command-r-03-2024", 
            messages=[{"role": "user", "content": title_prompt}]
        )
        enhanced_title = title_response.message.content[0].text.strip()

        # Enhance the description
        description_prompt = f"""You are helping to improve a developer ticket description. You have an original description and additional context. Create an enhanced description that incorporates the additional context while maintaining clarity and actionability.

Original Description: {original_description}

Additional Context: {additional_context}

Please create an enhanced description that:
1. Keeps the core information from the original description
2. Incorporates relevant insights and requirements from the additional context
3. Maintains a professional, developer-friendly tone
4. Ensures the description is actionable and clear
5. Removes any redundancy between the original and context
6. Provides clear acceptance criteria or next steps when possible

Return only the enhanced description, no additional commentary."""

        description_response = co.chat(
            model="command-r-03-2024", 
            messages=[{"role": "user", "content": description_prompt}]
        )
        enhanced_description = description_response.message.content[0].text.strip()

        return jsonify({
            "success": True,
            "title": enhanced_title,
            "description": enhanced_description
        })

    except Exception as e:
        print(f"Error enhancing ticket with Cohere: {e}")


@app.route("/generate-pr", methods=["POST"])
def generate_pr():
    """
    Generate a GitHub PR from a ticket description using Claude agent
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        # Required fields
        ticket_description = data.get("ticket_description")
        repo_name = data.get("repo_name")
        
        if not ticket_description:
            return jsonify({"error": "ticket_description is required"}), 400
        if not repo_name:
            return jsonify({"error": "repo_name is required (format: owner/repo)"}), 400
        
        # Optional fields
        base_branch = data.get("base_branch", "main")
        github_token = data.get("github_token", GITHUB_TOKEN)
        anthropic_api_key = data.get("anthropic_api_key", ANTHROPIC_API_KEY)
        
        # Validate tokens
        if not github_token:
            return jsonify({"error": "GitHub token is required (set GITHUB_TOKEN env var or provide in request)"}), 400
        if not anthropic_api_key:
            return jsonify({"error": "Anthropic API key is required (set ANTHROPIC_API_KEY env var or provide in request)"}), 400
        
        # Generate PR using Claude agent
        try:
            result = create_pr_from_ticket(
                ticket_description=ticket_description,
                repo_name=repo_name,
                github_token=github_token,
                anthropic_api_key=anthropic_api_key,
                base_branch=base_branch
            )
        except Exception as e:
            print(f"Error in create_pr_from_ticket: {e}")
            return jsonify({
                "success": False,
                "error": f"Agent initialization or execution failed: {str(e)}"
            }), 500
        
        if result.success:
            return jsonify({
                "success": True,
                "pr_url": result.pr_url,
                "pr_number": result.pr_number,
                "message": f"Successfully created PR #{result.pr_number}"
            })
        else:
            return jsonify({
                "success": False,
                "error": result.error_message
            }), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analyze-ticket", methods=["POST"])
def analyze_ticket():
    """
    Analyze a ticket description using Claude to extract requirements and implementation plan
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        ticket_description = data.get("ticket_description")
        repo_name = data.get("repo_name")
        
        if not ticket_description:
            return jsonify({"error": "ticket_description is required"}), 400
        
        anthropic_api_key = data.get("anthropic_api_key", ANTHROPIC_API_KEY)
        github_token = data.get("github_token", GITHUB_TOKEN)
        
        if not anthropic_api_key:
            return jsonify({"error": "Anthropic API key is required"}), 400
        
        # Create agent instance
        agent = ClaudeCodeAgent(github_token or "", anthropic_api_key)
        
        # Get repository context if repo_name is provided
        repository_context = ""
        local_path = ""
        if repo_name and github_token:
            try:
                _, local_path = agent.clone_repository(repo_name)
                repository_context = agent.get_repository_structure(local_path)
            except Exception as e:
                print(f"Could not get repository context: {e}")
        
        # Analyze the ticket and get implementation
        analysis, code_changes = agent.analyze_ticket(ticket_description, repository_context, local_path)
        
        return jsonify({
            "success": True,
            "analysis": {
                "title": analysis.title,
                "description": analysis.description,
                "requirements": analysis.requirements,
                "files_to_modify": analysis.files_to_modify,
                "implementation_plan": analysis.implementation_plan,
                "estimated_complexity": analysis.estimated_complexity,
                "ticket_number": analysis.ticket_number
            },
            "code_changes": [
                {
                    "file_path": change.file_path,
                    "change_description": change.change_description,
                    "content_preview": change.new_content[:200] + "..." if len(change.new_content) > 200 else change.new_content
                }
                for change in code_changes
            ]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/agent-status", methods=["GET"])
def agent_status():
    """
    Check if the Claude agent is properly configured
    """
    try:
        status = {
            "github_token_configured": bool(GITHUB_TOKEN),
            "anthropic_api_key_configured": bool(ANTHROPIC_API_KEY),
            "agent_ready": bool(GITHUB_TOKEN and ANTHROPIC_API_KEY)
        }
        
        return jsonify(status)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/test-claude", methods=["POST"])
def test_claude():
    """
    Test Claude agent with a simple ticket analysis
    """
    try:
        data = request.get_json()
        ticket_description = data.get("ticket_description", "Add a simple hello world function to the codebase")
        
        anthropic_api_key = data.get("anthropic_api_key", ANTHROPIC_API_KEY)
        if not anthropic_api_key:
            return jsonify({"error": "Anthropic API key is required"}), 400
        
        # Test the ticket analysis and implementation
        agent = ClaudeCodeAgent("", anthropic_api_key)
        analysis, code_changes = agent.analyze_ticket(ticket_description, "Sample repository with src/ directory")
        
        return jsonify({
            "success": True,
            "analysis": {
                "title": analysis.title,
                "description": analysis.description,
                "requirements": analysis.requirements,
                "files_to_modify": analysis.files_to_modify,
                "implementation_plan": analysis.implementation_plan,
                "estimated_complexity": analysis.estimated_complexity
            },
            "code_changes": [
                {
                    "file_path": change.file_path,
                    "change_description": change.change_description,
                    "content_preview": change.new_content[:200] + "..." if len(change.new_content) > 200 else change.new_content
                }
                for change in code_changes
            ]
        })
        
    except Exception as e:
        import traceback
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=4000)
