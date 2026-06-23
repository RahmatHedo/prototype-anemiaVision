import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SCREENINGS: '@anemiavision_screenings',
  HB_INPUTS: '@anemiavision_hb_inputs',
  IS_SEEDED: '@anemiavision_is_seeded'
};

// Initial Seed Data matching the user's reference image
const SEED_SCREENINGS = [
  // Sesi 4 (Dengan Evaluasi AI)
  {
    id: 'AV-0025',
    time: '14:20 WIB',
    date: '22/06/2026',
    result: 'Ringan',
    syncStatus: 'synced',
    confidence: 83.2,
    session: 'Sesi 4',
    tbmResult: 'Ringan',
    isConsistent: true,
    hbValue: 11.2,
    answers: { age: 16 }
  },
  {
    id: 'AV-0024',
    time: '13:50 WIB',
    date: '22/06/2026',
    result: 'Sedang',
    syncStatus: 'synced',
    confidence: 79.8,
    session: 'Sesi 4',
    tbmResult: 'Sedang',
    isConsistent: true,
    hbValue: 9.8,
    answers: { age: 15 }
  },
  {
    id: 'AV-0023',
    time: '11:15 WIB',
    date: '22/06/2026',
    result: 'No Anemia',
    syncStatus: 'synced',
    confidence: 91.5,
    session: 'Sesi 4',
    tbmResult: 'No Anemia',
    isConsistent: true,
    hbValue: 13.2,
    answers: { age: 17 }
  },
  {
    id: 'AV-0022',
    time: '10:45 WIB',
    date: '22/06/2026',
    result: 'Sedang',
    syncStatus: 'synced',
    confidence: 74.2,
    session: 'Sesi 4',
    tbmResult: 'Ringan',
    isConsistent: false,
    hbValue: 11.0,
    answers: { age: 16 }
  },
  {
    id: 'AV-0021',
    time: '09:30 WIB',
    date: '22/06/2026',
    result: 'Berat',
    syncStatus: 'synced',
    confidence: 88.9,
    session: 'Sesi 4',
    tbmResult: 'Berat',
    isConsistent: true,
    hbValue: 7.5,
    answers: { age: 16 }
  },
  {
    id: 'AV-0020',
    time: '09:05 WIB',
    date: '22/06/2026',
    result: 'No Anemia',
    syncStatus: 'synced',
    confidence: 94.1,
    session: 'Sesi 4',
    tbmResult: 'No Anemia',
    isConsistent: true,
    hbValue: 12.8,
    answers: { age: 15 }
  },

  // Sesi 3 (Tanpa AI)
  {
    id: 'AV-0019',
    time: '15:10 WIB',
    date: '21/06/2026',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 3',
    tbmResult: 'Ringan',
    isConsistent: null,
    hbValue: 11.5,
    answers: { age: 16 }
  },
  {
    id: 'AV-0018',
    time: '14:30 WIB',
    date: '21/06/2026',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 3',
    tbmResult: 'No Anemia',
    isConsistent: null,
    hbValue: 12.2,
    answers: { age: 17 }
  },
  {
    id: 'AV-0017',
    time: '11:00 WIB',
    date: '21/06/2026',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 3',
    tbmResult: 'Sedang',
    isConsistent: null,
    hbValue: 9.5,
    answers: { age: 15 }
  },
  {
    id: 'AV-0016',
    time: '10:15 WIB',
    date: '21/06/2026',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 3',
    tbmResult: 'Ringan',
    isConsistent: null,
    hbValue: 11.1,
    answers: { age: 16 }
  },
  {
    id: 'AV-0015',
    time: '10:05 WIB',
    date: '21/06/2026',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 3',
    tbmResult: 'No Anemia',
    isConsistent: null,
    hbValue: 13.0,
    answers: { age: 16 }
  },
  {
    id: 'AV-0014',
    time: '09:55 WIB',
    date: '21/06/2026',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 3',
    tbmResult: 'Sedang',
    isConsistent: null,
    hbValue: 10.1,
    answers: { age: 15 }
  },

  // Sesi 2 (Tanpa AI)
  {
    id: 'AV-0013',
    time: '14:40 WIB',
    date: '12/04/2024',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 2',
    tbmResult: 'No Anemia',
    isConsistent: null,
    hbValue: 12.9,
    answers: { age: 16 }
  },
  {
    id: 'AV-0012',
    time: '11:00 WIB',
    date: '12/04/2024',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 2',
    tbmResult: 'Ringan',
    isConsistent: null,
    hbValue: 11.5,
    answers: { age: 16 }
  },
  {
    id: 'AV-0011',
    time: '10:30 WIB',
    date: '12/04/2024',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 2',
    tbmResult: 'Sedang',
    isConsistent: null,
    hbValue: 10.2,
    answers: { age: 15 }
  },
  {
    id: 'AV-0010',
    time: '10:00 WIB',
    date: '12/04/2024',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 2',
    tbmResult: 'No Anemia',
    isConsistent: null,
    hbValue: 12.1,
    answers: { age: 17 }
  },
  {
    id: 'AV-0009',
    time: '09:15 WIB',
    date: '12/04/2024',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 2',
    tbmResult: 'Berat',
    isConsistent: null,
    hbValue: 7.8,
    answers: { age: 16 }
  },

  // Sesi 1 (Tanpa AI)
  {
    id: 'AV-0008',
    time: '15:30 WIB',
    date: '15/10/2023',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 1',
    tbmResult: 'No Anemia',
    isConsistent: null,
    hbValue: 13.5,
    answers: { age: 16 }
  },
  {
    id: 'AV-0007',
    time: '14:15 WIB',
    date: '15/10/2023',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 1',
    tbmResult: 'No Anemia',
    isConsistent: null,
    hbValue: 12.0,
    answers: { age: 17 }
  },
  {
    id: 'AV-0006',
    time: '11:05 WIB',
    date: '15/10/2023',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 1',
    tbmResult: 'Ringan',
    isConsistent: null,
    hbValue: 11.8,
    answers: { age: 16 }
  },
  {
    id: 'AV-0005',
    time: '10:40 WIB',
    date: '15/10/2023',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 1',
    tbmResult: 'Sedang',
    isConsistent: null,
    hbValue: 9.2,
    answers: { age: 15 }
  },
  {
    id: 'AV-0004',
    time: '10:15 WIB',
    date: '15/10/2023',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 1',
    tbmResult: 'No Anemia',
    isConsistent: null,
    hbValue: 12.6,
    answers: { age: 16 }
  },
  {
    id: 'AV-0003',
    time: '09:55 WIB',
    date: '15/10/2023',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 1',
    tbmResult: 'Sedang',
    isConsistent: null,
    hbValue: 10.4,
    answers: { age: 15 }
  },
  {
    id: 'AV-0002',
    time: '09:30 WIB',
    date: '15/10/2023',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 1',
    tbmResult: 'Berat',
    isConsistent: null,
    hbValue: 7.9,
    answers: { age: 16 }
  },
  {
    id: 'AV-0001',
    time: '09:00 WIB',
    date: '15/10/2023',
    result: null,
    syncStatus: 'synced',
    confidence: null,
    session: 'Sesi 1',
    tbmResult: 'No Anemia',
    isConsistent: null,
    hbValue: 13.1,
    answers: { age: 16 }
  }
];

export async function initializeDatabase() {
  try {
    const isSeeded = await AsyncStorage.getItem(STORAGE_KEYS.IS_SEEDED);
    const currentData = await AsyncStorage.getItem(STORAGE_KEYS.SCREENINGS);
    const parsedData = currentData ? JSON.parse(currentData) : [];
    
    // Force reseed/enrichment if database is not seeded or has less than 15 items
    if (!isSeeded || parsedData.length < 15) {
      await AsyncStorage.setItem(STORAGE_KEYS.SCREENINGS, JSON.stringify(SEED_SCREENINGS));
      await AsyncStorage.setItem(STORAGE_KEYS.HB_INPUTS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.IS_SEEDED, 'true');
      console.log('Database successfully seeded and enriched with 25+ screening records.');
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
      session: 'Sesi 3',
      tbmResult: null,
      isConsistent: true,
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
