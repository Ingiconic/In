// Persian to Finglish (Phonetic English) converter
// Converts Persian text to phonetic English for better TTS pronunciation

const persianToFinglishMap: Record<string, string> = {
  // Common words and phrases
  'سلام': 'salam',
  'علیک': 'aleyk',
  'خداحافظ': 'khodahafez',
  'خدافظ': 'khodafez',
  'چطوری': 'chetori',
  'چطور': 'chetor',
  'خوبم': 'khoobam',
  'خوبی': 'khoobi',
  'خوب': 'khoob',
  'بدم': 'badam',
  'بد': 'bad',
  'مرسی': 'mersi',
  'ممنون': 'mamnoon',
  'ممنونم': 'mamnoonam',
  'متشکرم': 'moteshakeram',
  'خواهش': 'khahesh',
  'میکنم': 'mikonam',
  'لطفا': 'lotfan',
  'لطفاً': 'lotfan',
  'ببخشید': 'bebakhshid',
  'شرمنده': 'sharmande',
  'بله': 'bale',
  'آره': 'are',
  'نه': 'na',
  'خیر': 'kheyr',
  'باشه': 'bashe',
  'باشد': 'bashad',
  'چشم': 'cheshm',
  'حتما': 'hatman',
  'حتماً': 'hatman',
  'البته': 'albate',
  'شاید': 'shayad',
  'احتمالا': 'ehtemalan',
  'احتمالاً': 'ehtemalan',
  'مطمئنا': 'motma-enan',
  'مطمئناً': 'motma-enan',
  
  // Question words
  'چی': 'chi',
  'چه': 'che',
  'کی': 'key',
  'کجا': 'koja',
  'کجای': 'kojaye',
  'چرا': 'chera',
  'چگونه': 'chegone',
  'کدام': 'kodam',
  'چند': 'chand',
  'چقدر': 'cheghadr',
  
  // Time
  'الان': 'alan',
  'حالا': 'hala',
  'امروز': 'emrooz',
  'دیروز': 'dirooz',
  'فردا': 'farda',
  'پریروز': 'parirooz',
  'پس‌فردا': 'pasfarda',
  'امشب': 'emshab',
  'دیشب': 'dishab',
  'صبح': 'sobh',
  'ظهر': 'zohr',
  'عصر': 'asr',
  'شب': 'shab',
  'نیمه‌شب': 'nimeshab',
  
  // Pronouns
  'من': 'man',
  'تو': 'to',
  'او': 'oo',
  'ما': 'ma',
  'شما': 'shoma',
  'آنها': 'anha',
  'اون': 'oon',
  'اونها': 'oonha',
  'این': 'in',
  'آن': 'an',
  'اینها': 'inha',
  
  // Verbs (common forms)
  'هستم': 'hastam',
  'هستی': 'hasti',
  'هست': 'hast',
  'هستیم': 'hastim',
  'هستید': 'hastid',
  'هستند': 'hastand',
  'بودم': 'boodam',
  'بودی': 'boodi',
  'بود': 'bood',
  'بودیم': 'boodim',
  'بودید': 'boodid',
  'بودند': 'boodand',
  'میشود': 'mishavad',
  'میشه': 'mishe',
  'می‌شود': 'mishavad',
  'می‌شه': 'mishe',
  'میخواهم': 'mikhaham',
  'میخوام': 'mikham',
  'می‌خواهم': 'mikhaham',
  'می‌خوام': 'mikham',
  'میخواهی': 'mikhahi',
  'میخوای': 'mikhay',
  'میخواهد': 'mikhahad',
  'میخواد': 'mikhad',
  'میدانم': 'midanam',
  'میدونم': 'midoonam',
  'می‌دانم': 'midanam',
  'می‌دونم': 'midoonam',
  'میدانی': 'midani',
  'میدونی': 'midooni',
  'میداند': 'midanad',
  'میدونه': 'midoone',
  'میگویم': 'migooyam',
  'میگم': 'migam',
  'می‌گویم': 'migooyam',
  'می‌گم': 'migam',
  'میگویی': 'migooyi',
  'میگی': 'migi',
  'میگوید': 'migooyad',
  'میگه': 'mige',
  'میروم': 'miravam',
  'میرم': 'miram',
  'می‌روم': 'miravam',
  'می‌رم': 'miram',
  'میروی': 'miravi',
  'میری': 'miri',
  'میرود': 'miravad',
  'میره': 'mire',
  'میآیم': 'miayam',
  'میام': 'miyam',
  'می‌آیم': 'miayam',
  'می‌ام': 'miyam',
  'میآیی': 'miayi',
  'میای': 'miyay',
  'میآید': 'miayad',
  'میاد': 'miyad',
};

// Character mapping for remaining Persian characters
const persianCharMap: Record<string, string> = {
  'ا': 'a',
  'آ': 'a',
  'ب': 'b',
  'پ': 'p',
  'ت': 't',
  'ث': 's',
  'ج': 'j',
  'چ': 'ch',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'z',
  'ر': 'r',
  'ز': 'z',
  'ژ': 'zh',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'z',
  'ط': 't',
  'ظ': 'z',
  'ع': 'a',
  'غ': 'gh',
  'ف': 'f',
  'ق': 'gh',
  'ک': 'k',
  'گ': 'g',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'و': 'v',
  'ه': 'h',
  'ی': 'i',
  'ئ': 'e',
  'ء': '',
  'ة': 'e',
  'ى': 'i',
  'ي': 'i',
  // Vowels
  'َ': 'a', // Fatha
  'ِ': 'e', // Kasra
  'ُ': 'o', // Damma
  'ً': 'an',
  'ٍ': 'en',
  'ٌ': 'on',
  'ّ': '', // Tashdid
  'ْ': '', // Sokun
};

export function persianToFinglish(text: string): string {
  if (!text) return '';
  
  let result = text.toLowerCase();
  
  // First, replace common words and phrases
  Object.entries(persianToFinglishMap).forEach(([persian, finglish]) => {
    const regex = new RegExp(persian, 'g');
    result = result.replace(regex, finglish);
  });
  
  // Then, convert remaining Persian characters
  result = result.split('').map(char => {
    return persianCharMap[char] || char;
  }).join('');
  
  // Clean up multiple spaces and trim
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}
