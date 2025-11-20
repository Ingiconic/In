// Persian to Finglish (Phonetic English) converter
const persianToFinglishMap: Record<string, string> = {
  'سلام': 'salam', 'درود': 'dorood', 'خداحافظ': 'khodahafez', 'چطوری': 'chetori', 'حال': 'hal',
  'خوبم': 'khoobam', 'خوبی': 'khoobi', 'خوب': 'khoob', 'عالی': 'ali', 'بد': 'bad', 'مرسی': 'mersi',
  'ممنون': 'mamnoon', 'متشکر': 'moteshaker', 'تشکر': 'tashakor', 'لطفا': 'lotfan', 'ببخشید': 'bebakhshid',
  'بله': 'bale', 'آره': 'are', 'نه': 'na', 'چشم': 'cheshm', 'چی': 'chi', 'چه': 'che', 'کی': 'key',
  'کجا': 'koja', 'چرا': 'chera', 'چون': 'chon', 'الان': 'alan', 'حالا': 'hala', 'امروز': 'emrooz',
  'دیروز': 'dirooz', 'فردا': 'farda', 'من': 'man', 'تو': 'to', 'او': 'oo', 'ما': 'ma', 'شما': 'shoma',
  'این': 'in', 'آن': 'an', 'هستم': 'hastam', 'هستی': 'hasti', 'هست': 'hast', 'می‌روم': 'miravam',
  'میرم': 'miram', 'می‌آیم': 'miyayam', 'میام': 'miyam', 'می‌کنم': 'mikonam', 'میکنم': 'mikonam',
  'می‌خواهم': 'mikhaham', 'میخوام': 'mikham', 'می‌گویم': 'migoyam', 'میگم': 'migam', 'دارم': 'daram',
  'یک': 'yek', 'دو': 'do', 'سه': 'se', 'چهار': 'chahar', 'پنج': 'panj', 'شش': 'shesh', 'هفت': 'haft',
  'هشت': 'hasht', 'ده': 'dah', 'بزرگ': 'bozorg', 'کوچک': 'koochak', 'خانه': 'khane',
  'درس': 'dars', 'امتحان': 'emtehan', 'کتاب': 'ketab',
};

const persianCharMap: Record<string, string> = {
  'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
  'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h', 'ی': 'i',
  '‌': '', ' ': ' ',
};

export function persianToFinglish(text: string): string {
  if (!text) return '';
  let result = text;
  const sortedKeys = Object.keys(persianToFinglishMap).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) result = result.split(key).join(persianToFinglishMap[key]);
  return result.split('').map(c => persianCharMap[c] || c).join('');
}
