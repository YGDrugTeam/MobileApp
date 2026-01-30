# app/routers/custom_vision_router.py
from fastapi import HTTPException, APIRouter, UploadFile, File
from app.services.custom_vision_service import predict_image

router = APIRouter(prefix="/custom-vision", tags=["CustomVision"])


# 커스텀 비전 라우터
@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        result = await predict_image(file)
        return {"success": True, "vision_result": result}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Custom Vision 예측 실패: {str(e)}"
        )
