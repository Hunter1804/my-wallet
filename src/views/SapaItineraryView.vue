<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useItineraryStore, type ItineraryItem } from '@/stores/itinerary'
import Modal from '@/components/Modal.vue'
import ItineraryForm from '@/components/ItineraryForm.vue'

const store = useItineraryStore()
const { itemsByDay, loading } = storeToRefs(store)

const activeTab = ref('schedule')
const isEditMode = ref(false)
const isModalOpen = ref(false)
const editingItem = ref<Partial<ItineraryItem> | undefined>()

const tabs = [
  { id: 'schedule', icon: '🗓️', label: 'Lịch Trình' },
  { id: 'cafe',     icon: '☕', label: 'Café Check-in' },
  { id: 'budget',   icon: '💰', label: 'Chi Phí' },
  { id: 'tips',     icon: '💡', label: 'Mẹo & Lưu Ý' },
]

const stars = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  d: (2 + Math.random() * 4).toFixed(1),
  delay: (Math.random() * 3).toFixed(1),
}))

// Initial data for seeding if database is empty
const initialSchedule = [
  {
    id: 1, bg: '#e8f5ec', color: '#2d5a3d',
    title: 'Đến Sapa · Nhà thờ Đá · Hàm Rồng · Cát Cát',
    subtitle: 'Khám phá trung tâm & bản làng gần thị trấn',
    items: [
      { time:'05:30', type:'move',    name:'🚌 Xe giường nằm từ Hà Nội',          addr:'Bến xe Mỹ Đình / Giáp Bát',         note:'Đặt vé trước, xe chạy qua đêm ~5-6h',    cost:'200K – 300K' },
      { time:'07:30', type:'move',    name:'🏨 Nhận phòng / gửi đồ tại khách sạn', addr:'Khu TT. Sapa',                       note:'Check-in sớm hoặc gửi đồ, tắm rửa nghỉ ngơi', cost:'300K – 600K/đêm' },
      { time:'07:30', type:'morning', name:'🍜 Phở gà Sơn Râu ⭐4.8',             addr:'19 Đ. Đông Lợi, TT. Sapa',           note:'Ấm bụng buổi sáng sương mù, mở 6h–10h', cost:'40K – 60K' },
      { time:'09:00', type:'sight',   name:'⛪ Nhà thờ Đá (Stone Church) ⭐4.4',  addr:'P. Hàm Rồng, TT. Sapa',             note:'Biểu tượng Sapa, kiến trúc Gothic Pháp 1895. Chụp ảnh đẹp nhất khi còn sương mù buổi sáng', cost:'Miễn phí' },
      { time:'10:00', type:'sight',   name:'⛰️ Núi Hàm Rồng ⭐4.3',               addr:'Đường Lên, TT. Sapa',                note:'View nhìn toàn thị trấn & Fansipan, vườn hoa, leo ~1.5h', cost:'70K/người' },
      { time:'11:30', type:'cafe',    name:'☕ Viettrekking Coffee (check-in)',    addr:'33 Hoàng Liên, TT. Sapa',            note:'Ngồi ngoài trời ngắm cáp treo đơn ray chạy ngang — rất instagrammable', cost:'30K – 60K' },
      { time:'12:00', type:'lunch',   name:'🍲 Chợ Tình Quán 63D ⭐4.8',          addr:'63D Fansipan, TT. Sapa',             note:'Lẩu cá hồi/cá tầm, đánh giá cao nhất Sapa', cost:'150K – 250K' },
      { time:'14:00', type:'sight',   name:'🏘️ Bản Cát Cát',                      addr:'San Sả Hồ (~2km từ TT)',             note:'Trekking nhẹ 2km, văn hóa H\'Mông, thác nhỏ, múa dân tộc', cost:'100K vé' },
      { time:'17:30', type:'sight',   name:'🌅 Hoàng hôn tại Quảng trường Sapa', addr:'Khu TT. Sapa',                       note:'Ngắm núi lúc hoàng hôn, mua đồ ăn vặt vỉa hè', cost:'Miễn phí' },
      { time:'19:00', type:'dinner',  name:'🍛 A Phủ Restaurant ⭐4.7',            addr:'15 Fansipan, TT. Sapa',              note:'Thịt ngựa, lẩu cá tầm, có nhạc sống dân tộc rất hay', cost:'150K – 200K' },
      { time:'20:30', type:'shop',    name:'🛍️ Dạo chợ đêm Sapa',                addr:'Khu trung tâm TT. Sapa',             note:'Thổ cẩm, táo mèo, rượu ngô, nhớ mặc cả', cost:'Tùy ý' },
    ]
  },
  {
    id: 2, bg: '#e3f0fd', color: '#0d47a1',
    title: 'Fansipan · Mường Hoa · Bản Tả Van',
    subtitle: 'Chinh phục đỉnh cao & trekking ruộng bậc thang',
    items: [
      { time:'06:30', type:'morning', name:'🍜 Phở Bò Vàng Sapa ⭐4.6',           addr:'103B Đ. Thạch Sơn, TT. Sapa',       note:'Mở từ 5h sáng, phở bò đậm đà ấm người', cost:'50K – 70K' },
      { time:'08:00', type:'sight',   name:'🚠 Cáp treo Fansipan – Sun World ⭐4.5', addr:'Nguyễn Chí Thanh, Sapa',          note:'⚡ ĐẶT VÉ TRƯỚC trên app Sun World! Cáp treo dài nhất TG, đỉnh 3.143m, mặc áo ấm', cost:'750K – 900K' },
      { time:'12:30', type:'lunch',   name:'🍱 Ăn trưa khu Fansipan Legend',       addr:'Sun World Fansipan',                note:'Nhà hàng trong khu hoặc mang đồ ăn nhẹ lên trước', cost:'100K – 180K' },
      { time:'14:00', type:'sight',   name:'🌾 Trekking Thung lũng Mường Hoa ⭐4.6', addr:'Lao Chải → Tả Van (~12km)',      note:'Ruộng bậc thang đẹp nhất Sapa, qua bản làng H\'Mông, nên thuê guide', cost:'Miễn phí / Guide 200K' },
      { time:'15:00', type:'cafe',    name:'☕ Terrace View Coffee ⭐4.9',          addr:'Y Linh Ho (giữa đường trek)',        note:'BEST VIEW ruộng bậc thang! Chủ quán thân thiện, cho uống Happy Water miễn phí', cost:'20K – 40K' },
      { time:'17:30', type:'sight',   name:'🏘️ Bản Tả Van – check-in hoàng hôn',  addr:'Tả Van (~14km từ TT)',              note:'Người Giáy, không khí bình yên, ít du khách hơn Cát Cát', cost:'Miễn phí' },
      { time:'19:00', type:'dinner',  name:'🍲 Thắng Cố A Quỳnh ⭐4.6',            addr:'15 Đ. Thạch Sơn, TT. Sapa',        note:'Thắng cố ngựa đặc trưng Tây Bắc, lẩu hỗn hợp, trải nghiệm ẩm thực địa phương', cost:'150K – 250K' },
    ]
  },
  {
    id: 3, bg: '#fff3e0', color: '#e65100',
    title: 'Đèo Ô Quy Hồ · Thác Tình Yêu · Thác Bạc',
    subtitle: 'Cảnh quan hùng vĩ & trở về Hà Nội',
    items: [
      { time:'07:00', type:'morning', name:'🥣 Xôi ngô / Bánh cuốn chợ Sapa',     addr:'Chợ trung tâm Sapa',                note:'Ẩm thực vỉa hè đặc trưng, ấm bụng trước chuyến đèo dài', cost:'30K – 50K' },
      { time:'08:30', type:'sight',   name:'🏔️ Đèo Ô Quy Hồ ⭐4.7 + chụp ảnh',  addr:'Cách Sapa ~25km hướng Lai Châu',   note:'View hùng vĩ nhất miền Bắc. Đẹp nhất 10h–14h. Thử xiên nướng tại điểm nhìn!', cost:'20K phí điểm nhìn' },
      { time:'10:45', type:'cafe',    name:'☕ Nga Cảnh Best View ⭐4.8',           addr:'Gần khu Mường Hoa, Sapa',           note:'View panorama ruộng + ruộng bậc thang từ trên cao, ít đông đúc, cực bình yên', cost:'30K – 60K' },
      { time:'12:00', type:'sight',   name:'💦 Thác Tình Yêu (Love Waterfall) ⭐4.5', addr:'Sơn Bình, Bình Lư (~20km từ TT)', note:'Đẹp hơn và yên tĩnh hơn Thác Bạc, đi bộ ~1.5km vào rừng, thơ mộng', cost:'30K/người' },
      { time:'13:00', type:'sight',   name:'💦 Thác Bạc (Silver Waterfall) ⭐4.2', addr:'San Sả Hồ (~12km từ TT)',          note:'Trên đường về ghé nhanh 30 phút, thác cao 200m', cost:'30K/người' },
      { time:'14:00', type:'lunch',   name:'🍗 Cơm lam / Gà đen đường đèo',        addr:'Dọc đường đèo Ô Quy Hồ',           note:'Đặc sản núi rừng, cơm lam tre nướng, gà đen Tây Bắc, rau rừng', cost:'80K – 150K' },
      { time:'15:30', type:'shop',    name:'🛍️ Mua đặc sản & trả phòng',          addr:'Khu TT. Sapa',                      note:'Táo mèo, mận hậu, thổ cẩm H\'Mông, rượu táo mèo nguyên chất', cost:'200K – 500K' },
      { time:'17:00', type:'move',    name:'🚌 Xe về Hà Nội',                      addr:'Bến xe Sapa',                       note:'Đến Hà Nội khoảng 22h–23h',              cost:'200K – 300K' },
    ]
  }
]

