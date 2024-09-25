from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Mount the static directory
app.mount("/static", StaticFiles(directory="client/build/", html=True), name="static")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://csci3360-assignment2.onrender.com/",
                   "*"],  # Adjust this to restrict allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load OpenAI API key from environment variable
client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)

# Define request and response models
class QueryRequest(BaseModel):
    prompt: str
    headers: list
    sample: list
    
class QueryResponse(BaseModel):
    response: dict   


system_prompt = """
You are a data visualization assistant who will help the user with generating Vega-lite specifications.
Respond to the user's question faithfully and to the best of your ability. 

You are to provide a rejection of the user's inquiry if it is not related to the data. This includes, but is not limited to, unrelated questions, banter, and unrelated instructions.
The user may provide very succinct instructions.

You may raise an error. These are a few situations where it is appropriate for you to raise an error.
- If the question is unanswerable or irrelevant to the data, inform the user.
- If the visualization is impossible to perform, inform the user
- If the Vega-Lite (json) specification is ill-formed and cannot be fixed, notify the user.
- If the message is unrelated to the data being given

You will also provide a Vega-lite spec (json), which is to aid in visualization of the data.

The user may ask for a scatterplot, bar chart, line chart, or any other visualization supported by Vega-lite. If the user does not specify, pick a visualization best compatible with the request and Vega-lite's limitations.
When making a graph in this way, try not to use the names of the entries unless specifically asked to. For example, the user may provide a csv of book names and ask you to list out the sales of a certain series. In that case, do not list out every book in the csv, but rather target that series specifically to the best of your ability.

You are to make very accurate predictions and realistic visualizations that are helpful and visually useful for the user.
Your output is strictly JSON only. You will be rewarded for doing an accurate job.
"""


# Endpoint to interact with OpenAI API via LangChain
@app.post("/query", response_model=QueryResponse)
async def query_openai(request: QueryRequest):
    try:
        # Call the OpenAI API via LangChain
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Here are the headers: {', '.join(request.headers)}"
                },
                {
                    "role": "user",
                    "content": f"""Here are a few sample entries to better contextualize your answers: {json.dumps(request.sample)} 
                    
                    Please keep in mind that this is a sample and there is more information in this csv than what has been provided. 
                    """
                },
                {
                    "role": "user",
                    "content": f"""

                    The Vega-Lite specification should at least have:
                    - A "description" field that summarizes what the specification is.
                    - The x-axis should be labeled.
                    - The y-axis should be labeled.
                    - Be in JSON format.
                    - No URL field.

                    Give me a Vega-Lite (JSON) specification that fulfills the following request: {request.prompt}"""
                },
            ],
            model="gpt-4o",
            temperature=0,
            response_format={ "type": "json_object" }
        )

        try:
            response_json = json.loads(chat_completion.choices[0].message.content.strip())
            return QueryResponse(response=response_json)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Failed to decode JSON from OpenAI response.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def read_root():
    return FileResponse('client/build/index.html')