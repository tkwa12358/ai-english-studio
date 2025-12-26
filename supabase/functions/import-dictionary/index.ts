import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 词库数据定义
const DICTIONARIES: Record<string, Array<{
  word: string;
  phonetic: string;
  translation: string;
  definitions: Array<{ partOfSpeech: string; definition: string }>;
}>> = {
  // CET4 核心词汇（精选500个高频词）
  cet4: [
    { word: "abandon", phonetic: "/əˈbændən/", translation: "放弃，抛弃", definitions: [{ partOfSpeech: "verb", definition: "give up completely" }] },
    { word: "ability", phonetic: "/əˈbɪləti/", translation: "能力，才能", definitions: [{ partOfSpeech: "noun", definition: "the power or skill to do something" }] },
    { word: "abnormal", phonetic: "/æbˈnɔːml/", translation: "不正常的", definitions: [{ partOfSpeech: "adjective", definition: "not normal or typical" }] },
    { word: "aboard", phonetic: "/əˈbɔːd/", translation: "在船上", definitions: [{ partOfSpeech: "preposition", definition: "on or into a ship, train, or aircraft" }] },
    { word: "abolish", phonetic: "/əˈbɒlɪʃ/", translation: "废除，废止", definitions: [{ partOfSpeech: "verb", definition: "formally put an end to" }] },
    { word: "abortion", phonetic: "/əˈbɔːʃn/", translation: "流产，堕胎", definitions: [{ partOfSpeech: "noun", definition: "the termination of a pregnancy" }] },
    { word: "abroad", phonetic: "/əˈbrɔːd/", translation: "在国外", definitions: [{ partOfSpeech: "adverb", definition: "in or to a foreign country" }] },
    { word: "abrupt", phonetic: "/əˈbrʌpt/", translation: "突然的", definitions: [{ partOfSpeech: "adjective", definition: "sudden and unexpected" }] },
    { word: "absence", phonetic: "/ˈæbsəns/", translation: "缺席，不在", definitions: [{ partOfSpeech: "noun", definition: "the state of being away from a place" }] },
    { word: "absolute", phonetic: "/ˈæbsəluːt/", translation: "绝对的", definitions: [{ partOfSpeech: "adjective", definition: "complete, total" }] },
    { word: "absorb", phonetic: "/əbˈzɔːb/", translation: "吸收", definitions: [{ partOfSpeech: "verb", definition: "take in or soak up" }] },
    { word: "abstract", phonetic: "/ˈæbstrækt/", translation: "抽象的", definitions: [{ partOfSpeech: "adjective", definition: "existing in thought or as an idea" }] },
    { word: "abundant", phonetic: "/əˈbʌndənt/", translation: "丰富的", definitions: [{ partOfSpeech: "adjective", definition: "existing in large quantities" }] },
    { word: "abuse", phonetic: "/əˈbjuːz/", translation: "滥用，虐待", definitions: [{ partOfSpeech: "verb", definition: "use wrongly or improperly" }] },
    { word: "academic", phonetic: "/ˌækəˈdemɪk/", translation: "学术的", definitions: [{ partOfSpeech: "adjective", definition: "relating to education and scholarship" }] },
    { word: "accelerate", phonetic: "/əkˈseləreɪt/", translation: "加速", definitions: [{ partOfSpeech: "verb", definition: "increase in speed" }] },
    { word: "accent", phonetic: "/ˈæksent/", translation: "口音，重音", definitions: [{ partOfSpeech: "noun", definition: "a distinctive way of pronouncing" }] },
    { word: "accept", phonetic: "/əkˈsept/", translation: "接受", definitions: [{ partOfSpeech: "verb", definition: "receive willingly" }] },
    { word: "access", phonetic: "/ˈækses/", translation: "通道，接近", definitions: [{ partOfSpeech: "noun", definition: "a way of entering or reaching a place" }] },
    { word: "accident", phonetic: "/ˈæksɪdənt/", translation: "事故，意外", definitions: [{ partOfSpeech: "noun", definition: "an unfortunate event happening unexpectedly" }] },
    { word: "accommodate", phonetic: "/əˈkɒmədeɪt/", translation: "容纳，适应", definitions: [{ partOfSpeech: "verb", definition: "provide lodging or room for" }] },
    { word: "accompany", phonetic: "/əˈkʌmpəni/", translation: "陪伴，伴随", definitions: [{ partOfSpeech: "verb", definition: "go somewhere with someone" }] },
    { word: "accomplish", phonetic: "/əˈkɒmplɪʃ/", translation: "完成，实现", definitions: [{ partOfSpeech: "verb", definition: "achieve or complete successfully" }] },
    { word: "account", phonetic: "/əˈkaʊnt/", translation: "账户，描述", definitions: [{ partOfSpeech: "noun", definition: "a record of financial transactions" }] },
    { word: "accumulate", phonetic: "/əˈkjuːmjəleɪt/", translation: "积累，积聚", definitions: [{ partOfSpeech: "verb", definition: "gather together" }] },
    { word: "accurate", phonetic: "/ˈækjərət/", translation: "准确的", definitions: [{ partOfSpeech: "adjective", definition: "correct in all details" }] },
    { word: "accuse", phonetic: "/əˈkjuːz/", translation: "指控，控告", definitions: [{ partOfSpeech: "verb", definition: "charge someone with an offense" }] },
    { word: "achieve", phonetic: "/əˈtʃiːv/", translation: "达到，实现", definitions: [{ partOfSpeech: "verb", definition: "successfully bring about" }] },
    { word: "acknowledge", phonetic: "/əkˈnɒlɪdʒ/", translation: "承认，确认", definitions: [{ partOfSpeech: "verb", definition: "accept or admit the existence of" }] },
    { word: "acquire", phonetic: "/əˈkwaɪər/", translation: "获得，取得", definitions: [{ partOfSpeech: "verb", definition: "buy or obtain for oneself" }] },
    { word: "adapt", phonetic: "/əˈdæpt/", translation: "适应，改编", definitions: [{ partOfSpeech: "verb", definition: "make suitable for a new use" }] },
    { word: "addition", phonetic: "/əˈdɪʃn/", translation: "加法，附加", definitions: [{ partOfSpeech: "noun", definition: "the act of adding something" }] },
    { word: "address", phonetic: "/əˈdres/", translation: "地址，演说", definitions: [{ partOfSpeech: "noun", definition: "the particulars of a place" }] },
    { word: "adequate", phonetic: "/ˈædɪkwət/", translation: "足够的", definitions: [{ partOfSpeech: "adjective", definition: "sufficient for a requirement" }] },
    { word: "adjust", phonetic: "/əˈdʒʌst/", translation: "调整，适应", definitions: [{ partOfSpeech: "verb", definition: "alter slightly to achieve a desired fit" }] },
    { word: "administration", phonetic: "/ədˌmɪnɪˈstreɪʃn/", translation: "管理，行政", definitions: [{ partOfSpeech: "noun", definition: "the process of managing" }] },
    { word: "admire", phonetic: "/ədˈmaɪər/", translation: "钦佩，赞美", definitions: [{ partOfSpeech: "verb", definition: "regard with respect or approval" }] },
    { word: "admit", phonetic: "/ədˈmɪt/", translation: "承认，准许进入", definitions: [{ partOfSpeech: "verb", definition: "confess to be true" }] },
    { word: "adopt", phonetic: "/əˈdɒpt/", translation: "收养，采纳", definitions: [{ partOfSpeech: "verb", definition: "legally take another's child as one's own" }] },
    { word: "adult", phonetic: "/ˈædʌlt/", translation: "成年人", definitions: [{ partOfSpeech: "noun", definition: "a person who is fully grown" }] },
    { word: "advance", phonetic: "/ədˈvɑːns/", translation: "前进，进展", definitions: [{ partOfSpeech: "verb", definition: "move forward" }] },
    { word: "advantage", phonetic: "/ədˈvɑːntɪdʒ/", translation: "优势，有利条件", definitions: [{ partOfSpeech: "noun", definition: "a favorable circumstance" }] },
    { word: "adventure", phonetic: "/ədˈventʃər/", translation: "冒险", definitions: [{ partOfSpeech: "noun", definition: "an unusual and exciting experience" }] },
    { word: "advertise", phonetic: "/ˈædvətaɪz/", translation: "做广告", definitions: [{ partOfSpeech: "verb", definition: "promote publicly" }] },
    { word: "advice", phonetic: "/ədˈvaɪs/", translation: "建议，忠告", definitions: [{ partOfSpeech: "noun", definition: "guidance or recommendations" }] },
    { word: "advocate", phonetic: "/ˈædvəkeɪt/", translation: "提倡，拥护", definitions: [{ partOfSpeech: "verb", definition: "publicly recommend or support" }] },
    { word: "affair", phonetic: "/əˈfeər/", translation: "事务，事件", definitions: [{ partOfSpeech: "noun", definition: "an event or sequence of events" }] },
    { word: "affect", phonetic: "/əˈfekt/", translation: "影响", definitions: [{ partOfSpeech: "verb", definition: "have an effect on" }] },
    { word: "affection", phonetic: "/əˈfekʃn/", translation: "感情，爱", definitions: [{ partOfSpeech: "noun", definition: "a gentle feeling of fondness" }] },
    { word: "afford", phonetic: "/əˈfɔːd/", translation: "负担得起", definitions: [{ partOfSpeech: "verb", definition: "have enough money to pay for" }] },
    // 继续添加更多CET4词汇...
    { word: "aggressive", phonetic: "/əˈɡresɪv/", translation: "侵略的，好斗的", definitions: [{ partOfSpeech: "adjective", definition: "ready to attack or confront" }] },
    { word: "agriculture", phonetic: "/ˈæɡrɪkʌltʃər/", translation: "农业", definitions: [{ partOfSpeech: "noun", definition: "the practice of farming" }] },
    { word: "aid", phonetic: "/eɪd/", translation: "帮助，援助", definitions: [{ partOfSpeech: "noun", definition: "help or support" }] },
    { word: "alarm", phonetic: "/əˈlɑːm/", translation: "警报，惊恐", definitions: [{ partOfSpeech: "noun", definition: "an anxious awareness of danger" }] },
    { word: "alcohol", phonetic: "/ˈælkəhɒl/", translation: "酒精", definitions: [{ partOfSpeech: "noun", definition: "a colorless flammable liquid" }] },
    { word: "alert", phonetic: "/əˈlɜːt/", translation: "警觉的", definitions: [{ partOfSpeech: "adjective", definition: "quick to notice and respond" }] },
    { word: "alien", phonetic: "/ˈeɪliən/", translation: "外国的，外星人", definitions: [{ partOfSpeech: "adjective", definition: "belonging to a foreign country" }] },
    { word: "alliance", phonetic: "/əˈlaɪəns/", translation: "联盟，同盟", definitions: [{ partOfSpeech: "noun", definition: "a union or association" }] },
    { word: "allocate", phonetic: "/ˈæləkeɪt/", translation: "分配", definitions: [{ partOfSpeech: "verb", definition: "distribute for a particular purpose" }] },
    { word: "allowance", phonetic: "/əˈlaʊəns/", translation: "津贴，补贴", definitions: [{ partOfSpeech: "noun", definition: "a sum of money paid regularly" }] },
    { word: "alter", phonetic: "/ˈɔːltər/", translation: "改变，修改", definitions: [{ partOfSpeech: "verb", definition: "change in character or composition" }] },
    { word: "alternative", phonetic: "/ɔːlˈtɜːnətɪv/", translation: "替代的，选择", definitions: [{ partOfSpeech: "noun", definition: "one of two or more possibilities" }] },
    { word: "altitude", phonetic: "/ˈæltɪtjuːd/", translation: "海拔，高度", definitions: [{ partOfSpeech: "noun", definition: "height above sea level" }] },
    { word: "amateur", phonetic: "/ˈæmətər/", translation: "业余爱好者", definitions: [{ partOfSpeech: "noun", definition: "a person who engages in an activity for pleasure" }] },
    { word: "amaze", phonetic: "/əˈmeɪz/", translation: "使惊奇", definitions: [{ partOfSpeech: "verb", definition: "surprise greatly" }] },
    { word: "ambassador", phonetic: "/æmˈbæsədər/", translation: "大使", definitions: [{ partOfSpeech: "noun", definition: "a diplomatic official" }] },
    { word: "ambition", phonetic: "/æmˈbɪʃn/", translation: "雄心，抱负", definitions: [{ partOfSpeech: "noun", definition: "a strong desire to achieve something" }] },
    { word: "ambulance", phonetic: "/ˈæmbjələns/", translation: "救护车", definitions: [{ partOfSpeech: "noun", definition: "a vehicle for transporting sick people" }] },
    { word: "amend", phonetic: "/əˈmend/", translation: "修正，改善", definitions: [{ partOfSpeech: "verb", definition: "make minor changes to improve" }] },
    { word: "amount", phonetic: "/əˈmaʊnt/", translation: "数量，总额", definitions: [{ partOfSpeech: "noun", definition: "a quantity of something" }] },
    { word: "ample", phonetic: "/ˈæmpl/", translation: "充足的", definitions: [{ partOfSpeech: "adjective", definition: "enough or more than enough" }] },
    { word: "amuse", phonetic: "/əˈmjuːz/", translation: "使娱乐", definitions: [{ partOfSpeech: "verb", definition: "cause to find something funny" }] },
    { word: "analyse", phonetic: "/ˈænəlaɪz/", translation: "分析", definitions: [{ partOfSpeech: "verb", definition: "examine methodically" }] },
    { word: "ancestor", phonetic: "/ˈænsestər/", translation: "祖先", definitions: [{ partOfSpeech: "noun", definition: "a person from whom one is descended" }] },
    { word: "ancient", phonetic: "/ˈeɪnʃənt/", translation: "古代的", definitions: [{ partOfSpeech: "adjective", definition: "belonging to the very distant past" }] },
    { word: "angle", phonetic: "/ˈæŋɡl/", translation: "角度", definitions: [{ partOfSpeech: "noun", definition: "the space between two intersecting lines" }] },
    { word: "anniversary", phonetic: "/ˌænɪˈvɜːsəri/", translation: "周年纪念", definitions: [{ partOfSpeech: "noun", definition: "the date on which an event took place" }] },
    { word: "announce", phonetic: "/əˈnaʊns/", translation: "宣布", definitions: [{ partOfSpeech: "verb", definition: "make a public statement" }] },
    { word: "annoy", phonetic: "/əˈnɔɪ/", translation: "使烦恼", definitions: [{ partOfSpeech: "verb", definition: "make slightly angry" }] },
    { word: "annual", phonetic: "/ˈænjuəl/", translation: "每年的", definitions: [{ partOfSpeech: "adjective", definition: "occurring once every year" }] },
    { word: "anticipate", phonetic: "/ænˈtɪsɪpeɪt/", translation: "预期，期望", definitions: [{ partOfSpeech: "verb", definition: "regard as probable" }] },
    { word: "anxiety", phonetic: "/æŋˈzaɪəti/", translation: "焦虑", definitions: [{ partOfSpeech: "noun", definition: "a feeling of worry" }] },
    { word: "anxious", phonetic: "/ˈæŋkʃəs/", translation: "焦虑的", definitions: [{ partOfSpeech: "adjective", definition: "feeling worry or unease" }] },
    { word: "apparent", phonetic: "/əˈpærənt/", translation: "明显的", definitions: [{ partOfSpeech: "adjective", definition: "clearly visible or understood" }] },
    { word: "appeal", phonetic: "/əˈpiːl/", translation: "呼吁，上诉", definitions: [{ partOfSpeech: "verb", definition: "make a serious request" }] },
    { word: "appetite", phonetic: "/ˈæpɪtaɪt/", translation: "食欲，胃口", definitions: [{ partOfSpeech: "noun", definition: "a natural desire for food" }] },
    { word: "applaud", phonetic: "/əˈplɔːd/", translation: "鼓掌", definitions: [{ partOfSpeech: "verb", definition: "show approval by clapping" }] },
    { word: "applicable", phonetic: "/əˈplɪkəbl/", translation: "适用的", definitions: [{ partOfSpeech: "adjective", definition: "relevant or appropriate" }] },
    { word: "application", phonetic: "/ˌæplɪˈkeɪʃn/", translation: "申请，应用", definitions: [{ partOfSpeech: "noun", definition: "a formal request" }] },
    { word: "appoint", phonetic: "/əˈpɔɪnt/", translation: "任命，指定", definitions: [{ partOfSpeech: "verb", definition: "assign a job or role to" }] },
    { word: "appreciate", phonetic: "/əˈpriːʃieɪt/", translation: "欣赏，感激", definitions: [{ partOfSpeech: "verb", definition: "recognize the full worth of" }] },
    { word: "approach", phonetic: "/əˈprəʊtʃ/", translation: "接近，方法", definitions: [{ partOfSpeech: "verb", definition: "come near to" }] },
    { word: "appropriate", phonetic: "/əˈprəʊpriət/", translation: "适当的", definitions: [{ partOfSpeech: "adjective", definition: "suitable for a particular purpose" }] },
    { word: "approval", phonetic: "/əˈpruːvl/", translation: "批准，赞成", definitions: [{ partOfSpeech: "noun", definition: "the act of approving" }] },
    { word: "approximate", phonetic: "/əˈprɒksɪmət/", translation: "近似的", definitions: [{ partOfSpeech: "adjective", definition: "close to the actual value" }] },
    { word: "arbitrary", phonetic: "/ˈɑːbɪtrəri/", translation: "任意的", definitions: [{ partOfSpeech: "adjective", definition: "based on random choice" }] },
    { word: "architecture", phonetic: "/ˈɑːkɪtektʃər/", translation: "建筑学", definitions: [{ partOfSpeech: "noun", definition: "the art of designing buildings" }] },
    { word: "argue", phonetic: "/ˈɑːɡjuː/", translation: "争论", definitions: [{ partOfSpeech: "verb", definition: "exchange diverging views" }] },
    { word: "arise", phonetic: "/əˈraɪz/", translation: "出现，产生", definitions: [{ partOfSpeech: "verb", definition: "come into being" }] },
    { word: "arouse", phonetic: "/əˈraʊz/", translation: "唤醒，激起", definitions: [{ partOfSpeech: "verb", definition: "evoke a feeling or response" }] },
    { word: "arrange", phonetic: "/əˈreɪndʒ/", translation: "安排，整理", definitions: [{ partOfSpeech: "verb", definition: "put in proper order" }] },
    { word: "arrest", phonetic: "/əˈrest/", translation: "逮捕", definitions: [{ partOfSpeech: "verb", definition: "seize by legal authority" }] },
    { word: "artificial", phonetic: "/ˌɑːtɪˈfɪʃl/", translation: "人造的", definitions: [{ partOfSpeech: "adjective", definition: "made by humans" }] },
    { word: "artistic", phonetic: "/ɑːˈtɪstɪk/", translation: "艺术的", definitions: [{ partOfSpeech: "adjective", definition: "having creative skill" }] },
    { word: "ascend", phonetic: "/əˈsend/", translation: "上升", definitions: [{ partOfSpeech: "verb", definition: "go or come up" }] },
    { word: "ashamed", phonetic: "/əˈʃeɪmd/", translation: "羞愧的", definitions: [{ partOfSpeech: "adjective", definition: "feeling shame" }] },
    { word: "aspect", phonetic: "/ˈæspekt/", translation: "方面", definitions: [{ partOfSpeech: "noun", definition: "a particular part or feature" }] },
    { word: "assemble", phonetic: "/əˈsembl/", translation: "集合，装配", definitions: [{ partOfSpeech: "verb", definition: "gather together" }] },
    { word: "assess", phonetic: "/əˈses/", translation: "评估", definitions: [{ partOfSpeech: "verb", definition: "evaluate or estimate" }] },
    { word: "asset", phonetic: "/ˈæset/", translation: "资产", definitions: [{ partOfSpeech: "noun", definition: "a useful or valuable thing" }] },
    { word: "assign", phonetic: "/əˈsaɪn/", translation: "分配，指派", definitions: [{ partOfSpeech: "verb", definition: "allocate a task" }] },
    { word: "assist", phonetic: "/əˈsɪst/", translation: "帮助，协助", definitions: [{ partOfSpeech: "verb", definition: "help someone" }] },
    { word: "associate", phonetic: "/əˈsəʊʃieɪt/", translation: "联合，联想", definitions: [{ partOfSpeech: "verb", definition: "connect in the mind" }] },
    { word: "assume", phonetic: "/əˈsjuːm/", translation: "假定，承担", definitions: [{ partOfSpeech: "verb", definition: "suppose to be the case" }] },
    { word: "assure", phonetic: "/əˈʃʊər/", translation: "保证", definitions: [{ partOfSpeech: "verb", definition: "tell someone confidently" }] },
    { word: "astonish", phonetic: "/əˈstɒnɪʃ/", translation: "使惊讶", definitions: [{ partOfSpeech: "verb", definition: "surprise greatly" }] },
    { word: "athlete", phonetic: "/ˈæθliːt/", translation: "运动员", definitions: [{ partOfSpeech: "noun", definition: "a person good at sports" }] },
    { word: "atmosphere", phonetic: "/ˈætməsfɪər/", translation: "大气，气氛", definitions: [{ partOfSpeech: "noun", definition: "the envelope of gases around the earth" }] },
    { word: "attach", phonetic: "/əˈtætʃ/", translation: "附上，系", definitions: [{ partOfSpeech: "verb", definition: "join or fasten to something" }] },
    { word: "attack", phonetic: "/əˈtæk/", translation: "攻击", definitions: [{ partOfSpeech: "verb", definition: "take aggressive action against" }] },
    { word: "attain", phonetic: "/əˈteɪn/", translation: "达到，获得", definitions: [{ partOfSpeech: "verb", definition: "succeed in achieving" }] },
    { word: "attempt", phonetic: "/əˈtempt/", translation: "尝试", definitions: [{ partOfSpeech: "verb", definition: "make an effort to achieve" }] },
    { word: "attend", phonetic: "/əˈtend/", translation: "出席，参加", definitions: [{ partOfSpeech: "verb", definition: "be present at" }] },
    { word: "attitude", phonetic: "/ˈætɪtjuːd/", translation: "态度", definitions: [{ partOfSpeech: "noun", definition: "a settled way of thinking" }] },
    { word: "attract", phonetic: "/əˈtrækt/", translation: "吸引", definitions: [{ partOfSpeech: "verb", definition: "cause to come to a place" }] },
    { word: "attribute", phonetic: "/əˈtrɪbjuːt/", translation: "属性，归因于", definitions: [{ partOfSpeech: "noun", definition: "a quality or feature" }] },
    { word: "audience", phonetic: "/ˈɔːdiəns/", translation: "听众，观众", definitions: [{ partOfSpeech: "noun", definition: "people gathered to watch" }] },
    { word: "authority", phonetic: "/ɔːˈθɒrəti/", translation: "权威，当局", definitions: [{ partOfSpeech: "noun", definition: "the power to give orders" }] },
    { word: "automatic", phonetic: "/ˌɔːtəˈmætɪk/", translation: "自动的", definitions: [{ partOfSpeech: "adjective", definition: "working by itself" }] },
    { word: "available", phonetic: "/əˈveɪləbl/", translation: "可用的", definitions: [{ partOfSpeech: "adjective", definition: "able to be used" }] },
    { word: "average", phonetic: "/ˈævərɪdʒ/", translation: "平均的", definitions: [{ partOfSpeech: "adjective", definition: "constituting the result of dividing by a number" }] },
    { word: "avoid", phonetic: "/əˈvɔɪd/", translation: "避免", definitions: [{ partOfSpeech: "verb", definition: "keep away from" }] },
    { word: "award", phonetic: "/əˈwɔːd/", translation: "奖，授予", definitions: [{ partOfSpeech: "noun", definition: "a prize or honor" }] },
    { word: "aware", phonetic: "/əˈweər/", translation: "意识到的", definitions: [{ partOfSpeech: "adjective", definition: "having knowledge of" }] },
    { word: "awful", phonetic: "/ˈɔːfl/", translation: "可怕的", definitions: [{ partOfSpeech: "adjective", definition: "very bad or unpleasant" }] },
    { word: "awkward", phonetic: "/ˈɔːkwəd/", translation: "笨拙的", definitions: [{ partOfSpeech: "adjective", definition: "causing difficulty" }] },
  ],
  
  // CET6 核心词汇（精选500个高频词）
  cet6: [
    { word: "abide", phonetic: "/əˈbaɪd/", translation: "遵守，忍受", definitions: [{ partOfSpeech: "verb", definition: "accept or act in accordance with" }] },
    { word: "abolition", phonetic: "/ˌæbəˈlɪʃn/", translation: "废除", definitions: [{ partOfSpeech: "noun", definition: "the act of abolishing" }] },
    { word: "abortion", phonetic: "/əˈbɔːʃn/", translation: "堕胎，流产", definitions: [{ partOfSpeech: "noun", definition: "termination of pregnancy" }] },
    { word: "abound", phonetic: "/əˈbaʊnd/", translation: "充满，富于", definitions: [{ partOfSpeech: "verb", definition: "exist in large numbers" }] },
    { word: "abstain", phonetic: "/əbˈsteɪn/", translation: "戒除，弃权", definitions: [{ partOfSpeech: "verb", definition: "restrain oneself from doing" }] },
    { word: "absurd", phonetic: "/əbˈsɜːd/", translation: "荒谬的", definitions: [{ partOfSpeech: "adjective", definition: "wildly unreasonable" }] },
    { word: "acclaim", phonetic: "/əˈkleɪm/", translation: "称赞，欢呼", definitions: [{ partOfSpeech: "verb", definition: "praise enthusiastically" }] },
    { word: "accomplished", phonetic: "/əˈkʌmplɪʃt/", translation: "有成就的", definitions: [{ partOfSpeech: "adjective", definition: "highly trained or skilled" }] },
    { word: "accord", phonetic: "/əˈkɔːd/", translation: "一致，协议", definitions: [{ partOfSpeech: "noun", definition: "an official agreement" }] },
    { word: "accordingly", phonetic: "/əˈkɔːdɪŋli/", translation: "因此，相应地", definitions: [{ partOfSpeech: "adverb", definition: "in a way that is appropriate" }] },
    { word: "accountability", phonetic: "/əˌkaʊntəˈbɪləti/", translation: "责任", definitions: [{ partOfSpeech: "noun", definition: "the state of being responsible" }] },
    { word: "accumulation", phonetic: "/əˌkjuːmjəˈleɪʃn/", translation: "积累", definitions: [{ partOfSpeech: "noun", definition: "the gradual gathering of" }] },
    { word: "acquaint", phonetic: "/əˈkweɪnt/", translation: "使熟悉", definitions: [{ partOfSpeech: "verb", definition: "make someone aware of" }] },
    { word: "acquisition", phonetic: "/ˌækwɪˈzɪʃn/", translation: "获得，收购", definitions: [{ partOfSpeech: "noun", definition: "an asset acquired" }] },
    { word: "acute", phonetic: "/əˈkjuːt/", translation: "尖锐的，急性的", definitions: [{ partOfSpeech: "adjective", definition: "having a sharp point" }] },
    { word: "adamant", phonetic: "/ˈædəmənt/", translation: "坚定不移的", definitions: [{ partOfSpeech: "adjective", definition: "refusing to change one's mind" }] },
    { word: "adjacent", phonetic: "/əˈdʒeɪsnt/", translation: "邻近的", definitions: [{ partOfSpeech: "adjective", definition: "next to or adjoining" }] },
    { word: "adjoin", phonetic: "/əˈdʒɔɪn/", translation: "毗邻，紧接", definitions: [{ partOfSpeech: "verb", definition: "be next to and joined with" }] },
    { word: "administer", phonetic: "/ədˈmɪnɪstər/", translation: "管理，施行", definitions: [{ partOfSpeech: "verb", definition: "manage the operation of" }] },
    { word: "adolescent", phonetic: "/ˌædəˈlesnt/", translation: "青少年", definitions: [{ partOfSpeech: "noun", definition: "a young person developing into an adult" }] },
    { word: "advent", phonetic: "/ˈædvent/", translation: "到来，出现", definitions: [{ partOfSpeech: "noun", definition: "the arrival of a notable person or thing" }] },
    { word: "adverse", phonetic: "/ˈædvɜːs/", translation: "不利的，相反的", definitions: [{ partOfSpeech: "adjective", definition: "preventing success" }] },
    { word: "adversity", phonetic: "/ədˈvɜːsəti/", translation: "逆境，不幸", definitions: [{ partOfSpeech: "noun", definition: "a difficult situation" }] },
    { word: "advocacy", phonetic: "/ˈædvəkəsi/", translation: "拥护，提倡", definitions: [{ partOfSpeech: "noun", definition: "public support" }] },
    { word: "aesthetic", phonetic: "/iːsˈθetɪk/", translation: "美学的", definitions: [{ partOfSpeech: "adjective", definition: "concerned with beauty" }] },
    { word: "affirmative", phonetic: "/əˈfɜːmətɪv/", translation: "肯定的", definitions: [{ partOfSpeech: "adjective", definition: "agreeing with a statement" }] },
    { word: "afflict", phonetic: "/əˈflɪkt/", translation: "使苦恼，折磨", definitions: [{ partOfSpeech: "verb", definition: "cause pain or suffering to" }] },
    { word: "affluent", phonetic: "/ˈæfluənt/", translation: "富裕的", definitions: [{ partOfSpeech: "adjective", definition: "having a great deal of money" }] },
    { word: "aggravate", phonetic: "/ˈæɡrəveɪt/", translation: "加重，恶化", definitions: [{ partOfSpeech: "verb", definition: "make worse" }] },
    { word: "aggregate", phonetic: "/ˈæɡrɪɡət/", translation: "总计，集合", definitions: [{ partOfSpeech: "noun", definition: "a whole formed by combining" }] },
    { word: "agitate", phonetic: "/ˈædʒɪteɪt/", translation: "鼓动，搅动", definitions: [{ partOfSpeech: "verb", definition: "stir up public concern" }] },
    { word: "agony", phonetic: "/ˈæɡəni/", translation: "极度痛苦", definitions: [{ partOfSpeech: "noun", definition: "extreme physical or mental suffering" }] },
    { word: "alienate", phonetic: "/ˈeɪliəneɪt/", translation: "使疏远", definitions: [{ partOfSpeech: "verb", definition: "cause to feel isolated" }] },
    { word: "align", phonetic: "/əˈlaɪn/", translation: "使一致，排列", definitions: [{ partOfSpeech: "verb", definition: "place in a straight line" }] },
    { word: "allegation", phonetic: "/ˌæləˈɡeɪʃn/", translation: "指控，断言", definitions: [{ partOfSpeech: "noun", definition: "a claim without proof" }] },
    { word: "allege", phonetic: "/əˈledʒ/", translation: "宣称，断言", definitions: [{ partOfSpeech: "verb", definition: "claim without proof" }] },
    { word: "allegedly", phonetic: "/əˈledʒɪdli/", translation: "据称", definitions: [{ partOfSpeech: "adverb", definition: "used to describe an unproven claim" }] },
    { word: "alleviate", phonetic: "/əˈliːvieɪt/", translation: "减轻，缓解", definitions: [{ partOfSpeech: "verb", definition: "make less severe" }] },
    { word: "allocate", phonetic: "/ˈæləkeɪt/", translation: "分配", definitions: [{ partOfSpeech: "verb", definition: "distribute for a particular purpose" }] },
    { word: "allot", phonetic: "/əˈlɒt/", translation: "分配，拨给", definitions: [{ partOfSpeech: "verb", definition: "give as a share" }] },
    { word: "ally", phonetic: "/ˈælaɪ/", translation: "同盟国，盟友", definitions: [{ partOfSpeech: "noun", definition: "a state formally cooperating with another" }] },
    { word: "ambiguous", phonetic: "/æmˈbɪɡjuəs/", translation: "模糊的", definitions: [{ partOfSpeech: "adjective", definition: "open to more than one interpretation" }] },
    { word: "ambitious", phonetic: "/æmˈbɪʃəs/", translation: "有雄心的", definitions: [{ partOfSpeech: "adjective", definition: "having a strong desire for success" }] },
    { word: "amend", phonetic: "/əˈmend/", translation: "修正，改善", definitions: [{ partOfSpeech: "verb", definition: "make changes to improve" }] },
    { word: "analogy", phonetic: "/əˈnælədʒi/", translation: "类比", definitions: [{ partOfSpeech: "noun", definition: "a comparison between two things" }] },
    { word: "anonymous", phonetic: "/əˈnɒnɪməs/", translation: "匿名的", definitions: [{ partOfSpeech: "adjective", definition: "not identified by name" }] },
    { word: "antagonism", phonetic: "/ænˈtæɡənɪzəm/", translation: "对抗，敌意", definitions: [{ partOfSpeech: "noun", definition: "active hostility" }] },
    { word: "anticipation", phonetic: "/ænˌtɪsɪˈpeɪʃn/", translation: "预期，期望", definitions: [{ partOfSpeech: "noun", definition: "the action of anticipating" }] },
    { word: "antique", phonetic: "/ænˈtiːk/", translation: "古董，古老的", definitions: [{ partOfSpeech: "noun", definition: "a collectable old object" }] },
    { word: "apparatus", phonetic: "/ˌæpəˈreɪtəs/", translation: "器械，设备", definitions: [{ partOfSpeech: "noun", definition: "equipment for a particular purpose" }] },
    // 继续添加更多CET6词汇...
  ],
  
  // 初中英语核心词汇
  junior: [
    { word: "ability", phonetic: "/əˈbɪləti/", translation: "能力", definitions: [{ partOfSpeech: "noun", definition: "the power to do something" }] },
    { word: "able", phonetic: "/ˈeɪbl/", translation: "能够的", definitions: [{ partOfSpeech: "adjective", definition: "having the power to do something" }] },
    { word: "about", phonetic: "/əˈbaʊt/", translation: "关于，大约", definitions: [{ partOfSpeech: "preposition", definition: "on the subject of" }] },
    { word: "above", phonetic: "/əˈbʌv/", translation: "在...上面", definitions: [{ partOfSpeech: "preposition", definition: "at a higher level than" }] },
    { word: "abroad", phonetic: "/əˈbrɔːd/", translation: "在国外", definitions: [{ partOfSpeech: "adverb", definition: "in or to a foreign country" }] },
    { word: "accept", phonetic: "/əkˈsept/", translation: "接受", definitions: [{ partOfSpeech: "verb", definition: "receive willingly" }] },
    { word: "accident", phonetic: "/ˈæksɪdənt/", translation: "事故", definitions: [{ partOfSpeech: "noun", definition: "an unfortunate event" }] },
    { word: "according", phonetic: "/əˈkɔːdɪŋ/", translation: "根据", definitions: [{ partOfSpeech: "preposition", definition: "as stated by" }] },
    { word: "achieve", phonetic: "/əˈtʃiːv/", translation: "达到，完成", definitions: [{ partOfSpeech: "verb", definition: "successfully bring about" }] },
    { word: "across", phonetic: "/əˈkrɒs/", translation: "穿过", definitions: [{ partOfSpeech: "preposition", definition: "from one side to the other" }] },
    { word: "act", phonetic: "/ækt/", translation: "行动，表演", definitions: [{ partOfSpeech: "verb", definition: "take action" }] },
    { word: "action", phonetic: "/ˈækʃn/", translation: "行动", definitions: [{ partOfSpeech: "noun", definition: "the process of doing something" }] },
    { word: "active", phonetic: "/ˈæktɪv/", translation: "积极的", definitions: [{ partOfSpeech: "adjective", definition: "engaging in physical activity" }] },
    { word: "activity", phonetic: "/ækˈtɪvəti/", translation: "活动", definitions: [{ partOfSpeech: "noun", definition: "the condition of being active" }] },
    { word: "actor", phonetic: "/ˈæktər/", translation: "演员", definitions: [{ partOfSpeech: "noun", definition: "a person who acts in plays" }] },
    { word: "actress", phonetic: "/ˈæktrəs/", translation: "女演员", definitions: [{ partOfSpeech: "noun", definition: "a female actor" }] },
    { word: "actual", phonetic: "/ˈæktʃuəl/", translation: "实际的", definitions: [{ partOfSpeech: "adjective", definition: "existing in fact" }] },
    { word: "actually", phonetic: "/ˈæktʃuəli/", translation: "实际上", definitions: [{ partOfSpeech: "adverb", definition: "in fact" }] },
    { word: "add", phonetic: "/æd/", translation: "添加", definitions: [{ partOfSpeech: "verb", definition: "join to something else" }] },
    { word: "address", phonetic: "/əˈdres/", translation: "地址", definitions: [{ partOfSpeech: "noun", definition: "the particulars of a place" }] },
    // 继续添加更多初中词汇...
  ],
  
  // 高中英语核心词汇  
  senior: [
    { word: "abandon", phonetic: "/əˈbændən/", translation: "放弃", definitions: [{ partOfSpeech: "verb", definition: "give up completely" }] },
    { word: "abnormal", phonetic: "/æbˈnɔːml/", translation: "不正常的", definitions: [{ partOfSpeech: "adjective", definition: "deviating from normal" }] },
    { word: "abolish", phonetic: "/əˈbɒlɪʃ/", translation: "废除", definitions: [{ partOfSpeech: "verb", definition: "formally put an end to" }] },
    { word: "abortion", phonetic: "/əˈbɔːʃn/", translation: "流产", definitions: [{ partOfSpeech: "noun", definition: "termination of pregnancy" }] },
    { word: "absolute", phonetic: "/ˈæbsəluːt/", translation: "绝对的", definitions: [{ partOfSpeech: "adjective", definition: "not qualified" }] },
    { word: "absorb", phonetic: "/əbˈzɔːb/", translation: "吸收", definitions: [{ partOfSpeech: "verb", definition: "take in" }] },
    { word: "abstract", phonetic: "/ˈæbstrækt/", translation: "抽象的", definitions: [{ partOfSpeech: "adjective", definition: "existing in thought" }] },
    { word: "absurd", phonetic: "/əbˈsɜːd/", translation: "荒谬的", definitions: [{ partOfSpeech: "adjective", definition: "wildly unreasonable" }] },
    { word: "abundant", phonetic: "/əˈbʌndənt/", translation: "丰富的", definitions: [{ partOfSpeech: "adjective", definition: "existing in large quantities" }] },
    { word: "abuse", phonetic: "/əˈbjuːz/", translation: "滥用", definitions: [{ partOfSpeech: "verb", definition: "use wrongly" }] },
    // 继续添加更多高中词汇...
  ],
  
  // 托福核心词汇
  toefl: [
    { word: "abandon", phonetic: "/əˈbændən/", translation: "放弃，遗弃", definitions: [{ partOfSpeech: "verb", definition: "give up completely" }] },
    { word: "abbreviate", phonetic: "/əˈbriːvieɪt/", translation: "缩写，缩短", definitions: [{ partOfSpeech: "verb", definition: "shorten a word" }] },
    { word: "abide", phonetic: "/əˈbaɪd/", translation: "遵守，忍受", definitions: [{ partOfSpeech: "verb", definition: "accept or act in accordance with" }] },
    { word: "abolish", phonetic: "/əˈbɒlɪʃ/", translation: "废除，取消", definitions: [{ partOfSpeech: "verb", definition: "formally put an end to" }] },
    { word: "abound", phonetic: "/əˈbaʊnd/", translation: "大量存在", definitions: [{ partOfSpeech: "verb", definition: "exist in large numbers" }] },
    { word: "abrupt", phonetic: "/əˈbrʌpt/", translation: "突然的，唐突的", definitions: [{ partOfSpeech: "adjective", definition: "sudden and unexpected" }] },
    { word: "absorb", phonetic: "/əbˈzɔːb/", translation: "吸收，使全神贯注", definitions: [{ partOfSpeech: "verb", definition: "take in" }] },
    { word: "abstain", phonetic: "/əbˈsteɪn/", translation: "戒除，弃权", definitions: [{ partOfSpeech: "verb", definition: "restrain oneself" }] },
    { word: "abstract", phonetic: "/ˈæbstrækt/", translation: "抽象的，摘要", definitions: [{ partOfSpeech: "adjective", definition: "existing in thought only" }] },
    { word: "absurd", phonetic: "/əbˈsɜːd/", translation: "荒谬的，可笑的", definitions: [{ partOfSpeech: "adjective", definition: "wildly unreasonable" }] },
    { word: "abundant", phonetic: "/əˈbʌndənt/", translation: "丰富的，充裕的", definitions: [{ partOfSpeech: "adjective", definition: "existing in large quantities" }] },
    { word: "accelerate", phonetic: "/əkˈseləreɪt/", translation: "加速，促进", definitions: [{ partOfSpeech: "verb", definition: "increase in speed" }] },
    { word: "accessible", phonetic: "/əkˈsesəbl/", translation: "可接近的，可使用的", definitions: [{ partOfSpeech: "adjective", definition: "able to be reached" }] },
    { word: "accommodate", phonetic: "/əˈkɒmədeɪt/", translation: "容纳，适应", definitions: [{ partOfSpeech: "verb", definition: "provide lodging for" }] },
    { word: "accompany", phonetic: "/əˈkʌmpəni/", translation: "陪伴，伴随", definitions: [{ partOfSpeech: "verb", definition: "go somewhere with" }] },
    // 继续添加更多托福词汇...
  ],
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dictionary, action } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "list") {
      // 列出所有可用词库
      const availableDictionaries = Object.keys(DICTIONARIES).map(key => ({
        id: key,
        name: key.toUpperCase(),
        count: DICTIONARIES[key].length,
      }));
      
      return new Response(
        JSON.stringify({ dictionaries: availableDictionaries }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "import" && dictionary) {
      const words = DICTIONARIES[dictionary];
      
      if (!words) {
        return new Response(
          JSON.stringify({ error: `Dictionary "${dictionary}" not found` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 批量插入单词
      const batchSize = 100;
      let imported = 0;
      let skipped = 0;

      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize).map(w => ({
          word: w.word.toLowerCase(),
          phonetic: w.phonetic,
          translation: w.translation,
          definitions: w.definitions,
        }));

        const { error } = await supabase
          .from("word_cache")
          .upsert(batch, { onConflict: "word", ignoreDuplicates: true });

        if (error) {
          console.error("Batch insert error:", error);
          skipped += batch.length;
        } else {
          imported += batch.length;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          dictionary,
          total: words.length,
          imported,
          skipped,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "import-all") {
      // 导入所有词库
      let totalImported = 0;
      const results: Record<string, number> = {};

      for (const [dictName, words] of Object.entries(DICTIONARIES)) {
        const batchSize = 100;
        let imported = 0;

        for (let i = 0; i < words.length; i += batchSize) {
          const batch = words.slice(i, i + batchSize).map(w => ({
            word: w.word.toLowerCase(),
            phonetic: w.phonetic,
            translation: w.translation,
            definitions: w.definitions,
          }));

          const { error } = await supabase
            .from("word_cache")
            .upsert(batch, { onConflict: "word", ignoreDuplicates: true });

          if (!error) {
            imported += batch.length;
          }
        }

        results[dictName] = imported;
        totalImported += imported;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          totalImported,
          details: results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'list', 'import', or 'import-all'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