const dayMeta: Record<number, any> = {
  1: { bg: '#e8f5ec', color: '#2d5a3d', title: 'Đến Sapa · Nhà thờ Đá · Hàm Rồng · Cát Cát', subtitle: 'Khám phá trung tâm & bản làng gần thị trấn' },
  2: { bg: '#e3f0fd', color: '#0d47a1', title: 'Fansipan · Mường Hoa · Bản Tả Van', subtitle: 'Chinh phục đỉnh cao & trekking ruộng bậc thang' },
  3: { bg: '#fff3e0', color: '#e65100', title: 'Đèo Ô Quy Hồ · Thác Tình Yêu · Thác Bạc', subtitle: 'Cảnh quan hùng vĩ & trở về Hà Nội' },
}

const cafes = [
  { name:'Viettrekking Coffee', rating:'4.2', viewType:'🚠 View cáp treo đơn ray', emoji:'☕', hours:'07:00–22:00', price:'30K–60K', bg:'linear-gradient(135deg,#2d5a3d,#4a7c59)', desc:'Ngồi ngoài trời xem cáp treo đơn ray chạy ngang — rất instagrammable và chill. Ghé sau khi leo Hàm Rồng, ngay trung tâm thị trấn.' },
  { name:'SaPa By Night', rating:'4.8', viewType:'🌸 View sân vườn lãng mạn', emoji:'🌙', hours:'07:30–23:00', price:'40K–80K', bg:'linear-gradient(135deg,#1a3a2a,#2d5a3d)', desc:'Cafe sân vườn bậc thang đẹp nhất vào ban đêm với đèn lung linh. Có cả đồ ăn nhẹ và không gian rất lãng mạn.' },
  { name:'Terrace View Coffee', rating:'4.9', viewType:'🌾 BEST VIEW ruộng bậc thang', emoji:'🌿', hours:'09:00–17:00', price:'20K–40K', bg:'linear-gradient(135deg,#3d7a50,#6aaa72)', desc:'Quán nhỏ giữa đường trek Mường Hoa với view ruộng bậc thang ĐỈNH NHẤT Sapa. Chủ quán rất thân thiện, cho uống Happy Water miễn phí.' },
  { name:'Nga Cảnh Best View', rating:'4.8', viewType:'🏔️ Panorama núi + ruộng', emoji:'🦅', hours:'Cả ngày', price:'30K–60K', bg:'linear-gradient(135deg,#1f3d28,#3d7a50)', desc:'Ít người biết đến nhưng view panorama núi + ruộng bậc thang từ trên cao cực đẹp. Bình yên, không đông đúc. Ghé khi đi đèo Ô Quy Hồ.' },
]

