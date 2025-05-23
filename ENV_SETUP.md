# Çevre Değişkenleri Kurulumu

Bu proje, hassas bilgileri (API anahtarları, Firebase yapılandırması vb.) güvenli bir şekilde yönetmek için çevre değişkenlerini kullanır.

## Kurulum Adımları

1. Projede sağlanan `.env-example` dosyasını kopyalayıp `.env` olarak yeniden adlandırın:

```bash
cp .env-example .env
```

2. `.env` dosyasını açın ve tüm değişkenleri kendi değerlerinizle doldurun:

```
# OpenAI API Değişkenleri
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_URL=https://api.openai.com/v1/chat/completions

# Firebase Yapılandırma Değişkenleri
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here
FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here
```

3. Proje bağımlılıklarını yükleyin (eğer henüz yapmadıysanız):

```bash
npm install
```

4. Uygulamayı başlatın:

```bash
npm run start
```

## Notlar

- `.env` dosyası, Git tarafından izlenmemelidir (`.gitignore` dosyasına eklenmiştir).
- Çevre değişkenlerine uygulamada `import { VAR_NAME } from '@env';` şeklinde erişebilirsiniz.
- Yeni değişkenler eklerseniz, `.env-example` dosyasını da güncellemeyi unutmayın. 