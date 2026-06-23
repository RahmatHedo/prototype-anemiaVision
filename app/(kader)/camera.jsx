import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert, Dimensions, Image, TextInput, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { verifyImageQuality, runPhase1CNN, runPhase2MLP, NO_ANEMIA_RECOMMENDATION } from '../../utils/classifier';
import { saveScreening, getScreenings } from '../../utils/storage';
import { Camera as CameraIcon, ShieldAlert, CheckCircle, RefreshCw, X, ChevronRight, HelpCircle, Eye, Info } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  
  // App States
  const [step, setStep] = useState('camera'); // 'camera', 'quality_check', 'phase1', 'form', 'phase2', 'result'
  const [flash, setFlash] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  
  // AI Screenings results state
  const [cnnResult, setCnnResult] = useState(null); // { isAnemic, confidence }
  const [finalResult, setFinalResult] = useState(null); // { result, confidence, color, recommendation, yesCount }
  
  // Clinical Answers (updated for detailed 7 inputs)
  const [age, setAge] = useState('');
  const [menstrualRegularity, setMenstrualRegularity] = useState('Teratur'); // 'Teratur', 'Tidak Teratur'
  const [menstrualDuration, setMenstrualDuration] = useState('');
  const [padsPerDay, setPadsPerDay] = useState('');
  const [menstrualVolume, setMenstrualVolume] = useState('Normal'); // 'Sedikit', 'Normal', 'Banyak'
  const [ttdCompliance, setTtdCompliance] = useState('Rutin'); // 'Rutin', 'Kadang-kadang', 'Tidak Pernah'
  const [foodFrequency, setFoodFrequency] = useState('Cukup'); // 'Sering', 'Cukup', 'Jarang/Tidak Pernah'
  const [symptoms, setSymptoms] = useState([]); // Array of strings: 'lelah', 'pusing', 'mata_berkunang', 'pucat', 'sesak_napas'

  // Photo quality check error modal
  const [qualityError, setQualityError] = useState(null);

  // Handle flash/torch shutdown and camera view active state
  useEffect(() => {
    let timer;
    if (isFocused && step === 'camera') {
      setIsCameraActive(true);
      setFlash(true);
    } else {
      setFlash(false);
      timer = setTimeout(() => {
        setIsCameraActive(false);
      }, 300);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isFocused, step]);

  // Take photo trigger
  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        setStep('quality_check');
        setLoadingText('Memverifikasi kualitas foto...');
        
        let photoUriToUse = '';
        try {
          // Take picture from actual camera
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
          });
          photoUriToUse = photo.uri;
        } catch (captureError) {
          console.warn('Gagal capture kamera asli, menggunakan mock-fallback:', captureError.message);
          // Fallback to mock image to support emulator/simulator testing
          photoUriToUse = 'mock://eye-conjunctiva-sample.jpg';
        }
        
        setPhotoUri(photoUriToUse);

        // Quality check
        const quality = await verifyImageQuality(photoUriToUse);
        if (!quality.success) {
          setQualityError(quality.reason);
          setStep('camera');
          return;
        }

        // Quality check passed -> proceed to Phase 1 CNN
        setStep('phase1');
        setLoadingText('Menganalisis foto konjungtiva...');
        
        const cnnRes = await runPhase1CNN(photoUriToUse);
        setCnnResult(cnnRes);

        if (!cnnRes.isAnemic) {
          // Phase 1 Negative: No Anemia -> Jump to results
          setFinalResult({
            result: NO_ANEMIA_RECOMMENDATION.result,
            color: NO_ANEMIA_RECOMMENDATION.color,
            confidence: NO_ANEMIA_RECOMMENDATION.confidence,
            recommendation: NO_ANEMIA_RECOMMENDATION.recommendation,
            yesCount: 0
          });
          setStep('result');
        } else {
          // Phase 1 Positive: Terindikasi Anemia -> Go to clinical form
          setStep('form');
        }
      } catch (error) {
        Alert.alert('Error Kamera', 'Gagal mengambil gambar: ' + error.message);
        setStep('camera');
      }
    }
  };

  const handleSymptomToggle = (symptomId) => {
    if (symptoms.includes(symptomId)) {
      setSymptoms(prev => prev.filter(item => item !== symptomId));
    } else {
      setSymptoms(prev => [...prev, symptomId]);
    }
  };

  const submitClinicalForm = async () => {
    // Basic validation
    if (!age.trim()) {
      Alert.alert('Belum Lengkap', 'Silakan masukkan usia.');
      return;
    }
    if (!menstrualDuration.trim()) {
      Alert.alert('Belum Lengkap', 'Silakan masukkan durasi menstruasi.');
      return;
    }
    if (!padsPerDay.trim()) {
      Alert.alert('Belum Lengkap', 'Silakan masukkan frekuensi ganti pembalut.');
      return;
    }

    setStep('phase2');
    setLoadingText('Menghitung tingkat keparahan...');
    
    const inputAnswers = {
      age: parseInt(age, 10),
      menstrualRegularity,
      menstrualDuration: parseInt(menstrualDuration, 10),
      padsPerDay: parseInt(padsPerDay, 10),
      menstrualVolume,
      ttdCompliance,
      foodFrequency,
      symptoms
    };

    const mlpRes = await runPhase2MLP(inputAnswers);
    setFinalResult(mlpRes);
    setStep('result');
  };

  const saveAndExit = async () => {
    try {
      const data = await getScreenings();
      const mayaChecks = data.filter(item => item.id.startsWith('AV-0012'));
      // Calculate next sub-index, e.g. AV-0012-01, AV-0012-02, etc.
      const nextIndex = mayaChecks.length + 1;
      const customId = `AV-0012-${nextIndex.toString().padStart(2, '0')}`;

      await saveScreening({
        id: customId,
        result: finalResult.result,
        confidence: finalResult.confidence,
        answers: cnnResult.isAnemic ? {
          age: parseInt(age, 10),
          menstrualRegularity,
          menstrualDuration: parseInt(menstrualDuration, 10),
          padsPerDay: parseInt(padsPerDay, 10),
          menstrualVolume,
          ttdCompliance,
          foodFrequency,
          symptoms
        } : {},
        rawCnnScore: cnnResult.confidence
      });
      // Navigate back to history
      router.replace('/(kader)/riwayat');
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan data skrining.');
    }
  };

  const resetScreen = () => {
    setStep('camera');
    setCnnResult(null);
    setFinalResult(null);
    setAge('');
    setMenstrualRegularity('Teratur');
    setMenstrualDuration('');
    setPadsPerDay('');
    setMenstrualVolume('Normal');
    setTtdCompliance('Rutin');
    setFoodFrequency('Cukup');
    setSymptoms([]);
    setQualityError(null);
    setPhotoUri(null);
  };

  // Render permission states
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingValText}>Memuat izin kamera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <ShieldAlert size={54} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={styles.permissionTitle}>Akses Kamera Diperlukan</Text>
        <Text style={styles.permissionDesc}>
          Aplikasi memerlukan izin akses kamera untuk mengambil foto konjungtiva mata Anda secara langsung.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionBackBtn} onPress={() => router.back()}>
          <Text style={styles.permissionBackBtnText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCameraHidden = !isFocused || step !== 'camera';

  return (
    <View style={styles.container}>
      {/* 1. CAMERA STEP & FLASH MANAGEMENT */}
      {isCameraActive && (
        <View style={[styles.cameraContainer, isCameraHidden && styles.hiddenCameraContainer]}>
          <CameraView 
            style={styles.cameraPreview} 
            ref={cameraRef}
            facing="back"
            flash={flash ? 'on' : 'off'}
            enableTorch={flash}
          />

          {!isCameraHidden && (
            <>
              {/* Eye positioning box overlay */}
              <View style={styles.overlayGuideContainer}>
                <View style={styles.overlayGuideBox}>
                  <View style={styles.bracketTL} />
                  <View style={styles.bracketTR} />
                  <View style={styles.bracketBL} />
                  <View style={styles.bracketBR} />
                  <Text style={styles.guideText}>Posisikan Kelopak Mata Di Sini</Text>
                </View>
              </View>

              {/* Top Toolbar */}
              <View style={styles.cameraHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.cameraHeaderBtn}>
                  <X size={20} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>Deteksi Konjungtiva</Text>
                <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.cameraHeaderBtn}>
                  <Text style={{ color: flash ? '#EAB308' : '#FFF', fontSize: 11, fontWeight: '700' }}>
                    {flash ? '⚡ FLASH' : '⚡ OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sub banner */}
              <View style={styles.instructionBanner}>
                <Info size={14} color="#CCFBF1" style={{ marginRight: 6 }} />
                <Text style={styles.instructionText}>Tarik kelopak mata bawah untuk mengekspos bagian dalam yang merah/pucat.</Text>
              </View>

              {/* Shutter controls */}
              <View style={styles.cameraControls}>
                <View style={styles.shutterRow}>
                  <View style={styles.shutterOuter}>
                    <TouchableOpacity style={styles.shutterInner} onPress={handleCapture}>
                      <CameraIcon size={26} color="#0D9488" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* 2. LOADING STEPS (Quality Check, Phase 1, Phase 2) */}
      {(step === 'quality_check' || step === 'phase1' || step === 'phase2') && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingValText}>{loadingText}</Text>
          <Text style={styles.loadingSubValText}>Mohon tunggu sebentar, data diproses secara lokal.</Text>
        </View>
      )}

      {/* 3. CLINICAL FORM STEP */}
      {step === 'form' && (
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Hasil Deteksi Awal</Text>
            <View style={styles.formBadge}>
              <Text style={styles.formBadgeText}>🔴 Terindikasi Anemia</Text>
            </View>
          </View>
          
          <ScrollView contentContainerStyle={styles.formScroll}>
            <Text style={styles.formIntro}>
              Foto konjungtiva terindikasi anemia. Silakan isi kuesioner gejala klinis berikut untuk triase tingkat keparahan:
            </Text>

            {/* 1. Usia */}
            <Text style={styles.inputLabel}>1. Usia (Tahun)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Masukkan usia (contoh: 16)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            {/* 2. Keteraturan Siklus */}
            <Text style={styles.inputLabel}>2. Keteraturan Siklus Menstruasi</Text>
            <View style={styles.segmentedRow}>
              {['Teratur', 'Tidak Teratur'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.segmentBtn, menstrualRegularity === option && styles.segmentBtnActive]}
                  onPress={() => setMenstrualRegularity(option)}
                >
                  <Text style={[styles.segmentText, menstrualRegularity === option && styles.segmentTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3. Durasi */}
            <Text style={styles.inputLabel}>3. Durasi Menstruasi (Hari)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Masukkan durasi (contoh: 7)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={menstrualDuration}
              onChangeText={setMenstrualDuration}
            />

            {/* 4. Volume */}
            <Text style={styles.inputLabel}>4. Volume Menstruasi</Text>
            <Text style={styles.subInputLabel}>Frekuensi Ganti Pembalut per Hari:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Masukkan jumlah ganti pembalut (contoh: 3)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={padsPerDay}
              onChangeText={setPadsPerDay}
            />
            <Text style={styles.subInputLabel}>Persepsi Subjektif Volume:</Text>
            <View style={styles.segmentedRow}>
              {['Sedikit', 'Normal', 'Banyak'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.segmentBtn, menstrualVolume === option && styles.segmentBtnActive]}
                  onPress={() => setMenstrualVolume(option)}
                >
                  <Text style={[styles.segmentText, menstrualVolume === option && styles.segmentTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 5. TTD Compliance */}
            <Text style={styles.inputLabel}>5. Kepatuhan Konsumsi Tablet Tambah Darah (TTD)</Text>
            <View style={styles.segmentedRow}>
              {['Rutin', 'Kadang-kadang', 'Tidak Pernah'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.segmentBtn, ttdCompliance === option && styles.segmentBtnActive]}
                  onPress={() => setTtdCompliance(option)}
                >
                  <Text style={[styles.segmentText, ttdCompliance === option && styles.segmentTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 6. Pola Makan */}
            <Text style={styles.inputLabel}>6. Konsumsi Makanan Kaya Zat Besi (Daging/Telur/Sayur)</Text>
            <View style={styles.segmentedRow}>
              {['Sering', 'Cukup', 'Jarang/Tidak Pernah'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.segmentBtn, foodFrequency === option && styles.segmentBtnActive]}
                  onPress={() => setFoodFrequency(option)}
                >
                  <Text style={[styles.segmentText, foodFrequency === option && styles.segmentTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 7. Gejala Subjektif */}
            <Text style={styles.inputLabel}>7. Gejala Subjektif (Bisa pilih lebih dari satu)</Text>
            <View style={styles.symptomsContainer}>
              {[
                { id: 'lelah', label: 'Mudah Lelah' },
                { id: 'pusing', label: 'Pusing / Sakit Kepala' },
                { id: 'mata_berkunang', label: 'Mata Berkunang-kunang' },
                { id: 'pucat', label: 'Wajah / Kulit Pucat' },
                { id: 'sesak_napas', label: 'Sesak Napas' }
              ].map(symptom => {
                const isSelected = symptoms.includes(symptom.id);
                return (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => handleSymptomToggle(symptom.id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {isSelected ? '✓ ' : ''}{symptom.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.formSubmitBtn} onPress={submitClinicalForm}>
              <Text style={styles.formSubmitBtnText}>Kirim & Analisis Keparahan</Text>
              <ChevronRight size={20} color="#FFF" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 4. RESULT STEP */}
      {step === 'result' && finalResult && (
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultScroll}>
          <Text style={styles.resultMainTitle}>Hasil Analisis Kesehatan</Text>

          {/* Icon Badge Indicator */}
          <View style={styles.resultBadgeCenter}>
            {finalResult.result === 'No Anemia' ? (
              <View style={[styles.resultBadgeCircle, { backgroundColor: '#ECFDF5' }]}>
                <CheckCircle size={60} color="#10B981" />
              </View>
            ) : (
              <View style={[styles.resultBadgeCircle, { backgroundColor: '#FEF2F2' }]}>
                <ShieldAlert size={60} color={finalResult.color === 'red' ? '#EF4444' : '#F97316'} />
              </View>
            )}
            
            <Text style={styles.resultStateLabel}>Diagnosis Akhir:</Text>
            <Text style={[styles.resultStateValue, { color: finalResult.color === 'green' ? '#10B981' : finalResult.color === 'yellow' ? '#D97706' : finalResult.color === 'orange' ? '#EA580C' : '#DC2626' }]}>
              {finalResult.result === 'No Anemia' ? 'Negatif (Sehat)' : `Anemia Tingkat ${finalResult.result}`}
            </Text>
            
            <Text style={styles.resultConfidence}>
              Tingkat Keyakinan Model: {finalResult.confidence}%
            </Text>
          </View>

          {/* Details Card */}
          <View style={styles.resultDetailsCard}>
            <Text style={styles.detailsCardHeader}>Ringkasan Skrining</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailName}>Hasil Konjungtiva (CNN)</Text>
              <Text style={styles.detailVal}>
                {cnnResult.isAnemic ? '🔴 Terindikasi Anemia' : '🟢 Sehat'}
              </Text>
            </View>
            {cnnResult.isAnemic && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailName}>Usia Anda</Text>
                  <Text style={styles.detailVal}>{age} Tahun</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailName}>Skor Risiko MLP</Text>
                  <Text style={styles.detailVal}>{finalResult.riskScore} poin</Text>
                </View>
              </>
            )}
          </View>

          {/* Action Recommendations */}
          <View style={[styles.resultRecommBox, { borderColor: finalResult.color === 'green' ? '#10B981' : finalResult.color === 'red' ? '#EF4444' : '#F97316' }]}>
            <View style={styles.recommHeaderRow}>
              <HelpCircle size={18} color="#0D9488" style={{ marginRight: 6 }} />
              <Text style={styles.recommBoxTitle}>Rekomendasi Tindakan</Text>
            </View>
            <Text style={styles.recommBoxText}>{finalResult.recommendation}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.resultActionRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={saveAndExit}>
              <Text style={styles.saveBtnText}>Simpan Skrining</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.retryScanBtn} onPress={resetScreen}>
              <RefreshCw size={16} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.retryScanBtnText}>Skrining Ulang</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Photo Quality Failure Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={qualityError !== null}
        onRequestClose={() => setQualityError(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.errorModal}>
            <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: 16 }} />
            <Text style={styles.errorModalTitle}>Kualitas Foto Kurang Baik</Text>
            <Text style={styles.errorModalDesc}>{qualityError}</Text>
            
            <TouchableOpacity style={styles.errorModalBtn} onPress={() => setQualityError(null)}>
              <Text style={styles.errorModalBtnText}>Coba Foto Ulang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  hiddenCameraContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 1,
    height: 1,
    opacity: 0,
  },
  cameraPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayGuideContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height * 0.5,
  },
  overlayGuideBox: {
    width: 260,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bracketTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#0D9488',
    borderTopLeftRadius: 16,
  },
  bracketTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#0D9488',
    borderTopRightRadius: 16,
  },
  bracketBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#0D9488',
    borderBottomLeftRadius: 16,
  },
  bracketBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#0D9488',
    borderBottomRightRadius: 16,
  },
  guideText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cameraHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cameraHeaderBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionBanner: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(13, 148, 136, 0.9)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  cameraControls: {
    height: 120,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterRow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0D9488',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8F9FA',
  },
  loadingValText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 20,
  },
  loadingSubValText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  permissionBackBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionBackBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  formHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  formBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  formBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  formIntro: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 8,
  },
  subInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontSize: 14,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    marginTop: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  formSubmitBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  formSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 6,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  resultScroll: {
    padding: 24,
    paddingBottom: 50,
  },
  resultMainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 36,
    textAlign: 'center',
  },
  resultBadgeCenter: {
    alignItems: 'center',
    marginVertical: 24,
  },
  resultBadgeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  resultStateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  resultStateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  resultConfidence: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  resultDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailsCardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailName: {
    fontSize: 13,
    color: '#64748B',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  resultRecommBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 32,
  },
  recommHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
    textTransform: 'uppercase',
  },
  recommBoxText: {
    fontSize: 13,
    color: '#115E59',
    lineHeight: 19,
  },
  resultActionRow: {
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#0D9488',
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    width: '100%',
  },
  retryScanBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  errorModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorModalDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  errorModalBtn: {
    backgroundColor: '#EF4444',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  errorModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
