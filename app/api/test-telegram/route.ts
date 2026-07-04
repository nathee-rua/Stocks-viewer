import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { botToken, chatId } = await request.json();

    if (!botToken || !chatId) {
      return NextResponse.json({ success: false, error: 'กรุณากรอก Bot Token และ Chat ID ให้ครบถ้วน' }, { status: 400 });
    }

    const message = `🔔 *Stocks Tracker*
ทดสอบการเชื่อมต่อ Telegram Bot สำเร็จแล้ว! บัญชีของคุณเชื่อมต่อเรียบร้อยแล้วค่ะ.`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: false, error: data.description || 'การส่งข้อความไปยัง Telegram ล้มเหลว' });
    }

    return NextResponse.json({ success: true, message: 'ส่งข้อความทดสอบไปยัง Telegram สำเร็จแล้ว!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Telegram API' });
  }
}
