import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert, Dimensions, Image, TextInput, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { verifyImageQuality, runPhase1CNN, runPhase2MLP } from '../../utils/classifier';
import { saveScreening } from '../../utils/storage';
import { Camera as CameraIcon, ShieldAlert, CheckCircle, RefreshCw, X, ChevronRight, HelpCircle, Eye, Info, Check, AlertTriangle, Calendar } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function TbmCameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  
  // App States
  const [step, setStep] = useState('camera'); // 'camera', 'quality_check', 'form', 'ai_processing', 'verification', 'result'
  const [flash, setFlash] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  
  // 7 Clinical Parameter States (always filled in for TBM checks)
  const [age, setAge] = useState('');
  const [menstrualRegularity, setMenstrualRegularity] = useState('Teratur'); // 'Teratur', 'Tidak Teratur'
  const [menstrualDuration, setMenstrualDuration] = useState('');
  const [padsPerDay, setPadsPerDay] = useState('');
  const [menstrualVolume, setMenstrualVolume] = useState('Normal'); // 'Sedikit', 'Normal', 'Banyak'
  const [ttdCompliance, setTtdCompliance] = useState('Rutin'); // 'Rutin', 'Kadang-kadang', 'Tidak Pernah'
  const [foodFrequency, setFoodFrequency] = useState('Cukup'); // 'Sering', 'Cukup', 'Jarang/Tidak Pernah'
  const [symptoms, setSymptoms] = useState([]); // 'lelah', 'pusing', 'mata_berkunang', 'pucat', 'sesak_napas'

  // AI Combined prediction result state
  const [aiResult, setAiResult] = useState(null); // { result, confidence, isAnemic, mlpScore }
  
  // TBM Lab Verification states
  const [session, setSession] = useState('Sesi 3'); // 'Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'
  const [hbValue, setHbValue] = useState('');
  const [isConsistent, setIsConsistent] = useState(true); // Matches AI result?
  const [tbmOverrideResult, setTbmOverrideResult] = useState('No Anemia'); // 'No Anemia', 'Ringan', 'Sedang', 'Berat'
  
  // Date state (default to today's date in DD/MM/YYYY)
  const getTodayDateString = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const [checkDate, setCheckDate] = useState('');

  // Set default date when component mounts or resets
  useEffect(() => {
    setCheckDate(getTodayDateString());
  }, [step]);

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

  // Photo quality check error modal
  const [qualityError, setQualityError] = useState(null);

  // Take photo trigger
  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        setStep('quality_check');
        setLoadingText('Memverifikasi kualitas foto...');
        
        let photoUriToUse = '';
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
          });
          photoUriToUse = photo.uri;
        } catch (captureError) {
          console.warn('Gagal capture kamera TBM, menggunakan mock-fallback:', captureError.message);
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

        // Quality check passed -> proceed to 7 Clinical parameters form step
        setStep('form');

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

  // Submit clinical answers and calculate combined AI result (CNN + MLP)
  const submitClinicalForm = async () => {
    // Form validation
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

    if (session !== 'Sesi 4') {
      // Sesi 1-3: Skip AI, directly proceed to verification step
      setAiResult(null);
      setIsConsistent(false); // Sesi 1-3 doesn't use AI verification match
      setTbmOverrideResult('No Anemia'); // default manual category
      setStep('verification');
      return;
    }

    setStep('ai_processing');
    setLoadingText('Mengevaluasi foto & parameter klinis...');

    try {
      // 1. Run Stage 1 CNN on photo
      const cnnRes = await runPhase1CNN(photoUri);

      // 2. Run Stage 2 MLP on answers
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

      // 3. Combined Logic:
      // If Stage 1 CNN is negative (No Anemia), combined result is 'No Anemia'.
      // If Stage 1 CNN is positive, combined result is MLP's triage (Mild/Moderate/Severe).
      let combinedCategory = 'No Anemia';
      let confidenceScore = cnnRes.confidence;

      if (cnnRes.isAnemic) {
        combinedCategory = mlpRes.result; // 'Ringan', 'Sedang', or 'Berat'
        confidenceScore = mlpRes.confidence;
      }

      setAiResult({
        result: combinedCategory,
        confidence: confidenceScore,
        isAnemic: cnnRes.isAnemic,
        mlpScore: mlpRes.riskScore
      });

      // Default override matches AI initially
      setTbmOverrideResult(combinedCategory);
      setStep('verification');

    } catch (e) {
      Alert.alert('Error AI', 'Gagal memproses analisis AI: ' + e.message);
      setStep('form');
    }
  };

  const saveVerificationResult = async () => {
    // Validate Hb Value
    if (!hbValue || isNaN(parseFloat(hbValue))) {
      Alert.alert('Error', 'Silakan masukkan nilai Hemoglobin (Hb) yang valid.');
      return;
    }
    const hbVal = parseFloat(hbValue);
    if (hbVal < 3.0 || hbVal > 22.0) {
      Alert.alert('Validasi Gagal', 'Nilai hemoglobin harus berkisar antara 3.0 hingga 22.0 g/dL.');
      return;
    }

    // Validate Custom Date format (DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(checkDate)) {
      Alert.alert('Validasi Tanggal', 'Format tanggal salah. Gunakan format DD/MM/YYYY (contoh: 22/06/2026).');
      return;
    }

    setStep('saving');
    setLoadingText('Menyimpan hasil ke database...');

    try {
      const isSesi4 = session === 'Sesi 4';
      const finalCategory = isSesi4 ? (isConsistent ? aiResult.result : tbmOverrideResult) : tbmOverrideResult;

      // Save record with customized date and session override
      await saveScreening({
        result: isSesi4 ? aiResult.result : null,
        confidence: isSesi4 ? aiResult.confidence : null,
        session,
        hbValue: hbVal,
        tbmResult: finalCategory,
        isConsistent: isSesi4 ? isConsistent : null,
        rawCnnScore: isSesi4 ? aiResult.confidence : null,
        date: checkDate, // Custom date from TBM input
        answers: {
          age: parseInt(age, 10),
          menstrualRegularity,
          menstrualDuration: parseInt(menstrualDuration, 10),
          padsPerDay: parseInt(padsPerDay, 10),
          menstrualVolume,
          ttdCompliance,
          foodFrequency,
          symptoms
        }
      });

      setStep('result');
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan data skrining.');
      setStep('verification');
    }
  };

  const resetScreen = () => {
    setStep('camera');
    setAiResult(null);
    setHbValue('');
    setSession('Sesi 3');
    setIsConsistent(true);
    setTbmOverrideResult('No Anemia');
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
          Aplikasi memerlukan izin akses kamera untuk mengambil foto konjungtiva mata siswi secara langsung.
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
                <Text style={styles.cameraTitle}>Skrining TBMs</Text>
                <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.cameraHeaderBtn}>
                  <Text style={{ color: flash ? '#EAB308' : '#FFF', fontSize: 11, fontWeight: '700' }}>
                    {flash ? '⚡ FLASH' : '⚡ OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sub banner */}
              <View style={styles.instructionBanner}>
                <Info size={14} color="#CCFBF1" style={{ marginRight: 6 }} />
                <Text style={styles.instructionText}>Tarik kelopak mata bawah siswi untuk mengarahkan kamera pada konjungtiva mata.</Text>
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

      {/* 2. LOADING STEPS (Quality Check, AI Processing, Saving) */}
      {(step === 'quality_check' || step === 'ai_processing' || step === 'saving') && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingValText}>{loadingText}</Text>
          <Text style={styles.loadingSubValText}>Memproses data pemeriksaan secara lokal.</Text>
        </View>
      )}

      {/* 3. 7 CLINICAL FORM STEP (Always displayed for TBMs) */}
      {step === 'form' && (
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Parameter Gejala Klinis</Text>
            <TouchableOpacity onPress={resetScreen} style={styles.closeBtn}>
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.formScroll}>
            <Text style={styles.formIntro}>
              Isi data klinis berikut untuk memproses data pemeriksaan:
            </Text>

            {/* Sesi Skrining Selector */}
            <Text style={styles.inputLabel}>Pilih Sesi Skrining</Text>
            <View style={styles.segmentedRow}>
              {['Sesi 1', 'Sesi 2', 'Sesi 3', 'Sesi 4'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.segmentBtn, session === option && styles.segmentBtnActive]}
                  onPress={() => setSession(option)}
                >
                  <Text style={[styles.segmentText, session === option && styles.segmentTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 1. Usia */}
            <Text style={styles.inputLabel}>1. Usia Siswi (Tahun)</Text>
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
              <Text style={styles.formSubmitBtnText}>Proses Hasil AI</Text>
              <ChevronRight size={20} color="#FFF" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 4. TBM LAB VERIFICATION STEP */}
      {step === 'verification' && (
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Verifikasi Diagnostik TBM</Text>
            <TouchableOpacity onPress={resetScreen} style={styles.closeBtn}>
              <X size={20} color="#475569" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.formScroll}>
            {session === 'Sesi 4' && aiResult ? (
              /* AI combined result display */
              <View style={styles.aiResultCard}>
                <Text style={styles.aiCardTitle}>Hasil Diagnosis Model AI:</Text>
                <View style={styles.aiResultRow}>
                  <Text style={[styles.aiResultVal, { color: aiResult.result === 'No Anemia' ? '#10B981' : aiResult.result === 'Ringan' ? '#F59E0B' : aiResult.result === 'Sedang' ? '#F97316' : '#EF4444' }]}>
                    {aiResult.result === 'No Anemia' ? 'No Anemia (Negatif)' : `Anemia: ${aiResult.result}`}
                  </Text>
                  <Text style={styles.aiResultConfidence}>Keyakinan: {aiResult.confidence}%</Text>
                </View>
              </View>
            ) : (
              /* Sesi 1-3: Non-AI Data Collection banner */
              <View style={styles.nonAiBanner}>
                <Info size={18} color="#0D9488" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nonAiBannerTitle}>Pengumpulan Data {session}</Text>
                  <Text style={styles.nonAiBannerText}>
                    Evaluasi AI dinonaktifkan untuk Sesi 1-3. Data klinis dan Hb akan direkam untuk keperluan training model.
                  </Text>
                </View>
              </View>
            )}

            {/* Hb Value Input */}
            <Text style={styles.inputLabel}>Masukkan Hasil Hb Laboratorium (g/dL):</Text>
            <View style={styles.hbInputRow}>
              <TextInput
                style={styles.hbInput}
                placeholder="Contoh: 11.5"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={hbValue}
                onChangeText={setHbValue}
              />
              <Text style={styles.hbUnit}>g/dL</Text>
            </View>

            {/* Date Input */}
            <Text style={styles.inputLabel}>Tanggal Pemeriksaan (DD/MM/YYYY):</Text>
            <View style={styles.dateInputRow}>
              <Calendar size={18} color="#0D9488" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.dateTextInput}
                placeholder="Format: DD/MM/YYYY"
                placeholderTextColor="#94A3B8"
                value={checkDate}
                onChangeText={setCheckDate}
              />
            </View>

            {session === 'Sesi 4' ? (
              <>
                {/* AI Verification Match Toggle */}
                <Text style={styles.inputLabel}>Validasi Kecocokan AI vs Lab:</Text>
                <View style={styles.verificationMatchRow}>
                  <TouchableOpacity 
                    style={[styles.matchOptionBtn, isConsistent && styles.matchOptionBtnActive]}
                    onPress={() => setIsConsistent(true)}
                  >
                    <Check size={18} color={isConsistent ? '#FFF' : '#64748B'} style={{ marginRight: 6 }} />
                    <Text style={[styles.matchOptionText, isConsistent && styles.matchOptionTextActive]}>Sesuai AI</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.matchOptionBtn, !isConsistent && styles.matchOptionBtnActiveError]}
                    onPress={() => setIsConsistent(false)}
                  >
                    <AlertTriangle size={18} color={!isConsistent ? '#FFF' : '#64748B'} style={{ marginRight: 6 }} />
                    <Text style={[styles.matchOptionText, !isConsistent && styles.matchOptionTextActive]}>Tidak Sesuai</Text>
                  </TouchableOpacity>
                </View>

                {/* Override Selection (Shows only if Consistent is False) */}
                {!isConsistent && (
                  <View style={styles.overrideCard}>
                    <Text style={styles.overrideTitle}>Tentukan Kategori Akhir (TBM Override):</Text>
                    <View style={styles.overrideGrid}>
                      {[
                        { id: 'No Anemia', label: 'No Anemia', color: '#10B981' },
                        { id: 'Ringan', label: 'Ringan', color: '#F59E0B' },
                        { id: 'Sedang', label: 'Sedang', color: '#F97316' },
                        { id: 'Berat', label: 'Berat', color: '#EF4444' }
                      ].map(cat => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.overrideBtn, 
                            tbmOverrideResult === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                          ]}
                          onPress={() => setTbmOverrideResult(cat.id)}
                        >
                          <Text style={[
                            styles.overrideBtnText, 
                            tbmOverrideResult === cat.id && { color: '#FFF', fontWeight: 'bold' }
                          ]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              /* Sesi 1-3: Direct manual diagnosis picker */
              <View style={styles.overrideCard}>
                <Text style={styles.overrideTitle}>Tentukan Kategori Anemia Akhir (Pemeriksaan Fisik/Lab):</Text>
                <View style={styles.overrideGrid}>
                  {[
                    { id: 'No Anemia', label: 'No Anemia', color: '#10B981' },
                    { id: 'Ringan', label: 'Ringan', color: '#F59E0B' },
                    { id: 'Sedang', label: 'Sedang', color: '#F97316' },
                    { id: 'Berat', label: 'Berat', color: '#EF4444' }
                  ].map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.overrideBtn, 
                        tbmOverrideResult === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                      ]}
                      onPress={() => setTbmOverrideResult(cat.id)}
                    >
                      <Text style={[
                        styles.overrideBtnText, 
                        tbmOverrideResult === cat.id && { color: '#FFF', fontWeight: 'bold' }
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={saveVerificationResult}>
              <Text style={styles.submitBtnText}>Simpan Pemeriksaan & Hasil Lab</Text>
              <ChevronRight size={20} color="#FFF" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 5. SUCCESS STEP */}
      {step === 'result' && (
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <CheckCircle size={70} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Pemeriksaan Berhasil Disimpan</Text>
          <Text style={styles.successDesc}>
            Hasil pemeriksaan mata, 7 parameter klinis, dan kadar hemoglobin laboratorium untuk {session} ({checkDate}) telah berhasil disimpan ke database lokal.
          </Text>

          <TouchableOpacity style={styles.successCtaBtn} onPress={resetScreen}>
            <Text style={styles.successCtaBtnText}>Skrining Baru</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.successBackBtn} onPress={() => router.replace('/(tbms)/riwayat')}>
            <Text style={styles.successBackBtnText}>Lihat Riwayat Skrining</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 16,
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
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 14,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#0D9488',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0D9488',
  },
  chipText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0D9488',
    fontWeight: 'bold',
  },
  formSubmitBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  formSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  aiResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  aiCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  aiResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiResultVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  aiResultConfidence: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  hbInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    height: 48,
    marginBottom: 8,
  },
  hbInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  hbUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    height: 48,
    marginBottom: 8,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  verificationMatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  matchOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },
  matchOptionBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  matchOptionBtnActiveError: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  matchOptionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  matchOptionTextActive: {
    color: '#FFFFFF',
  },
  overrideCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginVertical: 14,
  },
  overrideTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  overrideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overrideBtn: {
    width: '48%',
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  overrideBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  successCtaBtn: {
    backgroundColor: '#0D9488',
    height: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successBackBtn: {
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBackBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: width - 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  errorModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorModalDesc: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  errorModalBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nonAiBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    marginBottom: 20,
  },
  nonAiBannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D9488',
    marginBottom: 4,
  },
  nonAiBannerText: {
    fontSize: 12,
    color: '#0D9488',
    lineHeight: 18,
  },
});