const budgetItems = [
  { icon:'🚌', label:'Di chuyển khứ hồi',          range:'400K – 600K',   bg:'rgba(74,124,89,0.1)' },
  { icon:'🏨', label:'Lưu trú 2 đêm',               range:'600K – 1.2tr', bg:'rgba(13,71,161,0.1)' },
  { icon:'🚠', label:'Cáp treo Fansipan',            range:'750K – 900K',   bg:'rgba(230,81,0,0.1)' },
  { icon:'🍜', label:'Ăn uống (6 bữa chính)',        range:'450K – 800K',   bg:'rgba(201,168,76,0.15)' },
  { icon:'🎟️', label:'Vé tham quan các điểm',       range:'300K – 400K',   bg:'rgba(74,57,90,0.1)' },
  { icon:'🏍️', label:'Di chuyển nội địa Sapa',      range:'200K – 400K',   bg:'rgba(196,98,45,0.1)' },
  { icon:'☕', label:'Café check-in (4 quán)',        range:'100K – 200K',   bg:'rgba(107,60,26,0.1)' },
  { icon:'🛍️', label:'Mua sắm đặc sản',             range:'300K – 800K',   bg:'rgba(26,58,42,0.08)' },
]

const tips = [
  { icon:'🧥', title:'Trang phục',          text:'Mặc ấm dù mùa hè — Sapa quanh năm mát, Fansipan chỉ ~10°C. Mang áo gió, áo len, giày đế bám chắc. Quên có thể thuê tại chỗ 30–50K/ngày.' },
  { icon:'💰', title:'Tiền mặt',             text:'Rút tiền mặt VNĐ trước ở Hà Nội. Nhiều quán, chợ, điểm tham quan không nhận thẻ. Cây ATM ở Sapa hay hết tiền vào cuối tuần và ngày lễ.' },
  { icon:'📱', title:'Đặt vé Fansipan sớm', text:'Đặt vé cáp treo TRƯỚC qua app/web Sun World. Cuối tuần và ngày lễ rất đông, nên đặt trước 1–2 tuần. Đến sớm lúc 7h30 để tránh xếp hàng.' },
  { icon:'☕', title:'Café & Chụp ảnh',      text:'Sáng sớm 7–9h sương mù Sapa đẹp nhất. Ghé Terrace View khi trekking Mường Hoa. Thác Tình Yêu ít đông và thơ mộng hơn Thác Bạc.' },
  { icon:'🌤️', title:'Thời tiết',            text:'Kiểm tra thời tiết trước khi đi — hay mưa và sương mù bất chợt. Đẹp nhất: Tháng 9–10 (lúa vàng), Tháng 3–4 (hoa đào). Tháng 1–2 có thể có tuyết!' },
  { icon:'🏍️', title:'Di chuyển nội địa',   text:'Thuê xe máy ~150–200K/ngày để linh hoạt nhất. Đường đèo dốc, lái cẩn thận. Hoặc đặt taxi theo ngày ~500K. Grab không hoạt động ở Sapa.' },
  { icon:'🍜', title:'Đặc sản phải thử',     text:'Thịt ngựa, cá hồi/tầm Sapa, thắng cố, cơm lam, rượu ngô, xôi ngô, táo mèo, bánh sừng trâu. Không ăn thử = mất đi nửa trải nghiệm!' },
  { icon:'📸', title:'Góc chụp đẹp',         text:'Nhà thờ Đá + sương mù buổi sáng. Ruộng bậc thang Mường Hoa từ Terrace View. Đèo Ô Quy Hồ từ 10h–14h. Bản Tả Van buổi chiều vàng óng.' },
  { icon:'🛍️', title:'Mua sắm thông minh',  text:'Mặc cả ở chợ là bình thường. Ưu tiên: táo mèo, thổ cẩm H\'Mông thật, rượu ngô nguyên chất, mận hậu sấy. Cẩn thận đồ hàng chợ giá cao.' },
  { icon:'⚡', title:'Lưu ý quan trọng',     text:'Đặt homestay/khách sạn trước (nhất là cuối tuần). Mang sạc dự phòng. Mua thuốc say xe nếu dễ say. Gọi trước booking quán ăn nổi tiếng vào cuối tuần.' },
]

