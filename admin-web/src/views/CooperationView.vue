<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  RefreshIcon,
  RocketIcon,
  SaveIcon,
} from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
import { resolveApiError } from '../api/client'
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
import MediaImageField from '../components/MediaImageField.vue'

type CooperationType = 'cooperation' | 'join' | 'investment'

interface CooperationEditor extends SaveContentPagePayload {
  id: string
  status: ContentStatus
  version: number
  primaryAction: ContentAction
  secondaryAction: ContentAction
}

const definitions: Array<{
  type: CooperationType
  label: string
  description: string
}> = [
  { type: 'cooperation', label: '合作首页', description: '合作介绍、支持内容、合作方向与首页按钮' },
  { type: 'join', label: '招商代理', description: '合作模式、代理权益、扶持政策与合作流程' },
  { type: 'investment', label: '投资合作', description: '项目介绍、商业模式、增长规划与资源需求' },
]

const applicationOptions = [
  { label: '代理申请表', value: '/pages/official/form-select/index?type=agent' },
  { label: '投资合作申请表', value: '/pages/official/form-select/index?type=investment' },
  { label: '普通咨询表', value: '/pages/official/form-select/index?type=consult' },
]

const pages = ref<ContentPage[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editor = reactive<CooperationEditor>(emptyEditor('join'))
const activeDefinition = computed(
  () => definitions.find((item) => item.type === editor.pageType) ?? definitions[0],
)

function emptyAction(): ContentAction {
  return { text: '', url: '', tab: false }
}

function starterSections(type: CooperationType): ContentBlock[] {
  const titles = type === 'cooperation'
    ? ['多渠道合作伙伴招募', '合作后可获取的支持', '选择合作方向', '提交合作意向']
    : type === 'join'
      ? ['合作模式', '代理权益', '扶持政策', '合作流程']
      : ['项目介绍', '商业模式', '增长规划', '合作方向', '资源需求']
  return titles.map((title) => ({ title, body: '', image: '', cards: [] }))
}

function emptyEditor(type: CooperationType): CooperationEditor {
  const isJoin = type === 'join'
  const isLanding = type === 'cooperation'
  return {
    id: '',
    slug: type,
    pageType: type,
    navTitle: isLanding ? '合作' : isJoin ? '招商政策' : '投资合作',
    label: isLanding ? '代理合作 · 申请对接' : isJoin ? '招商代理' : '投资合作',
    title: isLanding ? '申请中康参芝合作' : isJoin ? '中康参芝招商合作' : '中康参芝投资合作',
    subtitle: '',
    coverImage: '',
    status: 'draft',
    version: 1,
    stats: [],
    sections: starterSections(type),
    timeline: [],
    cases: [],
    faq: [],
    primaryAction: {
      text: isLanding ? '复制合作意向' : isJoin ? '提交代理申请' : '提交投资合作申请',
      url: isLanding
        ? 'copy:contact'
        : isJoin
          ? '/pages/official/form-select/index?type=agent'
          : '/pages/official/form-select/index?type=investment',
      tab: false,
    },
    secondaryAction: isLanding
      ? { text: '查看产品货盘', url: '/pages/category/index', tab: true }
      : emptyAction(),
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function pageFor(type: CooperationType) {
  return pages.value.find((page) => page.slug === type || page.pageType === type)
}

function openEditor(type: CooperationType) {
  const page = pageFor(type)
  if (!page) {
    Object.assign(editor, emptyEditor(type))
  } else {
    Object.assign(editor, {
      id: page.id,
      slug: page.slug,
      pageType: type,
      navTitle: page.navTitle,
      label: page.label,
      title: page.title,
      subtitle: page.subtitle,
      coverImage: page.coverImage,
      status: page.status,
      version: page.version,
      stats: clone(page.stats),
      sections: clone(page.sections).map((section) => ({ ...section, image: section.image ?? '' })),
      timeline: clone(page.timeline),
      cases: clone(page.cases),
      faq: clone(page.faq),
      primaryAction: clone(page.primaryAction ?? emptyAction()),
      secondaryAction: clone(page.secondaryAction ?? emptyAction()),
    })
  }
  dialogVisible.value = true
}

async function load() {
  loading.value = true
  try {
    pages.value = await listContentPages()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    loading.value = false
  }
}

function addStat() {
  editor.stats.push({ value: '', label: '' })
}

function addSection() {
  editor.sections.push({ title: '', body: '', image: '', cards: [] })
}

function addCard(section: ContentBlock) {
  section.cards.push({ title: '', desc: '', actionText: '', url: '', tab: false })
}

function addFaq() {
  editor.faq.push({ q: '', a: '' })
}

function removeAt<T>(items: T[], index: number) {
  items.splice(index, 1)
}

function validateEditor() {
  if (!editor.navTitle.trim() || !editor.label.trim() || !editor.title.trim()) {
    return '请完整填写导航标题、内容标签和页面主标题'
  }
  if (!editor.subtitle.trim()) return '请填写页面副标题'
  if (editor.stats.some((item) => !item.value.trim() || !item.label.trim())) {
    return '请完整填写每项核心数据'
  }
  if (editor.sections.some((section) => !section.title.trim() || !section.body.trim())) {
    return '请完整填写每个政策板块的标题和说明'
  }
  if (editor.sections.some((section) => section.cards.some((card) => !card.title.trim() || !card.desc.trim()))) {
    return '请完整填写政策板块中的所有条目'
  }
  if (
    editor.pageType === 'cooperation' &&
    editor.sections.some((section) =>
      section.cards.some((card) => Boolean(card.actionText?.trim()) !== Boolean(card.url?.trim())),
    )
  ) {
    return '互动文字和跳转路径需要同时填写；不互动的说明项请全部留空'
  }
  if (editor.faq.some((item) => !item.q.trim() || !item.a.trim())) {
    return '请完整填写常见问题和回答'
  }
  if (!editor.primaryAction.text.trim() || !editor.primaryAction.url) {
    return '请配置申请按钮和关联表单'
  }
  if (Boolean(editor.secondaryAction.text.trim()) !== Boolean(editor.secondaryAction.url.trim())) {
    return '辅助按钮文字和跳转路径需要同时填写'
  }
  return ''
}

function optionalAction(action: ContentAction) {
  return action.text.trim() && action.url.trim()
    ? { text: action.text.trim(), url: action.url.trim(), tab: Boolean(action.tab) }
    : undefined
}

function payload(): SaveContentPagePayload {
  return {
    slug: editor.slug,
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
    primaryAction: optionalAction(editor.primaryAction),
    secondaryAction: optionalAction(editor.secondaryAction),
  }
}

async function persist(publish = false) {
  const message = validateEditor()
  if (message) {
    await MessagePlugin.warning(message)
    return
  }

  saving.value = true
  try {
    const saved = editor.id
      ? await updateContentPage(editor.id, payload())
      : await createContentPage(payload())
    if (publish && saved.status !== 'published') {
      await updateContentPageStatus(saved.id, 'published')
    }
    dialogVisible.value = false
    await MessagePlugin.success(publish ? '内容已保存并发布' : '内容已保存')
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
    await MessagePlugin.success(status === 'published' ? '内容已发布' : '内容已下线')
    await load()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  }
}

function statusLabel(status?: ContentStatus) {
  if (status === 'published') return '已发布'
  if (status === 'offline') return '已下线'
  if (status === 'draft') return '草稿'
  return '尚未建立'
}

function statusTheme(status?: ContentStatus) {
  if (status === 'published') return 'success'
  if (status === 'offline') return 'danger'
  return 'warning'
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '-'
}

onMounted(load)
</script>

<template>
  <section class="business-page cooperation-page-admin">
    <div class="module-toolbar">
      <div>
        <span class="section-kicker">COOPERATION MANAGEMENT</span>
        <h2>招商合作</h2>
        <p>集中维护招商代理与投资合作内容，发布后同步到小程序合作页面。</p>
      </div>
      <div class="toolbar-actions">
        <t-button variant="outline" :loading="loading" @click="load">
          <template #icon><RefreshIcon /></template>
          刷新
        </t-button>
      </div>
    </div>

    <div class="data-table-wrap" :class="{ 'is-loading': loading }">
      <table class="data-table cooperation-table">
        <thead>
          <tr>
            <th>合作方向</th>
            <th>页面标题</th>
            <th>内容结构</th>
            <th>申请入口</th>
            <th>状态</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="definition in definitions" :key="definition.type">
            <td>
              <strong>{{ definition.label }}</strong>
              <small>{{ definition.description }}</small>
            </td>
            <td>{{ pageFor(definition.type)?.title || '尚未建立内容页' }}</td>
            <td>
              {{ pageFor(definition.type)?.sections.length ?? 0 }} 个板块 ·
              {{ pageFor(definition.type)?.faq.length ?? 0 }} 个问答
            </td>
            <td>{{ pageFor(definition.type)?.primaryAction?.text || '未配置' }}</td>
            <td>
              <t-tag :theme="statusTheme(pageFor(definition.type)?.status)">
                {{ statusLabel(pageFor(definition.type)?.status) }}
              </t-tag>
            </td>
            <td>{{ formatDate(pageFor(definition.type)?.updatedAt) }}</td>
            <td>
              <div class="row-actions">
                <t-button size="small" variant="text" @click="openEditor(definition.type)">
                  <template #icon><EditIcon /></template>
                  {{ pageFor(definition.type) ? '编辑' : '初始化' }}
                </t-button>
                <t-button
                  v-if="pageFor(definition.type) && pageFor(definition.type)?.status !== 'published'"
                  size="small"
                  variant="text"
                  theme="success"
                  @click="changeStatus(pageFor(definition.type)!, 'published')"
                >发布</t-button>
                <t-button
                  v-if="pageFor(definition.type)?.status === 'published'"
                  size="small"
                  variant="text"
                  theme="warning"
                  @click="changeStatus(pageFor(definition.type)!, 'offline')"
                >下线</t-button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <t-dialog
    v-model:visible="dialogVisible"
    :header="`${activeDefinition.label}内容编辑${editor.id ? ` · V${editor.version}` : ''}`"
    width="1160px"
    :close-on-overlay-click="false"
    :footer="false"
  >
    <div class="content-editor cooperation-editor">
      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>页面信息</h3><p>设置合作页面首屏展示的标题、简介与主视觉。</p></div>
        </div>
        <div class="form-editor-grid">
          <t-form-item label="页面编码"><t-input v-model="editor.slug" disabled /></t-form-item>
          <t-form-item label="页面类型"><t-input :value="activeDefinition.label" disabled /></t-form-item>
          <t-form-item label="导航标题"><t-input v-model="editor.navTitle" /></t-form-item>
          <t-form-item label="内容标签"><t-input v-model="editor.label" /></t-form-item>
          <t-form-item label="页面主标题" class="span-2"><t-input v-model="editor.title" /></t-form-item>
          <t-form-item label="页面副标题" class="span-2">
            <t-textarea v-model="editor.subtitle" :autosize="{ minRows: 2, maxRows: 5 }" />
          </t-form-item>
          <t-form-item label="页面封面图" class="span-2">
            <MediaImageField v-model="editor.coverImage" />
          </t-form-item>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>核心数据</h3><p>用数字快速说明合作项目的规模与重点。</p></div>
          <t-button variant="outline" size="small" @click="addStat">
            <template #icon><AddIcon /></template>添加数据
          </t-button>
        </div>
        <div class="compact-editor-list">
          <div v-for="(item, index) in editor.stats" :key="index" class="compact-editor-row stat-editor-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="item.value" placeholder="数值" />
            <t-input v-model="item.label" placeholder="数据说明" />
              <t-button aria-label="删除数据项" shape="square" variant="text" theme="danger" @click="removeAt(editor.stats, index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div>
            <h3>
              {{ editor.pageType === 'cooperation' ? '合作首页板块' : editor.pageType === 'join' ? '招商政策板块' : '投资合作板块' }}
            </h3>
            <p>每个板块可维护说明、展示图片和多项具体合作内容。</p>
          </div>
          <t-button variant="outline" size="small" @click="addSection">
            <template #icon><AddIcon /></template>添加板块
          </t-button>
        </div>
        <div class="content-block-list">
          <article v-for="(section, sectionIndex) in editor.sections" :key="sectionIndex" class="content-block-editor">
            <div class="content-block-head">
              <strong>板块 {{ sectionIndex + 1 }}</strong>
              <t-button aria-label="删除内容板块" shape="square" variant="text" theme="danger" @click="removeAt(editor.sections, sectionIndex)"><DeleteIcon /></t-button>
            </div>
            <t-input v-model="section.title" placeholder="例如：合作模式、代理权益、扶持政策" />
            <t-textarea v-model="section.body" placeholder="面向合作方的板块说明" :autosize="{ minRows: 2, maxRows: 6 }" />
            <MediaImageField v-model="section.image" placeholder="可选：该板块的展示图片" />
            <div class="sub-editor-head">
              <span>具体条目</span>
              <t-button variant="text" size="small" @click="addCard(section)">
                <template #icon><AddIcon /></template>添加条目
              </t-button>
            </div>
            <div class="compact-editor-list">
              <div v-for="(card, cardIndex) in section.cards" :key="cardIndex" class="cooperation-card-entry">
                <div class="compact-editor-row card-editor-row">
                  <span class="field-index">{{ cardIndex + 1 }}</span>
                  <t-input v-model="card.title" placeholder="条目标题" />
                  <t-input v-model="card.desc" placeholder="条目说明" />
                    <t-button aria-label="删除内容项" shape="square" variant="text" theme="danger" @click="removeAt(section.cards, cardIndex)"><DeleteIcon /></t-button>
                </div>
                <div v-if="editor.pageType === 'cooperation'" class="cooperation-card-action-row">
                  <t-input v-model="card.actionText" placeholder="互动文字；留空则为不可点击的说明项" />
                  <t-input v-model="card.url" placeholder="小程序跳转路径" />
                  <label class="action-tab"><t-switch v-model="card.tab" />底部导航页</label>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>常见问题</h3><p>回答合作门槛、授权、供货和对接方式等常见疑问。</p></div>
          <t-button variant="outline" size="small" @click="addFaq">
            <template #icon><AddIcon /></template>添加问答
          </t-button>
        </div>
        <div class="compact-editor-list">
          <div v-for="(item, index) in editor.faq" :key="index" class="compact-editor-row faq-editor-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="item.q" placeholder="合作方的问题" />
            <t-input v-model="item.a" placeholder="正式回答" />
              <t-button aria-label="删除常见问题" shape="square" variant="text" theme="danger" @click="removeAt(editor.faq, index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>申请与辅助入口</h3><p>设置页面底部的申请按钮，并可配置一个辅助跳转入口。</p></div>
        </div>
        <div class="action-editor-grid">
          <div class="action-editor">
            <strong>合作申请按钮</strong>
            <t-input v-model="editor.primaryAction.text" placeholder="按钮文字" />
            <t-input
              v-if="editor.pageType === 'cooperation'"
              value="复制最后一个板块的正文"
              disabled
            />
            <t-select
              v-else
              v-model="editor.primaryAction.url"
              :options="applicationOptions"
              placeholder="选择关联表单"
            />
          </div>
          <div class="action-editor">
            <strong>辅助按钮</strong>
            <t-input v-model="editor.secondaryAction.text" placeholder="按钮文字，可不填" />
            <t-input v-model="editor.secondaryAction.url" placeholder="小程序页面路径，可不填" />
            <label class="action-tab"><t-switch v-model="editor.secondaryAction.tab" />跳转到底部导航页</label>
          </div>
        </div>
      </section>

      <div class="dialog-actions sticky-dialog-actions">
        <t-button variant="outline" @click="dialogVisible = false">取消</t-button>
        <t-button variant="outline" :loading="saving" @click="persist(false)">
          <template #icon><SaveIcon /></template>
          保存
        </t-button>
        <t-button theme="primary" :loading="saving" @click="persist(true)">
          <template #icon><RocketIcon /></template>
          保存并发布
        </t-button>
      </div>
    </div>
  </t-dialog>
</template>
