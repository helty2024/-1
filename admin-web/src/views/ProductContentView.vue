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

interface ProductPageEditor {
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
const editor = reactive<ProductPageEditor>(defaultEditor())

function action(text = '', url = '', tab = false): ContentAction {
  return { text, url, tab }
}

function block(title: string, body: string, cards: ContentCard[] = []): ContentBlock {
  return {
    title,
    body,
    image: '',
    cards,
    actionText: '',
    actionUrl: '',
    actionTab: false,
    secondaryActionText: '',
    secondaryActionUrl: '',
    secondaryActionTab: false,
  }
}

function defaultEditor(): ProductPageEditor {
  const cta = block(
    '申请明星产品代理资料',
    '提交代理意向，获取产品目录、供货政策、渠道权益与专属对接服务。',
  )
  cta.actionText = '申请代理合作'
  cta.actionUrl = '/pages/usercenter/index'
  cta.actionTab = true
  cta.secondaryActionText = '复制合作意向'
  cta.secondaryActionUrl = 'copy:product-cooperation'

  return {
    id: '',
    version: 1,
    status: 'draft',
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
      block(
        '中康参芝明星产品',
        '从高频饮品、源头鲜参到高端礼盒，覆盖日常消费、复购、礼赠和企业采购需求。',
      ),
      block(
        '代理商可承接的销售场景',
        '明星产品覆盖私域、电商、线下门店与企业团购，为不同渠道提供稳定的产品供给。',
        [
          { title: '私域社群', desc: '覆盖社群分享、会员团购与老客复购，满足私域渠道的持续经营需求。' },
          { title: '电商平台', desc: '支持平台店铺、短视频和直播渠道，以源头品质与差异化产品承接线上消费需求。' },
          { title: '门店陈列', desc: '覆盖滋补品店、特产店、烟酒礼品店与康养门店，满足陈列、体验和礼赠销售需求。' },
          { title: '企业团购', desc: '面向员工福利、商务答谢、会议礼品和节庆采购，提供多规格产品组合。' },
        ],
      ),
      cta,
    ],
    primaryAction: action('看品牌背书', '/pages/cart/index', true),
    secondaryAction: action('申请合作', '/pages/usercenter/index', true),
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function normalizedBlock(source: ContentBlock | undefined, fallback: ContentBlock) {
  return {
    ...clone(fallback),
    ...clone(source ?? fallback),
    image: source?.image ?? fallback.image,
    cards: clone(source?.cards ?? fallback.cards),
    actionText: source?.actionText ?? fallback.actionText,
    actionUrl: source?.actionUrl ?? fallback.actionUrl,
    actionTab: source?.actionTab ?? fallback.actionTab,
    secondaryActionText: source?.secondaryActionText ?? fallback.secondaryActionText,
    secondaryActionUrl: source?.secondaryActionUrl ?? fallback.secondaryActionUrl,
    secondaryActionTab: source?.secondaryActionTab ?? fallback.secondaryActionTab,
  }
}

function hydrate(page: ContentPage) {
  const fallback = defaultEditor()
  Object.assign(editor, {
    id: page.id,
    version: page.version,
    status: page.status,
    label: page.label,
    title: page.title,
    subtitle: page.subtitle,
    coverImage: page.coverImage,
    stats: clone(page.stats.length ? page.stats : fallback.stats),
    sections: fallback.sections.map((item, index) => normalizedBlock(page.sections[index], item)),
    primaryAction: clone(page.primaryAction ?? fallback.primaryAction),
    secondaryAction: clone(page.secondaryAction ?? fallback.secondaryAction),
  })
}

async function load() {
  loading.value = true
  try {
    const pages = await listContentPages()
    const page = pages.find((item) => item.pageType === 'products' || item.slug === 'products')
    if (page) hydrate(page)
    else Object.assign(editor, defaultEditor())
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    loading.value = false
  }
}

function addScenario() {
  editor.sections[1].cards.push({ title: '', desc: '' })
}

function removeScenario(index: number) {
  editor.sections[1].cards.splice(index, 1)
}

function validate() {
  if (!editor.label.trim() || !editor.title.trim() || !editor.subtitle.trim()) return '请完整填写产品页首屏文字'
  if (editor.stats.some((item) => !item.value.trim() || !item.label.trim())) return '请完整填写数据指标'
  if (editor.sections.some((item) => !item.title.trim() || !item.body.trim())) return '请完整填写三个页面板块'
  if (editor.sections[1].cards.some((item) => !item.title.trim() || !item.desc.trim())) return '请完整填写销售场景'
  return ''
}

function payload(): SaveContentPagePayload {
  return {
    slug: 'products',
    pageType: 'products',
    navTitle: '产品页内容',
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
    await MessagePlugin.success('产品页内容已保存')
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
        <span class="section-kicker">PRODUCT PAGE CONTENT</span>
        <h2>产品页内容</h2>
        <p>管理产品页首屏、页面说明、销售场景和申请入口；具体产品仍在“产品管理”中维护。</p>
      </div>
      <div class="toolbar-actions">
        <t-button variant="outline" :loading="loading" @click="load"><template #icon><RefreshIcon /></template>刷新</t-button>
        <t-button theme="primary" :loading="saving" @click="save"><template #icon><SaveIcon /></template>保存产品页</t-button>
      </div>
    </div>

    <div class="home-module-switch" role="tablist" aria-label="产品页内容编辑模块">
      <button :class="{ 'is-active': activeModule === 'page' }" type="button" @click="activeModule = 'page'">
        <strong>页面编辑</strong><span>首屏文字、背景图、数据和按钮</span>
      </button>
      <button :class="{ 'is-active': activeModule === 'subsections' }" type="button" @click="activeModule = 'subsections'">
        <strong>子板块内容编辑</strong><span>产品区说明、销售场景和申请区</span>
      </button>
    </div>

    <div class="home-content-module" :class="{ 'is-loading': loading }">
      <div class="home-content-module-head">
        <div v-if="activeModule === 'page'"><h3>页面编辑</h3><p>修改产品页首屏的文字、图像、四项数据和操作按钮。</p></div>
        <div v-else><h3>子板块内容编辑</h3><p>修改产品列表说明、代理商销售场景和底部申请区。</p></div>
      </div>
      <div class="content-editor product-page-content-editor">
      <section v-if="activeModule === 'page'" class="editor-group">
        <div class="editor-group-head"><div><h3>产品页首屏</h3><p>标题需要换行时，请直接在标题输入框中换行。</p></div></div>
        <div class="form-editor-grid">
          <t-form-item label="内容标签"><t-input v-model="editor.label" /></t-form-item>
          <t-form-item label="页面状态"><t-tag theme="success">{{ editor.status === 'published' ? '已发布' : editor.status }}</t-tag></t-form-item>
          <t-form-item label="首屏标题" class="span-2"><t-textarea v-model="editor.title" :autosize="{ minRows: 2, maxRows: 3 }" /></t-form-item>
          <t-form-item label="首屏简介" class="span-2"><t-textarea v-model="editor.subtitle" :autosize="{ minRows: 2, maxRows: 5 }" /></t-form-item>
          <t-form-item label="背景图片" class="span-2"><MediaImageField v-model="editor.coverImage" /></t-form-item>
        </div>
      </section>

      <section v-if="activeModule === 'page'" class="editor-group">
        <div class="editor-group-head"><div><h3>数据指标</h3><p>第一项产品数量会根据已发布产品自动更新。</p></div></div>
        <div class="compact-editor-list">
          <div v-for="(item, index) in editor.stats" :key="index" class="compact-editor-row stat-editor-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="item.value" placeholder="数值" />
            <t-input v-model="item.label" placeholder="说明" />
          </div>
        </div>
      </section>

      <section v-if="activeModule === 'subsections'" class="editor-group">
        <div class="editor-group-head"><div><h3>明星产品列表说明</h3><p>只控制产品列表上方文字，不修改具体产品。</p></div></div>
        <t-input v-model="editor.sections[0].title" placeholder="板块标题" />
        <t-textarea v-model="editor.sections[0].body" placeholder="板块简介" :autosize="{ minRows: 2, maxRows: 5 }" />
      </section>

      <section v-if="activeModule === 'subsections'" class="editor-group">
        <div class="editor-group-head">
          <div><h3>代理商销售场景</h3><p>管理产品列表下方的非交互说明内容。</p></div>
          <t-button variant="outline" size="small" @click="addScenario"><template #icon><AddIcon /></template>添加场景</t-button>
        </div>
        <t-input v-model="editor.sections[1].title" placeholder="板块标题" />
        <t-textarea v-model="editor.sections[1].body" placeholder="板块简介" :autosize="{ minRows: 2, maxRows: 5 }" />
        <div class="compact-editor-list">
          <div v-for="(card, index) in editor.sections[1].cards" :key="index" class="compact-editor-row card-editor-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="card.title" placeholder="场景名称" />
            <t-input v-model="card.desc" placeholder="场景说明" />
              <t-button aria-label="删除销售场景" shape="square" variant="text" theme="danger" @click="removeScenario(index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section v-if="activeModule === 'page'" class="editor-group">
        <div class="editor-group-head"><div><h3>首屏按钮</h3><p>控制产品页背景图上的两个入口。</p></div></div>
        <div class="action-editor-grid">
          <div class="action-editor"><strong>主按钮</strong><t-input v-model="editor.primaryAction.text" placeholder="按钮文字" /><t-input v-model="editor.primaryAction.url" placeholder="页面路径" /><label class="action-tab"><t-switch v-model="editor.primaryAction.tab" />底部导航页</label></div>
          <div class="action-editor"><strong>次按钮</strong><t-input v-model="editor.secondaryAction.text" placeholder="按钮文字" /><t-input v-model="editor.secondaryAction.url" placeholder="页面路径" /><label class="action-tab"><t-switch v-model="editor.secondaryAction.tab" />底部导航页</label></div>
        </div>
      </section>

      <section v-if="activeModule === 'subsections'" class="editor-group">
        <div class="editor-group-head"><div><h3>底部申请区</h3><p>管理底部申请文案和两个操作入口。</p></div></div>
        <t-input v-model="editor.sections[2].title" placeholder="板块标题" />
        <t-textarea v-model="editor.sections[2].body" placeholder="板块简介" :autosize="{ minRows: 2, maxRows: 5 }" />
        <div class="action-editor-grid">
          <div class="action-editor"><strong>主按钮</strong><t-input v-model="editor.sections[2].actionText" placeholder="按钮文字" /><t-input v-model="editor.sections[2].actionUrl" placeholder="页面路径" /><label class="action-tab"><t-switch v-model="editor.sections[2].actionTab" />底部导航页</label></div>
          <div class="action-editor"><strong>次按钮</strong><t-input v-model="editor.sections[2].secondaryActionText" placeholder="按钮文字" /><t-input v-model="editor.sections[2].secondaryActionUrl" placeholder="页面路径或 copy:product-cooperation" /><label class="action-tab"><t-switch v-model="editor.sections[2].secondaryActionTab" />底部导航页</label></div>
        </div>
      </section>
      </div>
    </div>
  </section>
</template>
