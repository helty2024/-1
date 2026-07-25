<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { AddIcon, DeleteIcon, RefreshIcon, SaveIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
import {
  createContentPage,
  listContentPages,
  updateContentPage,
  updateContentPageStatus,
  type ContentBlock,
  type ContentCard,
  type ContentPage,
  type ContentStat,
  type SaveContentPagePayload,
} from '../api/content'
import { resolveApiError } from '../api/client'
import MediaImageField from '../components/MediaImageField.vue'

interface CooperationPageEditor {
  id: string
  version: number
  status: string
  label: string
  title: string
  subtitle: string
  coverImage: string
  stats: ContentStat[]
  sections: ContentBlock[]
}

const loading = ref(false)
const saving = ref(false)
const activeModule = ref<'page' | 'subsections'>('page')
const editor = reactive<CooperationPageEditor>(defaultEditor())

function block(title: string, body: string, cards: ContentCard[] = []): ContentBlock {
  return { title, body, image: '', cards }
}

function defaultEditor(): CooperationPageEditor {
  return {
    id: '',
    version: 1,
    status: 'draft',
    label: '代理合作 · 申请对接',
    title: '申请中康参芝合作',
    subtitle: '面向代理商、团长、门店和电商渠道开放合作咨询，提供完整产品资料、渠道政策与专属合作服务。',
    coverImage: '/images/brand/cooperation-bg.jpg',
    stats: [],
    sections: [
      block('多渠道合作伙伴招募', '根据不同经营资源与客户基础，中康参芝面向区域市场、私域团购、线下门店和电商渠道开放合作。'),
      block('合作后可获得的支持', '围绕产品展示、政策对接和渠道运营，为合作伙伴提供持续、规范的业务支持。'),
      block('选择合作方向', '请选择与您当前需求相符的合作方向，提交信息后由专属人员安排后续对接。'),
    ],
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
    cards: clone(source?.cards ?? fallback.cards).map((card) => ({
      ...card,
      actionText: card.actionText ?? '',
      url: card.url ?? '',
      tab: card.tab ?? false,
    })),
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
    stats: clone(page.stats),
    sections: fallback.sections.map((item, index) => normalizedBlock(page.sections[index], item)),
  })
}

async function load() {
  loading.value = true
  try {
    const pages = await listContentPages()
    const page = pages.find((item) => item.pageType === 'cooperation' || item.slug === 'cooperation')
    if (page) hydrate(page)
    else Object.assign(editor, defaultEditor())
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    loading.value = false
  }
}

function addStat() {
  editor.stats.push({ value: '', label: '' })
}

function addCard(sectionIndex: number) {
  editor.sections[sectionIndex].cards.push({ title: '', desc: '', actionText: '', url: '', tab: false })
}

function removeAt<T>(items: T[], index: number) {
  items.splice(index, 1)
}

function validate() {
  if (!editor.label.trim() || !editor.title.trim() || !editor.subtitle.trim()) return '请完整填写合作页首屏文字'
  if (editor.stats.some((item) => !item.value.trim() || !item.label.trim())) return '请完整填写数据指标'
  if (editor.sections.some((section) => !section.title.trim() || !section.body.trim())) return '请完整填写合作页各子板块'
  if (editor.sections.some((section) => section.cards.some((card) => !card.title.trim() || !card.desc.trim()))) return '请完整填写子板块内容项'
  if (editor.sections.some((section) => section.cards.some((card) => Boolean(card.actionText?.trim()) !== Boolean(card.url?.trim())))) return '互动文字和跳转路径需要同时填写'
  return ''
}

