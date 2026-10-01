import asyncio
from getpass import getpass

from backend.database.mongodb import database
from backend.models.user import UserModel
from backend.utils.security import hash_password


users_collection = database["users"]


async def seed_admin():
    print("\n--- ResumeIQ Admin Setup ---")

    full_name = input("Admin full name: ").strip()
    email = input("Admin email: ").strip().lower()
    password = getpass("Admin password: ")

    if len(full_name) < 2:
        print("Error: Full name must contain at least 2 characters.")
        return

    if "@" not in email:
        print("Error: Please enter a valid email address.")
        return

    if len(password) < 8:
        print("Error: Password must contain at least 8 characters.")
        return

    existing_user = await users_collection.find_one({
        "email": email
    })

    if existing_user:
        print("Error: A user with this email already exists.")
        return

    admin = UserModel(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        role="admin",
        status="active"
    )

    result = await users_collection.insert_one(
        admin.model_dump()
    )

    print("\nAdmin created successfully.")
    print(f"Admin ID: {result.inserted_id}")
    print(f"Admin Email: {email}")


if __name__ == "__main__":
    asyncio.run(seed_admin())