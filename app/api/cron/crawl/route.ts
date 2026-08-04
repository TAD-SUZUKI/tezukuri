import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. セキュリティチェック
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret");

  const cronSecret = process.env.CRON_SECRET || "default_local_secret";

  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret;

  if (!isAuthorized && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Gemini APIキーのチェック
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    // 3. 自動インポート用ユーザー (Crawler) の取得または作成
    const crawlerEmail = "crawler@system.local";
    let crawlerUser = await prisma.user.findUnique({
      where: { email: crawlerEmail },
    });

    if (!crawlerUser) {
      const hashedPassword = await bcrypt.hash(
        Math.random().toString(36).substring(2, 15),
        10
      );
      crawlerUser = await prisma.user.create({
        data: {
          email: crawlerEmail,
          name: "AI Crawler System",
          password: hashedPassword,
        },
      });
    }

    // 4. Gemini API ＋ Google Search によるイベント情報の検索と抽出
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const prompt = `日本国内で、これから直近3ヶ月以内に開催予定の「手作り市」「ハンドメイドマルシェ」「クラフトフェア」のイベント情報をインターネットから複数件（最大10件程度）検索して取得してください。
必ず実際に予定されているリアルのイベント情報（すでに過去のものは除く）とし、以下のJSON形式の配列で返してください。

日付は必ず「YYYY-MM-DD」形式に変換してください。開始時刻と終了時刻は「HH:MM」形式にしてください（不明な場合は null にしてください）。`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" },
              location: { type: "STRING" },
              date: { type: "STRING", description: "YYYY-MM-DD 形式の年月日" },
              startTime: { type: "STRING", description: "HH:MM 形式の開始時間、不明なら null" },
              endTime: { type: "STRING", description: "HH:MM 形式の終了時間、不明なら null" },
            },
            required: ["title", "location", "date"],
          },
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
    }

    const fetchedEvents = JSON.parse(responseText) as Array<{
      title: string;
      description?: string;
      location: string;
      date: string; // YYYY-MM-DD
      startTime?: string | null;
      endTime?: string | null;
    }>;

    // 5. データベースへの登録処理（重複排除）
    let importedCount = 0;
    let skippedCount = 0;
    const details = [];

    for (const item of fetchedEvents) {
      // 日付文字列を日本時間(JST)のDateオブジェクトにパース
      const parsedDate = new Date(`${item.date}T00:00:00+09:00`);

      // 同一タイトル・同一日付のイベントが既に登録されているか確認
      const existingEvent = await prisma.event.findFirst({
        where: {
          title: item.title,
          date: parsedDate,
        },
      });

      if (existingEvent) {
        skippedCount++;
        details.push({ title: item.title, date: item.date, status: "SKIPPED_DUPLICATE" });
        continue;
      }

      // 新規イベントを status="PENDING" (承認待ち) で作成
      await prisma.event.create({
        data: {
          title: item.title,
          description: item.description || "",
          location: item.location,
          date: parsedDate,
          startTime: item.startTime || null,
          endTime: item.endTime || null,
          status: "PENDING", // 承認待ちとしてインポート
          authorId: crawlerUser.id,
        },
      });

      importedCount++;
      details.push({ title: item.title, date: item.date, status: "IMPORTED_PENDING" });
    }

    return NextResponse.json({
      success: true,
      message: `Crawl completed. Imported: ${importedCount}, Skipped (Duplicate): ${skippedCount}`,
      details,
    });

  } catch (error: any) {
    console.error("Crawler error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
