import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { auth, db } from '@/services/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore'
import type { User } from '@/types/models'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const familyUnlocked = ref(false)
  const isAuthReady = ref(false)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const familyId = computed(() => currentUser.value?.familyId ?? null)
  const role = computed(() => currentUser.value?.role ?? null)

  // Listen to Auth State automatically
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (snap.exists()) {
        currentUser.value = { id: snap.id, ...snap.data() } as User
      }
    } else {
      currentUser.value = null
      familyUnlocked.value = false
    }
    isAuthReady.value = true
  })

  // We use email/password in Firebase. If the UI still uses phone, we append a dummy domain like @wallet.local for now.
  const makeEmail = (phone: string) => `${phone.trim()}@wallet.local`

  async function login(phone: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, makeEmail(phone), password)
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    if (snap.exists()) {
      currentUser.value = { id: snap.id, ...snap.data() } as User
      // Depending on your logic, maybe we default to unlocked if they are logged in,
      // or we still require a PIN. For demo we assume unlocked.
      familyUnlocked.value = !!currentUser.value.familyId
    }
    return { accessToken: cred.user.uid, familyUnlocked: familyUnlocked.value }
  }

  async function register(payload: {
    phone: string
    password: string
    displayName: string
    familyName: string
    sharedPin: string
    nickname: string
    accent: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan'
  }) {
    const cred = await createUserWithEmailAndPassword(auth, makeEmail(payload.phone), payload.password)
    const uid = cred.user.uid

    // Create Family
    const familyRef = await addDoc(collection(db, 'families'), {
      name: payload.familyName.trim() || 'My Family',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      settings: {
        sharedPinHash: payload.sharedPin, // Frontend pin check mock
        monthlyBudget: 0,
        categories: []
      }
    })

    // Create User Profile
    const newUser: Partial<User> = {
      phone: payload.phone,
      displayName: payload.displayName,
      role: 'owner',
      status: 'active',
      familyId: familyRef.id,
      lastLoginAt: serverTimestamp() as any
    }
    await setDoc(doc(db, 'users', uid), newUser)

    // Create Member Profile in Family
    await setDoc(doc(db, 'families', familyRef.id, 'member_profiles', uid), {
      nickname: payload.nickname || payload.displayName,
      accent: payload.accent || 'sky',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    currentUser.value = { id: uid, ...newUser } as User
    familyUnlocked.value = false
    return { accessToken: uid, familyUnlocked: false }
  }

  async function verifyFamilyPin(pin: string) {
    if (!currentUser.value?.familyId) throw new Error('No family to unlock')
    // We fetch the family document to check PIN
    const snap = await getDoc(doc(db, 'families', currentUser.value.familyId))
    if (!snap.exists()) throw new Error('Family not found')
    
    const settings = snap.data().settings
    // Note: Pin validation should be done securely. In frontend Firestore, checking plain PINs is not entirely secure 
    // without Cloud Functions, but for PWA demo we do simple check:
    if (settings && settings.sharedPinHash === pin) {
       familyUnlocked.value = true
       return { accessToken: currentUser.value.id, familyUnlocked: true }
    }
    throw new Error('Invalid PIN')
  }

  async function logoutMethod() {
    await signOut(auth)
  }

  function getErrorMessage(e: unknown): string {
    return e instanceof Error ? e.message : 'Unknown error'
  }

  return {
    currentUser,
    isAuthReady,
    isLoggedIn,
    familyUnlocked,
    familyId,
    role,
    login,
    register,
    verifyFamilyPin,
    logout: logoutMethod,
    getErrorMessage,
  }
})
