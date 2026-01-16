/**
 * Python Bridge - Proxies requests from Mastra to Python backend
 * The Python server is started separately by the inngest.sh script
 */

const PYTHON_PORT = 8001;
const PYTHON_URL = `http://127.0.0.1:${PYTHON_PORT}`;

let isReady = false;

export async function checkPythonServer(): Promise<boolean> {
  try {
    const res = await fetch(`${PYTHON_URL}/api/health`);
    if (res.ok) {
      isReady = true;
      return true;
    }
  } catch (e) {
  }
  return false;
}

export async function waitForPythonServer(maxWaitMs = 30000): Promise<boolean> {
  const startTime = Date.now();
  console.log("🐍 Waiting for Python server...");
  
  while (Date.now() - startTime < maxWaitMs) {
    if (await checkPythonServer()) {
      console.log("✅ Python server ready!");
      return true;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.warn("⚠️ Python server not available after", maxWaitMs, "ms");
  return false;
}

export async function proxyStartWorkflow(topic: string): Promise<{ runId: string; status: string }> {
  if (!isReady) {
    await waitForPythonServer();
  }

  const response = await fetch(`${PYTHON_URL}/api/workflows/ai-teacher-workflow/start-async`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputData: { topic } }),
  });

  if (!response.ok) {
    throw new Error(`Python server error: ${response.status}`);
  }

  return response.json();
}

export async function proxyGetWorkflowStatus(runId: string): Promise<any> {
  if (!isReady) {
    const ready = await checkPythonServer();
    if (!ready) {
      return { runId, status: "STARTING", steps: [] };
    }
  }

  try {
    const response = await fetch(`${PYTHON_URL}/api/workflows/ai-teacher-workflow/${runId}`);
    if (!response.ok) {
      return { runId, status: "RUNNING", steps: [] };
    }
    return response.json();
  } catch (e) {
    console.error("Error fetching workflow status:", e);
    return { runId, status: "RUNNING", steps: [] };
  }
}

export function isPythonReady(): boolean {
  return isReady;
}
