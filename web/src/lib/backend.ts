import path from "node:path";

// The map pipeline (../map-pipeline) is a sibling of this app. Only the
// /api/refresh route uses these — nothing else in the app touches Python.
export function backendDir() {
  return process.env.BACKEND_DIR || path.resolve(process.cwd(), "../map-pipeline");
}

export function backendPython() {
  return process.env.BACKEND_PYTHON || path.join(backendDir(), ".venv", "bin", "python");
}

export function refreshStatusPath() {
  return path.join(backendDir(), "data/refresh_status.json");
}
