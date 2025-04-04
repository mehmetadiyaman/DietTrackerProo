
# DietTrackerPro

## 📋 Genel Bakış

DietTrackerPro, diyetisyenlerin danışanlarını etkin bir şekilde yönetmesine, beslenme planları oluşturmasına ve takip etmesine olanak tanıyan kapsamlı bir diyet takip ve yönetim sistemidir. Modern, kullanıcı dostu arayüzü ile diyetisyenlerin iş akışını optimize ederek danışan yönetimini kolaylaştırır.

![DietTrackerPro Dashboard](https://via.placeholder.com/800x400?text=DietTrackerPro+Dashboard)

## ✨ Özellikler

### 👥 Danışan Yönetimi
- Kapsamlı danışan profilleri oluşturma ve yönetme
- Danışan bilgilerini ve iletişim detaylarını saklama
- Aktif/pasif danışan durumu takibi
- Danışan profil resimleri yönetimi

### 📏 Ölçüm Takibi
- Çoklu ölçüm parametreleri (kilo, bel, kalça, göğüs, kol, bacak vb.)
- Zaman içindeki değişimleri gösteren grafikler
- Vücut kitle indeksi (BMI) hesaplamaları
- Ölçüm sonuçlarını görselleştirme

### 🥗 Diyet Planları
- Kişiselleştirilmiş beslenme programları oluşturma
- Kalori ve makro besin hedefleri belirleme
- Detaylı öğün planlaması ve besin öğeleri takibi
- Plan dökümanlarını ekleme ve yönetme

### 📅 Randevu Yönetimi
- Danışan randevularını planlama ve takip etme
- Çevrimiçi ve yüz yüze randevu seçenekleri
- Randevu bildirimleri ve hatırlatmaları
- Takvim entegrasyonu

### 📊 Dashboard ve Raporlama
- Güncel aktivite özeti
- Danışan ilerleme raporları
- Performans metrikleri
- Aktivite günlüğü

## 🚀 Kullanılan Teknolojiler

### Frontend
- React
- TypeScript
- TanStack Query (React Query)
- Zod form validasyonu
- React Hook Form
- Shadcn UI bileşenleri
- Lucide Icons
- React Hot Toast bildirimleri

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Token (JWT) kimlik doğrulama
- Multer dosya yükleme
- bcrypt şifreleme

## 💻 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- MongoDB
- npm veya yarn

### Adımlar

1. Projeyi klonlayın:
```bash
git clone https://github.com/kullanici/DietTrackerPro.git
cd DietTrackerPro
```

2. Gerekli paketleri yükleyin:
```bash
# Ana dizinde
npm install

# Client dizininde
cd client
npm install
```

3. Çevre değişkenlerini ayarlayın:
```bash
# Ana dizinde .env dosyası oluşturun
cp .env.example .env
```

4. .env dosyasını düzenleyin:
```
MONGODB_URI=mongodb://localhost:27017/diettracerpro
JWT_SECRET=sizin_gizli_anahtariniz
PORT=5000
```

5. Uygulamayı başlatın:
```bash
# Geliştirme modunda
npm run dev

# Sadece backend
npm run server

# Sadece frontend
npm run client
```

## 🔍 Kullanım

1. Tarayıcınızda `http://localhost:5000` adresine gidin
2. Kayıt olun veya demo hesabıyla giriş yapın:
   - E-posta: demo@ornek.com
   - Şifre: demo123

3. Dashboard üzerinden tüm özelliklere erişin:
   - Danışan eklemek için "Danışanlar" bölümüne gidin
   - Yeni bir ölçüm kaydetmek için "Ölçümler" bölümüne gidin
   - Diyet planı oluşturmak için "Diyet Planları" bölümüne gidin
   - Randevu planlamak için "Randevular" bölümüne gidin

## 📡 API Uç Noktaları

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Mevcut kullanıcı bilgileri
- `PUT /api/auth/profile` - Kullanıcı profili güncelleme
- `PUT /api/auth/password` - Şifre değiştirme

### Danışanlar
- `GET /api/clients` - Tüm danışanları listele
- `POST /api/clients` - Yeni danışan ekle
- `GET /api/clients/:id` - Danışan detayları
- `PUT /api/clients/:id` - Danışan bilgilerini güncelle
- `DELETE /api/clients/:id` - Danışan sil

### Ölçümler
- `GET /api/clients/:clientId/measurements` - Danışan ölçümlerini listele
- `POST /api/measurements` - Yeni ölçüm ekle
- `PUT /api/measurements/:id` - Ölçüm güncelle
- `DELETE /api/measurements/:id` - Ölçüm sil

### Diyet Planları
- `GET /api/clients/:clientId/diet-plans` - Danışan diyet planlarını listele
- `POST /api/diet-plans` - Yeni diyet planı oluştur
- `PUT /api/diet-plans/:id` - Diyet planı güncelle
- `DELETE /api/diet-plans/:id` - Diyet planı sil

### Randevular
- `GET /api/appointments` - Tüm randevuları listele
- `POST /api/appointments` - Yeni randevu oluştur
- `PUT /api/appointments/:id` - Randevu güncelle
- `DELETE /api/appointments/:id` - Randevu iptal et

## 📱 Mobil Uyumluluk

DietTrackerPro, responsive tasarımı sayesinde tüm cihazlarda (masaüstü, tablet, mobil) sorunsuz çalışır. Diyetisyenler hareket halindeyken bile uygulamaya erişebilir ve danışanlarını yönetebilir.

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Şifreler bcrypt ile güvenli bir şekilde hashlenir
- HTTPS desteği
- Kullanıcı rolü tabanlı yetkilendirme
- XSS ve CSRF koruması

## 🛠️ Geliştirme

### Proje Yapısı
```
DietTrackerPro/
├── client/               # React frontend
│   ├── public/           # Statik dosyalar
│   └── src/              # Kaynak kodları
│       ├── components/   # Yeniden kullanılabilir bileşenler
│       ├── pages/        # Sayfa bileşenleri
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Yardımcı fonksiyonlar ve yapılandırmalar
│       └── styles/       # CSS ve stil dosyaları
├── server/               # Node.js backend
│   ├── config/           # Yapılandırma dosyaları
│   ├── controllers/      # Route kontrolcüleri
│   ├── models/           # Mongoose modelleri
│   ├── routes/           # API rotaları
│   └── services/         # İş mantığı servisleri
└── shared/               # Frontend ve backend arasında paylaşılan kod
    └── schema.ts         # Zod şemaları
```

### Katkıda Bulunma
1. Bu repo'yu fork edin
2. Yeni bir özellik dalı oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: XYZ'`)
4. Dalınıza push yapın (`git push origin yeni-ozellik`)
5. Bir Pull Request oluşturun

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 📞 İletişim

Sorularınız veya önerileriniz için:
- E-posta: iletisim@diettracerpro.com
- Web: [www.diettracerpro.com](https://www.diettracerpro.com)

---

## 📸 Ekran Görüntüleri

<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
  <img src="https://via.placeholder.com/400x250?text=Dashboard" alt="Dashboard" width="400"/>
  <img src="https://via.placeholder.com/400x250?text=Client+Management" alt="Danışan Yönetimi" width="400"/>
  <img src="https://via.placeholder.com/400x250?text=Measurements" alt="Ölçümler" width="400"/>
  <img src="https://via.placeholder.com/400x250?text=Diet+Plans" alt="Diyet Planları" width="400"/>
</div>

---

⭐ DietTrackerPro ile danışanlarınızın beslenme yolculuğunu daha etkili yönetin! ⭐