function payload(): SaveContentPagePayload {
  return {
    slug: 'cooperation',
    pageType: 'cooperation',
    navTitle: '合作页内容',
    label: editor.label.trim(),
    title: editor.title.trim(),
    subtitle: editor.subtitle.trim(),
    coverImage: editor.coverImage.trim(),
    stats: clone(editor.stats),
    sections: clone(editor.sections),
    timeline: [],
    cases: [],
    faq: [],
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
    await MessagePlugin.success('合作页内容已保存')
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
      <div><span class="section-kicker">COOPERATION PAGE CONTENT</span><h2>合作页内容</h2><p>管理小程序底部“合作”页面；招商政策和投资合作详情在“首页内容”的子板块中维护。</p></div>
      <div class="toolbar-actions"><t-button variant="outline" :loading="loading" @click="load"><template #icon><RefreshIcon /></template>刷新</t-button><t-button theme="primary" :loading="saving" @click="save"><template #icon><SaveIcon /></template>保存合作页</t-button></div>
    </div>

    <div class="home-module-switch" role="tablist" aria-label="合作页内容编辑模块">
      <button :class="{ 'is-active': activeModule === 'page' }" type="button" @click="activeModule = 'page'"><strong>页面编辑</strong><span>首屏文字、背景图和数据</span></button>
      <button :class="{ 'is-active': activeModule === 'subsections' }" type="button" @click="activeModule = 'subsections'"><strong>子板块内容编辑</strong><span>合作渠道、合作支持和合作方向</span></button>
    </div>

    <div class="home-content-module" :class="{ 'is-loading': loading }">
      <div class="home-content-module-head"><div v-if="activeModule === 'page'"><h3>页面编辑</h3><p>修改合作页首屏的文字、图像和数据。</p></div><div v-else><h3>子板块内容编辑</h3><p>前两组为客户阅读内容，第三组为可点击的合作入口。</p></div></div>
      <div class="content-editor product-page-content-editor">
        <section v-if="activeModule === 'page'" class="editor-group">
          <div class="editor-group-head"><div><h3>合作页首屏</h3><p>控制背景图上的标签、标题、简介和背景图片。</p></div></div>
          <div class="form-editor-grid"><t-form-item label="内容标签"><t-input v-model="editor.label" /></t-form-item><t-form-item label="页面状态"><t-tag theme="success">{{ editor.status === 'published' ? '已发布' : editor.status }}</t-tag></t-form-item><t-form-item label="首屏标题" class="span-2"><t-input v-model="editor.title" /></t-form-item><t-form-item label="首屏简介" class="span-2"><t-textarea v-model="editor.subtitle" :autosize="{ minRows: 2, maxRows: 5 }" /></t-form-item><t-form-item label="背景图片" class="span-2"><MediaImageField v-model="editor.coverImage" /></t-form-item></div>
        </section>

        <section v-if="activeModule === 'page'" class="editor-group">
          <div class="editor-group-head"><div><h3>首屏数据指标</h3><p>合作页需要展示数据时在这里添加，不需要可保持为空。</p></div><t-button variant="outline" size="small" @click="addStat"><template #icon><AddIcon /></template>添加数据</t-button></div>
          <div class="compact-editor-list"><div v-for="(item, index) in editor.stats" :key="index" class="compact-editor-row stat-editor-row"><span class="field-index">{{ index + 1 }}</span><t-input v-model="item.value" placeholder="数值" /><t-input v-model="item.label" placeholder="说明" /><t-button aria-label="删除数据项" shape="square" variant="text" theme="danger" @click="removeAt(editor.stats, index)"><DeleteIcon /></t-button></div></div>
        </section>

        <template v-else>
          <section v-for="(section, sectionIndex) in editor.sections" :key="sectionIndex" class="editor-group">
            <div class="editor-group-head"><div><h3>{{ sectionIndex + 1 }}. {{ section.title || '未命名板块' }}</h3><p>{{ sectionIndex === 2 ? '这一组内容项可以点击进入申请表单或政策详情。' : '这一组用于客户阅读，不设置点击跳转。' }}</p></div><t-button variant="outline" size="small" @click="addCard(sectionIndex)"><template #icon><AddIcon /></template>添加内容项</t-button></div>
            <t-input v-model="section.title" placeholder="板块标题" /><t-textarea v-model="section.body" placeholder="板块简介" :autosize="{ minRows: 2, maxRows: 5 }" />
            <div class="repeat-editor-list"><div v-for="(card, cardIndex) in section.cards" :key="cardIndex" class="repeat-editor-item"><div class="repeat-editor-head"><strong>内容项 {{ cardIndex + 1 }}</strong><t-button aria-label="删除内容项" shape="square" variant="text" theme="danger" @click="removeAt(section.cards, cardIndex)"><DeleteIcon /></t-button></div><div v-if="sectionIndex === 2" class="form-editor-grid"><t-form-item label="标题"><t-input v-model="card.title" /></t-form-item><t-form-item label="按钮文字"><t-input v-model="card.actionText" /></t-form-item><t-form-item label="说明" class="span-2"><t-input v-model="card.desc" /></t-form-item><t-form-item label="跳转路径" class="span-2"><t-input v-model="card.url" /></t-form-item></div><div v-else class="form-editor-grid"><t-form-item label="标题"><t-input v-model="card.title" /></t-form-item><t-form-item label="说明"><t-input v-model="card.desc" /></t-form-item></div></div></div>
          </section>
        </template>
      </div>
    </div>
  </section>
</template>
