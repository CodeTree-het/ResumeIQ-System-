from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from backend.services.resume_analysis_service import (
    analyze_resume,
    get_resume_analysis,
)

from backend.services.resume_service import (
    upload_resume,
    get_candidate_resume_history,
    get_resume_by_id,
    delete_candidate_resume,
    reactivate_candidate_resume,
)

from backend.utils.auth_dependencies import (
    require_candidate,
)


router = APIRouter(
    prefix="/api/resumes",
    tags=["Resumes"]
)


# =========================================================
# Upload Resume
# =========================================================

@router.post(
    "/upload"
)
async def upload_candidate_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(
        require_candidate
    )
):
    if not file.filename:

        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,

            detail=
                "Resume filename is required."
        )


    try:

        file_content = (
            await file.read()
        )


        result = (
            await upload_resume(
                candidate_id=
                    current_user["id"],

                filename=
                    file.filename,

                file_content=
                    file_content
            )
        )


        if not result[
            "success"
        ]:

            raise HTTPException(
                status_code=
                    status.HTTP_400_BAD_REQUEST,

                detail=
                    result[
                        "message"
                    ]
            )


        return {
            "message":
                result[
                    "message"
                ],

            "resume_id":
                result[
                    "resume_id"
                ],

            "original_filename":
                result[
                    "original_filename"
                ],

            "file_type":
                result[
                    "file_type"
                ],

            "text_length":
                result[
                    "text_length"
                ]
        }


    finally:

        await file.close()


# =========================================================
# Resume History
# =========================================================

@router.get(
    ""
)
async def get_my_resume_history(
    current_user: dict = Depends(
        require_candidate
    )
):

    resumes = (
        await
        get_candidate_resume_history(
            candidate_id=
                current_user["id"]
        )
    )


    return {
        "count":
            len(
                resumes
            ),

        "resumes":
            resumes
    }


# =========================================================
# Analyze Resume
# =========================================================

@router.post(
    "/{resume_id}/analyze"
)
async def analyze_candidate_resume(
    resume_id: str,
    current_user: dict = Depends(
        require_candidate
    )
):

    candidate_id = (
        current_user["id"]
    )


    try:

        analysis = (
            await
            analyze_resume(
                resume_id=
                    resume_id,

                candidate_id=
                    candidate_id
            )
        )


        return {
            "message":
                "Resume analyzed successfully.",

            "analysis":
                analysis
        }


    except ValueError as error:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                str(
                    error
                )
        )


# =========================================================
# Get Saved Resume Analysis
# =========================================================

@router.get(
    "/{resume_id}/analysis"
)
async def get_candidate_resume_analysis(
    resume_id: str,
    current_user: dict = Depends(
        require_candidate
    )
):

    candidate_id = (
        current_user["id"]
    )


    analysis = (
        await
        get_resume_analysis(
            resume_id=
                resume_id,

            candidate_id=
                candidate_id
        )
    )


    if not analysis:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Resume analysis not found."
        )


    return {
        "message":
            "Resume analysis retrieved successfully.",

        "analysis":
            analysis
    }


# =========================================================
# Reactivate Resume
# =========================================================

@router.patch(
    "/{resume_id}/reactivate"
)
async def reactivate_resume(
    resume_id: str,
    current_user: dict = Depends(
        require_candidate
    )
):

    result = (
        await
        reactivate_candidate_resume(
            resume_id=
                resume_id,

            candidate_id=
                current_user["id"]
        )
    )


    if not result[
        "success"
    ]:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                result[
                    "message"
                ]
        )


    return {
        "message":
            result[
                "message"
            ],

        "resume_id":
            resume_id
    }


# =========================================================
# Resume Details
# =========================================================

@router.get(
    "/{resume_id}"
)
async def get_resume_details(
    resume_id: str,
    current_user: dict = Depends(
        require_candidate
    )
):

    result = (
        await
        get_resume_by_id(
            resume_id=
                resume_id,

            candidate_id=
                current_user["id"]
        )
    )


    if not result[
        "success"
    ]:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                result[
                    "message"
                ]
        )


    return result[
        "resume"
    ]


# =========================================================
# Delete Resume
# =========================================================

@router.delete(
    "/{resume_id}"
)
async def delete_resume(
    resume_id: str,
    current_user: dict = Depends(
        require_candidate
    )
):

    result = (
        await
        delete_candidate_resume(
            resume_id=
                resume_id,

            candidate_id=
                current_user["id"]
        )
    )


    if not result[
        "success"
    ]:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                result[
                    "message"
                ]
        )


    return {
        "message":
            result[
                "message"
            ]
    }