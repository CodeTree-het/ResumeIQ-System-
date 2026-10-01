from pathlib import Path
from uuid import uuid4

from bson import ObjectId
from bson.errors import InvalidId

from backend.database.mongodb import database
from backend.models.resume import ResumeModel
from backend.utils.file_parser import extract_resume_text
from backend.utils.validators import (
    validate_resume_extension,
    validate_resume_size,
)


resumes_collection = database["resumes"]

RESUME_STORAGE_PATH = Path(
    "storage/resumes"
)


# =========================================================
# Upload Resume
# =========================================================

async def upload_resume(
    candidate_id: str,
    filename: str,
    file_content: bytes
):
    if not validate_resume_extension(
        filename
    ):
        return {
            "success": False,
            "message":
                "Only PDF and DOCX resume files are allowed."
        }

    if not validate_resume_size(
        file_content
    ):
        return {
            "success": False,
            "message":
                "Resume file size must be 10 MB or less."
        }

    try:

        extracted_text = (
            extract_resume_text(
                filename=filename,
                file_content=file_content
            )
        )

    except ValueError as error:

        return {
            "success": False,
            "message":
                str(error)
        }


    RESUME_STORAGE_PATH.mkdir(
        parents=True,
        exist_ok=True
    )


    extension = (
        Path(filename)
        .suffix
        .lower()
    )


    unique_filename = (
        f"{uuid4().hex}{extension}"
    )


    file_path = (
        RESUME_STORAGE_PATH
        /
        unique_filename
    )


    try:

        # -----------------------------------------
        # Save Resume File
        # -----------------------------------------

        with open(
            file_path,
            "wb"
        ) as saved_file:

            saved_file.write(
                file_content
            )


        # -----------------------------------------
        # Deactivate Previous Active Resume
        # -----------------------------------------

        await resumes_collection.update_many(
            {
                "candidate_id":
                    candidate_id,

                "is_active":
                    True
            },
            {
                "$set": {
                    "is_active":
                        False
                }
            }
        )


        # -----------------------------------------
        # Create Resume Document
        # -----------------------------------------

        resume = ResumeModel(
            candidate_id=
                candidate_id,

            original_filename=
                filename,

            stored_filename=
                unique_filename,

            file_path=
                str(file_path),

            file_type=
                extension.replace(
                    ".",
                    ""
                ),

            extracted_text=
                extracted_text,

            is_active=
                True
        )


        # -----------------------------------------
        # Insert MongoDB
        # -----------------------------------------

        result = (
            await
            resumes_collection
            .insert_one(
                resume.model_dump()
            )
        )


        return {
            "success":
                True,

            "message":
                "Resume uploaded successfully.",

            "resume_id":
                str(
                    result.inserted_id
                ),

            "original_filename":
                filename,

            "file_type":
                extension.replace(
                    ".",
                    ""
                ),

            "text_length":
                len(
                    extracted_text
                )
        }


    except Exception as error:

        if file_path.exists():

            file_path.unlink()


        return {
            "success":
                False,

            "message":
                (
                    "Unable to save resume: "
                    f"{str(error)}"
                )
        }


# =========================================================
# Resume History
# =========================================================

async def get_candidate_resume_history(
    candidate_id: str
):
    resumes = []


    cursor = (
        resumes_collection
        .find(
            {
                "candidate_id":
                    candidate_id
            },
            {
                "extracted_text":
                    0
            }
        )
        .sort(
            "uploaded_at",
            -1
        )
    )


    async for resume in cursor:

        resumes.append(
            {
                "resume_id":
                    str(
                        resume["_id"]
                    ),

                "original_filename":
                    resume[
                        "original_filename"
                    ],

                "stored_filename":
                    resume[
                        "stored_filename"
                    ],

                "file_type":
                    resume[
                        "file_type"
                    ],

                "is_active":
                    resume.get(
                        "is_active",
                        False
                    ),

                "uploaded_at":
                    resume[
                        "uploaded_at"
                    ]
            }
        )


    return resumes


# =========================================================
# Get Resume By ID
# =========================================================

