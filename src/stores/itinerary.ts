import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/services/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from './auth'

export type ItineraryItemType = 'morning' | 'lunch' | 'dinner' | 'cafe' | 'sight' | 'move' | 'shop'

export interface ItineraryItem {
  id: string
  day: number
  time: string
  type: ItineraryItemType
  name: string
  addr: string
  note: string
  cost: string
  visited?: boolean
  order: number
}

export const useItineraryStore = defineStore('itinerary', () => {
  const authStore = useAuthStore()
  const items = ref<ItineraryItem[]>([])
  const loading = ref(false)

  const getFamilyId = () => {
    if (!authStore.familyId) throw new Error('No family loaded')
    return authStore.familyId
  }

  const itemsByDay = computed(() => {
    const sorted = [...items.value].sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day
        return a.order - b.order
    })
    
    const days: Record<number, ItineraryItem[]> = {}
    sorted.forEach(item => {
      if (!days[item.day]) days[item.day] = []
      days[item.day].push(item)
    })
    return days
  })

  async function refreshItinerary() {
    loading.value = true
    try {
      const familyId = getFamilyId()
      const docSnap = await getDoc(doc(db, 'families', familyId))
      if (docSnap.exists()) {
        const data = docSnap.data()
        items.value = (data.itinerary || []) as ItineraryItem[]
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error)
    } finally {
      loading.value = false
    }
  }

  async function saveItems(newItems: ItineraryItem[]) {
    const familyId = getFamilyId()
    const docRef = doc(db, 'families', familyId)
    await updateDoc(docRef, {
      itinerary: newItems,
      itineraryUpdatedAt: serverTimestamp()
    })
    items.value = newItems
  }

  async function addItem(item: Omit<ItineraryItem, 'id' | 'order'>) {
    const id = Date.now().toString()
    // Simple order: count existing items in that day
    const dayItems = items.value.filter(i => i.day === item.day)
    const order = dayItems.length > 0 ? Math.max(...dayItems.map(i => i.order)) + 1 : 0

    const newItem: ItineraryItem = {
      ...item,
      id,
      order
    }
    
    await saveItems([...items.value, newItem])
  }

  async function updateItem(id: string, updates: Partial<ItineraryItem>) {
    const newItems = items.value.map(i => i.id === id ? { ...i, ...updates } : i)
    await saveItems(newItems)
  }

  async function deleteItem(id: string) {
    const newItems = items.value.filter(i => i.id !== id)
    await saveItems(newItems)
  }

  async function toggleVisited(id: string, visited: boolean) {
    await updateItem(id, { visited })
  }

  async function seedItinerary(defaultData: any[]) {
    const familyId = getFamilyId()
    const docSnap = await getDoc(doc(db, 'families', familyId))
    if (docSnap.exists() && docSnap.data().itinerary?.length > 0) return

    const seededItems: ItineraryItem[] = []
    defaultData.forEach((day: any) => {
      day.items.forEach((item: any, index: number) => {
        seededItems.push({
          id: `${day.id}-${index}-${Date.now()}`,
          day: day.id,
          time: item.time,
          type: item.type,
          name: item.name,
          addr: item.addr || '',
          note: item.note || '',
          cost: item.cost || '',
          visited: false,
          order: index
        })
      })
    })
    
    await saveItems(seededItems)
  }

  return {
    items,
    loading,
    itemsByDay,
    refreshItinerary,
    addItem,
    updateItem,
    deleteItem,
    toggleVisited,
    seedItinerary
  }
})
