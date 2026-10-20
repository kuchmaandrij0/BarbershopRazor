"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, MotionConfig } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Scissors,
  Menu,
  X,
  Check,
  Plus,
  Minus,
  MapPin,
  Clock,
} from "lucide-react";

const services = [
  {
    name: "Мужская стрижка",
    price: 650,
    duration: 60,
    desc: "Форма, которая подходит именно тебе. Мытьё, стрижка и укладка.",
  },
  {
    name: "Оформление бороды",
    price: 400,
    duration: 45,
    desc: "Чёткий контур, правильная длина и уход за бородой.",
  },
  {
    name: "Стрижка машинкой",
    price: 350,
    duration: 30,
    desc: "Минимум длины. Максимум точности. Одна или несколько насадок.",
  },
  {
    name: "Стрижка + борода",
    price: 950,
    duration: 90,
    desc: "Полный образ: от текстуры волос до последней линии бороды.",
  },
];
const masters = [
  {
    name: "Александр",
    role: "Классика и современные формы",
    image: "hero.jpg",
    position: "55% 35%",
  },
  {
    name: "Марк",
    role: "Фейды и оформление бороды",
    image: "gallery-2.jpg",
    position: "50% 20%",
  },
  {
    name: "Даниил",
    role: "Текстурные стрижки и укладки",
    image: "master.jpg",
    position: "50% 10%",
  },
];
const nav = [
  ["Услуги", "services"],
  ["Мастера", "masters"],
  ["Галерея", "gallery"],
  ["О нас", "about"],
  ["Контакты", "contacts"],
];
type Booking = {
  id: string;
  service: number;
  master: number;
  date: string;
  time: string;
  name: string;
  phone: string;
};
const storageKey = "black-razor-bookings-v1";
function dayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
function readBookings(): Booking[] {
  const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (!Array.isArray(value)) throw Error();
  return value.filter(
    (b) =>
      b &&
      typeof b.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(b.date) &&
      typeof b.time === "string" &&
      /^\d{2}:\d{2}$/.test(b.time) &&
      Number.isInteger(b.service) &&
      services[b.service] &&
      Number.isInteger(b.master) &&
      masters[b.master],
  );
}
function minutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function freeSlot(
  date: string,
  time: string,
  master: number,
  service: number,
  bookings: Booking[],
) {
  const start = minutes(time),
    end = start + services[service].duration;
  return (
    date > dayKey(new Date()) &&
    end <= 20 * 60 &&
    !bookings.some(
      (b) =>
        b.date === date &&
        b.master === master &&
        start < minutes(b.time) + services[b.service].duration &&
        end > minutes(b.time),
    )
  );
}
function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
export default function Home() {
  const [menu, setMenu] = useState(false),
    [service, setService] = useState(0),
    [master, setMaster] = useState(0),
    [date, setDate] = useState(""),
    [time, setTime] = useState(""),
    [bookings, setBookings] = useState<Booking[]>([]),
    [confirmation, setConfirmation] = useState<Booking | null>(null),
    [error, setError] = useState(""),
    [openFaq, setOpenFaq] = useState<number | null>(null);
  const [minDate, setMinDate] = useState(""),
    [maxDate, setMaxDate] = useState("");
  const confirmationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const max = new Date();
    max.setDate(max.getDate() + 60);
    setMinDate(dayKey(tomorrow));
    setMaxDate(dayKey(max));
    try {
      setBookings(readBookings());
    } catch {
      setError(
        "Хранилище браузера недоступно. Разрешите сохранение данных, чтобы попробовать запись.",
      );
    }
    const update = () => {
      try {
        setBookings(readBookings());
      } catch {}
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);
  useEffect(() => {
    if (confirmation) confirmationRef.current?.focus();
  }, [confirmation]);
  function chooseService(i: number) {
    setService(i);
    setTime("");
    setConfirmation(null);
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim(),
      phone = String(data.get("phone") || "").trim();
    if (name.length < 2) {
      setError("Введите имя: минимум два символа.");
      return;
    }
    if (
      !/^\+?[\d\s()\-]+$/.test(phone) ||
      phone.replace(/\D/g, "").length < 10 ||
      phone.replace(/\D/g, "").length > 15
    ) {
      setError(
        "Введите телефон: от 10 до 15 цифр, например +380 67 123 45 67.",
      );
      return;
    }
    if (!date || date < minDate || date > maxDate || !time) {
      setError("Выберите будущую дату и свободное время.");
      return;
    }
    try {
      const latest = readBookings();
      if (!freeSlot(date, time, master, service, latest)) {
        setBookings(latest);
        setTime("");
        setError("Это время уже занято в этом браузере. Выберите другой слот.");
        return;
      }
      const booking = {
        id: crypto.randomUUID(),
        service,
        master,
        date,
        time,
        name,
        phone,
      };
      localStorage.setItem(storageKey, JSON.stringify([...latest, booking]));
      setBookings([...latest, booking]);
      setConfirmation(booking);
      setTime("");
    } catch {
      setError(
        "Не удалось сохранить запись. Проверьте, разрешено ли хранение данных в браузере, и повторите.",
      );
    }
  }
  const slots = Array.from(
    { length: 20 },
    (_, i) =>
      `${String(10 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
  ).filter((t) => minutes(t) + services[service].duration <= 1200);
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#main">
        Перейти к содержимому
      </a>
      <header className="header">
        <a href="#" className="logo" aria-label="BLACK RAZOR — на главную">
          <Scissors size={26} />
          <span>
            BLACK RAZOR<small>БАРБЕРШОП · КОНЦЕПТ</small>
          </span>
        </a>
        <nav aria-label="Основная навигация" className="desktop-nav">
          {nav.map(([label, id]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <a className="button header-book" href="#booking">
          Записаться <ArrowUpRight size={16} />
        </a>
        <button
          className="menu-toggle"
          aria-label={menu ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menu}
          aria-controls="mobile-nav"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        {menu && (
          <nav id="mobile-nav" aria-label="Мобильная навигация">
            {[...nav, ["Записаться", "booking"]].map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
                {label}
                <ArrowUpRight size={18} />
              </a>
            ))}
          </nav>
        )}
      </header>
      <main id="main">
        <section className="hero">
          <Image
            src="/images/hero.jpg"
            alt="Точная мужская стрижка в тёплом свете барбершопа"
            fill
            priority
            sizes="100vw"
            quality={85}
            className="hero-image"
          />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow">
              <span /> ИСКУССТВО БЫТЬ СОБОЙ
            </p>
            <h1>
              Твой стиль.
              <br />
              Наш <em>характер.</em>
            </h1>
            <p className="hero-description">
              Хорошая стрижка говорит за тебя.
              <br />
              Мы помогаем ей звучать уверенно.
            </p>
            <a href="#booking" className="button copper">
              Выбрать своё время <ArrowUpRight size={19} />
            </a>
            <div className="hero-note">
              <span className="small-line" /> Чёткие линии. Никаких
              компромиссов.
            </div>
          </div>
          <div className="hero-bottom">
            <span>МУЖСКАЯ ТЕРРИТОРИЯ</span>
            <a href="#services">
              Листай дальше <ArrowDown size={15} />
            </a>
            <span>СТИЛЬ В ДЕТАЛЯХ</span>
          </div>
          <span className="hero-side">СТРИЖКИ / БОРОДА / ХАРАКТЕР</span>
        </section>
        <div className="ticker" aria-hidden="true">
          <span>ТОЧНОСТЬ В КАЖДОМ ДВИЖЕНИИ</span>
          <Scissors />
          <span>СТИЛЬ БЕЗ ЛИШНИХ СЛОВ</span>
          <Scissors />
          <span>BLACK RAZOR</span>
          <Scissors />
        </div>
        <section id="services" className="section services">
          <Reveal className="section-head">
            <div>
              <p className="eyebrow">01 / УСЛУГИ И ЦЕНЫ</p>
              <h2>
                Хорошая форма.
                <br />
                <span className="muted">Честная цена.</span>
              </h2>
            </div>
            <p className="section-intro">
              Только то, что нужно твоему образу.
              <br />
              Консультация и укладка — часть процесса.
            </p>
          </Reveal>
          <div className="service-list">
            {services.map((s, i) => (
              <Reveal key={s.name}>
                <a
                  href="#booking"
                  className="service-row"
                  onClick={() => chooseService(i)}
                >
                  <span className="service-number">0{i + 1}</span>
                  <div className="service-info">
                    <h3>
                      {s.name}
                      {i === 3 && <span className="tag">ПОЛНЫЙ ОБРАЗ</span>}
                    </h3>
                    <p>{s.desc}</p>
                  </div>
                  <span className="duration">{s.duration} мин</span>
                  <span className="price">
                    {s.price} <small>₴</small>
                  </span>
                  <span className="round-arrow">
                    <ArrowUpRight size={23} />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
          <p className="fine service-foot">
            Цены и услуги представлены для демонстрации концепта.
          </p>
        </section>
        <section id="masters" className="section masters">
          <Reveal className="section-head">
            <div>
              <p className="eyebrow">02 / ЛЮДИ С ХАРАКТЕРОМ</p>
              <h2>
                Руки, которым
                <br />
                можно доверять.
              </h2>
            </div>
            <p className="section-intro">
              У каждого свой почерк.
              <br />У всех — внимание к твоим деталям.
            </p>
          </Reveal>
          <div className="master-grid">
            {masters.map((m, i) => (
              <Reveal key={m.name}>
                <a
                  href="#booking"
                  className="master-card"
                  onClick={() => {
                    setMaster(i);
                    setTime("");
                    setConfirmation(null);
                  }}
                >
                  <div className="master-photo">
                    <Image
                      src={`/images/${m.image}`}
                      alt={`Атмосферное фото для карточки мастера ${m.name}`}
                      fill
                      sizes="(max-width: 640px) 90vw, 33vw"
                      style={{ objectPosition: m.position }}
                    />
                    <span className="photo-label">БАРБЕР / 0{i + 1}</span>
                    <span className="photo-action">
                      <ArrowUpRight />
                    </span>
                  </div>
                  <div className="master-caption">
                    <h3>{m.name}</h3>
                    <p>{m.role}</p>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
          <p className="fine">
            Мастера — вымышленные персонажи концепта. Фотографии используются
            как иллюстрации.
          </p>
        </section>
        <section id="gallery" className="section gallery">
          <Reveal className="section-head">
            <div>
              <p className="eyebrow">03 / В ФОКУСЕ</p>
              <h2>Детали решают.</h2>
            </div>
            <p className="section-intro">
              Текстура. Геометрия. Баланс.
              <br />
              Вдохновение для твоего следующего образа.
            </p>
          </Reveal>
          <div className="gallery-grid">
            {[
              "gallery-3.jpg",
              "gallery-1.jpg",
              "gallery-4.jpg",
              "gallery-2.jpg",
            ].map((src, i) => (
              <Reveal key={src} className={`gallery-item gallery-${i}`}>
                <Image
                  src={`/images/${src}`}
                  alt={
                    [
                      "Плавный переход длины и текстурная укладка",
                      "Аккуратный контур висков и бороды",
                      "Детали мужской стрижки",
                      "Ритуал оформления бороды",
                    ][i]
                  }
                  fill
                  sizes="(max-width: 640px) 48vw, 25vw"
                />
                <span>
                  0{i + 1} / {["ФОРМА", "КОНТУР", "ТЕКСТУРА", "ДЕТАЛИ"][i]}
                </span>
              </Reveal>
            ))}
          </div>
          <p className="fine">
            Подборка фотографий для визуальной демонстрации. Не реальные работы
            BLACK RAZOR.
          </p>
        </section>
        <section id="about" className="about">
          <div className="about-photo">
            <Image
              src="/images/hero.jpg"
              alt="Работа барбера: внимание к форме и каждой детали"
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
            />
            <span className="image-stamp">
              BR
              <span>
                ЭСТЕТИКА
                <br />
                РЕМЕСЛА
              </span>
            </span>
          </div>
          <Reveal className="about-content">
            <p className="eyebrow">04 / ФИЛОСОФИЯ BLACK RAZOR</p>
            <h2>
              Больше, чем
              <br />
              <em>просто стрижка.</em>
            </h2>
            <p>
              Место, где можно замедлиться. Оставить городской шум за дверью,
              выпить кофе и уделить время себе.
            </p>
            <p>
              Мы начинаем с разговора: о твоём стиле, привычках и том, как
              волосы должны лежать каждый день. Затем — точные движения и
              внимание к мелочам.
            </p>
            <div className="about-values">
              <span>
                <Scissors size={20} /> Осмысленная форма
              </span>
              <span>
                <Check size={20} /> Внимание к деталям
              </span>
            </div>
            <a href="#booking" className="text-link">
              Найти свой стиль <ArrowUpRight size={20} />
            </a>
          </Reveal>
        </section>
        <section id="booking" className="section booking">
          <Reveal className="booking-intro">
            <p className="eyebrow">05 / ТВОЁ ВРЕМЯ</p>
            <h2>
              Следующий шаг —<br />
              <em>за тобой.</em>
            </h2>
            <p>
              Выбери услугу, мастера и удобное время.
              <br />
              Остальное — дело техники.
            </p>
            <div className="demo-note">
              <span className="status-dot" />
              Демонстрационная запись
              <p>
                Попробуй, как это работает. Запись хранится только в этом
                браузере и не отправляется в барбершоп. Для проверки можно
                использовать вымышленные данные.
              </p>
            </div>
          </Reveal>
          <div className="booking-panel">
            {confirmation ? (
              <div
                className="confirmation"
                ref={confirmationRef}
                tabIndex={-1}
                role="status"
              >
                <span className="success-icon">
                  <Check size={28} />
                </span>
                <p className="eyebrow">ГОТОВО</p>
                <h3>Твой образ начинается здесь.</h3>
                <p className="success-message">
                  Демонстрационная запись сохранена. Данные в барбершоп не
                  отправлены
                </p>
                <dl>
                  <div>
                    <dt>Услуга</dt>
                    <dd>{services[confirmation.service].name}</dd>
                  </div>
                  <div>
                    <dt>Мастер</dt>
                    <dd>{masters[confirmation.master].name}</dd>
                  </div>
                  <div>
                    <dt>Дата и время</dt>
                    <dd>
                      {new Date(
                        confirmation.date + "T12:00:00",
                      ).toLocaleDateString("ru-RU")}{" "}
                      · {confirmation.time}
                    </dd>
                  </div>
                  <div>
                    <dt>Стоимость</dt>
                    <dd>
                      {services[confirmation.service].price} ₴ ·{" "}
                      {services[confirmation.service].duration} мин
                    </dd>
                  </div>
                  <div>
                    <dt>Имя</dt>
                    <dd>{confirmation.name}</dd>
                  </div>
                  <div>
                    <dt>Телефон</dt>
                    <dd>{confirmation.phone}</dd>
                  </div>
                </dl>
                <button
                  className="button copper"
                  onClick={() => setConfirmation(null)}
                >
                  Попробовать ещё раз <ArrowUpRight size={18} />
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="form-step">
                  <span>01</span>
                  <h3>Выбери свой образ</h3>
                </div>
                <div className="form-grid">
                  <label>
                    Услуга
                    <select
                      aria-label="Услуга"
                      value={service}
                      onChange={(e) => chooseService(+e.target.value)}
                    >
                      {services.map((s, i) => (
                        <option value={i} key={s.name}>
                          {s.name} — {s.price} ₴
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Мастер
                    <select
                      aria-label="Мастер"
                      value={master}
                      onChange={(e) => {
                        setMaster(+e.target.value);
                        setTime("");
                      }}
                    >
                      {masters.map((m, i) => (
                        <option value={i} key={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="full">
                    Дата
                    <input
                      aria-label="Дата"
                      type="date"
                      required
                      min={minDate}
                      max={maxDate}
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setTime("");
                      }}
                      aria-describedby="date-hint"
                    />
                    <span id="date-hint" className="fine">
                      Начиная с завтрашнего дня, на 60 дней вперёд.
                    </span>
                  </label>
                </div>
                <fieldset className="time-field">
                  <legend>
                    Свободное время <span>· по времени Киева</span>
                  </legend>
                  {!date ? (
                    <p className="time-placeholder">Сначала выбери дату</p>
                  ) : (
                    <div className="slots">
                      {slots.map((t) => {
                        const free = freeSlot(
                          date,
                          t,
                          master,
                          service,
                          bookings,
                        );
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={!free}
                            aria-pressed={time === t}
                            className={time === t ? "selected" : ""}
                            onClick={() => setTime(t)}
                            aria-label={`${t}${free ? "" : " — занято"}`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
                <div className="form-step second">
                  <span>02</span>
                  <h3>Как к тебе обращаться?</h3>
                </div>
                <div className="form-grid">
                  <label>
                    Твоё имя
                    <input
                      name="name"
                      placeholder="Алексей"
                      required
                      minLength={2}
                      maxLength={60}
                      autoComplete="given-name"
                    />
                  </label>
                  <label>
                    Телефон
                    <input
                      aria-label="Телефон"
                      name="phone"
                      type="tel"
                      placeholder="+380 67 123 45 67"
                      required
                      maxLength={25}
                      autoComplete="tel"
                      aria-describedby="phone-hint"
                    />
                    <span id="phone-hint" className="sr-only">
                      От 10 до 15 цифр
                    </span>
                  </label>
                </div>
                <div className="booking-total">
                  <span>{services[service].duration} минут для себя</span>
                  <strong>{services[service].price} ₴</strong>
                </div>
                {error && (
                  <p role="alert" className="error">
                    {error}
                  </p>
                )}
                <button className="button copper submit" type="submit">
                  Сохранить демо-запись <ArrowUpRight size={20} />
                </button>
                <p className="fine form-note">
                  Нажимая кнопку, ты сохраняешь введённые данные в этом
                  браузере. Никаких SMS и реального бронирования.
                </p>
              </form>
            )}
          </div>
        </section>
        <section className="section faq">
          <Reveal>
            <p className="eyebrow">ПАРА ДЕТАЛЕЙ</p>
            <h2>До встречи в кресле.</h2>
          </Reveal>
          <div>
            {[
              [
                "Нужно ли готовиться к стрижке?",
                "Достаточно прийти с идеей или референсом. Можно и без них: в концепции BLACK RAZOR любая стрижка начинается с консультации.",
              ],
              [
                "Как работает запись на этом сайте?",
                "Это демонстрация для портфолио. Записи сохраняются только в браузере на этом устройстве. Выбранное время становится недоступно для того же мастера в пределах этого браузера. Реального бронирования нет.",
              ],
              [
                "Как удалить демонстрационные данные?",
                "Открой настройки браузера → данные сайтов и удали данные этого сайта. Сохранённые записи исчезнут, а время снова станет доступным.",
              ],
            ].map(([q, a], i) => (
              <div className="faq-row" key={q}>
                <h3>
                  <button
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {q}
                    {openFaq === i ? <Minus size={19} /> : <Plus size={19} />}
                  </button>
                </h3>
                {openFaq === i && <p id={`faq-${i}`}>{a}</p>}
              </div>
            ))}
          </div>
        </section>
        <section id="contacts" className="section contacts">
          <div>
            <p className="eyebrow">06 / МЕСТО ВСТРЕЧИ</p>
            <h2>
              Увидимся
              <br />
              <em>в BLACK RAZOR.</em>
            </h2>
            <p className="contact-notice">
              Демонстрационные контакты.
              <br />
              По этому адресу нет реального барбершопа.
            </p>
          </div>
          <div className="contact-details">
            <div>
              <MapPin size={21} />
              <div>
                <span className="eyebrow">АДРЕС КОНЦЕПТА</span>
                <p>Киев, ул. Примерная, 12</p>
                <span className="fine">Вымышленный адрес для портфолио</span>
              </div>
            </div>
            <div>
              <Clock size={21} />
              <div>
                <span className="eyebrow">ЧАСЫ РАБОТЫ В КОНЦЕПТЕ</span>
                <p>Ежедневно · 10:00 — 20:00</p>
              </div>
            </div>
            <div className="contact-email">
              <span className="eyebrow">ДЕМОНСТРАЦИОННАЯ ПОЧТА</span>
              <p>hello@blackrazor.example</p>
              <span className="fine">Адрес не принимает письма</span>
            </div>
            <a href="#booking" className="text-link">
              Попробовать онлайн-запись <ArrowUpRight size={20} />
            </a>
          </div>
        </section>
      </main>
      <footer>
        <a href="#" className="footer-logo">
          BLACK RAZOR<span>✳</span>
        </a>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} BLACK RAZOR. Концепт для портфолио.
          </p>
          <p>Вымышленный бренд. Никаких реальных бронирований.</p>
          <a href="#">
            Наверх <ArrowUpRight size={16} />
          </a>
        </div>
      </footer>
    </MotionConfig>
  );
}
