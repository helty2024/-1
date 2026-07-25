<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { AddIcon, DeleteIcon, EditIcon, RefreshIcon, SaveIcon } from 'tdesign-icons-vue-next'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import { resolveApiError } from '../api/client'
import MediaImageField from '../components/MediaImageField.vue'
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  updateProductStatus,
  type Product,
  type ProductEvidence,
  type ProductStatus,
  type SaveProductPayload,
} from '../api/products'

interface ProductEditor extends SaveProductPayload {
  id: string
  status: ProductStatus
  version: number
}

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const products = ref<Product[]>([])
const editor = reactive<ProductEditor>(emptyEditor())

function emptyEvidence(): ProductEvidence {
  return { title: '产品力四证据', intro: '', image: '', items: [] }
}

function emptyEditor(): ProductEditor {
  return {
    id: '',
    slug: '',
    categoryCode: '',
    name: '',
    shortName: '',
    subtitle: '',
    category: '',
    position: '',
    people: '',
    channels: '',
    role: '',
    listNote: '',
    listScene: '',
    coverImage: '',
    images: { main: '', detail: '', scene: '', material: '', other: '' },
    sellingPoints: [],
    evidence: null,
    material: '',
    craft: '',
    specs: [],
    scenarios: [],
    agencyValue: [],
    compliance: '',
    sortOrder: 0,
    status: 'draft',
    version: 1,
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function replaceEditor(value: ProductEditor) {
  Object.assign(editor, value)
}

async function load() {
  loading.value = true
  try {
    products.value = await listProducts()
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

function editProduct(product: Product) {
  const { id, status, version, publishedAt: _publishedAt, updatedAt: _updatedAt, ...payload } =
    clone(product)
  replaceEditor({
    ...payload,
    id,
    status,
    version,
    evidence: product.evidence ? clone(product.evidence) : null,
  })
  dialogVisible.value = true
}

function addTextItem(items: string[]) {
  items.push('')
}

function removeAt<T>(items: T[], index: number) {
  items.splice(index, 1)
}

function toggleEvidence(enabled: boolean) {
  editor.evidence = enabled ? emptyEvidence() : null
}

function validateEditor() {
  if (!editor.slug || !editor.categoryCode || !editor.name || !editor.shortName) {
    return '请完整填写产品编码、分类编码、产品名称和产品简称'
  }
  if (!editor.role || !editor.listNote || !editor.coverImage) {
    return '请完整填写列表定位、列表简介和列表封面图路径'
  }
  if (editor.sellingPoints.some((item) => !item.trim())) return '核心卖点中存在空白内容'
  if (editor.scenarios.some((item) => !item.trim())) return '使用场景中存在空白内容'
  if (editor.agencyValue.some((item) => !item.trim())) return '招商价值中存在空白内容'
  if (editor.specs.some((item) => !item.label.trim() || !item.value.trim())) {
    return '产品规格的名称和值需要同时填写'
  }
  if (
    editor.evidence &&
    (!editor.evidence.title ||
      editor.evidence.items.some((item) => !item.no || !item.title || !item.desc))
  ) {
    return '请完整填写产品专属证据板块'
  }
  return ''
}

async function save() {
  const validationMessage = validateEditor()
  if (validationMessage) {
    await MessagePlugin.warning(validationMessage)
    return
  }

  const { id, status, version, ...payload } = clone(editor)
  saving.value = true
  try {
    if (id) await updateProduct(id, payload)
    else await createProduct(payload)
    dialogVisible.value = false
    await MessagePlugin.success(id ? '产品已保存' : '产品草稿已创建')
    await load()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    saving.value = false
  }
}

async function changeStatus(product: Product, status: ProductStatus) {
  try {
    await updateProductStatus(product.id, status)
    await MessagePlugin.success(status === 'published' ? '产品已发布' : '产品已下线')
    await load()
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  }
}

function confirmDelete(product: Product) {
  const dialog = DialogPlugin.confirm({
    header: '删除产品',
    body: `确认删除“${product.name}”吗？`,
    confirmBtn: '删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        await deleteProduct(product.id)
        dialog.destroy()
        await MessagePlugin.success('产品已删除')
        await load()
      } catch (error) {
        await MessagePlugin.error(resolveApiError(error))
      }
    },
  })
}

function statusLabel(status: ProductStatus) {
  if (status === 'published') return '已发布'
  if (status === 'offline') return '已下线'
  return '草稿'
}

function statusTheme(status: ProductStatus) {
  if (status === 'published') return 'success'
  if (status === 'offline') return 'danger'
  return 'warning'
}

function remotePreview(path: string) {
  return /^https?:\/\//.test(path) ? path : ''
}

onMounted(load)
</script>

<template>
  <section class="business-page product-page-admin">
    <div class="module-toolbar">
      <div>
        <span class="section-kicker">PRODUCT MANAGEMENT</span>
        <h2>产品管理</h2>
        <p>维护明星产品列表、产品详情、招商价值及产品专属内容板块。</p>
      </div>
      <div class="toolbar-actions">
        <t-button variant="outline" :loading="loading" @click="load">
          <template #icon><RefreshIcon /></template>
          刷新
        </t-button>
        <t-button theme="primary" @click="createNew">
          <template #icon><AddIcon /></template>
          新建产品
        </t-button>
      </div>
    </div>

    <div class="data-table-wrap" :class="{ 'is-loading': loading }">
      <table class="data-table">
        <thead>
          <tr>
            <th>产品</th>
            <th>列表定位</th>
            <th>分类</th>
            <th>排序</th>
            <th>状态</th>
            <th>版本</th>
            <th>更新时间</th>
            <th class="product-actions-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>
              <div class="product-table-name">
                <img v-if="remotePreview(product.coverImage)" :src="remotePreview(product.coverImage)" alt="" />
                <span v-else class="product-thumb-fallback">{{ product.shortName.slice(0, 1) }}</span>
                <div><strong>{{ product.name }}</strong><small>{{ product.slug }} · {{ product.shortName }}</small></div>
              </div>
            </td>
            <td>{{ product.role }}</td>
            <td>{{ product.categoryCode }}</td>
            <td>{{ product.sortOrder }}</td>
            <td><t-tag :theme="statusTheme(product.status)">{{ statusLabel(product.status) }}</t-tag></td>
            <td>V{{ product.version }}</td>
            <td>{{ new Date(product.updatedAt).toLocaleString() }}</td>
            <td>
              <div class="row-actions">
                <t-button size="small" variant="text" @click="editProduct(product)">
                  <template #icon><EditIcon /></template>
                  编辑
                </t-button>
                <t-button
                  v-if="product.status !== 'published'"
                  size="small"
                  variant="text"
                  theme="success"
                  @click="changeStatus(product, 'published')"
                >发布</t-button>
                <t-button
                  v-else
                  size="small"
                  variant="text"
                  theme="warning"
                  @click="changeStatus(product, 'offline')"
                >下线</t-button>
                <t-tooltip content="删除产品">
                  <t-button aria-label="删除产品" shape="square" variant="text" theme="danger" @click="confirmDelete(product)">
                    <DeleteIcon />
                  </t-button>
                </t-tooltip>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !products.length">
            <td colspan="8" class="empty-cell">暂无产品，请先新建产品。</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <t-dialog
    v-model:visible="dialogVisible"
    :header="editor.id ? `编辑产品 · V${editor.version}` : '新建产品'"
    width="min(1180px, calc(100vw - 48px))"
    :close-on-overlay-click="false"
    :footer="false"
  >
    <div class="content-editor product-editor">
      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>基础信息</h3><p>用于产品列表、详情页首屏和后台识别。</p></div>
        </div>
        <div class="form-editor-grid">
          <t-form-item label="产品编码"><t-input v-model="editor.slug" placeholder="例如 premium-wild-ginseng" /></t-form-item>
          <t-form-item label="分类编码"><t-input v-model="editor.categoryCode" placeholder="例如 ginseng-gift" /></t-form-item>
          <t-form-item label="产品名称"><t-input v-model="editor.name" /></t-form-item>
          <t-form-item label="产品简称"><t-input v-model="editor.shortName" /></t-form-item>
          <t-form-item label="产品副标题" class="span-2"><t-textarea v-model="editor.subtitle" :autosize="{ minRows: 2, maxRows: 4 }" /></t-form-item>
          <t-form-item label="详情页分类说明" class="span-2"><t-input v-model="editor.category" /></t-form-item>
          <t-form-item label="招商定位" class="span-2"><t-textarea v-model="editor.position" :autosize="{ minRows: 2, maxRows: 5 }" /></t-form-item>
          <t-form-item label="适用人群" class="span-2"><t-textarea v-model="editor.people" :autosize="{ minRows: 2, maxRows: 5 }" /></t-form-item>
          <t-form-item label="适配渠道" class="span-2"><t-textarea v-model="editor.channels" :autosize="{ minRows: 2, maxRows: 5 }" /></t-form-item>
          <t-form-item label="后台排序"><t-input-number v-model="editor.sortOrder" :min="0" :max="9999" /></t-form-item>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>产品列表卡片</h3><p>控制小程序产品列表上的短文案和封面图。</p></div>
        </div>
        <div class="form-editor-grid">
          <t-form-item label="产品定位"><t-input v-model="editor.role" placeholder="例如 高客单礼盒款" /></t-form-item>
          <t-form-item label="列表封面图"><MediaImageField v-model="editor.coverImage" /></t-form-item>
          <t-form-item label="列表简介" class="span-2"><t-textarea v-model="editor.listNote" :autosize="{ minRows: 2, maxRows: 4 }" /></t-form-item>
          <t-form-item label="列表适用场景" class="span-2"><t-input v-model="editor.listScene" /></t-form-item>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>详情页图片</h3><p>依次维护首图、详情图、场景图、原料图和补充图。</p></div>
        </div>
        <div class="form-editor-grid image-path-grid">
          <t-form-item label="详情首图"><MediaImageField v-model="editor.images.main" /></t-form-item>
          <t-form-item label="产品详情图"><MediaImageField v-model="editor.images.detail" /></t-form-item>
          <t-form-item label="使用场景图"><MediaImageField v-model="editor.images.scene" /></t-form-item>
          <t-form-item label="原料工艺图"><MediaImageField v-model="editor.images.material" /></t-form-item>
          <t-form-item label="补充图片" class="span-2"><MediaImageField v-model="editor.images.other" /></t-form-item>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>核心卖点</h3><p>每行一项，按当前顺序展示。</p></div>
          <t-button variant="outline" size="small" @click="addTextItem(editor.sellingPoints)"><template #icon><AddIcon /></template>添加卖点</t-button>
        </div>
        <div class="compact-editor-list">
          <div v-for="(_item, index) in editor.sellingPoints" :key="index" class="compact-editor-row product-text-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="editor.sellingPoints[index]" placeholder="产品核心卖点" />
              <t-button aria-label="删除产品卖点" shape="square" variant="text" theme="danger" @click="removeAt(editor.sellingPoints, index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>原料与工艺</h3><p>分别说明产品原料基础和加工工艺。</p></div>
        </div>
        <div class="split-text-editor">
          <t-form-item label="原料说明"><t-textarea v-model="editor.material" :autosize="{ minRows: 4, maxRows: 8 }" /></t-form-item>
          <t-form-item label="工艺说明"><t-textarea v-model="editor.craft" :autosize="{ minRows: 4, maxRows: 8 }" /></t-form-item>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>产品规格</h3><p>维护规格名称及对应内容。</p></div>
          <t-button variant="outline" size="small" @click="editor.specs.push({ label: '', value: '' })"><template #icon><AddIcon /></template>添加规格</t-button>
        </div>
        <div class="compact-editor-list">
          <div v-for="(item, index) in editor.specs" :key="index" class="compact-editor-row product-spec-row">
            <span class="field-index">{{ index + 1 }}</span>
            <t-input v-model="item.label" placeholder="规格名称" />
            <t-input v-model="item.value" placeholder="规格内容" />
              <t-button aria-label="删除规格" shape="square" variant="text" theme="danger" @click="removeAt(editor.specs, index)"><DeleteIcon /></t-button>
          </div>
        </div>
      </section>

      <section class="editor-group two-column-editor-groups">
        <div class="product-array-editor">
          <div class="editor-group-head">
            <div><h3>使用场景</h3><p>产品适合出现的消费与销售场景。</p></div>
            <t-button variant="outline" size="small" @click="addTextItem(editor.scenarios)"><AddIcon /></t-button>
          </div>
          <div class="compact-editor-list">
            <div v-for="(_item, index) in editor.scenarios" :key="index" class="compact-editor-row product-text-row">
              <span class="field-index">{{ index + 1 }}</span>
              <t-input v-model="editor.scenarios[index]" />
              <t-button aria-label="删除使用场景" shape="square" variant="text" theme="danger" @click="removeAt(editor.scenarios, index)"><DeleteIcon /></t-button>
            </div>
          </div>
        </div>
        <div class="product-array-editor">
          <div class="editor-group-head">
            <div><h3>招商价值</h3><p>面向代理商和渠道商的合作价值。</p></div>
            <t-button variant="outline" size="small" @click="addTextItem(editor.agencyValue)"><AddIcon /></t-button>
          </div>
          <div class="compact-editor-list">
            <div v-for="(_item, index) in editor.agencyValue" :key="index" class="compact-editor-row product-text-row">
              <span class="field-index">{{ index + 1 }}</span>
              <t-input v-model="editor.agencyValue[index]" />
              <t-button aria-label="删除招商价值" shape="square" variant="text" theme="danger" @click="removeAt(editor.agencyValue, index)"><DeleteIcon /></t-button>
            </div>
          </div>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head">
          <div><h3>产品专属证据板块</h3><p>只在当前产品需要额外证明内容时启用。</p></div>
          <t-switch :value="Boolean(editor.evidence)" @change="toggleEvidence(Boolean($event))" />
        </div>
        <div v-if="editor.evidence" class="evidence-editor">
          <div class="form-editor-grid">
            <t-form-item label="板块标题"><t-input v-model="editor.evidence.title" /></t-form-item>
            <t-form-item label="板块图片"><MediaImageField v-model="editor.evidence.image" /></t-form-item>
            <t-form-item label="板块简介" class="span-2"><t-textarea v-model="editor.evidence.intro" :autosize="{ minRows: 2, maxRows: 5 }" /></t-form-item>
          </div>
          <div class="sub-editor-head">
            <span>证据内容</span>
            <t-button variant="text" size="small" @click="editor.evidence.items.push({ no: '', title: '', desc: '' })"><template #icon><AddIcon /></template>添加证据</t-button>
          </div>
          <div class="compact-editor-list">
            <div v-for="(item, index) in editor.evidence.items" :key="index" class="compact-editor-row evidence-item-row">
              <t-input v-model="item.no" placeholder="序号" />
              <t-input v-model="item.title" placeholder="标题" />
              <t-input v-model="item.desc" placeholder="说明" />
                  <t-button aria-label="删除产品证据" shape="square" variant="text" theme="danger" @click="removeAt(editor.evidence.items, index)"><DeleteIcon /></t-button>
            </div>
          </div>
        </div>
      </section>

      <section class="editor-group">
        <div class="editor-group-head"><div><h3>合规说明</h3><p>限制宣传边界，避免产品文案出现违规功效表达。</p></div></div>
        <t-textarea v-model="editor.compliance" :autosize="{ minRows: 3, maxRows: 8 }" />
      </section>

      <div class="dialog-actions sticky-dialog-actions">
        <t-button variant="outline" @click="dialogVisible = false">取消</t-button>
        <t-button theme="primary" :loading="saving" @click="save">
          <template #icon><SaveIcon /></template>
          保存产品
        </t-button>
      </div>
    </div>
  </t-dialog>
</template>
