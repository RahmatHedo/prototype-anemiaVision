/**
 * Mock AI Classifier for AnemiaVision
 * Simulates Phase 1 (CNN for conjunctiva photo) and Phase 2 (MLP for clinical questionnaire)
 */

// Simulates image quality check (sharpness & brightness verification)
// Returns success or failure reason to test retry alerts
export async function verifyImageQuality(imageUri) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate random quality checks: 15% chance of failing due to blur or low light
      const random = Math.random();
      if (random < 0.08) {
        resolve({
          success: false,
          reason: 'Gambar terdeteksi buram (blur). Pastikan kamera fokus dan tangan stabil.'
        });
      } else if (random < 0.15) {
        resolve({
          success: false,
          reason: 'Kecerahan gambar terlalu rendah (gelap). Silakan aktifkan flash atau cari ruangan terang.'
        });
      } else {
        resolve({ success: true });
      }
    }, 1500); // 1.5s simulated analysis
  });
}

// Simulates Phase 1: Binary detection (Anemia vs No Anemia) from Conjunctiva image
export async function runPhase1CNN(imageUri) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Always return true for demonstration to trigger the 7 input form
      const isAnemic = true;
      const confidence = parseFloat((80 + Math.random() * 18).toFixed(1)); // 80% - 98%
      
      resolve({
        isAnemic,
        confidence
      });
    }, 2000); // 2s simulated CNN classification
  });
}

// Simulates Phase 2: Severity Triage (Ringan / Sedang / Berat) using MLP + 7 Clinical Questions
// This is only triggered if Phase 1 is Positive
export async function runPhase2MLP(answers) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let riskScore = 0;

      // 1. Regularity
      if (answers.menstrualRegularity === 'Tidak Teratur') riskScore += 1;

      // 2. Duration
      const duration = parseInt(answers.menstrualDuration, 10) || 5;
      if (duration > 7) riskScore += 1;

      // 3. Volume
      const padsPerDay = parseInt(answers.padsPerDay, 10) || 2;
      if (padsPerDay > 3 || answers.menstrualVolume === 'Banyak') riskScore += 1;

      // 4. TTD Compliance
      if (answers.ttdCompliance === 'Kadang-kadang') riskScore += 1;
      if (answers.ttdCompliance === 'Tidak Pernah') riskScore += 2;

      // 5. Food Frequency
      if (answers.foodFrequency === 'Jarang/Tidak Pernah') riskScore += 1.5;

      // 6. Subjective Symptoms
      const symptomCount = Array.isArray(answers.symptoms) ? answers.symptoms.length : 0;
      if (symptomCount >= 4) {
        riskScore += 2.5;
      } else if (symptomCount >= 2) {
        riskScore += 1.5;
      } else if (symptomCount >= 1) {
        riskScore += 0.5;
      }

      // Final triage based on riskScore
      let result = 'Ringan';
      let confidence = parseFloat((70 + Math.random() * 25).toFixed(1));
      let recommendation = '';
      let color = 'yellow';

      if (riskScore >= 6) {
        result = 'Berat';
        color = 'red';
        recommendation = '⚠️ KASUS KRITIS. Segera rujuk siswi ke Puskesmas atau Fasilitas Kesehatan terdekat untuk tes darah Quik-Check Hb lengkap. Informasikan kepada pihak sekolah/orang tua untuk penanganan darurat segera.';
      } else if (riskScore >= 3.5) {
        result = 'Sedang';
        color = 'orange';
        recommendation = 'Dianjurkan berkonsultasi dengan Kader Kesehatan Sekolah atau kunjungi Puskesmas terdekat. Konsumsi Tablet Tambah Darah (TTD) secara teratur dan lakukan skrining ulang dalam waktu 2 minggu.';
      } else {
        result = 'Ringan';
        color = 'yellow';
        recommendation = 'Dianjurkan mengonsumsi Tablet Tambah Darah (TTD) 1 tablet per minggu secara konsisten. Tingkatkan asupan makanan kaya zat besi (seperti bayam, daging merah, hati ayam) serta vitamin C untuk membantu penyerapan zat besi.';
      }

      resolve({
        result,
        confidence,
        color,
        recommendation,
        riskScore,
        yesCount: Math.round(riskScore) // For backward compatibility with counts
      });
    }, 2000); // 2s simulated MLP triage
  });
}

// Medical recommendations for No Anemia (used if Phase 1 returns negative)
export const NO_ANEMIA_RECOMMENDATION = {
  result: 'No Anemia',
  color: 'green',
  confidence: 94.5,
  recommendation: 'Kondisi konjungtiva mata tergolong sehat dan tidak terindikasi anemia. Tetap jaga kesehatan dengan mengonsumsi makanan gizi seimbang, cukup istirahat, dan lakukan skrining pencegahan berkala 6 bulan sekali.'
};
