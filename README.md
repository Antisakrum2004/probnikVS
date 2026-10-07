<div align="center">

# 🩺 ProbNIK VS

### Демо видеоконсультаций врач ↔ пациент: 1С:МИС + EmAI + Jitsi

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?style=flat-square&logo=vercel&logoColor=white)](https://probnik-vs.vercel.app/)
[![1C](https://img.shields.io/badge/1С%3AМИС-UI_demo-F5C327?style=flat-square)](https://github.com/Antisakrum2004/probnikVS)

[![Открыть демо](https://img.shields.io/badge/Live-probnik--vs.vercel.app-brightgreen?style=for-the-badge&logo=vercel&logoColor=white)](https://probnik-vs.vercel.app/)

</div>

---

## О проекте

**ProbNIK VS** — клиентское демо интеграции **1С:МИС** с платформой **EmAI** и **Jitsi Meet** для видеоконсультаций.

Цель: показать рабочий прототип — врач создаёт консультацию в интерфейсе «как в 1С», пациент открывает мобильную страницу / APK, оба подключаются к видеокомнате.

---

## Возможности

- 🖥️ **АРМ врача** — создание консультации в pixel-perfect стиле 1С
- 📱 **Страница пациента** — мобильный UX без лишнего ввода
- 🎥 **Видеокомната** — Jitsi через EmAI Gateway
- 🔌 **API routes** — create / complete / cancel / status / logs / JWT
- 📦 **Расширение 1С** — модули `.bsl` для production-контура
- 🐳 **Docker** — конфиги Jitsi / nginx для полного стенда
- 📲 **APK** — Capacitor-обёртка пациентского сценария (если опубликована в демо)

---

## Архитектура

```
Production (по ТЗ):
1С МИС → PHP Middleware → EmAI Gateway → Jitsi Meet

Демо (Vercel):
Next.js → API routes → EmAI → Jitsi Meet
```

---

## Стек

| Слой | Технологии |
|------|------------|
| Web demo | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Deploy | Vercel |
| Video | Jitsi Meet, EmAI |
| 1С | Расширение `.bsl` (формы записи / консультации / отмены) |
| Middleware | PHP (для полного контура) |

---

## Ссылки

| | URL |
|---|-----|
| 🌐 Демо | https://probnik-vs.vercel.app/ |
| 📦 GitHub | https://github.com/Antisakrum2004/probnikVS |
| 📓 Журнал разработки | [`PROGRESS.md`](./PROGRESS.md) |

---

## Быстрый старт

```bash
git clone https://github.com/Antisakrum2004/probnikVS.git
cd probnikVS
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Переменные окружения для EmAI / JWT задайте локально (`.env` / Vercel env) — **не коммитьте секреты**.

---

## Структура (ключевое)

```
probnikVS/
├── src/app/                 # Next.js App Router (врач, пациент, video, API)
├── src/1c-extension/        # Модули расширения 1С
├── src/php-middleware/      # PHP middleware
├── src/docker/              # Jitsi + nginx
├── docs/ · architecture/ · demo/
├── PROGRESS.md              # Хронология разработки
└── vercel.json
```

---

<div align="center">

**Видеоконсультации без трения** · [Antisakrum2004](https://github.com/Antisakrum2004)

⭐ Если демо полезно — поставьте звезду

</div>
