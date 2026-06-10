// 사주 계산 로직 (Python compatibility.py 포팅)

const CHEONGAN = ["갑","을","병","정","무","기","경","신","임","계"];
const JIJI     = ["자","축","인","묘","진","사","오","미","신","유","술","해"];

const JEOLGI = {
  1:[6,"축"], 2:[4,"인"], 3:[6,"묘"],  4:[5,"진"],
  5:[6,"사"], 6:[6,"오"], 7:[7,"미"],  8:[7,"신"],
  9:[8,"유"], 10:[8,"술"],11:[7,"해"], 12:[7,"자"],
};

const HOUR_JI_TABLE = [
  [23,1,"자"],[1,3,"축"],[3,5,"인"],[5,7,"묘"],
  [7,9,"진"],[9,11,"사"],[11,13,"오"],[13,15,"미"],
  [15,17,"신"],[17,19,"유"],[19,21,"술"],[21,23,"해"],
];

const GAN_OHAENG = {갑:"木",을:"木",병:"火",정:"火",무:"土",기:"土",경:"金",신:"金",임:"水",계:"水"};
const JI_OHAENG  = {자:"水",축:"土",인:"木",묘:"木",진:"土",사:"火",오:"火",미:"土",신:"金",유:"金",술:"土",해:"水"};

const WOL_GAN_BASE = [2, 4, 6, 8, 0]; // 갑기·을경·병신·정임·무계

function monthJi(month, day) {
  const [jeolgiDay, ji] = JEOLGI[month];
  if (day < jeolgiDay) {
    const prev = month === 1 ? 12 : month - 1;
    return JEOLGI[prev][1];
  }
  return ji;
}

function dayPillar(year, month, day) {
  let y = year, m = month;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + day + B - 1524;
  return [CHEONGAN[(jd+6)%10], JIJI[(jd+8)%12]];
}

function hourJi(hour) {
  if (hour >= 23 || hour < 1) return "자";
  for (const [s, e, ji] of HOUR_JI_TABLE) {
    if (hour >= s && hour < e) return ji;
  }
  return "자";
}

function monthGan(yeonGan, wolJi) {
  const idx = CHEONGAN.indexOf(yeonGan);
  const base = WOL_GAN_BASE[idx % 5];
  const wolOrder = ["인","묘","진","사","오","미","신","유","술","해","자","축"];
  const wolNum = wolOrder.indexOf(wolJi);
  return CHEONGAN[(base + wolNum) % 10];
}

function hourGan(ilGan, siJi) {
  const idx = CHEONGAN.indexOf(ilGan);
  const base = (idx % 5) * 2;
  const siOrder = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
  const siNum = siOrder.indexOf(siJi);
  return CHEONGAN[(base + siNum) % 10];
}

function calcOhaeng(pillars) {
  const counts = {木:0, 火:0, 土:0, 金:0, 水:0};
  for (const p of Object.values(pillars)) {
    if (!p) continue;
    if (p.gan && GAN_OHAENG[p.gan]) counts[GAN_OHAENG[p.gan]]++;
    if (p.ji  && JI_OHAENG[p.ji])   counts[JI_OHAENG[p.ji]]++;
  }
  const total = Object.values(counts).reduce((a,b)=>a+b, 0);
  const lacking = Object.keys(counts).filter(k => counts[k] === 0);
  const dominant = Object.keys(counts).reduce((a,b) => counts[a]>=counts[b]?a:b);
  return { counts, total, lacking, dominant };
}

function calcAllPillars(year, month, day, hour) {
  const [ilGan, ilJi] = dayPillar(year, month, day);
  const yeonGan = CHEONGAN[(year - 4) % 10];
  const yeonJi  = JIJI[(year - 4) % 12];
  const wolJi   = monthJi(month, day);
  const wolGan  = monthGan(yeonGan, wolJi);

  let siGan = null, siJi = null;
  if (hour !== null && hour !== undefined) {
    siJi  = hourJi(hour);
    siGan = hourGan(ilGan, siJi);
  }

  const pillars = {
    yeonju: { gan: yeonGan, ji: yeonJi },
    wolju:  { gan: wolGan,  ji: wolJi  },
    ilju:   { gan: ilGan,   ji: ilJi   },
    siju:   siGan ? { gan: siGan, ji: siJi } : null,
  };

  return { pillars, ohaeng: calcOhaeng(pillars) };
}

// 일간별 기본 해석
const ILGAN_DESC = {
  갑: "갑목(甲木) — 우뚝 선 나무처럼 곧고 진취적인 기질입니다. 리더십이 강하고 독립심이 뛰어나며, 새로운 것을 개척하는 것을 즐깁니다.",
  을: "을목(乙木) — 부드러운 풀처럼 유연하고 적응력이 강합니다. 섬세한 감수성과 예술적 감각을 타고났으며, 인간관계에 능합니다.",
  병: "병화(丙火) — 태양처럼 밝고 따뜻한 성격입니다. 외향적이고 활동적이며, 주변을 환하게 비추는 매력이 있습니다.",
  정: "정화(丁火) — 촛불처럼 은은하고 깊은 내면을 지녔습니다. 집중력이 강하고 신중하며, 한 분야에서 전문성을 발휘합니다.",
  무: "무토(戊土) — 넓은 대지처럼 포용력이 크고 안정적입니다. 신뢰감과 책임감이 강하며, 중심을 지키는 능력이 탁월합니다.",
  기: "기토(己土) — 옥토처럼 실용적이고 현실적입니다. 꼼꼼하고 세심하며, 주변 사람들을 잘 챙기는 배려심이 깊습니다.",
  경: "경금(庚金) — 강철처럼 의지가 굳고 결단력이 있습니다. 원칙을 중시하고 공정함을 추구하며, 목표를 향해 뚝심 있게 나아갑니다.",
  신: "신금(辛金) — 세공된 보석처럼 예리하고 섬세합니다. 완벽주의적 성향이 있으며, 미적 감각과 분석력이 뛰어납니다.",
  임: "임수(壬水) — 큰 강처럼 지혜롭고 유연합니다. 포용력이 넓고 창의적이며, 상황에 맞게 유연하게 대처하는 능력이 있습니다.",
  계: "계수(癸水) — 맑은 샘물처럼 깊고 순수합니다. 직관력과 감수성이 뛰어나며, 내면의 풍요로움과 지혜를 지녔습니다.",
};
