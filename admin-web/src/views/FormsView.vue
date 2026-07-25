<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { AddIcon, DeleteIcon, EditIcon, RefreshIcon, SaveIcon } from 'tdesign-icons-vue-next'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import {
  createForm,
  deleteForm,
  listForms,
  updateForm,
  type FormFieldType,
  type LeadForm,
  type LeadType,
  type PublishStatus,
  type SaveLeadFormPayload,
} from '../api/forms'
import { resolveApiError } from '../api/client'

interface EditorField {
  clientKey: string
  fieldKey: string
  label: string
  fieldType: FormFieldType
  placeholder: string
  optionsText: string
  required: boolean
  isVisible: boolean
}

interface FormEditor {
  id: string
  code: string
  name: string
  leadType: LeadType
  title: string
  subtitle: string
  successMessage: string
  status: PublishStatus
  fields: EditorField[]
}

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const forms = ref<LeadForm[]>([])
const editor = reactive<FormEditor>(emptyEditor())

const leadTypeOptions = [
  { label: '代理申请', value: 'agent' },
  { label: '投资合作', value: 'investment' },
  { label: '普通咨询', value: 'consult' },
]
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已下线', value: 'offline' },
]
const fieldTypeOptions = [
  { label: '单行文本', value: 'text' },
  { label: '手机号', value: 'phone' },
  { label: '数字', value: 'number' },
  { label: '多行文本', value: 'textarea' },
  { label: '下拉选择', value: 'select' },
  { label: '单选', value: 'radio' },
  { label: '多选', value: 'checkbox' },
]

function newField(overrides: Partial<EditorField> = {}): EditorField {
  return {
    clientKey: `${Date.now()}-${Math.random()}`,
    fieldKey: '',
    label: '',
    fieldType: 'text',
    placeholder: '',
    optionsText: '',
    required: false,
    isVisible: true,
    ...overrides,
  }
}

function emptyEditor(): FormEditor {
  return {
    id: '',
    code: '',
    name: '',
    leadType: 'consult',
    title: '',
    subtitle: '',
    successMessage: '',
    status: 'draft',
    fields: [
      newField({ fieldKey: 'name', label: '姓名', placeholder: '请输入姓名', required: true }),
      newField({
        fieldKey: 'phone',
        label: '手机号',
        fieldType: 'phone',
        placeholder: '请输入手机号',
        required: true,
      }),
    ],
  }
}

function replaceEditor(next: FormEditor) {
  Object.assign(editor, next)
}

async function load() {
  loading.value = true
  try {
    forms.value = await listForms()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    loading.value = false
  }
}

function createNew() {
  replaceEditor(emptyEditor())
  dialogVisible.value = true
}

function editForm(form: LeadForm) {
  replaceEditor({
    id: form.id,
    code: form.code,
    name: form.name,
    leadType: form.leadType,
    title: form.title,
    subtitle: form.subtitle ?? '',
    successMessage: form.successMessage ?? '',
    status: form.status,
    fields: form.fields.map((field) =>
      newField({
        fieldKey: field.fieldKey,
        label: field.label,
        fieldType: field.fieldType,
        placeholder: field.placeholder ?? '',
        optionsText: field.options.join('\n'),
        required: field.required,
        isVisible: field.isVisible,
      }),
    ),
  })
  dialogVisible.value = true
}

function addField() {
  editor.fields.push(newField())
}

function removeField(index: number) {
  if (editor.fields.length === 1) {
    void MessagePlugin.warning('表单至少保留一个字段')
    return
  }
  editor.fields.splice(index, 1)
}

function validateEditor() {
  if (!editor.code || !editor.name || !editor.title) return '请完整填写表单编码、名称和标题'
  const emptyField = editor.fields.find((field) => !field.fieldKey || !field.label)
  if (emptyField) return '请完整填写每个字段的标识和名称'
  const keys = editor.fields.map((field) => field.fieldKey)
  if (new Set(keys).size !== keys.length) return '字段标识不能重复'
  return ''
}

async function save() {
  const errorMessage = validateEditor()
  if (errorMessage) {
    await MessagePlugin.warning(errorMessage)
    return
  }

  const payload: SaveLeadFormPayload = {
    code: editor.code.trim(),
    name: editor.name.trim(),
    leadType: editor.leadType,
    title: editor.title.trim(),
    subtitle: editor.subtitle.trim(),
    successMessage: editor.successMessage.trim(),
    status: editor.status,
    fields: editor.fields.map((field, index) => ({
      fieldKey: field.fieldKey.trim(),
      label: field.label.trim(),
      fieldType: field.fieldType,
      placeholder: field.placeholder.trim(),
      options: field.optionsText
        .split(/[,，\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
      required: field.required,
      validation: field.fieldType === 'phone' ? { pattern: '^1[3-9]\\d{9}$' } : {},
      sortOrder: index,
      isVisible: field.isVisible,
    })),
  }

  saving.value = true
  try {
    if (editor.id) await updateForm(editor.id, payload)
    else await createForm(payload)
    dialogVisible.value = false
    await MessagePlugin.success(editor.id ? '表单已更新' : '表单已创建')
    await load()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    saving.value = false
  }
}

function confirmDelete(form: LeadForm) {
  const dialog = DialogPlugin.confirm({
    header: '删除表单',
    body: `确认下线并删除“${form.name}”吗？历史线索不会被删除。`,
    confirmBtn: '删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        await deleteForm(form.id)
        dialog.destroy()
        await MessagePlugin.success('表单已删除')
        await load()
      } catch (error) {
        await MessagePlugin.error(resolveApiError(error))
      }
    },
  })
}

