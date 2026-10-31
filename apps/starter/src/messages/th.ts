import ui from '@whimui/core/messages/th';

import type en from './en';

const th: typeof en = {
  ui,
  tasks: {
    title: 'รายการงาน',
    demo: 'API ตัวอย่าง: ข้อมูลใช้ร่วมกันใน server process นี้และหายเมื่อเริ่มใหม่ ต้องเชื่อม backend และระบบยืนยันตัวตนก่อนนำไปใช้งานจริง',
    search: 'ค้นหางาน',
    add: 'เพิ่มงาน',
    edit: 'แก้ไข',
    remove: 'ลบ',
    confirmDelete: 'ต้องการลบงานนี้หรือไม่?',
    name: 'ชื่องาน',
    completed: 'เสร็จแล้ว',
    pending: 'ยังไม่เสร็จ',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    saving: 'กำลังบันทึก…',
    loading: 'กำลังโหลด…',
    refreshing: 'กำลังอัปเดต…',
    empty: 'ไม่พบรายการงาน',
    failed: 'ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง',
    invalidTitle: 'กรอกชื่องานตั้งแต่ 1–120 ตัวอักษร',
    duplicate: 'มีชื่องานนี้แล้ว',
    retry: 'ลองอีกครั้ง',
    previous: 'ก่อนหน้า',
    next: 'ถัดไป',
    page: 'หน้า {page} จาก {total}',
  },
};

export default th;
