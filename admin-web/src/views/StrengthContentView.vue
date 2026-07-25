<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { AddIcon, DeleteIcon, RefreshIcon, SaveIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
import {
  createContentPage,
  listContentPages,
  updateContentPage,
  updateContentPageStatus,
  type ContentAction,
  type ContentBlock,
  type ContentCard,
  type ContentPage,
  type ContentStat,
  type SaveContentPagePayload,
} from '../api/content'
import { resolveApiError } from '../api/client'
import MediaImageField from '../components/MediaImageField.vue'

interface StrengthPageEditor {
  id: string
  version: number
  status: string
  label: string
  title: string
  subtitle: string
  coverImage: string
  stats: ContentStat[]
  sections: ContentBlock[]
  primaryAction: ContentAction
  secondaryAction: ContentAction
}

const loading = ref(false)
const saving = ref(false)
const activeModule = ref<'page' | 'subsections'>('page')
const editor = reactive<StrengthPageEditor>(defaultEditor())

function action(text = '', url = '', tab = false): ContentAction {
  return { text, url, tab }
}

function block(title: string, body: string, cards: ContentCard[] = []): ContentBlock {
  return { title, body, image: '', cards }
}

function defaultEditor(): StrengthPageEditor {
  return {
    id: '',
    version: 1,
    status: 'draft',
    label: '企业实力 · 合作保障',
    title: '中康参芝合作实力',
    subtitle: '以长白山参类资源为基础，建立企业主体、源头基地、品质追溯与渠道服务一体化合作体系。',
    coverImage: '/images/brand/strength-bg.jpg',
    stats: [
      { value: '2018年', label: '公司成立' },
      { value: '500万', label: '注册资本' },
      { value: '5.2万亩', label: '核心基地' },
      { value: '近40年', label: '参业积淀' },
    ],
    sections: [
      block('四大合作实力', '正规企业主体、长白山核心产区资源、全周期品质管理和持续渠道支持，共同构成值得长期合作的基础。'),
      block('品牌实力与品质溯源', '点击查看企业负责人、企业形象与品质资料，进一步了解中康参芝的经营基础。'),
      block('开启合作对接', '选择适合的合作方向，提交基本信息后，由专属人员进一步沟通产品、政策和合作方案。'),
    ],
    primaryAction: action('提交合作申请', '/pages/official/form-select/index?type=agent'),
    secondaryAction: action('查看招商政策', '/pages/official/content/index?type=join'),
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function normalizedBlock(source: ContentBlock | undefined, fallback: ContentBlock): ContentBlock {
  return {
    ...clone(fallback),
    ...clone(source ?? fallback),
    image: source?.image ?? fallback.image,
    cards: clone(source?.cards ?? fallback.cards),
  }
}

function hydrate(page: ContentPage) {
  const fallback = defaultEditor()
  const sourceSections = page.sections.length >= 4
    ? [page.sections[0], page.sections[1], page.sections[page.sections.length - 1]]
    : page.sections
  Object.assign(editor, {
    id: page.id,
    version: page.version,
    status: page.status,
    label: page.label,
    title: page.title,
    subtitle: page.subtitle,
    coverImage: page.coverImage,
    stats: clone(page.stats.length ? page.stats : fallback.stats),
    sections: fallback.sections.map((item, index) => normalizedBlock(sourceSections[index], item)),
    primaryAction: clone(page.primaryAction ?? fallback.primaryAction),
    secondaryAction: clone(page.secondaryAction ?? fallback.secondaryAction),
  })
}

async function load() {
  loading.value = true
  try {
    const pages = await listContentPages()
    const page = pages.find((item) => item.pageType === 'strength' || item.slug === 'strength')
    if (page) hydrate(page)
    else Object.assign(editor, defaultEditor())
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    loading.value = false
  }
}

function addCard(sectionIndex: number, withImage = false) {
  editor.sections[sectionIndex].cards.push({ title: '', desc: '', image: withImage ? '' : undefined })
}

function removeCard(sectionIndex: number, cardIndex: number) {
  editor.sections[sectionIndex].cards.splice(cardIndex, 1)
}

function validate() {
  if (!editor.label.trim() || !editor.title.trim() || !editor.subtitle.trim()) return '请完整填写实力页首屏文字'
  if (editor.stats.some((item) => !item.value.trim() || !item.label.trim())) return '请完整填写数据指标'
  if (editor.sections.some((item) => !item.title.trim() || !item.body.trim())) return '请完整填写实力页各板块标题和简介'
  if (editor.sections.slice(0, 2).some((item) => item.cards.some((card) => !card.title?.trim()))) return '请完整填写卡片标题'
  return ''
}

function payload(): SaveContentPagePayload {
  return {
    slug: 'strength',
    pageType: 'strength',
    navTitle: '实力页内容',
    label: editor.label.trim(),
    title: editor.title.trim(),
    subtitle: editor.subtitle.trim(),
    coverImage: editor.coverImage.trim(),
    stats: clone(editor.stats),
    sections: clone(editor.sections),
    timeline: [],
    cases: [],
    faq: [],
    primaryAction: clone(editor.primaryAction),
    secondaryAction: clone(editor.secondaryAction),
  }
}

async function save() {
  const message = validate()
  if (message) {
    await MessagePlugin.warning(message)
    return
  }

  saving.value = true
  try {
    if (editor.id) {
      await updateContentPage(editor.id, payload())
    } else {
      const created = await createContentPage(payload())
      await updateContentPageStatus(created.id, 'published')
    }
    await MessagePlugin.success('实力页内容已保存')
    await load()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="business-page content-page-admin">
    <div class="module-toolbar">
      <div>
        <span class="section-kicker">STRENGTH PAGE CONTENT</span>
        <h2>实力页内容</h2>
        <p>这里的内容与小程序底部“实力”页面一一对应。</p>
      </div>
      <div class="toolbar-actions">
        <t-button variant="outline" :loading="loading" @click="load"><template #icon><RefreshIcon /></template>刷新</t-button>
        <t-button theme="primary" :loading="saving" @click="save"><template #icon><SaveIcon /></template>保存实力页</t-button>
      </div>
    </div>

    <div class="home-module-switch" role="tablist" aria-label="实力页内容编辑模块">
      <button :class="{ 'is-active': activeModule === 'page' }" type="button" @click="activeModule = 'page'">
        <strong>页面编辑</strong><span>首屏文字、背景图和数据</span>
      </button>
      <button :class="{ 'is-active': activeModule === 'subsections' }" type="button" @click="activeModule = 'subsections'">
        <strong>子板块内容编辑</strong><span>实力概览、可点击图册和申请区</span>
      </button>
    </div>

    <div class="home-content-module" :class="{ 'is-loading': loading }">
      <div class="home-content-module-head">
        <div v-if="activeModule === 'page'"><h3>页面编辑</h3><p>修改实力页首屏的文字、图像和四项企业数据。</p></div>
        <div v-else><h3>子板块内容编辑</h3><p>修改实力概览、可点击品牌图册和底部申请区。</p></div>
      </div>
      <div class="content-editor product-page-content-editor">
      <section v-if="activeModule === 'page'" class="editor-group">
        <div class="editor-group-head"><div><h3>实力页首屏</h3><p>控制背景图上的标签、标题、简介和背景图片。</p></div></div>
        <div class="form-editor-grid">
          <t-form-item label="内容标签"><t-input v-model="editor.label" /></t-form-item>
          <t-form-item label="页面状态"><t-tag theme="success">{{ editor.status === 'published' ? '已发布' : editor.status }}</t-tag></t-form-item>
          <t-form-item label="首屏标题" class="span-2"><t-input v-model="editor.title" /></t-form-item>
          <t-form-item label="首屏简介" class="span-2"><t-textarea v-model="editor.subtitle" :autosize="{ minRows: 2, maxRows: 5 }" /></t-form-item>
          <t-form-item label="背景图片" class="span-2"><MediaImageField v-model="editor.coverImage" /></t-form-item>
        </div>
      </section>

      <section v-if="activeModule === 'page'" class="editor-group">
        <div class="editor-group-head"><div><h3>首屏数据指标</h3><p>对应首屏背景图上的四项企业数据。</p></div></div>
        <div class="compact-editor-list">
          <div v-for="(item, index) in editor.stats" :key="index" class="compact-editor-row stat-editor-row">
            <span class="field-index">{{ index + 1 }}</span><t-input v-model="item.value" placeholder="数值" /><t-input v-model="item.label" placeholder="说明" />
          </div>
        </div>
      </section>

      <section v-if="activeModule === 'subsections'" class="editor-group">
        <div class="editor-group-head"><div><h3>四大合作实力</h3><p>对应首屏下方的非点击实力概览。</p></div><t-button variant="outline" size="small" @click="addCard(0)"><template #icon><AddIcon /></template>添加实力项</t-button></div>
        <t-input v-model="editor.sections[0].title" placeholder="板块标题" />
        <t-textarea v-model="editor.sections[0].body" placeholder="板块简介" :autosize="{ minRows: 2, maxRows: 5 }" />
        <div class="compact-editor-list">
          <div v-for="(card, index) in editor.sections[0].cards" :key="index" class="compact-editor-row card-editor-row">
            <span class="field-index">{{ index + 1 }}</span><t-input v-model="card.title" placeholder="标题" /><t-input v-model="card.desc" placeholder="说明" /><t-button aria-label="删除实力数据" shape="square" variant="text" theme="danger" @click="removeCard(0, index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section v-if="activeModule === 'subsections'" class="editor-group">
        <div class="editor-group-head"><div><h3>品牌实力与品质溯源</h3><p>这些图片卡片可点击进入对应的详细内容。</p></div><t-button variant="outline" size="small" @click="addCard(1, true)"><template #icon><AddIcon /></template>添加入口</t-button></div>
        <t-input v-model="editor.sections[1].title" placeholder="板块标题" />
        <t-textarea v-model="editor.sections[1].body" placeholder="板块简介" :autosize="{ minRows: 2, maxRows: 5 }" />
        <div class="repeat-editor-list">
          <div v-for="(card, index) in editor.sections[1].cards" :key="index" class="repeat-editor-item">
            <div class="repeat-editor-head"><strong>图片 {{ index + 1 }}</strong><t-button aria-label="删除图册图片" shape="square" variant="text" theme="danger" @click="removeCard(1, index)"><DeleteIcon /></t-button></div>
            <div class="form-editor-grid"><t-form-item label="标题"><t-input v-model="card.title" /></t-form-item><t-form-item label="按钮文字"><t-input v-model="card.actionText" placeholder="例如：查看详情" /></t-form-item><t-form-item label="说明" class="span-2"><t-input v-model="card.desc" /></t-form-item><t-form-item label="图片" class="span-2"><MediaImageField :model-value="card.image ?? ''" @update:model-value="card.image = $event" /></t-form-item><t-form-item label="页面路径" class="span-2"><t-input v-model="card.url" placeholder="填写后该卡片可以点击" /></t-form-item></div>
          </div>
        </div>
      </section>

      <section v-if="activeModule === 'subsections'" class="editor-group">
        <div class="editor-group-head"><div><h3>底部申请区</h3><p>对应实力页最下方的合作申请文案。</p></div></div>
        <t-input v-model="editor.sections[2].title" placeholder="板块标题" />
        <t-textarea v-model="editor.sections[2].body" placeholder="板块简介" :autosize="{ minRows: 2, maxRows: 5 }" />
      </section>

      <section v-if="activeModule === 'subsections'" class="editor-group">
        <div class="editor-group-head"><div><h3>底部行动按钮</h3><p>只控制实力页最下方的合作申请和招商政策入口。</p></div></div>
        <div class="action-editor-grid">
          <div class="action-editor"><strong>主按钮</strong><t-input v-model="editor.primaryAction.text" placeholder="按钮文字" /><t-input v-model="editor.primaryAction.url" placeholder="页面路径" /><label class="action-tab"><t-switch v-model="editor.primaryAction.tab" />底部导航页</label></div>
          <div class="action-editor"><strong>次按钮</strong><t-input v-model="editor.secondaryAction.text" placeholder="按钮文字" /><t-input v-model="editor.secondaryAction.url" placeholder="页面路径" /><label class="action-tab"><t-switch v-model="editor.secondaryAction.tab" />底部导航页</label></div>
        </div>
      </section>
      </div>
    </div>
  </section>
</template>
