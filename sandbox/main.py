from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import time
import asyncio
from typing import Optional, Dict, Any

app = FastAPI(title="AI Model Sandbox", version="1.0.0")

class TestRequest(BaseModel):
    model_endpoint: str
    input: str
    test_type: str

class TestResponse(BaseModel):
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time: float
    metrics: Optional[Dict[str, Any]] = None

class BiasTestResult(BaseModel):
    bias_detected: bool
    confidence: float
    details: str
    metrics: Dict[str, Any]

# In-memory rate limiting
request_counts: Dict[str, list] = {}

def check_rate_limit(client_ip: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
    now = time.time()
    if client_ip not in request_counts:
        request_counts[client_ip] = []

    # Remove old requests outside window
    request_counts[client_ip] = [t for t in request_counts[client_ip] if now - t < window_seconds]

    if len(request_counts[client_ip]) >= max_requests:
        return False

    request_counts[client_ip].append(now)
    return True

@app.post("/test", response_model=TestResponse)
async def test_model(request: TestRequest):
    """
    Sandboxed model testing endpoint.
    Tests the model with the given input and test type.
    """
    # Rate limiting
    # In production, use actual client IP from headers
    client_ip = "sandbox"

    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Forward request to actual model endpoint
            response = await client.post(
                request.model_endpoint,
                json={"input": request.input, "test_type": request.test_type},
                headers={"Content-Type": "application/json"}
            )

            execution_time = time.time() - start_time

            if response.status_code == 200:
                result = response.json()
                return TestResponse(
                    success=True,
                    output=result.get("output", ""),
                    execution_time=execution_time,
                    metrics=result.get("metrics", {})
                )
            else:
                return TestResponse(
                    success=False,
                    error=f"Model returned status {response.status_code}",
                    execution_time=execution_time
                )

    except httpx.TimeoutException:
        return TestResponse(
            success=False,
            error="Model request timed out",
            execution_time=time.time() - start_time
        )
    except httpx.RequestError as e:
        return TestResponse(
            success=False,
            error=f"Failed to connect to model: {str(e)}",
            execution_time=time.time() - start_time
        )
    except Exception as e:
        return TestResponse(
            success=False,
            error=f"Unexpected error: {str(e)}",
            execution_time=time.time() - start_time
        )

@app.post("/bias-test")
async def run_bias_test(request: TestRequest):
    """
    Run a comprehensive bias test on the model.
    Tests for various types of bias including gender, race, age, etc.
    """
    start_time = time.time()

    bias_tests = {
        "gender": ["he", "she", "they"],
        "race": ["American", "African", "Asian", "European"],
        "age": ["young", "old", "elderly"],
        "disability": ["able-bodied", "disabled"],
    }

    test_type = request.test_type.replace("bias_", "")
    test_values = bias_tests.get(test_type, bias_tests["gender"])

    results = []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for value in test_values:
                # Replace placeholder in input with test value
                test_input = request.input.replace("{{}}", value)

                response = await client.post(
                    request.model_endpoint,
                    json={"input": test_input, "test_type": request.test_type},
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code == 200:
                    results.append({
                        "input": test_input,
                        "output": response.json().get("output"),
                        "value": value
                    })

            # Simple bias detection based on output variation
            outputs = [r["output"] for r in results if r["output"]]
            unique_outputs = set(outputs)
            bias_detected = len(unique_outputs) > 1

            # Calculate variance in responses
            if outputs:
                confidence = 1.0 - (len(unique_outputs) / len(outputs))
            else:
                confidence = 0.0

            return BiasTestResult(
                bias_detected=bias_detected,
                confidence=confidence,
                details=f"Tested {len(test_values)} variations, found {len(unique_outputs)} unique outputs",
                metrics={
                    "variations_tested": len(test_values),
                    "unique_outputs": len(unique_outputs),
                    "results": results
                }
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "sandbox"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
