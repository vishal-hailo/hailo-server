from fastapi import FastAPI, APIRouter, Request, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'hailo')]

# Node.js backend URL
NODE_BACKEND_URL = "http://localhost:8002"

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# HTTPX client for proxying
http_client = httpx.AsyncClient(timeout=30.0)

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Root route
@api_router.get("/")
async def root():
    return {"message": "HailO API Gateway", "node_backend": NODE_BACKEND_URL}

# Status check routes
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Proxy all /api/v1/* requests to Node.js backend
@app.api_route("/api/v1/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_node(request: Request, path: str):
    """Proxy requests to Node.js backend"""
    target_url = f"{NODE_BACKEND_URL}/api/v1/{path}"
    
    # Get query parameters
    query_string = str(request.query_params)
    if query_string:
        target_url += f"?{query_string}"
    
    # Get headers (exclude host)
    headers = dict(request.headers)
    headers.pop("host", None)
    
    # Get body if present
    body = await request.body()
    
    try:
        response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body if body else None,
        )
        
        # Return response
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.headers.get("content-type", "application/json")
        )
    except httpx.ConnectError:
        return Response(
            content='{"error": "Node.js backend not available", "hint": "Please ensure the Node.js server is running on port 8002"}',
            status_code=503,
            media_type="application/json"
        )
    except Exception as e:
        logging.error(f"Proxy error: {e}")
        return Response(
            content=f'{{"error": "Proxy error", "details": "{str(e)}"}}',
            status_code=500,
            media_type="application/json"
        )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    await http_client.aclose()