async def get_resume_by_id(
    resume_id: str,
    candidate_id: str
):
    try:

        object_id = ObjectId(
            resume_id
        )

    except InvalidId:

        return {
            "success":
                False,

            "message":
                "Invalid resume ID."
        }


    resume = (
        await
        resumes_collection
        .find_one(
            {
                "_id":
                    object_id,

                "candidate_id":
                    candidate_id
            }
        )
    )


    if not resume:

        return {
            "success":
                False,

            "message":
                "Resume not found."
        }


    return {
        "success":
            True,

        "resume": {

            "resume_id":
                str(
                    resume["_id"]
                ),

            "original_filename":
                resume[
                    "original_filename"
                ],

            "stored_filename":
                resume[
                    "stored_filename"
                ],

            "file_path":
                resume[
                    "file_path"
                ],

            "file_type":
                resume[
                    "file_type"
                ],

            "extracted_text":
                resume[
                    "extracted_text"
                ],

            "is_active":
                resume.get(
                    "is_active",
                    False
                ),

            "uploaded_at":
                resume[
                    "uploaded_at"
                ]
        }
    }


# =========================================================
# Delete Resume
# =========================================================

async def delete_candidate_resume(
    resume_id: str,
    candidate_id: str
):
    try:

        object_id = ObjectId(
            resume_id
        )

    except InvalidId:

        return {
            "success":
                False,

            "message":
                "Invalid resume ID."
        }


    resume = (
        await
        resumes_collection
        .find_one(
            {
                "_id":
                    object_id,

                "candidate_id":
                    candidate_id
            }
        )
    )


    if not resume:

        return {
            "success":
                False,

            "message":
                "Resume not found."
        }


    file_path = Path(
        resume["file_path"]
    )


    try:

        # -----------------------------------------
        # Remove Physical File
        # -----------------------------------------

        if file_path.exists():

            file_path.unlink()


        # -----------------------------------------
        # Remove MongoDB Resume
        # -----------------------------------------

        await resumes_collection.delete_one(
            {
                "_id":
                    object_id,

                "candidate_id":
                    candidate_id
            }
        )


        # -----------------------------------------
        # If Active Resume Deleted,
        # Activate Latest Previous Resume
        # -----------------------------------------

        if resume.get(
            "is_active",
            False
        ):

            latest_resume = (
                await
                resumes_collection
                .find_one(
                    {
                        "candidate_id":
                            candidate_id
                    },
                    sort=[
                        (
                            "uploaded_at",
                            -1
                        )
                    ]
                )
            )


            if latest_resume:

                await (
                    resumes_collection
                    .update_one(
                        {
                            "_id":
                                latest_resume[
                                    "_id"
                                ]
                        },
                        {
                            "$set": {
                                "is_active":
                                    True
                            }
                        }
                    )
                )


        return {
            "success":
                True,

            "message":
                "Resume deleted successfully."
        }


    except Exception as error:

        return {
            "success":
                False,

            "message":
                (
                    "Unable to delete resume: "
                    f"{str(error)}"
                )
        }


# =========================================================
# Reactivate Resume
# =========================================================

async def reactivate_candidate_resume(
    resume_id: str,
    candidate_id: str
):
    # -----------------------------------------------------
    # Validate Resume ID
    # -----------------------------------------------------

    try:

        object_id = ObjectId(
            resume_id
        )

    except InvalidId:

        return {
            "success":
                False,

            "message":
                "Invalid resume ID."
        }


    # -----------------------------------------------------
    # Find Candidate Resume
    # -----------------------------------------------------

    resume = (
        await
        resumes_collection
        .find_one(
            {
                "_id":
                    object_id,

                "candidate_id":
                    candidate_id
            }
        )
    )


    if not resume:

        return {
            "success":
                False,

            "message":
                "Resume not found."
        }


    # -----------------------------------------------------
    # Already Active
    # -----------------------------------------------------

    if resume.get(
        "is_active",
        False
    ):

        return {
            "success":
                True,

            "message":
                "Resume is already active."
        }


    try:

        # -------------------------------------------------
        # Deactivate Current Active Resume
        #
        # Only one active resume should exist
        # for one candidate.
        # -------------------------------------------------

        await resumes_collection.update_many(
            {
                "candidate_id":
                    candidate_id,

                "is_active":
                    True
            },
            {
                "$set": {
                    "is_active":
                        False
                }
            }
        )


        # -------------------------------------------------
        # Activate Selected Old Resume
        # -------------------------------------------------

        result = (
            await
            resumes_collection
            .update_one(
                {
                    "_id":
                        object_id,

                    "candidate_id":
                        candidate_id
                },
                {
                    "$set": {
                        "is_active":
                            True
                    }
                }
            )
        )


        if (
            result.matched_count
            ==
            0
        ):

            return {
                "success":
                    False,

                "message":
                    "Resume not found."
            }


        return {
            "success":
                True,

            "message":
                "Resume reactivated successfully.",

            "resume_id":
                resume_id
        }


    except Exception as error:

        return {
            "success":
                False,

            "message":
                (
                    "Unable to reactivate resume: "
                    f"{str(error)}"
                )
        }