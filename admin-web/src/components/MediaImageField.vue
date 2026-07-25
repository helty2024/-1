<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BrowseIcon, DeleteIcon, RefreshIcon, UploadIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'
import { resolveApiError } from '../api/client'
import {
  listMediaAssets,
  uploadMediaAsset,
  type MediaAsset,
} from '../api/media'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  { placeholder: '可手动填写路径，或从媒体库选择' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const visible = ref(false)
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const search = ref('')
const assets = ref<MediaAsset[]>([])
const fileInput = ref<HTMLInputElement>()
const previewFailed = ref(false)

const value = computed({
  get: () => props.modelValue,
  set: (nextValue: string) => emit('update:modelValue', nextValue),
})

watch(
  () => props.modelValue,
  () => {
    previewFailed.value = false
  },
)

async function load() {
  loading.value = true
  try {
    assets.value = await listMediaAssets('image', search.value.trim())
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
    await MessagePlugin.success('图片已上传并选用')
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

function clearValue() {
  value.value = ''
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <div class="media-image-field">
    <div class="media-image-field-preview">
      <img
        v-if="value && !previewFailed"
        :src="value"
        alt="已选择图片预览"
        @error="previewFailed = true"
      />
      <span v-else>{{ value ? '当前路径无法在后台预览' : '未选择图片' }}</span>
    </div>
    <div class="media-image-field-controls">
      <t-input v-model="value" clearable :placeholder="placeholder" />
      <div class="media-image-field-actions">
        <t-button variant="outline" @click="openPicker">
          <template #icon><BrowseIcon /></template>
          从媒体库选择
        </t-button>
        <t-tooltip v-if="value" content="清空图片">
          <t-button aria-label="清除图片" shape="square" variant="outline" theme="danger" @click="clearValue">
            <DeleteIcon />
          </t-button>
        </t-tooltip>
      </div>
    </div>
  </div>

  <t-dialog
    v-model:visible="visible"
    header="选择媒体图片"
    width="min(960px, calc(100vw - 48px))"
    :footer="false"
  >
    <div class="media-picker-dialog">
      <input
        ref="fileInput"
        class="visually-hidden-file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        @change="onFileSelected"
      />
      <div class="media-picker-toolbar">
        <t-input
          v-model="search"
          clearable
          placeholder="搜索图片文件名或说明"
          @enter="load"
          @clear="load"
        />
        <t-tooltip content="刷新图片列表">
          <t-button aria-label="刷新图片列表" shape="square" variant="outline" :loading="loading" @click="load">
            <RefreshIcon />
          </t-button>
        </t-tooltip>
        <t-button theme="primary" :loading="uploading" @click="chooseFile">
          <template #icon><UploadIcon /></template>
          {{ uploading ? `上传中 ${uploadProgress}%` : '上传新图片' }}
        </t-button>
      </div>

      <div v-if="loading" class="media-picker-status">正在读取媒体库...</div>
      <div v-else-if="!assets.length" class="media-picker-status">
        暂无可选图片，可直接上传新图片。
      </div>
      <div v-else class="media-picker-grid">
        <button
          v-for="asset in assets"
          :key="asset.id"
          type="button"
          class="media-picker-item"
          :class="{ 'is-selected': value === asset.url }"
          @click="chooseAsset(asset)"
        >
          <img :src="asset.url" :alt="asset.altText || asset.originalName" />
          <span class="media-picker-item-name">{{ asset.originalName }}</span>
          <span class="media-picker-item-meta">
            {{ asset.extension?.toUpperCase() || 'IMAGE' }} · {{ formatSize(asset.sizeBytes) }}
          </span>
          <span v-if="asset.altText" class="media-picker-item-alt">{{ asset.altText }}</span>
        </button>
      </div>
    </div>
  </t-dialog>
</template>
