import { getErrorMessage } from "@/lib/errors";
import { getMaskedUserKeys, saveUserKeys } from "@/lib/quotas/keys";
import {
  validateElevenLabsKey,
  validateOpenAIKey,
} from "@/lib/quotas/validate-keys";
import { createClient } from "@/lib/supabase/server";

type KeysPayload = {
  openaiKey?: string | null;
  elevenlabsKey?: string | null;
};

function isValidApiKey(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 8 && trimmed.length <= 256;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await getMaskedUserKeys(authData.user.id);

    return Response.json({ keys }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as KeysPayload;

    if (body.openaiKey !== undefined && body.openaiKey !== null) {
      if (!isValidApiKey(body.openaiKey)) {
        return Response.json({ error: "Invalid OpenAI API key" }, { status: 400 });
      }
    }

    if (body.elevenlabsKey !== undefined && body.elevenlabsKey !== null) {
      if (!isValidApiKey(body.elevenlabsKey)) {
        return Response.json(
          { error: "Invalid ElevenLabs API key" },
          { status: 400 },
        );
      }
    }

    if (body.openaiKey === undefined && body.elevenlabsKey === undefined) {
      return Response.json({ error: "No changes provided" }, { status: 400 });
    }

    if (body.openaiKey) {
      const validation = await validateOpenAIKey(body.openaiKey.trim());
      if (!validation.valid) {
        return Response.json(
          { error: validation.error ?? "Invalid OpenAI API key" },
          { status: 400 },
        );
      }
    }

    if (body.elevenlabsKey) {
      const validation = await validateElevenLabsKey(body.elevenlabsKey.trim());
      if (!validation.valid) {
        return Response.json(
          { error: validation.error ?? "Invalid ElevenLabs API key" },
          { status: 400 },
        );
      }
    }

    await saveUserKeys(authData.user.id, body);
    const keys = await getMaskedUserKeys(authData.user.id);

    return Response.json({ keys }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const provider = url.searchParams.get("provider");

    if (provider === "openai") {
      await saveUserKeys(authData.user.id, { openaiKey: null });
    } else if (provider === "elevenlabs") {
      await saveUserKeys(authData.user.id, { elevenlabsKey: null });
    } else {
      await saveUserKeys(authData.user.id, {
        openaiKey: null,
        elevenlabsKey: null,
      });
    }

    const keys = await getMaskedUserKeys(authData.user.id);

    return Response.json({ keys }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
