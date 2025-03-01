from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from azure.cosmos import CosmosClient, PartitionKey, exceptions
import uuid
import logging
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HOST = os.getenv("COSMOS_DB_HOST")
MASTER_KEY = os.getenv("COSMOS_DB_MASTER_KEY")
DATABASE_ID = os.getenv("COSMOS_DB_DATABASE_ID")
CONTAINER_ID = os.getenv("COSMOS_DB_CONTAINER_ID")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)


try:
    client = CosmosClient(HOST, MASTER_KEY)
    database = client.get_database_client(DATABASE_ID)
    container = database.get_container_client(CONTAINER_ID)
    logger.info("Successfully connected to Cosmos DB")
except exceptions.CosmosResourceNotFoundError:
   
    client = CosmosClient(HOST, MASTER_KEY)
    database = client.create_database_if_not_exists(id=DATABASE_ID)
    container = database.create_container_if_not_exists(
        id=CONTAINER_ID,
        partition_key=PartitionKey(path="/items"),
        offer_throughput=400
    )
    logger.info("Created new database and container")
except Exception as e:
    logger.error(f"Failed to connect to Cosmos DB: {str(e)}")
    raise


class UserData(BaseModel):
    name: str
    mobile: str

@app.post("/update_user/")
async def submit_data(user_data: UserData):
    try:
        user_id = str(uuid.uuid4())
        item = {
            "id": user_id,
            "name": user_data.name,
            "mobile": user_data.mobile,
        }
        container.create_item(body=item)
        logger.info(f"Data stored successfully for user: {user_data.name}")
        return {"message": "Data stored successfully!", "user_id": user_id}
    except exceptions.CosmosHttpResponseError as e:
        logger.error(f"Cosmos DB error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)