<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  BrowseIcon,
  CopyIcon,
  DeleteIcon,
  EditIcon,
  FileIcon,
  RefreshIcon,
  UploadIcon,
} from 'tdesign-icons-vue-next'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import { resolveApiError } from '../api/client'
import {
  deleteMediaAsset,
  listMediaAssets,
  updateMediaAsset,
  uploadMediaAsset,
  type MediaAsset,
  type MediaKind,
} from '../api/media'

const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const fileInput = ref<HTMLInputElement>()
const assets = ref<MediaAsset[]>([])
const kind = ref<MediaKind>('all')
const search = ref('')
const editVisible = ref(false)
const editingAsset = ref<MediaAsset | null>(null)
const editingAltText = ref('')

const kindOptions = [
  { label: '全部资料', value: 'all' },
  { label: '图片', value: 'image' },
  { label: 'PDF 文件', value: 'document' },
]

async function load() {
  loading.value = true
  try {
    assets.value = await listMediaAssets(kind.value, search.value.trim())
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    loading.value = false
  }
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
    await uploadMediaAsset(file, (percent) => {
      uploadProgress.value = percent
    })
    await MessagePlugin.success('文件上传成功')
    await load()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

async function copyUrl(asset: MediaAsset) {
  try {
    await navigator.clipboard.writeText(asset.url)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = asset.url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
  await MessagePlugin.success('文件地址已复制')
}

function editAsset(asset: MediaAsset) {
  editingAsset.value = asset
  editingAltText.value = asset.altText ?? ''
  editVisible.value = true
}

async function saveMetadata() {
  if (!editingAsset.value) return
  try {
    await updateMediaAsset(editingAsset.value.id, editingAltText.value.trim())
    editVisible.value = false
    await MessagePlugin.success('文件说明已保存')
    await load()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  }
}

function confirmDelete(asset: MediaAsset) {
  const dialog = DialogPlugin.confirm({
    header: '删除媒体资料',
    body: `确认从资料库移除“${asset.originalName}”吗？已复制使用的文件地址暂时仍可访问。`,
    confirmBtn: '删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        await deleteMediaAsset(asset.id)
        dialog.destroy()
        await MessagePlugin.success('媒体资料已移除')
        await load()
      } catch (error) {
        await MessagePlugin.error(resolveApiError(error))
      }
    },
  })
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

onMounted(load)
</script>

<template>
  <section class="business-page media-page-admin">
    <div class="module-toolbar">
      <div>
        <span class="section-kicker">MEDIA LIBRARY</span>
        <h2>媒体管理</h2>
        <p>统一管理产品图片、证书、报告和展示资料。</p>
      </div>
      <div class="toolbar-actions">
        <input
          ref="fileInput"
          class="visually-hidden-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          @change="onFileSelected"
        />
        <t-button variant="outline" :loading="loading" @click="load">
          <template #icon><RefreshIcon /></template>
          刷新
        </t-button>
        <t-tooltip content="支持 JPG、PNG、WebP、GIF、PDF，单文件不超过 20MB">
          <t-button theme="primary" :loading="uploading" @click="chooseFile">
            <template #icon><UploadIcon /></template>
            {{ uploading ? `上传中 ${uploadProgress}%` : '上传资料' }}
          </t-button>
        </t-tooltip>
      </div>
    </div>

    <div class="media-filter-bar">
      <t-select v-model="kind" :options="kindOptions" @change="load" />
      <t-input v-model="search" clearable placeholder="搜索文件名或说明" @enter="load" />
      <t-button variant="outline" @click="load">查询</t-button>
      <span>共 {{ assets.length }} 项</span>
    </div>

    <div class="data-table-wrap" :class="{ 'is-loading': loading }">
      <table class="data-table media-table">
        <thead>
          <tr>
            <th>预览</th>
            <th>文件</th>
            <th>类型</th>
            <th>大小</th>
            <th>说明</th>
            <th>上传时间</th>
            <th class="media-actions-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in assets" :key="asset.id">
            <td>
              <a class="media-preview" :href="asset.url" target="_blank" rel="noopener">
                <img v-if="asset.isImage" :src="asset.url" :alt="asset.altText || asset.originalName" />
                <FileIcon v-else />
              </a>
            </td>
            <td><strong>{{ asset.originalName }}</strong><small>{{ asset.objectKey }}</small></td>
            <td><t-tag variant="light">{{ asset.extension?.toUpperCase() || asset.mimeType }}</t-tag></td>
            <td>{{ formatSize(asset.sizeBytes) }}</td>
            <td>{{ asset.altText || '未填写' }}</td>
            <td>{{ new Date(asset.createdAt).toLocaleString() }}</td>
            <td>
              <div class="row-actions">
                <t-tooltip content="打开文件">
                  <a :href="asset.url" target="_blank" rel="noopener">
                    <t-button aria-label="打开文件" shape="square" variant="text"><BrowseIcon /></t-button>
                  </a>
                </t-tooltip>
                <t-tooltip content="复制地址">
                  <t-button aria-label="复制地址" shape="square" variant="text" @click="copyUrl(asset)"><CopyIcon /></t-button>
                </t-tooltip>
                <t-tooltip content="编辑说明">
                  <t-button aria-label="编辑说明" shape="square" variant="text" @click="editAsset(asset)"><EditIcon /></t-button>
                </t-tooltip>
                <t-tooltip content="删除资料">
                  <t-button aria-label="删除资料" shape="square" variant="text" theme="danger" @click="confirmDelete(asset)"><DeleteIcon /></t-button>
                </t-tooltip>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !assets.length">
            <td colspan="7" class="empty-cell">暂无媒体资料。</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <t-dialog v-model:visible="editVisible" header="编辑文件说明" width="560px" :footer="false">
    <div class="media-metadata-editor">
      <t-form-item label="文件名称"><t-input :value="editingAsset?.originalName" disabled /></t-form-item>
      <t-form-item label="图片说明 / 替代文本">
        <t-textarea v-model="editingAltText" :autosize="{ minRows: 3, maxRows: 6 }" />
      </t-form-item>
      <div class="dialog-actions">
        <t-button variant="outline" @click="editVisible = false">取消</t-button>
        <t-button theme="primary" @click="saveMetadata">保存说明</t-button>
      </div>
    </div>
  </t-dialog>
</template>
