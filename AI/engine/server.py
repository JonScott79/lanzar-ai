"""
    server.py

    Local HTTP inference server bridge for LANZAR-001 model engine.

    Responsibilities:
    - Expose lightweight REST and OpenAI-compatible endpoints for web application integration
    - Stream token completions in real-time using Server-Sent Events (SSE)
    - Provide model health, parameter diagnostics, and persona-aligned generation
"""

import sys
import json
import time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from typing import List, Dict, Any

# Ensure root is on path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from AI.engine.api.model_engine import LanzarModelEngine


# Global engine instance
engine = None
server_start_time = time.time()


class LanzarRequestHandler(BaseHTTPRequestHandler):

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        try:
            if self.path in ("/health", "/api/stats", "/v1/models"):
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self._set_cors_headers()
                self.end_headers()

                if self.path == "/v1/models":
                    payload = {
                        "object": "list",
                        "data": [
                            {
                                "id": "lanzar-001",
                                "object": "model",
                                "created": int(server_start_time),
                                "owned_by": "lanzar-ai",
                                "parameters": engine.model.get_num_params() if engine and engine.model else 0
                            }
                        ]
                    }
                else:
                    stats = engine.get_stats() if engine else {"status": "uninitialized"}
                    stats["uptime_seconds"] = int(time.time() - server_start_time)
                    payload = stats

                self.wfile.write(json.dumps(payload).encode("utf-8"))
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def do_POST(self):
        if self.path in ("/api/generate", "/api/chat", "/v1/chat/completions"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            try:
                data = json.loads(body.decode("utf-8"))
                stream = data.get("stream", False)
                max_tokens = int(data.get("max_tokens", 100))
                temperature = float(data.get("temperature", 0.7))

                # Format prompt from messages if available, or direct prompt
                prompt = self._extract_prompt(data)

                if stream:
                    self._handle_streaming_response(prompt, max_tokens, temperature)
                else:
                    self._handle_standard_response(prompt, max_tokens, temperature)

            except Exception as e:
                import traceback
                traceback.print_exc()
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def _extract_prompt(self, data: Dict[str, Any]) -> str:
        if "prompt" in data and isinstance(data["prompt"], str):
            return data["prompt"]

        messages = data.get("messages", [])
        if not messages:
            return ""

        # Limit conversation history to the most recent messages to avoid context overflow
        # Context window for LanzarModelConfig.tiny is 128 tokens
        recent_messages = messages[-8:] if len(messages) > 8 else messages

        formatted_lines = []
        for msg in recent_messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            persona = msg.get("persona", "").lower()
            if role == "system":
                formatted_lines.append(f"[SYSTEM]: {content}")
            elif role == "user":
                formatted_lines.append(f"[USER]: {content}")
            elif role == "assistant":
                if persona == "penny":
                    formatted_lines.append(f"[PENNY]: {content}")
                elif persona == "pete":
                    formatted_lines.append(f"[PETE]: {content}")
                elif persona == "mina":
                    formatted_lines.append(f"[MINA]: {content}")
                else:
                    formatted_lines.append(f"[LANZAR]: {content}")

        formatted_lines.append("[LANZAR]:")
        return "\n".join(formatted_lines)

    def _handle_standard_response(self, prompt: str, max_tokens: int, temperature: float):
        response_text = engine.generate(
            prompt=prompt,
            max_new_tokens=max_tokens,
            temperature=temperature,
            include_prompt=False
        )

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._set_cors_headers()
        self.end_headers()

        response_payload = {
            "id": f"chatcmpl-{int(time.time()*1000)}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": engine.config.model_name if engine else "lanzar-001",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": response_text
                    },
                    "finish_reason": "stop"
                }
            ],
            "text": response_text
        }
        self.wfile.write(json.dumps(response_payload).encode("utf-8"))

    def _handle_streaming_response(self, prompt: str, max_tokens: int, temperature: float):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "close")
        self._set_cors_headers()
        self.end_headers()

        req_id = f"chatcmpl-{int(time.time()*1000)}"
        model_name = engine.config.model_name if engine else "lanzar-001"

        try:
            for token in engine.stream_generate(prompt=prompt, max_new_tokens=max_tokens, temperature=temperature):
                chunk = {
                    "id": req_id,
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": model_name,
                    "choices": [
                        {
                            "index": 0,
                            "delta": {
                                "content": token
                            },
                            "finish_reason": None
                        }
                    ]
                }
                sse_payload = f"data: {json.dumps(chunk)}\n\n"
                self.wfile.write(sse_payload.encode("utf-8"))
                self.wfile.flush()

            # End of stream chunk
            end_chunk = {
                "id": req_id,
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": model_name,
                "choices": [
                    {
                        "index": 0,
                        "delta": {},
                        "finish_reason": "stop"
                    }
                ]
            }
            self.wfile.write(f"data: {json.dumps(end_chunk)}\n\n".encode("utf-8"))
            self.wfile.write(b"data: [DONE]\n\n")
            self.wfile.flush()

        except (ConnectionResetError, BrokenPipeError):
            pass
        finally:
            self.close_connection = True


def run_server(port: int = 5050):
    global engine
    print(f"[LANZAR Server] Initializing LANZAR-001 Model Engine...")
    engine = LanzarModelEngine()
    
    # Auto-load latest checkpoint if available
    ckpt_dir = Path(__file__).resolve().parent / "checkpoints"
    ckpt_path = ckpt_dir / "LANZAR-001-Tiny_step_150.pt"
    if ckpt_path.exists():
        try:
            meta = engine.load_checkpoint(str(ckpt_path))
            print(f"[LANZAR Server] Loaded checkpoint: {ckpt_path.name} (Step: {meta.get('step', 0)}, Loss: {meta.get('loss', 0.0):.4f})")
        except Exception as e:
            print(f"[LANZAR Server] Notice: Could not load checkpoint ({e}), using initialized weights.")

    print(f"[LANZAR Server] Model online ({engine.model.get_num_params():,} parameters).")

    server_address = ("", port)
    httpd = ThreadingHTTPServer(server_address, LanzarRequestHandler)
    print(f"[LANZAR Server] HTTP API listening at http://localhost:{port}/")
    httpd.serve_forever()


if __name__ == "__main__":
    run_server()

