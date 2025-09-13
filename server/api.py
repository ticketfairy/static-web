from flask import Flask, request, jsonify
from flask_cors import CORS
from twelvelabs import TwelveLabs
from twelvelabs.indexes import IndexesCreateRequestModelsItem
from twelvelabs.tasks import TasksRetrieveResponse
import os
from dotenv import load_dotenv
from time import time
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# set up twelve labs client
TWELVE_LABS_API_KEY = os.getenv("TWELVE_LABS_API_KEY")

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
- Focus only on actionable developer tasks (ignore filler or unrelated conversation).
- Use plain, professional language suitable for a ticketing system.
- Summarize user intent rather than transcribing verbatim.
- If requirements are ambiguous, clearly state assumptions in the description.
"""


@app.route("/analyze-video", methods=["POST"])
def analyze_video():
    try:
        # Get video URL from request
        data = request.get_json()
        if not data or "video_url" not in data:
            return jsonify({"error": "video_url is required"}), 400

        video_url = data["video_url"]

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

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=4000)