function statusLabel(status: PublishStatus) {
  return statusOptions.find((item) => item.value === status)?.label ?? status
}

function statusTheme(status: PublishStatus) {
  if (status === 'published') return 'success'
  if (status === 'offline') return 'danger'
  return 'warning'
}

onMounted(load)
</script>

<template>
  <section class="business-page">
    <div class="module-toolbar">
      <div>
        <span class="section-kicker">DYNAMIC FORMS</span>
        <h2>表单管理</h2>
        <p>维护小程序代理申请、投资合作和普通咨询的展示字段与发布状态。</p>
      </div>
      <div class="toolbar-actions">
        <t-button variant="outline" :loading="loading" @click="load">
          <template #icon><RefreshIcon /></template>
          刷新
        </t-button>
        <t-button theme="primary" @click="createNew">
          <template #icon><AddIcon /></template>
          新建表单
        </t-button>
      </div>
    </div>

    <div class="data-table-wrap" :class="{ 'is-loading': loading }">
      <table class="data-table">
        <thead>
          <tr>
            <th>表单</th>
            <th>类型</th>
            <th>字段数</th>
            <th>状态</th>
            <th>版本</th>
            <th>更新时间</th>
            <th class="actions-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="form in forms" :key="form.id">
            <td>
              <strong>{{ form.name }}</strong>
              <small>{{ form.code }} · {{ form.title }}</small>
            </td>
            <td>{{ leadTypeOptions.find((item) => item.value === form.leadType)?.label }}</td>
            <td>{{ form.fields.length }}</td>
            <td><t-tag :theme="statusTheme(form.status)">{{ statusLabel(form.status) }}</t-tag></td>
            <td>V{{ form.version }}</td>
            <td>{{ new Date(form.updatedAt).toLocaleString() }}</td>
            <td>
              <div class="row-actions">
                <t-tooltip content="编辑表单">
                  <t-button aria-label="编辑表单" shape="square" variant="text" @click="editForm(form)"><EditIcon /></t-button>
                </t-tooltip>
                <t-tooltip content="删除表单">
                  <t-button aria-label="删除表单" shape="square" variant="text" theme="danger" @click="confirmDelete(form)"><DeleteIcon /></t-button>
                </t-tooltip>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !forms.length">
            <td colspan="7" class="empty-cell">暂无表单，点击右上角新建。</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <t-dialog
    v-model:visible="dialogVisible"
    :header="editor.id ? '编辑动态表单' : '新建动态表单'"
    width="1040px"
    :close-on-overlay-click="false"
    :footer="false"
  >
    <div class="form-editor">
      <div class="form-editor-grid">
        <t-form-item label="表单编码">
          <t-input v-model="editor.code" placeholder="例如 agent" />
        </t-form-item>
        <t-form-item label="表单名称">
          <t-input v-model="editor.name" placeholder="例如 代理申请" />
        </t-form-item>
        <t-form-item label="线索类型">
          <t-select v-model="editor.leadType" :options="leadTypeOptions" />
        </t-form-item>
        <t-form-item label="发布状态">
          <t-select v-model="editor.status" :options="statusOptions" />
        </t-form-item>
        <t-form-item label="页面标题" class="span-2">
          <t-input v-model="editor.title" placeholder="小程序表单主标题" />
        </t-form-item>
        <t-form-item label="页面说明" class="span-2">
          <t-textarea v-model="editor.subtitle" :autosize="{ minRows: 2, maxRows: 4 }" />
        </t-form-item>
        <t-form-item label="提交成功提示" class="span-2">
          <t-input v-model="editor.successMessage" placeholder="申请已提交，我们会尽快联系你" />
        </t-form-item>
      </div>

      <div class="field-editor-head">
        <div>
          <h3>表单字段</h3>
          <p>选择类字段的选项可用逗号或换行分隔。</p>
        </div>
        <t-button variant="outline" @click="addField"><template #icon><AddIcon /></template>添加字段</t-button>
      </div>

      <div class="field-editor-list">
        <div v-for="(field, index) in editor.fields" :key="field.clientKey" class="field-editor-row">
          <span class="field-index">{{ index + 1 }}</span>
          <t-input v-model="field.fieldKey" placeholder="字段标识" />
          <t-input v-model="field.label" placeholder="字段名称" />
          <t-select v-model="field.fieldType" :options="fieldTypeOptions" />
          <t-input v-model="field.placeholder" placeholder="输入提示" />
          <t-input v-model="field.optionsText" placeholder="选项，逗号分隔" />
          <label class="switch-label"><t-switch v-model="field.required" />必填</label>
          <label class="switch-label"><t-switch v-model="field.isVisible" />显示</label>
          <t-tooltip content="删除字段">
            <t-button aria-label="删除字段" shape="square" variant="text" theme="danger" @click="removeField(index)"><DeleteIcon /></t-button>
          </t-tooltip>
        </div>
      </div>

      <div class="dialog-actions">
        <t-button variant="outline" @click="dialogVisible = false">取消</t-button>
        <t-button theme="primary" :loading="saving" @click="save">
          <template #icon><SaveIcon /></template>
          保存表单
        </t-button>
      </div>
    </div>
  </t-dialog>
</template>
