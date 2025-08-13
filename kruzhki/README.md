# Кружочки (TWA MVP)

Next.js 14 (App Router) + TypeScript + Tailwind + Prisma(PostgreSQL/Neon) + S3/R2 + Telegram Web Apps SDK.

## Запуск

1. Установите переменные окружения в `.env.local`:

```
DATABASE_URL=postgresql://user:pass@host:port/db
STORAGE_ENDPOINT=https://<r2-or-s3-endpoint>
STORAGE_BUCKET=your-bucket
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
STORAGE_PUBLIC_BASE_URL=https://cdn.example.com/
JWT_SECRET=supersecret
TELEGRAM_BOT_TOKEN=123456:ABC
TELEGRAM_BOT_USERNAME=your_bot
```

2. Установите зависимости и инициализируйте Prisma:

```
npm i
npx prisma migrate dev -n init
```

3. Запустите dev-сервер:

```
npm run dev
```

## Стек и структура

- App Router, страницы: `app/(tabs)/feed`, `app/(tabs)/record`, `app/(tabs)/me`
- API: `/api/auth/telegram`, `/api/upload/init`, `/api/circle`, `/api/orbit`, `/api/react`, `/api/feed`, `/api/report`, `/api/follow`, `/api/metrics`
- Компоненты: `components/CircleRecorder`, `CircleCard`, `CirclePlayer`, `OrbitThread`, `RingProgress`
- Библиотека: `lib/{auth,telegram,prisma,s3,types,geo}`

## Фичи

- Авторизация через Telegram Web Apps (JWT cookie, 24ч)
- Запись видео 8–20с с круглой маской, клиентский постер
- Загрузка напрямую в S3/R2 (presigned PUT)
- Создание кружка и ответы-орбиты
- Лента: global/friends/nearby (nearby=global v0), эфемерность 24ч
- Реакции-«искра», отчёты и тень (shadow)
- Метрики /api/metrics

## Оговорки

- Нет серверного транскода, играем оригинал
- Ограничение размера видео до 30MB — проверка по `HeadObject` при создании
- CORS закрыт (same-origin), CSP включён

## Демо-сидер

Скрипт `prisma/seed.ts` создаёт 30 публичных кружков с фейковыми данными. Запуск:

```
npm run seed
```

Перед сидированием убедитесь, что база и переменные окружения настроены.
