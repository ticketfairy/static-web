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

load_dotenv()

app = Flask(__name__)
CORS(app)

# set up twelve labs client
TWELVE_LABS_API_KEY = os.getenv("TWELVE_LABS_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

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

        print("DATA IS:", data)
        
        title = data["title"]
        description = data["description"]

        # Create Jira ticket
        result = create_jira_ticket(title, description)

        if result["self"]:
            # return jsonify({
            #     "success": True,
            #     "ticket_key": result["ticket_key"],
            #     "ticket_url": result["ticket_url"]
            # })
            return jsonify(result), 200
        else:
            # return jsonify({
            #     "success": False,
            #     "error": result["error"]
            # }), 400
            return jsonify({"message": "uwu no bueno"}), 400

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


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=4000)
