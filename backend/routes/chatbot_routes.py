from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    status,
)

from backend.schemas.chatbot_schema import (
    ChatbotRequest,
)

from backend.services.chatbot_service import (
    process_chatbot_message,
)

from backend.utils.auth_dependencies import (
    get_current_user,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/chatbot",
    tags=["Chatbot"]
)


# =========================================================
# CHAT
#
# POST /api/chatbot/message
# =========================================================

@router.post(
    "/message",
    status_code=status.HTTP_200_OK
)
async def chatbot_message(

    chatbot_data: ChatbotRequest = Body(
        ...,
        examples=[
            {
                "message":
                    "OTP nathi aavyo",

                "context": {
                    "page":
                        "settings",

                    "issue_type":
                        "email_change"
                }
            }
        ]
    ),

    current_user: dict = Depends(
        get_current_user
    )
):

    try:

        result = await process_chatbot_message(
            chatbot_data,
            current_user
        )


        if not result.get(
            "success",
            False
        ):

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get(
                    "message",
                    "Unable to process chatbot request."
                )
            )


        return result


    except HTTPException:

        raise


    except Exception as error:

        print(
            "Chatbot route error:",
            error
        )


        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "ResumeIQ Assistant encountered an internal error."
            )
        )