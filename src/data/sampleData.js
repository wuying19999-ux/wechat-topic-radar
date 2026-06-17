import { schoolCountryMap } from "./schoolKnowledge";

export const schools = [
  "UCL",
  "KCL",
  "曼彻斯特大学",
  "布里斯托大学",
  "华威大学",
  "格拉斯哥大学",
  "杜伦大学",
  "谢菲大学",
  "悉尼大学",
  "墨尔本大学",
  "香港综合",
  "香港理工大学",
];

export const countries = ["英国", "澳大利亚", "中国香港", "新加坡", "加拿大"];

export const getDefaultCountryForSchool = (school) => schoolCountryMap[school] || countries[0];

export const groupModules = [
  {
    id: "alumni",
    name: "校友群",
    shortName: "校友",
    description: "Offer、入学准备、学长学姐经验与新生破冰",
    toneHint: "经验感强，降低紧张感，适合轻互动",
    accent: "teal",
  },
  {
    id: "flight",
    name: "飞友群",
    shortName: "飞友",
    description: "找同航班、接机、行李、转机与落地安排",
    toneHint: "时间节点明确，适合快速配对",
    accent: "sky",
  },
  {
    id: "secondhand",
    name: "二手群",
    shortName: "二手",
    description: "行李、床品、小家电、搬家甩卖与安全交易",
    toneHint: "实用、价格敏感，避免强销售",
    accent: "amber",
  },
  {
    id: "college",
    name: "各学院群",
    shortName: "学院",
    description: "专业课、选课、导师、reading list 与同专业社交",
    toneHint: "专业相关，鼓励信息互助",
    accent: "indigo",
  },
  {
    id: "language",
    name: "语言班",
    shortName: "语言",
    description: "语言班签到、口语搭子、住宿衔接与情绪陪伴",
    toneHint: "陪伴感强，适合低门槛提问",
    accent: "rose",
  },
  {
    id: "ai-safety",
    name: "AI 安全",
    shortName: "安全",
    description: "AI 指控、相似度、学术诚信、课堂纪律与邮件沟通",
    toneHint: "只做风险提醒和官方路径引导，不提供规避检测或违规方案",
    accent: "violet",
  },
];

export const activityOptions = ["高", "中", "低"];

export const effectOptions = ["未选择", "好", "一般", "差"];

export const timeNodeOptions = [
  "5月底：找飞友/找室友/二手准备",
  "6月：押金、宿舍、语言班确认",
  "7月：签证、机票、行李清单",
  "8月：落地、接机、临时住宿",
  "开学前两周：选课、注册、社交破冰",
];

export const newsMaterialPool = [
  {
    id: "news-01",
    date: "近7天",
    label: "出行",
    material: "机票价格、转机时长和行李额变化容易引发新生讨论",
    lowRiskAngle: "只讨论个人经验和准备清单，不给确定性承诺",
  },
  {
    id: "news-02",
    date: "近7天",
    label: "租房",
    material: "学生公寓和合租信息进入集中比较期",
    lowRiskAngle: "引导大家分享看房关注点，避开推荐具体中介",
  },
  {
    id: "news-03",
    date: "近7天",
    label: "安全",
    material: "夜间出行、诈骗提醒、二手交易安全常被讨论",
    lowRiskAngle: "以提醒和经验交换为主，不制造恐慌",
  },
  {
    id: "news-04",
    date: "近7天",
    label: "生活",
    material: "落地后的电话卡、银行卡、超市和做饭成本是高频痛点",
    lowRiskAngle: "转成清单型话题，让群友补充真实经验",
  },
  {
    id: "news-05",
    date: "近7天",
    label: "校园",
    material: "注册、选课、reading list 和语言班安排开始被密集询问",
    lowRiskAngle: "鼓励大家先看官网，再交流实际操作细节",
  },
];

export const lifePainPoints = [
  "饮食适应",
  "合租沟通",
  "夜间安全",
  "行李取舍",
  "社交破冰",
  "情绪波动",
  "预算控制",
  "课堂适应",
];

