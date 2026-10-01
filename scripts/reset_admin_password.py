import asyncio

from backend.database.mongodb import database
from backend.utils.security import hash_password


users_collection = database["users"]


async def reset_admin_password():
    email = "admin@resumeiq.com"
    new_password = "Admin@1234"

    result = await users_collection.update_one(
        {
            "email": email,
            "role": "admin"
        },
        {
            "$set": {
                "password_hash": hash_password(new_password)
            }
        }
    )

    if result.matched_count == 0:
        print("Admin user not found.")
        return

    print("Admin password reset successfully.")
    print(f"Email: {email}")


if __name__ == "__main__":
    asyncio.run(reset_admin_password())