function tagLabel(type: string) {
  const map: Record<string, string> = { morning:'🌅 Sáng', lunch:'🍴 Trưa', dinner:'🌙 Tối', cafe:'☕ Café', sight:'📍 Tham quan', move:'🚌 Di chuyển', shop:'🛍️ Mua sắm' }
  return map[type] || type
}

function dotColor(type: string) {
  const map: Record<string, string> = { morning:'#a05c00', lunch:'#2d5a3d', dinner:'#4a3960', cafe:'#6b3c1a', sight:'#4a7c59', move:'#444466', shop:'#c4622d' }
  return map[type] || '#888'
}

let observer: IntersectionObserver | null = null

function setupReveal() {
  if (observer) observer.disconnect()
  
  const els = document.querySelectorAll('.reveal')
  observer = new IntersectionObserver(entries => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        // Small delay for staggered effect
        setTimeout(() => e.target.classList.add('visible'), 50)
      }
    })
  }, { threshold: 0.1 })
  
  els.forEach(el => {
    el.classList.remove('visible')
    observer?.observe(el)
  })
}

function changeTab(id: string) {
  activeTab.value = id
  nextTick(() => {
    setTimeout(setupReveal, 100)
  })
}

function openAddModal(dayNum: number) {
  editingItem.value = { day: dayNum, type: 'sight' }
  isModalOpen.value = true
}

function openEditModal(item: ItineraryItem) {
  editingItem.value = { ...item }
  isModalOpen.value = true
}

async function handleFormSubmit(data: Omit<ItineraryItem, 'id' | 'order'>) {
  try {
    if (editingItem.value?.id) {
      await store.updateItem(editingItem.value.id, data)
    } else {
      await store.addItem(data)
    }
    isModalOpen.value = false
  } catch (err) {
    alert('Lỗi khi lưu dữ liệu')
  }
}

async function handleDelete(id: string) {
  if (confirm('Bạn có chắc chắn muốn xóa hoạt động này?')) {
    await store.deleteItem(id)
  }
}

onMounted(async () => {
  await store.refreshItinerary()
  // Seed if empty
  if (store.items.length === 0) {
    await store.seedItinerary(initialSchedule)
  }
  setTimeout(setupReveal, 500)
})
</script>

