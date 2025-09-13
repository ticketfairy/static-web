from twelvelabs import TwelveLabs
from twelvelabs.indexes import IndexesCreateRequestModelsItem
from twelvelabs.tasks import TasksRetrieveResponse
import os
from dotenv import load_dotenv
from time import time

load_dotenv()

TWELVE_LABS_API_KEY = os.getenv("TWELVE_LABS_API_KEY")
time = time()
INDEX_NAME = f'ticket-summary-{time}'
PROMPT = '''
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
'''

client = TwelveLabs(api_key=TWELVE_LABS_API_KEY)

# create a new index
index = client.indexes.create(
    index_name=INDEX_NAME,
    models=[
        IndexesCreateRequestModelsItem(
            model_name="pegasus1.2", model_options=["visual", "audio"]
        )
    ]
)
print(f"Created index: id={index.id}")

with open("/Users/sophieyang/Desktop/rippling-test2.mov", "rb") as file:
    task = client.tasks.create(
        index_id=index.id, 
        video_file=file,
    )
    
print(f"Created task: id={task.id}")

def on_task_update(task: TasksRetrieveResponse):
    print(f"  Status={task.status}")

task = client.tasks.wait_for_done(task_id=task.id, callback=on_task_update)
if task.status != "ready":
    raise RuntimeError(f"Indexing failed with status {task.status}")
print(
    f"Upload complete. The unique identifier of your video is {task.video_id}.")

text_stream = client.analyze_stream(video_id=task.video_id, prompt=PROMPT)
for text in text_stream:
    if text.event_type == "text_generation":
        print(text.text)
