<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# กฎการทำงานสำหรับเอเจนต์ (Agent Custom Rules)
1. **ตอบกลับเป็นภาษาไทยก่อนเสมอ:** เอเจนต์จะต้องเขียนอธิบายและตอบกลับผู้ใช้เป็นภาษาไทยอันดับแรกก่อน โดยสามารถใช้คำศัพท์เทคนิคที่เป็นภาษาอังกฤษปนได้ (ภาษาไทยเป็นภาษาหลัก)
2. **การทดสอบและตรวจสอบ (Verify):** ทุกครั้งที่ทำงานหรือแก้ไขโค้ดเสร็จสิ้น เอเจนต์จะต้องทำการทดสอบ (เช่น รันคำสั่งบิลด์/รันโค้ดตรวจสอบ) และรายงานผลการตรวจยืนยันความถูกต้องก่อนเสมอ
3. **สรุปผลการปรับปรุงและข้อเสนอแนะ:** สรุปผลลัพธ์ของสิ่งสำคัญที่ได้แก้ไขไป หรือมีคำแนะนำเพิ่มเติมส่งให้กับผู้ใช้หลังจากงานนั้น ๆ เสร็จสิ้นลง
4. **จัดการ Git และ Vercel:** เมื่อทำการแก้ไขและตรวจสอบเรียบร้อยแล้ว ให้สั่ง Git Add/Commit/Push ขึ้น Github และสั่ง deploy ขึ้น Vercel ทุกครั้ง

