const contentMap = {
  home: {
    navTitle: '首页内容',
    label: '长白山人参渠道合作',
    title: '中康参芝',
    subtitle: '让长白山的天赐资源走向世界。',
    coverImage: '/images/brand/home-bg.jpeg',
    stats: [
      { value: '5.2万亩', label: '林下参基地' },
      { value: '38年', label: '产业积累' },
      { value: '4大', label: '品质保障' },
      { value: '2400万', label: '林地投资' },
    ],
    sections: [
      {
        title: '中康参芝（通化）生物科技有限公司',
        body: '跨境电商与实体产业的双向布局',
        image: '/images/brand/company-building.jpg',
        cards: [],
      },
      {
        title: '全面了解中康参芝',
        body: '从企业根基、品牌实力到招商政策与投资方向，全面了解中康参芝的合作价值。',
        cards: [
          {
            title: '企业介绍',
            desc: '公司简介、品牌故事、发展历程',
            actionText: '查看详情',
            url: '/pages/official/content/index?type=company',
          },
          {
            title: '品牌背书',
            desc: '基地、科研、非遗、荣誉、合作案例',
            actionText: '查看详情',
            url: '/pages/official/content/index?type=brand',
          },
          {
            title: '招商政策',
            desc: '代理对象、合作模式、扶持政策',
            actionText: '查看详情',
            url: '/pages/official/content/index?type=join',
          },
          {
            title: '投资合作',
            desc: '项目方向、商业模式、资源需求',
            actionText: '查看详情',
            url: '/pages/official/content/index?type=investment',
          },
        ],
      },
      {
        title: '明星产品推荐',
        body: '让长白山的天赐资源走向世界。',
        image: '/images/brand/home-products.jpg',
        showProductCards: false,
        actionText: '全部明星产品',
        actionUrl: '/pages/category/index',
        actionTab: true,
        cards: [],
      },
      {
        title: '合作路径',
        body: '从了解实力、选择产品到提交申请，为合作伙伴提供清晰高效的对接流程。',
        cards: [
          { title: '了解企业实力', desc: '全面了解企业资质、原料基地、科研合作与品牌实力。' },
          { title: '选择合作产品', desc: '根据渠道类型与目标客群，匹配明星产品和合作模式。' },
          { title: '提交合作申请', desc: '提交合作意向后，由专属人员对接政策与落地事宜。' },
        ],
      },
      {
        title: '合作意向',
        body: '提交合作意向，获取产品资料、招商政策与专属合作对接服务。',
        cards: [],
      },
    ],
    primaryAction: { text: '复制合作信息', url: 'copy:home-contact' },
    secondaryAction: { text: '看品牌实力', url: '/pages/cart/index', tab: true },
  },

  products: {
    navTitle: '产品页内容',
    label: '明星产品 · 招商货盘',
    title: '中康参芝\n明星产品',
    subtitle: '依托长白山优质参源，打造覆盖草本饮品、日常滋补与高端礼赠的明星产品矩阵。',
    coverImage: '/images/brand/product-bg.jpg',
    stats: [
      { value: '5款', label: '明星产品' },
      { value: '6类', label: '动销场景' },
      { value: '源头', label: '长白山参源' },
      { value: '招商', label: '渠道合作' },
    ],
    sections: [
      {
        title: '中康参芝明星产品',
        body: '从高频饮品、源头鲜参到高端礼盒，覆盖日常消费、复购、礼赠和企业采购需求。',
        cards: [],
      },
      {
        title: '代理商可承接的销售场景',
        body: '明星产品覆盖私域、电商、线下门店与企业团购，为不同渠道提供稳定的产品供给。',
        cards: [
          { title: '私域社群', desc: '覆盖社群分享、会员团购与老客复购，满足私域渠道的持续经营需求。' },
          { title: '电商平台', desc: '支持平台店铺、短视频和直播渠道，以源头品质与差异化产品承接线上消费需求。' },
          { title: '门店陈列', desc: '覆盖滋补品店、特产店、烟酒礼品店与康养门店，满足陈列、体验和礼赠销售需求。' },
          { title: '企业团购', desc: '面向员工福利、商务答谢、会议礼品和节庆采购，提供多规格产品组合。' },
        ],
      },
      {
        title: '申请明星产品代理资料',
        body: '提交代理意向，获取产品目录、供货政策、渠道权益与专属对接服务。',
        actionText: '申请代理合作',
        actionUrl: '/pages/usercenter/index',
        actionTab: true,
        secondaryActionText: '复制合作意向',
        secondaryActionUrl: 'copy:product-cooperation',
        secondaryActionTab: false,
        cards: [],
      },
    ],
    primaryAction: { text: '看品牌背书', url: '/pages/cart/index', tab: true },
    secondaryAction: { text: '申请合作', url: '/pages/usercenter/index', tab: true },
  },

  ceo: {
    navTitle: 'CEO介绍',
    label: '企业负责人',
    title: '张家新 · 中康参芝总经理',
    subtitle: '国家二级人力资源管理师，长期深耕农业种植、职业培训与大健康产业，以产业实战推动长白山人参资源的科技化、品牌化发展。',
    coverImage: '/images/brand/authority-portrait.jpg',
    cardActionText: '查看介绍 ›',
    stats: [
      { value: '2014年', label: '农业产业实践' },
      { value: '2018年', label: '健康产业创业' },
      { value: '5.2万亩', label: '核心基地' },
      { value: '3大领域', label: '农业·培训·健康' },
    ],
    sections: [
      {
        title: '个人简介',
        body: '张家新，国家二级人力资源管理师，现任中康参芝（通化）生物科技有限公司总经理。多年来扎根农业种植、职业培训和大健康产业，持续推动长白山人参资源从种植端走向产品端与市场端。',
        cards: [
          { title: '中康参芝总经理', desc: '统筹林下参基地建设、产品品牌化、科研合作及渠道合作，推动企业形成从源头资源到市场服务的产业闭环。' },
          { title: '新璐健康科技董事长', desc: '布局健康产品与跨境电商业务，推动相关产品面向美国、欧洲及东南亚市场。' },
          { title: '聚鑫园种植合作社总经理', desc: '自2014年起从事现代农业经营，建设280亩种植基地，以“合作社+农户+园区”模式带动产业发展与就业。' },
          { title: '职业培训实践', desc: '曾任东丰县众星职业培训学校法人兼校长，为农村妇女和返乡青年提供职业技能与就业支持。' },
        ],
      },
      {
        title: '创业初心',
        body: '在职业培训工作中，张家新接触到大量希望就业创业的农村妇女和返乡青年。由此，他开始思考如何把长白山人参、灵芝等地域资源转化为可持续的健康产业，同时为乡村创造更多就业与增收机会。',
        cards: [
          { title: '让长白山资源走向市场', desc: '以真实产区、稳定原料和适合现代消费的产品形态，让更多消费者认识长白山人参的价值。' },
          { title: '以产业带动乡村增收', desc: '通过基地、合作社、培训和产品经营连接农户与市场，让产业发展带来长期、可持续的收益。' },
        ],
      },
      {
        title: '科技与产业实践',
        body: '面对人参行业信息不透明、消费者难以判断品质的问题，张家新主张用科技、标准和全过程记录建立信任，让每一份产品的来源与过程更加清晰。',
        cards: [
          { title: '科研示范基地', desc: '与吉林省农业科学院共建省级林下山参科技示范基地，推动种植技术、种源保护和产业标准建设。' },
          { title: '智能农业装备', desc: '与北华大学开展智能人参籽采摘机器人、原生态播种机等项目合作，探索降低劳动强度、提升生产效率。' },
          { title: '全周期可视化', desc: '推动从种植、管护到采收、加工的数字化记录，以透明信息增强客户和合作伙伴的长期信任。' },
        ],
      },
      {
        title: '经营理念',
        body: '张家新坚持“真、慢、信”的经营原则：真实对待原料与产品，尊重人参生长和品牌积累的时间规律，以长期兑现建立合作信任。',
        cards: [
          { title: '真', desc: '坚持真实产区、真实原料和真实表达，不以夸大宣传换取短期成交。' },
          { title: '慢', desc: '尊重自然生长、产品研发和品牌建设的周期，做时间的朋友。' },
          { title: '信', desc: '以稳定品质、透明信息和持续服务，维护消费者与合作伙伴的信任。' },
        ],
      },
      {
        title: '未来愿景',
        body: '围绕长白山优质人参资源，中康参芝将继续推进科技种植、精深加工、品牌建设与渠道合作，让长白山的好参成为中国人参的标准答案。',
        cards: [
          { title: '张家新', desc: '好参，经得起时间的考验；好人，经得起良心的追问。' },
        ],
      },
    ],
    primaryAction: null,
    secondaryAction: null,
  },

  company: {
    navTitle: '企业介绍',
    label: '企业展示',
    title: '中康参芝（通化）',
    subtitle:
      '依托长白山万亩林下参基地，集知参堂人参精深加工制造业与生态参旅康养于一体，打造稀缺性林下参资产化平台。',
    stats: [
      { value: '2018年', label: '公司成立' },
      { value: '500万', label: '注册资本' },
      { value: '5.2万亩', label: '核心基地' },
      { value: '15-35年', label: '黄金参龄储备' },
    ],
    sections: [
      {
        title: '公司基础信息',
        body: '中康参芝（通化）生物科技有限公司，总部位于吉林省通化市金厂镇，主营农业科学研究和试验发展、农产品加工和销售、互联网销售等业务。',
        cards: [
          { title: '品牌名称', desc: '知参堂' },
          { title: '公司简称', desc: '中康参芝' },
          { title: '联系电话', desc: '18743755111' },
          { title: '联系微信', desc: 'zhangjiaxin890217' },
        ],
      },
      {
        title: '公司简介',
        body: '公司依托长白山系天然地理与气候优势，深耕林下参产业，现拥有二道江乡、铁厂镇及集安三大核心种植基地，是修正药业、正源药业等国内头部药企及保健品牌的人参原料供应商。',
        cards: [
          { title: '制造业启动', desc: '2025年启动人参酒、黑参液、野山参粉、鲜参等产品研发与品牌化销售。' },
          { title: '参旅康养融合', desc: '运营田园综合体生态民宿，布局荒野采参、绿野农庄体验和林下参地认养。' },
          { title: '产业链闭环', desc: '以科技、金融、溯源、品牌四轮驱动，推动原料、加工、销售和服务闭环。' },
        ],
      },
      {
        title: '企业图册',
        body: '从企业外观、品牌接待空间、办公区域到会议环境，直观了解中康参芝的企业形象与经营环境。',
        cards: [
          { title: '企业外观', desc: '中康参芝企业办公与品牌形象。', image: 'http://192.168.3.9:3000/media/2026/07/1bf08949-0225-48e1-beee-e5e5f1db02ef.jpg' },
          { title: '品牌接待区', desc: '企业品牌展示与来访接待空间。', image: 'http://192.168.3.9:3000/media/2026/07/65969718-c504-4d00-a53c-201eb6bf781d.jpg' },
          { title: '办公区域', desc: '企业日常办公与团队协作环境。', image: 'http://192.168.3.9:3000/media/2026/07/04c58758-fb4e-4ad7-ba0f-c6e2c5dcffb9.jpg' },
          { title: '会议环境', desc: '企业会议、培训与合作沟通空间。', image: 'http://192.168.3.9:3000/media/2026/07/38272ea4-23ac-4449-aed0-464a26baf919.jpg' },
          { title: '企业品牌墙', desc: '中康参芝品牌标识与企业文化展示。', image: 'http://192.168.3.9:3000/media/2026/07/388ae541-c575-4ec1-bfb2-6b082ec2f974.jpg' },
        ],
      },
    ],
    timeline: [
      { year: '1983年', text: '企业核心团队开始投入林下参种植，积累种植经验与技术沉淀。' },
      { year: '1988年', text: '签约集安核心产区林下参基地，合同期50年。' },
      { year: '2006年', text: '签约铁厂镇林下参基地，完善长白山核心产区布局。' },
      { year: '2007年', text: '签约二道江乡林下参种植科普示范基地。' },
      { year: '2018年', text: '中康参芝（通化）生物科技有限公司成立。' },
      { year: '2024年', text: '与吉林省农科院共建省级林下山参科技示范基地，推进智能化农业项目。' },
      { year: '未来3-5年', text: '继续扩大高校和科研机构合作，深化老字号合作，完善可信溯源体系。' },
    ],
    primaryAction: { text: '申请代理合作', url: '/pages/official/form-select/index?type=agent' },
    secondaryAction: { text: '查看品牌背书', url: '/pages/official/content/index?type=brand' },
  },

  brand: {
    navTitle: '品牌背书',
    label: '品牌背书',
    title: '长白山人参全产业链标杆企业',
    subtitle:
      '深耕林下参种源保育、生态种植、科研选育、精深加工与供应链服务，形成资源、科研、品质、供应链四大合作信任基础。',
    stats: [
      { value: '近40年', label: '参业积淀' },
      { value: '5.2万亩', label: '核心基地' },
      { value: '约2900万株', label: '林下参储备' },
      { value: '200万株+', label: '年产能' },
    ],
    sections: [
      {
        title: '企业核心实力',
        body: '中康参芝根植吉林通化，传承近四十年人参种植与加工底蕴，是集种质保育、生态种植、科研创新、精深加工、品牌供应于一体的全产业链参业企业。',
        cards: [
          { title: '三大基地', desc: '二道江、铁厂镇、集安三大核心林下参种植基地。' },
          { title: '完整参龄结构', desc: '覆盖15-35年黄金参龄，具备长期稳定供给基础。' },
          { title: '药企级供应链', desc: '服务修正药业、正源药业等医药及保健食品企业。' },
          { title: '科研赋能', desc: '围绕种源纯化、复壮与保育，建立林下参种源壁垒。' },
          { title: '非遗传承', desc: '坚守古法匠心，融合现代工艺，推动传统参艺活态传承。' },
          { title: '全程溯源', desc: '覆盖种植、管护、检测、采收、加工的全流程可视化溯源体系。' },
        ],
      },
      {
        title: '资质与检测',
        body: '相关资质与检测内容正在更新中，当前仅展示企业已确认的文字信息。',
        cards: [
          { title: '正在更新中...', desc: '资质、认证及检测信息将根据企业确认口径持续完善。' },
        ],
      },
      {
        title: '品质溯源',
        body: '相关报告与溯源文件正在更新中，暂不提供文件查看。',
        cards: [
          { title: '正在更新中...', desc: '后续将根据企业提供的正式资料更新品质溯源说明。' },
        ],
      },
      {
        title: '企业荣誉',
        body: '企业荣誉与示范单位资质共同见证中康参芝在人参种植、科研与品牌建设领域的长期积累。',
        cards: [
          { title: '中国科普惠农兴村先进单位', desc: '产业与科普结合的代表性荣誉。' },
          { title: '通化市科普示范基地', desc: '具备产区展示和消费者教育基础。' },
          { title: '区级非物质文化遗产认证企业', desc: '人参种植与红参加工技艺背书。' },
          { title: '中国国际专利与名牌博览会金奖', desc: '品牌与产品展示荣誉。' },
          { title: '林下参种源基地建设示范单位', desc: '标准化种源基地建设与产业示范背书。' },
        ],
      },
      {
        title: '媒体报道',
        body: '相关媒体报道内容正在更新中，后续将根据企业确认的信息持续完善。',
        cards: [
          { title: '正在更新中...', desc: '当前暂不提供报道原件或外部链接。' },
        ],
      },
    ],
    cases: [
      { name: '新璐（吉林）健康科技有限公司', type: '代理', result: '年销售额1000万以上' },
      { name: '吉林省红五味生物技术有限公司', type: '销售/研发', result: '年销售额500万以上' },
    ],
    primaryAction: { text: '提交合作咨询', url: '/pages/official/form-select/index?type=consult' },
    secondaryAction: { text: '查看招商政策', url: '/pages/official/content/index?type=join' },
  },

  strength: {
    navTitle: '实力',
    label: '企业实力 · 合作保障',
    title: '中康参芝合作实力',
    subtitle:
      '以长白山参类资源为基础，建立企业主体、源头基地、品质追溯与渠道服务一体化合作体系。',
    coverImage: '/images/brand/strength-bg.jpg',
    stats: [
      { value: '2018年', label: '公司成立' },
      { value: '500万', label: '注册资本' },
      { value: '5.2万亩', label: '核心基地' },
      { value: '近40年', label: '参业积淀' },
    ],
    sections: [
      {
        title: '四大合作实力',
        body: '正规企业主体、长白山核心产区资源、全周期品质管理和持续渠道支持，共同构成值得长期合作的基础。',
        cards: [
          {
            title: '正规企业主体',
            desc: '由中康参芝（通化）生物科技有限公司承接产品供应、合作签约、资料对接与售后服务。',
          },
          {
            title: '长白山核心产区资源',
            desc: '依托长白山人参产区资源与三大核心林下参基地，为产品提供稳定、可识别的原料基础。',
          },
          {
            title: '全周期品质管理与溯源',
            desc: '围绕种植、管护、检测、采收与加工，建立贯穿产品全周期的品质管理和信息追溯链路。',
          },
          {
            title: '渠道合作与运营支持',
            desc: '面向区域代理、私域社群、电商平台和线下门店，提供产品、政策、素材与持续对接服务。',
          },
        ],
      },
      {
        title: '品牌实力与品质溯源',
        body: '点击查看企业负责人、企业形象与品质资料，进一步了解中康参芝的经营基础。',
        cards: [
          {
            title: '企业负责人',
            desc: '了解企业负责人的产业经历、经营理念与品牌责任。',
            image: '/images/brand/authority-person-wide.jpg',
            actionText: '查看CEO介绍',
            url: '/pages/official/content/index?type=ceo',
          },
          {
            title: '企业形象',
            desc: '查看企业介绍、品牌故事、办公环境与发展历程。',
            image: 'http://192.168.3.9:3000/media/2026/07/65969718-c504-4d00-a53c-201eb6bf781d.jpg',
            actionText: '查看企业介绍',
            url: '/pages/official/content/index?type=company',
          },
          {
            title: '品质溯源',
            desc: '相关报告与溯源资料正在更新中。',
            image: '/images/brand/evidence-trace.jpg',
            actionText: '查看更新状态',
            url: '/pages/official/content/index?type=brand&section=2',
          },
        ],
      },
      {
        title: '开启合作对接',
        body: '选择适合的合作方向，提交基本信息后，由专属人员进一步沟通产品、政策和合作方案。',
        cards: [],
      },
    ],
    primaryAction: { text: '提交合作申请', url: '/pages/official/form-select/index?type=agent' },
    secondaryAction: { text: '查看招商政策', url: '/pages/official/content/index?type=join' },
  },

  cooperation: {
    navTitle: '合作',
    label: '代理合作 · 申请对接',
    title: '申请中康参芝合作',
    subtitle: '面向代理商、团长、门店和电商渠道开放合作咨询，提供完整产品资料、渠道政策与专属合作服务。',
    coverImage: '/images/brand/cooperation-bg.jpg',
    stats: [],
    sections: [
      {
        title: '多渠道合作伙伴招募',
        body: '根据不同经营资源与客户基础，中康参芝面向区域市场、私域团购、线下门店和电商渠道开放合作。',
        cards: [
          { title: '区域代理', desc: '适合具备本地市场资源、客户网络或渠道开发能力的个人与企业。' },
          { title: '私域及团购合作', desc: '适合拥有社群、会员客户、企事业采购或礼赠团购资源的合作伙伴。' },
          { title: '门店与电商合作', desc: '适合线下门店、健康服务机构及主流电商、直播平台运营团队。' },
        ],
      },
      {
        title: '合作后可获得的支持',
        body: '围绕产品展示、政策对接和渠道运营，为合作伙伴提供持续、规范的业务支持。',
        cards: [
          { title: '标准产品资料', desc: '提供主推产品介绍、高清产品图片、规格参数与品牌资质资料。' },
          { title: '合作政策与授权', desc: '明确代理门槛、供货政策、渠道权益、授权规则与服务内容。' },
          { title: '渠道运营支持', desc: '为朋友圈、社群、直播间和电商平台提供规范的品牌宣传内容。' },
        ],
      },
      {
        title: '选择合作方向',
        body: '请选择与您当前需求相符的合作方向，提交信息后由专属人员安排后续对接。',
        cards: [
          {
            title: '代理申请',
            desc: '区域代理、渠道代理、私域团长、电商运营。',
            actionText: '提交申请',
            url: '/pages/official/form-select/index?type=agent',
          },
          {
            title: '投资合作',
            desc: '项目投资、资源合作、渠道共建、品牌运营。',
            actionText: '提交申请',
            url: '/pages/official/form-select/index?type=investment',
          },
          {
            title: '普通咨询',
            desc: '咨询产品、品牌资质、合作政策与其他业务问题。',
            actionText: '提交咨询',
            url: '/pages/official/form-select/index?type=consult',
          },
          {
            title: '招商政策',
            desc: '查看合作模式、代理权益、扶持政策、合作流程和常见问题。',
            actionText: '查看政策',
            url: '/pages/official/content/index?type=join',
          },
        ],
      },
    ],
    faq: [],
  },

  join: {
    navTitle: '招商政策',
    label: '招商代理',
    title: '面向多渠道伙伴开放合作',
    subtitle:
      '支持区域代理、专项渠道、私域团长、电商运营、线下门店和企业采购服务商，根据资源类型匹配产品组合、供货方式和销售支持。',
    stats: [
      { value: '6类', label: '招商对象' },
      { value: '多模式', label: '合作方式' },
      { value: '全渠道', label: '销售场景' },
      { value: '一对一', label: '合作对接' },
    ],
    sections: [
      {
        title: '招商对象',
        body: '中康参芝面向具备市场资源、渠道网络、客户基础或运营能力的个人与企业开放合作。',
        cards: [
          { title: '区域代理', desc: '适合具备当地市场资源、销售团队、门店网络或渠道开发能力的个人及企业。' },
          { title: '渠道代理', desc: '适合商超、礼品、健康管理、企事业团购、社区、会销、旅游等渠道资源方。' },
          { title: '私域团长', desc: '适合拥有微信群、朋友圈、会员客户或社群运营能力的个人及团队。' },
          { title: '电商运营者', desc: '适合抖音、快手、视频号、淘宝、京东、拼多多等平台运营团队。' },
          { title: '门店经营者', desc: '适合滋补品店、特产店、养生馆、健康管理中心、礼品店及社区门店。' },
          { title: '企业采购服务商', desc: '适合员工福利、商务礼赠、会议采购、节庆礼品等资源方。' },
        ],
      },
      {
        title: '合作模式',
        body: '合作门槛、拿货方式、结算方式、授权范围和价格体系以正式合同为准。',
        cards: [
          { title: '区域代理模式', desc: '签订区域代理协议，在约定区域内开展销售、客户开发和渠道拓展。' },
          { title: '专项渠道合作', desc: '围绕指定渠道进行产品供应、联合推广、项目合作或定制开发。' },
          { title: '私域团购合作', desc: '可采用集中下单、公司统一发货或符合条件后一件代发。' },
          { title: '电商直播合作', desc: '可采用供货、店铺分销、达人佣金、直播专场或联合运营。' },
        ],
      },
      {
        title: '扶持政策',
        body: '中康参芝为合作伙伴提供标准产品资料、渠道运营内容、清晰合作政策与专属对接服务。',
        cards: [
          { title: '标准产品资料', desc: '提供产品介绍、高清产品图片、规格参数与品牌资质资料。' },
          { title: '渠道运营支持', desc: '为朋友圈、社群、直播间和电商平台提供规范的品牌宣传内容。' },
          { title: '政策说明', desc: '明确代理门槛、拿货政策、渠道权益、授权规则和后续支持方式。' },
          { title: '专人对接', desc: '提交合作意向后沟通经营渠道、合作需求和适配产品。' },
        ],
      },
    ],
    faq: [
      { q: '是否必须大量囤货？', a: '不同合作模式门槛不同，私域团长、电商分销等模式可按实际政策设置低门槛或样品开通。' },
      { q: '能否做企业团购？', a: '可以，适合员工福利、客户礼赠、会议伴手礼和节庆采购等场景。' },
      { q: '宣传内容能否自行修改？', a: '涉及功效、价格、授权和品牌表达的内容需按公司审核口径执行，避免违规宣传。' },
    ],
    primaryAction: { text: '提交代理申请', url: '/pages/official/form-select/index?type=agent' },
    secondaryAction: { text: '查看明星产品', url: '/pages/category/index', tab: true },
  },

  investment: {
    navTitle: '投资合作',
    label: '投资合作',
    title: '林下参资产化与品牌增长合作',
    subtitle:
      '围绕长白山林下参资源、知参堂品牌产品、参旅康养项目和可信溯源体系，开放资源型、渠道型、项目型合作。',
    stats: [
      { value: '5.2万亩', label: '核心基地资源' },
      { value: '2400万', label: '林地投入' },
      { value: '科技示范', label: '农科院共建' },
      { value: '3-5年', label: '增长规划' },
    ],
    sections: [
      {
        title: '项目方向',
        body: '公司以林下参种植资源为基础，推进精深加工、品牌销售、生态参旅康养和林下参认养服务。',
        cards: [
          { title: '精深加工制造', desc: '黑参液、人参酒、野山参粉、鲜参等产品形成品牌化货盘。' },
          { title: '生态参旅康养', desc: '田园综合体、荒野采参、绿野农庄体验和康养民宿。' },
          { title: '林下参认养', desc: '以可视化管理和溯源体系建立长期客户关系。' },
          { title: '科技农业升级', desc: '与科研机构合作推进数据驱动、智能操控和农业装备研发。' },
        ],
      },
      {
        title: '商业模式',
        body: '以资源持有、产品销售、渠道分销、团购定制、康养体验和认养服务形成多收入来源。',
        cards: [
          { title: '产品利润', desc: '以明星产品和礼赠产品承接私域、电商、门店和团购渠道销售。' },
          { title: '供应链合作', desc: '为品牌方、药企、保健食品企业提供稳定原料和定制开发。' },
          { title: '项目共建', desc: '围绕基地展示、康养民宿、采参体验和认养服务开放共建机会。' },
          { title: '品牌增长', desc: '通过老字号合作、内容传播、全程溯源和渠道扩张提升品牌价值。' },
        ],
      },
      {
        title: '合作需求',
        body: '优先对接具备渠道资源、品牌运营能力、项目投资能力、文旅康养资源或产业资源整合能力的合作方。',
        cards: [
          { title: '渠道资源', desc: '礼赠团购、私域社群、电商直播、商超门店、康养机构等。' },
          { title: '品牌运营', desc: '内容营销、直播电商、平台运营、达人资源和传播资源。' },
          { title: '项目资金', desc: '用于精深加工、基地展示、参旅康养和市场增长项目共建。' },
          { title: '产业协同', desc: '药食同源、健康管理、文旅康养、农业科技等相关领域。' },
        ],
      },
    ],
    primaryAction: { text: '提交投资合作申请', url: '/pages/official/form-select/index?type=investment' },
    secondaryAction: { text: '查看企业介绍', url: '/pages/official/content/index?type=company' },
  },
};

function getContent(type) {
  return contentMap[type] || contentMap.company;
}

module.exports = {
  contentMap,
  getContent,
};
