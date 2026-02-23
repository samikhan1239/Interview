import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const response = await fetch(
"https://sami10902.pythonanywhere.com/pred",

      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch  {
    return NextResponse.json(
      { error: "ML service unavailable" },
      { status: 500 }
    );
  }
}
