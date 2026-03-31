import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getTastemaker } from "@/lib/tastemakers";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { tastemakerIds, work, stream } = await request.json();

    if (!tastemakerIds || !Array.isArray(tastemakerIds) || tastemakerIds.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one tastemaker" },
        { status: 400 }
      );
    }

    if (!work || typeof work !== "string" || work.trim().length === 0) {
      return NextResponse.json(
        { error: "Please describe your creative work" },
        { status: 400 }
      );
    }

    // Streaming mode: stream all tastemakers in parallel as SSE
    if (stream) {
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          const send = (data: object | string) => {
            const payload = typeof data === "string" ? data : JSON.stringify(data);
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          };

          // Launch all tastemaker streams in parallel
          const streamPromises = tastemakerIds.map(async (id: string) => {
            const tastemaker = getTastemaker(id);
            if (!tastemaker) {
              send({ id, error: "Tastemaker not found" });
              return;
            }

            send({ id: tastemaker.id, name: tastemaker.name, event: "start" });

            const messageStream = anthropic.messages.stream({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1500,
              system: tastemaker.systemPrompt,
              messages: [
                {
                  role: "user",
                  content: `Please evaluate this creative work:\n\n${work}`,
                },
              ],
            });

            for await (const event of messageStream) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                send({ id: tastemaker.id, delta: event.delta.text });
              }
            }

            send({ id: tastemaker.id, event: "done" });
          });

          await Promise.all(streamPromises);
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming fallback
    const results = await Promise.all(
      tastemakerIds.map(async (id: string) => {
        const tastemaker = getTastemaker(id);
        if (!tastemaker) {
          return { id, error: "Tastemaker not found" };
        }

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: tastemaker.systemPrompt,
          messages: [
            {
              role: "user",
              content: `Please evaluate this creative work:\n\n${work}`,
            },
          ],
        });

        const responseText =
          message.content[0].type === "text" ? message.content[0].text : "";

        return {
          id: tastemaker.id,
          name: tastemaker.name,
          response: responseText,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error querying tastemakers:", error);
    return NextResponse.json(
      { error: "Failed to get response from tastemakers" },
      { status: 500 }
    );
  }
}
