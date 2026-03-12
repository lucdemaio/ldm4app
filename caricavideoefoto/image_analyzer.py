#!/usr/bin/env python3
"""
Image Forensics Analyzer
Analizza immagini in dettaglio per rilevare segni di generazione AI o editing
"""

import cv2
import numpy as np
import json
import sys
from PIL import Image
from PIL.ExifTags import TAGS
import os

class ImageForensicsAnalyzer:
    def __init__(self, image_path):
        self.image_path = image_path
        self.image = cv2.imread(image_path)
        self.image_pil = Image.open(image_path)
        
    def analyze(self):
        """Esegui analisi completa immagine"""
        results = {
            'metadata_analysis': self.analyze_metadata(),
            'pixel_analysis': self.analyze_pixels(),
            'compression_analysis': self.analyze_compression(),
            'texture_analysis': self.analyze_texture(),
            'noise_analysis': self.analyze_noise(),
            'edge_analysis': self.analyze_edges(),
            'ai_detection': self.analyze_ai_patterns()
        }
        
        authenticity_score = self.calculate_authenticity(results)
        results['authenticity_score'] = authenticity_score
        results['verdict'] = self.get_verdict(authenticity_score)
        
        return results
    
    def analyze_metadata(self):
        """Analizza EXIF e metadati"""
        try:
            exif_data = {}
            for tag, value in self.image_pil._getexif().items() if self.image_pil._getexif() else []:
                tag_name = TAGS.get(tag, tag)
                exif_data[tag_name] = str(value)[:100]  # Limita output
            
            return {
                'has_exif': len(exif_data) > 0,
                'exif_data': exif_data,
                'file_size': os.path.getsize(self.image_path),
                'image_format': self.image_pil.format,
                'image_size': self.image_pil.size
            }
        except Exception as e:
            return {
                'has_exif': False,
                'error': str(e),
                'file_size': os.path.getsize(self.image_path),
                'image_format': self.image_pil.format,
                'image_size': self.image_pil.size
            }
    
    def analyze_pixels(self):
        """Analizza distribuzione e anomalie pixel"""
        # Convertisci in HSV per migliore analisi colore
        if self.image is None:
            return {'error': 'Impossibile leggere immagine'}
        
        hsv = cv2.cvtColor(self.image, cv2.COLOR_BGR2HSV)
        # Analizza ogni canale
        pixel_values_analysis = {
            'channel_means': [],
            'channel_stds': [],
            'pixel_distribution_anomaly': False
        }
        
        for channel_idx in range(3):
            channel = hsv[:, :, channel_idx].flatten()
            mean = np.mean(channel)
            std = np.std(channel)
            pixel_values_analysis['channel_means'].append(float(mean))
            pixel_values_analysis['channel_stds'].append(float(std))
        
        # Controlla per distribuzione dei pixel non naturale
        hist_h = cv2.calcHist([hsv], [0], None, [256], [0, 256]).flatten()
        hist_h /= hist_h.sum()
        
        # Video AI spesso hanno distribuzione pixel artificiale
        max_bin = np.max(hist_h)
        pixel_values_analysis['pixel_distribution_anomaly'] = max_bin > 0.1
        
        return pixel_values_analysis
    
    def analyze_compression(self):
        """Analizza artefatti di compressione JPEG"""
        gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        
        # Applica filtro Laplacian per rilevare edge
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian_var = np.var(laplacian)
        
        # Controlla per blocking artifacts (tipico di JPEG compresso)
        # Usa DCT (Discrete Cosine Transform)
        float_image = np.float32(gray) / 255.0
        dct = cv2.dct(float_image)
        dct_var = np.var(dct)
        
        # Alto livello di varianza DCT suggerisce naturale
        # Basso livello suggerisce AI-generated
        suspicious_compression = dct_var < 0.02 or laplacian_var > 500
        
        return {
            'laplacian_variance': float(laplacian_var),
            'dct_variance': float(dct_var),
            'suspicious_compression': suspicious_compression,
            'compression_type': self.detect_compression_type()
        }
    
    def detect_compression_type(self):
        """Rileva tipo di compressione"""
        format_info = self.image_pil.format
        if format_info == 'JPEG':
            return 'JPEG'
        elif format_info == 'PNG':
            return 'PNG'
        else:
            return format_info or 'unknown'
    
    def analyze_texture(self):
        """Analizza texture e pattern locali"""
        gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY) if len(self.image.shape) == 3 else self.image
        
        # Calcola Local Binary Pattern (LBP) per texture
        def get_lbp(image):
            kernel = np.array([[1, 2, 4], [128, 0, 8], [64, 32, 16]], dtype=np.uint8)
            lbp = np.zeros_like(image)
            
            for i in range(1, image.shape[0]-1):
                for j in range(1, image.shape[1]-1):
                    patch = image[i-1:i+2, j-1:j+2]
                    center = patch[1, 1]
                    lbp[i, j] = np.sum((patch > center) * kernel)
            
            return lbp
        
        # Analizza LBP
        lbp = get_lbp(gray[::2, ::2])  # Sottocampiona per velocità
        lbp_hist = np.histogram(lbp.flatten(), bins=256, range=(0, 256))[0]
        lbp_hist = lbp_hist / lbp_hist.sum()
        
        # Video AI hanno texture meno varia
        entropy = -np.sum(lbp_hist * np.log2(lbp_hist + 1e-10))
        
        return {
            'texture_entropy': float(entropy),
            'suspicious_uniform_texture': entropy < 4.0
        }
    
    def analyze_noise(self):
        """Analizza rumore naturale vs artificiale"""
        gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        
        # Calcola Laplacian per rilevare irregolarità
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        
        # Filtra con Gaussian per vedere il "rumore"
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        noise = cv2.subtract(gray, blurred)
        
        noise_std = np.std(noise)
        noise_mean = np.mean(np.abs(noise))
        
        # Immagini AI hanno pattern di rumore artificiale
        suspicious_noise = noise_std < 2.0 or noise_std > 30
        
        return {
            'noise_std': float(noise_std),
            'noise_mean': float(noise_mean),
            'suspicious_noise_pattern': suspicious_noise
        }
    
    def analyze_edges(self):
        """Analizza edge e contorni"""
        gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        
        # Canny edge detection
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (gray.shape[0] * gray.shape[1])
        
        # Controlla per edge tropo puliti o irregolari
        suspicious_edges = edge_density < 0.02 or edge_density > 0.15
        
        return {
            'edge_density': float(edge_density),
            'suspicious_edges': suspicious_edges
        }
    
    def analyze_ai_patterns(self):
        """Analizza pattern tipici di AI"""
        gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        
        # Analizza frequency domain
        fft = np.fft.fft2(gray)
        fft_shifted = np.fft.fftshift(fft)
        magnitude_spectrum = np.abs(fft_shifted)
        
        # Immagini AI hanno pattern radiale caratteristico
        center = gray.shape
        radial_intensity = []
        
        for r in range(0, min(center) // 2, 10):
            y, x = np.ogrid[:center[0], :center[1]]
            mask = (x - center[1]//2)**2 + (y - center[0]//2)**2 <= r**2
            radial_intensity.append(np.mean(magnitude_spectrum[mask]))
        
        # Calcola uniformità dello spettro
        if radial_intensity:
            radial_std = np.std(radial_intensity)
            suspicious_spectrum = radial_std < 1e5  # Spectra AI-generated sono meno varie
        else:
            suspicious_spectrum = False
        
        # Controlla per pattern ripetitivo
        autocorr = cv2.matchTemplate(gray, gray[50:100, 50:100], cv2.TM_CCOEFF)
        max_corr = np.max(autocorr)
        suspicious_repetition = max_corr > 0.9 * np.sum(gray**2)
        
        return {
            'frequency_spectrum_uniformity': float(radial_std) if radial_intensity else 0,
            'suspicious_frequency_pattern': suspicious_spectrum,
            'suspicious_repetition': suspicious_repetition,
            'ai_confidence': 0
        }
    
    def calculate_authenticity(self, results):
        """Calcola score di autenticità"""
        score = 100
        
        # Metadati
        if not results['metadata_analysis'].get('has_exif'):
            score -= 5
        
        # Pixel
        if results['pixel_analysis'].get('pixel_distribution_anomaly'):
            score -= 10
        
        # Compressione
        if results['compression_analysis'].get('suspicious_compression'):
            score -= 15
        
        # Texture
        if results['texture_analysis'].get('suspicious_uniform_texture'):
            score -= 15
        
        # Rumore
        if results['noise_analysis'].get('suspicious_noise_pattern'):
            score -= 10
        
        # Edge
        if results['edge_analysis'].get('suspicious_edges'):
            score -= 10
        
        # AI Patterns
        if results['ai_detection'].get('suspicious_frequency_pattern'):
            score -= 20
        if results['ai_detection'].get('suspicious_repetition'):
            score -= 15
        
        return max(0, min(100, score))
    
    def get_verdict(self, score):
        """Determina verdetto"""
        if score >= 75:
            return 'authentic'
        elif score >= 55:
            return 'suspicious'
        else:
            return 'fake'

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Image path required'}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        analyzer = ImageForensicsAnalyzer(image_path)
        results = analyzer.analyze()
        print(json.dumps(results, indent=2))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
