import type { UiMessages } from './en';

/** Thai strings of the `ui` namespace; same shape as `en`. */
const uiTh: UiMessages = {
  actions: {
    add: 'เพิ่ม',
    back: 'ย้อนกลับ',
    cancel: 'ยกเลิก',
    close: 'ปิด',
    confirm: 'ยืนยัน',
    delete: 'ลบ',
    edit: 'แก้ไข',
    reset: 'คืนค่า',
    retry: 'ลองอีกครั้ง',
    save: 'บันทึก',
    search: 'ค้นหา',
    submit: 'ส่ง',
    viewDetails: 'ดูรายละเอียด',
  },
  status: {
    loading: 'กำลังโหลด…',
    processing: 'กำลังดำเนินการ…',
    saving: 'กำลังบันทึก…',
    submitting: 'กำลังส่ง…',
  },
  empty: '-',
  noResults: 'ไม่พบผลลัพธ์',
  errors: {
    unexpected: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
    loadFailed: 'ไม่สามารถโหลดข้อมูลนี้ได้',
  },
  pagination: {
    total: 'ทั้งหมด {count} รายการ',
    perPage: '{size} / หน้า',
    pageOf: 'หน้า {page} จาก {pageCount}',
    rowsPerPage: 'แถวต่อหน้า',
    previous: 'ไปหน้าก่อนหน้า',
    next: 'ไปหน้าถัดไป',
    goToPage: 'ไปหน้า {page}',
  },
  errorPage: {
    title: 'เกิดข้อผิดพลาด',
    description: 'ไม่สามารถดำเนินการตามคำขอได้ กรุณาลองอีกครั้ง',
  },
  notFound: {
    title: 'ไม่พบหน้านี้',
    description: 'หน้าที่คุณต้องการอาจถูกย้ายหรือลบไปแล้ว',
    home: 'กลับหน้าหลัก',
  },
  sidebar: {
    logout: 'ออกจากระบบ',
    loggingOut: 'กำลังออกจากระบบ…',
    profileMenu: 'เมนูบัญชี',
  },
  combobox: {
    empty: 'ไม่พบผลลัพธ์',
    loading: 'กำลังโหลด…',
    loadingMore: 'กำลังโหลดเพิ่มเติม…',
  },
  dateRange: {
    placeholder: 'เลือกวันเริ่มและวันสิ้นสุด',
    clear: 'ล้างวันที่',
    presets: {
      months: '{count} เดือน',
      year: '1 ปี',
      endOfQuarter: 'สิ้นไตรมาส',
      endOfYear: 'สิ้นปี',
    },
  },
  language: 'ภาษา',
  languages: {
    en: 'English',
    th: 'ไทย',
  },
  sessionExpired: {
    title: 'การเข้าสู่ระบบหมดอายุ',
    description:
      'คุณถูกออกจากระบบเนื่องจากเซสชันสิ้นสุดลง เข้าสู่ระบบอีกครั้งเพื่อทำงานต่อ การเปลี่ยนแปลงที่ยังไม่ได้บันทึกอาจสูญหาย',
    action: 'เข้าสู่ระบบอีกครั้ง',
    redirecting: 'กำลังไปยังหน้าเข้าสู่ระบบ…',
  },
  bulk: {
    downloadTemplates: 'ดาวน์โหลดไฟล์ตัวอย่าง <csv>CSV</csv> หรือ <xlsx>Excel</xlsx>',
    importFromFile: 'โหลดจากไฟล์',
    fileLabel: 'ไฟล์ที่จะโหลด',
    readFailed: 'ไม่สามารถอ่านไฟล์ได้ กรุณาใช้ไฟล์ .csv หรือ .xlsx',
    tooManyRows: 'เพิ่มได้สูงสุด {max} แถวต่อครั้ง',
    line: '#',
    outcome: 'ผลลัพธ์',
    actions: 'การดำเนินการ',
    cellLabel: '{column} แถวที่ {line}',
    addRow: 'เพิ่มแถว',
    removeRow: 'ลบแถวที่ {line}',
    removeInvalid: 'ลบ {count} แถวที่ไม่ถูกต้อง',
    ready: 'พร้อมส่ง {count} แถว',
    result: 'สำเร็จ {done} ล้มเหลว {failed} จากทั้งหมด {total} ที่ส่ง',
    fixIssues: 'มี {count} แถวที่ข้อมูลไม่ถูกต้อง กรุณาแก้ไขหรือลบออกก่อน',
    stopped: 'หยุดหลังจากดำเนินการ {processed} จาก {total} แถว',
    noResult: 'ไม่มีผลลัพธ์ส่งกลับมาสำหรับแถวนี้',
    waiting: 'รอดำเนินการ',
    submitting: 'กำลังส่ง {processed}/{total}…',
    retry: 'ลองอีกครั้ง {count} แถวที่ล้มเหลว',
    allDone: 'ดำเนินการครบทุกแถวแล้ว',
  },
};

export default uiTh;
