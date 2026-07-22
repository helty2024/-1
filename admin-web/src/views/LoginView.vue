<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LockOnIcon, UserIcon } from 'tdesign-icons-vue-next'
import { MessagePlugin, type FormProps } from 'tdesign-vue-next'
import { resolveApiError } from '../api/client'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const form = reactive({ username: 'admin', password: '' })
const rules: FormProps['rules'] = {
  username: [{ required: true, message: '请输入管理员账号' }],
  password: [{ required: true, message: '请输入密码' }],
}

async function submit() {
  if (!form.username || !form.password || loading.value) return
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    await MessagePlugin.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    await MessagePlugin.error(resolveApiError(error))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="login-brand">
        <span class="login-brand-mark">参</span>
        <div>
          <p>ZHONG KANG</p>
          <h1>中康参芝管理后台</h1>
        </div>
      </div>

      <t-form :data="form" :rules="rules" label-align="top" @submit="submit">
        <t-form-item label="管理员账号" name="username">
          <t-input v-model="form.username" size="large" placeholder="请输入管理员账号">
            <template #prefix-icon><UserIcon /></template>
          </t-input>
        </t-form-item>
        <t-form-item label="密码" name="password">
          <t-input
            v-model="form.password"
            size="large"
            type="password"
            placeholder="请输入密码"
            clearable
            @enter="submit"
          >
            <template #prefix-icon><LockOnIcon /></template>
          </t-input>
        </t-form-item>
        <t-button theme="primary" size="large" type="submit" block :loading="loading">
          登录
        </t-button>
      </t-form>
    </section>
  </main>
</template>
