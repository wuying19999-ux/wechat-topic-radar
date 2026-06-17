export const schoolCountryMap = {
  UCL: "英国",
  KCL: "英国",
  曼彻斯特大学: "英国",
  布里斯托大学: "英国",
  华威大学: "英国",
  格拉斯哥大学: "英国",
  杜伦大学: "英国",
  谢菲大学: "英国",
  悉尼大学: "澳大利亚",
  墨尔本大学: "澳大利亚",
  香港综合: "中国香港",
  香港理工大学: "中国香港",
};

export const schoolKnowledge = {
  UCL: {
    docSource: "UCL新生手册2026.docx",
    brief: "UCL 资料覆盖 CAS、Pre-enrolment、住宿优先名额、学生卡、Moodle/Portico、GP 与 2026/27 校历。",
    facts: [
      {
        id: "ucl-pre-enrolment",
        label: "Pre-enrolment",
        categories: ["alumni", "college"],
        text: "资料显示 UCL 新生收到邀请后要在 Portico 完成 Pre-enrolment，创建 UCL 账户、上传身份/签证文件并等待审核确认。",
      },
      {
        id: "ucl-accommodation",
        label: "住宿节点",
        categories: ["alumni", "secondhand"],
        text: "资料写到 UCL 本科住宿优先/保障节点为 6 月 10 日前申请；全日制国际研究生第一年符合条件并于 6 月 30 日前申请可获优先分配。",
      },
      {
        id: "ucl-term",
        label: "2026/27 校历",
        categories: ["college", "language"],
        text: "UCL 2026/27 Term 1 为 2026 年 9 月 28 日至 12 月 18 日，Reading Week 为 2026 年 11 月 9 日。",
      },
      {
        id: "ucl-life",
        label: "落地生活",
        categories: ["flight", "alumni"],
        text: "资料建议到校后领取 student ID card，开通 Eduroam、MFA、Moodle、Portico、UCL Go，并尽早注册 GP。",
      },
    ],
    webSources: [
      {
        label: "UCL Term dates and closures",
        url: "https://www.ucl.ac.uk/study/current-students/life-ucl/term-dates-and-closures",
        note: "官方页列出 2026/27 Term 1、Term 2、Term 3 与 Reading Weeks。",
      },
      {
        label: "UCL Pre-enrolment stages",
        url: "https://www.ucl.ac.uk/study/current-students/new-students/your-journey-joining-ucl/pre-enrolment-stages-new-students",
        note: "官方页说明 Pre-enrolment 需要确认个人信息、上传 ID/签证文件并处理费用条款。",
      },
    ],
  },
  KCL: {
    docSource: "伦敦国王学院资料汇总.docx",
    brief: "KCL 资料覆盖 CAS/签证、学费、宿舍 check-in、校历、语言班、选课、学生卡与常用 App。",
    facts: [
      {
        id: "kcl-cas",
        label: "CAS 与签证",
        categories: ["alumni", "flight"],
        text: "资料写到 KCL 通常在开学日期前约 3 个月签发 CAS；收到后要核对 King's Apply 里的信息，有错立刻联系学校。",
      },
      {
        id: "kcl-calendar",
        label: "Welcome to King's",
        categories: ["alumni", "college"],
        text: "资料和官方检索结果显示 2026/27 学年 Welcome to King's 约为 2026 年 9 月 14 日至 9 月 25 日，教学从 9 月下旬开始。",
      },
      {
        id: "kcl-moving",
        label: "宿舍入住",
        categories: ["flight", "secondhand"],
        text: "资料与官方住宿页都提到入住前需完成线上 induction，再预约 arrival slot；KCL 宿舍接待通常 24/7 可 check-in。",
      },
      {
        id: "kcl-card",
        label: "学生卡领取",
        categories: ["alumni", "college"],
        text: "资料写到领取学生证前要完成在线注册、Consent Matters 培训和 Right to Study check；通过后预约到 Strand Campus/Bush House 领取。",
      },
      {
        id: "kcl-language",
        label: "语言班节点",
        categories: ["language"],
        text: "资料列出 KCL 2026 语言班有 6 周、11 周、16 周等不同形式，申请和缴费以 offer 内 deadline 为准。",
      },
    ],
    webSources: [
      {
        label: "KCL Moving in",
        url: "https://www.kcl.ac.uk/accommodation/living-with-us/moving-in",
        note: "官方住宿页说明 compulsory online induction、book arrival slot、join online community 与住宿费分期日期。",
      },
      {
        label: "KCL Academic Calendar FAQ",
        url: "https://self-service.kcl.ac.uk/article/KA-01913/en-us?page=10",
        note: "KCL Student Services Online 给出 2026/27 academic year 与 Welcome to King's 日期。",
      },
    ],
  },
  曼彻斯特大学: {
    docSource: "曼彻斯特大学资料汇总.docx",
    brief: "曼大资料覆盖 MyManchester、CAS、GP/学生卡、住宿、选课、机场交通、安全号码与租房区域。",
    facts: [
      {
        id: "manchester-registration",
        label: "MyManchester 注册",
        categories: ["alumni", "college"],
        text: "资料写到曼大新生要激活 IT 账号并注册 MyManchester；注册月未完成可能产生逾期费用，课程和缴费信息也会走学校邮箱。",
      },
      {
        id: "manchester-key-dates",
        label: "2026/27 Key dates",
        categories: ["college", "alumni"],
        text: "官方 key dates 显示曼大 2026/27 Welcome Week 为 2026 年 9 月 21 日至 25 日，Semester 1 从 9 月 28 日开始。",
      },
      {
        id: "manchester-airport",
        label: "机场到校",
        categories: ["flight"],
        text: "资料写到从曼彻斯特机场到学校可乘 train 到 Piccadilly/Oxford Road，或打车约 20 分钟；从 Heathrow 到曼大更适合提前规划火车/coach。",
      },
      {
        id: "manchester-rent",
        label: "租房区域",
        categories: ["secondhand"],
        text: "资料提到 Fallowfield 学生多、租金较低但较吵；Withington 更安静；Rusholme 靠近 Oxford Road 且餐馆多。",
      },
      {
        id: "manchester-safety",
        label: "安全与求助",
        categories: ["flight", "alumni", "secondhand"],
        text: "资料提醒打车尽量用有执照出租车或 Uber/Gett，紧急情况 999/112，非紧急报警 101，非生命危险医疗建议拨 111。",
      },
    ],
    webSources: [
      {
        label: "University of Manchester Key dates",
        url: "https://www.manchester.ac.uk/about/key-dates/",
        note: "官方页列出 2026/27 Welcome Week、Semester dates、assessment 与 vacation。",
      },
      {
        label: "Get ready for Manchester",
        url: "https://www.welcome.manchester.ac.uk/get-ready/",
        note: "官方 welcome 入口用于新生注册、住宿、缴费和入学前事项核对。",
      },
    ],
  },
  布里斯托大学: {
    docSource: "布里斯托大学资料汇总.docx",
    brief: "布里斯托资料覆盖 CAS/eVisa、GP、银行、交通、住宿房型、校内外生活与社团。",
    facts: [
      {
        id: "bristol-cas",
        label: "CAS/eVisa",
        categories: ["alumni", "flight"],
        text: "资料写到布里斯托通常在 6-7 月发 CAS；办理 eVisa 后仍建议出入境随身带护照，并确保 UKVI 账户状态可查。",
      },
      {
        id: "bristol-guarantee",
        label: "住宿保障",
        categories: ["alumni", "secondhand"],
        text: "官方住宿 guarantee 页面显示，符合条件的新生需在 2026 年 6 月 30 日前申请住宿并 firm accept offer，才进入住宿保障范围。",
      },
      {
        id: "bristol-dates",
        label: "2026/27 日期",
        categories: ["college", "language"],
        text: "官方日期显示布里斯托 2026 Welcome Week 为 9 月 14 日至 18 日，Teaching block 1 为 9 月 21 日至 12 月 11 日。",
      },
      {
        id: "bristol-transport",
        label: "城市交通",
        categories: ["flight"],
        text: "资料写到布里斯托机场离市内约 30 分钟；市内常靠步行、Uber 和公交，学校在坡上，住市中心上课可能需要爬坡。",
      },
      {
        id: "bristol-life",
        label: "生活采购",
        categories: ["secondhand", "alumni"],
        text: "资料提到坡下 Cabot Circus 和市中心适合购物，坡上也有银行、Sainsbury、Waitrose、M&S、Boots 和中餐馆。",
      },
    ],
    webSources: [
      {
        label: "University of Bristol Dates",
        url: "https://www.bristol.ac.uk/university/dates/",
        note: "官方页列出 2026/27 Welcome week、Teaching blocks、assessment 与 vacation。",
      },
      {
        label: "Bristol Accommodation guarantee",
        url: "https://www.bristol.ac.uk/accommodation/apply/guarantee/",
        note: "官方页列出 guaranteed applicants 与 2026 年 6 月 30 日住宿申请节点。",
      },
    ],
  },
  华威大学: {
    docSource: "路觅教育 华威大学 新生手册 2026 水印版.docx",
    brief: "华威资料覆盖 offer/CAS、enrolment、学生卡、住宿、选课、机场交通、GP 与安全提醒。",
    facts: [
      {
        id: "warwick-cas",
        label: "CAS 时间",
        categories: ["alumni", "flight"],
        text: "资料写到华威 CAS 有效期 6 个月，学校一般会在学期开始前 3-4 个月发邮件提醒学生检查 CAS 信息。",
      },
      {
        id: "warwick-enrolment",
        label: "课程注册",
        categories: ["alumni", "college"],
        text: "资料写到华威课程注册通常在课程开始前 4-6 周内或接受 unconditional offer 后一周内开放，国际生需先获得签证才能完成注册。",
      },
      {
        id: "warwick-accommodation",
        label: "校内住宿",
        categories: ["secondhand", "alumni"],
        text: "资料显示华威校内住宿无需申请费或押金，租金通常包含水电、保险和 Wi-Fi；本科和研究生都有不同宿舍可选。",
      },
      {
        id: "warwick-airport",
        label: "到校机场",
        categories: ["flight"],
        text: "资料建议优先看伯明翰机场，距离华威最近，打车约 20 分钟；从 Heathrow/Gatwick 到校更适合提前订接机或大巴。",
      },
      {
        id: "warwick-gp",
        label: "GP 注册",
        categories: ["language", "alumni"],
        text: "资料建议用 NHS Find a GP 按学校或公寓邮编查找 GP，线上或线下注册，之后通过 NHS App、电话或 GP 网页预约。",
      },
    ],
    webSources: [
      {
        label: "Warwick Welcome",
        url: "https://warwick.ac.uk/students/together/welcome",
        note: "官方 welcome 入口包含 personalised checklist、enrolment、accommodation、international arrivals 与 Welcome Week 信息。",
      },
      {
        label: "Warwick Enrolment",
        url: "https://warwick.ac.uk/students/together/welcome/enrolment",
        note: "官方 enrolment 页面用于新生 IT、课程注册、费用和 Health Services 信息核对。",
      },
    ],
  },
  格拉斯哥大学: {
    docSource: "Glasgow 2026 新生手册（官网更新版）.docx",
    brief: "格拉斯哥资料是官网更新版，覆盖 2026/27 Session、GUID/MFA、MyCampus、Visa Registration、Campus Card、住宿费、SafeZone。",
    facts: [
      {
        id: "glasgow-session",
        label: "2026/27 Session",
        categories: ["college", "alumni"],
        text: "资料和官方 session dates 显示格拉斯哥 2026 Welcome Week 从 9 月 14 日开始，Semester 1 教学从 9 月 21 日开始。",
      },
      {
        id: "glasgow-registration",
        label: "GUID/MFA/MyCampus",
        categories: ["alumni", "college"],
        text: "资料写到收到 GUID 后要先设置 MFA，再进入 MyCampus 完成 Academic Registration 和 Financial Registration，并上传校园卡照片。",
      },
      {
        id: "glasgow-visa-card",
        label: "Visa Registration",
        categories: ["flight", "alumni"],
        text: "资料写到国际学生到英后需预约 Visa Registration；Campus Card 通常在该预约环节领取。",
      },
      {
        id: "glasgow-accommodation",
        label: "住宿预算",
        categories: ["secondhand"],
        text: "资料写到 2026/27 主合同期为 2026 年 9 月 11 日至 2027 年 6 月 11 日，费用通常包含 heating、utilities、Wi-Fi 和 insurance。",
      },
      {
        id: "glasgow-safezone",
        label: "SafeZone",
        categories: ["language", "alumni"],
        text: "资料强调 SafeZone 不只是安全 App，也用于 student visa holders 到校上课时 check in 记录出勤。",
      },
    ],
    webSources: [
      {
        label: "UofG Session 2026-27",
        url: "https://www.gla.ac.uk/myglasgow/apg/sessiondates/session2026-27/",
        note: "官方页列出 Welcome Week、Semester、exam、vacation 与 graduation 日期。",
      },
      {
        label: "UofG New Student Checklist",
        url: "https://www.gla.ac.uk/myglasgow/students/new/checklist/",
        note: "官方 checklist 覆盖账户、注册、住宿、费用、GP 与到校任务。",
      },
    ],
  },
  杜伦大学: {
    docSource: "杜伦大学聊天记录沉淀库-上传版.docx",
    brief: "杜伦聊天沉淀库覆盖学院宿舍、纽卡接机、伦敦转车、机票/学生票、CAS、生活费预算、做饭和二手用品。",
    facts: [
      {
        id: "durham-college-accommodation",
        label: "学院宿舍与住宿邮件",
        categories: ["alumni", "secondhand"],
        text: "聊天沉淀显示，杜伦学生会反复讨论学院宿舍分配、waitlist、Outlook 邮件、JB/South/Hatfield/Mary 等宿舍体验和房型差异。",
      },
      {
        id: "durham-newcastle-arrival",
        label: "纽卡到杜伦交通",
        categories: ["flight"],
        text: "聊天沉淀显示，学生会比较飞纽卡、飞伦敦再转 LNER、火车、接机、商务车、拼车和行李托运难度。",
      },
      {
        id: "durham-budget-cooking",
        label: "生活费与做饭",
        categories: ["alumni", "secondhand"],
        text: "6月聊天记录把雅思成绩提交、生活费预算、做饭、火锅底料、小绿锅、中超和二手预算连在一起讨论，语气偏生活化和轻松吐槽。",
      },
      {
        id: "durham-language-password",
        label: "语言成绩与 Password",
        categories: ["language", "college"],
        text: "沉淀库里有 Password 考试、雅思、语言水平、写作/阅读/听力经验和成绩提交的讨论，适合做备考互助话题。",
      },
    ],
    webSources: [
      {
        label: "Durham New International Students",
        url: "https://www.durham.ac.uk/colleges-and-student-experience/welcome-and-orientation/new-international-students/",
        note: "官方页汇总国际新生抵英、到校头几天和适应校园生活的信息。",
      },
      {
        label: "Durham International Arrivals",
        url: "https://www.durham.ac.uk/study/international/arrivals/",
        note: "官方页说明国际新生抵达日期、Welcome Service、纽卡机场 meet and greet 与到校交通信息。",
      },
    ],
  },
  谢菲大学: {
    docSource: "谢菲大学聊天记录沉淀库-上传版.docx",
    brief: "谢菲聊天沉淀库覆盖语言班、雅思小分、宿舍/公寓、飞友拼车、课表、校内住宿和 arrival 相关问题。",
    facts: [
      {
        id: "sheffield-language",
        label: "语言班与雅思小分",
        categories: ["language", "alumni"],
        text: "沉淀库显示，谢菲5月到6月高频讨论语言班 offer、雅思小分、写作、成绩提交、uncon/con 和宿舍衔接。",
      },
      {
        id: "sheffield-housing",
        label: "公寓与校内住宿",
        categories: ["secondhand", "alumni"],
        text: "聊天记录中学生常问 studio、ensuite、house、公寓、校内住宿和学院/地图位置，语气多为求助和信息差。",
      },
      {
        id: "sheffield-flight",
        label: "飞友拼车",
        categories: ["flight"],
        text: "6月记录显示，谢菲群里会把签证、飞行时间、拼车、公寓和语言班安排放在同一轮讨论里确认。",
      },
      {
        id: "sheffield-timetable",
        label: "课表与学院",
        categories: ["college"],
        text: "沉淀库记录了学院、专业、地图和课表的讨论，适合生成“有人同专业吗/课表出来了吗”的自然群聊。",
      },
    ],
    webSources: [
      {
        label: "Sheffield Before you arrive",
        url: "https://www.sheffield.ac.uk/new-students/before",
        note: "官方页汇总新生到校前准备、住宿、国际学生支持和 Welcome Week 信息。",
      },
      {
        label: "Sheffield Orientation Week",
        url: "https://www.sheffield.ac.uk/new-students/orientation",
        note: "官方页介绍 Orientation Week、可选活动、临时住宿和 Manchester Airport meet and greet。",
      },
    ],
  },
  悉尼大学: {
    docSource: "悉尼大学资料汇总.docx",
    brief: "悉尼资料覆盖 2026 学期时间、Offer/CoE、OSHC、UniKey/MFA、USI、学生卡、选课、学术诚信、机场海关与行李。",
    facts: [
      {
        id: "sydney-calendar",
        label: "2026 学期",
        categories: ["college", "alumni"],
        text: "资料显示 USYD 2026 Semester 2 orientation 为 7 月 20 日至 31 日，Teaching period 为 8 月 3 日至 11 月 8 日。",
      },
      {
        id: "sydney-offer-coe",
        label: "Offer/CoE",
        categories: ["alumni", "flight"],
        text: "资料写到在 offer 上找到 9 位 Student ID，登录 Sydney Student respond to offer；学校确认缴费后才会发 CoE 用于签证。",
      },
      {
        id: "sydney-unikey",
        label: "UniKey/MFA",
        categories: ["alumni", "college"],
        text: "资料写到接受 offer 后会收到 UniKey 激活邮件，并需通过 Okta Verify 设置 MFA；开始注册课程后也要定期看学校邮箱。",
      },
      {
        id: "sydney-enrolment",
        label: "选课与课表",
        categories: ["college"],
        text: "资料写到收到 Enrolment is open 邮件后，用 UniKey 登录 Sydney Student 选 S1/S2 课程，再到 Timetable 系统选择上课时间偏好。",
      },
      {
        id: "sydney-customs",
        label: "海关与行李",
        categories: ["flight", "secondhand"],
        text: "资料提醒食品、植物、动物制品、木制品、种子、中药材、药品等不确定就主动申报；现金达 10,000 澳元或等值外币通常需申报。",
      },
    ],
    webSources: [
      {
        label: "University of Sydney Key dates",
        url: "https://www.sydney.edu.au/students/key-dates.html",
        note: "官方页提供 2026 key dates、enrolment、teaching dates 和 fee due dates。",
      },
      {
        label: "Sydney Student enrolment",
        url: "https://www.sydney.edu.au/students/enrol-in-a-course.html",
        note: "官方学生入口用于课程注册与 Sydney Student 操作核对。",
      },
    ],
  },
  墨尔本大学: {
    docSource: "墨尔本大学聊天记录沉淀库-上传版.docx",
    brief: "墨大聊天沉淀库覆盖语言班注册、签证/CoE、uncon/con、学生卡照片、Stop 1、timetable、作业、行李和租房押金。",
    facts: [
      {
        id: "melbourne-student-card-stop1",
        label: "学生卡与 Stop 1",
        categories: ["alumni", "language"],
        text: "沉淀库7月记录显示，墨大学生会问学生卡照片尺寸、Stop 1 取卡是否预约、上传照片后多久能去拿卡，以及到校活动地点。",
      },
      {
        id: "melbourne-timetable-enrolment",
        label: "Timetable 与选课",
        categories: ["college", "alumni"],
        text: "沉淀库5月和7月记录显示，学生常问 timetable 在哪里看、my.unimelb 怎么登录、是否要选课、第一周 tutorial 要不要去，以及换课后要不要给老师发邮件。",
      },
      {
        id: "melbourne-visa-coe",
        label: "签证/CoE/uncon",
        categories: ["alumni", "flight"],
        text: "沉淀库5月和10月记录显示，墨大学生会围绕签证下签时间、CoE、uncon/con、成绩提交、机票是否敢订和能否 defer 互相确认。",
      },
      {
        id: "melbourne-language-arrival",
        label: "语言班报道",
        categories: ["language", "flight"],
        text: "沉淀库11月记录显示，语言班群里会问签证晚下后能否晚报道、发邮件给学校多久回复、注册学生证是否到墨尔本后才能操作。",
      },
      {
        id: "melbourne-luggage-rent",
        label: "行李与租房押金",
        categories: ["flight", "secondhand"],
        text: "沉淀库7月和1月记录显示，群里会讨论托运行李超重、显示器托运风险、四件套是否要带、租房交押金和 BPay/中介邮件没回等问题。",
      },
    ],
    webSources: [
      {
        label: "University of Melbourne Key dates",
        url: "https://www.unimelb.edu.au/dates",
        note: "官方页用于核对 semester dates、exam dates、holiday dates 等关键时间。",
      },
      {
        label: "University of Melbourne Student card",
        url: "https://students.unimelb.edu.au/student-support/advice-and-help/stop-1/student-card",
        note: "官方学生页用于核对学生卡照片上传、领取和 Stop 1 相关说明。",
      },
      {
        label: "University of Melbourne Enrolling in subjects",
        url: "https://students.unimelb.edu.au/your-course/manage-your-course/subject-enrolment/enrolling-in-subjects",
        note: "官方学生页说明 subject enrolment、Study Plan 和 timetable 前置操作。",
      },
    ],
  },
  香港综合: {
    docSource: "香港综合资料汇总.docx",
    brief: "香港综合资料覆盖香港高校 offer、Visa Label、D 签、香港身份证、住宿、银行、电话卡与入境后手续。",
    facts: [
      {
        id: "hk-visa",
        label: "Visa Label/D 签",
        categories: ["alumni", "flight"],
        text: "资料写到香港学生签证通常由学校作为担保人递交，审批常需 6-8 周；获批后凭 Visa Label 到内地办理港澳通行证逗留签注 D 签。",
      },
      {
        id: "hk-hkid",
        label: "香港身份证",
        categories: ["alumni", "flight"],
        text: "资料写到年满 11 岁且在港逗留超过 180 天的学生，应在抵港后 30 天内预约办理香港身份证。",
      },
      {
        id: "hk-accommodation",
        label: "住宿预算",
        categories: ["secondhand"],
        text: "资料建议 5-6 月确认 offer、签证和宿舍；7-8 月租房、订机票和准备行李，研究生校外合租要重点看合同与地址证明。",
      },
      {
        id: "hk-payment",
        label: "留位费凭证",
        categories: ["alumni"],
        text: "资料提醒留位费问题要保留银行转账回执、学校系统收据、交易编号，并用申请号和姓名拼音做 reference。",
      },
      {
        id: "hk-polyu-registration",
        label: "PolyU 入学",
        categories: ["college"],
        text: "资料列出 PolyU eAdmission、Net ID、学生卡、宿舍、eStudent 选课和 Resource List 等常用入口。",
      },
    ],
    webSources: [
      {
        label: "PolyU Information for New Students",
        url: "https://www.polyu.edu.hk/ar/new-students-info/",
        note: "官方页列出 2026/27 学生卡领取、Subject Registration、MTR 学生优惠和 HKIC 办理提示。",
      },
      {
        label: "PolyU Visa Matters",
        url: "https://www.polyu.edu.hk/ar/visa-matters-for-non-local-students/?sc_lang=en",
        note: "官方页说明非本地学生签证材料、ID995A、旅行证件和签证信息更新。",
      },
    ],
  },
};

schoolKnowledge.香港理工大学 = schoolKnowledge.香港综合;
