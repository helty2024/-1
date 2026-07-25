<script setup lang="ts">
import { computed, ref } from 'vue'
import { BrowseIcon, DeleteIcon, FileIcon, RefreshIcon, UploadIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
import { resolveApiError } from '../api/client'
import { listMediaAssets, uploadMediaAsset, type MediaAsset } from '../api/media'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  { placeholder: '可手动填写 PDF 地址，或从媒体库选择' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (nextValue: string) => emit('update:modelValue', nextValue),
})

const visible = ref(false)
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const search = ref('')
const assets = ref<MediaAsset[]>([])
const fileInput = ref<HTMLInputElement>()

async function load() {
  loading.value = true
  try {
    assets.value = await listMediaAssets('document', search.value.trim())
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    loading.value = false
  }
}

async function openPicker() {
  visible.value = true
  await load()
}

function chooseAsset(asset: MediaAsset) {
  value.value = asset.url
  visible.value = false
}

function chooseFile() {
  fileInput.value?.click()
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploading.value = true
  uploadProgress.value = 0
  try {
    const asset = await uploadMediaAsset(file, (percent) => {
      uploadProgress.value = percent
    })
    assets.value = [asset, ...assets.value.filter((item) => item.id !== asset.id)]
    chooseAsset(asset)
    await MessagePlugin.success('PDF 已上传并选用')
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

function formatSize(size: number) {
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <div class="media-file-field">
    <span class="media-file-field-icon"><FileIcon /></span>
    <div class="media-file-field-controls">
      <t-input v-model="value" clearable :placeholder="placeholder" />
      <div class="media-image-field-actions">
        <t-button variant="outline" @click="openPicker">
          <template #icon><BrowseIcon /></template>
          从媒体库选择 PDF
        </t-button>
        <t-tooltip v-if="value" content="清空附件">
          <t-button aria-label="清除文件" shape="square" variant="outline" theme="danger" @click="value = ''">
            <DeleteIcon />
          </t-button>
        </t-tooltip>
      </div>
    </div>
  </div>

  <t-dialog
    v-model:visible="visible"
    header="选择 PDF 资料"
    width="min(860px, calc(100vw - 48px))"
    :footer="false"
  >
    <div class="media-picker-dialog">
      <input
        ref="fileInput"
        class="visually-hidden-file"
        type="file"
        accept="application/pdf"
        @change="onFileSelected"
      />
      <div class="media-picker-toolbar">
        <t-input
          v-model="search"
          clearable
          placeholder="搜索 PDF 文件名或说明"
          @enter="load"
          @clear="load"
        />
        <t-tooltip content="刷新 PDF 列表">
          <t-button aria-label="刷新文件列表" shape="square" variant="outline" :loading="loading" @click="load">
            <RefreshIcon />
          </t-button>
        </t-tooltip>
        <t-button theme="primary" :loading="uploading" @click="chooseFile">
          <template #icon><UploadIcon /></template>
          {{ uploading ? `上传中 ${uploadProgress}%` : '上传 PDF' }}
        </t-button>
      </div>

      <div v-if="loading" class="media-picker-status">正在读取媒体库...</div>
      <div v-else-if="!assets.length" class="media-picker-status">
        暂无 PDF 资料，可直接上传。
      </div>
      <div v-else class="media-file-picker-list">
        <button
          v-for="asset in assets"
          :key="asset.id"
          type="button"
          class="media-file-picker-item"
          :class="{ 'is-selected': value === asset.url }"
          @click="chooseAsset(asset)"
        >
          <FileIcon />
          <span>
            <strong>{{ asset.originalName }}</strong>
            <small>{{ formatSize(asset.sizeBytes) }} · {{ asset.altText || '未填写说明' }}</small>
          </span>
        </button>
      </div>
    </div>
  </t-dialog>
</template>
