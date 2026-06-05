import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'nihongo.db'));

db.pragma('journal_mode = WAL');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    japanese TEXT NOT NULL,
    kana TEXT NOT NULL,
    romaji TEXT NOT NULL,
    english TEXT NOT NULL,
    part_of_speech TEXT,
    jlpt_level TEXT,
    example_jp TEXT,
    example_en TEXT,
    tags TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS flashcard_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vocab_id INTEGER NOT NULL,
    user_id TEXT DEFAULT 'default',
    ease_factor REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review TEXT DEFAULT (date('now')),
    last_review TEXT,
    status TEXT DEFAULT 'new',
    FOREIGN KEY(vocab_id) REFERENCES vocabulary(id)
  );

  CREATE TABLE IF NOT EXISTS jlpt_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL,
    section TEXT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    grammar_point TEXT,
    difficulty INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS exam_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'default',
    level TEXT NOT NULL,
    section TEXT,
    score INTEGER,
    total INTEGER,
    answers TEXT,
    taken_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'default',
    messages TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed vocabulary if empty
const vocabCount = db.prepare('SELECT COUNT(*) as c FROM vocabulary').get();
if (vocabCount.c === 0) {
  const insertVocab = db.prepare(`
    INSERT INTO vocabulary (japanese, kana, romaji, english, part_of_speech, jlpt_level, example_jp, example_en, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedMany = db.transaction((words) => {
    for (const w of words) insertVocab.run(...w);
  });

  seedMany([
    // N5 Core Vocab
    ['水','みず','mizu','water','noun','N5','水を飲みます。','I drink water.','N5,daily'],
    ['食べる','たべる','taberu','to eat','verb','N5','ご飯を食べます。','I eat rice.','N5,verbs'],
    ['飲む','のむ','nomu','to drink','verb','N5','お茶を飲みます。','I drink tea.','N5,verbs'],
    ['行く','いく','iku','to go','verb','N5','学校に行きます。','I go to school.','N5,verbs'],
    ['来る','くる','kuru','to come','verb','N5','友達が来ます。','My friend comes.','N5,verbs'],
    ['見る','みる','miru','to see/watch','verb','N5','テレビを見ます。','I watch TV.','N5,verbs'],
    ['聞く','きく','kiku','to listen/ask','verb','N5','音楽を聞きます。','I listen to music.','N5,verbs'],
    ['話す','はなす','hanasu','to speak','verb','N5','日本語を話します。','I speak Japanese.','N5,verbs'],
    ['読む','よむ','yomu','to read','verb','N5','本を読みます。','I read a book.','N5,verbs'],
    ['書く','かく','kaku','to write','verb','N5','手紙を書きます。','I write a letter.','N5,verbs'],
    ['大きい','おおきい','ookii','big','i-adj','N5','大きい犬です。','It\'s a big dog.','N5,adjectives'],
    ['小さい','ちいさい','chiisai','small','i-adj','N5','小さい猫です。','It\'s a small cat.','N5,adjectives'],
    ['新しい','あたらしい','atarashii','new','i-adj','N5','新しい本です。','It\'s a new book.','N5,adjectives'],
    ['古い','ふるい','furui','old (thing)','i-adj','N5','古い家です。','It\'s an old house.','N5,adjectives'],
    ['高い','たかい','takai','tall/expensive','i-adj','N5','高いビルです。','It\'s a tall building.','N5,adjectives'],
    ['安い','やすい','yasui','cheap','i-adj','N5','安いです。','It\'s cheap.','N5,adjectives'],
    ['好き','すき','suki','to like','na-adj','N5','音楽が好きです。','I like music.','N5,adjectives'],
    ['嫌い','きらい','kirai','to dislike','na-adj','N5','虫が嫌いです。','I dislike insects.','N5,adjectives'],
    ['友達','ともだち','tomodachi','friend','noun','N5','友達と話します。','I talk with friends.','N5,people'],
    ['先生','せんせい','sensei','teacher','noun','N5','先生は優しいです。','The teacher is kind.','N5,people'],
    ['学生','がくせい','gakusei','student','noun','N5','私は学生です。','I am a student.','N5,people'],
    ['学校','がっこう','gakkou','school','noun','N5','学校に行きます。','I go to school.','N5,places'],
    ['家','いえ','ie','house/home','noun','N5','家に帰ります。','I return home.','N5,places'],
    ['駅','えき','eki','train station','noun','N5','駅で待ちます。','I wait at the station.','N5,places'],
    ['電車','でんしゃ','densha','train','noun','N5','電車で行きます。','I go by train.','N5,transport'],
    // N4 Vocab
    ['覚える','おぼえる','oboeru','to memorize','verb','N4','単語を覚えます。','I memorize vocabulary.','N4,verbs'],
    ['忘れる','わすれる','wasureru','to forget','verb','N4','宿題を忘れました。','I forgot my homework.','N4,verbs'],
    ['教える','おしえる','oshieru','to teach','verb','N4','数学を教えます。','I teach math.','N4,verbs'],
    ['始まる','はじまる','hajimaru','to begin (intrans)','verb','N4','授業が始まります。','The class begins.','N4,verbs'],
    ['終わる','おわる','owaru','to end','verb','N4','仕事が終わります。','Work ends.','N4,verbs'],
    ['便利','べんり','benri','convenient','na-adj','N4','電車は便利です。','Trains are convenient.','N4,adjectives'],
    ['大切','たいせつ','taisetsu','important/precious','na-adj','N4','時間は大切です。','Time is precious.','N4,adjectives'],
    ['丁寧','ていねい','teinei','polite/careful','na-adj','N4','丁寧に話します。','I speak politely.','N4,adjectives'],
    ['生活','せいかつ','seikatsu','daily life','noun','N4','生活が便利です。','Life is convenient.','N4,life'],
    ['経験','けいけん','keiken','experience','noun','N4','経験が必要です。','Experience is necessary.','N4,abstract'],
    // N3 Vocab
    ['感謝','かんしゃ','kansha','gratitude','noun','N3','感謝しています。','I am grateful.','N3,abstract'],
    ['努力','どりょく','doryoku','effort','noun','N3','努力が大切です。','Effort is important.','N3,abstract'],
    ['成功','せいこう','seikou','success','noun','N3','成功を祈ります。','I wish you success.','N3,abstract'],
    ['失敗','しっぱい','shippai','failure','noun','N3','失敗から学ぶ。','Learn from failure.','N3,abstract'],
    ['影響','えいきょう','eikyou','influence/effect','noun','N3','社会に影響します。','It influences society.','N3,abstract'],
  ]);
}

// Seed JLPT questions if empty
const qCount = db.prepare('SELECT COUNT(*) as c FROM jlpt_questions').get();
if (qCount.c === 0) {
  const insertQ = db.prepare(`
    INSERT INTO jlpt_questions (level, section, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, grammar_point)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedQs = db.transaction((qs) => { for (const q of qs) insertQ.run(...q); });

  seedQs([
    // N5 Vocabulary
    ['N5','vocabulary','「水」の読み方はどれですか？ (What is the reading of 「水」?)','みず (mizu)','かわ (kawa)','うみ (umi)','やま (yama)','A','水 (mizu) means "water". 川 (kawa)=river, 海 (umi)=sea, 山 (yama)=mountain.','Kanji readings'],
    ['N5','vocabulary','「食べる」の意味は何ですか？ (What does 「食べる」 mean?)','to drink','to eat','to sleep','to walk','B','食べる (taberu) means "to eat". This is a Group 2 (ichidan) verb.','Verb meanings'],
    ['N5','vocabulary','「大きい」の反対語は何ですか？ (What is the antonym of 「大きい」?)','新しい','高い','小さい','古い','C','大きい (ookii) means "big". Its antonym is 小さい (chiisai) meaning "small".','Antonyms'],
    ['N5','vocabulary','「先生」はどういう意味ですか？','student','friend','teacher','doctor','C','先生 (sensei) means "teacher". It is also used as a respectful address for doctors, lawyers, etc.','Nouns'],
    ['N5','vocabulary','次の中で「乗り物」(vehicle) はどれですか？','電車','学校','友達','音楽','A','電車 (densha) means "train" which is a vehicle. 学校=school, 友達=friend, 音楽=music.','Categories'],

    // N5 Grammar
    ['N5','grammar','「私___学生です。」に入る助詞は何ですか？','の','を','は','が','C','「私は学生です」 — は (wa) is the topic marker particle used to mark the subject of the sentence.','Topic particle は'],
    ['N5','grammar','「学校___行きます。」正しい助詞は？','は','が','を','に','D','に (ni) indicates direction/destination. 学校に行きます = "I go to school."','Direction particle に'],
    ['N5','grammar','「本___読みます。」空欄に入る助詞は？','は','が','を','に','C','を (wo) is the direct object particle. 本を読みます = "I read a book."','Object particle を'],
    ['N5','grammar','「これ___何ですか？」空欄に入る言葉は？','は','が','を','に','A','これは何ですか？ = "What is this?" — は marks これ as the topic.','Question patterns'],
    ['N5','grammar','「明日、映画を___つもりです。」正しい動詞形は？','見る','見た','見て','見ます','A','〜するつもりです means "I intend to do ~". It takes the dictionary form of the verb.','つもり (intention)'],

    // N5 Reading
    ['N5','reading','「今日は月曜日です。明日は何曜日ですか？」Answer:','日曜日','土曜日','火曜日','水曜日','C','Monday (月曜日) is followed by Tuesday (火曜日). 日=Sunday, 土=Saturday, 水=Wednesday.','Days of the week'],
    ['N5','reading','「私は毎朝7時に起きます。」What time does this person wake up?','6:00 AM','7:00 AM','8:00 AM','9:00 AM','B','毎朝7時に起きます means "I wake up at 7 every morning." 七時 = 7 o\'clock.','Time expressions'],

    // N4 Grammar
    ['N4','grammar','「雨が降って___、出かけられません。」正しい形は？','いると','いても','いれば','いるから','D','〜から = "because". 雨が降っているから、出かけられません = "Because it\'s raining, I can\'t go out."','Reason から'],
    ['N4','grammar','「もっと練習___、上手になれます。」','すれば','すると','しても','しては','A','〜ば conditional: もっと練習すれば、上手になれます = "If you practice more, you can improve."','Conditional ば'],
    ['N4','grammar','「彼女は歌が上手___、ダンスも得意です。」','だから','なのに','なうえに','だけど','C','〜上に (ue ni) = "in addition to". She\'s good at singing AND also good at dancing.','Addition うえに'],
    ['N4','grammar','「この問題は難し___思います。」','くと','いと','すぎると','いすぎると','B','〜いと思います = "I think it is ~". 難しいと思います = "I think it is difficult."','Expressing opinion と思う'],
    ['N4','grammar','「病気___、学校を休みました。」','なので','なのに','ながら','なくて','A','なので = "because (of)". 病気なので、学校を休みました = "Because I was sick, I took a day off school."','Reason なので'],

    // N4 Vocabulary
    ['N4','vocabulary','「便利」の意味として正しいものはどれですか？','dangerous','convenient','expensive','difficult','B','便利 (benri) is a na-adjective meaning "convenient" or "handy".','Na-adjectives'],
    ['N4','vocabulary','「覚える」の対義語は？','忘れる','教える','学ぶ','始める','A','覚える (oboeru) = to memorize. Its antonym is 忘れる (wasureru) = to forget.','Verb antonyms'],

    // N3 Grammar
    ['N3','grammar','「努力___成功できる。」適切な表現は？','によって','について','にとって','にしても','A','によって (ni yotte) = "by means of / due to". 努力によって成功できる = "Success can be achieved through effort."','によって (by means of)'],
    ['N3','grammar','「彼は仕事が忙しい___、毎日残業している。」','ようで','らしく','せいか','ためか','C','せいか = "perhaps because of (negative nuance)". 仕事が忙しいせいか、毎日残業している = "Perhaps because work is busy, he works overtime every day."','せいか (perhaps because)'],
    ['N3','grammar','「この映画は子供___楽しめる。」','でも','しか','だけ','ばかり','A','でも (demo) = "even". この映画は子供でも楽しめる = "Even children can enjoy this movie."','でも (even)'],
    ['N3','grammar','「彼女は日本語が話せる___、フランス語も話せる。」','うえに','ために','ように','ことに','A','〜うえに = "in addition to / moreover". She can speak Japanese, and moreover French too.','Addition grammar うえに'],

    // N3 Vocabulary
    ['N3','vocabulary','「影響」の読み方と意味は？','えいきょう / influence','かんしゃ / gratitude','どりょく / effort','せいこう / success','A','影響 (えいきょう, eikyou) means "influence" or "effect". Used in 影響を与える (to give an influence).','Abstract nouns'],
    ['N3','vocabulary','「感謝」を英語で言うと？','effort','failure','gratitude','success','C','感謝 (かんしゃ, kansha) means "gratitude" or "thankfulness". 感謝します = "Thank you / I am grateful."','Abstract nouns'],
  ]);
}

export default db;
