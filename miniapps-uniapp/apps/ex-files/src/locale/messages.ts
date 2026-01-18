export const messages = {
    // App translations
title: { en: "Ex Files", zh: "前任档案" },
  subtitle: { en: "Anonymous record vault", zh: "匿名记录保险库" },

  // Stats
  totalMemories: { en: "Total Memories", zh: "总回忆" },
  daysTogether: { en: "Days Together", zh: "相处天数" },
  lockedFiles: { en: "Locked Files", zh: "已锁定" },
  totalRecords: { en: "Total Records", zh: "记录总数" },
  averageRating: { en: "Avg Rating", zh: "平均评分" },
  totalQueries: { en: "Total Queries", zh: "查询总数" },
  record: { en: "Record", zh: "记录" },
  recordId: { en: "Record ID", zh: "记录 ID" },
  noRecords: { en: "No records found", zh: "未找到记录" },
  unknown: { en: "Unknown", zh: "未知" },
  statusActive: { en: "Active", zh: "有效" },
  statusInactive: { en: "Inactive", zh: "已删除" },

  // Archive
  memoryArchive: { en: "Record Archive", zh: "记录档案" },
  tapToView: { en: "Tap to view", zh: "点击查看" },

  // Upload
  uploadMemory: { en: "Create Record", zh: "创建记录" },
  uploadSubtitle: { en: "Add a hashed record to the archive", zh: "将哈希记录加入档案" },
  memoryTitle: { en: "Memory Title", zh: "回忆标题" },
  memoryTitlePlaceholder: { en: "e.g., First Date at Cafe", zh: "例如：咖啡馆的初次约会" },
  memoryType: { en: "Memory Type", zh: "回忆类型" },
  contentOrUrl: { en: "Content / URL", zh: "内容 / 链接" },
  contentPlaceholder: { en: "Describe the record or paste a URL", zh: "填写记录内容或粘贴链接" },
  uploading: { en: "Uploading...", zh: "上传中..." },
  uploadMemoryBtn: { en: "Upload to Archive", zh: "上传到档案" },
  recordContent: { en: "Record Content", zh: "记录内容" },
  rating: { en: "Rating (1-5)", zh: "评分（1-5）" },
  hashNote: { en: "Content is hashed locally before upload.", zh: "内容将在本地哈希后上传。" },
  createRecord: { en: "Create Record", zh: "创建记录" },
  queryRecord: { en: "Query Record", zh: "查询记录" },
  queryLabel: { en: "Hash or Content", zh: "哈希或内容" },
  queryPlaceholder: { en: "Paste hash or enter content to hash", zh: "粘贴哈希或输入内容生成哈希" },
  querying: { en: "Querying...", zh: "查询中..." },
  queryResult: { en: "Query Result", zh: "查询结果" },
  resultHit: { en: "HIT", zh: "命中" },
  hashLabel: { en: "Hash", zh: "哈希" },

  // Memory types
  typePhoto: { en: "Photo", zh: "照片" },
  typeText: { en: "Letter", zh: "信件" },
  typeVideo: { en: "Video", zh: "视频" },
  typeAudio: { en: "Audio", zh: "音频" },

  // Status
  viewing: { en: "Viewing", zh: "查看中" },
  memoryUploaded: { en: "Memory uploaded to archive!", zh: "回忆已上传到档案！" },
  error: { en: "Error", zh: "错误" },
  invalidContent: { en: "Enter content to hash", zh: "请输入内容" },
  invalidRating: { en: "Rating must be between 1 and 5", zh: "评分必须在 1-5 之间" },
  recordCreated: { en: "Record created", zh: "记录已创建" },
  recordQueried: { en: "Record queried", zh: "记录已查询" },
  failedToLoad: { en: "Failed to load records", zh: "加载记录失败" },
  missingContract: { en: "Contract not configured", zh: "合约未配置" },
  connectWallet: { en: "Connect wallet first", zh: "请先连接钱包" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },

  // Sample memories
  firstDate: { en: "First Date", zh: "初次约会" },
  loveLetter: { en: "Love Letter", zh: "情书" },
  anniversary: { en: "Anniversary", zh: "纪念日" },
  breakupLetter: { en: "Breakup Letter", zh: "分手信" },

  // Categories
  catGeneral: { en: "General", zh: "通用" },
  catAll: { en: "All", zh: "全部" },
  catPhoto: { en: "Photo", zh: "照片" },
  catLetter: { en: "Letter", zh: "信件" },
  catVideo: { en: "Video", zh: "视频" },
  catAudio: { en: "Audio", zh: "音频" },

  // Tabs
  tabFiles: { en: "Archive", zh: "档案" },
  tabUpload: { en: "Upload", zh: "上传" },
  tabStats: { en: "Stats", zh: "统计" },
  docs: { en: "Docs", zh: "文档" },

  // Docs
  docSubtitle: { en: "Privacy-first record storage", zh: "隐私优先的记录存储" },
  docDescription: {
    en: "Store hashed records on-chain and query by hash with TEE-backed privacy.",
    zh: "将记录哈希存储在链上，并通过哈希查询，TEE 保障隐私。",
  },
  step1: { en: "Connect your wallet", zh: "连接钱包" },
  step2: { en: "Create records with hashed content", zh: "创建哈希记录" },
  step3: { en: "Query records by hash when needed", zh: "按需通过哈希查询记录" },
  step4: { en: "View your archive and track query statistics.", zh: "查看档案并跟踪查询统计。" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全" },
  feature1Desc: { en: "Hardware-level memory protection", zh: "硬件级回忆保护" },
  feature2Name: { en: "On-Chain Storage", zh: "链上存储" },
  feature2Desc: { en: "Immutable relationship records", zh: "不可篡改的关系记录" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
    // Shared component keys
    wpTitle: { en: "Wallet Required", zh: "需要钱包" },
    wpDescription: { en: "Please connect your wallet to continue.", zh: "请连接钱包以继续。" },
    wpConnect: { en: "Connect Wallet", zh: "连接钱包" },
    wpCancel: { en: "Cancel", zh: "取消" },
    docWhatItIs: { en: "What is it?", zh: "这是什么？" },
    docHowToUse: { en: "How to use", zh: "如何使用" },
    docOnChainFeatures: { en: "On-Chain Features", zh: "链上特性" },
};