<template>
  <div class="sapa-wrapper">
    <!-- ═══ HERO ═══ -->
    <section class="hero">
      <div class="hero-mountains">
        <div class="stars">
          <div v-for="s in stars" :key="s.id" class="star"
            :style="{ left: s.x+'%', top: s.y+'%', '--d': s.d+'s', animationDelay: s.delay+'s' }">
          </div>
        </div>
        <div class="fog-layer"></div>

        <div class="mountain-layer">
          <svg viewBox="0 0 1440 260" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:260px">
            <path d="M0,260 L0,180 L160,80 L320,160 L480,40 L640,130 L720,30 L800,110 L960,60 L1100,140 L1280,50 L1440,120 L1440,260 Z" fill="#0d2117"/>
          </svg>
        </div>
        <div class="mountain-layer">
          <svg viewBox="0 0 1440 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:200px">
            <path d="M0,200 L0,140 L200,90 L360,140 L520,70 L680,120 L840,50 L1000,100 L1160,60 L1320,110 L1440,80 L1440,200 Z" fill="#162e1e" opacity="0.9"/>
          </svg>
        </div>
        <div class="mountain-layer">
          <svg viewBox="0 0 1440 140" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:140px">
            <path d="M0,140 L0,100 L240,55 L480,90 L720,28 L960,68 L1200,38 L1440,72 L1440,140 Z" fill="#1f3d28" opacity="0.92"/>
          </svg>
        </div>
        <div class="mountain-layer">
          <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:90px">
            <path d="M0,90 L0,60 L360,20 L720,55 L1080,15 L1440,45 L1440,90 Z" fill="#2a4d35"/>
          </svg>
        </div>
      </div>

      <div class="hero-content">
        <div class="hero-badge">✦ Lịch Trình Du Lịch ✦</div>
        <h1 class="hero-title">
          Sapa –<br><em>Xứ sương mù</em><br>& ruộng bậc thang
        </h1>
        <p class="hero-sub">3 Ngày · 2 Đêm · Hà Nội → Sapa, Lào Cai</p>
        <div class="hero-stats">
          <div class="stat">
            <div class="stat-num">3</div>
            <div class="stat-label">Ngày</div>
          </div>
          <div class="stat">
            <div class="stat-num">18+</div>
            <div class="stat-label">Địa điểm</div>
          </div>
          <div class="stat">
            <div class="stat-num">3.143m</div>
            <div class="stat-label">Đỉnh cao</div>
          </div>
          <div class="stat">
            <div class="stat-num">~4tr</div>
            <div class="stat-label">Chi phí</div>
          </div>
        </div>
      </div>

      <div class="scroll-hint">
        <span>Cuộn xuống</span>
        <div class="scroll-line"></div>
      </div>
    </section>

    <!-- ═══ TAB NAV ═══ -->
    <nav class="tab-nav">
      <button
        v-for="tab in tabs" :key="tab.id"
        class="tab-btn" :class="{ active: activeTab === tab.id }"
        @click="changeTab(tab.id)">
        {{ tab.icon }} {{ tab.label }}
      </button>
    </nav>

    <!-- ═══ CONTENT ═══ -->
    <main class="main">

      <!-- LỊCH TRÌNH -->
      <transition name="fade" mode="out-in">
        <div v-if="activeTab === 'schedule'" key="sch">
          <div class="flex items-center justify-between reveal mb-6">
            <div>
              <span class="section-eyebrow">Chi tiết từng ngày</span>
              <h2 class="section-title !mb-0">Lịch trình <em>{{ Object.keys(itemsByDay).length }} ngày</em></h2>
            </div>
            <button 
              @click="isEditMode = !isEditMode"
              class="h-10 px-5 rounded-full text-xs font-bold transition-all border shrink-0 flex items-center gap-2"
              :class="isEditMode ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'"
            >
              <svg v-if="!isEditMode" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              {{ isEditMode ? 'Hoàn tất' : 'Chỉnh sửa' }}
            </button>
          </div>

          <div v-if="loading" class="flex flex-col items-center justify-center py-20 animate-pulse">
            <div class="text-3xl mb-4">🏔️</div>
            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải lịch trình...</div>
          </div>

          <div v-else class="day-grid">
            <div v-for="dayNum in Object.keys(itemsByDay).map(Number)" :key="dayNum" class="day-card reveal">
              <div class="day-header">
                <div class="day-number" :style="{ background: dayMeta[dayNum]?.bg || '#f1f5f9', color: dayMeta[dayNum]?.color || '#475569' }">
                  <span class="day-num-big">{{ dayNum }}</span>
                  <span class="day-num-label">Ngày</span>
                </div>
                <div class="flex-1">
                  <div class="day-title">{{ dayMeta[dayNum]?.title || `Khám phá ngày ${dayNum}` }}</div>
                  <div class="day-subtitle">{{ dayMeta[dayNum]?.subtitle || 'Tiếp tục hành trình Sapa' }}</div>
                </div>
                <button 
                  v-if="isEditMode"
                  @click="openAddModal(dayNum)"
                  class="h-9 w-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                  title="Thêm hoạt động"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
              <div class="timeline">
                <div v-for="it in itemsByDay[dayNum]" :key="it.id" class="timeline-item">
                  <div class="tl-time">{{ it.time }}</div>
                  <div class="tl-line">
                    <div class="tl-dot" :style="{ color: dotColor(it.type) }"></div>
                    <div class="tl-connector"></div>
                  </div>
                  <div class="tl-content" :class="{ visited: it.visited }">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <span class="tl-tag" :class="'tag-' + it.type">{{ tagLabel(it.type) }}</span>
                        <div class="tl-name">{{ it.name }}</div>
                      </div>
                      
                      <!-- Interaction Controls -->
                      <div class="flex items-center gap-1">
                        <div v-if="!isEditMode" class="flex flex-col items-end">
                           <label class="visited-check">
                            <input type="checkbox" :checked="it.visited" @change="store.toggleVisited(it.id, !it.visited)" />
                            <span class="checkmark"></span>
                          </label>
                        </div>
                        <div v-else class="flex gap-1">
                          <button @click="openEditModal(it)" class="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button @click="handleDelete(it.id)" class="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div v-if="it.addr" class="tl-addr">📍 {{ it.addr }}</div>
                    <div v-if="it.note" class="tl-note">{{ it.note }}</div>
                    <div v-if="it.cost && it.cost !== '–'" class="tl-cost">💰 {{ it.cost }}</div>
                  </div>
                </div>
                <!-- Empty state for day in edit mode -->
                <div v-if="itemsByDay[dayNum].length === 0" class="py-12 text-center">
                  <div class="text-2xl mb-2 opacity-20">🍃</div>
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chưa có hoạt động nào</div>
                </div>
              </div>
            </div>
            
            <!-- Global Add for new days -->
            <button 
              v-if="isEditMode"
              @click="openAddModal(Object.keys(itemsByDay).length + 1)"
              class="reveal h-20 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span class="text-[10px] font-bold uppercase tracking-widest">Thêm ngày mới</span>
            </button>
          </div>
        </div>
      </transition>

      <!-- CAFÉ -->
      <transition name="fade" mode="out-in">
        <div v-if="activeTab === 'cafe'" key="cafe">
          <span class="section-eyebrow reveal">Check-in nổi tiếng</span>
          <h2 class="section-title reveal">Café <em>view đẹp</em></h2>
          <p class="reveal" style="color:rgba(26,58,42,0.5);font-size:.85rem;margin-bottom:36px;margin-top:-28px">
            Ghé khi đi tham quan để tối ưu di chuyển • Sáng sớm sương mù đẹp nhất
          </p>
          <div class="cafe-grid">
            <div v-for="c in cafes" :key="c.name" class="cafe-card reveal">
              <div class="cafe-thumb" :style="{ background: c.bg }">
                <span style="position:relative;z-index:1;font-size:3rem">{{ c.emoji }}</span>
                <div class="cafe-rating">⭐ {{ c.rating }}</div>
              </div>
              <div class="cafe-body">
                <div class="cafe-name">{{ c.name }}</div>
                <span class="cafe-view-badge">{{ c.viewType }}</span>
                <div class="cafe-desc">{{ c.desc }}</div>
                <div class="cafe-meta">
                  <span>🕐 {{ c.hours }}</span>
                  <span class="cafe-price">{{ c.price }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- CHI PHÍ -->
      <transition name="fade" mode="out-in">
        <div v-if="activeTab === 'budget'" key="budget">
          <span class="section-eyebrow reveal">Tham khảo</span>
          <h2 class="section-title reveal">Chi phí <em>dự kiến</em></h2>
          <div class="budget-grid">
            <div v-for="b in budgetItems" :key="b.label" class="budget-card reveal">
              <div class="budget-icon" :style="{ background: b.bg }">{{ b.icon }}</div>
              <div>
                <div class="budget-label">{{ b.label }}</div>
                <div class="budget-range">{{ b.range }}</div>
                <div class="budget-unit">VNĐ / người</div>
              </div>
            </div>
          </div>
          <div class="total-box reveal">
            <div>
              <div class="total-label">Tổng chi phí ước tính (1 người)</div>
              <div class="total-amount">2.8 – 5.1 triệu đồng</div>
            </div>
            <div class="total-note">
              Chưa bao gồm đồ uống lẻ, thuốc men và mua sắm thêm.
              Nhiều quán chỉ nhận tiền mặt — nên rút trước ở Hà Nội.
            </div>
          </div>
        </div>
      </transition>

      <!-- MẸO -->
      <transition name="fade" mode="out-in">
        <div v-if="activeTab === 'tips'" key="tips">
          <span class="section-eyebrow reveal">Lưu ý quan trọng</span>
          <h2 class="section-title reveal">Mẹo & <em>lưu ý</em></h2>
          <div class="tips-grid">
            <div v-for="t in tips" :key="t.title" class="tip-card reveal">
              <div class="tip-icon">{{ t.icon }}</div>
              <div class="tip-title">{{ t.title }}</div>
              <div class="tip-text">{{ t.text }}</div>
            </div>
          </div>
        </div>
      </transition>

    </main>

    <!-- FOOTER -->
    <footer class="footer">
      <p>🏔️ <strong>Sapa</strong> – Nơi gặp gỡ đất trời, mê hoặc lòng người</p>
      <p style="margin-top:8px">Lịch trình 3N2Đ • Hà Nội → Sapa, Lào Cai</p>
    </footer>

    <!-- Back button -->
    <router-link to="/" class="back-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      Quay lại
    </router-link>

    <!-- Itinerary Form Modal -->
    <Modal :show="isModalOpen" @close="isModalOpen = false">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl text-emerald-600">
            {{ editingItem?.id ? '✏️' : '✨' }}
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              {{ editingItem?.id ? 'Sửa hoạt động' : 'Thêm hoạt động mới' }}
            </h3>
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Cập nhật lịch trình của bạn</p>
          </div>
        </div>
      </template>

      <ItineraryForm 
        :initialData="editingItem" 
        :isEditing="!!editingItem?.id"
        @submit="handleFormSubmit"
        @cancel="isModalOpen = false"
      />
    </Modal>
  </div>
</template>

<style scoped>
.sapa-wrapper {
  --forest: #1a3a2a;
  --moss: #2d5a3d;
  --sage: #4a7c59;
  --mist: #8fb89a;
  --fog: #c8ddc8;
  --cream: #f5f0e8;
  --gold: #c9a84c;
  --amber: #e8a020;
  --terracotta: #c4622d;
  --rice: #faf7f0;
  
  font-family: 'Mulish', sans-serif;
  background: var(--rice);
  color: var(--forest);
  min-height: 100vh;
  position: relative;
}

/* ── HERO ── */
.hero {
  position: relative;
  min-height: 500px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: linear-gradient(160deg, #0f2318 0%, #1a4028 35%, #2d6040 65%, #3d7a50 100%);
}

.hero-mountains {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.mountain-layer {
  position: absolute;
  bottom: 0;
  width: 100%;
}
.mountain-layer svg { display: block; }

.fog-layer {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 60%, rgba(200,221,200,0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 40%, rgba(200,221,200,0.08) 0%, transparent 50%);
  animation: fogDrift 12s ease-in-out infinite alternate;
}
@keyframes fogDrift {
  from { transform: translateX(-2%) scaleX(1); opacity: 0.7; }
  to   { transform: translateX(2%) scaleX(1.03); opacity: 1; }
}

.stars { position: absolute; top: 0; left: 0; right: 0; height: 50%; overflow: hidden; }
.star {
  position: absolute;
  width: 2px; height: 2px;
  background: rgba(255,255,255,0.7);
  border-radius: 50%;
  animation: twinkle var(--d, 3s) ease-in-out infinite alternate;
}
@keyframes twinkle { from { opacity: 0.2; } to { opacity: 1; } }

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  padding: 0 6vw 8vh;
}

.hero-badge {
  display: inline-block;
  background: rgba(201,168,76,0.2);
  border: 1px solid rgba(201,168,76,0.5);
  color: var(--gold);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 100px;
  margin-bottom: 20px;
  backdrop-filter: blur(8px);
  animation: fadeUp 0.8s ease both;
}

.hero-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.8rem, 7vw, 5.5rem);
  line-height: 1.05;
  color: #fff;
  margin-bottom: 16px;
  animation: fadeUp 0.8s 0.15s ease both;
}
.hero-title em { font-style: italic; color: var(--mist); }

