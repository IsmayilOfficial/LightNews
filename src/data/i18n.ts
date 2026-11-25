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
    listenTitle: string;
    listenPlay: string;
    listenPause: string;
    listenResume: string;
    listenStop: string;
    listenSpeed: string;
    listenUnsupported: string;
    listenPlaying: string;
    listenPaused: string;
    saveForLater: string;
    savedLabel: string;
    savedItemsFilter: string;
    allFeedFilter: string;
    noSavedTitle: string;
    noSavedHint: string;
    moreLikeThisTitle: string;
    moreLikeThisLoading: string;
    authorMoreBy: string;
    authorArticlesCount: string;
    authorCurrentlyReading: string;
    authorNoOtherArticles: string;
    authorClosePanel: string;
    commentsTitle: string;
    commentsCount: string;
    commentsNameLabel: string;
    commentsNamePlaceholder: string;
    commentsBodyPlaceholder: string;
    commentsPostAction: string;
    commentsPosting: string;
    commentsReplyAction: string;
    commentsReplyingTo: string;
    commentsReplyPlaceholder: string;
    commentsCancel: string;
    commentsEmpty: string;
    commentsLoading: string;
    commentsErrorEmpty: string;
    commentsErrorName: string;
    commentsErrorServer: string;
    commentsDeleteAction: string;
    commentsYouBadge: string;
    commentsSessionNote: string;
    aiSummarizeButton: string;
    aiSummarizing: string;
    aiSummaryTitle: string;
    aiSummaryHide: string;
    aiSummaryShow: string;
    aiSummaryRetry: string;
    aiSummaryError: string;
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
    listenTitle: 'Audio Article',
    listenPlay: 'Listen',
    listenPause: 'Pause',
    listenResume: 'Resume',
    listenStop: 'Stop',
    listenSpeed: 'Speed',
    listenUnsupported: 'Text-to-speech is not supported in this browser.',
    listenPlaying: 'Playing',
    listenPaused: 'Paused',
    saveForLater: 'Save for later',
    savedLabel: 'Saved',
    savedItemsFilter: 'Saved Items',
    allFeedFilter: 'All',
    noSavedTitle: 'No saved articles yet',
    noSavedHint: 'Click "Save for later" on any article card or reader view to build your reading list.',
    moreLikeThisTitle: 'More Like This',
    moreLikeThisLoading: 'Loading related stories...',
    authorMoreBy: 'Stories by this author',
    authorArticlesCount: 'Published stories',
    authorCurrentlyReading: 'Currently reading',
    authorNoOtherArticles: 'No other published stories from this correspondent yet.',
    authorClosePanel: 'Close author panel',
    commentsTitle: 'Discussion',
    commentsCount: 'comments',
    commentsNameLabel: 'Display name',
    commentsNamePlaceholder: 'Your name (e.g. Leyla M.)',
    commentsBodyPlaceholder: 'Share a thoughtful comment on this story...',
    commentsPostAction: 'Post comment',
    commentsPosting: 'Posting...',
    commentsReplyAction: 'Reply',
    commentsReplyingTo: 'Replying to',
    commentsReplyPlaceholder: 'Write a reply...',
    commentsCancel: 'Cancel',
    commentsEmpty: 'No comments yet. Be the first to join the discussion.',
    commentsLoading: 'Loading discussion...',
    commentsErrorEmpty: 'Please write a comment before posting.',
    commentsErrorName: 'Please enter a display name (at least 2 characters).',
    commentsErrorServer: 'Unable to submit comment right now. Please try again.',
    commentsDeleteAction: 'Delete',
    commentsYouBadge: 'You',
    commentsSessionNote: 'Posted with your active reader session',
    aiSummarizeButton: 'AI Summarize',
    aiSummarizing: 'Summarizing...',
    aiSummaryTitle: '3-Point Brief',
    aiSummaryHide: 'Hide',
    aiSummaryShow: 'Show brief',
    aiSummaryRetry: 'Retry',
    aiSummaryError: 'Unable to generate summary right now. Please try again.',
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
    listenTitle: 'Səsli Məqalə',
    listenPlay: 'Dinlə',
    listenPause: 'Fasilə',
    listenResume: 'Davam et',
    listenStop: 'Dayandır',
    listenSpeed: 'Sürət',
    listenUnsupported: 'Bu brauzerdə səsli oxuma dəstəklənmir.',
    listenPlaying: 'Oxunur',
    listenPaused: 'Fasilədə',
    saveForLater: 'Sonra oxu',
    savedLabel: 'Saxlanıldı',
    savedItemsFilter: 'Saxlanılanlar',
    allFeedFilter: 'Hamısı',
    noSavedTitle: 'Hələ saxlanılan xəbər yoxdur',
    noSavedHint: 'Oxu siyahınızı yaratmaq üçün istənilən məqalədə "Sonra oxu" düyməsini sıxın.',
    moreLikeThisTitle: 'Oxşar Xəbərlər',
    moreLikeThisLoading: 'Oxşar xəbərlər yüklənir...',
    authorMoreBy: 'Müəllifin yazıları',
    authorArticlesCount: 'Dərc olunmuş yazı',
    authorCurrentlyReading: 'Hazırda oxunur',
    authorNoOtherArticles: 'Bu müxbirin hələ başqa dərc olunmuş yazısı yoxdur.',
    authorClosePanel: 'Müəllif panelini bağla',
    commentsTitle: 'Müzakirə',
    commentsCount: 'şərh',
    commentsNameLabel: 'Görünən ad',
    commentsNamePlaceholder: 'Adınız (məs. Leyla M.)',
    commentsBodyPlaceholder: 'Məqalə haqqında fikrinizi bölüşün...',
    commentsPostAction: 'Şərh yaz',
    commentsPosting: 'Göndərilir...',
    commentsReplyAction: 'Cavabla',
    commentsReplyingTo: 'Cavab:',
    commentsReplyPlaceholder: 'Cavabınızı yazın...',
    commentsCancel: 'Ləğv et',
    commentsEmpty: 'Hələ şərh yoxdur. İlk müzakirəni siz başlayın.',
    commentsLoading: 'Şərhlər yüklənir...',
    commentsErrorEmpty: 'Paylaşmazdan əvvəl şərh mətni daxil edin.',
    commentsErrorName: 'Zəhmət olmasa adınızı daxil edin (ən azı 2 simvol).',
    commentsErrorServer: 'Hazırda şərh göndərmək mümkün olmadı. Yenidən cəhd edin.',
    commentsDeleteAction: 'Sil',
    commentsYouBadge: 'Siz',
    commentsSessionNote: 'Aktiv oxucu sessiyası ilə təsdiqlənir',
    aiSummarizeButton: 'AI Xülasə',
    aiSummarizing: 'Hazırlanır...',
    aiSummaryTitle: '3 Bəndlik Qısa Xülasə',
    aiSummaryHide: 'Gizlət',
    aiSummaryShow: 'Xülasəni göstər',
    aiSummaryRetry: 'Yenidən yoxla',
    aiSummaryError: 'Hazırda xülasə hazırlamaq mümkün olmadı. Yenidən cəhd edin.',
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
    listenTitle: 'Аудиоверсия',
    listenPlay: 'Слушать',
    listenPause: 'Пауза',
    listenResume: 'Продолжить',
    listenStop: 'Стоп',
    listenSpeed: 'Скорость',
    listenUnsupported: 'Озвучивание текста не поддерживается в этом браузере.',
    listenPlaying: 'Воспроизведение',
    listenPaused: 'Пауза',
    saveForLater: 'Сохранить',
    savedLabel: 'Сохранено',
    savedItemsFilter: 'Сохранённые',
    allFeedFilter: 'Все',
    noSavedTitle: 'Нет сохранённых статей',
    noSavedHint: 'Нажмите «Сохранить» на карточке или внутри статьи, чтобы добавить её в список чтения.',
    moreLikeThisTitle: 'Похожие материалы',
    moreLikeThisLoading: 'Подбираем похожие новости...',
    authorMoreBy: 'Материалы автора',
    authorArticlesCount: 'Опубликовано статей',
    authorCurrentlyReading: 'Сейчас читаете',
    authorNoOtherArticles: 'Других опубликованных статей этого автора пока нет.',
    authorClosePanel: 'Закрыть панель автора',
    commentsTitle: 'Обсуждение',
    commentsCount: 'комментариев',
    commentsNameLabel: 'Отображаемое имя',
    commentsNamePlaceholder: 'Ваше имя (напр. Лейла М.)',
    commentsBodyPlaceholder: 'Поделитесь вашим мнением об этой статье...',
    commentsPostAction: 'Отправить',
    commentsPosting: 'Отправка...',
    commentsReplyAction: 'Ответить',
    commentsReplyingTo: 'Ответ для',
    commentsReplyPlaceholder: 'Напишите ответ...',
    commentsCancel: 'Отмена',
    commentsEmpty: 'Комментариев пока нет. Начните обсуждение первым.',
    commentsLoading: 'Загрузка комментариев...',
    commentsErrorEmpty: 'Пожалуйста, введите текст комментария.',
    commentsErrorName: 'Укажите имя (минимум 2 символа).',
    commentsErrorServer: 'Не удалось отправить комментарий. Попробуйте еще раз.',
    commentsDeleteAction: 'Удалить',
    commentsYouBadge: 'Вы',
    commentsSessionNote: 'Отправка подтверждается активной сессией читателя',
    aiSummarizeButton: 'AI-кратко',
    aiSummarizing: 'Анализ...',
    aiSummaryTitle: 'Главное в 3 пунктах',
    aiSummaryHide: 'Скрыть',
    aiSummaryShow: 'Показать сводку',
    aiSummaryRetry: 'Повторить',
    aiSummaryError: 'Не удалось создать краткую сводку. Попробуйте ещё раз.',
  },
};
