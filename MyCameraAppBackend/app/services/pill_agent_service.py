from app.services.custom_vision_service import predict_image


async def analyze_pill(file):
    print("\n[PillAgent] analyze_pill 시작")

    vision_result = await predict_image(file)
    print("[PillAgent] Custom Vision 결과 수신 완료")

    predictions = vision_result.get("predictions", [])
    print(f"[PillAgent] predictions 개수: {len(predictions)}")

    if not predictions:
        print("[PillAgent] ❌ 예측 결과 없음")
        return {"success": False, "message": "알약을 인식하지 못했습니다."}

    for p in predictions:
        # 여기서 태그네임이 아닌 알약 그대로 가져오는 코드로 고치기
        print(
            f"[PillAgent] 후보 태그: {p['tagName']} "
            f"(확률: {round(p['probability'], 3)})"
        )

    top = max(predictions, key=lambda x: x["probability"])

    print(
        f"[PillAgent] ✅ 최고 확률 태그: {top['tagName']} "
        f"(확률: {round(top['probability'], 3)})"
    )

    if top["probability"] < 0.7:
        print("[PillAgent] ❌ 신뢰도 부족")
        return {
            "success": False,
            "message": "알약 인식 신뢰도가 낮습니다.",
            "confidence": round(top["probability"], 3),
        }

    result = {
        "success": True,
        "pill_name": top["tagName"],
        "confidence": round(top["probability"], 3),
        "analysis": generate_pill_description(top["tagName"]),
    }

    print("[PillAgent] 최종 응답:")
    print(result)

    return result


def generate_pill_description(pill_name: str):
    print(f"[PillAgent] 설명 생성 중: {pill_name}")

    return {
        "description": f"{pill_name}으로 추정되는 알약입니다.",
        "features": {
            "shape": "원형 또는 타원형",
            "color": "흰색 계열",
            "engraving": "문자 또는 숫자 음각",
            "type": "정제형",
        },
        "warning": "정확한 식별을 위해 약사 상담을 권장합니다.",
    }