.hero-sub {
  color: rgba(200,221,200,0.75);
  font-size: 1rem;
  font-weight: 300;
  letter-spacing: 0.05em;
  margin-bottom: 36px;
  animation: fadeUp 0.8s 0.25s ease both;
}

.hero-stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  animation: fadeUp 0.8s 0.35s ease both;
}
.stat-num {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  color: var(--gold);
  line-height: 1;
}
.stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(200,221,200,0.6);
  margin-top: 2px;
}

.scroll-hint {
  position: absolute;
  bottom: 32px;
  right: 6vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(200,221,200,0.5);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  animation: fadeUp 1s 0.6s ease both;
  z-index: 10;
}
.scroll-line {
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, rgba(200,221,200,0.5), transparent);
  animation: scrollPulse 2s ease-in-out infinite;
}
@keyframes scrollPulse {
  0%,100% { transform: scaleY(1); opacity: 0.5; }
  50% { transform: scaleY(1.3); opacity: 1; }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── TAB NAV ── */
.tab-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(245,240,232,0.95);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(26,58,42,0.1);
  padding: 0 6vw;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.tab-nav::-webkit-scrollbar { display: none; }

.tab-btn {
  flex-shrink: 0;
  padding: 16px 20px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(26,58,42,0.45);
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
  white-space: nowrap;
  font-family: 'Mulish', sans-serif;
}
.tab-btn::after {
  content: '';
  position: absolute;
  bottom: 0; left: 16px; right: 16px;
  height: 2px;
  background: var(--sage);
  transform: scaleX(0);
  transition: transform 0.3s;
}
.tab-btn.active { color: var(--forest); }
.tab-btn.active::after { transform: scaleX(1); }

/* ── MAIN ── */
.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 6vw 80px;
}

