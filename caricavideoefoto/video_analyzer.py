#!/usr/bin/env python3
"""
Advanced Video Forensics Analyzer
Analizza video in dettaglio per rilevare segni di generazione AI o deepfake
"""

import cv2
import numpy as np
import json
import sys
import os
from pathlib import Path
import subprocess
from scipy import stats
import hashlib
from datetime import datetime

class VideoForensicsAnalyzer:
    def __init__(self, video_path):
        self.video_path = video_path
        self.cap = cv2.VideoCapture(video_path)
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
    def analyze(self):
        """Esegui analisi completa video"""
        results = {
            'metadata_analysis': self.analyze_metadata(),
            'frame_consistency': self.analyze_frame_consistency(),
            'compression_analysis': self.analyze_compression(),
            'face_detection': self.analyze_faces(),
            'light_consistency': self.analyze_lighting(),
            'motion_analysis': self.analyze_motion(),
            'encoding_signatures': self.analyze_encoding_signatures(),
            'ai_detection': self.analyze_ai_patterns()
        }
        
        authenticity_score = self.calculate_authenticity(results)
        results['authenticity_score'] = authenticity_score
        results['verdict'] = self.get_verdict(authenticity_score)
        
        return results
    
    def analyze_metadata(self):
        """Analizza metadati del file"""
        try:
            file_stats = os.stat(self.video_path)
            cmd = ['ffprobe', '-v', 'error', '-print_format', 'json', 
                   '-show_format', '-show_streams', self.video_path]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                metadata = json.loads(result.stdout)
                return {
                    'is_valid': True,
                    'file_size': file_stats.st_size,
                    'duration': metadata['format'].get('duration', 'unknown'),
                    'bit_rate': metadata['format'].get('bit_rate', 'unknown'),
                    'creation_time': metadata['format'].get('tags', {}).get('creation_time', 'unknown'),
                    'codec': metadata['streams'][0].get('codec_name', 'unknown') if metadata['streams'] else 'unknown',
                    'suspicious_indicators': self.check_metadata_anomalies(metadata)
                }
        except Exception as e:
            return {'is_valid': False, 'error': str(e)}
    
    def check_metadata_anomalies(self, metadata):
        """Controlla anomalie nei metadati"""
        anomalies = []
        
        try:
            format_info = metadata.get('format', {})
            
            # Controlla tag editor sospetti
            tags = format_info.get('tags', {})
            if 'encoder' in tags:
                encoder = tags['encoder'].lower()
                if any(x in encoder for x in ['deepfacelab', 'faceswap', 'first-order']):
                    anomalies.append(f"Encoder sospetto rilevato: {encoder}")
            
            # Controlla timestamp anomali
            if 'creation_time' in tags:
                try:
                    creation_date = datetime.fromisoformat(tags['creation_time'].replace('Z', '+00:00'))
                    if creation_date.year < 2000 or creation_date.year > 2030:
                        anomalies.append("Data creazione anomala")
                except:
                    pass
            
            # Controlla dimensioni non standard
            if len(metadata.get('streams', [])) > 0:
                stream = metadata['streams'][0]
                width = stream.get('width')
                height = stream.get('height')
                
                # Dimensioni non standard possono indicare upscaling AI
                if width and height:
                    if (width % 8 != 0 or height % 8 != 0) and (width % 16 != 0 or height % 16 != 0):
                        anomalies.append("Dimensioni frame non standard (possibile AI upscaling)")
        
        except Exception as e:
            pass
        
        return anomalies
    
    def analyze_frame_consistency(self):
        """Analizza consistenza tra i frame"""
        frame_diffs = []
        prev_frame = None
        frame_sample_rate = max(1, self.frame_count // 100)  # Campiona ~100 frame
        
        for i in range(0, int(self.frame_count), frame_sample_rate):
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = self.cap.read()
            
            if not ret:
                continue
            
            frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            if prev_frame is not None:
                # Calcola differenza assoluta media tra frame
                diff = cv2.absdiff(prev_frame, frame_gray)
                mean_diff = np.mean(diff)
                frame_diffs.append(mean_diff)
            
            prev_frame = frame_gray
        
        if not frame_diffs:
            return {'consistent': True, 'suspicious_jumps': []}
        
        # Analizza per salti anomali
        diffs_array = np.array(frame_diffs)
        mean_diff = np.mean(diffs_array)
        std_diff = np.std(diffs_array)
        
        # Individua salti anomali (>3 deviazioni standard)
        anomalies = []
        for i, diff in enumerate(diffs_array):
            if diff > mean_diff + 3 * std_diff:
                anomalies.append({
                    'frame': i * frame_sample_rate,
                    'deviation': (diff - mean_diff) / std_diff if std_diff > 0 else 0
                })
        
        return {
            'consistent': len(anomalies) < self.frame_count * 0.05,  # <5% anomalie
            'mean_frame_difference': float(mean_diff),
            'std_deviation': float(std_diff),
            'suspicious_jumps': anomalies[:10]
        }
    
    def analyze_compression(self):
        """Analizza artefatti di compressione"""
        # Leggi il file binario per pattern di compressione
        with open(self.video_path, 'rb') as f:
            data = f.read(min(1000000, os.path.getsize(self.video_path)))  # Leggi primo 1MB
        
        # Conta marker specifici
        h264_starts = data.count(b'\x00\x00\x00\x01')  # NAL start codes H.264
        h264_short = data.count(b'\x00\x01')  # Short NAL start
        
        # Analizza distribuzione byte
        byte_freq = {}
        for byte in data:
            byte_freq[byte] = byte_freq.get(byte, 0) + 1
        
        # Calcola entropia
        total_bytes = len(data)
        entropy = 0
        for count in byte_freq.values():
            prob = count / total_bytes
            if prob > 0:
                entropy -= prob * np.log2(prob)
        
        # Video reali hanno entropia alta; AI-generated video ha pattern ripetitivi
        suspicious_low_entropy = entropy < 6.0
        suspicious_high_nal = h264_starts > 500  # Troppi NAL units
        
        return {
            'h264_nal_units': h264_starts,
            'entropy': float(entropy),
            'suspicious_low_entropy': suspicious_low_entropy,
            'suspicious_high_nal': suspicious_high_nal,
            'compression_quality': 'suspicious' if (suspicious_low_entropy or suspicious_high_nal) else 'normal'
        }
    
    def analyze_faces(self):
        """Analizza volti nei frame con Haar Cascade"""
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        faces_detected = []
        face_sizes = []
        frame_sample_rate = max(1, self.frame_count // 30)  # 30 sample frame
        
        for i in range(0, int(self.frame_count), frame_sample_rate):
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = self.cap.read()
            
            if not ret:
                continue
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) > 0:
                faces_detected.append(i)
                for (x, y, w, h) in faces:
                    face_sizes.append(w * h)
        
        # Analizza consistenza volti
        face_consistency = len(faces_detected) > 0
        
        if face_sizes:
            size_variance = np.std(face_sizes) / np.mean(face_sizes) if np.mean(face_sizes) > 0 else 0
            suspicious_size_variance = size_variance > 0.5  # Varianza troppo alta
        else:
            suspicious_size_variance = False
        
        return {
            'faces_detected': len(faces_detected),
            'frames_with_faces': len(faces_detected),
            'face_size_variance': float(size_variance) if face_sizes else 0,
            'suspicious_face_artifacts': suspicious_size_variance
        }
    
    def analyze_lighting(self):
        """Analizza coerenza dell'illuminazione"""
        brightness_values = []
        frame_sample_rate = max(1, self.frame_count // 50)
        
        for i in range(0, int(self.frame_count), frame_sample_rate):
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = self.cap.read()
            
            if not ret:
                continue
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            brightness = np.mean(gray)
            brightness_values.append(brightness)
        
        if not brightness_values:
            return {'consistent': True}
        
        brightness_array = np.array(brightness_values)
        brightness_std = np.std(brightness_array)
        
        # Illuminazione inconstistente (video generato)
        suspicious_lighting = brightness_std > 30
        
        return {
            'mean_brightness': float(np.mean(brightness_array)),
            'brightness_std': float(brightness_std),
            'consistent': not suspicious_lighting,
            'suspicious_lighting_changes': suspicious_lighting
        }
    
    def analyze_motion(self):
        """Analizza pattern di movimento"""
        motion_data = []
        prev_frame = None
        frame_sample_rate = max(1, self.frame_count // 50)
        
        for i in range(0, int(self.frame_count), frame_sample_rate):
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = self.cap.read()
            
            if not ret:
                continue
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            if prev_frame is not None:
                # Calcola optical flow
                flow = cv2.calcOpticalFlowFarneback(
                    prev_frame, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
                )
                
                # Calcola magnitudine del movimento
                mag = np.sqrt(flow[..., 0]**2 + flow[..., 1]**2).mean()
                motion_data.append(float(mag))
            
            prev_frame = gray
        
        if not motion_data:
            return {'smooth': True}
        
        motion_array = np.array(motion_data)
        motion_std = np.std(motion_array)
        motion_mean = np.mean(motion_array)
        
        # Video AI spesso ha movimento irregolare
        suspicious_motion = motion_std > motion_mean * 2 if motion_mean > 0 else False
        
        return {
            'mean_motion': float(motion_mean),
            'motion_std': float(motion_std),
            'suspicious_motion_anomalies': suspicious_motion
        }
    
    def analyze_encoding_signatures(self):
        """Analizza firme di codec specifiche"""
        with open(self.video_path, 'rb') as f:
            data = f.read(min(2000000, os.path.getsize(self.video_path)))
        
        signatures = {
            'h264': data.count(b'\x67\x42\x00'),  # H.264 SPS
            'h265': data.count(b'\x40\x01\x0c'),  # H.265/HEVC
            'vp9': data.count(b'\x9d\x01'),     # VP9
            'av1': data.count(b'\x12'),         # AV1
        }
        
        # Leggi header per informazioni codec
        ftyp_pos = data.find(b'ftyp')
        codec_hint = 'unknown'
        if ftyp_pos != -1 and ftyp_pos + 12 < len(data):
            brand = data[ftyp_pos+4:ftyp_pos+8].decode('utf-8', errors='ignore')
            codec_hint = brand
        
        return {
            'codec_signatures': signatures,
            'codec_brand': codec_hint
        }
    
    def analyze_ai_patterns(self):
        """Analizza pattern caratteristici di generazione AI"""
        with open(self.video_path, 'rb') as f:
            data = f.read(min(5000000, os.path.getsize(self.video_path)))
        
        ai_patterns = {
            'stable_diffusion_markers': 0,
            'deepfake_lab_markers': 0,
            'face_swap_markers': 0,
        }
        
        # Pattern Stable Diffusion (nelle immagini)
        if b'\xffbind\x00' in data or b'VAE latent' in data:
            ai_patterns['stable_diffusion_markers'] += 40
        
        # Pattern DeepfaceLab (metadata specifici)
        if b'DeepFaceLab' in data or b'dfm' in data:
            ai_patterns['deepfake_lab_markers'] += 50
        
        # Pattern specifici faceswap
        if b'FaceSwapLab' in data or b'faceswap' in data.lower():
            ai_patterns['face_swap_markers'] += 45
        
        # Analizza distribuzione di byte anomala
        byte_dist = {}
        for byte in data[:100000]:
            byte_dist[byte] = byte_dist.get(byte, 0) + 1
        
        # Video AI hanno spesso distribuzione byte poco naturale
        max_freq = max(byte_dist.values()) if byte_dist else 0
        total_unique = len(byte_dist)
        byte_freq_ratio = max_freq / len(data[:100000]) if len(data) > 0 else 0
        
        suspicious_byte_distribution = byte_freq_ratio > 0.05  # >5% del primo 100KB stesso byte
        
        ai_score = (
            ai_patterns['stable_diffusion_markers'] +
            ai_patterns['deepfake_lab_markers'] +
            ai_patterns['face_swap_markers'] +
            (30 if suspicious_byte_distribution else 0)
        )
        
        return {
            'suspected_ai_tool': 'unknown',
            'ai_confidence': min(100, ai_score),
            'patterns_found': [k for k, v in ai_patterns.items() if v > 0],
            'suspicious_byte_distribution': suspicious_byte_distribution
        }
    
    def calculate_authenticity(self, results):
        """Calcola score di autenticità"""
        score = 100
        
        # Metadati
        metadata = results['metadata_analysis']
        if not metadata.get('is_valid'):
            score -= 15
        if metadata.get('suspicious_indicators'):
            score -= 5 * len(metadata['suspicious_indicators'])
        
        # Consistenza frame
        if not results['frame_consistency'].get('consistent'):
            score -= 20
        if results['frame_consistency'].get('suspicious_jumps'):
            score -= 5 * len(results['frame_consistency']['suspicious_jumps'][:5])
        
        # Compressione
        compression = results['compression_analysis']
        if compression.get('suspicious_low_entropy'):
            score -= 25
        if compression.get('suspicious_high_nal'):
            score -= 10
        
        # Volti
        if results['face_detection'].get('suspicious_face_artifacts'):
            score -= 20
        
        # Illuminazione
        if not results['light_consistency'].get('consistent'):
            score -= 15
        
        # Movimento
        if results['motion_analysis'].get('suspicious_motion_anomalies'):
            score -= 15
        
        # Pattern AI
        ai_detection = results['ai_detection']
        if ai_detection.get('ai_confidence', 0) > 50:
            score -= ai_detection['ai_confidence'] // 3
        if ai_detection.get('suspicious_byte_distribution'):
            score -= 20
        
        return max(0, min(100, score))
    
    def get_verdict(self, score):
        """Determina verdetto basato su score"""
        if score >= 75:
            return 'authentic'
        elif score >= 55:
            return 'suspicious'
        else:
            return 'fake'
    
    def close(self):
        """Chiudi il video capture"""
        self.cap.release()

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Video path required'}))
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    try:
        analyzer = VideoForensicsAnalyzer(video_path)
        results = analyzer.analyze()
        analyzer.close()
        
        print(json.dumps(results, indent=2))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
