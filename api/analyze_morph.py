import base64
import json
import os
import re
from http.server import BaseHTTPRequestHandler

import google.generativeai as genai

MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8MB safety cap
MODEL_NAME = "gemini-flash-latest"

MISSING_IMAGE_ERROR = "사진을 업로드해주세요"
SERVER_ERROR = "잠시 후 다시 시도해주세요"

PROMPT = """당신은 크레스티드 게코(Crested Gecko) 모프 감별 전문가입니다.
첨부된 사진 속 크레스티드 게코의 색상, 패턴, 무늬를 분석해서 가능성이 높은 모프(morph) 후보를 알려주세요.

다음 JSON 형식으로만 답변하고, 다른 설명이나 마크다운 없이 JSON만 출력하세요:

{
  "candidates": [
    {"name": "모프 이름", "confidence": 0-100 사이의 정수, "description": "이 모프라고 판단한 근거를 한글로 1~2문장"}
  ],
  "summary": "전체 분석에 대한 한글 요약 2~3문장"
}

candidates는 가능성이 높은 순서로 최대 3개까지 포함하고, confidence 합은 100 이하가 되도록 하세요.
사진에 크레스티드 게코가 보이지 않거나 분석이 불가능하면 candidates를 빈 배열로 두고 summary에 이유를 한글로 설명하세요."""


def _send_json(req_handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req_handler.send_response(status)
    req_handler.send_header("Content-Type", "application/json; charset=utf-8")
    req_handler.send_header("Content-Length", str(len(body)))
    req_handler.end_headers()
    req_handler.wfile.write(body)


def _parse_data_url(data_url):
    if not isinstance(data_url, str):
        return None, None
    match = re.match(r"^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$", data_url, re.DOTALL)
    if not match:
        return None, None
    mime_type = match.group(1)
    try:
        image_bytes = base64.b64decode(match.group(2), validate=True)
    except Exception:
        return None, None
    if not image_bytes:
        return None, None
    return mime_type, image_bytes


def _extract_json(text):
    text = (text or "").strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1)
    else:
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            text = brace_match.group(0)
    return json.loads(text)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
        except (TypeError, ValueError):
            content_length = 0

        if content_length <= 0:
            _send_json(self, 400, {"error": MISSING_IMAGE_ERROR})
            return

        if content_length > MAX_IMAGE_BYTES:
            _send_json(self, 400, {"error": "사진 용량이 너무 커요. 더 작은 사진으로 시도해주세요"})
            return

        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception:
            _send_json(self, 400, {"error": MISSING_IMAGE_ERROR})
            return

        image_data_url = payload.get("image") if isinstance(payload, dict) else None
        if not image_data_url:
            _send_json(self, 400, {"error": MISSING_IMAGE_ERROR})
            return

        mime_type, image_bytes = _parse_data_url(image_data_url)
        if not mime_type or not image_bytes:
            _send_json(self, 400, {"error": MISSING_IMAGE_ERROR})
            return

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY is not set")
            _send_json(self, 500, {"error": SERVER_ERROR})
            return

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(MODEL_NAME)
            response = model.generate_content(
                [
                    PROMPT,
                    {"mime_type": mime_type, "data": image_bytes},
                ]
            )
            result_json = _extract_json(response.text)
        except Exception as exc:
            print("Gemini analysis failed:", exc)
            _send_json(self, 500, {"error": SERVER_ERROR})
            return

        if not isinstance(result_json, dict) or "candidates" not in result_json:
            print("Unexpected Gemini response shape:", result_json)
            _send_json(self, 500, {"error": SERVER_ERROR})
            return

        _send_json(self, 200, {"success": True, "result": result_json})

    def do_GET(self):
        _send_json(self, 405, {"error": "POST 요청으로 사진을 전송해주세요"})