.section-eyebrow {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--sage);
  display: block;
  margin-bottom: 8px;
}
.section-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: var(--forest);
  line-height: 1.15;
  margin-bottom: 40px;
}
.section-title em { font-style: italic; }

/* ── DAY CARDS ── */
.day-grid { display: grid; gap: 28px; }

.day-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 20px rgba(26,58,42,0.06);
  transition: transform 0.3s, box-shadow 0.3s;
}
.day-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 40px rgba(26,58,42,0.12);
}

.day-header {
  padding: 24px 28px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  border-bottom: 1px solid rgba(26,58,42,0.06);
}

.day-number {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.day-num-big {
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem;
  line-height: 1;
}
.day-num-label {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.7;
}
.day-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  color: var(--forest);
  line-height: 1.3;
}
.day-subtitle {
  font-size: 0.78rem;
  color: var(--sage);
  font-weight: 600;
  margin-top: 4px;
}

/* ── TIMELINE ── */
.timeline { padding: 8px 28px 24px; }

.timeline-item {
  display: grid;
  grid-template-columns: 76px 1px 1fr;
  gap: 0 16px;
}

.tl-time {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(26,58,42,0.38);
  text-align: right;
  padding-top: 19px;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.tl-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 19px;
}
.tl-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid currentColor;
  background: #fff;
  z-index: 2;
}
.tl-connector {
  width: 1px;
  flex: 1;
  min-height: 16px;
  margin-top: 4px;
  background: rgba(26,58,42,0.1);
}
.timeline-item:last-child .tl-connector { display: none; }

.tl-content { padding: 14px 0 6px; }

.tl-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 100px;
  margin-bottom: 6px;
}

