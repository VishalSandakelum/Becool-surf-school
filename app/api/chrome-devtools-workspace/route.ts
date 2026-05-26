import { NextResponse } from "next/server";

// Stable UUID identifying this project for Chrome DevTools' workspace mapping.
// Generated once with `crypto.randomUUID()`; safe to commit.
const WORKSPACE_UUID = "9b6b7e4f-2b6a-4c3a-8e5d-2c7f4a1d9e10";

export function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json({
    workspace: {
      root: process.cwd(),
      uuid: WORKSPACE_UUID,
    },
  });
}