export const topicBlueprints = {
  alumni: [
    {
      title: "刚拿 offer 的同学现在最该先确认哪三件事？",
      pain: "信息过载",
      chase: "大家现在更想先确认押金、宿舍还是签证材料？",
    },
    {
      title: "有没有学长学姐愿意分享第一周最有用的校园服务？",
      pain: "校园适应",
      chase: "你最想提前知道图书馆、学生中心还是学院办公室？",
    },
    {
      title: "新生第一次到校，哪些社交活动值得去？",
      pain: "社交破冰",
      chase: "你会更想参加学院活动、社团活动还是同乡饭局？",
    },
    {
      title: "开学前 reading list 要不要提前看？",
      pain: "课堂适应",
      chase: "大家更担心听不懂课，还是跟不上阅读量？",
    },
    {
      title: "银行卡和电话卡，落地后先办哪个更顺？",
      pain: "落地生活",
      chase: "有没有人已经整理过自己的落地第一天清单？",
    },
    {
      title: "预算有限的新生，第一月哪些东西可以先不买？",
      pain: "预算控制",
      chase: "大家的第一月预算大概准备了多少？",
    },
    {
      title: "遇到情绪低谷时，学校里有哪些支持渠道可以先了解？",
      pain: "情绪波动",
      chase: "你觉得最需要提前准备的是朋友支持还是学校资源？",
    },
    {
      title: "从国内学习节奏切到国外课堂，最容易不适应的是哪一点？",
      pain: "课堂适应",
      chase: "你更怕 presentation、essay 还是小组讨论？",
    },
  ],
  flight: [
    {
      title: "5月底开始找飞友，大家更看重同航班还是同落地时间？",
      pain: "独自出行",
      chase: "你现在机票定了吗，还是还在比价格？",
    },
    {
      title: "第一次长途转机，哪些东西一定要放随身包？",
      pain: "行李取舍",
      chase: "大家随身包会放转换插头、药品还是文件夹？",
    },
    {
      title: "落地后接机、打车、地铁，哪种更适合新生第一天？",
      pain: "落地安全",
      chase: "如果有人同一天到，你会愿意拼车吗？",
    },
    {
      title: "行李额只有 23kg 的话，哪些东西别从国内带？",
      pain: "行李取舍",
      chase: "你行李里最纠结带不带的东西是什么？",
    },
    {
      title: "红眼航班落地后，临时住宿怎么安排更安心？",
      pain: "住宿衔接",
      chase: "有人是提前一天到，还是直接入住学生公寓？",
    },
    {
      title: "找飞友时，哪些个人信息不建议直接公开在群里？",
      pain: "安全防诈骗",
      chase: "大家更愿意私聊核对航班，还是群里建表？",
    },
    {
      title: "同一城市不同机场落地，后续交通差别大吗？",
      pain: "交通规划",
      chase: "你会为了便宜机票接受更远机场吗？",
    },
    {
      title: "爸妈送机和自己出发，准备清单会有什么不同？",
      pain: "情绪波动",
      chase: "你更担心出发当天遗漏东西，还是落地后找不到路？",
    },
  ],
  secondhand: [
    {
      title: "二手群现在最值得提前蹲的是小家电还是床品？",
      pain: "预算控制",
      chase: "大家第一件想买的二手物品是什么？",
    },
    {
      title: "买二手锅具、台灯、显示器时，哪些细节一定要问清楚？",
      pain: "交易安全",
      chase: "你会更在意价格、成色还是取货距离？",
    },
    {
      title: "落地后第一周，哪些东西临时买比从国内带划算？",
      pain: "行李取舍",
      chase: "你现在箱子里最占空间的东西是什么？",
    },
    {
      title: "二手交易怎么避免跑空和临时涨价？",
      pain: "沟通成本",
      chase: "你会接受先付定金吗，还是只现场交易？",
    },
    {
      title: "搬家季甩卖信息多，怎样判断是不是适合新生入手？",
      pain: "信息筛选",
      chase: "大家看到二手帖会先问尺寸、照片还是使用时长？",
    },
    {
      title: "哪些二手物品不建议买，直接买新的更安心？",
      pain: "卫生安全",
      chase: "床垫、厨具、耳机这类你会怎么选？",
    },
    {
      title: "同城自取太远的话，拼车取货划算吗？",
      pain: "交通成本",
      chase: "有人愿意按区域建一个取货互助表吗？",
    },
    {
      title: "二手群发帖怎样写，别人更容易回复？",
      pain: "社交效率",
      chase: "你觉得标题里最该写价格、区域还是图片？",
    },
  ],
  college: [
    {
      title: "同学院新生现在最需要提前找同专业搭子吗？",
      pain: "专业社交",
      chase: "大家愿意按专业方向接龙认识一下吗？",
    },
    {
      title: "选课前最该问清楚的是考核方式还是上课时间？",
      pain: "选课不确定",
      chase: "你更怕考试课、论文课还是小组作业？",
    },
    {
      title: "reading list 很长时，怎么判断哪些先读？",
      pain: "阅读压力",
      chase: "有没有同学已经拿到 module handbook？",
    },
    {
      title: "第一次给导师/学院发邮件，语气要多正式？",
      pain: "沟通边界",
      chase: "你现在最想问学院的问题是什么？",
    },
    {
      title: "小组作业最容易踩坑的分工方式是什么？",
      pain: "协作压力",
      chase: "你偏好先定 deadline，还是先定每个人负责的部分？",
    },
    {
      title: "同专业资料共享，哪些内容适合公开发群里？",
      pain: "资料边界",
      chase: "大家更需要课程介绍、参考书还是往年经验？",
    },
    {
      title: "跨专业入学，开学前需要补哪些基础？",
      pain: "背景差异",
      chase: "你是本专业延续还是跨专业申请？",
    },
    {
      title: "学院 welcome week 活动，去之前要准备自我介绍吗？",
      pain: "社交破冰",
      chase: "你会想认识中国同学多一点，还是国际同学多一点？",
    },
  ],
  language: [
    {
      title: "语言班开始前，口语搭子要怎么找才不尴尬？",
      pain: "口语练习",
      chase: "大家愿意按时区约一次 20 分钟练习吗？",
    },
    {
      title: "线上语言班和线下语言班，最不一样的压力点是什么？",
      pain: "学习节奏",
      chase: "你更担心出勤、presentation 还是写作反馈？",
    },
    {
      title: "语言班期间住宿怎么衔接正式开学最稳？",
      pain: "住宿衔接",
      chase: "有人语言班和正课住同一个地方吗？",
    },
    {
      title: "刚进语言班，怎么判断老师反馈里哪些最重要？",
      pain: "反馈吸收",
      chase: "你最想提升口语、写作还是听课反应？",
    },
    {
      title: "语言班同学第一次线下见面，适合约什么低压力活动？",
      pain: "社交破冰",
      chase: "咖啡、超市采购、校园散步，你更愿意哪个？",
    },
    {
      title: "语言班作业和正课预习冲突时，怎么排优先级？",
      pain: "时间管理",
      chase: "你现在每天能稳定留出多久学习？",
    },
    {
      title: "听不懂口音的时候，怎么问不会显得冒犯？",
      pain: "课堂沟通",
      chase: "大家有没有好用的英文表达可以互相补充？",
    },
    {
      title: "语言班期间情绪起伏大，怎样和同学互相支持？",
      pain: "情绪波动",
      chase: "你希望群里多一点学习打卡，还是生活分享？",
    },
  ],
  "ai-safety": [
    {
      title: "作业能不能用 AI，哪些说法适合在群里提醒？",
      pain: "学术诚信边界",
      chase: "大家现在更担心相似度、引用，还是老师是否允许用 AI？",
    },
    {
      title: "被问到 Turnitin / 相似度时，群里怎么回更安全？",
      pain: "风险误导",
      chase: "有没有同学已经看到课程 handbook 里对 AI 的要求？",
    },
    {
      title: "收到 AI 指控邮件，第一步应该先看什么？",
      pain: "申诉焦虑",
      chase: "大家愿意把官方页面/邮件关键词发出来互相对一下吗？",
    },
    {
      title: "课堂和考试里哪些 AI 使用方式不能随便建议？",
      pain: "纪律边界",
      chase: "你们课程说明里有没有写 AI tools / academic integrity？",
    },
    {
      title: "引用和改写不确定时，怎么问群里不会带偏？",
      pain: "写作规范",
      chase: "有人整理过自己学院的引用格式要求吗？",
    },
  ],
};

export const initialPublishedTopics = {
  alumni: ["刚拿 offer 的同学现在最该先确认哪三件事？"],
  flight: ["5月底开始找飞友，大家更看重同航班还是同落地时间？"],
  secondhand: ["二手群现在最值得提前蹲的是小家电还是床品？"],
  college: [],
  language: [],
  "ai-safety": [],
};