.tl-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--forest);
  line-height: 1.35;
  margin-bottom: 4px;
}
.tl-addr { font-size: 0.73rem; color: var(--sage); margin-bottom: 3px; }
.tl-note { font-size: 0.73rem; color: rgba(26,58,42,0.5); font-style: italic; line-height: 1.5; }
.tl-cost {
  display: inline-block;
  margin-top: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--terracotta);
  background: rgba(196,98,45,0.08);
  padding: 2px 10px;
  border-radius: 100px;
}

.visited-check {
  display: block;
  position: relative;
  width: 24px;
  height: 24px;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  flex-shrink: 0;
  margin-top: 4px;
}

.visited-check input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 24px;
  width: 24px;
  background-color: #eee;
  border-radius: 6px;
  transition: all 0.2s;
  border: 2px solid rgba(26,58,42,0.1);
}

.visited-check:hover input ~ .checkmark {
  background-color: #ccc;
}

.visited-check input:checked ~ .checkmark {
  background-color: var(--sage);
  border-color: var(--sage);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.visited-check input:checked ~ .checkmark:after {
  display: block;
}

.visited-check .checkmark:after {
  left: 7px;
  top: 3px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 3px 3px 0;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}

.tl-content.visited {
  opacity: 0.55;
  transition: opacity 0.3s;
}

.tl-content.visited .tl-name {
  text-decoration: line-through;
}

.tag-morning { background: rgba(232,160,32,0.12); color: #a05c00; }
.tag-lunch   { background: rgba(45,90,61,0.1);    color: var(--moss); }
.tag-dinner  { background: rgba(74,57,90,0.1);    color: #4a3960; }
.tag-cafe    { background: rgba(120,70,40,0.1);   color: #6b3c1a; }
.tag-sight   { background: rgba(26,58,42,0.07);   color: var(--sage); }
.tag-move    { background: rgba(80,80,110,0.1);   color: #444466; }
.tag-shop    { background: rgba(196,98,45,0.1);   color: var(--terracotta); }

/* ── CAFÉ ── */
.cafe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 20px;
}
.cafe-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(26,58,42,0.06);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}
.cafe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(26,58,42,0.14);
}
.cafe-thumb {
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  position: relative;
  overflow: hidden;
}
.cafe-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.3), transparent 60%);
}
.cafe-rating {
  position: absolute;
  bottom: 10px; right: 12px;
  z-index: 1;
  background: rgba(201,168,76,0.92);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 100px;
}
.cafe-body { padding: 16px 18px 18px; flex: 1; display: flex; flex-direction: column; }
.cafe-name {
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  color: var(--forest);
  margin-bottom: 4px;
}
.cafe-view-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sage);
  margin-bottom: 8px;
  display: block;
}
.cafe-desc { font-size: 0.77rem; color: rgba(26,58,42,0.6); line-height: 1.6; flex: 1; }
.cafe-meta {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(26,58,42,0.5);
  flex-wrap: wrap;
}
.cafe-price { color: var(--terracotta); font-weight: 700; }

/* ── BUDGET ── */
.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}
.budget-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 12px rgba(26,58,42,0.05);
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.budget-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 42px; height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.budget-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(26,58,42,0.42);
  margin-bottom: 4px;
}
.budget-range {
  font-family: 'Playfair Display', serif;
  font-size: 1.05rem;
  color: var(--forest);
}
.budget-unit { font-size: 0.65rem; color: rgba(26,58,42,0.38); margin-top: 2px; }

.total-box {
  background: var(--forest);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.total-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--mist);
  margin-bottom: 6px;
}
.total-amount { font-family: 'Playfair Display', serif; font-size: 1.9rem; color: var(--gold); }
.total-note { font-size: 0.77rem; color: rgba(200,221,200,0.6); max-width: 300px; line-height: 1.6; }

/* ── TIPS ── */
.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
  gap: 16px;
}
.tip-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(26,58,42,0.05);
  border-left: 3px solid var(--sage);
  transition: border-color 0.2s, transform 0.2s;
}
.tip-card:hover { border-color: var(--gold); transform: translateX(3px); }
.tip-icon { font-size: 1.4rem; margin-bottom: 10px; }
.tip-title { font-weight: 700; font-size: 0.85rem; color: var(--forest); margin-bottom: 6px; }
.tip-text { font-size: 0.77rem; color: rgba(26,58,42,0.58); line-height: 1.65; }

/* ── FOOTER ── */
.footer {
  background: var(--forest);
  color: rgba(200,221,200,0.5);
  text-align: center;
  padding: 32px 6vw;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
}
.footer strong { color: var(--gold); }

.back-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  background: var(--forest);
  color: #fff;
  padding: 10px 20px;
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.back-btn:hover { transform: scale(1.05); }

/* ── TRANSITIONS ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.28s, transform 0.28s; }
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to   { opacity: 0; transform: translateY(-6px); }

/* ── SCROLL REVEAL ── */
.reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.55s ease, transform 0.55s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }

@media (max-width: 640px) {
  .hero-stats { gap: 20px; }
  .timeline { padding: 8px 14px 16px; }
  .day-header { padding: 16px 16px 12px; gap: 12px; }
  .tl-time { font-size: 0.62rem; }
  .total-box { flex-direction: column; }
  .day-title { font-size: 1rem; }
  .back-btn { bottom: 16px; right: 16px; padding: 8px 16px; font-size: 0.75rem; }
}
</style>
