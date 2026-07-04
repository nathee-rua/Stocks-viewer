import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { symbol, alertType, value, currentValue } = await request.json();

    if (!symbol || !alertType || value === undefined || currentValue === undefined) {
      return NextResponse.json({ success: false, error: 'ข้อมูลสำหรับส่งแจ้งเตือนไม่ครบถ้วน' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    // ดึงค่า Telegram Bot Token และ Chat ID จากโปรไฟล์ผู้ใช้
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_bot_token, telegram_chat_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.telegram_bot_token || !profile?.telegram_chat_id) {
      return NextResponse.json({ success: false, error: 'ไม่ได้ตั้งค่าข้อมูลสำหรับเชื่อมต่อ Telegram หรือดึงข้อมูลผิดพลาด' });
    }

    const { telegram_bot_token, telegram_chat_id } = profile;

    // แปลงรูปแบบข้อความการแจ้งเตือน
    let conditionText = '';
    let currentValText = '';

    if (alertType === 'price_above') {
      conditionText = `ราคาสูงกว่า $${value}`;
      currentValText = `$${currentValue}`;
    } else if (alertType === 'price_below') {
      conditionText = `ราคาต่ำกว่า $${value}`;
      currentValText = `$${currentValue}`;
    } else if (alertType === 'percent_above') {
      conditionText = `การเปลี่ยนแปลงสูงกว่า +${value}%`;
      currentValText = `+${currentValue}%`;
    } else if (alertType === 'percent_below') {
      conditionText = `การเปลี่ยนแปลงต่ำกว่า ${value}%`;
      currentValText = `${currentValue}%`;
    }

    const timeStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    const message = `⚠️ *Stocks Tracker Alert!*
📈 ดัชนี/หุ้น *${symbol}* ตรงกับเงื่อนไขแจ้งเตือน
* *เงื่อนไข:* ${conditionText}
* *ค่าปัจจุบัน:* ${currentValText}
* *วันเวลา:* ${timeStr}`;

    const telegramUrl = `https://api.telegram.org/bot${telegram_bot_token}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegram_chat_id,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json({ success: false, error: errData.description || 'ไม่สามารถส่งการแจ้งเตือนไปยัง Telegram' });
    }

    return NextResponse.json({ success: true, message: 'ส่งแจ้งเตือน Telegram สำเร็จ!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'เกิดข้อผิดพลาดในการประมวลผลการส่งแจ้งเตือน' });
  }
}
