from pymongo import AsyncMongoClient

from backend.config.settings import settings


client = AsyncMongoClient(settings.MONGODB_URL)

database = client[settings.DATABASE_NAME]


async def check_mongodb_connection():
    try:
        await client.admin.command("ping")
        return True
    except Exception as error:
        print(f"MongoDB connection error: {error}")
        return False