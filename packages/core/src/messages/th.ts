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
};

export default uiTh;
