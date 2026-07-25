<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { AddIcon, DeleteIcon, EditIcon, RefreshIcon, SaveIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
import {
  createContentPage,
  listContentPages,
  updateContentPage,
  updateContentPageStatus,
  type ContentAction,
  type ContentBlock,
  type ContentPage,
  type ContentStatus,
  type SaveContentPagePayload,
} from '../api/content'
import { resolveApiError } from '../api/client'
import MediaFileField from '../components/MediaFileField.vue'
import MediaImageField from '../components/MediaImageField.vue'

interface ContentEditor extends SaveContentPagePayload {
  id: string
  status: ContentStatus
  version: number
  primaryAction: ContentAction
  secondaryAction: ContentAction
}

const homeSectionLabels = ['企业信息卡', '内容导航入口', '明星产品推荐', '合作路径', '底部合作意向']

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const activeModule = ref<'page' | 'subsections'>('page')
const pages = ref<ContentPage[]>([])
const editor = reactive<ContentEditor>(emptyEditor())

const pageTypeOptions = [
  { label: '小程序首页', value: 'home' },
  { label: '主页 CEO', value: 'ceo' },
  { label: '企业介绍', value: 'company' },
  { label: '品牌背书', value: 'brand' },
  { label: '招商政策', value: 'join' },
  { label: '投资合作', value: 'investment' },
]

const subsectionDefinitions = [
  { type: 'ceo', label: '企业 CEO 介绍', description: '编辑 CEO 人物图、姓名职务、首页简介和点击后的详细介绍。' },
  { type: 'company', label: '企业介绍', description: '编辑公司简介、品牌故事、发展历程和企业基础信息。' },
  { type: 'brand', label: '品牌背书', description: '编辑资质证书、检测报告、企业荣誉、合作案例和媒体报道。' },
  { type: 'join', label: '招商政策', description: '编辑合作模式、代理权益、扶持政策、合作流程和常见问题。' },
  { type: 'investment', label: '投资合作', description: '编辑项目介绍、商业模式、增长规划、合作方向和资源需求。' },
]

const managedPageTypes = new Set(pageTypeOptions.map((item) => item.value))
const homePage = computed(() => pages.value.find((page) => page.pageType === 'home' || page.slug === 'home'))

function pageFor(type: string) {
  return pages.value.find((page) => page.pageType === type || page.slug === type)
}

function emptyAction(): ContentAction {
  return { text: '', url: '', tab: false }
}

function emptyEditor(): ContentEditor {
  return {
    id: '',
    slug: '',
    pageType: 'company',
    navTitle: '',
    label: '',
    title: '',
    subtitle: '',
    coverImage: '',
    status: 'draft',
    version: 1,
    stats: [],
    sections: [],
    timeline: [],
    cases: [],
    faq: [],
    primaryAction: emptyAction(),
    secondaryAction: emptyAction(),
    cardActionText: '',
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function replaceEditor(value: ContentEditor) {
  Object.assign(editor, value)
}

async function load() {
  loading.value = true
  try {
    pages.value = (await listContentPages()).filter((page) => managedPageTypes.has(page.pageType))
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    loading.value = false
  }
}

function createPage(type: string) {
  const definition = subsectionDefinitions.find((item) => item.type === type)
  const next = emptyEditor()
  next.slug = type
  next.pageType = type
  next.navTitle = definition?.label ?? '首页内容'
  next.label = definition?.label ?? '首页内容'
  next.title = definition?.label ?? '首页内容'
  if (type === 'home') {
    next.navTitle = '首页内容'
    next.label = '首页内容'
    next.title = '中康参芝'
  }
  replaceEditor(next)
  dialogVisible.value = true
}

function editPage(page: ContentPage) {
  replaceEditor({
    id: page.id,
    slug: page.slug,
    pageType: page.pageType,
    navTitle: page.navTitle,
    label: page.label,
    title: page.title,
    subtitle: page.subtitle,
    coverImage: page.coverImage,
    status: page.status,
    version: page.version,
    stats: clone(page.stats),
    sections: clone(page.sections).map((section, sectionIndex) => ({
      ...section,
      image: section.image ?? '',
      showProductCards:
        page.pageType === 'home' && sectionIndex === 2
          ? section.showProductCards === true
          : section.showProductCards,
      actionText:
        page.pageType === 'home' && sectionIndex === 2
          ? section.actionText || '全部明星产品'
          : section.actionText ?? '',
      actionUrl:
        page.pageType === 'home' && sectionIndex === 2
          ? section.actionUrl || '/pages/category/index'
          : section.actionUrl ?? '',
      actionTab:
        page.pageType === 'home' && sectionIndex === 2
          ? section.actionTab !== false
          : section.actionTab ?? false,
      secondaryActionText: section.secondaryActionText ?? '',
      secondaryActionUrl: section.secondaryActionUrl ?? '',
      secondaryActionTab: section.secondaryActionTab ?? false,
      cards: section.cards.map((card) => ({
        ...card,
        image: card.image ?? '',
        fileUrl: card.fileUrl ?? '',
        fileName: card.fileName ?? '',
        actionText: card.actionText ?? '',
        url: card.url ?? '',
        tab: card.tab ?? false,
      })),
    })),
    timeline: clone(page.timeline),
    cases: clone(page.cases),
    faq: clone(page.faq),
    primaryAction: clone(page.primaryAction ?? emptyAction()),
    secondaryAction: clone(page.secondaryAction ?? emptyAction()),
    cardActionText:
      page.cardActionText ?? (page.pageType === 'ceo' ? '查看介绍 ›' : ''),
  })
  dialogVisible.value = true
}

function addStat() {
  editor.stats.push({ value: '', label: '' })
}

function addSection() {
  editor.sections.push({
    title: '',
    body: '',
    image: '',
    cards: [],
    actionText: '',
    actionUrl: '',
    actionTab: false,
    secondaryActionText: '',
    secondaryActionUrl: '',
    secondaryActionTab: false,
  })
}

function addCard(section: ContentBlock) {
  section.cards.push({
    title: '',
    desc: '',
    image: '',
    fileUrl: '',
    fileName: '',
    actionText: '',
    url: '',
    tab: false,
  })
}

function addTimeline() {
  editor.timeline.push({ year: '', text: '' })
}

function addCase() {
  editor.cases.push({ name: '', type: '', result: '' })
}

function addFaq() {
  editor.faq.push({ q: '', a: '' })
}

function removeAt<T>(items: T[], index: number) {
  items.splice(index, 1)
}

function validateEditor() {
  if (!editor.slug || !editor.pageType || !editor.navTitle || !editor.label || !editor.title) {
    return '请完整填写页面编码、类型、导航标题、内容标签和主标题'
  }
  if (editor.stats.some((item) => !item.value || !item.label)) return '请完整填写每一项数据指标'
  if (editor.sections.some((item) => !item.title || !item.body)) return '请完整填写每一个正文板块'
  if (editor.sections.some((item) => item.cards.some((card) => !card.title || !card.desc))) {
    return '请完整填写正文板块中的内容卡片'
  }
  if (
    editor.sections.some((item) =>
      item.cards.some((card) => Boolean(card.actionText) !== Boolean(card.url)),
    )
  ) {
    return '内容项的操作文字和跳转地址需要同时填写'
  }
  if (
    editor.sections.some(
      (item) => Boolean(item.actionText?.trim()) !== Boolean(item.actionUrl?.trim()),
    )
  ) {
    return '板块按钮文字和跳转地址需要同时填写'
  }
  if (
    editor.sections.some(
      (item) =>
        Boolean(item.secondaryActionText?.trim()) !== Boolean(item.secondaryActionUrl?.trim()),
    )
  ) {
    return '板块次按钮文字和跳转地址需要同时填写'
  }
  if (editor.timeline.some((item) => !item.year || !item.text)) return '请完整填写发展历程'
  if (editor.cases.some((item) => !item.name || !item.type || !item.result)) {
    return '请完整填写合作案例'
  }
  if (editor.faq.some((item) => !item.q || !item.a)) return '请完整填写常见问题'
  const actions = [editor.primaryAction, editor.secondaryAction]
  if (actions.some((item) => Boolean(item.text) !== Boolean(item.url))) {
    return '按钮文字和跳转地址需要同时填写'
  }
  return ''
}

function actionOrUndefined(action: ContentAction) {
  return action.text && action.url ? clone(action) : undefined
}

async function save() {
  const validationMessage = validateEditor()
  if (validationMessage) {
    await MessagePlugin.warning(validationMessage)
    return
  }

  const payload: SaveContentPagePayload = {
    slug: editor.slug.trim(),
    pageType: editor.pageType,
    navTitle: editor.navTitle.trim(),
    label: editor.label.trim(),
    title: editor.title.trim(),
    subtitle: editor.subtitle.trim(),
    coverImage: editor.coverImage.trim(),
    stats: clone(editor.stats),
    sections: clone(editor.sections),
    timeline: clone(editor.timeline),
    cases: clone(editor.cases),
    faq: clone(editor.faq),
    primaryAction: actionOrUndefined(editor.primaryAction),
    secondaryAction: actionOrUndefined(editor.secondaryAction),
    cardActionText: editor.cardActionText?.trim() || undefined,
  }

  saving.value = true
  try {
    if (editor.id) await updateContentPage(editor.id, payload)
    else await createContentPage(payload)
    dialogVisible.value = false
    await MessagePlugin.success(editor.id ? '内容已保存' : '内容草稿已创建')
    await load()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    saving.value = false
  }
}

async function changeStatus(page: ContentPage, status: ContentStatus) {
  try {
    await updateContentPageStatus(page.id, status)
    await MessagePlugin.success(status === 'published' ? '页面已发布' : '页面已下线')
    await load()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  }
}

function statusLabel(status: ContentStatus) {
  if (status === 'published') return '已发布'
  if (status === 'offline') return '已下线'
  return '草稿'
}

function statusTheme(status: ContentStatus) {
  if (status === 'published') return 'success'
  if (status === 'offline') return 'danger'
  return 'warning'
}

onMounted(load)
</script>

<template>
  <section class="business-page content-page-admin">
    <div class="module-toolbar">
      <div>
        <span class="section-kicker">HOME CONTENT</span>
        <h2>首页内容</h2>
        <p>先选择编辑首页页面，或编辑首页中可以点击进入的子板块内容。</p>
      </div>
      <div class="toolbar-actions">
        <t-button variant="outline" :loading="loading" @click="load">
          <template #icon><RefreshIcon /></template>
          刷新
        </t-button>
      </div>
    </div>

    <div class="home-module-switch" role="tablist" aria-label="首页内容编辑模块">
      <button :class="{ 'is-active': activeModule === 'page' }" type="button" @click="activeModule = 'page'">
        <strong>页面编辑</strong>
        <span>首页文字、图片和首页板块</span>
      </button>
      <button :class="{ 'is-active': activeModule === 'subsections' }" type="button" @click="activeModule = 'subsections'">
        <strong>子板块内容编辑</strong>
        <span>五个可点击子板块的详情内容</span>
      </button>
    </div>

    <section v-if="activeModule === 'page'" class="home-content-module" :class="{ 'is-loading': loading }">
      <div class="home-content-module-head">
        <div><h3>页面编辑</h3><p>修改小程序首页显示的文字、背景图、企业卡片、导航入口、产品入口和合作路径。</p></div>
      </div>
      <div v-if="homePage" class="home-page-editor-card">
        <img v-if="homePage.coverImage" :src="homePage.coverImage" alt="首页背景图" />
        <div class="home-page-editor-copy">
          <div><t-tag :theme="statusTheme(homePage.status)">{{ statusLabel(homePage.status) }}</t-tag></div>
          <h4>{{ homePage.title }}</h4>
          <p>{{ homePage.subtitle }}</p>
          <small>包含 {{ homePage.sections.length }} 个首页板块</small>
        </div>
        <div class="home-page-editor-actions">
          <t-button theme="primary" @click="editPage(homePage)"><template #icon><EditIcon /></template>编辑首页</t-button>
          <t-button v-if="homePage.status !== 'published'" variant="outline" @click="changeStatus(homePage, 'published')">发布首页</t-button>
        </div>
      </div>
      <div v-else-if="!loading" class="home-empty-state">
        <strong>尚未建立首页内容</strong><p>初始化后即可编辑首页文字和图片。</p>
        <t-button theme="primary" @click="createPage('home')"><template #icon><AddIcon /></template>初始化首页</t-button>
      </div>
    </section>

    <section v-else class="home-content-module" :class="{ 'is-loading': loading }">
      <div class="home-content-module-head">
        <div><h3>子板块内容编辑</h3><p>以下内容是首页中可点击板块进入后的详情页面。</p></div>
      </div>
      <div class="home-subsection-list">
        <article v-for="definition in subsectionDefinitions" :key="definition.type" class="home-subsection-item">
          <div class="home-subsection-main">
            <span class="home-subsection-index">{{ String(subsectionDefinitions.indexOf(definition) + 1).padStart(2, '0') }}</span>
            <div><h4>{{ definition.label }}</h4><p>{{ definition.description }}</p></div>
          </div>
          <div class="home-subsection-status">
            <t-tag :theme="statusTheme(pageFor(definition.type)?.status ?? 'draft')">{{ pageFor(definition.type) ? statusLabel(pageFor(definition.type)!.status) : '尚未建立' }}</t-tag>
          </div>
          <t-button v-if="pageFor(definition.type)" variant="outline" @click="editPage(pageFor(definition.type)!)"><template #icon><EditIcon /></template>编辑内容</t-button>
          <t-button v-else variant="outline" @click="createPage(definition.type)"><template #icon><AddIcon /></template>初始化</t-button>
        </article>
      </div>
    </section>
  </section>

  <t-dialog
    v-model:visible="dialogVisible"
    :header="editor.id ? `编辑内容 · V${editor.version}` : '新建内容页面'"
    width="1120px"
    :close-on-overlay-click="false"
    :footer="false"
  >
    <div class="content-editor">
      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>页面信息</h3><p>控制导航标题、页面首屏标题和说明。</p></div>
        </div>
        <div class="form-editor-grid">
          <t-form-item label="页面编码"><t-input v-model="editor.slug" placeholder="例如 company" /></t-form-item>
          <t-form-item label="页面类型"><t-select v-model="editor.pageType" :options="pageTypeOptions" /></t-form-item>
          <t-form-item label="导航标题"><t-input v-model="editor.navTitle" /></t-form-item>
          <t-form-item label="内容标签"><t-input v-model="editor.label" /></t-form-item>
          <t-form-item :label="editor.pageType === 'ceo' ? 'CEO姓名与职务' : '页面主标题'" class="span-2">
            <t-input v-model="editor.title" />
          </t-form-item>
          <t-form-item :label="editor.pageType === 'ceo' ? '首页卡片简介' : '页面副标题'" class="span-2">
            <t-textarea v-model="editor.subtitle" :autosize="{ minRows: 2, maxRows: 5 }" />
          </t-form-item>
          <t-form-item v-if="editor.pageType === 'ceo'" label="首页卡片入口文字" class="span-2">
            <t-input v-model="editor.cardActionText" placeholder="例如：查看介绍 ›" />
          </t-form-item>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div>
            <h3>{{ editor.pageType === 'ceo' ? 'CEO 图片' : '页面封面' }}</h3>
            <p v-if="editor.pageType === 'ceo'">维护首页 CEO 卡片人物图；点击后的详情内容使用下方“正文板块”编辑。</p>
            <p v-else>用于内容详情页顶部主视觉，建议选择主体清晰、适合横向裁切的图片。</p>
          </div>
        </div>
        <div class="form-editor-grid">
          <t-form-item :label="editor.pageType === 'ceo' ? 'CEO 人物图' : '页面封面图'" class="span-2">
            <MediaImageField v-model="editor.coverImage" />
          </t-form-item>
        </div>
        <t-alert
          v-if="editor.pageType === 'ceo'"
          theme="info"
          message="补充正文板块并发布后，首页 CEO 卡片点击进入的详情会自动更新。"
        />
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>数据指标</h3><p>首屏展示的数字与说明。</p></div>
          <t-button variant="outline" size="small" @click="addStat"><template #icon><AddIcon /></template>添加指标</t-button>
        </div>
        <div class="compact-editor-list">
          <div v-for="(item, index) in editor.stats" :key="index" class="compact-editor-row stat-editor-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="item.value" placeholder="数值，例如 5.2万亩" />
            <t-input v-model="item.label" placeholder="说明，例如 核心基地" />
              <t-button aria-label="删除数据项" shape="square" variant="text" theme="danger" @click="removeAt(editor.stats, index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div>
            <h3>正文板块</h3>
            <p v-if="editor.pageType === 'home'">首页固定顺序：企业卡片、内容入口、明星产品标题、合作路径、底部合作意向。</p>
            <p v-else-if="editor.pageType === 'brand'">建议按资质证书、检测报告、企业荣誉、合作案例和媒体报道分组；每个内容项可绑定展示图和 PDF。</p>
            <p v-else-if="editor.pageType === 'strength'">实力页固定顺序：合作实力、证明图片、详情入口、合作保障、底部行动区；证明图片在对应内容项中维护。</p>
            <p v-else-if="editor.pageType === 'cooperation'">合作页固定顺序：合作对象、合作支持、合作方向、底部合作意向；合作方向内容项需配置申请或详情链接。</p>
            <p v-else>每个板块包含标题、正文和若干内容项。</p>
          </div>
          <t-button variant="outline" size="small" @click="addSection"><template #icon><AddIcon /></template>添加板块</t-button>
        </div>
        <div class="content-block-list">
          <article v-for="(section, sectionIndex) in editor.sections" :key="sectionIndex" class="content-block-editor">
            <div class="content-block-head">
              <strong>
                {{ editor.pageType === 'home' ? homeSectionLabels[sectionIndex] || `板块 ${sectionIndex + 1}` : `板块 ${sectionIndex + 1}` }}
              </strong>
              <t-button aria-label="删除内容板块" shape="square" variant="text" theme="danger" @click="removeAt(editor.sections, sectionIndex)"><DeleteIcon /></t-button>
            </div>
            <t-input v-model="section.title" placeholder="板块标题" />
            <t-textarea v-model="section.body" placeholder="板块正文" :autosize="{ minRows: 2, maxRows: 6 }" />
            <MediaImageField
              v-model="section.image"
              placeholder="可选：选择该正文板块的展示图片"
            />
            <div
              v-if="editor.pageType === 'home' && sectionIndex === 2"
              class="content-card-action-row"
            >
              <label class="action-tab">
                <t-switch v-model="section.showProductCards" />
                在首页显示产品互动卡片
              </label>
              <span>关闭后只隐藏四个产品卡片，保留“全部明星产品”入口，不影响产品页。</span>
            </div>
            <div
              v-if="editor.pageType === 'home' && sectionIndex === 2"
              class="content-card-action-row"
            >
              <t-input v-model="section.actionText" placeholder="入口文字，例如：全部明星产品" />
              <t-input v-model="section.actionUrl" placeholder="跳转地址，例如：/pages/category/index" />
              <label class="action-tab"><t-switch v-model="section.actionTab" />底部导航页</label>
            </div>
            <div class="sub-editor-head">
              <span>内容项</span>
              <t-button variant="text" size="small" @click="addCard(section)"><template #icon><AddIcon /></template>添加内容项</t-button>
            </div>
            <div class="compact-editor-list">
              <div v-for="(card, cardIndex) in section.cards" :key="cardIndex" class="content-card-entry">
                <div class="compact-editor-row card-editor-row">
                  <span class="field-index">{{ cardIndex + 1 }}</span>
                  <t-input v-model="card.title" placeholder="内容项标题" />
                  <t-input v-model="card.desc" placeholder="内容项说明" />
                    <t-button aria-label="删除内容项" shape="square" variant="text" theme="danger" @click="removeAt(section.cards, cardIndex)"><DeleteIcon /></t-button>
                </div>
                <div v-if="editor.pageType === 'brand' || editor.pageType === 'strength'" class="brand-card-media-editor">
                  <MediaImageField
                    :model-value="card.image || ''"
                    :placeholder="editor.pageType === 'strength' ? '可选：实力证明展示图' : '可选：证书、报告、荣誉或报道展示图'"
                    @update:model-value="card.image = $event"
                  />
                  <template v-if="editor.pageType === 'brand'">
                    <MediaFileField
                      :model-value="card.fileUrl || ''"
                      placeholder="可选：对应 PDF 资料地址"
                      @update:model-value="card.fileUrl = $event"
                    />
                    <t-input v-model="card.fileName" placeholder="可选：附件名称，例如 检测报告 PDF" />
                  </template>
                </div>
                <div class="content-card-action-row">
                  <t-input v-model="card.actionText" placeholder="可选：操作文字，例如 查看详情" />
                  <t-input v-model="card.url" placeholder="可选：小程序页面路径" />
                  <label class="action-tab"><t-switch v-model="card.tab" />底部导航页</label>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>发展历程</h3><p>没有内容时，小程序不会显示该板块。</p></div>
          <t-button variant="outline" size="small" @click="addTimeline"><template #icon><AddIcon /></template>添加历程</t-button>
        </div>
        <div class="compact-editor-list">
          <div v-for="(item, index) in editor.timeline" :key="index" class="compact-editor-row timeline-editor-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="item.year" placeholder="年份" />
            <t-input v-model="item.text" placeholder="事件说明" />
              <t-button aria-label="删除历程项" shape="square" variant="text" theme="danger" @click="removeAt(editor.timeline, index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>合作案例</h3><p>用于品牌背书与合作成果展示。</p></div>
          <t-button variant="outline" size="small" @click="addCase"><template #icon><AddIcon /></template>添加案例</t-button>
        </div>
        <div class="compact-editor-list">
          <div v-for="(item, index) in editor.cases" :key="index" class="compact-editor-row case-editor-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="item.name" placeholder="合作方" />
            <t-input v-model="item.type" placeholder="合作类型" />
            <t-input v-model="item.result" placeholder="合作成果" />
              <t-button aria-label="删除案例" shape="square" variant="text" theme="danger" @click="removeAt(editor.cases, index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>常见问题</h3><p>招商页面可维护问题与回答。</p></div>
          <t-button variant="outline" size="small" @click="addFaq"><template #icon><AddIcon /></template>添加问答</t-button>
        </div>
        <div class="compact-editor-list">
          <div v-for="(item, index) in editor.faq" :key="index" class="compact-editor-row faq-editor-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="item.q" placeholder="问题" />
            <t-input v-model="item.a" placeholder="回答" />
              <t-button aria-label="删除常见问题" shape="square" variant="text" theme="danger" @click="removeAt(editor.faq, index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>页面按钮</h3><p>控制页面底部两个操作入口。</p></div>
        </div>
        <div class="action-editor-grid">
          <div class="action-editor">
            <strong>主按钮</strong>
            <t-input v-model="editor.primaryAction.text" placeholder="按钮文字" />
            <t-input v-model="editor.primaryAction.url" placeholder="小程序页面路径" />
            <label class="action-tab"><t-switch v-model="editor.primaryAction.tab" />跳转到底部导航页</label>
          </div>
          <div class="action-editor">
            <strong>次按钮</strong>
            <t-input v-model="editor.secondaryAction.text" placeholder="按钮文字" />
            <t-input v-model="editor.secondaryAction.url" placeholder="小程序页面路径" />
            <label class="action-tab"><t-switch v-model="editor.secondaryAction.tab" />跳转到底部导航页</label>
          </div>
        </div>
      </section>

      <div class="dialog-actions sticky-dialog-actions">
        <t-button variant="outline" @click="dialogVisible = false">取消</t-button>
        <t-button theme="primary" :loading="saving" @click="save">
          <template #icon><SaveIcon /></template>
          保存内容
        </t-button>
      </div>
    </div>
  </t-dialog>
</template>
