import argparse
import json
import os
import time

from dotenv import load_dotenv
from google import genai
from loguru import logger
from supabase import create_client, Client

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.google.llm import GoogleLLMService
from pipecat.services.llm_service import FunctionCallParams
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.network.fastapi_websocket import FastAPIWebsocketParams
from pipecat.transports.services.daily import DailyParams

load_dotenv(override=True)

# Initialize the client globally
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def search_talks_full_text(query: str, limit: int = 5):
    # Split the query into words, search for any of them
    words = [w.strip(".,!?\"'") for w in query.split() if len(w) > 2]
    if not words:
        words = [query]
    filters = ",".join([f"title.ilike.%{w}%" for w in words] + [f"description.ilike.%{w}%" for w in words])
    response = (
        supabase.table("talks")
        .select("id, title, description")
        .or_(filters)
        .limit(limit)
        .execute()
    )
    return response.data if response.data else []


def get_rag_content():
    """Get the RAG content from the file."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    rag_content_path = os.path.join(script_dir, "assets", "rag-content.txt")
    with open(rag_content_path, "r") as f:
        return f.read()


RAG_MODEL = "gemini-2.0-flash-lite-preview-02-05"
VOICE_MODEL = "gemini-2.0-flash"
RAG_CONTENT = get_rag_content()
RAG_PROMPT = f"""
You are a helpful assistant designed to answer user questions based solely on the provided knowledge base.

**Instructions:**

1.  **Knowledge Base Only:** Answer questions *exclusively* using the information in the "Knowledge Base" section below. Do not use any outside information.
2.  **Conversation History:** Use the "Conversation History" (ordered oldest to newest) to understand the context of the current question.
3.  **Concise Response:**  Respond in 50 words or fewer.  The response will be spoken, so avoid symbols, abbreviations, or complex formatting. Use plain, natural language.
4.  **Unknown Answer:** If the answer is not found within the "Knowledge Base," respond with "I don't know." Do not guess or make up an answer.
5. Do not introduce your response. Just provide the answer.
6. You must follow all instructions.

**Input Format:**

Each request will include:

*   **Conversation History:**  (A list of previous user and assistant messages, if any)

**Knowledge Base:**
Here is the knowledge base you have access to:
{RAG_CONTENT}
"""


async def query_knowledge_base(params: FunctionCallParams):
    """Query the knowledge base for the answer to the question."""
    logger.info(f"Querying knowledge base for question: {params.arguments['question']}")

    # Search the talks table for relevant rows
    search_results = search_talks_full_text(params.arguments["question"])
    if search_results:
        kb = "\n".join([
            f"Title: {row['title']}\nDescription: {row.get('description', '')}" for row in search_results
        ])
    else:
        kb = "No relevant talks found."

    # for our case, the first two messages are the instructions and the user message
    conversation_turns = params.context.messages[2:]
    messages = []
    for turn in conversation_turns:
        messages.extend(params.context.to_standard_messages(turn))
    def _is_tool_call(turn):
        if turn.get("role", None) == "tool":
            return True
        if turn.get("tool_calls", None):
            return True
        return False
    messages = [turn for turn in messages if not _is_tool_call(turn)]
    messages = messages[-3:]
    messages_json = json.dumps(messages, ensure_ascii=False, indent=2)

    start = time.perf_counter()
    full_prompt = f"System: You are a helpful assistant designed to answer user questions based solely on the provided knowledge base.\n\n**Knowledge Base:**\n{kb}\n\nConversation History: {messages_json}"

    response = await client.aio.models.generate_content(
        model=RAG_MODEL,
        contents=[full_prompt],
        config={
            "temperature": 0.1,
            "max_output_tokens": 64,
        },
    )
    end = time.perf_counter()
    logger.info(f"Time taken: {end - start:.2f} seconds")
    logger.info(response.text)
    await params.result_callback(response.text)


# We store functions so objects (e.g. SileroVADAnalyzer) don't get
# instantiated. The function will be called when the desired transport gets
# selected.
transport_params = {
    "daily": lambda: DailyParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        vad_analyzer=SileroVADAnalyzer(),
    ),
    "twilio": lambda: FastAPIWebsocketParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        vad_analyzer=SileroVADAnalyzer(),
    ),
    "webrtc": lambda: TransportParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        vad_analyzer=SileroVADAnalyzer(),
    ),
}


async def run_example(transport: BaseTransport, _: argparse.Namespace, handle_sigint: bool):
    logger.info(f"Starting bot")

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id=os.getenv("CARTESIA_VOICE_ID"),  # Get voice ID from environment variable
    )

    llm = GoogleLLMService(
        model=VOICE_MODEL,
        api_key=os.getenv("GOOGLE_API_KEY"),
    )
    llm.register_function("query_knowledge_base", query_knowledge_base)
    tools = [
        {
            "function_declarations": [
                {
                    "name": "query_knowledge_base",
                    "description": "Query the knowledge base for the answer to the question.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "question": {
                                "type": "string",
                                "description": "The question to query the knowledge base with.",
                            },
                        },
                    },
                },
            ],
        },
    ]
    system_prompt = """\
You are a helpful assistant who converses with a user and answers questions.

You have access to the tool, query_knowledge_base, that allows you to query the knowledge base for the answer to the user's question.

Your response will be turned into speech so use only simple words and punctuation.
"""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Greet the user."},
    ]

    context = OpenAILLMContext(messages, tools)
    context_aggregator = llm.create_context_aggregator(context)

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            context_aggregator.user(),
            llm,
            tts,
            transport.output(),
            context_aggregator.assistant(),
        ]
    )
    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected")
        # Start conversation - empty prompt to let LLM follow system instructions
        await task.queue_frames([context_aggregator.user().get_context_frame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Client disconnected")
        await task.cancel()

    runner = PipelineRunner(handle_sigint=handle_sigint)
    await runner.run(task)


if __name__ == "__main__":
    from run import main

    main(run_example, transport_params=transport_params)