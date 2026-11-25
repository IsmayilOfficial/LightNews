import { CategorySlug, Language } from '../types/news';

export const CATEGORY_LABELS: Record<CategorySlug, Record<Language, string>> = {
  all: { en: 'All News', az: 'Bütün Xəbərlər', ru: 'Все новости' },
  politics: { en: 'Politics', az: 'Siyasət', ru: 'Политика' },
  economy: { en: 'Economy', az: 'İqtisadiyyat', ru: 'Экономика' },
  society: { en: 'Society', az: 'Cəmiyyət', ru: 'Общество' },
  sports: { en: 'Sports', az: 'İdman', ru: 'Спорт' },
  tech: { en: 'Tech', az: 'Texnologiya', ru: 'Технологии' },
  world: { en: 'World', az: 'Dünya', ru: 'Мир' },
};

export const UI_COPY: Record<
  Language,
  {
    breakingLabel: string;
    trendingLabel: string;
    searchPlaceholder: string;
    searchAction: string;
    architectureAction: string;
    mostReadTitle: string;
    todayTab: string;
    weekTab: string;
    latestFeedTitle: string;
    topStoriesTitle: string;
    viewsLabel: string;
    minRead: string;
    todayPrefix: string;
    yesterdayPrefix: string;
    readMore: string;
    close: string;
    noResults: string;
    noResultsHint: string;
    resetFilters: string;
    authorBy: string;
    tagsLabel: string;
    storageLabel: string;
    footerTagline: string;
    footerPrivacy: string;
    footerArchitecture: string;
    newsletterHeading: string;
    newsletterSubtitle: string;
    newsletterPlaceholder: string;
    newsletterButton: string;
    newsletterSubscribing: string;
    newsletterSuccess: string;
    newsletterAlreadySubscribed: string;
    newsletterErrorEmpty: string;
    newsletterErrorInvalid: string;
    newsletterErrorServer: string;
    newsletterPrivacyNote: string;
    shareLabel: string;
    shareTwitter: string;
    shareLinkedIn: string;
    shareFacebook: string;
    copyLink: string;
    linkCopied: string;
  }
