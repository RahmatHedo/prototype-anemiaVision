import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SCREENINGS: '@anemiavision_screenings',
  HB_INPUTS: '@anemiavision_hb_inputs',
  IS_SEEDED: '@anemiavision_is_seeded'
};

// Initial Seed Data matching the user's reference image
const SEED_SCREENINGS = [
  {
    id: 'AV-0012',
    time: '10:15 WIB',
    date: '21/06/2026',
    result: 'Ringan', // Anemia: Ringan
    syncStatus: 'synced', // Tersinkronisasi
    confidence: 84.5,
    answers: { q1: 'Ya', q2: 'Ya', q3: 'Tidak', q4: 'Tidak', q5: 'Ya', q6: 'Tidak', q7: 'Tidak' }
  },
  {
    id: 'AV-0011',
    time: '10:05 WIB',
    date: '21/06/2026',
    result: 'No Anemia', // No Anemia
    syncStatus: 'synced', // Tersinkronisasi
    confidence: 91.2,
    answers: {}
  },
  {
    id: 'AV-0010',
    time: '09:55 WIB',
    date: '21/06/2026',
    result: 'Sedang', // Anemia: Sedang
    syncStatus: 'pending', // Pending
    confidence: 76.8,
    answers: { q1: 'Ya', q2: 'Ya', q3: 'Ya', q4: 'Tidak', q5: 'Ya', q6: 'Ya', q7: 'Tidak' }
  },
  {
    id: 'AV-0009',
    time: '10:15 WIB',
    date: '15/10/2023',
    result: 'No Anemia',
    syncStatus: 'synced',
    confidence: 89.0,
    answers: {}
  },
  {
    id: 'AV-0008',
    time: '09:55 WIB',
    date: '15/10/2023',
    result: 'Sedang',
    syncStatus: 'synced',
    confidence: 72.1,
    answers: { q1: 'Ya', q2: 'Tidak', q3: 'Ya', q4: 'Ya', q5: 'Ya', q6: 'Tidak', q7: 'Tidak' }
  },
  {
    id: 'AV-0007',
    time: '09:55 WIB',
    date: '15/10/2023',
    result: 'Berat',
    syncStatus: 'pending',
    confidence: 88.4,
    answers: { q1: 'Ya', q2: 'Ya', q3: 'Ya', q4: 'Ya', q5: 'Ya', q6: 'Ya', q7: 'Ya' }
  }
];

export async function initializeDatabase() {
  try {
    const isSeeded = await AsyncStorage.getItem(STORAGE_KEYS.IS_SEEDED);
    if (!isSeeded) {
      await AsyncStorage.setItem(STORAGE_KEYS.SCREENINGS, JSON.stringify(SEED_SCREENINGS));
      await AsyncStorage.setItem(STORAGE_KEYS.HB_INPUTS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.IS_SEEDED, 'true');
      console.log('Database successfully seeded with reference history.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Get all screenings
export async function getScreenings() {
  try {
    await initializeDatabase();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SCREENINGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading screenings:', error);
    return [];
  }
}

// Save a new screening
export async function saveScreening(screeningData) {
  try {
    const screenings = await getScreenings();
    
    // Generate next anonymous ID: AV-0013, AV-0014, etc.
    const lastId = screenings.length > 0 ? screenings[0].id : 'AV-0000';
    const lastNum = parseInt(lastId.replace('AV-', ''), 10) || 0;
    const nextNum = lastNum + 1;
    const nextId = `AV-${nextNum.toString().padStart(4, '0')}`;

    const now = new Date();
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const newScreening = {
      id: nextId,
      time: formattedTime,
      date: formattedDate,
      syncStatus: 'pending', // offline-first
      ...screeningData
    };

    // Prepend to show latest at top of list
    const updatedScreenings = [newScreening, ...screenings];
    await AsyncStorage.setItem(STORAGE_KEYS.SCREENINGS, JSON.stringify(updatedScreenings));
    
    return newScreening;
  } catch (error) {
    console.error('Error saving screening:', error);
    throw error;
  }
}

// Update screening sync status
export async function updateScreeningSync(id, status) {
  try {
    const screenings = await getScreenings();
    const updated = screenings.map(item => {
      if (item.id === id) {
        return { ...item, syncStatus: status };
      }
      return item;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.SCREENINGS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
}

// Get all Hb inputs
export async function getHbInputs() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HB_INPUTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading Hb inputs:', error);
    return [];
  }
}

// Save Hb Input from TBMs
export async function saveHbInput(studentId, hbValue) {
  try {
    const hbInputs = await getHbInputs();
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const newHbInput = {
      studentId,
      hbValue: parseFloat(hbValue),
      date: formattedDate,
      syncStatus: 'pending'
    };

    const updatedHbInputs = [newHbInput, ...hbInputs];
    await AsyncStorage.setItem(STORAGE_KEYS.HB_INPUTS, JSON.stringify(updatedHbInputs));

    // Also update reference to student screening history if exists
    const screenings = await getScreenings();
    const updatedScreenings = screenings.map(item => {
      if (item.id === studentId) {
        return { ...item, hbValue: parseFloat(hbValue) };
      }
      return item;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.SCREENINGS, JSON.stringify(updatedScreenings));

    return newHbInput;
  } catch (error) {
    console.error('Error saving Hb input:', error);
    throw error;
  }
}

// Sync all pending offline data (simulated action)
export async function syncOfflineData() {
  try {
    // 1. Sync screenings
    const screenings = await getScreenings();
    let syncCount = 0;
    const updatedScreenings = screenings.map(item => {
      if (item.syncStatus === 'pending') {
        syncCount++;
        return { ...item, syncStatus: 'synced' };
      }
      return item;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.SCREENINGS, JSON.stringify(updatedScreenings));

    // 2. Sync Hb inputs
    const hbInputs = await getHbInputs();
    const updatedHb = hbInputs.map(item => ({ ...item, syncStatus: 'synced' }));
    await AsyncStorage.setItem(STORAGE_KEYS.HB_INPUTS, JSON.stringify(updatedHb));

    return syncCount;
  } catch (error) {
    console.error('Error syncing offline data:', error);
    throw error;
  }
}

// Clear all data (optional utility)
export async function clearAllData() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SCREENINGS);
    await AsyncStorage.removeItem(STORAGE_KEYS.HB_INPUTS);
    await AsyncStorage.removeItem(STORAGE_KEYS.IS_SEEDED);
    console.log('Database cleared.');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}