> = {
  en: {
    breakingLabel: 'LIVE',
    trendingLabel: 'Trending',
    searchPlaceholder: 'Search headlines, topics, or keywords...',
    searchAction: 'Search',
    architectureAction: 'Architecture',
    mostReadTitle: 'Most Read News',
    todayTab: 'Today',
    weekTab: 'This Week',
    latestFeedTitle: 'Latest News Feed',
    topStoriesTitle: 'Top Stories',
    viewsLabel: 'views',
    minRead: 'min read',
    todayPrefix: 'Today',
    yesterdayPrefix: 'Yesterday',
    readMore: 'Read full story',
    close: 'Close',
    noResults: 'No matching articles found',
    noResultsHint: 'Try clearing your search query or switching to another category.',
    resetFilters: 'Show all news',
    authorBy: 'Reported by',
    tagsLabel: 'Topics',
    storageLabel: 'Media Asset',
    footerTagline: 'Independent digital journalism with privacy-preserving personalization.',
    footerPrivacy: 'Zero-Trust Privacy Standard',
    footerArchitecture: 'System Blueprint & ERD',
    newsletterHeading: 'Daily Briefing Digest',
    newsletterSubtitle: 'Top stories from Politics, Economy, and Tech delivered every morning at 07:30.',
    newsletterPlaceholder: 'you@example.com',
    newsletterButton: 'Subscribe',
    newsletterSubscribing: 'Subscribing...',
    newsletterSuccess: 'Subscribed. Your first morning digest arrives tomorrow.',
    newsletterAlreadySubscribed: 'This email is already subscribed to the daily digest.',
    newsletterErrorEmpty: 'Please enter your email address.',
    newsletterErrorInvalid: 'Please enter a valid email address (e.g. name@domain.com).',
    newsletterErrorServer: 'Unable to subscribe right now. Please try again.',
    newsletterPrivacyNote: 'Zero spam. Unsubscribe with one click at any time.',
    shareLabel: 'Share',
    shareTwitter: 'Share on X / Twitter',
    shareLinkedIn: 'Share on LinkedIn',
    shareFacebook: 'Share on Facebook',
    copyLink: 'Copy link',
    linkCopied: 'Copied',
  },
  az: {
    breakingLabel: 'CANLI',
    trendingLabel: 'Gündəm',
    searchPlaceholder: 'Başlıq, mövzu və ya açar söz axtarın...',
    searchAction: 'Axtar',
    architectureAction: 'Arxitektura',
    mostReadTitle: 'Ən çox oxunanlar',
    todayTab: 'Bu gün',
    weekTab: 'Bu həftə',
    latestFeedTitle: 'Son Xəbər Lenti',
    topStoriesTitle: 'Əsas Xəbərlər',
    viewsLabel: 'baxış',
    minRead: 'dəq oxu',
    todayPrefix: 'Bu gün',
    yesterdayPrefix: 'Dünən',
    readMore: 'Ətraflı oxu',
    close: 'Bağla',
    noResults: 'Uyğun xəbər tapılmadı',
    noResultsHint: 'Axtarış sorğusunu təmizləyin və ya başqa kateqoriyaya keçin.',
    resetFilters: 'Bütün xəbərləri göstər',
    authorBy: 'Müəllif',
    tagsLabel: 'Mövzular',
    storageLabel: 'Media Resurs',
    footerTagline: 'Məxfiliyi qoruyan fərdiləşdirmə ilə müstəqil rəqəmsal jurnalistika.',
    footerPrivacy: 'Zero-Trust Məxfilik Standartı',
    footerArchitecture: 'Sistem Arxitekturası və ERD',
    newsletterHeading: 'Gündəlik Xəbər Bülleteni',
    newsletterSubtitle: 'Siyasət, İqtisadiyyat və Texnologiya xəbərləri hər səhər saat 07:30-da poçtunuzda.',
    newsletterPlaceholder: 'ad@numune.az',
    newsletterButton: 'Abunə ol',
    newsletterSubscribing: 'Göndərilir...',
    newsletterSuccess: 'Abunəlik təsdiqləndi. İlk bülleten sabah səhər göndəriləcək.',
    newsletterAlreadySubscribed: 'Bu e-poçt artıq gündəlik bülletenə abunədir.',
    newsletterErrorEmpty: 'Zəhmət olmasa e-poçt ünvanınızı daxil edin.',
    newsletterErrorInvalid: 'Düzgün e-poçt ünvanı daxil edin (məs. ad@domen.az).',
    newsletterErrorServer: 'Hazırda abunə olmaq mümkün olmadı. Yenidən cəhd edin.',
    newsletterPrivacyNote: 'Spam yoxdur. İstənilən vaxt bir kliklə çıxış edə bilərsiniz.',
    shareLabel: 'Paylaş',
    shareTwitter: 'X / Twitter-də paylaş',
    shareLinkedIn: 'LinkedIn-də paylaş',
    shareFacebook: 'Facebook-da paylaş',
    copyLink: 'Linki kopyala',
    linkCopied: 'Kopyalandı',
  },
  ru: {
    breakingLabel: 'ЭФИР',
    trendingLabel: 'В тренде',
    searchPlaceholder: 'Поиск по заголовкам, темам и ключевым словам...',
    searchAction: 'Поиск',
    architectureAction: 'Архитектура',
    mostReadTitle: 'Самые читаемые',
    todayTab: 'Сегодня',
    weekTab: 'За неделю',
    latestFeedTitle: 'Лента новостей',
    topStoriesTitle: 'Главные новости',
    viewsLabel: 'просмотров',
    minRead: 'мин чтения',
    todayPrefix: 'Сегодня',
    yesterdayPrefix: 'Вчера',
    readMore: 'Читать полностью',
    close: 'Закрыть',
    noResults: 'Подходящие новости не найдены',
    noResultsHint: 'Попробуйте очистить поисковый запрос или выбрать другую категорию.',
    resetFilters: 'Показать все новости',
    authorBy: 'Автор',
    tagsLabel: 'Темы',
    storageLabel: 'Медиа-актив',
    footerTagline: 'Независимая цифровая журналистика с приватной персонализацией.',
    footerPrivacy: 'Стандарт Zero-Trust',
    footerArchitecture: 'Архитектура и ERD',
    newsletterHeading: 'Ежедневный дайджест',
    newsletterSubtitle: 'Главные новости политики, экономики и технологий каждое утро в 07:30.',
    newsletterPlaceholder: 'name@example.com',
    newsletterButton: 'Подписаться',
    newsletterSubscribing: 'Отправка...',
    newsletterSuccess: 'Подписка оформлена. Первый выпуск придет завтра утром.',
    newsletterAlreadySubscribed: 'Этот адрес уже подписан на ежедневный дайджест.',
    newsletterErrorEmpty: 'Пожалуйста, введите адрес электронной почты.',
    newsletterErrorInvalid: 'Введите корректный адрес электронной почты (например, name@domain.com).',
    newsletterErrorServer: 'Не удалось оформить подписку. Попробуйте еще раз.',
    newsletterPrivacyNote: 'Без спама. Отписка в один клик в любое время.',
    shareLabel: 'Поделиться',
    shareTwitter: 'Поделиться в X / Twitter',
    shareLinkedIn: 'Поделиться в LinkedIn',
    shareFacebook: 'Поделиться в Facebook',
    copyLink: 'Копировать ссылку',
    linkCopied: 'Скопировано',
  },
};
